/**
 * Pack icon glyphs for share/invite landing pages.
 *
 * Ported one-to-one from the app's icon system (PackApp/src/icons/svg) so the
 * web share page speaks the same icon language as the app: simple stroked
 * 24-box SVGs, stroke 2, round caps. Never emoji, never a third-party set.
 */

import React from "react";

export interface PackIconProps {
  readonly size?: number;
  readonly color?: string;
}

type IconRenderer = React.FC<PackIconProps>;

const strokeProps = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const svgProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  "aria-hidden": true,
  focusable: false,
});

/** App PlaneIcon: the filled paper-plane flight glyph (512 viewBox). */
export const PlaneGlyph: IconRenderer = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none" aria-hidden focusable={false}>
    <path
      d="M500 85.4398C460.125 91.4445 420.486 101.822 381 109.997C295.685 127.661 210.432 145.716 125 162.8C94.296 168.94 63.6865 175.566 33 181.801L11 186.4C7.44692 187.13 3.20293 187.804 1.17901 191.214C-1.12228 195.091 -0.0682745 200.536 3.14815 203.471C10.354 210.045 22.2906 214.395 31 218.753C55.2633 230.894 78.7689 244.55 103 256.752C113.07 261.823 123.179 267.04 133 272.576C136.434 274.511 140.782 275.94 143.697 278.637C146.725 281.44 147.081 286.157 147.75 290C149.144 298.008 150.742 305.983 152.08 314C156.372 339.722 161.547 365.292 165.919 391C167.169 398.348 168.678 405.651 169.919 413C170.487 416.362 170.51 420.846 172.742 423.606C176.482 428.232 182.58 426.807 187 424.239C197.666 418.043 207.736 410.509 218 403.667L264 373C268.346 370.103 276.447 362.157 282 363.363C285.227 364.064 288.307 366.875 291 368.667C295.954 371.963 301.046 375.037 306 378.333C323.194 389.775 340.457 401.293 358 412.192C364.981 416.529 377.175 428.731 385.996 426.551C392.964 424.829 394.789 415.795 396.95 410C403.15 393.369 409.474 376.75 415.343 360C439.422 291.29 465.938 223.379 490.947 155C497.612 136.775 505.554 118.592 511.099 100C513.724 91.1985 509.732 83.9743 500 85.4398z"
      fill={color}
    />
  </svg>
);

/** App BedIcon: double bed (Lucide bed-double). */
export const BedGlyph: IconRenderer = ({ size = 16, color = "currentColor" }) => (
  <svg {...svgProps(size)}>
    <g {...strokeProps(color)}>
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M12 4v6" />
      <path d="M2 18h20" />
    </g>
  </svg>
);

/** App CarIcon: stroked car body with wheels. */
export const CarGlyph: IconRenderer = ({ size = 16, color = "currentColor" }) => (
  <svg {...svgProps(size)}>
    <g stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10L5 6H19L21 10M3 10V17C3 17.5523 3.44772 18 4 18H5C5.55228 18 6 17.5523 6 17V16H18V17C18 17.5523 18.4477 18 19 18H20C20.5523 18 21 17.5523 21 17V10M3 10H21" />
      <circle cx="6.5" cy="13.5" r="1.5" />
      <circle cx="17.5" cy="13.5" r="1.5" />
    </g>
  </svg>
);

/** App TicketIcon: perforated event ticket. */
export const TicketGlyph: IconRenderer = ({ size = 16, color = "currentColor" }) => (
  <svg {...svgProps(size)}>
    <g {...strokeProps(color)}>
      <path d="M3 9.5V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 1 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 1 0 0-5Z" />
      <path d="M12 7v2" />
      <path d="M12 11v2" />
      <path d="M12 15v2" />
    </g>
  </svg>
);

/** App MoonIcon: nights-count pill glyph. */
export const MoonGlyph: IconRenderer = ({ size = 14, color = "currentColor" }) => (
  <svg {...svgProps(size)}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" {...strokeProps(color)} />
  </svg>
);

/** App MapPinIcon: location marker. */
export const MapPinGlyph: IconRenderer = ({ size = 14, color = "currentColor" }) => (
  <svg {...svgProps(size)}>
    <g {...strokeProps(color)}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </g>
  </svg>
);

/** App ClockIcon shape: event time. */
export const ClockGlyph: IconRenderer = ({ size = 14, color = "currentColor" }) => (
  <svg {...svgProps(size)}>
    <g {...strokeProps(color)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </g>
  </svg>
);

/** App CalendarPlusIcon: add-to-calendar. */
export const CalendarPlusGlyph: IconRenderer = ({ size = 16, color = "currentColor" }) => (
  <svg {...svgProps(size)}>
    <g {...strokeProps(color)}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M12 14v4" />
      <path d="M10 16h4" />
    </g>
  </svg>
);

/** App AppleOutlineIcon: Apple logo mark (monochrome glyph form). */
export const AppleGlyph: IconRenderer = ({ size = 16, color = "currentColor" }) => (
  <svg {...svgProps(size)} fill={color}>
    <g transform="translate(0.65 0.67)">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.86 3.29.86.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z" />
      <path d="M15.53 3.83c.73-.83 1.22-1.99 1.09-3.14-1.05.04-2.32.7-3.08 1.56-.68.78-1.27 2.04-1.11 3.24 1.17.09 2.37-.6 3.1-1.66z" />
    </g>
  </svg>
);

/** App GoogleIcon: monochrome "G" mark (color-prop form, as in the app). */
export const GoogleGlyph: IconRenderer = ({ size = 16, color = "currentColor" }) => (
  <svg {...svgProps(size)} fill={color}>
    <path d="M22.56 12.25a10 10 0 0 0-.2-2h-10.3v4.26h5.92a6 6 0 0 1-2.09 3.57v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.6z" />
    <path d="M12 23a10 10 0 0 0 6.28-2.22l-3.57-2.77A6 6 0 0 1 6.34 14.03H2.64V16.87A10 10 0 0 0 12 23z" />
    <path d="M5.34 14.03A6 6 0 0 1 5 12c0-.69.12-1.36.34-2H1.64v2.87l3.7 1.16z" />
    <path d="M12 5.38a5.99 5.99 0 0 1 4.21 1.64l3.13-3.13A10 10 0 0 0 12 1a10 10 0 0 0-9.36 6.13l3.7 2.84A6 6 0 0 1 12 5.38z" />
  </svg>
);

/** App ArrowRightIcon. */
export const ArrowRightGlyph: IconRenderer = ({ size = 14, color = "currentColor" }) => (
  <svg {...svgProps(size)}>
    <path d="M5 12h14M12 5l7 7-7 7" {...strokeProps(color)} />
  </svg>
);
