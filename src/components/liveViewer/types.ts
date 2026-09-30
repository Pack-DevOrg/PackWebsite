/**
 * Live viewer wire types.
 *
 * Mirrors `LiveViewViewerSchema` (contract REVISION 1) until the server agent
 * vendors it through `@pack/schemas`. The phone never holds a raw CDP
 * endpoint: it talks to the Pack live-view relay with a short-lived ticket.
 */

export type LiveViewDriver = 'agent' | 'user';

export interface LiveViewViewer {
  readonly jobId: string;
  readonly merchantHost: string;
  readonly expiresAtMs: number;
  readonly relayUrl: string;
  readonly ticket: string;
  readonly ticketExpiresAtMs: number;
  readonly driver: LiveViewDriver;
  readonly headline: string;
  readonly oneWayDoorLabel?: string | undefined;
}

/** The fields a ticket refresh must return (a fresh `GET /live-view/viewer`). */
export type LiveViewTicket = Pick<
  LiveViewViewer,
  'relayUrl' | 'ticket' | 'ticketExpiresAtMs'
>;

/** Relay event `Pack.focus`: computed server-side after each touchEnd/key. */
export interface PackFocusEvent {
  readonly editable: boolean;
  readonly inputType?: string | undefined;
  readonly autocomplete?: string | undefined;
  readonly isLogin: boolean;
  readonly isOtp: boolean;
}

/**
 * One editable control on the remote page, in CSS pixels.
 * `Pack.focusRects` is how the phone knows a tap should raise the keyboard
 * inside the same gesture (a later `Pack.focus` is too late for iOS).
 */
export interface PackFocusRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PackDriverEvent {
  readonly driver: LiveViewDriver;
  readonly headline: string;
}

export type PackClosedReason = 'expired' | 'completed' | 'upstream_gone';

export interface PackClosedEvent {
  readonly reason: PackClosedReason;
}

/** `Page.screencastFrame` metadata (CDP ScreencastFrameMetadata). */
export interface ScreencastFrameMetadata {
  readonly offsetTop: number;
  readonly pageScaleFactor: number;
  readonly deviceWidth: number;
  readonly deviceHeight: number;
  readonly scrollOffsetX: number;
  readonly scrollOffsetY: number;
  readonly timestamp?: number | undefined;
}

export interface ScreencastFrameEvent {
  readonly data: string;
  readonly metadata: ScreencastFrameMetadata;
  readonly sessionId: number;
}
