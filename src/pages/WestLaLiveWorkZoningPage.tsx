import React, { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import styled from "styled-components";
import "leaflet/dist/leaflet.css";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  DEFAULT_LISTING_FILTERS,
  buildZoneMatch,
  describeZoneMatch,
  getListingSourceLabel,
  groupListingsByAddress,
  parseListingImportText,
  screenListingGroups,
  type ListingScreenFilters,
  type ScreenedListingGroup,
} from "@/utils/liveWorkListingScreening";
import {
  classifyLiveWorkCategory,
  extractBaseZone,
  getLiveWorkCategoryLabel,
  isPointInsideGeometry,
  WEST_LA_VIEWPORT_BOUNDS,
  type GeoJsonPoint,
  type LiveWorkCategory,
} from "@/utils/westLaLiveWorkZoning";

type ZoneFeatureProperties = {
  ZONE_CMPLT?: string;
  ZONING_DESCRIPTION?: string;
};

type ZoneFeatureGeometry =
  | {
      type: "Polygon";
      coordinates: readonly (readonly GeoJsonPoint[])[];
    }
  | {
      type: "MultiPolygon";
      coordinates: readonly (readonly (readonly GeoJsonPoint[])[])[];
    };

type GeoJsonFeature = {
  type: "Feature";
  properties: ZoneFeatureProperties;
  geometry: ZoneFeatureGeometry;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

type MapSummary = {
  candidateCount: number;
  specializedCount: number;
  officeAdjacentCount: number;
  zoneBases: string[];
};

type AddressSearchResult = {
  address: string;
  latitude: number;
  longitude: number;
  zoneComplete: string | null;
  zoneBase: string | null;
  zoneDescription: string | null;
  category: LiveWorkCategory | null;
  isInsideWestLaViewport: boolean;
};

type ListingZoneLookup = {
  geocodedAddress: string;
  latitude: number;
  longitude: number;
  zoneMatch: ReturnType<typeof buildZoneMatch>;
};

type LeafletModule = typeof import("leaflet");
type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;

const ZONING_LAYER_URL =
  "https://maps.lacity.org/lahub/rest/services/City_Planning_Department/MapServer/8";
const ZIMAS_URL = "https://zimas.lacity.org/";
const WESTSIDE_PLAN_URL =
  "https://planning.lacity.gov/plans-policies/community-plan-update/planning-westside";
const FORMS_URL = "https://planning.lacity.gov/development-services/forms";
const SNAPSHOT_DATE_LABEL = "April 13, 2026";
const CARTO_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const WORLD_GEOCODER_URL =
  "https://nominatim.openstreetmap.org/search";

const Page = styled.section`
  display: grid;
  gap: var(--space-4);
  padding: var(--space-3);
`;

const Hero = styled.section`
  display: grid;
  gap: 1rem;
  padding: clamp(1.1rem, 3vw, 1.6rem);
  border-radius: 1.6rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    radial-gradient(circle at top left, rgba(243, 210, 122, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(16, 13, 10, 0.92);
`;

const Kicker = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.primary.main};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1.02;
`;

const Description = styled.p`
  margin: 0;
  max-width: 72ch;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.medium};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

const Note = styled.div`
  border-left: 4px solid ${({ theme }) => theme.colors.secondary.main};
  background: rgba(231, 35, 64, 0.08);
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: 1rem;
  padding: 0.95rem 1rem;
`;

const SearchSection = styled.section`
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 1.3rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background: rgba(255, 248, 236, 0.04);
`;

const SearchRow = styled.form`
  display: grid;
  gap: 0.75rem;

  @media (min-width: 760px) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgba(243, 210, 122, 0.2);
  background: rgba(255, 248, 236, 0.06);
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.95rem 1rem;
  font-size: ${({ theme }) => theme.typography.fontSizes.base};

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const SearchButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 1rem;
  padding: 0.95rem 1.15rem;
  background: linear-gradient(135deg, #f3d27a 0%, #eab54d 100%);
  color: #100d0b;
  font-weight: 800;
  cursor: pointer;
`;

const SearchHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
`;

const SearchResultCard = styled.div`
  display: grid;
  gap: 0.45rem;
  border-radius: 1rem;
  background: rgba(255, 248, 236, 0.05);
  border: 1px solid rgba(243, 210, 122, 0.1);
  padding: 0.9rem;
`;

const SearchResultTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SearchResultLine = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`;

const SearchError = styled.div`
  color: #ffd2d2;
  background: rgba(195, 46, 63, 0.18);
  border: 1px solid rgba(195, 46, 63, 0.28);
  padding: 0.75rem 0.9rem;
  border-radius: 0.9rem;
`;

const WorkspaceSection = styled.section`
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.05), rgba(255, 248, 236, 0.03)),
    rgba(18, 14, 11, 0.9);
`;

const WorkspaceIntro = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

const ImportGrid = styled.div`
  display: grid;
  gap: 0.9rem;

  @media (min-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ImportCard = styled.div`
  display: grid;
  gap: 0.65rem;
  padding: 0.95rem;
  border-radius: 1rem;
  border: 1px solid rgba(243, 210, 122, 0.1);
  background: rgba(255, 248, 236, 0.04);
`;

const ImportLabel = styled.strong`
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ImportHelp = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
  line-height: 1.55;
`;

const ImportTextarea = styled.textarea`
  min-height: 200px;
  width: 100%;
  resize: vertical;
  border-radius: 1rem;
  border: 1px solid rgba(243, 210, 122, 0.2);
  background: rgba(255, 248, 236, 0.06);
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.95rem 1rem;
  font: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const FilterGrid = styled.div`
  display: grid;
  gap: 0.8rem;

  @media (min-width: 960px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const FilterCard = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.9rem;
  border-radius: 1rem;
  background: rgba(255, 248, 236, 0.04);
  border: 1px solid rgba(243, 210, 122, 0.1);
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
`;

const FilterNumberInput = styled.input`
  width: 100%;
  border-radius: 0.85rem;
  border: 1px solid rgba(243, 210, 122, 0.2);
  background: rgba(255, 248, 236, 0.06);
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.75rem 0.85rem;
  font: inherit;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  border: 1px solid rgba(243, 210, 122, 0.2);
  padding: 0.95rem 1.15rem;
  background: rgba(255, 248, 236, 0.04);
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 700;
  cursor: pointer;
`;

const ResultMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ResultChip = styled.span<{ $tone?: "good" | "warn" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "good"
        ? "rgba(111, 195, 124, 0.28)"
        : $tone === "warn"
          ? "rgba(243, 210, 122, 0.28)"
          : "rgba(243, 210, 122, 0.14)"};
  background:
    ${({ $tone }) =>
      $tone === "good"
        ? "rgba(111, 195, 124, 0.12)"
        : $tone === "warn"
          ? "rgba(243, 210, 122, 0.12)"
          : "rgba(255, 248, 236, 0.05)"};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
`;

const ListingResults = styled.div`
  display: grid;
  gap: 0.85rem;
`;

const ListingCard = styled.div`
  display: grid;
  gap: 0.65rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background: rgba(255, 248, 236, 0.05);
`;

const ListingTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.65rem;
`;

const ListingTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.large};
`;

const ListingCopy = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.55;
`;

const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const InlineLink = styled.a`
  color: ${({ theme }) => theme.colors.primary.main};
  font-weight: 700;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

const InfoGrid = styled.section`
  display: grid;
  gap: 1rem;

  @media (min-width: 960px) {
    grid-template-columns: minmax(0, 2.2fr) minmax(300px, 1fr);
    align-items: start;
  }
`;

const MapCard = styled.section`
  display: grid;
  gap: 0.75rem;
`;

const Sidebar = styled.aside`
  display: grid;
  gap: 1rem;
`;

const Panel = styled.section`
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.05), rgba(255, 248, 236, 0.03)),
    rgba(18, 14, 11, 0.9);
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.large};
`;

const MetricGrid = styled.div`
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
`;

const MetricCard = styled.div`
  display: grid;
  gap: 0.25rem;
  padding: 0.9rem;
  border-radius: 1rem;
  background: rgba(255, 248, 236, 0.05);
  border: 1px solid rgba(243, 210, 122, 0.1);
`;

const MetricLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const MetricValue = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
`;

const MapFrame = styled.div`
  min-height: 72vh;
  border-radius: 1.7rem;
  overflow: hidden;
  border: 1px solid rgba(243, 210, 122, 0.14);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.26);
  background: rgba(255, 248, 236, 0.04);

  .leaflet-container {
    min-height: 72vh;
    width: 100%;
    background: #efe6d5;
    font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  }

  .leaflet-popup-content-wrapper,
  .leaflet-popup-tip {
    background: rgba(22, 17, 13, 0.96);
    color: #fff7e7;
  }

  .leaflet-popup-content {
    margin: 0.95rem 1rem;
    line-height: 1.5;
  }

  .leaflet-control-attribution {
    background: rgba(16, 13, 10, 0.82);
    color: rgba(247, 240, 227, 0.72);
  }

  .leaflet-control-attribution a {
    color: #f3d27a;
  }
`;

const StatusText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LegendSwatch = styled.span<{ $background: string; $border: string }>`
  width: 18px;
  height: 18px;
  border-radius: 0.45rem;
  background: ${({ $background }) => $background};
  border: 1px solid ${({ $border }) => $border};
  flex-shrink: 0;
`;

const SourceList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ZoneList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ZoneChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.06);
  border: 1px solid rgba(243, 210, 122, 0.12);
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
`;

function getCategoryStyle(category: LiveWorkCategory): {
  fillColor: string;
  color: string;
  fillOpacity: number;
} {
  if (category === "artistJointLivingWork") {
    return {
      fillColor: "#c94f4f",
      color: "#8d1f2d",
      fillOpacity: 0.48,
    };
  }

  return {
    fillColor: "#f0c65a",
    color: "#9d7c23",
    fillOpacity: 0.4,
  };
}

function formatPopupHtml(properties: ZoneFeatureProperties): string {
  const zoneComplete = properties.ZONE_CMPLT ?? "Unknown zone";
  const category = classifyLiveWorkCategory(zoneComplete);
  const baseZone = extractBaseZone(zoneComplete) ?? "Unknown";

  return `
    <div style="display:grid;gap:0.45rem;">
      <strong style="font-size:1rem;">${zoneComplete}</strong>
      <div><strong>Base zone:</strong> ${baseZone}</div>
      <div><strong>Candidate strength:</strong> ${
        category ? getLiveWorkCategoryLabel(category) : "Not classified"
      }</div>
      <div><strong>City zoning family:</strong> ${properties.ZONING_DESCRIPTION ?? "Unavailable"}</div>
      <div style="color:rgba(247,240,227,0.72);font-size:0.9rem;">
        This is a screening label, not approval. Confirm the parcel in ZIMAS and with City Planning before relying on it.
      </div>
    </div>
  `;
}

function buildSummary(features: GeoJsonFeature[]): MapSummary {
  const zoneBases = new Set<string>();
  let specializedCount = 0;
  let officeAdjacentCount = 0;

  for (const feature of features) {
    const zoneComplete = feature.properties.ZONE_CMPLT;
    const category = classifyLiveWorkCategory(zoneComplete);
    const baseZone = extractBaseZone(zoneComplete);

    if (!category || !baseZone) {
      continue;
    }

    zoneBases.add(baseZone);

    if (category === "artistJointLivingWork") {
      specializedCount += 1;
      continue;
    }

    officeAdjacentCount += 1;
  }

  return {
    candidateCount: features.length,
    specializedCount,
    officeAdjacentCount,
    zoneBases: [...zoneBases].sort(),
  };
}

function isInsideWestLaViewport(latitude: number, longitude: number): boolean {
  return (
    latitude >= WEST_LA_VIEWPORT_BOUNDS.south &&
    latitude <= WEST_LA_VIEWPORT_BOUNDS.north &&
    longitude >= WEST_LA_VIEWPORT_BOUNDS.west &&
    longitude <= WEST_LA_VIEWPORT_BOUNDS.east
  );
}

function findMatchingFeature(
  features: GeoJsonFeature[],
  latitude: number,
  longitude: number,
): GeoJsonFeature | null {
  const point: GeoJsonPoint = [longitude, latitude];

  for (const feature of features) {
    if (isPointInsideGeometry(point, feature.geometry)) {
      return feature;
    }
  }

  return null;
}

function loadJsonp<T>(url: string, callbackParam: string = "callback"): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("JSONP lookup is only available in the browser"));
      return;
    }

    const callbackName = `packGeocodeCallback_${Math.random().toString(36).slice(2)}`;
    const script = window.document.createElement("script");
    const cleanup = () => {
      delete (window as Window & Record<string, unknown>)[callbackName];
      script.remove();
    };

    (window as Window & Record<string, unknown>)[callbackName] = (payload: T) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Geocoder script failed to load"));
    };
    script.src = `${url}&${callbackParam}=${callbackName}`;
    window.document.body.appendChild(script);
  });
}

async function geocodeAddress(addressQuery: string): Promise<{
  address: string;
  latitude: number;
  longitude: number;
}> {
  const params = new URLSearchParams({
    q: addressQuery,
    format: "jsonv2",
    limit: "1",
  });

  const payload = await loadJsonp<
    Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>
  >(`${WORLD_GEOCODER_URL}?${params.toString()}`, "json_callback");

  const candidate = payload[0];

  if (!candidate) {
    throw new Error("No matching address found");
  }

  return {
    address: candidate.display_name,
    longitude: Number(candidate.lon),
    latitude: Number(candidate.lat),
  };
}

const WestLaLiveWorkZoningPage: React.FC = () => {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const zoneFeaturesRef = useRef<GeoJsonFeature[]>([]);
  const [statusText, setStatusText] = useState(
    `Loading the ${SNAPSHOT_DATE_LABEL} zoning snapshot for the West LA view window…`,
  );
  const [summary, setSummary] = useState<MapSummary | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [searchStateText, setSearchStateText] = useState("");
  const [addressResult, setAddressResult] = useState<AddressSearchResult | null>(null);
  const [zillowImportText, setZillowImportText] = useState("");
  const [supportingImportText, setSupportingImportText] = useState("");
  const [listingFilters, setListingFilters] =
    useState<ListingScreenFilters>(DEFAULT_LISTING_FILTERS);
  const [listingStateText, setListingStateText] = useState("");
  const [listingWarnings, setListingWarnings] = useState<string[]>([]);
  const [screenedListings, setScreenedListings] =
    useState<ScreenedListingGroup[]>([]);

  useMountEffect(() => {
    let isCancelled = false;

    const initializeMap = async () => {
      const { default: L } = await import("leaflet");

      leafletRef.current = L;

      if (isCancelled || !mapElementRef.current) {
        return;
      }

      const map = L.map(mapElementRef.current, {
        zoomControl: true,
        preferCanvas: true,
      });

      mapRef.current = map;

      L.tileLayer(CARTO_TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const viewportBounds = L.latLngBounds(
        [WEST_LA_VIEWPORT_BOUNDS.south, WEST_LA_VIEWPORT_BOUNDS.west],
        [WEST_LA_VIEWPORT_BOUNDS.north, WEST_LA_VIEWPORT_BOUNDS.east],
      );

      map.fitBounds(viewportBounds, { padding: [18, 18] });

      L.rectangle(viewportBounds, {
        color: "#2f3b4a",
        dashArray: "8 8",
        weight: 1.2,
        fillOpacity: 0.02,
      })
        .bindTooltip("West LA map window", { sticky: true })
        .addTo(map);

      const response = await fetch("/data/west-la-live-work-zones.geojson");
      if (!response.ok) {
        throw new Error(`Zoning snapshot returned ${response.status}`);
      }

      const collection = (await response.json()) as GeoJsonFeatureCollection;
      const candidateFeatures = collection.features.filter((feature) =>
        Boolean(classifyLiveWorkCategory(feature.properties.ZONE_CMPLT)),
      );

      zoneFeaturesRef.current = candidateFeatures;

      const filteredSummary = buildSummary(candidateFeatures);

      L.geoJSON(
        {
          ...collection,
          features: candidateFeatures,
        } as never,
        {
          style: (feature) => {
            const category = classifyLiveWorkCategory(
              (feature?.properties as ZoneFeatureProperties | undefined)?.ZONE_CMPLT,
            );
            const style = getCategoryStyle(category ?? "adaptiveReuse");

            return {
              color: style.color,
              fillColor: style.fillColor,
              fillOpacity: style.fillOpacity,
              opacity: 0.92,
              weight: 1.1,
            };
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(
              formatPopupHtml((feature.properties ?? {}) as ZoneFeatureProperties),
            );
          },
        },
      ).addTo(map);

      if (!isCancelled) {
        setSummary(filteredSummary);
        setStatusText(
          `Loaded ${filteredSummary.candidateCount.toLocaleString()} candidate polygons in the West LA view window.`,
        );
      }
    };

    void initializeMap().catch((error: unknown) => {
      if (isCancelled) {
        return;
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusText(`Unable to load the zoning overlay: ${message}`);
    });

    return () => {
      isCancelled = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  });

  async function handleAddressSearch(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setSearchStateText("");
    setAddressResult(null);

    const trimmedQuery = addressQuery.trim();
    if (!trimmedQuery) {
      setSearchStateText("Enter an address in West LA or nearby first.");
      return;
    }

    if (!mapRef.current || !leafletRef.current || zoneFeaturesRef.current.length === 0) {
      setSearchStateText("The map is still loading. Try the search again in a moment.");
      return;
    }

    try {
      setSearchStateText("Looking up the address and checking the overlay…");

      const geocodedAddress = await geocodeAddress(trimmedQuery);
      const matchedFeature = findMatchingFeature(
        zoneFeaturesRef.current,
        geocodedAddress.latitude,
        geocodedAddress.longitude,
      );
      const category = matchedFeature
        ? classifyLiveWorkCategory(matchedFeature.properties.ZONE_CMPLT)
        : null;
      const zoneComplete = matchedFeature?.properties.ZONE_CMPLT ?? null;
      const zoneBase = zoneComplete ? extractBaseZone(zoneComplete) : null;

      markerRef.current?.remove();

      markerRef.current = leafletRef.current
        .marker([geocodedAddress.latitude, geocodedAddress.longitude])
        .addTo(mapRef.current)
        .bindPopup(
          `
            <div style="display:grid;gap:0.4rem;">
              <strong>${geocodedAddress.address}</strong>
              <div>${
                zoneComplete
                  ? `Candidate polygon: ${zoneComplete}`
                  : "No candidate polygon found at this point"
              }</div>
            </div>
          `,
        );

      markerRef.current.openPopup();
      mapRef.current.setView([geocodedAddress.latitude, geocodedAddress.longitude], 15, {
        animate: true,
      });

      const result: AddressSearchResult = {
        address: geocodedAddress.address,
        latitude: geocodedAddress.latitude,
        longitude: geocodedAddress.longitude,
        zoneComplete,
        zoneBase,
        zoneDescription: matchedFeature?.properties.ZONING_DESCRIPTION ?? null,
        category,
        isInsideWestLaViewport: isInsideWestLaViewport(
          geocodedAddress.latitude,
          geocodedAddress.longitude,
        ),
      };

      setAddressResult(result);
      setSearchStateText("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setSearchStateText(`Address lookup failed: ${message}`);
    }
  }

  async function resolveListingZoneMatches(
    normalizedAddresses: readonly string[],
    addressLookup: ReadonlyMap<string, string>,
  ): Promise<Map<string, ListingZoneLookup>> {
    const zoneMatches = new Map<string, ListingZoneLookup>();

    for (const normalizedAddress of normalizedAddresses) {
      const address = addressLookup.get(normalizedAddress);
      if (!address) {
        continue;
      }

      try {
        const geocodedAddress = await geocodeAddress(address);
        const matchedFeature = findMatchingFeature(
          zoneFeaturesRef.current,
          geocodedAddress.latitude,
          geocodedAddress.longitude,
        );

        zoneMatches.set(normalizedAddress, {
          geocodedAddress: geocodedAddress.address,
          latitude: geocodedAddress.latitude,
          longitude: geocodedAddress.longitude,
          zoneMatch: buildZoneMatch(
            matchedFeature?.properties.ZONE_CMPLT,
            matchedFeature?.properties.ZONING_DESCRIPTION,
          ),
        });
      } catch {
        zoneMatches.set(normalizedAddress, {
          geocodedAddress: address,
          latitude: Number.NaN,
          longitude: Number.NaN,
          zoneMatch: null,
        });
      }
    }

    return zoneMatches;
  }

  async function handleScreenListings(): Promise<void> {
    setListingWarnings([]);
    setScreenedListings([]);

    const trimmedZillowText = zillowImportText.trim();
    const trimmedSupportingText = supportingImportText.trim();

    if (!trimmedZillowText && !trimmedSupportingText) {
      setListingStateText("Paste Zillow rows and at least one supporting batch first.");
      return;
    }

    if (zoneFeaturesRef.current.length === 0) {
      setListingStateText("The zoning overlay is still loading. Try the listing screen in a moment.");
      return;
    }

    try {
      setListingStateText("Parsing listing rows, matching addresses, and checking zoning candidates…");

      const zillowImportResult = parseListingImportText(trimmedZillowText, "zillow");
      const supportingImportResult = parseListingImportText(trimmedSupportingText, "other");
      const allListings = [
        ...zillowImportResult.listings,
        ...supportingImportResult.listings,
      ];

      if (allListings.length === 0) {
        setListingStateText("No listings could be parsed from the pasted rows.");
        return;
      }

      const groupedListings = groupListingsByAddress(allListings);
      const addressLookup = new Map(
        groupedListings.map((group) => [group.normalizedAddress, group.displayAddress]),
      );
      const zoneMatches = await resolveListingZoneMatches(
        groupedListings.map((group) => group.normalizedAddress),
        addressLookup,
      );
      const screenedGroups = screenListingGroups(
        groupedListings,
        listingFilters,
        zoneMatches,
      ).sort((leftGroup, rightGroup) => {
        if (leftGroup.matchesFilters !== rightGroup.matchesFilters) {
          return leftGroup.matchesFilters ? -1 : 1;
        }

        return (rightGroup.maxSquareFeet ?? 0) - (leftGroup.maxSquareFeet ?? 0);
      });

      setListingWarnings([
        ...zillowImportResult.warnings,
        ...supportingImportResult.warnings,
      ]);
      setScreenedListings(screenedGroups);
      setListingStateText(
        `Screened ${screenedGroups.length} matched address groups from ${allListings.length} imported rows.`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setListingStateText(`Listing screen failed: ${message}`);
    }
  }

  const matchingListings = screenedListings.filter((group) => group.matchesFilters);

  return (
    <Page>
      <Helmet>
        <title>West LA Live/Work Zoning Viewer | Pack</title>
        <meta
          name="description"
          content="Interactive West Los Angeles map overlay showing official city zoning polygons screened for live/work-related candidate zones."
        />
      </Helmet>

      <Hero>
        <Kicker>West LA map tool</Kicker>
        <Title>West LA live/work zoning candidate viewer</Title>
        <Description>
          This page overlays current City of Los Angeles zoning polygons on a street
          basemap and marks parcels that look more relevant to live/work or office-adjacent
          screening. Red means a stronger specialized live/work candidate. Gold means an
          office-adjacent candidate that may be worth checking. Neither color means the
          parcel is automatically approved.
        </Description>
        <Note>
          Treat this as an orientation tool only. The safe question is never “is the zone
          colored?” It is “does this exact parcel, building, and occupancy legally allow
          how I want to live and staff it?” Always confirm the parcel in ZIMAS and the
          building’s actual occupancy before relying on it.
        </Note>
      </Hero>

      <SearchSection>
        <PanelTitle>Search by address</PanelTitle>
        <SearchRow onSubmit={(event) => void handleAddressSearch(event)}>
          <SearchInput
            aria-label="Search by address"
            placeholder="Enter a street address, for example 1149 S Broadway, Los Angeles, CA"
            value={addressQuery}
            onChange={(event) => setAddressQuery(event.target.value)}
          />
          <SearchButton type="submit">Find address</SearchButton>
        </SearchRow>
        <SearchHint>
          The search places a marker and tells you whether the point lands inside one of the
          candidate polygons shown on the map.
        </SearchHint>
        {searchStateText ? <SearchError>{searchStateText}</SearchError> : null}
        {addressResult ? (
          <SearchResultCard>
            <SearchResultTitle>{addressResult.address}</SearchResultTitle>
            <SearchResultLine>
              {addressResult.isInsideWestLaViewport
                ? "Inside the current West LA map window."
                : "Outside the current West LA map window, but still mapped for reference."}
            </SearchResultLine>
            <SearchResultLine>
              {addressResult.zoneComplete
                ? `Candidate match: ${addressResult.zoneComplete} (${addressResult.zoneBase ?? "unknown base"}).`
                : "No candidate polygon matched this point in the current overlay snapshot."}
            </SearchResultLine>
            <SearchResultLine>
              {addressResult.category
                ? `Candidate strength: ${getLiveWorkCategoryLabel(addressResult.category)}.`
                : "Candidate strength: none from this overlay."}
            </SearchResultLine>
            {addressResult.zoneDescription ? (
              <SearchResultLine>
                City zoning family: {addressResult.zoneDescription}
              </SearchResultLine>
            ) : null}
          </SearchResultCard>
        ) : null}
      </SearchSection>

      <WorkspaceSection>
        <PanelTitle>Listing screening workspace</PanelTitle>
        <WorkspaceIntro>
          Paste Zillow rows plus rows from Redfin, Realtor, LoopNet, or another source.
          The tool matches them by address, keeps Zillow as the primary listing view,
          geocodes the address, checks the zoning overlay, and filters for the live/work
          constraints you described: roughly 1,500+ sqft, workspace language, and a
          private bedroom with an ensuite signal. This is an intake-and-match tool, not a
          direct website scraper.
        </WorkspaceIntro>

        <ImportGrid>
          <ImportCard>
            <ImportLabel>Zillow rows</ImportLabel>
            <ImportHelp>
              Paste CSV, TSV, or JSON rows with at least an <code>address</code> column.
              Helpful columns are <code>sqft</code>, <code>beds</code>, <code>baths</code>,
              <code>title</code>, <code>description</code>, and <code>url</code>.
            </ImportHelp>
            <ImportTextarea
              aria-label="Paste Zillow rows"
              placeholder={[
                'address,sqft,beds,baths,title,description,url',
                '"1315 Innes Pl, Venice, CA 90291",2200,2,2,"Creative live/work loft","Separate office, balcony, primary suite with ensuite bath","https://www.zillow.com/..."',
              ].join("\n")}
              value={zillowImportText}
              onChange={(event) => setZillowImportText(event.target.value)}
            />
          </ImportCard>

          <ImportCard>
            <ImportLabel>Supporting rows</ImportLabel>
            <ImportHelp>
              Paste the same addresses from other sources to increase confidence and pull in
              details Zillow may not emphasize, such as studio, office, guest suite, or
              creative workspace language.
            </ImportHelp>
            <ImportTextarea
              aria-label="Paste supporting rows"
              placeholder={[
                'source\taddress\tsqft\tbeds\tbaths\tdescription\turl',
                'Redfin\t1315 S Innes Pl, Venice, CA 90291\t2100\t2\t2\tCreative live/work with private suite and office\thttps://www.redfin.com/...',
              ].join("\n")}
              value={supportingImportText}
              onChange={(event) => setSupportingImportText(event.target.value)}
            />
          </ImportCard>
        </ImportGrid>

        <FilterGrid>
          <FilterCard>
            <ImportLabel>Size floor</ImportLabel>
            <FilterNumberInput
              aria-label="Minimum square feet"
              type="number"
              min="0"
              step="50"
              value={listingFilters.minSquareFeet}
              onChange={(event) =>
                setListingFilters((currentFilters) => ({
                  ...currentFilters,
                  minSquareFeet: Number(event.target.value) || 0,
                }))
              }
            />
          </FilterCard>

          <FilterCard>
            <ImportLabel>Required signals</ImportLabel>
            <FilterLabel>
              <input
                type="checkbox"
                checked={listingFilters.requireCandidateZone}
                onChange={(event) =>
                  setListingFilters((currentFilters) => ({
                    ...currentFilters,
                    requireCandidateZone: event.target.checked,
                  }))
                }
              />
              Require current candidate zoning overlay match
            </FilterLabel>
            <FilterLabel>
              <input
                type="checkbox"
                checked={listingFilters.requireWorkspaceSignal}
                onChange={(event) =>
                  setListingFilters((currentFilters) => ({
                    ...currentFilters,
                    requireWorkspaceSignal: event.target.checked,
                  }))
                }
              />
              Require office or workspace language
            </FilterLabel>
            <FilterLabel>
              <input
                type="checkbox"
                checked={listingFilters.requirePrivateSuiteSignal}
                onChange={(event) =>
                  setListingFilters((currentFilters) => ({
                    ...currentFilters,
                    requirePrivateSuiteSignal: event.target.checked,
                  }))
                }
              />
              Require separate bedroom and ensuite signal
            </FilterLabel>
          </FilterCard>

          <FilterCard>
            <ImportLabel>Source requirements</ImportLabel>
            <FilterLabel>
              <input
                type="checkbox"
                checked={listingFilters.requireZillow}
                onChange={(event) =>
                  setListingFilters((currentFilters) => ({
                    ...currentFilters,
                    requireZillow: event.target.checked,
                  }))
                }
              />
              Keep Zillow as the primary listing source
            </FilterLabel>
            <FilterLabel>
              <input
                type="checkbox"
                checked={listingFilters.requireSupportingSource}
                onChange={(event) =>
                  setListingFilters((currentFilters) => ({
                    ...currentFilters,
                    requireSupportingSource: event.target.checked,
                  }))
                }
              />
              Require at least one supporting source
            </FilterLabel>
          </FilterCard>
        </FilterGrid>

        <ActionRow>
          <SearchButton type="button" onClick={() => void handleScreenListings()}>
            Screen listings
          </SearchButton>
          <SecondaryButton
            type="button"
            onClick={() => {
              setZillowImportText("");
              setSupportingImportText("");
              setListingWarnings([]);
              setScreenedListings([]);
              setListingStateText("");
            }}
          >
            Clear workspace
          </SecondaryButton>
        </ActionRow>

        {listingStateText ? <SearchHint>{listingStateText}</SearchHint> : null}
        {listingWarnings.length > 0 ? (
          <SearchError>{listingWarnings.join(" ")}</SearchError>
        ) : null}

        {screenedListings.length > 0 ? (
          <>
            <MetricGrid>
              <MetricCard>
                <MetricLabel>Matched groups</MetricLabel>
                <MetricValue>{screenedListings.length}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Passing filters</MetricLabel>
                <MetricValue>{matchingListings.length}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Zillow-backed</MetricLabel>
                <MetricValue>
                  {screenedListings.filter((group) => group.hasZillow).length}
                </MetricValue>
              </MetricCard>
            </MetricGrid>

            <ListingResults>
              {screenedListings.map((group) => (
                <ListingCard key={group.id}>
                  <ListingTitleRow>
                    <ListingTitle>{group.displayAddress}</ListingTitle>
                    <ResultMeta>
                      <ResultChip $tone={group.matchesFilters ? "good" : "warn"}>
                        {group.matchesFilters ? "Matches current filters" : "Needs review"}
                      </ResultChip>
                      {group.maxSquareFeet ? (
                        <ResultChip>{group.maxSquareFeet.toLocaleString()} sqft</ResultChip>
                      ) : null}
                      {group.bedrooms ? (
                        <ResultChip>{group.bedrooms} bd</ResultChip>
                      ) : null}
                      {group.bathrooms ? (
                        <ResultChip>{group.bathrooms} ba</ResultChip>
                      ) : null}
                    </ResultMeta>
                  </ListingTitleRow>

                  <ListingCopy>
                    {group.geocodedAddress
                      ? `Geocoded as ${group.geocodedAddress}.`
                      : "No geocoded match stored yet."}{" "}
                    {group.zoneMatch
                      ? describeZoneMatch(group.zoneMatch)
                      : "No candidate zoning match found yet."}
                  </ListingCopy>

                  <ResultMeta>
                    {group.sourceLabels.map((label) => (
                      <ResultChip key={label}>{label}</ResultChip>
                    ))}
                    {group.mentionsWorkspace ? (
                      <ResultChip $tone="good">Workspace signal</ResultChip>
                    ) : null}
                    {group.likelySeparateBedroomSuite ? (
                      <ResultChip $tone="good">Private suite signal</ResultChip>
                    ) : null}
                  </ResultMeta>

                  <ListingCopy>
                    Strong signals:{" "}
                    {group.reasons.length > 0
                      ? group.reasons.join(" • ")
                      : "none yet from the imported rows."}
                  </ListingCopy>
                  {!group.matchesFilters && group.blockers.length > 0 ? (
                    <ListingCopy>
                      Missing pieces: {group.blockers.join(" • ")}
                    </ListingCopy>
                  ) : null}

                  <LinkRow>
                    {group.zillowUrl ? (
                      <InlineLink
                        href={group.zillowUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Zillow
                      </InlineLink>
                    ) : null}
                    {Object.entries(group.sourceUrls)
                      .filter(([source]) => source !== "zillow")
                      .map(([source, url]) => (
                        <InlineLink
                          key={`${group.id}-${source}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open {getListingSourceLabel(source as Parameters<typeof getListingSourceLabel>[0])}
                        </InlineLink>
                      ))}
                  </LinkRow>
                </ListingCard>
              ))}
            </ListingResults>
          </>
        ) : null}
      </WorkspaceSection>

      <InfoGrid>
        <MapCard>
          <MetricGrid>
            <MetricCard>
              <MetricLabel>Candidate polygons</MetricLabel>
              <MetricValue>
                {summary ? summary.candidateCount.toLocaleString() : "…"}
              </MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Specialized live/work</MetricLabel>
              <MetricValue>
                {summary ? summary.specializedCount.toLocaleString() : "…"}
              </MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Office-adjacent</MetricLabel>
              <MetricValue>
                {summary ? summary.officeAdjacentCount.toLocaleString() : "…"}
              </MetricValue>
            </MetricCard>
          </MetricGrid>
          <MapFrame>
            <div ref={mapElementRef} />
          </MapFrame>
          <StatusText>{statusText}</StatusText>
        </MapCard>

        <Sidebar>
          <Panel>
            <PanelTitle>Legend</PanelTitle>
            <LegendRow>
              <LegendSwatch $background="#c94f4f" $border="#8d1f2d" />
              Stronger specialized live/work candidate, but not parcel approval
            </LegendRow>
            <LegendRow>
              <LegendSwatch $background="#f0c65a" $border="#9d7c23" />
              Office-adjacent candidate worth checking, but not parcel approval
            </LegendRow>
            <LegendRow>
              <LegendSwatch $background="rgba(47,59,74,0.08)" $border="#2f3b4a" />
              West LA map window
            </LegendRow>
          </Panel>

          <Panel>
            <PanelTitle>How to read this</PanelTitle>
            <StatusText>
              For a normal software company, gold can be more practical than red because it
              points toward office-capable or mixed-use areas. Red is often more specialized
              and still needs parcel-level confirmation.
            </StatusText>
            <StatusText>
              If you want several employees working onsite, assume you need a parcel and
              building that lawfully support office use, not just a residence with a home
              occupation.
            </StatusText>
          </Panel>

          <Panel>
            <PanelTitle>Zone bases present</PanelTitle>
            {summary ? (
              <ZoneList>
                {summary.zoneBases.map((zoneBase) => (
                  <ZoneChip key={zoneBase}>{zoneBase}</ZoneChip>
                ))}
              </ZoneList>
            ) : (
              <StatusText>Waiting for city zoning data…</StatusText>
            )}
          </Panel>

          <Panel>
            <PanelTitle>Sources</PanelTitle>
            <SourceList>
              <li>
                <a href={`${ZONING_LAYER_URL}?f=pjson`} target="_blank" rel="noreferrer">
                  City Planning generalized zoning layer
                </a>
              </li>
              <li>Overlay snapshot pulled from the official zoning layer on {SNAPSHOT_DATE_LABEL}</li>
              <li>
                <a href={WESTSIDE_PLAN_URL} target="_blank" rel="noreferrer">
                  Los Angeles City Planning westside plan update
                </a>
              </li>
              <li>
                <a href={FORMS_URL} target="_blank" rel="noreferrer">
                  City Planning forms page and current ZIMAS verification path
                </a>
              </li>
              <li>
                <a href={ZIMAS_URL} target="_blank" rel="noreferrer">
                  ZIMAS parcel lookup
                </a>
              </li>
            </SourceList>
          </Panel>
        </Sidebar>
      </InfoGrid>
    </Page>
  );
};

export default WestLaLiveWorkZoningPage;
