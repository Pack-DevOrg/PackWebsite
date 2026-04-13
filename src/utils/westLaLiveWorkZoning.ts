/**
 * @fileoverview Helpers for screening West LA zoning polygons for live/work-related categories.
 */

export const WEST_LA_VIEWPORT_BOUNDS = {
  south: 33.96,
  west: -118.52,
  north: 34.09,
  east: -118.33,
} as const;

export const ARTIST_JLWQ_ZONE_BASES = new Set([
  'CR',
  'MR1',
  'MR2',
  'M1',
  'M2',
  'M3',
]);

export const ADAPTIVE_REUSE_ZONE_BASES = new Set([
  'RAS3',
  'RAS4',
  'C1',
  'C1.5',
  'C2',
  'C4',
  'C5',
  'CM',
]);

export type LiveWorkCategory = 'artistJointLivingWork' | 'adaptiveReuse';

export type GeoJsonPoint = readonly [number, number];
export type GeoJsonRing = readonly GeoJsonPoint[];
export type GeoJsonPolygonCoordinates = readonly GeoJsonRing[];
export type GeoJsonMultiPolygonCoordinates = readonly GeoJsonPolygonCoordinates[];

const ZONE_PREFIX_PATTERN = /^\s*(?:\([^)]*\)|\[[^\]]*\])*\s*/;

export function extractBaseZone(zoneComplete: string | null | undefined): string | null {
  if (!zoneComplete) {
    return null;
  }

  const normalizedZone = zoneComplete
    .toUpperCase()
    .replace(ZONE_PREFIX_PATTERN, '')
    .trim();

  if (!normalizedZone) {
    return null;
  }

  const [baseZone] = normalizedZone.split('-');
  return baseZone?.trim() || null;
}

export function classifyLiveWorkCategory(
  zoneComplete: string | null | undefined,
): LiveWorkCategory | null {
  const baseZone = extractBaseZone(zoneComplete);

  if (!baseZone) {
    return null;
  }

  if (ARTIST_JLWQ_ZONE_BASES.has(baseZone)) {
    return 'artistJointLivingWork';
  }

  if (ADAPTIVE_REUSE_ZONE_BASES.has(baseZone)) {
    return 'adaptiveReuse';
  }

  return null;
}

export function getLiveWorkCategoryLabel(category: LiveWorkCategory): string {
  if (category === 'artistJointLivingWork') {
    return 'Specialized live/work candidate';
  }

  return 'Office-adjacent candidate';
}

function isPointInsideRing(point: GeoJsonPoint, ring: GeoJsonRing): boolean {
  const [pointX, pointY] = point;
  let isInside = false;

  for (let currentIndex = 0, previousIndex = ring.length - 1;
    currentIndex < ring.length;
    previousIndex = currentIndex++) {
    const [currentX, currentY] = ring[currentIndex];
    const [previousX, previousY] = ring[previousIndex];

    const intersects =
      ((currentY > pointY) !== (previousY > pointY)) &&
      (pointX <
        ((previousX - currentX) * (pointY - currentY)) /
          (previousY - currentY || Number.EPSILON) +
          currentX);

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

export function isPointInsidePolygon(
  point: GeoJsonPoint,
  polygonCoordinates: GeoJsonPolygonCoordinates,
): boolean {
  const [outerRing, ...holes] = polygonCoordinates;

  if (!outerRing || !isPointInsideRing(point, outerRing)) {
    return false;
  }

  return !holes.some((holeRing) => isPointInsideRing(point, holeRing));
}

export function isPointInsideGeometry(
  point: GeoJsonPoint,
  geometry:
    | {type: 'Polygon'; coordinates: GeoJsonPolygonCoordinates}
    | {type: 'MultiPolygon'; coordinates: GeoJsonMultiPolygonCoordinates}
    | null
    | undefined,
): boolean {
  if (!geometry) {
    return false;
  }

  if (geometry.type === 'Polygon') {
    return isPointInsidePolygon(point, geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygonCoordinates) =>
      isPointInsidePolygon(point, polygonCoordinates));
  }

  return false;
}
