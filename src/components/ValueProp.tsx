import React from "react";
import styled, { keyframes } from "styled-components";
import { useI18n } from "@/i18n/I18nProvider";
import AccentWord from "./AccentWord";

const sweep = keyframes`
  0% {
    transform: translateX(-18%);
    opacity: 0;
  }
  20%, 80% {
    opacity: 1;
  }
  100% {
    transform: translateX(112%);
    opacity: 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.72;
  }
  50% {
    transform: scale(1.14);
    opacity: 1;
  }
`;

const Section = styled.section`
  display: grid;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: end;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  max-width: 11ch;
  font-size: clamp(2.4rem, 5vw, 4.4rem);
  font-weight: 800;
  line-height: 0.96;
`;

const Microcopy = styled.p`
  margin: 0;
  max-width: 20rem;
  font-size: 0.98rem;
  color: rgba(247, 240, 227, 0.82);
  line-height: 1.5;
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;

  @media (min-width: 980px) {
    grid-template-columns: 1.15fr 0.85fr 0.85fr;
  }
`;

const Tile = styled.article<{ $large?: boolean; $accent?: "gold" | "red" | "green" }>`
  position: relative;
  min-height: ${({ $large }) => ($large ? "22rem" : "17rem")};
  padding: 1.25rem;
  border-radius: 1.7rem;
  overflow: hidden;
  border: 1px solid rgba(243, 210, 122, 0.14);
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.05), rgba(255, 248, 236, 0.02)),
    radial-gradient(circle at top right, ${({ $accent = "gold" }) =>
      $accent === "red"
        ? "rgba(231, 35, 64, 0.18)"
        : $accent === "green"
          ? "rgba(101, 184, 159, 0.18)"
          : "rgba(243, 210, 122, 0.18)"}, transparent 32%);
  box-shadow: var(--shadow-soft);

  &::after {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 30%;
    background: linear-gradient(90deg, rgba(243, 210, 122, 0), rgba(243, 210, 122, 0.1), rgba(243, 210, 122, 0));
    filter: blur(8px);
    animation: ${sweep} 6s linear infinite;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
  }
`;

const TileTop = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: rgba(255, 248, 236, 0.88);
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.65rem;
  border-radius: 999px;
  background: rgba(10, 9, 8, 0.58);
  border: 1px solid rgba(255, 248, 236, 0.18);
  backdrop-filter: blur(12px);
`;

const TileBody = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
`;

const TileTitle = styled.h3`
  margin: 0;
  color: rgba(255, 248, 236, 0.94);
  font-size: clamp(1.8rem, 3vw, 3rem);
  line-height: 0.92;
`;

const TileCopy = styled.p`
  margin: 0;
  max-width: 16rem;
  color: rgba(255, 248, 236, 0.84);
  line-height: 1.6;
  text-wrap: pretty;
`;

const Rails = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const Rail = styled.div`
  display: grid;
  gap: 0.3rem;
  padding: 0.72rem 0.82rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 248, 236, 0.08);
`;

const RailLabel = styled.span`
  color: rgba(247, 240, 227, 0.56);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const RailValue = styled.span`
  color: rgba(255, 248, 236, 0.94);
  font-size: 0.94rem;
  font-weight: 700;
`;

const IndicatorRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Indicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 248, 236, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 248, 236, 0.78);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &::before {
    content: "";
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 999px;
    background: #65b89f;
    box-shadow: 0 0 0 0.24rem rgba(101, 184, 159, 0.12);
    animation: ${pulse} 1.9s ease-in-out infinite;
  }
`;

const valuePropContent = {
  en: {
    titleSuffix: ", not responses.",
    microcopy:
      "The output should already look like the JFK to Barcelona trip above, not a chat thread full of suggestions.",
    tiles: [
      {
        title: "A real itinerary",
        copy: "The first result is the JFK to Barcelona trip itself, with flights, hotel dates, and key moments already mapped out.",
        label: "Input",
        meta: "JFK to Barcelona",
        large: true,
        accent: "gold" as const,
        rails: [
          { label: "Flights", value: "JFK to BCN • BCN to JFK" },
          { label: "Hotels", value: "Hotel Arts Barcelona • 8 nights" },
          { label: "Moments", value: "Barceloneta check-in • Sagrada dinner • Montjuic evening" },
        ],
        indicators: ["Flights", "Hotels", "Events"],
      },
      {
        title: "Live when it matters",
        copy: "Once that Barcelona trip is underway, the important parts stay live: departure timing, baggage, and what to do next.",
        label: "Live state",
        meta: "JFK departure",
        accent: "red" as const,
        rails: [
          { label: "Departure", value: "Leave in 35m • Boards 11:30 at JFK" },
          { label: "Arrival", value: "Land in Barcelona • Hotel Arts next" },
        ],
        indicators: ["Lock screen", "Maps", "Uber"],
      },
      {
        title: "Everything in place",
        copy: "You can understand that Barcelona trip in seconds: where you fly, where you stay, and what is scheduled around it.",
        label: "Trip view",
        meta: "Barcelona in May",
        accent: "green" as const,
        rails: [
          { label: "Stay", value: "8 nights in Barcelona" },
          { label: "Schedule", value: "Beach arrival • Sagrada dinner • Montjuic rooftop" },
        ],
        indicators: ["Clear view", "Scheduled", "Ready to review"],
      },
    ],
  },
  es: {
    titleSuffix: ", no respuestas.",
    microcopy:
      "La salida debería parecerse al viaje JFK a Barcelona de arriba, no a un chat lleno de sugerencias.",
    tiles: [
      {
        title: "Un itinerario real",
        copy: "El primer resultado es el viaje JFK a Barcelona en sí, con vuelos, fechas de hotel y momentos clave ya organizados.",
        label: "Entrada",
        meta: "JFK a Barcelona",
        large: true,
        accent: "gold" as const,
        rails: [
          { label: "Vuelos", value: "JFK a BCN • BCN a JFK" },
          { label: "Hoteles", value: "Hotel Arts Barcelona • 8 noches" },
          { label: "Momentos", value: "Check-in Barceloneta • cena en Sagrada • noche en Montjuic" },
        ],
        indicators: ["Vuelos", "Hoteles", "Eventos"],
      },
      {
        title: "En vivo cuando importa",
        copy: "Cuando ese viaje a Barcelona ya está en marcha, lo importante sigue vivo: salida, equipaje y qué hacer después.",
        label: "Estado en vivo",
        meta: "Salida JFK",
        accent: "red" as const,
        rails: [
          { label: "Salida", value: "Sales en 35 m • Embarca 11:30 en JFK" },
          { label: "Llegada", value: "Aterriza en Barcelona • Hotel Arts después" },
        ],
        indicators: ["Pantalla bloqueada", "Mapas", "Uber"],
      },
      {
        title: "Todo en su sitio",
        copy: "Puedes entender ese viaje a Barcelona en segundos: dónde vuelas, dónde te quedas y qué está programado alrededor.",
        label: "Vista del viaje",
        meta: "Barcelona en mayo",
        accent: "green" as const,
        rails: [
          { label: "Estadía", value: "8 noches en Barcelona" },
          { label: "Agenda", value: "Llegada a la playa • cena en Sagrada • rooftop en Montjuic" },
        ],
        indicators: ["Vista clara", "Programado", "Listo para revisar"],
      },
    ],
  },
} as const;

const ValueProp: React.FC = () => {
  const { locale } = useI18n();
  const content = valuePropContent[locale] ?? valuePropContent.en;

  return (
    <Section>
      <Header>
        <Title><AccentWord>Results</AccentWord>{content.titleSuffix}</Title>
        <Microcopy>{content.microcopy}</Microcopy>
      </Header>

      <Grid>
        {content.tiles.map((tile) => (
          <Tile key={tile.title} $large={tile.large} $accent={tile.accent}>
            <TileTop>
              <Chip>{tile.label}</Chip>
              <span>{tile.meta}</span>
            </TileTop>

            <TileBody>
              <TileTitle>{tile.title}</TileTitle>
              <TileCopy>{tile.copy}</TileCopy>
              <Rails>
                {tile.rails.map((rail) => (
                  <Rail key={rail.label}>
                    <RailLabel>{rail.label}</RailLabel>
                    <RailValue>{rail.value}</RailValue>
                  </Rail>
                ))}
              </Rails>
              <IndicatorRow>
                {tile.indicators.map((indicator) => (
                  <Indicator key={indicator}>{indicator}</Indicator>
                ))}
              </IndicatorRow>
            </TileBody>
          </Tile>
        ))}
      </Grid>
    </Section>
  );
};

export default ValueProp;
