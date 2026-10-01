import React from 'react';
import {Platform} from 'react-native';

import type {SocketFactory} from './cdpClient';
import {LiveViewSession, type LiveViewSessionState} from './liveViewSession';
import type {LiveViewDriver, LiveViewTicket} from './types';

export interface UseLiveViewSessionArgs {
  readonly relayUrl: string;
  readonly ticket: string;
  readonly ticketExpiresAtMs: number;
  readonly installId: string;
  readonly driver: LiveViewDriver;
  readonly headline: string;
  readonly pixelRatio: number;
  readonly refreshTicket?: (() => Promise<LiveViewTicket>) | undefined;
  readonly createSocket?: SocketFactory | undefined;
}

/**
 * Owns one LiveViewSession for the mounted viewer. A new relay URL or ticket
 * from the parent does not reconnect: ticket refresh is the session's job.
 */
export function useLiveViewSession(args: UseLiveViewSessionArgs): {
  session: LiveViewSession;
  state: LiveViewSessionState;
} {
  const argsRef = React.useRef(args);
  argsRef.current = args;
  const [session] = React.useState(
    () =>
      new LiveViewSession({
        ticket: {
          relayUrl: args.relayUrl,
          ticket: args.ticket,
          ticketExpiresAtMs: args.ticketExpiresAtMs,
        },
        installId: args.installId,
        driver: args.driver,
        headline: args.headline,
        pixelRatio: args.pixelRatio,
        sendHello: Platform.OS === 'web',
        createSocket: args.createSocket,
        refreshTicket: () => {
          const refresh = argsRef.current.refreshTicket;
          return refresh
            ? refresh()
            : Promise.reject(new Error('no ticket refresh'));
        },
      }),
  );
  const [state, setState] = React.useState(() => session.getState());

  React.useEffect(() => {
    const unsubscribe = session.subscribe(setState);
    session.start();
    return () => {
      unsubscribe();
      session.dispose();
    };
  }, [session]);

  return {session, state};
}
