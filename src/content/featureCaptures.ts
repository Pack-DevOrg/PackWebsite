/**
 * Tall stitched captures of the REAL app screens — made in the simulator by
 * scrolling each screen and template-match stitching the shots (capture
 * pipeline recipe). The features page renders these inside ScrollablePhone
 * so visitors scroll the actual screen; entries appear here as screens are
 * captured, and screens without one fall back to their demo clip.
 *
 * width/height are the intrinsic pixel dimensions of the capture; they hold
 * the layout (aspect-ratio) before the image loads.
 */
export interface FeatureCapture {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export const FEATURE_CAPTURES: Partial<Record<string, FeatureCapture>> = {
  plan: {
    src: "/images/feature-captures/plan.webp",
    width: 1320,
    height: 4588,
    alt: "Pack planner: a Tokyo group-trip prompt with tagged friends becomes a full travel outline — flights, hotel with activity availability, car rental, and return",
  },
};
