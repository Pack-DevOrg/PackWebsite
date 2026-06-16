// TypeScript mirror of the native derived view-model structs in
// `TripNextEventLiveActivity.swift` (MetricBox, StatusBarModel,
// LockScreenSurfaceModel, DynamicIslandSurfaceModel). These are the COMPUTED
// presentation models the lab consumes — every display token here is derived
// from a `ContentState` by the builders in `derivation.ts`.
//
// SwiftUI `Color` values become a small semantic union the lab maps to CSS.

import type { IconKey } from './helpers';

// Native `Color` emphasis values reduced to the semantic set the builders use.
// - white:     primary text (Color.white / .white default)
// - secondary: muted text (Color.secondary)
// - accent:    saffron #F0C62D (driveColor / hotelCheckInColor)
// - warning:   #FFAF48 (warningColor)
// - danger:    #FF4F66 (dangerColor)
// - success:   #4CD964 (successColor)
// - dark:      #121212 — emphasis on the highlighted leave-in pill, which the
//              native code paints with the dark background color so it reads on
//              the saffron-tinted highlight chip.
export type EmphasisColor =
  | 'white'
  | 'secondary'
  | 'accent'
  | 'warning'
  | 'danger'
  | 'success'
  | 'dark';

// Mirrors TripNextEventLiveActivity.MetricKind.
export type MetricKind =
  | 'leaveIn'
  | 'landsIn'
  | 'flight'
  | 'gate'
  | 'terminal'
  | 'seat'
  | 'tsa'
  | 'boarding'
  | 'checkIn'
  | 'hotel'
  | 'address'
  | 'venue'
  | 'arrival'
  | 'confirmation'
  | 'travel'
  | 'status'
  | 'baggage'
  | 'next'
  | 'unknown';

// Mirrors TripNextEventLiveActivity.MetricBox.
export interface MetricBox {
  kind: MetricKind;
  title: string;
  value: string;
  // When set, the native renderer shows a live self-counting countdown to this
  // date instead of the static `value` string.
  valueDate?: Date;
  detail?: string;
  emphasis: EmphasisColor;
  showsTitle: boolean;
  valueLineLimit: number;
  detailLineLimit: number;
}

export type StatusBarMode = 'travel' | 'duration';

// Mirrors TripNextEventLiveActivity.StatusBarModel (~line 144).
export interface StatusBarModel {
  mode: StatusBarMode;
  leadingText?: string;
  countdownToken: string;
  countdownCaption: string;
  progressFraction: number;
  reservedFraction: number;
  markerFraction: number;
  startLabel?: string;
  endLabel?: string;
  detailText?: string;
  countdownEmphasis: EmphasisColor;
  progressColor?: EmphasisColor;
  usesEndpointLabelStyleForEndText: boolean;
  countdownTargetAt?: Date;
  trackStartAt?: Date;
  warningStartAt?: Date;
  trackEndAt?: Date;
}

// Mirrors TripNextEventLiveActivity.LockScreenSurfaceModel (~line 233).
export interface LockScreenSurfaceModel {
  fullMetricLimit: number;
  midMetricLimit: number;
  compactMetricLimit: number;
  showNextInFull: boolean;
  showNextInMid: boolean;
  showStatusBarInCompact: boolean;
  compactTitleLineLimit: number;
}

// Mirrors TripNextEventLiveActivity.DynamicIslandSurfaceModel (~line 243).
// SF Symbol names are mapped to the lab's IconKey union by the builders.
export interface DynamicIslandModel {
  expandedLeadingText?: string;
  expandedText?: string;
  expandedTrailingText?: string;
  compactLeadingSymbolName?: IconKey;
  compactTrailingText?: string;
  minimalSymbolName?: IconKey;
  minimalText?: string;
  showsCountdown: boolean;
  countdownTargetAt?: Date;
}
