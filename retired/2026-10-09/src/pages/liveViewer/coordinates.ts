/**
 * Maps a touch on the viewer stage to remote page coordinates.
 *
 * The stage draws the latest screencast frame with `contain` fit, so the frame
 * may be letterboxed when the remote viewport has not caught up with a layout
 * change yet. `Input.dispatchTouchEvent` takes widget DIP (CSS px at page scale
 * 1). The frame image covers `deviceWidth x deviceHeight` DIP of the widget,
 * with `offsetTop` DIP of top chrome above the page (0 in headless). Pinch
 * zoom (`pageScaleFactor`) is already baked into the widget pixels, so it does
 * not change the mapping.
 */

import type {ScreencastFrameMetadata} from './types';

export interface StageSize {
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface FrameRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Stage px per remote DIP. */
  readonly scale: number;
}

type FrameGeometry = Pick<
  ScreencastFrameMetadata,
  'deviceWidth' | 'deviceHeight' | 'offsetTop'
>;

/** Where a `contain`-fit frame lands inside the stage. */
export function containedFrameRect(
  stage: StageSize,
  frame: FrameGeometry,
): FrameRect | null {
  const frameHeight = frame.deviceHeight + frame.offsetTop;
  if (
    stage.width <= 0 ||
    stage.height <= 0 ||
    frame.deviceWidth <= 0 ||
    frameHeight <= 0
  ) {
    return null;
  }
  const scale = Math.min(
    stage.width / frame.deviceWidth,
    stage.height / frameHeight,
  );
  const width = frame.deviceWidth * scale;
  const height = frameHeight * scale;
  return {
    x: (stage.width - width) / 2,
    y: (stage.height - height) / 2,
    width,
    height,
    scale,
  };
}

/**
 * Stage point → remote touch point, or null when the touch lands on the
 * letterbox or on the remote top chrome (never forward a guess).
 */
export function stagePointToRemote(
  point: Point,
  stage: StageSize,
  frame: FrameGeometry,
): Point | null {
  const rect = containedFrameRect(stage, frame);
  if (!rect) {
    return null;
  }
  const localX = (point.x - rect.x) / rect.scale;
  const localY = (point.y - rect.y) / rect.scale - frame.offsetTop;
  if (
    localX < 0 ||
    localX > frame.deviceWidth ||
    localY < 0 ||
    localY > frame.deviceHeight
  ) {
    return null;
  }
  return {x: roundTo(localX, 2), y: roundTo(localY, 2)};
}

/** Like stagePointToRemote but clamps to the page (drags may leave the frame). */
export function stagePointToRemoteClamped(
  point: Point,
  stage: StageSize,
  frame: FrameGeometry,
): Point | null {
  const rect = containedFrameRect(stage, frame);
  if (!rect) {
    return null;
  }
  const localX = (point.x - rect.x) / rect.scale;
  const localY = (point.y - rect.y) / rect.scale - frame.offsetTop;
  return {
    x: roundTo(clamp(localX, 0, frame.deviceWidth), 2),
    y: roundTo(clamp(localY, 0, frame.deviceHeight), 2),
  };
}

/**
 * Device metrics the viewer asks the remote page to emulate: the stage's own
 * CSS size and the phone's pixel ratio, so the page lays out for exactly the
 * space it is shown in (fit to screen, no letterbox, no viewer scroll).
 */
export function deviceMetricsForStage(
  stage: StageSize,
  pixelRatio: number,
): {
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: true;
  screenWidth: number;
  screenHeight: number;
} {
  const width = Math.max(1, Math.round(stage.width));
  const height = Math.max(1, Math.round(stage.height));
  const deviceScaleFactor = pixelRatio > 0 ? pixelRatio : 1;
  return {
    width,
    height,
    deviceScaleFactor,
    mobile: true,
    screenWidth: width,
    screenHeight: height,
  };
}

/** Screencast size cap: stage CSS px times DPR (full-resolution frames). */
export function screencastParamsForStage(
  stage: StageSize,
  pixelRatio: number,
  quality = 60,
): {
  format: 'jpeg';
  quality: number;
  maxWidth: number;
  maxHeight: number;
  everyNthFrame: 1;
} {
  const ratio = pixelRatio > 0 ? pixelRatio : 1;
  return {
    format: 'jpeg',
    quality,
    maxWidth: Math.max(1, Math.round(stage.width * ratio)),
    maxHeight: Math.max(1, Math.round(stage.height * ratio)),
    everyNthFrame: 1,
  };
}

/** Remote page point inside a `Pack.focusRects` entry (edges count). */
export function remotePointHitsFocusRect(
  point: Point,
  rect: {readonly x: number; readonly y: number; readonly width: number; readonly height: number},
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
