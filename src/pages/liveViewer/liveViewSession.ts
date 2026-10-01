/**
 * One live-view session: relay connection, emulation, screencast, input.
 *
 * Framework-free so the whole wire behavior is unit-testable with a fake
 * socket. `useLiveViewSession` wraps it for React.
 *
 * The viewer never clicks anything on its own. Every Input.* call here is the
 * direct result of the user's own touch or keystroke.
 */

import {
  CdpClient,
  type CdpClientStatus,
  type CdpTimers,
  type SocketFactory,
} from './cdpClient';
import {
  deviceMetricsForStage,
  screencastParamsForStage,
  type Point,
  type StageSize,
} from './coordinates';
import {keyEventsFor, type RemoteKey} from './keyMapping';
import type {
  LiveViewDriver,
  LiveViewTicket,
  PackClosedEvent,
  PackClosedReason,
  PackDriverEvent,
  PackFocusEvent,
  PackFocusRect,
  ScreencastFrameEvent,
  ScreencastFrameMetadata,
} from './types';

export interface LiveViewFrame {
  readonly uri: string;
  readonly metadata: ScreencastFrameMetadata;
  readonly receivedAtMs: number;
}

export interface LiveViewSessionState {
  readonly status: CdpClientStatus;
  readonly frame: LiveViewFrame | null;
  readonly driver: LiveViewDriver;
  readonly headline: string;
  readonly focus: PackFocusEvent | null;
  /** Latest `Pack.focusRects`. Empty until the relay sends some. */
  readonly focusRects: readonly PackFocusRect[];
  readonly closedReason: PackClosedReason | null;
  /** Last successful sign of life (frame or heartbeat). */
  readonly lastAliveAtMs: number;
  /** Most recent touchStart → next frame latency. */
  readonly lastTapToFrameMs: number | null;
}

export interface LiveViewSessionOptions {
  readonly ticket: LiveViewTicket;
  readonly installId: string;
  readonly driver: LiveViewDriver;
  readonly headline: string;
  /** Re-fetches the viewer for a fresh ticket before the current one expires. */
  readonly refreshTicket?: (() => Promise<LiveViewTicket>) | undefined;
  /** react-native-web cannot set upgrade headers: send Pack.hello instead. */
  readonly sendHello: boolean;
  readonly pixelRatio: number;
  readonly createSocket?: SocketFactory | undefined;
  readonly timers?: CdpTimers | undefined;
  readonly now?: (() => number) | undefined;
  readonly refreshLeadMs?: number | undefined;
}

export type TouchPhase = 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel';

const defaultTimers: CdpTimers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: handle =>
    clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function relayUrlWithTicket(relayUrl: string, ticket: string): string {
  const sep = relayUrl.includes('?') ? '&' : '?';
  return `${relayUrl}${sep}ticket=${encodeURIComponent(ticket)}`;
}

export class LiveViewSession {
  private readonly options: LiveViewSessionOptions;
  private readonly timers: CdpTimers;
  private readonly now: () => number;
  private ticket: LiveViewTicket;
  private client: CdpClient | null = null;
  private clientUnsubs: Array<() => void> = [];
  private stage: StageSize | null = null;
  private state: LiveViewSessionState;
  private readonly listeners = new Set<(s: LiveViewSessionState) => void>();
  private refreshTimer: unknown = null;
  /** Keeps a quiet open socket from looking frozen. No CDP call. */
  private aliveTimer: unknown = null;
  private pendingTapAtMs: number | null = null;
  private disposed = false;

  constructor(options: LiveViewSessionOptions) {
    this.options = options;
    this.timers = options.timers ?? defaultTimers;
    this.now = options.now ?? Date.now;
    this.ticket = options.ticket;
    this.state = {
      status: 'idle',
      frame: null,
      driver: options.driver,
      headline: options.headline,
      focus: null,
      focusRects: [],
      closedReason: null,
      lastAliveAtMs: this.now(),
      lastTapToFrameMs: null,
    };
  }

  getState(): LiveViewSessionState {
    return this.state;
  }

  subscribe(listener: (s: LiveViewSessionState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(): void {
    if (this.disposed || this.client) {
      return;
    }
    this.client = this.openClient();
    this.scheduleAlive();
    this.scheduleRefresh();
  }

  /** Viewer stage laid out or rotated: re-emulate at the new size. */
  setStage(stage: StageSize): void {
    const prev = this.stage;
    if (
      prev &&
      Math.round(prev.width) === Math.round(stage.width) &&
      Math.round(prev.height) === Math.round(stage.height)
    ) {
      return;
    }
    this.stage = stage;
    const client = this.client;
    if (client && client.getStatus() === 'open') {
      this.applyEmulation(client);
    }
  }

  touch(phase: TouchPhase, points: readonly Point[]): void {
    if (!this.canInput()) {
      return;
    }
    if (phase === 'touchStart') {
      this.pendingTapAtMs = this.now();
    }
    this.client?.notify('Input.dispatchTouchEvent', {
      type: phase,
      touchPoints:
        phase === 'touchEnd' || phase === 'touchCancel'
          ? []
          : points.map(p => ({x: p.x, y: p.y})),
    });
  }

  insertText(text: string): void {
    if (!this.canInput() || text.length === 0) {
      return;
    }
    this.client?.notify('Input.insertText', {text});
  }

  pressKey(key: RemoteKey): void {
    if (!this.canInput()) {
      return;
    }
    for (const params of keyEventsFor(key)) {
      this.client?.notify('Input.dispatchKeyEvent', params);
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    if (this.aliveTimer !== null) {
      this.timers.clearTimeout(this.aliveTimer);
      this.aliveTimer = null;
    }
    if (this.refreshTimer !== null) {
      this.timers.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    const client = this.client;
    this.client = null;
    if (client) {
      this.retireClient(client);
    }
    this.listeners.clear();
  }

  private canInput(): boolean {
    return (
      !this.disposed &&
      this.state.driver === 'user' &&
      this.state.closedReason === null &&
      this.client?.getStatus() === 'open'
    );
  }

  private openClient(): CdpClient {
    const client = new CdpClient({
      getEndpoint: () => ({
        url: relayUrlWithTicket(this.ticket.relayUrl, this.ticket.ticket),
        headers: {'X-Pack-Install-Id': this.options.installId},
        hello: this.options.sendHello
          ? {
              method: 'Pack.hello',
              params: {installId: this.options.installId},
            }
          : undefined,
      }),
      createSocket: this.options.createSocket,
      timers: this.timers,
    });
    this.clientUnsubs = [
      client.onStatus(status => {
        if (this.client === client) {
          this.patch({status});
        }
      }),
      client.onOpen(() => {
        if (this.client === client) {
          this.applyEmulation(client);
        }
      }),
      client.on('Page.screencastFrame', params =>
        this.onFrame(client, params as ScreencastFrameEvent),
      ),
      client.on('Pack.focus', params => {
        if (this.client === client) {
          this.patch({focus: params as PackFocusEvent});
        }
      }),
      client.on('Pack.focusRects', params => {
        if (this.client === client) {
          this.patch({focusRects: parseFocusRects(params)});
        }
      }),
      client.on('Pack.driver', params => {
        if (this.client !== client) {
          return;
        }
        const event = params as PackDriverEvent;
        this.patch({
          driver: event.driver,
          headline: event.headline,
          ...(event.driver === 'agent' ? {focus: null, focusRects: []} : {}),
        });
      }),
      client.on('Pack.closed', params => {
        if (this.client !== client) {
          return;
        }
        const event = params as PackClosedEvent;
        this.patch({closedReason: event.reason, focus: null, focusRects: []});
        client.close();
      }),
    ];
    client.connect();
    return client;
  }

  private applyEmulation(client: CdpClient): void {
    const stage = this.stage;
    if (!stage) {
      return;
    }
    const ratio = this.options.pixelRatio;
    // Allowlist only: metrics first, then the screencast. No stopScreencast,
    // no touch-emulation probe, no scroll-to-fit.
    client.notify(
      'Emulation.setDeviceMetricsOverride',
      deviceMetricsForStage(stage, ratio),
    );
    client.notify('Page.startScreencast', screencastParamsForStage(stage, ratio));
  }

  private onFrame(client: CdpClient, event: ScreencastFrameEvent): void {
    // Ack every frame, even from a client being swapped out, or Chrome stalls.
    client.notify('Page.screencastFrameAck', {sessionId: event.sessionId});
    if (this.client !== client) {
      return;
    }
    const at = this.now();
    const tapToFrame =
      this.pendingTapAtMs === null ? null : at - this.pendingTapAtMs;
    this.pendingTapAtMs = null;
    this.patch({
      frame: {
        uri: `data:image/jpeg;base64,${event.data}`,
        metadata: event.metadata,
        receivedAtMs: at,
      },
      lastAliveAtMs: at,
      ...(tapToFrame === null ? {} : {lastTapToFrameMs: tapToFrame}),
    });
  }

  private scheduleAlive(): void {
    this.aliveTimer = this.timers.setTimeout(() => {
      this.aliveTimer = null;
      if (this.disposed) {
        return;
      }
      if (this.client?.getStatus() === 'open') {
        this.patch({lastAliveAtMs: this.now()});
      }
      this.scheduleAlive();
    }, 2_500);
  }

  private scheduleRefresh(): void {
    const refresh = this.options.refreshTicket;
    if (!refresh || this.disposed) {
      return;
    }
    const lead = this.options.refreshLeadMs ?? 60_000;
    const delay = Math.max(
      5_000,
      this.ticket.ticketExpiresAtMs - lead - this.now(),
    );
    this.refreshTimer = this.timers.setTimeout(() => {
      this.refreshTimer = null;
      refresh()
        .then(next => {
          if (this.disposed || this.state.closedReason) {
            return;
          }
          this.ticket = next;
          this.swapClient();
          this.scheduleRefresh();
        })
        .catch(() => {
          // Keep the current connection; retry shortly.
          if (!this.disposed) {
            this.refreshTimer = this.timers.setTimeout(() => {
              this.refreshTimer = null;
              this.scheduleRefresh();
            }, 5_000);
          }
        });
    }, delay);
  }

  /** Open a connection on the fresh ticket, then retire the old one once live. */
  private swapClient(): void {
    const old = this.client;
    const oldUnsubs = this.clientUnsubs;
    const next = this.openClient();
    this.client = next;
    const unsubOpen = next.onOpen(() => {
      unsubOpen();
      if (old) {
        for (const unsub of oldUnsubs) {
          unsub();
        }
        this.retireClient(old);
      }
    });
  }

  private retireClient(client: CdpClient): void {
    client.close();
  }

  private patch(partial: Partial<LiveViewSessionState>): void {
    this.state = {...this.state, ...partial};
    for (const listener of [...this.listeners]) {
      listener(this.state);
    }
  }
}

function parseFocusRects(params: unknown): PackFocusRect[] {
  if (!params || typeof params !== 'object') {
    return [];
  }
  const raw = (params as {rects?: unknown}).rects;
  if (!Array.isArray(raw)) {
    return [];
  }
  const rects: PackFocusRect[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const rect = entry as Record<string, unknown>;
    const {x, y, width, height} = rect;
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      continue;
    }
    rects.push({x, y, width, height});
  }
  return rects;
}
