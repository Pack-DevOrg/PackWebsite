import React, { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import styled from "styled-components";
import "leaflet/dist/leaflet.css";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  classifyLiveWorkCategory,
  extractBaseZone,
  getLiveWorkCategoryLabel,
  WEST_LA_VIEWPORT_BOUNDS,
  type LiveWorkCategory,
} from "@/utils/westLaLiveWorkZoning";

type ZoneFeatureProperties = {
  ZONE_CMPLT?: string;
  ZONING_DESCRIPTION?: string;
};

type GeoJsonFeature = {
  type: "Feature";
  properties: ZoneFeatureProperties;
  geometry: unknown;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

type MapSummary = {
  candidateCount: number;
  artistCount: number;
  adaptiveReuseCount: number;
  zoneBases: string[];
};

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
  max-width: 70ch;
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
      <div><strong>Screening bucket:</strong> ${
        category ? getLiveWorkCategoryLabel(category) : "Not classified"
      }</div>
      <div><strong>City zoning family:</strong> ${properties.ZONING_DESCRIPTION ?? "Unavailable"}</div>
      <div style="color:rgba(247,240,227,0.72);font-size:0.9rem;">
        Use this as a zoning screen only. Confirm the parcel in ZIMAS and with City Planning before relying on it.
      </div>
    </div>
  `;
}

function buildSummary(features: GeoJsonFeature[]): MapSummary {
  const zoneBases = new Set<string>();
  let artistCount = 0;
  let adaptiveReuseCount = 0;

  for (const feature of features) {
    const zoneComplete = feature.properties.ZONE_CMPLT;
    const category = classifyLiveWorkCategory(zoneComplete);
    const baseZone = extractBaseZone(zoneComplete);

    if (!category || !baseZone) {
      continue;
    }

    zoneBases.add(baseZone);

    if (category === "artistJointLivingWork") {
      artistCount += 1;
      continue;
    }

    adaptiveReuseCount += 1;
  }

  return {
    candidateCount: features.length,
    artistCount,
    adaptiveReuseCount,
    zoneBases: [...zoneBases].sort(),
  };
}

const WestLaLiveWorkZoningPage: React.FC = () => {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const [statusText, setStatusText] = useState(
    `Loading the ${SNAPSHOT_DATE_LABEL} zoning snapshot for the West LA view window…`,
  );
  const [summary, setSummary] = useState<MapSummary | null>(null);

  useMountEffect(() => {
    let isCancelled = false;
    let mapInstance: { remove: () => void } | null = null;

    const initializeMap = async () => {
      const { default: L } = await import("leaflet");

      if (isCancelled || !mapElementRef.current) {
        return;
      }

      const map = L.map(mapElementRef.current, {
        zoomControl: true,
        preferCanvas: true,
      });

      mapInstance = map;

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
        throw new Error(`Zoning service returned ${response.status}`);
      }

      const collection = (await response.json()) as GeoJsonFeatureCollection;
      const candidateFeatures = collection.features.filter((feature) =>
        Boolean(classifyLiveWorkCategory(feature.properties.ZONE_CMPLT)),
      );

      const filteredCollection: GeoJsonFeatureCollection = {
        ...collection,
        features: candidateFeatures,
      };

      const filteredSummary = buildSummary(candidateFeatures);

      L.geoJSON(filteredCollection as never, {
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
      }).addTo(map);

      if (!isCancelled) {
        setSummary(filteredSummary);
        setStatusText(
          `Loaded ${filteredSummary.candidateCount.toLocaleString()} zoning polygons in the West LA view window.`,
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
      mapInstance?.remove();
    };
  });

  return (
    <Page>
      <Helmet>
        <title>West LA Live/Work Zoning Viewer | Pack</title>
        <meta
          name="description"
          content="Interactive West Los Angeles map overlay showing official city zoning polygons screened for live/work-related zones."
        />
      </Helmet>

      <Hero>
        <Kicker>West LA map tool</Kicker>
        <Title>West LA live/work zoning overlay</Title>
        <Description>
          This page overlays current City of Los Angeles zoning polygons on a
          street basemap and highlights the zones most commonly used for
          live/work screening. Red polygons mark artist joint living/work
          screening zones. Gold polygons mark adaptive reuse screening zones.
        </Description>
        <Note>
          This is a zoning-screening view, not a legal determination. The City
          can layer additional qualifiers, overlays, and parcel-specific rules on
          top of the base zone. Use the popups here to orient yourself, then
          verify any parcel in ZIMAS before relying on it.
        </Note>
      </Hero>

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
              <MetricLabel>Artist live/work screen</MetricLabel>
              <MetricValue>
                {summary ? summary.artistCount.toLocaleString() : "…"}
              </MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Adaptive reuse screen</MetricLabel>
              <MetricValue>
                {summary ? summary.adaptiveReuseCount.toLocaleString() : "…"}
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
              Artist joint living/work screening
            </LegendRow>
            <LegendRow>
              <LegendSwatch $background="#f0c65a" $border="#9d7c23" />
              Adaptive reuse screening
            </LegendRow>
            <LegendRow>
              <LegendSwatch $background="rgba(47,59,74,0.08)" $border="#2f3b4a" />
              West LA map window
            </LegendRow>
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
