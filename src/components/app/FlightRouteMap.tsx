import { memo, useCallback, useMemo, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import styled from "styled-components";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import worldTopology from "world-atlas/countries-110m.json";
import airportsDataset from "airports-json/data/airports.json";
import countriesDataset from "airports-json/data/countries.json";
import usStatesTopology from "us-atlas/states-10m.json";
import type { Trip } from "@/api/trips";

type StoredFlight = NonNullable<Trip["flights"]>[number];

interface AirportCoordinate {
  readonly code: string;
  readonly lon: number;
  readonly lat: number;
  readonly country?: string | null;
  readonly city?: string | null;
  readonly name?: string | null;
  readonly region?: string | null;
}

interface FlightRouteMapProps {
  readonly flights: Trip["flights"] | null | undefined;
  readonly visitedCountryCodes?: readonly string[];
}

interface MapPath {
  readonly id: string;
  readonly d: string;
}

interface MapArc {
  readonly id: string;
  readonly d: string;
}

interface MapPoint {
  readonly id: string;
  readonly code: string;
  readonly x: number;
  readonly y: number;
  readonly city?: string | null;
  readonly country?: string | null;
}

interface MapPolygon {
  readonly id: string;
  readonly d: string;
  readonly visited: boolean;
}

interface TooltipState {
  readonly code: string;
  readonly city?: string | null;
  readonly country?: string | null;
  readonly x: number;
  readonly y: number;
}

const MAP_WIDTH = 960;
const MAP_HEIGHT = 480;
const MAP_PADDING = 24;

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const AIRPORT_LOOKUP: Map<string, AirportCoordinate> = (() => {
  const entries = new Map<string, AirportCoordinate>();
  (airportsDataset as Array<Record<string, unknown>>).forEach((airport) => {
    const codeRaw = airport.iata_code ?? airport.local_code ?? airport.ident;
    if (typeof codeRaw !== "string") {
      return;
    }

    const code = codeRaw.trim().toUpperCase();
    if (!code) {
      return;
    }

    const lat = parseNumber(airport.latitude_deg);
    const lon = parseNumber(airport.longitude_deg);

    if (lat == null || lon == null) {
      return;
    }

    entries.set(code, {
      code,
      lat,
      lon,
      country: typeof airport.iso_country === "string" ? airport.iso_country : undefined,
      city: typeof airport.municipality === "string" ? airport.municipality : undefined,
      name: typeof airport.name === "string" ? airport.name : undefined,
      region: typeof airport.iso_region === "string" ? airport.iso_region : undefined,
    });
  });
  return entries;
})();

const WORLD_FEATURES: Feature<Geometry>[] = (() => {
  const topology = worldTopology as unknown as Topology<{
    readonly countries: {
      readonly type: string;
      readonly geometries: Geometry[];
    };
  }>;
  const collection = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
  return collection.features;
})();

const US_STATE_FEATURES: Feature<Geometry>[] = (() => {
  const topology = usStatesTopology as unknown as Topology<{
    readonly states: {
      readonly type: string;
      readonly geometries: Geometry[];
    };
  }>;
  const collection = feature(topology, topology.objects.states) as FeatureCollection<Geometry>;
  return collection.features;
})();

const COUNTRY_NAME_BY_CODE: Map<string, string> = (() => {
  const entries = new Map<string, string>();
  (countriesDataset as Array<Record<string, unknown>>).forEach((country) => {
    const code = typeof country.code === "string" ? country.code.trim().toUpperCase() : "";
    const name = typeof country.name === "string" ? country.name.trim() : "";
    if (code && name) {
      entries.set(code, name);
    }
  });
  return entries;
})();

const US_STATE_FIPS: Record<string, string> = {
  AL: "01",
  AK: "02",
  AZ: "04",
  AR: "05",
  CA: "06",
  CO: "08",
  CT: "09",
  DE: "10",
  DC: "11",
  FL: "12",
  GA: "13",
  HI: "15",
  ID: "16",
  IL: "17",
  IN: "18",
  IA: "19",
  KS: "20",
  KY: "21",
  LA: "22",
  ME: "23",
  MD: "24",
  MA: "25",
  MI: "26",
  MN: "27",
  MS: "28",
  MO: "29",
  MT: "30",
  NE: "31",
  NV: "32",
  NH: "33",
  NJ: "34",
  NM: "35",
  NY: "36",
  NC: "37",
  ND: "38",
  OH: "39",
  OK: "40",
  OR: "41",
  PA: "42",
  RI: "44",
  SC: "45",
  SD: "46",
  TN: "47",
  TX: "48",
  UT: "49",
  VT: "50",
  VA: "51",
  WA: "53",
  WV: "54",
  WI: "55",
  WY: "56",
  PR: "72",
};

const getAirport = (code?: string | null): AirportCoordinate | undefined => {
  if (!code) return undefined;
  return AIRPORT_LOOKUP.get(code.trim().toUpperCase());
};

const parseFlightDate = (flight: StoredFlight): number => {
  const direct = flight.departureDate ?? flight.departure?.date ?? flight.departureTime;
  if (!direct) {
    return 0;
  }

  const timestamp = Date.parse(direct);
  if (Number.isNaN(timestamp)) {
    return 0;
  }

  return timestamp;
};

const drawArcPath = (
  from: [number, number],
  to: [number, number],
  project: ReturnType<typeof geoMercator>
): string | null => {
  const fromProj = project(from);
  const toProj = project(to);

  if (!fromProj || !toProj) {
    return null;
  }

  const [x1, y1] = fromProj;
  const [x2, y2] = toProj;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const curvature = Math.min(80, distance * 0.25);
  const offsetX = (-dy / distance) * curvature;
  const offsetY = -Math.abs((dx / distance) * curvature);

  return `M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`;
};

const normalizeFlights = (flights: Trip["flights"] | null | undefined) => {
  if (!flights || flights.length === 0) {
    return [];
  }

  return [...flights]
    .filter(
      (flight): flight is StoredFlight =>
        Boolean(flight?.departureAirport?.trim()) &&
        Boolean(flight?.arrivalAirport?.trim())
    )
    .sort((a, b) => parseFlightDate(a) - parseFlightDate(b));
};

const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2.4;
const ZOOM_STEP = 0.15;
const CENTER_X = MAP_WIDTH / 2;
const CENTER_Y = MAP_HEIGHT / 2;

const getCountryDisplayName = (country?: string | null): string | undefined => {
  if (!country) {
    return undefined;
  }
  if (country.toUpperCase() === "US") {
    return "US";
  }
  return COUNTRY_NAME_BY_CODE.get(country.toUpperCase()) ?? country;
};

const formatLocationLabel = (city?: string | null, country?: string | null): string | null => {
  const trimmedCity = city?.trim();
  const displayCountry = getCountryDisplayName(country);
  if (trimmedCity && displayCountry) {
    return `${trimmedCity}, ${displayCountry}`;
  }
  if (trimmedCity) {
    return trimmedCity;
  }
  return displayCountry ?? null;
};

const FlightRouteMapComponent: React.FC<FlightRouteMapProps> = ({ flights, visitedCountryCodes }) => {
  const normalizedFlights = useMemo(() => normalizeFlights(flights), [flights]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{
    readonly pointerId: number | null;
    readonly startX: number;
    readonly startY: number;
    readonly originPan: { readonly x: number; readonly y: number };
    readonly active: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originPan: { x: 0, y: 0 },
    active: false,
  });

  const clampZoom = useCallback(
    (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(value.toFixed(2)))),
    []
  );

  const clampPan = useCallback(
    (value: { x: number; y: number }, zoom: number) => {
      if (zoom <= 1) {
        return { x: 0, y: 0 };
      }
      const maxPanX = ((MAP_WIDTH * zoom) - MAP_WIDTH) / 2;
      const maxPanY = ((MAP_HEIGHT * zoom) - MAP_HEIGHT) / 2;
      return {
        x: Math.min(maxPanX, Math.max(-maxPanX, value.x)),
        y: Math.min(maxPanY, Math.max(-maxPanY, value.y)),
      };
    },
    []
  );

  const handleZoomChange = useCallback((delta: number) => {
    setZoomLevel((prev) => clampZoom(prev + delta));
  }, [clampZoom]);

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const direction = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const nextZoomLevel = clampZoom(zoomLevel + direction);
      setZoomLevel(nextZoomLevel);
      setPan((prev) => (nextZoomLevel <= 1 ? { x: 0, y: 0 } : clampPan(prev, nextZoomLevel)));
    },
    [clampPan, clampZoom, zoomLevel]
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (zoomLevel <= 1) {
        return;
      }
      event.preventDefault();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originPan: pan,
        active: true,
      };
      setIsDragging(true);
    },
    [pan, zoomLevel]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragState.current.active) {
        return;
      }
      const dx = event.clientX - dragState.current.startX;
      const dy = event.clientY - dragState.current.startY;
      const nextPan = clampPan(
        {
          x: dragState.current.originPan.x + dx,
          y: dragState.current.originPan.y + dy,
        },
        zoomLevel
      );
      setPan(nextPan);
    },
    [clampPan, zoomLevel]
  );

  const endDragging = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) {
      return;
    }
    if (dragState.current.pointerId != null) {
      event.currentTarget.releasePointerCapture(dragState.current.pointerId);
    }
    dragState.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      originPan: { x: 0, y: 0 },
      active: false,
    };
    setIsDragging(false);
  }, []);

  const mapData = useMemo(() => {
    if (normalizedFlights.length === 0) {
      return null;
    }

    const uniqueStops: string[] = [];
    const visitedCountryNames = new Set<string>();
    const visitedStateFips = new Set<string>();

    (visitedCountryCodes ?? []).forEach((countryCode) => {
      const normalized = countryCode.trim().toUpperCase();
      if (!normalized || normalized === "US") {
        return;
      }
      const resolved = COUNTRY_NAME_BY_CODE.get(normalized) ?? normalized;
      visitedCountryNames.add(resolved);
    });

    const registerVisit = (airport: AirportCoordinate | undefined) => {
      if (!airport) {
        return;
      }
      if (airport.country && airport.country !== "US") {
        const resolved = COUNTRY_NAME_BY_CODE.get(airport.country) ?? airport.country;
        if (resolved) {
          visitedCountryNames.add(resolved);
        }
        return;
      }
      if (airport.country === "US" && airport.region?.startsWith("US-")) {
        const stateCode = airport.region.slice(3).toUpperCase();
        const fips = US_STATE_FIPS[stateCode];
        if (fips) {
          visitedStateFips.add(fips);
        }
      }
    };

    const segments = normalizedFlights
      .map((flight, index) => {
        const departure = getAirport(flight.departureAirport);
        const arrival = getAirport(flight.arrivalAirport);

        if (!departure || !arrival) {
          return null;
        }

        registerVisit(departure);
        registerVisit(arrival);

        if (!uniqueStops.length || uniqueStops[uniqueStops.length - 1] !== departure.code) {
          uniqueStops.push(departure.code);
        }
        if (uniqueStops[uniqueStops.length - 1] !== arrival.code) {
          uniqueStops.push(arrival.code);
        }

        return {
          id: `${flight.departureAirport}-${flight.arrivalAirport}-${index}`,
          departure,
          arrival,
        };
      })
      .filter((segment): segment is NonNullable<typeof segment> => Boolean(segment));

    if (segments.length === 0) {
      return null;
    }

    const routeCoordinates = uniqueStops
      .map((code) => getAirport(code))
      .filter((value): value is AirportCoordinate => Boolean(value))
      .map((airport) => [airport.lon, airport.lat] as [number, number]);

    const isDomesticUS = segments.every(
      (segment) => segment.departure.country === "US" && segment.arrival.country === "US"
    );

    const projection = geoMercator();
    if (routeCoordinates.length >= 2) {
      projection.fitExtent(
        [
          [MAP_PADDING, MAP_PADDING],
          [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
        ],
        {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: routeCoordinates,
              },
              properties: {},
            },
          ],
        }
      );
    } else if (routeCoordinates.length === 1) {
      projection
        .scale(isDomesticUS ? 520 : 240)
        .center(routeCoordinates[0])
        .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
    } else {
      projection.scale(210).center([0, 20]).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
    }

    const pathGenerator = geoPath(projection);
    const arcs: MapArc[] = segments
      .map((segment, index) => {
        const path = drawArcPath(
          [segment.departure.lon, segment.departure.lat],
          [segment.arrival.lon, segment.arrival.lat],
          projection
        );
        if (!path) {
          return null;
        }
        return {
          id: `${segment.departure.code}-${segment.arrival.code}-${index}`,
          d: path,
        };
      })
      .filter((value): value is MapArc => Boolean(value));

    const airportPoints: MapPoint[] = uniqueStops
      .map((code, index) => {
        const airport = getAirport(code);
        if (!airport) {
          return null;
        }
        const projected = projection([airport.lon, airport.lat]);
        if (!projected) {
          return null;
        }
        return {
          id: `${code}-${index}`,
          code,
          x: projected[0],
          y: projected[1],
          city: airport.city ?? airport.name,
          country: airport.country,
        };
      })
      .filter((value): value is MapPoint => Boolean(value));

    const uniqueAirports = new Set(uniqueStops);

    const worldPolygons: MapPolygon[] = WORLD_FEATURES.map((featureData, index) => {
      const d = pathGenerator(featureData as Feature);
      if (!d) {
        return null;
      }
      const id =
        (typeof featureData.id === "string" && featureData.id) ||
        `country-${index}`;
      const countryName =
        typeof featureData.properties?.name === "string" ? featureData.properties.name : "";
      const visited = Boolean(countryName && visitedCountryNames.has(countryName));
      return {
        id,
        d,
        visited,
      };
    }).filter((value): value is MapPolygon => Boolean(value));

    const visitedStatePolygons: MapPolygon[] = US_STATE_FEATURES.map((featureData, index) => {
      const d = pathGenerator(featureData as Feature);
      if (!d) {
        return null;
      }
      const id =
        (typeof featureData.id === "string" && featureData.id) ||
        `us-state-${index}`;
      const visited = visitedStateFips.has(String(featureData.id ?? ""));
      if (!visited) {
        return null;
      }
      return {
        id,
        d,
        visited: true,
      };
    }).filter((value): value is MapPolygon => Boolean(value));

    return {
      arcs,
      airportPoints,
      worldPolygons,
      visitedStatePolygons,
      flightsCount: segments.length,
      airportCount: uniqueAirports.size,
      isDomesticUS,
    };
  }, [normalizedFlights, visitedCountryCodes]);

  const handlePointHover = useCallback(
    (
      point: MapPoint,
      event: ReactMouseEvent<SVGCircleElement>
    ) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setTooltip({
        code: point.code,
        city: point.city,
        x: event.clientX - rect.left + 12,
        y: event.clientY - rect.top - 12,
        country: point.country,
      });
    },
    []
  );

  const handlePointLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const mapTransform = useMemo(
    () =>
      `translate(${CENTER_X + pan.x}, ${CENTER_Y + pan.y}) scale(${zoomLevel}) translate(${-CENTER_X}, ${-CENTER_Y})`,
    [pan.x, pan.y, zoomLevel]
  );

  const renderedLayers = useMemo(() => {
    if (!mapData) {
      return null;
    }

    const countryStrokeWidth = Math.max(0.3, 0.55 / zoomLevel);
    const stateStrokeWidth = Math.max(0.3, 0.55 / zoomLevel);
    const arcGlowWidth = Math.max(0.8, 1.5 / zoomLevel);
    const arcStrokeWidth = Math.max(0.45, 1.15 / zoomLevel);
    const pointRadius = Math.max(0.85, 1.7 / zoomLevel);
    const pointStrokeWidth = Math.max(0.6, 1 / zoomLevel);

    return (
      <>
        {mapData.worldPolygons.map((country) => (
          <path
            key={country.id}
            d={country.d}
            fill={
              country.visited
                ? "rgba(240, 198, 45, 0.25)"
                : "rgba(255, 255, 255, 0.04)"
            }
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={countryStrokeWidth}
          />
        ))}

        {mapData.visitedStatePolygons.map((state) => (
          <path
            key={state.id}
            d={state.d}
            fill="rgba(20, 184, 166, 0.45)"
            stroke="rgba(20, 184, 166, 0.75)"
            strokeWidth={stateStrokeWidth}
          />
        ))}

        {mapData.arcs.map((arc) => (
          <g key={arc.id}>
            <path
              d={arc.d}
              fill="none"
              stroke="rgba(240, 198, 45, 0.16)"
              strokeWidth={arcGlowWidth}
              strokeLinecap="round"
              opacity={0.6}
            />
            <path
              d={arc.d}
              fill="none"
              stroke="url(#flightArc)"
              strokeWidth={arcStrokeWidth}
              strokeLinecap="round"
              opacity={0.82}
            />
          </g>
        ))}

        {mapData.airportPoints.map((point) => (
          <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={pointRadius}
            fill="#f0c62d"
            stroke="rgba(5,3,12,0.8)"
            strokeWidth={pointStrokeWidth}
            onMouseEnter={(event) => handlePointHover(point, event)}
            onMouseMove={(event) => handlePointHover(point, event)}
            onMouseLeave={handlePointLeave}
          />
        ))}
      </>
    );
  }, [mapData, zoomLevel, handlePointHover, handlePointLeave]);

  if (!mapData) {
    return (
      <MapSection>
        <SectionHeader>
          <div>
            <h4>Flight map</h4>
            <p>Connect your inbox to start tracking routes automatically.</p>
          </div>
        </SectionHeader>
        <MapEmptyState>
          <span>
            As your trips sync in, we will highlight every country and U.S. state you've visited and show flight paths on the map.
          </span>
        </MapEmptyState>
      </MapSection>
    );
  }

  return (
    <MapSection>
      <SectionHeader>
        <div>
          <h4>Flight map</h4>
          <p>
            {mapData.flightsCount} flight
            {mapData.flightsCount === 1 ? "" : "s"} • {mapData.airportCount} airport
            {mapData.airportCount === 1 ? "" : "s"}
          </p>
        </div>
        <Badge aria-label={mapData.isDomesticUS ? "US flights" : "Global flights"}>
          {mapData.isDomesticUS ? "US routes" : "Worldwide"}
        </Badge>
      </SectionHeader>

      <MapCard
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDragging}
        onPointerLeave={endDragging}
        style={{
          cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <ZoomControls>
          <ZoomButton
            type="button"
            aria-label="Zoom out"
            disabled={zoomLevel <= ZOOM_MIN}
            onClick={() => handleZoomChange(-ZOOM_STEP)}
          >
            –
          </ZoomButton>
          <span>{`${(zoomLevel * 100).toFixed(0)}%`}</span>
          <ZoomButton
            type="button"
            aria-label="Zoom in"
            disabled={zoomLevel >= ZOOM_MAX}
            onClick={() => handleZoomChange(ZOOM_STEP)}
          >
            +
          </ZoomButton>
        </ZoomControls>
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label="Map showing flight paths"
        >
          <defs>
            <linearGradient id="flightArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f0c62d" />
              <stop offset="100%" stopColor="#f59f0b" />
            </linearGradient>
          </defs>
          <g transform={mapTransform}>{renderedLayers}</g>
        </svg>
        {tooltip ? (() => {
          const locationLabel = formatLocationLabel(tooltip.city, tooltip.country);
          return (
            <Tooltip style={{ left: tooltip.x, top: tooltip.y }}>
              <strong>{tooltip.code}</strong>
              {locationLabel ? <span>{locationLabel}</span> : null}
            </Tooltip>
          );
        })() : null}
      </MapCard>
    </MapSection>
  );
};

export const FlightRouteMap = memo(FlightRouteMapComponent);

const MapSection = styled.section`
  margin-top: 2rem;
  padding: clamp(1.5rem, 3vw, 2.25rem);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(9, 7, 20, 0.65);
  display: grid;
  gap: 1.25rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;

  h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  p {
    margin: 0.1rem 0 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "rgba(255,255,255,0.7)"};
  }
`;

const Badge = styled.span`
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme?.colors?.neutral?.gray050 ?? "#fff"};
`;

const MapCard = styled.div`
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: radial-gradient(circle at top, rgba(240, 198, 45, 0.12), transparent 55%),
    rgba(7, 5, 18, 0.95);
  box-shadow: 0 40px 120px rgba(5, 3, 12, 0.7);

  svg {
    width: 100%;
    height: auto;
    aspect-ratio: ${MAP_WIDTH} / ${MAP_HEIGHT};
    display: block;
  }
`;

const MapEmptyState = styled.div`
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(7, 5, 18, 0.65);
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
  font-size: 0.9rem;
`;

const ZoomControls = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  border-radius: 999px;
  background: rgba(5, 3, 12, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.85rem;
  z-index: 2;

  span {
    min-width: 3.5ch;
    text-align: center;
    color: ${({ theme }) => theme?.colors?.neutral?.gray050 ?? "#fff"};
    font-variant-numeric: tabular-nums;
  }
`;

const ZoomButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme?.colors?.neutral?.gray050 ?? "#fff"};
  font-size: 1rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, border 0.15s ease;

  &:hover:enabled {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.25);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  pointer-events: none;
  transform: translate(-50%, -100%);
  background: rgba(5, 3, 12, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 0.35rem 0.6rem;
  display: grid;
  gap: 0.2rem;
  min-width: 100px;
  box-shadow: 0 12px 30px rgba(5, 3, 12, 0.55);

  strong {
    font-size: 0.85rem;
    letter-spacing: 0.08em;
  }

  span {
    font-size: 0.75rem;
    color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
  }
`;
