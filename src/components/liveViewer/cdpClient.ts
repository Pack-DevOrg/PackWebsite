/**
 * Typed CDP-shaped JSON-RPC client over a WebSocket.
 *
 * Speaks `{id, method, params}` to the Pack live-view relay (contract
 * REVISION 1). The relay owns target attach and sessionId, so this client
 * never sends one. Pure TS: the socket is injected, so it runs under React
 * Native, react-native-web, and Jest alike.
 *
 * Never logs the endpoint URL or ticket: both are credentials.
 */

export type CdpClientStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed';

/** The subset of the WHATWG / React Native WebSocket this client uses. */
export interface SocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((event: unknown) => void) | null;
  onmessage: ((event: {data: unknown}) => void) | null;
  onclose: ((event: {code?: number; reason?: string}) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export type SocketFactory = (
  url: string,
  headers: Readonly<Record<string, string>>,
) => SocketLike;

export interface CdpEndpoint {
  readonly url: string;
  /** Sent on the upgrade where the platform allows headers (React Native). */
  readonly headers?: Readonly<Record<string, string>> | undefined;
  /** Sent as the first message after open (react-native-web cannot set headers). */
  readonly hello?: {readonly method: string; readonly params: unknown} | undefined;
}

export interface CdpTimers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface CdpClientOptions {
  /** Called on every (re)connect so a refreshed ticket is picked up. */
  readonly getEndpoint: () => CdpEndpoint;
  readonly createSocket?: SocketFactory | undefined;
  readonly requestTimeoutMs?: number | undefined;
  readonly reconnect?:
    | {
        readonly initialDelayMs?: number | undefined;
        readonly maxDelayMs?: number | undefined;
        readonly maxAttempts?: number | undefined;
      }
    | undefined;
  readonly timers?: CdpTimers | undefined;
}

export class CdpRequestError extends Error {
  readonly code: number;
  readonly method: string;
  constructor(method: string, code: number, message: string) {
    super(`${method} failed (${code}): ${message}`);
    this.name = 'CdpRequestError';
    this.code = code;
    this.method = method;
  }
}

export class CdpTimeoutError extends Error {
  readonly method: string;
  constructor(method: string, ms: number) {
    super(`${method} timed out after ${ms} ms`);
    this.name = 'CdpTimeoutError';
    this.method = method;
  }
}

export class CdpNotConnectedError extends Error {
  readonly method: string;
  constructor(method: string) {
    super(`${method}: live view is not connected`);
    this.name = 'CdpNotConnectedError';
    this.method = method;
  }
}

type EventHandler = (params: unknown) => void;

interface Pending {
  readonly method: string;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly timer: unknown;
}

const OPEN = 1;

const defaultTimers: CdpTimers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: handle =>
    clearTimeout(handle as ReturnType<typeof setTimeout>),
};

const defaultCreateSocket: SocketFactory = (url, headers) => {
  const Ctor = WebSocket as unknown as new (
    url: string,
    protocols?: string | string[] | null,
    options?: {headers: Record<string, string>},
  ) => SocketLike;
  // React Native accepts a third options arg with headers; browsers ignore it.
  return new Ctor(url, null, {headers: {...headers}});
};

/** Exponential backoff: initial * 2^attempt, capped. attempt is 0-based. */
export function backoffDelayMs(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
): number {
  return Math.min(maxDelayMs, initialDelayMs * 2 ** attempt);
}

export class CdpClient {
  private readonly options: CdpClientOptions;
  private readonly timers: CdpTimers;
  private readonly createSocket: SocketFactory;
  private socket: SocketLike | null = null;
  private status: CdpClientStatus = 'idle';
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private readonly eventHandlers = new Map<string, Set<EventHandler>>();
  private readonly statusHandlers = new Set<(s: CdpClientStatus) => void>();
  private readonly openHandlers = new Set<() => void>();
  private reconnectAttempt = 0;
  private reconnectTimer: unknown = null;
  private closedByUser = false;

  constructor(options: CdpClientOptions) {
    this.options = options;
    this.timers = options.timers ?? defaultTimers;
    this.createSocket = options.createSocket ?? defaultCreateSocket;
  }

  getStatus(): CdpClientStatus {
    return this.status;
  }

  connect(): void {
    if (this.closedByUser || this.socket) {
      return;
    }
    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    const endpoint = this.options.getEndpoint();
    const socket = this.createSocket(endpoint.url, endpoint.headers ?? {});
    this.socket = socket;
    socket.onopen = () => {
      if (this.socket !== socket) {
        return;
      }
      if (endpoint.hello) {
        socket.send(
          JSON.stringify({
            method: endpoint.hello.method,
            params: endpoint.hello.params,
          }),
        );
      }
      this.reconnectAttempt = 0;
      this.setStatus('open');
      for (const handler of [...this.openHandlers]) {
        handler();
      }
    };
    socket.onmessage = event => {
      if (this.socket === socket) {
        this.handleMessage(event.data);
      }
    };
    socket.onerror = () => {
      // onclose follows; reconnect is decided there.
    };
    socket.onclose = () => {
      if (this.socket !== socket) {
        return;
      }
      this.socket = null;
      this.rejectAll(method => new CdpNotConnectedError(method));
      this.scheduleReconnect();
    };
  }

  /** Stops reconnecting, closes the socket, rejects in-flight requests. */
  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer !== null) {
      this.timers.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const socket = this.socket;
    this.socket = null;
    this.rejectAll(method => new CdpNotConnectedError(method));
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close(1000, 'viewer closed');
    }
    this.setStatus('closed');
  }

  send<T = unknown>(method: string, params: object = {}): Promise<T> {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN || this.status !== 'open') {
      return Promise.reject(new CdpNotConnectedError(method));
    }
    const id = this.nextId++;
    const timeoutMs = this.options.requestTimeoutMs ?? 10_000;
    return new Promise<T>((resolve, reject) => {
      const timer = this.timers.setTimeout(() => {
        if (this.pending.delete(id)) {
          reject(new CdpTimeoutError(method, timeoutMs));
        }
      }, timeoutMs);
      this.pending.set(id, {
        method,
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });
      socket.send(JSON.stringify({id, method, params}));
    });
  }

  /** Fire-and-forget (frame acks, touch moves). Dropped when not open. */
  notify(method: string, params: object = {}): void {
    this.send(method, params).catch(() => undefined);
  }

  on(method: string, handler: EventHandler): () => void {
    let set = this.eventHandlers.get(method);
    if (!set) {
      set = new Set();
      this.eventHandlers.set(method, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }

  onStatus(handler: (status: CdpClientStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /** Runs on every successful (re)open: re-apply emulation + screencast here. */
  onOpen(handler: () => void): () => void {
    this.openHandlers.add(handler);
    return () => {
      this.openHandlers.delete(handler);
    };
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== 'string') {
      return;
    }
    let message: {
      id?: number;
      method?: string;
      params?: unknown;
      result?: unknown;
      error?: {code?: number; message?: string};
    };
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    if (typeof message.id === 'number') {
      const entry = this.pending.get(message.id);
      if (!entry) {
        return;
      }
      this.pending.delete(message.id);
      this.timers.clearTimeout(entry.timer);
      if (message.error) {
        entry.reject(
          new CdpRequestError(
            entry.method,
            message.error.code ?? -1,
            message.error.message ?? 'error',
          ),
        );
      } else {
        entry.resolve(message.result ?? {});
      }
      return;
    }
    if (typeof message.method === 'string') {
      const handlers = this.eventHandlers.get(message.method);
      if (handlers) {
        for (const handler of [...handlers]) {
          handler(message.params ?? {});
        }
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.closedByUser) {
      return;
    }
    const cfg = this.options.reconnect ?? {};
    const maxAttempts = cfg.maxAttempts ?? 8;
    if (this.reconnectAttempt >= maxAttempts) {
      this.setStatus('closed');
      return;
    }
    const delay = backoffDelayMs(
      this.reconnectAttempt,
      cfg.initialDelayMs ?? 250,
      cfg.maxDelayMs ?? 5_000,
    );
    this.reconnectAttempt += 1;
    this.setStatus('reconnecting');
    this.reconnectTimer = this.timers.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private rejectAll(makeError: (method: string) => Error): void {
    for (const [id, entry] of this.pending) {
      this.pending.delete(id);
      this.timers.clearTimeout(entry.timer);
      entry.reject(makeError(entry.method));
    }
  }

  private setStatus(status: CdpClientStatus): void {
    if (this.status === status) {
      return;
    }
    this.status = status;
    for (const handler of [...this.statusHandlers]) {
      handler(status);
    }
  }
}
