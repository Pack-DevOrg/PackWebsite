import React from "react";
import {
  BedDouble,
  Building2,
  CalendarDays,
  CarFront,
  MapPinned,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Ticket,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import styled from "styled-components";
import packLogo from "../assets/logo.png";
import AccentWord from "./AccentWord";
import { useMountEffect } from "@/hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";

type AccentTone = "flight" | "ground";
type IconKey =
  | "plane-takeoff"
  | "plane"
  | "plane-landing"
  | "bed"
  | "calendar"
  | "car"
  | "building"
  | "seat"
  | "map"
  | "wifi";

type MetricCard = {
  title: string;
  value: string;
  detail?: string;
  hideTitle?: boolean;
  tone?: "accent" | "warning" | "neutral";
};

type ActionItem = {
  label: string;
  icon: IconKey;
  primary?: boolean;
};

type ActionRow = {
  label: string;
  actions: ActionItem[];
};

type LiveState = {
  key: string;
  accent: AccentTone;
  label: string;
  title: string;
  relativeCountdown: string;
  icon: IconKey;
  statusBar: {
    accent?: AccentTone;
    leadingText?: string;
    countdownToken: string;
    countdownCaption: string;
    endLabel?: string;
    progressFraction: number;
    reservedFraction: number;
    usesEndpointLabelStyleForEndText?: boolean;
  };
  shownMetrics: MetricCard[];
  actionRows: ActionRow[];
  top: string;
  left: string;
  rotate: string;
};

const toneColors: Record<AccentTone, { accent: string; accentSoft: string; glow: string }> = {
  flight: {
    accent: "#f0c62d",
    accentSoft: "rgba(240, 198, 45, 0.18)",
    glow: "rgba(240, 198, 45, 0.12)",
  },
  ground: {
    accent: "#7ed38b",
    accentSoft: "rgba(126, 211, 139, 0.18)",
    glow: "rgba(126, 211, 139, 0.12)",
  },
};

const metricToneColors = {
  accent: {
    background: "rgba(240, 198, 45, 0.12)",
    border: "rgba(240, 198, 45, 0.2)",
    value: "#f7d661",
  },
  warning: {
    background: "rgba(255, 175, 72, 0.12)",
    border: "rgba(255, 175, 72, 0.2)",
    value: "#ffcc86",
  },
  neutral: {
    background: "rgba(255, 255, 255, 0.045)",
    border: "rgba(255, 255, 255, 0.08)",
    value: "rgba(255, 255, 255, 0.95)",
  },
} as const;

const iconMap: Record<IconKey, LucideIcon> = {
  "plane-takeoff": PlaneTakeoff,
  plane: Plane,
  "plane-landing": PlaneLanding,
  bed: BedDouble,
  calendar: CalendarDays,
  car: CarFront,
  building: Building2,
  seat: Ticket,
  map: MapPinned,
  wifi: Wifi,
};

const Section = styled.section`
  display: grid;
  gap: 1.25rem;
  padding: 0.5rem 0 4rem;

  @media (max-width: 860px) {
    gap: 1.7rem;
    padding: 1rem 0 4.6rem;
  }
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: end;
  justify-content: space-between;

  @media (max-width: 860px) {
    gap: 1rem;
    padding: 0 0.25rem;
  }
`;

const Title = styled.h2`
  margin: 0;
  max-width: 10ch;
  font-size: clamp(2.3rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1;
`;

const Microcopy = styled.p`
  margin: 0;
  max-width: 28rem;
  color: rgba(247, 240, 227, 0.78);
  font-size: 0.98rem;
  line-height: 1.5;

  @media (max-width: 860px) {
    max-width: 100%;
    font-size: 1rem;
    line-height: 1.6;
  }
`;

const Pile = styled.div`
  position: relative;
  min-height: 59rem;

  @media (max-width: 860px) {
    min-height: 89rem;
    padding: 0 0.35rem;
  }
`;

const Card = styled.article<{
  $visible: boolean;
  $index: number;
  $top: string;
  $left: string;
  $rotate: string;
}>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: min(31rem, calc(100% - 1rem));
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $visible, $rotate }) =>
    $visible
      ? `translate3d(0, 0, 0) rotate(${$rotate})`
      : `translate3d(0, -110px, 0) rotate(calc(${$rotate} - 7deg))`};
  transition:
    transform 760ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 420ms ease-out;
  transition-delay: ${({ $index }) => `${$index * 110}ms`};
  z-index: ${({ $index }) => 10 - $index};
  will-change: transform, opacity;

  @media (max-width: 860px) {
    left: 0;
    top: ${({ $index }) => `${$index * 21.5}rem`};
    width: 100%;
    transform: ${({ $visible }) =>
      $visible ? "translate3d(0, 0, 0) rotate(0deg)" : "translate3d(0, -70px, 0) rotate(0deg)"};
  }
`;

const LockScreenCropFrame = styled.div`
  width: min(100%, 393px);
  aspect-ratio: 393 / 326;
  border-radius: 34px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 28px 60px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);

  @media (max-width: 860px) {
    width: min(100%, 378px);
    border-radius: 32px;
  }
`;

const LockScreenCrop = styled.div<{ $accent: AccentTone }>`
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0.9rem 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:
    radial-gradient(circle at top center, ${({ $accent }) => toneColors[$accent].glow}, transparent 24%),
    linear-gradient(180deg, rgba(42, 42, 42, 0.92) 0%, rgba(20, 20, 20, 1) 54%, rgba(9, 9, 9, 1) 100%);

  @media (max-width: 860px) {
    padding: 1rem 1.05rem 1.3rem;
  }
`;

const LockScreenNotch = styled.div`
  width: 126px;
  height: 34px;
  border-radius: 999px;
  background: rgba(5, 5, 5, 0.98);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
`;

const LockScreenTime = styled.div`
  margin-top: 0.5rem;
  font-size: 3rem;
  font-weight: 300;
  line-height: 0.92;
  letter-spacing: -0.04em;
  color: rgba(255, 255, 255, 0.94);
`;

const LockScreenDate = styled.div`
  margin-top: 0.18rem;
  font-size: 0.84rem;
  color: rgba(255, 255, 255, 0.62);
  letter-spacing: 0.02em;
`;

const LockScreenActivityWrap = styled.div`
  margin-top: 0.95rem;
  width: 361px;

  @media (max-width: 860px) {
    margin-top: 1.15rem;
    width: min(100%, 340px);
  }
`;

const LiveActivityFrame = styled.div<{ $accent: AccentTone }>`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 361px;
  padding: 10px;
  border-radius: 26px;
  background:
    linear-gradient(
      135deg,
      rgba(18, 18, 18, 0.98),
      rgba(30, 30, 30, 0.94) 64%,
      ${({ $accent }) => toneColors[$accent].glow}
    );
  border: 1px solid ${({ $accent }) => toneColors[$accent].accentSoft};

  @media (max-width: 860px) {
    gap: 6px;
    width: min(100%, 340px);
    padding: 12px;
    border-radius: 24px;
  }
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px;
  align-items: start;
`;

const DoneLogo = styled.img<{ $size: number }>`
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  object-fit: contain;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const TitleRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: start;
  min-height: 24px;
`;

const LiveTitle = styled.div`
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.12;
  color: rgba(255, 255, 255, 0.96);
`;

const CountdownCluster = styled.div`
  min-width: 58px;
  display: flex;
  justify-content: flex-end;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.76rem;
  font-weight: 600;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-family:
    SFMono-Regular,
    ui-monospace,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;
`;

const StatusFrame = styled.div<{ $accent: AccentTone }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 8px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid ${({ $accent }) => toneColors[$accent].accentSoft};
`;

const StatusRow = styled.div<{ $hasLeading: boolean }>`
  display: grid;
  grid-template-columns: ${({ $hasLeading }) =>
    $hasLeading ? "max-content minmax(0, 1fr) max-content" : "minmax(0, 1fr) max-content"};
  gap: 8px;
  align-items: center;
`;

const LeadingText = styled.div`
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.64);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Track = styled.div`
  position: relative;
  height: 6px;
  overflow: visible;
`;

const TrackClip = styled.div`
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $width: number; $accent: AccentTone }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $width }) => `${Math.max(0, Math.min(1, $width)) * 100}%`};
  background: ${({ $accent }) => toneColors[$accent].accent};
`;

const ReservedFill = styled.div<{ $width: number }>`
  position: absolute;
  inset: 0 0 0 auto;
  width: ${({ $width }) => `${Math.max(0, Math.min(1, $width)) * 100}%`};
  background: rgba(255, 79, 102, 0.92);
`;

const Marker = styled.div<{ $left: number }>`
  position: absolute;
  top: 50%;
  left: ${({ $left }) => `${Math.max(0, Math.min(1, $left)) * 100}%`};
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: rgba(210, 210, 210, 1);
  transform: translate(-50%, -50%);
  box-shadow:
    0 0 0 1px rgba(8, 8, 8, 0.92),
    0 1px 4px rgba(0, 0, 0, 0.35);
`;

const CountdownRail = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  line-height: 1;
  gap: 0.14rem;
  font-variant-numeric: tabular-nums;
  font-family:
    SFMono-Regular,
    ui-monospace,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;
`;

const CountdownValue = styled.div<{ $accent: AccentTone }>`
  font-size: 0.86rem;
  font-weight: 700;
  color: ${({ $accent }) => toneColors[$accent].accent};
`;

const EndpointValue = styled.div`
  font-size: 0.72rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.64);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetricRow = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(0, 1fr));
  gap: 8px;
`;

const Metric = styled.div<{ $tone: keyof typeof metricToneColors }>`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 6px 4px 7px;
  border-radius: 12px;
  background: ${({ $tone }) => metricToneColors[$tone].background};
  border: 1px solid ${({ $tone }) => metricToneColors[$tone].border};
`;

const MetricTitle = styled.div`
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.58);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.1;
  font-family:
    SFMono-Regular,
    ui-monospace,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;
`;

const MetricValue = styled.div<{ $tone: keyof typeof metricToneColors }>`
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.12;
  color: ${({ $tone }) => metricToneColors[$tone].value};
`;

const MetricDetail = styled.div`
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.2;
`;

const ActionDock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ActionRowFrame = styled.div`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 6px;
  align-items: center;
`;

const ActionLabel = styled.div<{ $accent: AccentTone }>`
  font-size: 0.58rem;
  color: ${({ $accent }) => toneColors[$accent].accent};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family:
    SFMono-Regular,
    ui-monospace,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;
`;

const ActionButtons = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => Math.max(1, Math.min(2, $count))}, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
`;

const ActionPill = styled.div<{ $primary?: boolean; $accent: AccentTone }>`
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.32rem;
  min-height: 32px;
  padding: 6px 10px;
  border-radius: 13px;
  background: ${({ $primary }) => ($primary ? "#f0c62d" : "rgba(255, 255, 255, 0.05)")};
  border: 1px solid ${({ $primary }) =>
    $primary ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.08)"};
  color: ${({ $primary }) => ($primary ? "#131313" : "rgba(255,255,255,0.92)")};
  font-size: 0.68rem;
  font-weight: 600;
  box-shadow: ${({ $primary, $accent }) =>
    $primary ? `0 10px 24px ${toneColors[$accent].glow}` : "none"};
`;

const ActionIconWrap = styled.span`
  display: inline-grid;
  place-items: center;
`;

const liveActivityContent: Record<"en" | "es", { titlePrefix: string; titleAccent: string; microcopy: string; lockScreenDate: string; liveStates: LiveState[] }> = {
  en: {
    titlePrefix: "Travel, kept ",
    titleAccent: "current",
    microcopy:
      "Departure, arrival, and hotel check-in stay on the lock screen so you always know what happens next.",
    lockScreenDate: "Tuesday, March 10",
    liveStates: [
      {
        key: "flight_departure",
        label: "Flight departure",
        accent: "flight",
        title: "DL 123 to New York",
        relativeCountdown: "in 2h 14m",
        icon: "plane-takeoff",
        statusBar: {
          countdownToken: "12:45",
          countdownCaption: "",
          progressFraction: 0.56,
          reservedFraction: 0.18,
        },
        shownMetrics: [
          { title: "Boards 11:30", value: "Leave in 35m", tone: "accent" },
          { title: "Terminal 4", value: "Gate C12" },
          { title: "", value: "Seat 12A", detail: "JFK 35°", hideTitle: true },
        ],
        actionRows: [
          {
            label: "Airport",
            actions: [
              { label: "Uber", icon: "car", primary: true },
              { label: "Maps", icon: "map" },
            ],
          },
        ],
        top: "0rem",
        left: "1%",
        rotate: "-5deg",
      },
      {
        key: "flight_arrival",
        label: "In flight",
        accent: "flight",
        title: "DL 123",
        relativeCountdown: "lands in 1hr 02mn",
        icon: "plane",
        statusBar: {
          leadingText: "LAX 07:58",
          countdownToken: "1h",
          countdownCaption: "",
          endLabel: "09:00 JFK",
          progressFraction: 0.63,
          reservedFraction: 0,
          usesEndpointLabelStyleForEndText: true,
        },
        shownMetrics: [
          { title: "Terminal 4", value: "Gate C12" },
          { title: "Seat 12A", value: "Bag 7" },
          { title: "Weather", value: "35°", tone: "accent" },
        ],
        actionRows: [
          {
            label: "In Flight",
            actions: [{ label: "Wi-Fi", icon: "wifi" }],
          },
        ],
        top: "8rem",
        left: "48%",
        rotate: "6deg",
      },
      {
        key: "flight_arrived",
        label: "Flight arrived",
        accent: "ground",
        title: "Arrived",
        relativeCountdown: "Now",
        icon: "plane-landing",
        statusBar: {
          leadingText: "Bag 7 • T4",
          countdownToken: "Now",
          countdownCaption: "Landed",
          endLabel: "JFK",
          progressFraction: 1,
          reservedFraction: 0,
        },
        shownMetrics: [
          { title: "Baggage", value: "Claim 7", tone: "accent" },
          { title: "", value: "The TWA Hotel", detail: "1 Idlewild Dr, Queens, NY", hideTitle: true },
          { title: "Weather", value: "35°" },
        ],
        actionRows: [
          {
            label: "Hotel",
            actions: [
              { label: "Uber", icon: "car", primary: true },
              { label: "Maps", icon: "map" },
            ],
          },
        ],
        top: "23rem",
        left: "5%",
        rotate: "-4deg",
      },
      {
        key: "hotel_checkin",
        label: "Hotel check-in",
        accent: "ground",
        title: "The Ritz-Carlton NoMad",
        relativeCountdown: "35m away",
        icon: "bed",
        statusBar: {
          accent: "flight",
          countdownToken: "18m",
          countdownCaption: "Leave",
          endLabel: "4:00 PM",
          progressFraction: 0.51,
          reservedFraction: 0.21,
        },
        shownMetrics: [
          { title: "The Ritz-Carlton NoMad", value: "11 Madison Ave" },
          { title: "Conf", value: "ABC123", tone: "warning" },
        ],
        actionRows: [
          {
            label: "Hotel",
            actions: [
              { label: "Uber", icon: "car", primary: true },
              { label: "Maps", icon: "map" },
            ],
          },
        ],
        top: "37rem",
        left: "47%",
        rotate: "5deg",
      },
    ],
  },
  es: {
    titlePrefix: "Tu viaje, siempre ",
    titleAccent: "al día",
    microcopy:
      "La salida, la llegada y el check-in del hotel permanecen en la pantalla bloqueada para que siempre sepas qué sigue.",
    lockScreenDate: "Martes, 10 de marzo",
    liveStates: [
      {
        key: "flight_departure",
        label: "Salida del vuelo",
        accent: "flight",
        title: "DL 123 a Nueva York",
        relativeCountdown: "en 2 h 14 min",
        icon: "plane-takeoff",
        statusBar: {
          countdownToken: "12:45",
          countdownCaption: "",
          progressFraction: 0.56,
          reservedFraction: 0.18,
        },
        shownMetrics: [
          { title: "Embarca 11:30", value: "Sal en 35 min", tone: "accent" },
          { title: "Terminal 4", value: "Puerta C12" },
          { title: "", value: "Asiento 12A", detail: "JFK 35°", hideTitle: true },
        ],
        actionRows: [
          {
            label: "Aeropuerto",
            actions: [
              { label: "Uber", icon: "car", primary: true },
              { label: "Mapas", icon: "map" },
            ],
          },
        ],
        top: "0rem",
        left: "1%",
        rotate: "-5deg",
      },
      {
        key: "flight_arrival",
        label: "En vuelo",
        accent: "flight",
        title: "DL 123",
        relativeCountdown: "aterriza en 1 h 02 min",
        icon: "plane",
        statusBar: {
          leadingText: "LAX 07:58",
          countdownToken: "1 h",
          countdownCaption: "",
          endLabel: "09:00 JFK",
          progressFraction: 0.63,
          reservedFraction: 0,
          usesEndpointLabelStyleForEndText: true,
        },
        shownMetrics: [
          { title: "Terminal 4", value: "Puerta C12" },
          { title: "Asiento 12A", value: "Equipaje 7" },
          { title: "Clima", value: "35°", tone: "accent" },
        ],
        actionRows: [
          {
            label: "En vuelo",
            actions: [{ label: "Wi-Fi", icon: "wifi" }],
          },
        ],
        top: "8rem",
        left: "48%",
        rotate: "6deg",
      },
      {
        key: "flight_arrived",
        label: "Vuelo aterrizado",
        accent: "ground",
        title: "Llegaste",
        relativeCountdown: "Ahora",
        icon: "plane-landing",
        statusBar: {
          leadingText: "Equipaje 7 • T4",
          countdownToken: "Ahora",
          countdownCaption: "Aterrizó",
          endLabel: "JFK",
          progressFraction: 1,
          reservedFraction: 0,
        },
        shownMetrics: [
          { title: "Equipaje", value: "Banda 7", tone: "accent" },
          { title: "", value: "The TWA Hotel", detail: "1 Idlewild Dr, Queens, NY", hideTitle: true },
          { title: "Clima", value: "35°" },
        ],
        actionRows: [
          {
            label: "Hotel",
            actions: [
              { label: "Uber", icon: "car", primary: true },
              { label: "Mapas", icon: "map" },
            ],
          },
        ],
        top: "23rem",
        left: "5%",
        rotate: "-4deg",
      },
      {
        key: "hotel_checkin",
        label: "Check-in del hotel",
        accent: "ground",
        title: "The Ritz-Carlton NoMad",
        relativeCountdown: "a 35 min",
        icon: "bed",
        statusBar: {
          accent: "flight",
          countdownToken: "18 min",
          countdownCaption: "Salir",
          endLabel: "4:00 PM",
          progressFraction: 0.51,
          reservedFraction: 0.21,
        },
        shownMetrics: [
          { title: "The Ritz-Carlton NoMad", value: "11 Madison Ave" },
          { title: "Conf.", value: "ABC123", tone: "warning" },
        ],
        actionRows: [
          {
            label: "Hotel",
            actions: [
              { label: "Uber", icon: "car", primary: true },
              { label: "Mapas", icon: "map" },
            ],
          },
        ],
        top: "37rem",
        left: "47%",
        rotate: "5deg",
      },
    ],
  },
};

function renderIcon(icon: IconKey, size = 13) {
  const Icon = iconMap[icon];
  return <Icon size={size} strokeWidth={2.1} aria-hidden="true" />;
}

function markerFraction(progressFraction: number, reservedFraction: number): number {
  const cappedProgress = Math.max(0, Math.min(1, progressFraction));
  const cappedReserved = Math.max(0, Math.min(1, reservedFraction));
  return Math.min(1, cappedProgress + Math.max(0.02, 1 - cappedProgress - cappedReserved) * 0.02);
}

function shouldRenderActionIcon(action: ActionItem): boolean {
  return action.icon === "car" || action.icon === "map";
}

const LiveActivityStackSection: React.FC = () => {
  const { locale } = useI18n();
  const [visible, setVisible] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const localizedContent = liveActivityContent[locale];

  useMountEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  });

  return (
    <Section id="live-activity-pile" ref={sectionRef}>
      <Header>
        <Title>
          {localizedContent.titlePrefix}
          <AccentWord>{localizedContent.titleAccent}</AccentWord>.
        </Title>
        <Microcopy>{localizedContent.microcopy}</Microcopy>
      </Header>

      <Pile>
        {localizedContent.liveStates.map((state, index) => {
          const statusAccent = state.statusBar.accent ?? state.accent;
          const rightText =
            state.statusBar.endLabel ||
            (state.statusBar.countdownCaption
              ? `${state.statusBar.countdownToken} ${state.statusBar.countdownCaption}`
              : state.statusBar.countdownToken);
          const hasLeadingText = Boolean(state.statusBar.leadingText);

          return (
            <Card
              key={state.key}
              $visible={visible}
              $index={index}
              $top={state.top}
              $left={state.left}
              $rotate={state.rotate}
            >
              <LockScreenCropFrame>
                <LockScreenCrop $accent={state.accent}>
                  <LockScreenNotch />
                  <LockScreenTime>9:41</LockScreenTime>
                  <LockScreenDate>{localizedContent.lockScreenDate}</LockScreenDate>
                  <LockScreenActivityWrap>
                    <LiveActivityFrame $accent={state.accent}>
                      <TopRow>
                        <DoneLogo src={packLogo} alt="Pack logo" $size={24} />
                        <TitleBlock>
                          <TitleRow>
                            <LiveTitle>{state.title}</LiveTitle>
                            <CountdownCluster>{state.relativeCountdown}</CountdownCluster>
                          </TitleRow>
                        </TitleBlock>
                      </TopRow>

                      <StatusFrame $accent={statusAccent}>
                        <StatusRow $hasLeading={hasLeadingText}>
                          {hasLeadingText ? <LeadingText>{state.statusBar.leadingText}</LeadingText> : null}
                          <Track>
                            <TrackClip>
                              <ProgressFill
                                $width={state.statusBar.progressFraction}
                                $accent={statusAccent}
                              />
                              <ReservedFill $width={state.statusBar.reservedFraction} />
                            </TrackClip>
                            <Marker
                              $left={markerFraction(
                                state.statusBar.progressFraction,
                                state.statusBar.reservedFraction
                              )}
                            />
                          </Track>
                          <CountdownRail>
                            {state.statusBar.usesEndpointLabelStyleForEndText ? (
                              <EndpointValue>{rightText}</EndpointValue>
                            ) : (
                              <CountdownValue $accent={statusAccent}>{rightText}</CountdownValue>
                            )}
                          </CountdownRail>
                        </StatusRow>
                      </StatusFrame>

                      <MetricRow $count={Math.max(1, state.shownMetrics.length)}>
                        {state.shownMetrics.map((metric) => (
                          <Metric
                            key={`${state.key}-${metric.title}-${metric.value}-${metric.detail ?? ""}`}
                            $tone={metric.tone ?? "neutral"}
                          >
                            {!metric.hideTitle ? <MetricTitle>{metric.title}</MetricTitle> : null}
                            <MetricValue $tone={metric.tone ?? "neutral"}>{metric.value}</MetricValue>
                            {metric.detail ? <MetricDetail>{metric.detail}</MetricDetail> : null}
                          </Metric>
                        ))}
                      </MetricRow>

                      <ActionDock>
                        {state.actionRows.map((row) => (
                          <ActionRowFrame key={`${state.key}-${row.label}`}>
                            <ActionLabel $accent={row.label === "Hotel" ? "flight" : state.accent}>
                              {row.label}
                            </ActionLabel>
                            <ActionButtons $count={row.actions.length}>
                              {row.actions.map((action) => (
                                <ActionPill
                                  key={`${state.key}-${row.label}-${action.label}`}
                                  $primary={action.primary}
                                  $accent={state.accent}
                                >
                                  {shouldRenderActionIcon(action) ? (
                                    <ActionIconWrap>{renderIcon(action.icon, 13)}</ActionIconWrap>
                                  ) : null}
                                  {action.label}
                                </ActionPill>
                              ))}
                            </ActionButtons>
                          </ActionRowFrame>
                        ))}
                      </ActionDock>
                    </LiveActivityFrame>
                  </LockScreenActivityWrap>
                </LockScreenCrop>
              </LockScreenCropFrame>
            </Card>
          );
        })}
      </Pile>
    </Section>
  );
};

export default LiveActivityStackSection;
