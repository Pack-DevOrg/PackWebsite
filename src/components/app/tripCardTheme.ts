const APP_THEME_COLORS = {
  coal: "#121212",
  slate: "#1E1E1E",
  graphite: "#2C2C2C",
  crimson: "#E72340",
  coral: "#F55428",
  orange: "#FF9800",
  amber: "#F0C62D",
  teal: "#32B6A1",
  cyan: "#45B1E0",
  blue: "#2196F3",
  cobalt: "#1F5ED2",
} as const;

const withAlpha = (hex: string, alphaHex: string): string => `${hex}${alphaHex}`;

export type TripCardThemeVariant = "upcoming" | "past";

export interface TripCardTheme {
  readonly gradientStart: string;
  readonly gradientEnd: string;
  readonly orb: string;
  readonly accent: string;
}

interface ThemeTone {
  readonly accent: string;
  readonly gradientStart: string;
  readonly gradientEnd: string;
  readonly orb: string;
}

interface ThemeStop {
  readonly distance: number;
  readonly accent: string;
  readonly startColor: string;
  readonly endColor: string;
  readonly startAlpha: string;
  readonly endAlpha: string;
  readonly orbAlpha: string;
}

interface DistanceBand {
  readonly maxMiles: number;
  readonly upcoming: readonly ThemeTone[];
  readonly past: readonly ThemeTone[];
}

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const createTone = (
  accent: string,
  startColor: string,
  startAlpha: string,
  endColor: string,
  endAlpha: string,
  orbAlpha: string
): ThemeTone => ({
  accent,
  gradientStart: withAlpha(startColor, startAlpha),
  gradientEnd: withAlpha(endColor, endAlpha),
  orb: withAlpha(accent, orbAlpha),
});

const PAST_THEME_STOPS: readonly ThemeStop[] = [
  {
    distance: 0,
    accent: APP_THEME_COLORS.crimson,
    startColor: APP_THEME_COLORS.slate,
    endColor: APP_THEME_COLORS.crimson,
    startAlpha: "F4",
    endAlpha: "96",
    orbAlpha: "40",
  },
  {
    distance: 1200,
    accent: APP_THEME_COLORS.orange,
    startColor: APP_THEME_COLORS.coal,
    endColor: APP_THEME_COLORS.orange,
    startAlpha: "F4",
    endAlpha: "A8",
    orbAlpha: "42",
  },
  {
    distance: 2400,
    accent: APP_THEME_COLORS.amber,
    startColor: APP_THEME_COLORS.coal,
    endColor: APP_THEME_COLORS.amber,
    startAlpha: "F2",
    endAlpha: "9E",
    orbAlpha: "3E",
  },
  {
    distance: 4200,
    accent: APP_THEME_COLORS.teal,
    startColor: APP_THEME_COLORS.coal,
    endColor: APP_THEME_COLORS.teal,
    startAlpha: "F2",
    endAlpha: "96",
    orbAlpha: "3C",
  },
  {
    distance: 6500,
    accent: APP_THEME_COLORS.blue,
    startColor: APP_THEME_COLORS.slate,
    endColor: APP_THEME_COLORS.blue,
    startAlpha: "F3",
    endAlpha: "B8",
    orbAlpha: "48",
  },
  {
    distance: 9000,
    accent: APP_THEME_COLORS.cobalt,
    startColor: APP_THEME_COLORS.coal,
    endColor: APP_THEME_COLORS.cobalt,
    startAlpha: "F5",
    endAlpha: "D6",
    orbAlpha: "58",
  },
] as const;

const DISTANCE_BANDS: readonly DistanceBand[] = [
  {
    maxMiles: 600,
    upcoming: [
      createTone(APP_THEME_COLORS.crimson, APP_THEME_COLORS.coal, "F8", APP_THEME_COLORS.crimson, "E2", "58"),
      createTone(APP_THEME_COLORS.coral, APP_THEME_COLORS.coal, "F6", APP_THEME_COLORS.coral, "D6", "4E"),
    ],
    past: [
      createTone(APP_THEME_COLORS.crimson, APP_THEME_COLORS.slate, "F4", APP_THEME_COLORS.crimson, "BF", "44"),
      createTone(APP_THEME_COLORS.coral, APP_THEME_COLORS.coal, "F4", APP_THEME_COLORS.coral, "A8", "3C"),
    ],
  },
  {
    maxMiles: 1500,
    upcoming: [
      createTone(APP_THEME_COLORS.orange, APP_THEME_COLORS.coal, "F7", APP_THEME_COLORS.orange, "D4", "54"),
      createTone(APP_THEME_COLORS.orange, APP_THEME_COLORS.slate, "F5", APP_THEME_COLORS.coral, "CC", "46"),
    ],
    past: [
      createTone(APP_THEME_COLORS.orange, APP_THEME_COLORS.coal, "F4", APP_THEME_COLORS.orange, "B6", "42"),
      createTone(APP_THEME_COLORS.coral, APP_THEME_COLORS.slate, "F2", APP_THEME_COLORS.coral, "9E", "3A"),
    ],
  },
  {
    maxMiles: 2400,
    upcoming: [
      createTone(APP_THEME_COLORS.amber, APP_THEME_COLORS.slate, "F6", APP_THEME_COLORS.amber, "CC", "50"),
      createTone(APP_THEME_COLORS.amber, APP_THEME_COLORS.coal, "F4", APP_THEME_COLORS.orange, "BF", "44"),
    ],
    past: [
      createTone(APP_THEME_COLORS.amber, APP_THEME_COLORS.coal, "F2", APP_THEME_COLORS.amber, "A6", "3C"),
      createTone(APP_THEME_COLORS.orange, APP_THEME_COLORS.slate, "F2", APP_THEME_COLORS.orange, "96", "36"),
    ],
  },
  {
    maxMiles: 4200,
    upcoming: [
      createTone(APP_THEME_COLORS.teal, APP_THEME_COLORS.coal, "F6", APP_THEME_COLORS.teal, "C6", "4C"),
      createTone(APP_THEME_COLORS.cyan, APP_THEME_COLORS.slate, "F5", APP_THEME_COLORS.teal, "C2", "46"),
    ],
    past: [
      createTone(APP_THEME_COLORS.teal, APP_THEME_COLORS.coal, "F2", APP_THEME_COLORS.teal, "96", "3A"),
      createTone(APP_THEME_COLORS.cyan, APP_THEME_COLORS.slate, "F2", APP_THEME_COLORS.cyan, "8E", "38"),
    ],
  },
  {
    maxMiles: 6500,
    upcoming: [
      createTone(APP_THEME_COLORS.blue, APP_THEME_COLORS.coal, "F6", APP_THEME_COLORS.blue, "DA", "5C"),
      createTone(APP_THEME_COLORS.cyan, APP_THEME_COLORS.coal, "F4", APP_THEME_COLORS.cobalt, "D8", "54"),
    ],
    past: [
      createTone(APP_THEME_COLORS.blue, APP_THEME_COLORS.slate, "F3", APP_THEME_COLORS.blue, "B2", "46"),
      createTone(APP_THEME_COLORS.cyan, APP_THEME_COLORS.coal, "F2", APP_THEME_COLORS.cyan, "9C", "3E"),
    ],
  },
  {
    maxMiles: Number.POSITIVE_INFINITY,
    upcoming: [
      createTone(APP_THEME_COLORS.cobalt, APP_THEME_COLORS.coal, "F8", APP_THEME_COLORS.cobalt, "EE", "68"),
      createTone(APP_THEME_COLORS.blue, APP_THEME_COLORS.slate, "F5", APP_THEME_COLORS.cobalt, "E2", "60"),
    ],
    past: [
      createTone(APP_THEME_COLORS.cobalt, APP_THEME_COLORS.coal, "F4", APP_THEME_COLORS.cobalt, "C2", "4E"),
      createTone(APP_THEME_COLORS.blue, APP_THEME_COLORS.slate, "F3", APP_THEME_COLORS.blue, "A6", "44"),
    ],
  },
] as const;

export const resolveTripThemeHashSource = ({
  destination,
  startLocation,
  endLocation,
  tripId,
}: {
  readonly destination?: string | null;
  readonly startLocation?: string | null;
  readonly endLocation?: string | null;
  readonly tripId: string;
}): string => {
  const normalizedDestination = destination?.trim();
  if (normalizedDestination) {
    return normalizedDestination;
  }
  return startLocation || endLocation || tripId;
};

const getDistanceBandIndex = (distanceMiles?: number | null): number | null => {
  if (!Number.isFinite(distanceMiles) || distanceMiles == null || distanceMiles <= 0) {
    return null;
  }
  return DISTANCE_BANDS.findIndex((band) => distanceMiles <= band.maxMiles);
};

const parseHexColor = (hex: string): [number, number, number] => {
  const sanitized = hex.replace("#", "").trim();
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : sanitized.padEnd(6, "0").slice(0, 6);

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
};

const toHexColor = (rgb: readonly number[]): string =>
  `#${rgb
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;

const interpolateNumber = (from: number, to: number, progress: number): number =>
  from + (to - from) * progress;

const interpolateHex = (from: string, to: string, progress: number): string => {
  const fromRgb = parseHexColor(from);
  const toRgb = parseHexColor(to);
  return toHexColor([
    interpolateNumber(fromRgb[0], toRgb[0], progress),
    interpolateNumber(fromRgb[1], toRgb[1], progress),
    interpolateNumber(fromRgb[2], toRgb[2], progress),
  ]);
};

const interpolateAlpha = (from: string, to: string, progress: number): string => {
  const fromValue = Number.parseInt(from, 16);
  const toValue = Number.parseInt(to, 16);
  return Math.round(interpolateNumber(fromValue, toValue, progress))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
};

const getContinuousPastTheme = (distanceMiles: number, hash: number): TripCardTheme => {
  const clampedDistance = Math.max(0, distanceMiles);
  const upperIndex = PAST_THEME_STOPS.findIndex((stop) => clampedDistance <= stop.distance);
  const resolvedUpperIndex = upperIndex === -1 ? PAST_THEME_STOPS.length - 1 : upperIndex;
  const upperStop = PAST_THEME_STOPS[resolvedUpperIndex];
  const lowerStop = PAST_THEME_STOPS[Math.max(0, resolvedUpperIndex - 1)];
  const span = Math.max(1, upperStop.distance - lowerStop.distance);
  const progress = Math.max(
    0,
    Math.min(1, (clampedDistance - lowerStop.distance) / span)
  );

  const accent = interpolateHex(lowerStop.accent, upperStop.accent, progress);
  const gradientStart = withAlpha(
    interpolateHex(lowerStop.startColor, upperStop.startColor, progress),
    interpolateAlpha(lowerStop.startAlpha, upperStop.startAlpha, progress)
  );
  const gradientEndBase = interpolateHex(lowerStop.endColor, upperStop.endColor, progress);
  const gradientEnd = withAlpha(
    gradientEndBase,
    interpolateAlpha(lowerStop.endAlpha, upperStop.endAlpha, progress)
  );

  const hashLift = (hash % 7) / 100;
  const orb = withAlpha(
    interpolateHex(lowerStop.accent, upperStop.accent, Math.min(1, progress + hashLift)),
    interpolateAlpha(lowerStop.orbAlpha, upperStop.orbAlpha, progress)
  );

  return {
    accent,
    gradientStart,
    gradientEnd,
    orb,
  };
};

export const getTripCardTheme = ({
  hashSource,
  variant,
  distanceMiles,
}: {
  readonly hashSource: string;
  readonly variant: TripCardThemeVariant;
  readonly distanceMiles?: number | null;
}): TripCardTheme => {
  const hash = hashString(hashSource);

  if (variant === "past" && Number.isFinite(distanceMiles) && (distanceMiles ?? 0) > 0) {
    return getContinuousPastTheme(distanceMiles as number, hash);
  }

  const bandIndex = getDistanceBandIndex(distanceMiles);
  const resolvedBand = DISTANCE_BANDS[bandIndex ?? (hash % DISTANCE_BANDS.length)];
  const tones = variant === "upcoming" ? resolvedBand.upcoming : resolvedBand.past;
  const tone = tones[hash % tones.length];

  return {
    gradientStart: tone.gradientStart,
    gradientEnd: tone.gradientEnd,
    accent: tone.accent,
    orb: tone.orb,
  };
};
