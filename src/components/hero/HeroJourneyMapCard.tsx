import React from "react";
import styled from "styled-components";
import {
  MAP_STYLE,
  visitedCountryNames,
  WORLD_MAP_DIMENSIONS,
  worldPathData,
  worldProjectedPoints,
} from "./heroJourneyMapData";

const MapCard = styled.div`
  display: grid;
  gap: 0.34rem;
`;

const MapCardTitle = styled.h5`
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.92rem;
  font-weight: 700;
`;

const MapCardMeta = styled.p`
  margin: -0.1rem 0 0;
  text-align: center;
  color: rgba(174, 174, 174, 0.94);
  font-size: 0.56rem;
`;

const MiniMapFrame = styled.div`
  padding: 0.84rem;
  border-radius: 1.06rem;
  background: #303030;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22);
`;

const MiniMapNote = styled.p`
  margin: 0;
  text-align: center;
  color: rgba(174, 174, 174, 0.86);
  font-size: 0.5rem;
  line-height: 1.12;
`;

const MiniMapSvg = styled.svg`
  width: auto;
  height: 6.8rem;
  max-width: 100%;
  display: block;
  margin: 0 auto;
`;

const HeroJourneyMapCard: React.FC = () => {
  return (
    <MapCard>
      <MapCardTitle>Countries visited</MapCardTitle>
      <MapCardMeta>Visited countries are highlighted in yellow</MapCardMeta>
      <MiniMapFrame>
        <MiniMapSvg
          viewBox={`0 0 ${WORLD_MAP_DIMENSIONS.width} ${WORLD_MAP_DIMENSIONS.height}`}
          role="img"
          aria-label="World map with visited countries highlighted in yellow"
        >
          {worldPathData.map((path) => (
            <path
              key={path.id}
              d={path.d}
              fill={visitedCountryNames.has(path.name) ? MAP_STYLE.highlightFill : MAP_STYLE.baseFill}
              stroke={MAP_STYLE.stroke}
              strokeWidth={MAP_STYLE.strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {worldProjectedPoints.map((point) => (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={Math.min(5, 2 + Math.log(point.visits + 1))}
              fill={MAP_STYLE.dotColor}
              stroke={MAP_STYLE.dotStrokeColor}
              strokeWidth={MAP_STYLE.dotStrokeWidth}
            />
          ))}
        </MiniMapSvg>
        <MiniMapNote>
          Example stats card showing the countries layer from the real trips map in a simpler phone-sized view.
        </MiniMapNote>
      </MiniMapFrame>
    </MapCard>
  );
};

export default HeroJourneyMapCard;
