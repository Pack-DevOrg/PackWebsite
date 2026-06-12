import React, { useState } from "react";
import {
  BedDouble,
  Briefcase,
  Building2,
  CalendarDays,
  CarFront,
  ChevronRight,
  Clock3,
  DoorOpen,
  MapPinned,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { SupportedLocale } from "@/i18n/config";
import { useMountEffect } from "@/hooks/useMountEffect";
import styled from "styled-components";
import packLogo from "../assets/logo.png";

type AccentTone = "flight" | "arrival" | "ground" | "generic";
type IconKey =
  | "plane-takeoff"
  | "plane"
  | "plane-landing"
  | "bed"
  | "calendar"
  | "clock"
  | "sparkles"
  | "car"
  | "building"
  | "gate"
  | "seat"
  | "shield"
  | "baggage"
  | "map"
  | "wifi"
  | "next";

type MetricCard = {
  title: string;
  value: string;
  detail?: string;
  hideTitle?: boolean;
  icon?: IconKey;
  tone?: "accent" | "warning" | "danger" | "neutral";
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

type StatusBarSpec = {
  accent?: AccentTone;
  leadingText?: string;
  countdownToken: string;
  countdownCaption: string;
  detailText?: string;
  startLabel?: string;
  endLabel?: string;
  progressFraction: number;
  reservedFraction: number;
  usesEndpointLabelStyleForEndText?: boolean;
};

type LiveActivityMock = {
  key: string;
  label: string;
  accent: AccentTone;
  title: string;
  phaseLabel?: string;
  supportingText?: string;
  relativeCountdown: string;
  icon: IconKey;
  statusBar: StatusBarSpec;
  shownMetrics: MetricCard[];
  hiddenMetrics?: MetricCard[];
  nextItem?: string;
  nextEventCountdown?: string;
  actionRows: ActionRow[];
  lockScreen: {
    fullMetricLimit: number;
    midMetricLimit: number;
    compactMetricLimit: number;
    showNextInMid: boolean;
    showStatusBarInCompact: boolean;
  };
  dynamicIsland: {
    expandedLeadingText?: string;
    expandedText?: string;
    expandedTrailingText?: string;
    compactLeadingText?: string;
    compactTrailingText?: string;
    minimalIcon?: IconKey;
    minimalText?: string;
    showsCountdown: boolean;
  };
};

type ScreenshotSurface = {
  key: string;
  label: string;
  swiftImageSrc: string;
  swiftAlt: string;
  websiteImageSrc: string;
  websiteAlt: string;
};

type ScreenshotGroup = {
  key: string;
  label: string;
  title: string;
  surfaces: ScreenshotSurface[];
};

type LiveActivityLabContent = {
  nextLabel: string;
  lockScreenTitle: string;
  lockScreenMeta: string;
  lockScreenDate: string;
  dynamicIslandTitle: string;
  dynamicIslandMeta: string;
  compactLabel: string;
  minimalLabel: string;
  watchSmallTitle: string;
  watchSmallMeta: string;
  eyebrow: string;
  title: string;
  captureIntro: string;
  reviewIntro: string;
  screenshotHeaders: {
    label: string;
    swift: string;
    website: string;
  };
  screenshotMeta: {
    swift: string;
    website: string;
  };
  screenshotSurfaceLabels: {
    lockScreen: string;
    dynamicIslandExpanded: string;
    dynamicIslandCompact: string;
    dynamicIslandMinimal: string;
    watchSmall: string;
  };
  screenshotAlt: {
    lockScreenSwift: string;
    lockScreenWebsite: string;
    dynamicIslandExpandedSwift: string;
    dynamicIslandExpandedWebsite: string;
    dynamicIslandCompactSwift: string;
    dynamicIslandCompactWebsite: string;
    dynamicIslandMinimalSwift: string;
    dynamicIslandMinimalWebsite: string;
    watchSmallSwift: string;
    watchSmallWebsite: string;
  };
};

const LIVE_ACTIVITY_LAB_CONTENT: Record<
  SupportedLocale,
  LiveActivityLabContent
> = {
  en: {
    nextLabel: "Next",
    lockScreenTitle: "Lock Screen",
    lockScreenMeta: "Native-sized crop",
    lockScreenDate: "Tuesday, March 24",
    dynamicIslandTitle: "Dynamic Island",
    dynamicIslandMeta: "Expanded, compact, minimal",
    compactLabel: "Compact",
    minimalLabel: "Minimal",
    watchSmallTitle: "Watch Small",
    watchSmallMeta: "Companion reference",
    eyebrow: "Internal Lab",
    title: "Live Activity State Mockups",
    captureIntro: "Capture mode for regenerating website reference surfaces.",
    reviewIntro:
      "Three-column grid only: name, Swift screenshot, website screenshot.",
    screenshotHeaders: {
      label: "Live Activity",
      swift: "Swift Screenshot",
      website: "Website Screenshot",
    },
    screenshotMeta: {
      swift: "Swift",
      website: "Website",
    },
    screenshotSurfaceLabels: {
      lockScreen: "Lock Screen",
      dynamicIslandExpanded: "Dynamic Island Expanded",
      dynamicIslandCompact: "Dynamic Island Compact",
      dynamicIslandMinimal: "Dynamic Island Minimal",
      watchSmall: "Watch / Small",
    },
    screenshotAlt: {
      lockScreenSwift: "lock screen simulator image",
      lockScreenWebsite: "lock screen website image",
      dynamicIslandExpandedSwift: "Dynamic Island expanded simulator image",
      dynamicIslandExpandedWebsite: "Dynamic Island expanded website image",
      dynamicIslandCompactSwift: "Dynamic Island compact simulator image",
      dynamicIslandCompactWebsite: "Dynamic Island compact website image",
      dynamicIslandMinimalSwift: "Dynamic Island minimal simulator image",
      dynamicIslandMinimalWebsite: "Dynamic Island minimal website image",
      watchSmallSwift: "watch small simulator image",
      watchSmallWebsite: "watch small website image",
    },
  },
  es: {
    nextLabel: "Siguiente",
    lockScreenTitle: "Pantalla bloqueada",
    lockScreenMeta: "Recorte con tamaño nativo",
    lockScreenDate: "Martes, 24 de marzo",
    dynamicIslandTitle: "Dynamic Island",
    dynamicIslandMeta: "Expandida, compacta, mínima",
    compactLabel: "Compacta",
    minimalLabel: "Mínima",
    watchSmallTitle: "Watch pequeño",
    watchSmallMeta: "Referencia complementaria",
    eyebrow: "Laboratorio interno",
    title: "Maquetas de estados de Live Activity",
    captureIntro:
      "Modo de captura para regenerar las superficies de referencia del sitio.",
    reviewIntro:
      "Cuadrícula de tres columnas únicamente: nombre, captura de Swift y captura del sitio web.",
    screenshotHeaders: {
      label: "Live Activity",
      swift: "Captura de Swift",
      website: "Captura del sitio web",
    },
    screenshotMeta: {
      swift: "Swift",
      website: "Sitio web",
    },
    screenshotSurfaceLabels: {
      lockScreen: "Pantalla bloqueada",
      dynamicIslandExpanded: "Dynamic Island expandida",
      dynamicIslandCompact: "Dynamic Island compacta",
      dynamicIslandMinimal: "Dynamic Island mínima",
      watchSmall: "Watch / Pequeño",
    },
    screenshotAlt: {
      lockScreenSwift: "imagen del simulador de pantalla bloqueada",
      lockScreenWebsite: "imagen web de pantalla bloqueada",
      dynamicIslandExpandedSwift:
        "imagen del simulador de Dynamic Island expandida",
      dynamicIslandExpandedWebsite:
        "imagen web de Dynamic Island expandida",
      dynamicIslandCompactSwift:
        "imagen del simulador de Dynamic Island compacta",
      dynamicIslandCompactWebsite: "imagen web de Dynamic Island compacta",
      dynamicIslandMinimalSwift:
        "imagen del simulador de Dynamic Island mínima",
      dynamicIslandMinimalWebsite: "imagen web de Dynamic Island mínima",
      watchSmallSwift: "imagen del simulador del Watch pequeño",
      watchSmallWebsite: "imagen web del Watch pequeño",
    },
  },
};

const screenshotVersionToken =
  typeof window !== "undefined"
    ? String(Date.now())
    : "static";

const Page = styled.main`
  min-height: 100vh;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  background: radial-gradient(
      circle at top right,
      rgba(240, 198, 45, 0.12),
      transparent 28%
    ),
    linear-gradient(180deg, #181818 0%, #111111 100%);
  color: rgba(255, 255, 255, 0.92);

  @media (max-width: 640px) {
    padding: 0.85rem;
  }
`;

const toneColors: Record<
  AccentTone,
  { accent: string; accentSoft: string; glow: string }
> = {
  flight: {
    accent: "#f0c62d",
    accentSoft: "rgba(240, 198, 45, 0.18)",
    glow: "rgba(240, 198, 45, 0.12)",
  },
  arrival: {
    accent: "#62d0ff",
    accentSoft: "rgba(98, 208, 255, 0.18)",
    glow: "rgba(98, 208, 255, 0.12)",
  },
  ground: {
    accent: "#7ed38b",
    accentSoft: "rgba(126, 211, 139, 0.18)",
    glow: "rgba(126, 211, 139, 0.12)",
  },
  generic: {
    accent: "#d9d9d9",
    accentSoft: "rgba(217, 217, 217, 0.16)",
    glow: "rgba(217, 217, 217, 0.1)",
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
  danger: {
    background: "rgba(255, 79, 102, 0.12)",
    border: "rgba(255, 79, 102, 0.2)",
    value: "#ff8ea1",
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
  clock: Clock3,
  sparkles: Sparkles,
  car: CarFront,
  building: Building2,
  gate: DoorOpen,
  seat: Ticket,
  shield: ShieldCheck,
  baggage: Briefcase,
  map: MapPinned,
  wifi: Wifi,
  next: ChevronRight,
};

const Shell = styled.div`
  width: min(1760px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Eyebrow = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(240, 198, 45, 0.92);
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 0.94;
  letter-spacing: -0.03em;
`;

const Intro = styled.p`
  margin: 0;
  max-width: 72rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 1rem;
  line-height: 1.55;
`;

const ReviewLayout = styled.div`
  display: grid;
  gap: 1.15rem;

  @media (min-width: 1100px) {
    grid-template-columns: minmax(10rem, 14rem) minmax(0, 1fr);
    align-items: start;
  }
`;

const ActivityDirectory = styled.nav`
  display: flex;
  gap: 0.65rem;
  overflow-x: auto;
  padding: 0.15rem 0.05rem 0.35rem;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 1100px) {
    position: sticky;
    top: clamp(1rem, 4svh, 2.5rem);
    z-index: 3;
    display: grid;
    gap: 0.35rem;
    overflow: visible;
    padding: 0.55rem 0;
  }
`;

const ActivityDirectoryItem = styled.a`
  position: relative;
  display: grid;
  gap: 0.18rem;
  min-width: 10.75rem;
  padding: 0.65rem 0.78rem 0.65rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.025)),
    rgba(12, 12, 12, 0.72);
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.16);

  &::before {
    content: "";
    position: absolute;
    left: 0.48rem;
    top: 50%;
    width: 0.28rem;
    height: 0.28rem;
    border-radius: 999px;
    background: rgba(240, 198, 45, 0.72);
    transform: translateY(-50%);
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(240, 198, 45, 0.32);
    background:
      radial-gradient(circle at top right, rgba(240, 198, 45, 0.14), transparent 42%),
      rgba(18, 18, 18, 0.92);
    outline: none;
  }

  @media (min-width: 1100px) {
    min-width: 0;
    border: none;
    background: transparent;
    box-shadow: none;
    opacity: 0.72;

    &:hover,
    &:focus-visible {
      background: transparent;
      opacity: 1;
    }
  }
`;

const ActivityDirectoryTitle = styled.span`
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.18;
`;

const ActivityDirectoryMeta = styled.span`
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
`;

const ScreenshotGroups = styled.div`
  display: grid;
  gap: 1.1rem;
  min-width: 0;
`;

const Grid = styled.section`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.35rem;
`;

const StateCard = styled.article<{ $accent: AccentTone }>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 22px;
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.03),
      rgba(255, 255, 255, 0.02)
    ),
    radial-gradient(
      circle at top right,
      ${({ $accent }) => toneColors[$accent].glow},
      transparent 36%
    );
  border: 1px solid ${({ $accent }) => toneColors[$accent].accentSoft};
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.26);

  @media (max-width: 640px) {
    padding: 0.85rem;
    border-radius: 18px;
  }
`;

const StateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
`;

const StateName = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StateNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const StateIconBadge = styled.div<{ $accent: AccentTone }>`
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: ${({ $accent }) => toneColors[$accent].accentSoft};
  color: ${({ $accent }) => toneColors[$accent].accent};
  border: 1px solid ${({ $accent }) => toneColors[$accent].accentSoft};
`;

const DoneLogo = styled.img<{ $size: number }>`
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  object-fit: contain;
`;

const StateTag = styled.span`
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const PreviewPair = styled.div`
  display: grid;
  grid-template-columns: minmax(360px, 430px) minmax(0, 1fr);
  gap: 1rem;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const SurfaceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const ReferenceNote = styled.div`
  font-size: 0.72rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.56);

  @media (max-width: 640px) {
    font-size: 0.68rem;
  }
`;

const ScreenshotSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 100%;
`;

const ScreenshotStateSection = styled.section`
  display: grid;
  gap: 0.78rem;
  min-width: 0;
  scroll-margin-top: 1.2rem;
`;

const ScreenshotStateHeader = styled.div`
  display: grid;
  gap: 0.18rem;
  padding: 0.15rem 0.45rem 0;
`;

const ScreenshotStateTitle = styled.h2`
  margin: 0;
  color: rgba(255, 255, 255, 0.96);
  font-size: clamp(1.35rem, 2.1vw, 2rem);
  line-height: 1.04;
  letter-spacing: -0.03em;
`;

const ScreenshotStateMeta = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.74rem;
  font-weight: 700;
`;

const ScreenshotSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: baseline;
  flex-wrap: wrap;
`;

const ScreenshotSectionTitle = styled.h3`
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const ScreenshotSectionMeta = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.74rem;
  line-height: 1.45;
`;

const ScreenshotGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
  align-items: start;
  width: 100%;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }
`;

const ScreenshotHeader = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.35rem 0.45rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);

  @media (max-width: 860px) {
    display: none;
  }
`;

const ScreenshotImage = styled.img`
  display: block;
  width: 100%;
  max-width: 480px;
  max-height: 220px;
  height: auto;
  object-fit: contain;
`;

const ScreenshotLabelCell = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  padding: 0.35rem 0.45rem;

  @media (max-width: 860px) {
    margin-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 0.85rem;
  }
`;

const ScreenshotImageCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`;

const ScreenshotImageMeta = styled.span`
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.52);
`;

const DeviceShell = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0.25rem 0 0.55rem;
`;

const LockScreenStage = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0.25rem 0 0;
`;

const LockScreenCropFrame = styled.div`
  width: min(100%, 393px);
  aspect-ratio: 393 / 326;
  border-radius: 34px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);

  @media (max-width: 640px) {
    border-radius: 28px;
  }
`;

const LockScreenCrop = styled.div<{ $accent: AccentTone }>`
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0.9rem 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  background: radial-gradient(
      circle at top center,
      ${({ $accent }) => toneColors[$accent].glow},
      transparent 24%
    ),
    linear-gradient(
      180deg,
      rgba(42, 42, 42, 0.92) 0%,
      rgba(20, 20, 20, 1) 54%,
      rgba(9, 9, 9, 1) 100%
    );
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
  width: min(100%, 361px);
`;

const DeviceScaleFrame = styled.div`
  width: calc(393px * 0.74);
  height: calc(852px * 0.74);
  position: relative;
`;

const DeviceScale = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  width: 393px;
  height: 852px;
  transform: translateX(-50%) scale(0.74);
  transform-origin: top center;
`;

const DeviceBody = styled.div`
  position: relative;
  width: 393px;
  height: 852px;
  padding: 14px;
  border-radius: 56px;
  background: radial-gradient(
      circle at 50% 0%,
      rgba(255, 255, 255, 0.1),
      transparent 14%
    ),
    linear-gradient(180deg, #0b0b0b 0%, #171717 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
`;

const DeviceNotch = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  width: 126px;
  height: 34px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #050505;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
`;

const DeviceWallpaper = styled.div<{ $accent: AccentTone }>`
  width: 100%;
  height: 100%;
  border-radius: 42px;
  padding-top: 112px;
  display: flex;
  justify-content: center;
  background: radial-gradient(
      circle at top center,
      ${({ $accent }) => toneColors[$accent].glow},
      transparent 24%
    ),
    linear-gradient(
      180deg,
      rgba(40, 40, 40, 0.95) 0%,
      rgba(16, 16, 16, 1) 58%,
      rgba(8, 8, 8, 1) 100%
    );
`;

const LiveActivityViewport = styled.div`
  width: 361px;
  height: 184px;
  overflow: hidden;
  border-radius: 26px;
`;

const LiveActivityFrame = styled.div<{ $accent: AccentTone }>`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  max-width: 361px;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 26px;
  background: linear-gradient(
    135deg,
    rgba(18, 18, 18, 0.98),
    rgba(30, 30, 30, 0.94) 64%,
    ${({ $accent }) => toneColors[$accent].glow}
  );
  border: 1px solid ${({ $accent }) => toneColors[$accent].accentSoft};
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 6px;
  align-items: start;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
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
`;

const CountdownCluster = styled.div`
  min-width: 58px;
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.76rem;
  font-weight: 600;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-family: SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
`;

const ClusterIconWrap = styled.span<{ $accent: AccentTone }>`
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  color: ${({ $accent }) => toneColors[$accent].accent};
  background: ${({ $accent }) => toneColors[$accent].accentSoft};
`;

const PhaseLabel = styled.div<{ $accent: AccentTone }>`
  font-size: 0.72rem;
  color: ${({ $accent }) => toneColors[$accent].accent};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const SupportingText = styled.div`
  font-size: 0.76rem;
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.35;
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

const StatusDetailText = styled.div`
  font-size: 0.64rem;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.62);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SurfaceLabFrame = styled.div<{ $accent: AccentTone }>`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 100%;
  padding: 0.9rem;
  border-radius: 18px;
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.04),
      rgba(255, 255, 255, 0.025)
    ),
    radial-gradient(
      circle at top right,
      ${({ $accent }) => toneColors[$accent].glow},
      transparent 40%
    );
  border: 1px solid ${({ $accent }) => toneColors[$accent].accentSoft};

  @media (max-width: 640px) {
    padding: 0.75rem;
    border-radius: 16px;
  }
`;

const DynamicIslandFrame = styled(SurfaceLabFrame)`
  min-width: 0;
`;

const WatchFrame = styled(SurfaceLabFrame)`
  align-self: start;
  width: min(100%, 260px);
`;

const StatusRow = styled.div<{ $hasLeading: boolean }>`
  display: grid;
  grid-template-columns: ${({ $hasLeading }) =>
    $hasLeading
      ? "max-content minmax(0, 1fr) max-content"
      : "minmax(0, 1fr) max-content"};
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

const LeadingWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.38rem;
  min-width: 0;
`;

const LeadingIcon = styled.div<{ $accent: AccentTone }>`
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: ${({ $accent }) => toneColors[$accent].accent};
  background: ${({ $accent }) => toneColors[$accent].accentSoft};
  flex: 0 0 auto;
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
  box-shadow: 0 0 0 1px rgba(8, 8, 8, 0.92), 0 1px 4px rgba(0, 0, 0, 0.35);
`;

const CountdownRail = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  min-width: 0;
  line-height: 1;
  gap: 0.14rem;
  font-variant-numeric: tabular-nums;
  font-family: SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
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
  font-variant-numeric: tabular-nums;
  font-family: SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
`;

const CountdownCaption = styled.div`
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.56);
`;

const EndpointRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.52);
  font-variant-numeric: tabular-nums;
  font-family: SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
`;

const MetricGrid = styled.div`
  display: block;
`;

const MetricRow = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(0, 1fr));
  gap: 8px;
`;

const Metric = styled.div<{ $tone: keyof typeof metricToneColors }>`
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1px;
  padding: 4px 6px 4px 7px;
  border-radius: 10px;
  background: ${({ $tone }) => metricToneColors[$tone].background};
  border: 1px solid ${({ $tone }) => metricToneColors[$tone].border};
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 0;
`;

const MetricIcon = styled.div<{ $tone: keyof typeof metricToneColors }>`
  display: grid;
  place-items: center;
  color: ${({ $tone }) => metricToneColors[$tone].value};
  opacity: 0.88;
`;

const MetricTitle = styled.div`
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.58);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.1;
  font-family: SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
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

const NextRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: baseline;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.84);
`;

const NextLabel = styled.span`
  color: rgba(255, 255, 255, 0.54);
  text-transform: uppercase;
  letter-spacing: 0.07em;
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
  font-family: SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
`;

function actionLabelTone(state: LiveActivityMock, row: ActionRow): AccentTone {
  if (row.label === "Hotel") {
    return "flight";
  }
  return state.accent;
}

const ActionButtons = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${({ $count }) => Math.max(1, Math.min(2, $count))},
    minmax(0, 1fr)
  );
  gap: 6px;
  width: 100%;
`;

const ActionPill = styled.div<{ $primary?: boolean; $accent: AccentTone }>`
  min-width: 0;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.32rem;
  min-height: 32px;
  padding: 6px 10px;
  border-radius: 13px;
  background: ${({ $primary }) =>
    $primary ? "#f0c62d" : "rgba(255, 255, 255, 0.05)"};
  border: 1px solid
    ${({ $primary }) =>
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

const SurfaceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const SurfaceSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
`;

const SurfaceSectionTitle = styled.div`
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.74);
`;

const SurfaceSectionMeta = styled.div`
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.48);
`;

const DensityLabel = styled.div`
  font-size: 0.66rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const DensityTitleRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.45rem;
  align-items: center;
`;

const DensityTitle = styled.div`
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.15;
`;

const DensityCountdown = styled.div`
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.66);
  font-variant-numeric: tabular-nums;
  font-family: SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
`;

const IslandGrid = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  align-items: center;
`;

const IslandSubgrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const IslandCard = styled.div<{ $accent: AccentTone }>`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.8rem;
  border-radius: 18px;
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.035),
      rgba(255, 255, 255, 0.02)
    ),
    radial-gradient(
      circle at top right,
      ${({ $accent }) => toneColors[$accent].glow},
      transparent 42%
    );
  border: 1px solid ${({ $accent }) => toneColors[$accent].accentSoft};
`;

const ExpandedIslandCard = styled(IslandCard)`
  width: 100%;
  align-items: center;
  overflow: hidden;
`;

const IslandPill = styled.div`
  min-height: 36px;
  border-radius: 999px;
  background: #060606;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.38rem;
  padding: 0 0.8rem;
`;

const CompactIslandShell = styled.div`
  width: min(100%, 176px);
  min-width: 0;
  height: 36.67px;
  min-height: 36.67px;
  max-height: 36.67px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px minmax(0, 1fr);
  align-items: center;
  column-gap: 0;
  padding: 0 10px 0 12px;
  box-sizing: border-box;
  border-radius: 999px;
  background: #060606;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const CompactIslandSegment = styled.div<{ $align: "left" | "right" }>`
  min-width: 0;
  height: 100%;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: ${({ $align }) =>
    $align === "left" ? "flex-end" : "flex-start"};
  overflow: hidden;
`;

const CompactStatusMiniTrack = styled.div`
  position: relative;
  width: 26px;
  min-width: 26px;
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const CompactStatusMiniFill = styled.div<{
  $width: number;
  $accent: AccentTone;
}>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $width }) => `${Math.max(0, Math.min(1, $width)) * 100}%`};
  background: ${({ $accent }) => toneColors[$accent].accent};
`;

const CompactStatusMiniReserved = styled.div<{ $width: number }>`
  position: absolute;
  inset: 0 0 0 auto;
  width: ${({ $width }) => `${Math.max(0, Math.min(1, $width)) * 100}%`};
  background: rgba(255, 79, 102, 0.92);
`;

const CompactIslandCameraGap = styled.div`
  width: 32px;
  min-width: 32px;
  max-width: 32px;
  height: 23px;
  min-height: 23px;
  max-height: 23px;
  border-radius: 999px;
  background: #050505;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  justify-self: center;
`;

const MinimalIslandPill = styled(IslandPill)`
  width: 36.67px;
  min-width: 36.67px;
  max-width: 36.67px;
  height: 36.67px;
  min-height: 36.67px;
  max-height: 36.67px;
  flex-direction: column;
  gap: 1px;
  padding: 3px 0 4px;
`;

const IslandExpanded = styled.div`
  width: min(100%, 371px);
  min-width: 0;
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  border-radius: 22px;
  background: #060606;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.42rem;
  padding: 0 0.8rem;
`;

const ExpandedLogoWrap = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-width: 0;
`;

const IslandText = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const IslandRegion = styled.div<{ $align?: "start" | "center" | "end" }>`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: ${({ $align }) =>
    $align === "end"
      ? "flex-end"
      : $align === "center"
      ? "center"
      : "flex-start"};
`;

const MinimalValueRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: 10px;
`;

const WatchGrid = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
`;

const WatchCard = styled.div<{ $accent: AccentTone }>`
  width: min(100%, 172px);
  min-width: 0;
  min-height: 142px;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.62rem;
  border-radius: 24px;
  background: linear-gradient(
      180deg,
      rgba(18, 18, 18, 1),
      rgba(18, 18, 18, 0.94)
    ),
    radial-gradient(
      circle at top right,
      ${({ $accent }) => toneColors[$accent].glow},
      transparent 42%
    );
  border: 1px solid ${({ $accent }) => toneColors[$accent].accentSoft};
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 12px 32px rgba(0, 0, 0, 0.32);

  @media (max-width: 980px) {
    width: min(100%, 188px);
    min-height: 150px;
    padding: 0.68rem;
    border-radius: 26px;
  }
`;

const WatchTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
`;

const WatchMark = styled.div`
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1;
  color: rgb(240, 198, 45);
  letter-spacing: 0.02em;
`;

const WatchTimerChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  min-height: 22px;
  padding: 0 0.42rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.6rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  font-variant-numeric: tabular-nums;
`;

const WatchDetailBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
`;

const WatchDetailLine = styled.div<{ $accented?: boolean }>`
  font-size: 0.6rem;
  line-height: 1.18;
  font-weight: ${({ $accented }) => ($accented ? 700 : 500)};
  color: ${({ $accented }) =>
    $accented ? "rgb(240, 198, 45)" : "rgba(255, 255, 255, 0.7)"};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const WatchMiniStatusWrap = styled.div`
  margin-top: 0.04rem;
`;

const WatchMiniStatusBar = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const WatchMiniTrack = styled.div`
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

const WatchBottomWrap = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
`;

const WatchTitle = styled.div`
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.15;
  color: rgba(255, 255, 255, 0.96);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const WatchDestination = styled.div`
  font-size: 0.6rem;
  line-height: 1.18;
  color: rgba(255, 255, 255, 0.56);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

type FlightDepartureLabSpec = {
  flightNumber: string;
  destination: string;
  destinationCode: string;
  destinationWeather: string;
  terminalLabel: string;
  gateLabel: string;
  seatLabel: string;
  boardingTimeLabel: string;
  departureTimeLabel: string;
  minutesUntilDeparture: number;
  minutesUntilBoarding: number;
  minutesUntilLeave: number;
  driveMinutes: number;
  tsaMinutes: number;
};

function formatDurationLabel(minutes: number): string {
  if (minutes <= 0) {
    return "0m";
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatRelativeCountdown(minutes: number): string {
  if (minutes <= 0) {
    return "Now";
  }
  return `in ${formatDurationLabel(minutes)}`;
}

function formatCompactMinuteToken(minutes: number): string {
  if (minutes <= 0) {
    return "Now";
  }
  return `${minutes}m`;
}

function formatMinimalMinuteToken(minutes: number): string {
  if (minutes <= 0) {
    return "Now";
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  return `${Math.floor(minutes / 60)}h`;
}

function dynamicIslandExpandedTrailingText(state: LiveActivityMock): string | null {
  if (state.nextEventCountdown) {
    return state.nextEventCountdown;
  }
  if (state.dynamicIsland.expandedTrailingText) {
    return state.dynamicIsland.expandedTrailingText;
  }
  if (state.dynamicIsland.showsCountdown) {
    return state.statusBar.countdownToken;
  }
  return null;
}

function buildDepartureStatusBarSpec(
  minutesUntilLeave: number,
  driveMinutes: number,
  tsaMinutes: number,
  departureTimeLabel: string
): StatusBarSpec {
  const safeDriveMinutes = Math.max(0, driveMinutes);
  const safeTsaMinutes = Math.max(0, tsaMinutes);
  const boardingBufferMinutes = 30;
  const requiredMinutes = Math.max(
    1,
    safeDriveMinutes + safeTsaMinutes + boardingBufferMinutes
  );
  const preWarningWindowMinutes = Math.max(
    requiredMinutes,
    Math.round(requiredMinutes * 1.24)
  );
  const reservedWindowMinutes = Math.max(
    18,
    Math.round(requiredMinutes * 0.27)
  );
  const totalWindowMinutes = Math.max(
    1,
    preWarningWindowMinutes + reservedWindowMinutes
  );
  const clampedMinutesUntilLeave = Math.max(0, minutesUntilLeave);
  const elapsedFraction = Math.max(
    0,
    Math.min(
      1 - reservedWindowMinutes / totalWindowMinutes,
      (preWarningWindowMinutes -
        Math.min(preWarningWindowMinutes, clampedMinutesUntilLeave)) /
        totalWindowMinutes
    )
  );

  return {
    countdownToken: departureTimeLabel,
    countdownCaption: "",
    detailText: `${formatDurationLabel(safeDriveMinutes)} Drive • ${formatDurationLabel(safeTsaMinutes)} TSA`,
    progressFraction: elapsedFraction,
    reservedFraction: reservedWindowMinutes / totalWindowMinutes,
  };
}

function buildFlightDepartureMock(
  spec: FlightDepartureLabSpec
): LiveActivityMock {
  const title = `${spec.flightNumber} to ${spec.destination}`;
  return {
    key: "flight_departure",
    label: "Flight Departure",
    accent: "flight",
    title,
    relativeCountdown: formatRelativeCountdown(spec.minutesUntilDeparture),
    icon: "plane-takeoff",
    statusBar: buildDepartureStatusBarSpec(
      spec.minutesUntilLeave,
      spec.driveMinutes,
      spec.tsaMinutes,
      spec.departureTimeLabel
    ),
    shownMetrics: [
      {
        title: `Boards ${spec.boardingTimeLabel}`,
        value:
          spec.minutesUntilLeave <= 0
            ? "Leave now"
            : `Leave in ${formatDurationLabel(spec.minutesUntilLeave)}`,
        icon: "car",
        tone: "accent",
      },
      {
        title: `Terminal ${spec.terminalLabel}`,
        value: `Gate ${spec.gateLabel}`,
        icon: "building",
      },
      {
        title: "",
        value: `Seat ${spec.seatLabel}`,
        detail: `${spec.destinationCode} • ${spec.destinationWeather}`,
        hideTitle: true,
        icon: "seat",
      },
    ],
    actionRows: [
      {
        label: "Airport",
        actions: [
          {label: "Uber", icon: "car", primary: true},
          {label: "Maps", icon: "map"},
        ],
      },
    ],
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: undefined,
      expandedText: `T${spec.terminalLabel} • Gate ${spec.gateLabel} • ${spec.boardingTimeLabel}`,
      expandedTrailingText: undefined,
      compactLeadingText: spec.gateLabel,
      compactTrailingText: formatCompactMinuteToken(spec.minutesUntilBoarding),
      minimalIcon: undefined,
      minimalText: formatMinimalMinuteToken(spec.minutesUntilBoarding),
      showsCountdown: false,
    },
  };
}

const flightDepartureLabSpec: FlightDepartureLabSpec = {
  flightNumber: "DL 123",
  destination: "New York",
  destinationCode: "JFK",
  destinationWeather: "35°",
  terminalLabel: "4",
  gateLabel: "C12",
  seatLabel: "12A",
  boardingTimeLabel: "11:30",
  departureTimeLabel: "12:45",
  minutesUntilDeparture: 134,
  minutesUntilBoarding: 104,
  minutesUntilLeave: 35,
  driveMinutes: 55,
  tsaMinutes: 14,
};
const reactiveLabBucket = Math.floor(Date.now() / (2 * 60 * 1000));

function pickReactiveLabValue<T>(
  values: readonly T[],
  offset: number
): T {
  const normalizedIndex =
    ((reactiveLabBucket + offset) % values.length + values.length) %
    values.length;
  return values[normalizedIndex] as T;
}

const reactiveDepartureDriveMinutes = pickReactiveLabValue([42, 47, 55, 63], 11);
const reactiveDepartureTsaMinutes = pickReactiveLabValue([9, 14, 22, 31], 13);
const reactiveDepartureMinutesUntilLeave = pickReactiveLabValue(
  [28, 35, 41, 46],
  5
);
const reactiveDepartureMinutesUntilDeparture =
  134 + pickReactiveLabValue([0, 8, 16, 24], 3);
const reactiveDepartureMinutesUntilBoarding = Math.max(
  10,
  reactiveDepartureMinutesUntilDeparture - 30
);
const reactiveDepartureTerminal = pickReactiveLabValue(["3", "4", "5", "6"], 29);
const reactiveDepartureGate = pickReactiveLabValue(["A2", "B7", "C12", "D4"], 31);
const reactiveSeatLabel = pickReactiveLabValue(["9C", "12A", "14F", "18D"], 43);
const reactiveWeatherLabel = `${pickReactiveLabValue([31, 35, 38, 42], 53)}°`;
const reactiveBaggageLabel = pickReactiveLabValue(
  ["Claim 3", "Claim 5", "Claim 7", "Claim 9"],
  47
);
const reactiveArrivalTerminal = pickReactiveLabValue(["1", "2", "4", "7"], 37);
const reactiveArrivalGate = pickReactiveLabValue(["A9", "B14", "C12", "D6"], 41);
const hotelCheckInDriveMinutes = pickReactiveLabValue([12, 18, 24, 35], 19);
const hotelCheckInMinutesUntilCheckIn = 35;
const activityDriveMinutes = pickReactiveLabValue([8, 10, 14, 17], 23);
const activityMinutesUntilLeave = pickReactiveLabValue([18, 22, 27, 31], 5);
const reactiveArrivalHotelDriveMinutes = pickReactiveLabValue([22, 28, 35, 41], 17);
const reactiveHotelConfirmationCode = pickReactiveLabValue(
  ["ABC123", "DMN448", "QRT772", "ZXC901"],
  59
);

const states: LiveActivityMock[] = [
  buildFlightDepartureMock({
    ...flightDepartureLabSpec,
    destinationWeather: reactiveWeatherLabel,
    terminalLabel: reactiveDepartureTerminal,
    gateLabel: reactiveDepartureGate,
    seatLabel: reactiveSeatLabel,
    boardingTimeLabel: `${reactiveDepartureMinutesUntilBoarding}m`,
    departureTimeLabel: `${reactiveDepartureMinutesUntilDeparture}m`,
    minutesUntilDeparture: reactiveDepartureMinutesUntilDeparture,
    minutesUntilBoarding: reactiveDepartureMinutesUntilBoarding,
    minutesUntilLeave: reactiveDepartureMinutesUntilLeave,
    driveMinutes: reactiveDepartureDriveMinutes,
    tsaMinutes: reactiveDepartureTsaMinutes,
  }),
  {
    key: "flight_arrival",
    label: "In Flight",
    accent: "flight",
    title: "DL 123",
    relativeCountdown: "lands in 1h 2m",
    icon: "plane",
    statusBar: {
      leadingText: `LAX ${reactiveDepartureMinutesUntilDeparture}m`,
      countdownToken: "1h",
      countdownCaption: "",
      detailText: `${reactiveSeatLabel} • ${reactiveWeatherLabel}`,
      endLabel: `${62 + pickReactiveLabValue([0, 6, 12, 18], 7)}m JFK`,
      progressFraction: 0.63,
      reservedFraction: 0,
      usesEndpointLabelStyleForEndText: true,
    },
    shownMetrics: [
      {
        title: `Terminal ${reactiveArrivalTerminal}`,
        value: `Gate ${reactiveArrivalGate}`,
        icon: "building",
      },
      { title: `Seat ${reactiveSeatLabel}`, value: reactiveBaggageLabel, icon: "seat" },
      { title: "Weather", value: reactiveWeatherLabel, tone: "accent" },
    ],
    actionRows: [
      {
        label: "In Flight",
        actions: [{ label: "Wi-Fi", icon: "wifi" }],
      },
    ],
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: "Seat 12A",
      expandedText: undefined,
      expandedTrailingText: "1h 2m",
      compactLeadingText: "1h 2m",
      compactTrailingText: "12A",
      minimalIcon: undefined,
      minimalText: "1h",
      showsCountdown: false,
    },
  },
  {
    key: "flight_arrived",
    label: "Flight Arrived",
    accent: "ground",
    title: "Arrived",
    relativeCountdown: "Now",
    icon: "plane-landing",
    statusBar: {
      leadingText: `${reactiveBaggageLabel} • T${reactiveArrivalTerminal}`,
      countdownToken: "Now",
      countdownCaption: "Landed",
      detailText: `${formatDurationLabel(reactiveArrivalHotelDriveMinutes)} Drive`,
      endLabel: "JFK",
      progressFraction: 1,
      reservedFraction: 0,
    },
    shownMetrics: [
      { title: "Baggage", value: reactiveBaggageLabel, tone: "accent" },
      {
        title: "Next in",
        value: "1h30m",
        detail: "The TWA Hotel",
      },
      {
        title: "Drive",
        value: `${reactiveArrivalHotelDriveMinutes}m`,
        detail: "The TWA Hotel",
      },
      { title: "Weather", value: reactiveWeatherLabel },
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
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: true,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: undefined,
      expandedText: "Baggage 7 • 35°",
      expandedTrailingText: "1h30m",
      compactLeadingText: "7",
      compactTrailingText: "1h30m",
      minimalIcon: "baggage",
      minimalText: "1h30m",
      showsCountdown: false,
    },
  },
  {
    key: "hotel_checkin",
    label: "Hotel Check-in",
    accent: "ground",
    title: "The Ritz-Carlton NoMad",
    relativeCountdown: `${formatDurationLabel(hotelCheckInMinutesUntilCheckIn)} away`,
    icon: "bed",
    statusBar: {
      accent: "flight",
      leadingText: undefined,
      countdownToken: formatCompactMinuteToken(hotelCheckInMinutesUntilCheckIn),
      countdownCaption: "Check-in",
      detailText: `${formatDurationLabel(hotelCheckInDriveMinutes)} Drive`,
      endLabel: "4:00 PM",
      progressFraction: 0.51,
      reservedFraction: 0,
    },
    shownMetrics: [
      { title: "The Ritz-Carlton NoMad", value: "11 Madison Ave" },
      { title: "Conf", value: reactiveHotelConfirmationCode, tone: "warning" },
      { title: "Weather", value: reactiveWeatherLabel, tone: "accent" },
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
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: formatCompactMinuteToken(hotelCheckInMinutesUntilCheckIn),
      expandedText: "Ritz Carlton NoMad",
      expandedTrailingText: undefined,
      compactLeadingText: formatCompactMinuteToken(hotelCheckInMinutesUntilCheckIn),
      compactTrailingText: "NoMad",
      minimalIcon: undefined,
      minimalText: formatMinimalMinuteToken(hotelCheckInMinutesUntilCheckIn),
      showsCountdown: false,
    },
  },
  {
    key: "activity",
    label: "Activity",
    accent: "flight",
    title: "Dinner at Don Angie",
    relativeCountdown: "in 1h 12m",
    icon: "calendar",
    statusBar: {
      leadingText: undefined,
      countdownToken: formatCompactMinuteToken(activityMinutesUntilLeave),
      countdownCaption: "Leave",
      detailText: `${formatDurationLabel(activityDriveMinutes)} Drive`,
      endLabel: "19:30",
      progressFraction: 0.49,
      reservedFraction: 0.18,
    },
    shownMetrics: [
      {
        title: "Leave in",
        value: formatCompactMinuteToken(activityMinutesUntilLeave),
        icon: "car",
        tone: "accent",
      },
      { title: "", value: "103 Greenwich Ave", hideTitle: true },
      {
        title: "Drive",
        value: formatCompactMinuteToken(activityDriveMinutes),
        icon: "car",
        tone: "warning",
      },
      { title: "After", value: "Ritz-Carlton NoMad", detail: "11 Madison Ave" },
      { title: "Weather", value: reactiveWeatherLabel, tone: "accent" },
    ],
    actionRows: [
      {
        label: "Event",
        actions: [
          { label: "Uber", icon: "car", primary: true },
          { label: "Maps", icon: "map" },
        ],
      },
      {
        label: "Hotel",
        actions: [
          { label: "Uber", icon: "car" },
          { label: "Maps", icon: "map" },
        ],
      },
    ],
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: formatCompactMinuteToken(activityMinutesUntilLeave),
      expandedText: "Dinner at Don Angie",
      expandedTrailingText: undefined,
      compactLeadingText: formatCompactMinuteToken(activityMinutesUntilLeave),
      compactTrailingText: "Dinner",
      minimalIcon: undefined,
      minimalText: "2h50",
      showsCountdown: false,
    },
  },
  {
    key: "generic",
    label: "Generic",
    accent: "generic",
    title: "Pickup rental car",
    supportingText: "JFK Terminal 4",
    relativeCountdown: "in 42m",
    icon: "sparkles",
    statusBar: {
      leadingText: undefined,
      countdownToken: "42m",
      countdownCaption: "Start",
      endLabel: "14:00",
      progressFraction: 0,
      reservedFraction: 0,
    },
    shownMetrics: [
      { title: "Starts in", value: "42m", icon: "clock", tone: "accent" },
      { title: "Next in", value: "2h", detail: "Hotel check-in", icon: "next" },
    ],
    actionRows: [
      {
        label: "Event",
        actions: [{ label: "Open", icon: "next" }],
      },
    ],
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: undefined,
      expandedText: "Starts in",
      expandedTrailingText: undefined,
      compactLeadingText: "42m",
      compactTrailingText: "2h",
      minimalIcon: undefined,
      minimalText: "42m",
      showsCountdown: false,
    },
  },
  {
    key: "flight_departure_no_gate",
    label: "Departure · No Gate",
    accent: "flight",
    title: "DL 123 to New York",
    relativeCountdown: formatRelativeCountdown(reactiveDepartureMinutesUntilLeave),
    icon: "plane-takeoff",
    statusBar: buildDepartureStatusBarSpec(
      reactiveDepartureMinutesUntilLeave,
      reactiveDepartureDriveMinutes,
      reactiveDepartureTsaMinutes,
      `${reactiveDepartureMinutesUntilDeparture}m`
    ),
    shownMetrics: [
      {
        title: `Boards ${reactiveDepartureMinutesUntilBoarding}m`,
        value:
          reactiveDepartureMinutesUntilLeave <= 0
            ? "Leave now"
            : `Leave in ${formatDurationLabel(reactiveDepartureMinutesUntilLeave)}`,
        icon: "car",
        tone: "accent",
      },
      {
        // Gate/terminal not yet published by the airline — show TBA rather than
        // omitting the row, so the card still reads as a real flight card.
        title: "Gate",
        value: "TBA",
        icon: "building",
        tone: "neutral",
      },
      {
        title: "",
        value: `Seat ${reactiveSeatLabel}`,
        detail: `JFK • ${reactiveWeatherLabel}`,
        hideTitle: true,
        icon: "seat",
      },
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
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: undefined,
      // Gate omitted from the Island summary while TBA; lead with boarding time.
      expandedText: `Gate TBA • Boards ${reactiveDepartureMinutesUntilBoarding}m`,
      expandedTrailingText: undefined,
      compactLeadingText: "TBA",
      compactTrailingText: formatCompactMinuteToken(reactiveDepartureMinutesUntilBoarding),
      minimalIcon: undefined,
      minimalText: formatMinimalMinuteToken(reactiveDepartureMinutesUntilBoarding),
      showsCountdown: false,
    },
  },
  {
    key: "flight_delayed",
    label: "Flight Delayed",
    accent: "flight",
    title: "DL 123 to New York",
    phaseLabel: "Delayed",
    relativeCountdown: "Delayed · now boards 12:40",
    icon: "plane-takeoff",
    statusBar: {
      accent: "flight",
      leadingText: undefined,
      countdownToken: "12:40",
      countdownCaption: "Delayed",
      detailText: `${formatDurationLabel(reactiveDepartureDriveMinutes)} Drive • ${formatDurationLabel(reactiveDepartureTsaMinutes)} TSA`,
      endLabel: "12:40",
      progressFraction: 0.38,
      reservedFraction: 0.2,
    },
    shownMetrics: [
      {
        title: "New boarding",
        value: "12:40",
        detail: "Was 11:30",
        icon: "clock",
        tone: "warning",
      },
      {
        title: `Terminal ${reactiveDepartureTerminal}`,
        value: `Gate ${reactiveDepartureGate}`,
        icon: "building",
      },
      {
        title: "",
        value: `Seat ${reactiveSeatLabel}`,
        detail: `JFK • ${reactiveWeatherLabel}`,
        hideTitle: true,
        icon: "seat",
      },
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
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: "Delayed",
      expandedText: `Now boards 12:40 • Gate ${reactiveDepartureGate}`,
      expandedTrailingText: "12:40",
      compactLeadingText: "Delayed",
      compactTrailingText: "12:40",
      minimalIcon: undefined,
      minimalText: "Late",
      showsCountdown: false,
    },
  },
  {
    key: "activity_no_location",
    label: "Activity · No Location",
    accent: "flight",
    title: "Team Standup",
    // No address: this is the location-optional calendar event the app now
    // supports. Still an intentional card — title + start countdown + time —
    // but no drive metric and only a neutral Open Pack fallback action.
    relativeCountdown: "in 22m",
    icon: "calendar",
    statusBar: {
      leadingText: undefined,
      countdownToken: "22m",
      countdownCaption: "Starts",
      endLabel: "10:00",
      progressFraction: 0.41,
      reservedFraction: 0,
    },
    shownMetrics: [
      { title: "Starts in", value: "22m", icon: "clock", tone: "accent" },
      { title: "At", value: "10:00", icon: "calendar" },
    ],
    actionRows: [
      {
        label: "Event",
        actions: [{ label: "Open Pack", icon: "next" }],
      },
    ],
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: "22m",
      expandedText: "Team Standup",
      expandedTrailingText: "10:00",
      compactLeadingText: "22m",
      compactTrailingText: "Standup",
      minimalIcon: undefined,
      minimalText: "22m",
      showsCountdown: false,
    },
  },
  {
    key: "hotel_minimal",
    label: "Hotel · Name Only",
    accent: "ground",
    title: "Hotel Bowery",
    // Sparse but valid: name only — no address, no confirmation code. Name acts
    // as the title and the action; no confirmation chip is shown.
    relativeCountdown: `${formatDurationLabel(hotelCheckInMinutesUntilCheckIn)} away`,
    icon: "bed",
    statusBar: {
      accent: "flight",
      leadingText: undefined,
      countdownToken: formatCompactMinuteToken(hotelCheckInMinutesUntilCheckIn),
      countdownCaption: "Check-in",
      endLabel: "4:00 PM",
      progressFraction: 0.51,
      reservedFraction: 0,
    },
    shownMetrics: [
      {
        title: "Check-in",
        value: formatCompactMinuteToken(hotelCheckInMinutesUntilCheckIn),
        icon: "clock",
        tone: "accent",
      },
      { title: "At", value: "4:00 PM", icon: "bed" },
    ],
    actionRows: [
      {
        label: "Hotel",
        actions: [{ label: "Open Pack", icon: "next" }],
      },
    ],
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: formatCompactMinuteToken(hotelCheckInMinutesUntilCheckIn),
      expandedText: "Hotel Bowery",
      expandedTrailingText: undefined,
      compactLeadingText: formatCompactMinuteToken(hotelCheckInMinutesUntilCheckIn),
      compactTrailingText: "Bowery",
      minimalIcon: undefined,
      minimalText: formatMinimalMinuteToken(hotelCheckInMinutesUntilCheckIn),
      showsCountdown: false,
    },
  },
  {
    key: "flight_cancelled",
    label: "Flight Cancelled",
    accent: "flight",
    title: "DL 123 to New York",
    phaseLabel: "Cancelled",
    relativeCountdown: "Cancelled",
    icon: "plane-takeoff",
    statusBar: {
      accent: "flight",
      leadingText: undefined,
      countdownToken: "Cancelled",
      countdownCaption: "Cancelled",
      endLabel: "12:45",
      progressFraction: 1,
      reservedFraction: 0,
    },
    shownMetrics: [
      {
        title: "Status",
        value: "Cancelled",
        detail: "Check rebooking options",
        icon: "shield",
        tone: "danger",
      },
      {
        title: `Terminal ${reactiveDepartureTerminal}`,
        value: `Gate ${reactiveDepartureGate}`,
        icon: "building",
        tone: "neutral",
      },
    ],
    actionRows: [
      {
        label: "Airline",
        actions: [{ label: "Open Pack", icon: "next" }],
      },
    ],
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: "Cancelled",
      expandedText: "DL 123 cancelled • check rebooking",
      expandedTrailingText: undefined,
      compactLeadingText: "Cancelled",
      compactTrailingText: "DL 123",
      minimalIcon: "shield",
      minimalText: "Canc",
      showsCountdown: false,
    },
  },
  {
    key: "scrubber_activity",
    label: "Scrubber Activity",
    accent: "flight",
    title: "Scrubber: ViewThatFits",
    supportingText: "1 Infinite Loop, Cupertino, CA",
    relativeCountdown: "35m remaining",
    nextEventCountdown: "1h20m",
    icon: "calendar",
    statusBar: {
      leadingText: undefined,
      countdownToken: "35m",
      countdownCaption: "Remaining",
      endLabel: "09:20",
      progressFraction: 0.84,
      reservedFraction: 0,
    },
    shownMetrics: [
      { title: "Remaining", value: "35m", icon: "clock", tone: "accent" },
      { title: "Address", value: "1 Infinite Loop", detail: "Cupertino, CA", tone: "accent" },
      { title: "Next in", value: "1h20m", detail: "QA compare hotel scrubber" },
    ],
    actionRows: [
      {
        label: "Event",
        actions: [
          { label: "Uber", icon: "car", primary: true },
          { label: "Maps", icon: "map" },
        ],
      },
    ],
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: undefined,
      expandedText: "Scrubber activity",
      expandedTrailingText: "1h20m",
      compactLeadingText: undefined,
      compactTrailingText: "1h20m",
      minimalIcon: undefined,
      minimalText: "1h20m",
      showsCountdown: false,
    },
  },
  {
    key: "scrubber_hotel",
    label: "Scrubber Hotel",
    accent: "ground",
    title: "Scrubber: Fixed Layout",
    supportingText: "The Ritz-Carlton NoMad • 11 Madison Ave",
    relativeCountdown: "35m remaining",
    nextEventCountdown: "1h20m",
    icon: "bed",
    statusBar: {
      leadingText: undefined,
      countdownToken: "35m",
      countdownCaption: "Remaining",
      endLabel: "16:00",
      progressFraction: 0.82,
      reservedFraction: 0,
    },
    shownMetrics: [
      { title: "Remaining", value: "35m", icon: "clock", tone: "accent" },
      { title: "Hotel", value: "The Ritz-Carlton NoMad", detail: "11 Madison Ave", tone: "accent" },
      { title: "Next in", value: "1h20m", detail: "Dinner after check-in" },
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
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: undefined,
      expandedText: "Fixed layout",
      expandedTrailingText: "1h20m",
      compactLeadingText: undefined,
      compactTrailingText: "1h20m",
      minimalIcon: undefined,
      minimalText: "1h20m",
      showsCountdown: false,
    },
  },
  {
    key: "scrubber_landed",
    label: "Scrubber Landed",
    accent: "ground",
    title: "Scrubber: Driven Rail",
    supportingText: "1 Idlewild Dr, Queens, NY 11430",
    relativeCountdown: "35m remaining",
    nextEventCountdown: "1h20m",
    icon: "plane-landing",
    statusBar: {
      leadingText: undefined,
      countdownToken: "35m",
      countdownCaption: "Remaining",
      endLabel: "ARR",
      progressFraction: 0.86,
      reservedFraction: 0,
    },
    shownMetrics: [
      { title: "Remaining", value: "35m", icon: "clock", tone: "accent" },
      { title: "Address", value: "1 Idlewild Dr", detail: "Queens, NY", tone: "accent" },
      { title: "Next in", value: "1h20m", detail: "Hotel check-in next" },
    ],
    actionRows: [
      {
        label: "Transfer",
        actions: [
          { label: "Uber", icon: "car", primary: true },
          { label: "Maps", icon: "map" },
          { label: "Uber", icon: "car" },
        ],
      },
    ],
    lockScreen: {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInMid: false,
      showStatusBarInCompact: true,
    },
    dynamicIsland: {
      expandedLeadingText: undefined,
      expandedText: "Driven rail",
      expandedTrailingText: "1h20m",
      compactLeadingText: undefined,
      compactTrailingText: "1h20m",
      minimalIcon: undefined,
      minimalText: "1h20m",
      showsCountdown: false,
    },
  },
];

function getLocalizedStateActionLabel(
  stateKey: LiveActivityMock["key"],
  rowLabel: string,
  locale: SupportedLocale
): string {
  if (locale !== "es") {
    return rowLabel;
  }

  const overridesByState: Record<string, Record<string, string>> = {
    flight_departure: { Airport: "Aeropuerto" },
    flight_departure_no_gate: { Airport: "Aeropuerto" },
    flight_delayed: { Airport: "Aeropuerto" },
    activity_no_location: { Event: "Evento" },
    hotel_minimal: { Hotel: "Hotel" },
    flight_cancelled: { Airline: "Aerolínea" },
    flight_arrival: { "In Flight": "En vuelo" },
    flight_arrived: { Hotel: "Hotel" },
    hotel_checkin: { Hotel: "Hotel" },
    activity: { Event: "Evento", Hotel: "Hotel" },
    generic: { Event: "Evento" },
    scrubber_activity: { Event: "Evento" },
    scrubber_hotel: { Hotel: "Hotel" },
    scrubber_landed: { Transfer: "Traslado" },
  };

  return overridesByState[stateKey]?.[rowLabel] ?? rowLabel;
}

function getLocalizedStateActionItemLabel(
  actionLabel: string,
  locale: SupportedLocale
): string {
  if (locale !== "es") {
    return actionLabel;
  }

  const translations: Record<string, string> = {
    Maps: "Mapas",
    Open: "Abrir",
    "Open Pack": "Abrir Pack",
  };

  return translations[actionLabel] ?? actionLabel;
}

function getLocalizedLiveActivityStates(
  locale: SupportedLocale
): LiveActivityMock[] {
  if (locale !== "es") {
    return states;
  }

  return states.map((state) => {
    const translatedActionRows = state.actionRows.map((row) => ({
      ...row,
      label: getLocalizedStateActionLabel(state.key, row.label, locale),
      actions: row.actions.map((action) => ({
        ...action,
        label: getLocalizedStateActionItemLabel(action.label, locale),
      })),
    }));

    switch (state.key) {
      case "flight_departure":
        return {
          ...state,
          label: "Salida del vuelo",
          shownMetrics: [
            {
              ...state.shownMetrics[0],
              title: state.shownMetrics[0].title.replace("Boards ", "Aborda "),
              value:
                state.shownMetrics[0].value === "Leave now"
                  ? "Sal ahora"
                  : state.shownMetrics[0].value.replace("Leave in ", "Salir en "),
            },
            {
              ...state.shownMetrics[1],
              title: state.shownMetrics[1].title.replace("Terminal ", "Terminal "),
              value: state.shownMetrics[1].value.replace("Gate ", "Puerta "),
            },
            {
              ...state.shownMetrics[2],
              value: state.shownMetrics[2].value.replace("Seat ", "Asiento "),
            },
          ],
          actionRows: translatedActionRows,
          dynamicIsland: {
            ...state.dynamicIsland,
            expandedText: state.dynamicIsland.expandedText?.replace(
              "Gate ",
              "Puerta "
            ),
          },
        };
      case "flight_arrival":
        return {
          ...state,
          label: "En vuelo",
          relativeCountdown: "aterriza en 1h 2m",
          shownMetrics: [
            {
              ...state.shownMetrics[0],
              title: state.shownMetrics[0].title.replace("Terminal ", "Terminal "),
              value: state.shownMetrics[0].value.replace("Gate ", "Puerta "),
            },
            {
              ...state.shownMetrics[1],
              title: state.shownMetrics[1].title.replace("Seat ", "Asiento "),
            },
            {
              ...state.shownMetrics[2],
              title: "Clima",
            },
          ],
          actionRows: translatedActionRows,
          dynamicIsland: {
            ...state.dynamicIsland,
            expandedLeadingText: state.dynamicIsland.expandedLeadingText?.replace(
              "Seat ",
              "Asiento "
            ),
          },
        };
      case "flight_arrived":
        return {
          ...state,
          label: "Vuelo aterrizado",
          title: "Llegó",
          relativeCountdown: "Ahora",
          statusBar: {
            ...state.statusBar,
            countdownCaption: "Aterrizó",
            detailText: state.statusBar.detailText?.replace("Drive", "Trayecto"),
          },
          shownMetrics: [
            {
              ...state.shownMetrics[0],
              title: "Equipaje",
            },
            state.shownMetrics[1],
            {
              ...state.shownMetrics[2],
              title: "Trayecto",
            },
            {
              ...state.shownMetrics[3],
              title: "Clima",
            },
          ],
          actionRows: translatedActionRows,
          dynamicIsland: {
            ...state.dynamicIsland,
            expandedText: "Equipaje 7 • 35°",
          },
        };
      case "hotel_checkin":
        return {
          ...state,
          label: "Check-in del hotel",
          relativeCountdown: `${formatDurationLabel(
            hotelCheckInMinutesUntilCheckIn
          )} de distancia`,
          statusBar: {
            ...state.statusBar,
            countdownCaption: "Check-in",
            detailText: state.statusBar.detailText?.replace("Drive", "Trayecto"),
          },
          shownMetrics: [
            state.shownMetrics[0],
            {
              ...state.shownMetrics[1],
              title: "Conf.",
            },
            {
              ...state.shownMetrics[2],
              title: "Clima",
            },
          ],
          actionRows: translatedActionRows,
        };
      case "activity":
        return {
          ...state,
          label: "Actividad",
          title: "Cena en Don Angie",
          relativeCountdown: "en 1h 12m",
          statusBar: {
            ...state.statusBar,
            countdownCaption: "Salir",
            detailText: state.statusBar.detailText?.replace("Drive", "Trayecto"),
          },
          shownMetrics: [
            {
              ...state.shownMetrics[0],
              title: "Salir en",
            },
            state.shownMetrics[1],
            {
              ...state.shownMetrics[2],
              title: "Trayecto",
            },
            {
              ...state.shownMetrics[3],
              title: "Después",
            },
            {
              ...state.shownMetrics[4],
              title: "Clima",
            },
          ],
          actionRows: translatedActionRows,
        };
      case "generic":
        return {
          ...state,
          label: "Genérico",
          title: "Recoger auto de alquiler",
          relativeCountdown: "en 42m",
          shownMetrics: [
            {
              ...state.shownMetrics[0],
              title: "Empieza",
            },
            {
              ...state.shownMetrics[1],
              title: "Siguiente",
              value: "Check-in del hotel",
            },
          ],
          actionRows: translatedActionRows,
        };
      case "scrubber_activity":
        return {
          ...state,
          label: "Actividad scrubber",
          title: "Scrubber: ViewThatFits",
          relativeCountdown: "a 1m",
          statusBar: {
            ...state.statusBar,
            countdownCaption: "Salir",
          },
          shownMetrics: [
            {
              ...state.shownMetrics[0],
              title: "Dirección",
            },
            {
              ...state.shownMetrics[1],
              title: "Siguiente",
              value: "QA compara scrubber de hotel",
            },
          ],
          actionRows: translatedActionRows,
          dynamicIsland: {
            ...state.dynamicIsland,
            expandedLeadingText: "Actividad",
            expandedText: "Actividad scrubber",
            compactLeadingText: "Actividad",
          },
        };
      case "scrubber_hotel":
        return {
          ...state,
          label: "Hotel scrubber",
          title: "Scrubber: Diseño fijo",
          relativeCountdown: "a 1m",
          statusBar: {
            ...state.statusBar,
            countdownCaption: "Salir",
          },
          shownMetrics: [
            {
              ...state.shownMetrics[0],
              title: "Hotel",
            },
            {
              ...state.shownMetrics[1],
              title: "Conf.",
            },
          ],
          actionRows: translatedActionRows,
          dynamicIsland: {
            ...state.dynamicIsland,
            expandedLeadingText: "Hotel",
            expandedText: "Diseño fijo",
            compactLeadingText: "Hotel",
          },
        };
      case "scrubber_landed":
        return {
          ...state,
          label: "Aterrizado scrubber",
          title: "Scrubber: Riel guiado",
          relativeCountdown: "a 1m",
          statusBar: {
            ...state.statusBar,
            countdownCaption: "Salir",
          },
          shownMetrics: [
            {
              ...state.shownMetrics[0],
              title: "Dirección",
            },
            {
              ...state.shownMetrics[1],
              title: "Siguiente",
              value: "Check-in del hotel después",
            },
          ],
          actionRows: translatedActionRows,
          dynamicIsland: {
            ...state.dynamicIsland,
            expandedLeadingText: "Traslado",
          },
        };
      default:
        return {
          ...state,
          actionRows: translatedActionRows,
        };
    }
  });
}

// Generated by `cd PackApp && npm run live-activity:review:clean`.
// Rerun that command whenever native Live Activity Swift artifacts change.
const nativeReviewRoot =
  "/@fs/Users/noahmitsuhashi/Code/PackAll/PackApp/manual-live-activity-review";
// Generated by `cd PackWebsite && node scripts/sync-live-activity-lab.mjs`.
// Rerun that command whenever these website lab screenshots or their source mockups change.
const websiteReviewRoot =
  "/@fs/Users/noahmitsuhashi/Code/PackAll/PackWebsite/artifacts/live-activity-lab";

function buildLabArtifactUrl(stateKey: string, fileName: string): string {
  return `${websiteReviewRoot}/${stateKey}/${fileName}?v=${encodeURIComponent(
    screenshotVersionToken
  )}`;
}

function buildNativeReviewUrl(fileName: string): string {
  return `${nativeReviewRoot}/${fileName}?v=${encodeURIComponent(
    screenshotVersionToken
  )}`;
}

function getNativeReviewBaseName(state: LiveActivityMock): string {
  switch (state.key) {
    case "generic":
      return "generic_event";
    default:
      return state.key;
  }
}

function getScreenshotSurfaces(
  state: LiveActivityMock,
  localizedContent: LiveActivityLabContent
): ScreenshotSurface[] {
  const nativeReviewBaseName = getNativeReviewBaseName(state);

  return [
    {
      key: `${state.key}-lock-screen`,
      label: `${state.label} / ${localizedContent.screenshotSurfaceLabels.lockScreen}`,
      swiftImageSrc: buildNativeReviewUrl(`${nativeReviewBaseName}.png`),
      swiftAlt: `${state.label} ${localizedContent.screenshotAlt.lockScreenSwift}`,
      websiteImageSrc: buildLabArtifactUrl(state.key, "lock-screen.png"),
      websiteAlt: `${state.label} ${localizedContent.screenshotAlt.lockScreenWebsite}`,
    },
    {
      key: `${state.key}-dynamic-island-expanded`,
      label: `${state.label} / ${localizedContent.screenshotSurfaceLabels.dynamicIslandExpanded}`,
      swiftImageSrc: buildNativeReviewUrl(
        `${nativeReviewBaseName}__expanded.png`
      ),
      swiftAlt: `${state.label} ${localizedContent.screenshotAlt.dynamicIslandExpandedSwift}`,
      websiteImageSrc: buildLabArtifactUrl(
        state.key,
        "dynamic-island-expanded.png"
      ),
      websiteAlt: `${state.label} ${localizedContent.screenshotAlt.dynamicIslandExpandedWebsite}`,
    },
    {
      key: `${state.key}-dynamic-island-compact`,
      label: `${state.label} / ${localizedContent.screenshotSurfaceLabels.dynamicIslandCompact}`,
      swiftImageSrc: buildNativeReviewUrl(`${nativeReviewBaseName}__compact.png`),
      swiftAlt: `${state.label} ${localizedContent.screenshotAlt.dynamicIslandCompactSwift}`,
      websiteImageSrc: buildLabArtifactUrl(
        state.key,
        "dynamic-island-compact.png"
      ),
      websiteAlt: `${state.label} ${localizedContent.screenshotAlt.dynamicIslandCompactWebsite}`,
    },
    {
      key: `${state.key}-dynamic-island-minimal`,
      label: `${state.label} / ${localizedContent.screenshotSurfaceLabels.dynamicIslandMinimal}`,
      swiftImageSrc: buildNativeReviewUrl(`${nativeReviewBaseName}__minimal.png`),
      swiftAlt: `${state.label} ${localizedContent.screenshotAlt.dynamicIslandMinimalSwift}`,
      websiteImageSrc: buildLabArtifactUrl(
        state.key,
        "dynamic-island-minimal.png"
      ),
      websiteAlt: `${state.label} ${localizedContent.screenshotAlt.dynamicIslandMinimalWebsite}`,
    },
    {
      key: `${state.key}-watch-small`,
      label: `${state.label} / ${localizedContent.screenshotSurfaceLabels.watchSmall}`,
      swiftImageSrc: buildNativeReviewUrl(`${nativeReviewBaseName}__small.png`),
      swiftAlt: `${state.label} ${localizedContent.screenshotAlt.watchSmallSwift}`,
      websiteImageSrc: buildLabArtifactUrl(state.key, "watch-small.png"),
      websiteAlt: `${state.label} ${localizedContent.screenshotAlt.watchSmallWebsite}`,
    },
  ];
}

function getScreenshotGroups(
  localizedStates: LiveActivityMock[],
  localizedContent: LiveActivityLabContent
): ScreenshotGroup[] {
  return localizedStates.map((state) => ({
    key: state.key,
    label: state.label,
    title: state.title,
    surfaces: getScreenshotSurfaces(state, localizedContent),
  }));
}

function markerFraction(statusBar: StatusBarSpec): number {
  const cappedProgress = Math.max(0, Math.min(1, statusBar.progressFraction));
  const cappedReserved = Math.max(0, Math.min(1, statusBar.reservedFraction));
  return Math.min(
    1,
    cappedProgress + Math.max(0.02, 1 - cappedProgress - cappedReserved) * 0.02
  );
}

function metricMinHeight(metrics: MetricCard[]): number {
  return 0;
}

function renderIcon(icon: IconKey, size = 14) {
  const Icon = iconMap[icon];
  return <Icon size={size} strokeWidth={2.1} aria-hidden="true" />;
}

function compactIslandValue(state: LiveActivityMock): string {
  if (state.dynamicIsland.compactTrailingText) {
    return state.dynamicIsland.compactTrailingText;
  }
  if (state.dynamicIsland.showsCountdown) {
    return state.statusBar.countdownToken;
  }
  return state.statusBar.countdownCaption;
}

function normalizeInfoToken(value: string | undefined | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isDuplicateInfoValue(
  candidate: string,
  blockedValues: readonly string[]
): boolean {
  const normalizedCandidate = normalizeInfoToken(candidate);
  if (!normalizedCandidate) {
    return true;
  }

  return blockedValues.some((blockedValue) => {
    if (!blockedValue) {
      return false;
    }
    if (normalizedCandidate === blockedValue) {
      return true;
    }
    if (
      blockedValue.length >= 4 &&
      (normalizedCandidate.includes(blockedValue) ||
        blockedValue.includes(normalizedCandidate))
    ) {
      return true;
    }
    if (
      /^[0-9]+[hm]/.test(blockedValue) &&
      normalizedCandidate.startsWith(blockedValue)
    ) {
      return true;
    }
    return false;
  });
}

function shouldRenderCompactStatusMiniBar(state: LiveActivityMock): boolean {
  return (
    state.statusBar.progressFraction > 0 || state.statusBar.reservedFraction > 0
  );
}

function watchTimerIcon(state: LiveActivityMock): IconKey {
  return state.statusBar.countdownCaption === "Leave" ? "car" : "clock";
}

function watchTimerText(state: LiveActivityMock): string {
  if (state.relativeCountdown === "Now") {
    return "Now";
  }
  if (state.key === "flight_arrival" && state.statusBar.countdownCaption === "Lands in") {
    return state.statusBar.countdownToken;
  }
  if (state.statusBar.countdownCaption) {
    return `${state.statusBar.countdownToken} ${state.statusBar.countdownCaption}`;
  }
  return state.statusBar.countdownToken;
}

function pickUniqueWatchSubtitle(state: LiveActivityMock): string | undefined {
  const blocked = new Set([normalizeInfoToken(state.title)]);
  const candidates = [state.supportingText, state.phaseLabel];

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeInfoToken(candidate);
    if (!normalizedCandidate || blocked.has(normalizedCandidate)) {
      continue;
    }
    return candidate;
  }

  return undefined;
}

function watchIsCountdownLikeLine(value: string | undefined): boolean {
  const normalized = normalizeInfoToken(value);
  if (!normalized) {
    return false;
  }
  if (
    normalized.startsWith("leave in ") ||
    normalized.startsWith("starts in ")
  ) {
    return true;
  }
  if (normalized === "leave now" || normalized === "starts now") {
    return true;
  }
  if (normalized.startsWith("in ") && normalized.includes("m")) {
    return true;
  }
  return false;
}

function watchDestinationLine(state: LiveActivityMock): string | undefined {
  const blockedFragments = [
    "leave in",
    "starts in",
    "drive ",
    "terminal",
    "gate ",
    "seat ",
    "boarding",
    "check-in",
    "check in",
  ];
  const expandedLines = watchExpandedLines(state);

  for (const line of expandedLines) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      watchIsCountdownLikeLine(trimmed) ||
      isDuplicateInfoValue(trimmed, [state.title])
    ) {
      continue;
    }
    const normalized = trimmed.toLowerCase();
    if (blockedFragments.some((fragment) => normalized.includes(fragment))) {
      continue;
    }
    return trimmed;
  }

  const subtitle = pickUniqueWatchSubtitle(state);
  if (!subtitle || isDuplicateInfoValue(subtitle, [state.title])) {
    return undefined;
  }
  return subtitle;
}

function watchDetailLines(
  state: LiveActivityMock,
  destinationLine: string | undefined
): string[] {
  const blockedValues = [
    normalizeInfoToken(state.title),
    normalizeInfoToken(destinationLine),
    normalizeInfoToken(pickUniqueWatchSubtitle(state)),
    normalizeInfoToken(state.statusBar.countdownToken),
    normalizeInfoToken(state.statusBar.countdownCaption),
    normalizeInfoToken(
      state.statusBar.countdownCaption
        ? `${state.statusBar.countdownToken} ${state.statusBar.countdownCaption}`
        : undefined
    ),
  ].filter((value): value is string => value.length > 0);
  const blocked = new Set(blockedValues);
  const detailLines: string[] = [];

  for (const line of watchExpandedLines(state)) {
    const normalized = normalizeInfoToken(line);
    if (
      !normalized ||
      watchIsCountdownLikeLine(line) ||
      blocked.has(normalized) ||
      isDuplicateInfoValue(line, blockedValues)
    ) {
      continue;
    }
    blocked.add(normalized);
    blockedValues.push(normalized);
    detailLines.push(line);
    if (detailLines.length === 2) {
      break;
    }
  }

  return detailLines;
}

function watchMetricCandidates(metric: MetricCard): string[] {
  const candidates: string[] = [];
  const title = metric.title.trim();
  const value = metric.value.trim();
  const detail = metric.detail?.trim();

  if (!value) {
    return candidates;
  }

  const titleToken = normalizeInfoToken(title);

  if (titleToken === "conf") {
    candidates.push(`Conf ${value}`);
  } else if (!title || metric.hideTitle) {
    candidates.push(value);
  } else if (title.length <= 10 && value.length <= 16) {
    candidates.push(`${title} ${value}`);
  } else {
    candidates.push(value);
  }

  if (detail) {
    candidates.push(detail);
  }

  return candidates;
}

function watchExpandedLines(state: LiveActivityMock): string[] {
  const subtitle = pickUniqueWatchSubtitle(state);
  const blockedValues = [
    normalizeInfoToken(state.title),
    normalizeInfoToken(subtitle),
    normalizeInfoToken(state.statusBar.leadingText),
    normalizeInfoToken(state.statusBar.startLabel),
    normalizeInfoToken(state.statusBar.endLabel),
    normalizeInfoToken(state.statusBar.countdownToken),
    normalizeInfoToken(state.statusBar.countdownCaption),
    normalizeInfoToken(
      state.statusBar.countdownCaption
        ? `${state.statusBar.countdownToken} ${state.statusBar.countdownCaption}`
        : undefined
    ),
  ].filter((value): value is string => value.length > 0);
  const blocked = new Set(blockedValues);

  const candidates = [
    state.dynamicIsland.expandedLeadingText,
    ...(state.dynamicIsland.expandedText
      ?.split("•")
      .map((part) => part.trim()) ?? []),
    ...state.shownMetrics.flatMap(watchMetricCandidates),
  ].filter((value): value is string =>
    Boolean(value && value.trim().length > 0)
  );

  const uniqueLines: string[] = [];
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeInfoToken(candidate);
    if (
      !normalizedCandidate ||
      blocked.has(normalizedCandidate) ||
      isDuplicateInfoValue(candidate, blockedValues)
    ) {
      continue;
    }
    blocked.add(normalizedCandidate);
    blockedValues.push(normalizedCandidate);
    uniqueLines.push(candidate);
    if (uniqueLines.length === 3) {
      break;
    }
  }

  return uniqueLines;
}

function renderMetricCard(
  state: LiveActivityMock,
  metric: MetricCard,
  minimumHeight: number
) {
  const secondaryLine = metric.detail;
  return (
    <Metric
      key={`${state.key}-${metric.title}-${metric.value}-${
        metric.detail ?? ""
      }`}
      $tone={metric.tone ?? "neutral"}
      style={{ minHeight: `${minimumHeight}px` }}
    >
      <MetricHeader>
        {!metric.hideTitle ? <MetricTitle>{metric.title}</MetricTitle> : null}
      </MetricHeader>
      <MetricValue $tone={metric.tone ?? "neutral"}>{metric.value}</MetricValue>
      {secondaryLine ? (
        <MetricDetail
          style={
            metric.hideTitle
              ? { color: "rgba(255,255,255,0.8)", fontWeight: 500 }
              : undefined
          }
        >
          {secondaryLine}
        </MetricDetail>
      ) : null}
    </Metric>
  );
}

function shouldRenderActionIcon(action: ActionItem): boolean {
  return action.icon === "car" || action.icon === "map";
}

function renderStatusBar(state: LiveActivityMock) {
  const statusAccent = state.statusBar.accent ?? state.accent;
  const leftText = state.statusBar.leadingText || state.statusBar.startLabel;
  const rightText =
    state.statusBar.endLabel ||
    (state.statusBar.countdownCaption
      ? `${state.statusBar.countdownToken} ${state.statusBar.countdownCaption}`
      : state.statusBar.countdownToken);
  const hasLeadingText = Boolean(leftText);
  return (
    <StatusFrame $accent={statusAccent}>
      <StatusRow $hasLeading={hasLeadingText}>
        {hasLeadingText ? (
          <LeadingWrap>
            <LeadingText>{leftText}</LeadingText>
          </LeadingWrap>
        ) : null}
        <Track>
          <TrackClip>
            <ProgressFill
              $width={state.statusBar.progressFraction}
              $accent={statusAccent}
            />
            <ReservedFill $width={state.statusBar.reservedFraction} />
          </TrackClip>
        </Track>
        <CountdownRail>
          {state.statusBar.usesEndpointLabelStyleForEndText ? (
            <EndpointValue>{rightText}</EndpointValue>
          ) : (
            <CountdownValue $accent={statusAccent}>{rightText}</CountdownValue>
          )}
        </CountdownRail>
      </StatusRow>
      {state.statusBar.detailText ? (
        <StatusDetailText>{state.statusBar.detailText}</StatusDetailText>
      ) : null}
    </StatusFrame>
  );
}

function renderWatchStatusBar(state: LiveActivityMock) {
  const statusAccent = state.statusBar.accent ?? state.accent;

  return (
    <WatchMiniStatusBar>
      <WatchMiniTrack>
        <ProgressFill
          $width={state.statusBar.progressFraction}
          $accent={statusAccent}
        />
        <ReservedFill $width={state.statusBar.reservedFraction} />
      </WatchMiniTrack>
    </WatchMiniStatusBar>
  );
}

function renderWatchSurface(state: LiveActivityMock) {
  const destinationLine = watchDestinationLine(state);
  const detailLines = watchDetailLines(state, destinationLine);
  const showsMiniBar = shouldRenderCompactStatusMiniBar(state);

  return (
    <WatchCard $accent={state.accent}>
      <WatchTopRow>
        <WatchMark>P.</WatchMark>
        <WatchTimerChip>
          {renderIcon(watchTimerIcon(state), 10)}
          <span>{watchTimerText(state)}</span>
        </WatchTimerChip>
      </WatchTopRow>

      {detailLines.length > 0 || showsMiniBar ? (
        <WatchDetailBlock>
          {detailLines.map((line, index) => (
            <WatchDetailLine
              key={`${state.key}-${line}`}
              $accented={index === 0}
            >
              {line}
            </WatchDetailLine>
          ))}
          {showsMiniBar ? (
            <WatchMiniStatusWrap>{renderWatchStatusBar(state)}</WatchMiniStatusWrap>
          ) : null}
        </WatchDetailBlock>
      ) : null}

      <WatchBottomWrap>
        <WatchTitle>{state.title}</WatchTitle>
        {destinationLine ? (
          <WatchDestination>{destinationLine}</WatchDestination>
        ) : null}
      </WatchBottomWrap>
    </WatchCard>
  );
}

function renderMetricRow(state: LiveActivityMock, metrics: MetricCard[]) {
  const visibleMetrics = metrics.slice(0, 3);
  const minimumHeight = metricMinHeight(visibleMetrics);

  return (
    <MetricRow
      key={`${state.key}-metrics`}
      $count={Math.max(1, visibleMetrics.length)}
    >
      {visibleMetrics.map((metric) =>
        renderMetricCard(state, metric, minimumHeight)
      )}
    </MetricRow>
  );
}

function renderActionRows(state: LiveActivityMock) {
  return (
    <ActionDock>
      {state.actionRows.map((row) => {
        const visibleActions = row.actions.slice(0, 2);
        return (
          <ActionRowFrame key={`${state.key}-${row.label}`}>
            <ActionLabel $accent={actionLabelTone(state, row)}>
              {row.label}
            </ActionLabel>
            <ActionButtons $count={visibleActions.length}>
              {visibleActions.map((action) => (
                <ActionPill
                  key={`${state.key}-${row.label}-${action.label}-${action.icon}`}
                  $primary={action.primary}
                  $accent={state.accent}
                >
                  {shouldRenderActionIcon(action) ? (
                    <ActionIconWrap>{renderIcon(action.icon, 12)}</ActionIconWrap>
                  ) : null}
                  <span>{action.label}</span>
                </ActionPill>
              ))}
            </ActionButtons>
          </ActionRowFrame>
        );
      })}
    </ActionDock>
  );
}

function renderTopRow(state: LiveActivityMock) {
  return (
    <TopRow>
      <DoneLogo src={packLogo} alt="Pack logo" $size={20} />
      <TitleBlock>
        {state.phaseLabel ? (
          <PhaseLabel $accent={state.accent}>{state.phaseLabel}</PhaseLabel>
        ) : null}
        <TitleRow>
          <LiveTitle>{state.title}</LiveTitle>
          <CountdownCluster>{state.relativeCountdown}</CountdownCluster>
        </TitleRow>
        {state.supportingText ? (
          <SupportingText>{state.supportingText}</SupportingText>
        ) : null}
      </TitleBlock>
      <ClusterIconWrap $accent={state.accent}>
        {renderIcon(state.icon, 12)}
      </ClusterIconWrap>
    </TopRow>
  );
}

function renderLiveActivityContent(
  state: LiveActivityMock,
  localizedContent: LiveActivityLabContent
) {
  const metrics = state.shownMetrics.slice(0, state.lockScreen.fullMetricLimit);
  const showNextItem =
    Boolean(state.nextItem) && state.lockScreen.showNextInMid === true;

  return (
    <LiveActivityFrame $accent={state.accent}>
      {renderTopRow(state)}
      {renderStatusBar(state)}
      {metrics.length > 0 ? renderMetricRow(state, metrics) : null}
      {showNextItem ? (
        <NextRow>
          <NextLabel>{localizedContent.nextLabel}</NextLabel>
          <span>{state.nextItem}</span>
        </NextRow>
      ) : null}
      {state.actionRows.length > 0 ? renderActionRows(state) : null}
    </LiveActivityFrame>
  );
}

function renderLockScreenSurface(
  state: LiveActivityMock,
  localizedContent: LiveActivityLabContent
) {
  return (
    <SurfaceSection>
      <SurfaceSectionHeader>
        <SurfaceSectionTitle>{localizedContent.lockScreenTitle}</SurfaceSectionTitle>
        <SurfaceSectionMeta>{localizedContent.lockScreenMeta}</SurfaceSectionMeta>
      </SurfaceSectionHeader>
      <LockScreenStage data-surface="lock-screen">
        <LockScreenCropFrame>
          <LockScreenCrop $accent={state.accent}>
            <LockScreenNotch />
            <LockScreenTime>9:41</LockScreenTime>
            <LockScreenDate>{localizedContent.lockScreenDate}</LockScreenDate>
            <LockScreenActivityWrap>
              <div data-capture-target="lock-screen-raw">
                {renderLiveActivityContent(state, localizedContent)}
              </div>
            </LockScreenActivityWrap>
          </LockScreenCrop>
        </LockScreenCropFrame>
      </LockScreenStage>
    </SurfaceSection>
  );
}

function renderExpandedIsland(state: LiveActivityMock) {
  const trailingText = dynamicIslandExpandedTrailingText(state);

  return (
    <IslandExpanded data-capture-target="dynamic-island-expanded-raw">
      <IslandRegion>
        <ExpandedLogoWrap>
          <DoneLogo src={packLogo} alt="Pack logo" $size={16} />
          {state.dynamicIsland.expandedLeadingText ? (
            <IslandText>{state.dynamicIsland.expandedLeadingText}</IslandText>
          ) : null}
        </ExpandedLogoWrap>
      </IslandRegion>
      <IslandRegion $align="center">
        <IslandText>{state.dynamicIsland.expandedText ?? state.title}</IslandText>
      </IslandRegion>
      <IslandRegion $align="end">
        {trailingText ? <IslandText>{trailingText}</IslandText> : null}
      </IslandRegion>
    </IslandExpanded>
  );
}

function renderCompactIsland(state: LiveActivityMock) {
  return (
    <CompactIslandShell data-capture-target="dynamic-island-compact-raw">
      <CompactIslandSegment $align="left">
        <DoneLogo src={packLogo} alt="Pack logo" $size={14} />
        {state.dynamicIsland.compactLeadingText ? (
          <IslandText>{state.dynamicIsland.compactLeadingText}</IslandText>
        ) : null}
      </CompactIslandSegment>
      <CompactIslandCameraGap />
      <CompactIslandSegment $align="right">
        <IslandText>{compactIslandValue(state)}</IslandText>
      </CompactIslandSegment>
    </CompactIslandShell>
  );
}

function renderMinimalIsland(state: LiveActivityMock) {
  const minimalText = state.dynamicIsland.minimalText ?? state.statusBar.countdownToken;
  const minimalIcon = state.dynamicIsland.minimalIcon ?? state.icon;

  return (
    <MinimalIslandPill data-capture-target="dynamic-island-minimal-raw">
      <MinimalValueRow>{renderIcon(minimalIcon, 11)}</MinimalValueRow>
      <MinimalValueRow>
        <IslandText>{minimalText}</IslandText>
      </MinimalValueRow>
    </MinimalIslandPill>
  );
}

function renderDynamicIslandSurface(
  state: LiveActivityMock,
  localizedContent: LiveActivityLabContent
) {
  return (
    <SurfaceSection>
      <SurfaceSectionHeader>
        <SurfaceSectionTitle>{localizedContent.dynamicIslandTitle}</SurfaceSectionTitle>
        <SurfaceSectionMeta>{localizedContent.dynamicIslandMeta}</SurfaceSectionMeta>
      </SurfaceSectionHeader>
      <DynamicIslandFrame $accent={state.accent} data-surface="dynamic-island">
        <IslandGrid>
          <ExpandedIslandCard $accent={state.accent}>
            {renderExpandedIsland(state)}
          </ExpandedIslandCard>
          <IslandSubgrid>
            <IslandCard $accent={state.accent}>
              <DensityLabel>{localizedContent.compactLabel}</DensityLabel>
              {renderCompactIsland(state)}
            </IslandCard>
            <IslandCard $accent={state.accent}>
              <DensityLabel>{localizedContent.minimalLabel}</DensityLabel>
              {renderMinimalIsland(state)}
            </IslandCard>
          </IslandSubgrid>
        </IslandGrid>
      </DynamicIslandFrame>
    </SurfaceSection>
  );
}

function renderWatchSurfaceSection(
  state: LiveActivityMock,
  localizedContent: LiveActivityLabContent
) {
  return (
    <SurfaceSection>
      <SurfaceSectionHeader>
        <SurfaceSectionTitle>{localizedContent.watchSmallTitle}</SurfaceSectionTitle>
        <SurfaceSectionMeta>{localizedContent.watchSmallMeta}</SurfaceSectionMeta>
      </SurfaceSectionHeader>
      <WatchFrame $accent={state.accent} data-surface="watch-small">
        <WatchGrid>
          <div data-capture-target="watch-small-raw">
            {renderWatchSurface(state)}
          </div>
        </WatchGrid>
      </WatchFrame>
    </SurfaceSection>
  );
}

function renderCaptureStateCard(
  state: LiveActivityMock,
  localizedContent: LiveActivityLabContent
) {
  return (
    <StateCard key={state.key} $accent={state.accent} data-state-key={state.key}>
      <StateHeader>
        <StateNameRow>
          <StateIconBadge $accent={state.accent}>
            {renderIcon(state.icon, 15)}
          </StateIconBadge>
          <StateName>{state.label}</StateName>
        </StateNameRow>
        <StateTag>{state.key}</StateTag>
      </StateHeader>
      <PreviewPair>
        <SurfaceGrid>{renderLockScreenSurface(state, localizedContent)}</SurfaceGrid>
        <SurfaceGrid>
          {renderDynamicIslandSurface(state, localizedContent)}
          {renderWatchSurfaceSection(state, localizedContent)}
        </SurfaceGrid>
      </PreviewPair>
    </StateCard>
  );
}

function renderCaptureMode(
  localizedStates: LiveActivityMock[],
  localizedContent: LiveActivityLabContent
) {
  return (
    <Page>
      <Shell>
        <Header>
          <Eyebrow>{localizedContent.eyebrow}</Eyebrow>
          <Title>{localizedContent.title}</Title>
          <Intro>{localizedContent.captureIntro}</Intro>
        </Header>
        <Grid>
          {localizedStates.map((state) =>
            renderCaptureStateCard(state, localizedContent)
          )}
        </Grid>
      </Shell>
    </Page>
  );
}

const LiveActivityLab: React.FC = () => {
  const { locale } = useI18n();
  const [nativeReviewVersion, setNativeReviewVersion] = useState(() =>
    `${Date.now()}`
  );
  const localizedContent = LIVE_ACTIVITY_LAB_CONTENT[locale];
  const localizedStates = getLocalizedLiveActivityStates(locale);
  const screenshotGroups = getScreenshotGroups(localizedStates, localizedContent);
  const captureMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("capture") === "1";

  useMountEffect(() => {
    if (captureMode) {
      return;
    }

    const interval = window.setInterval(() => {
      setNativeReviewVersion(`${Date.now()}`);
    }, 3000);

    return () => window.clearInterval(interval);
  });

  if (captureMode) {
    return renderCaptureMode(localizedStates, localizedContent);
  }

  return (
    <Page>
      <Shell>
        <Header>
          <Eyebrow>{localizedContent.eyebrow}</Eyebrow>
          <Title>{localizedContent.title}</Title>
          <Intro>{localizedContent.reviewIntro}</Intro>
        </Header>

        <ScreenshotSection data-lab-root="live-activity">
          <ReviewLayout>
            <ActivityDirectory aria-label="Live Activity states">
              {screenshotGroups.map((group) => (
                <ActivityDirectoryItem
                  key={group.key}
                  href={`#live-activity-${group.key}`}
                >
                  <ActivityDirectoryTitle>{group.title}</ActivityDirectoryTitle>
                  <ActivityDirectoryMeta>{group.label}</ActivityDirectoryMeta>
                </ActivityDirectoryItem>
              ))}
            </ActivityDirectory>

            <ScreenshotGroups>
              {screenshotGroups.map((group) => (
                <ScreenshotStateSection
                  key={group.key}
                  id={`live-activity-${group.key}`}
                >
                  <ScreenshotStateHeader>
                    <ScreenshotStateTitle>{group.title}</ScreenshotStateTitle>
                    <ScreenshotStateMeta>{group.label}</ScreenshotStateMeta>
                  </ScreenshotStateHeader>
                  <ScreenshotGrid>
                    <ScreenshotHeader>
                      {localizedContent.screenshotHeaders.label}
                    </ScreenshotHeader>
                    <ScreenshotHeader>
                      {localizedContent.screenshotHeaders.swift}
                    </ScreenshotHeader>
                    <ScreenshotHeader>
                      {localizedContent.screenshotHeaders.website}
                    </ScreenshotHeader>

                    {group.surfaces.map((surface) => (
                      <React.Fragment key={surface.key}>
                        <ScreenshotLabelCell>{surface.label}</ScreenshotLabelCell>
                        <ScreenshotImageCell>
                          <ScreenshotImageMeta>
                            {localizedContent.screenshotMeta.swift}
                          </ScreenshotImageMeta>
                          <ScreenshotImage
                            src={`${surface.swiftImageSrc}#v=${nativeReviewVersion}`}
                            alt={surface.swiftAlt}
                            loading="lazy"
                          />
                        </ScreenshotImageCell>
                        <ScreenshotImageCell>
                          <ScreenshotImageMeta>
                            {localizedContent.screenshotMeta.website}
                          </ScreenshotImageMeta>
                          <ScreenshotImage
                            src={surface.websiteImageSrc}
                            alt={surface.websiteAlt}
                            loading="lazy"
                          />
                        </ScreenshotImageCell>
                      </React.Fragment>
                    ))}
                  </ScreenshotGrid>
                </ScreenshotStateSection>
              ))}
            </ScreenshotGroups>
          </ReviewLayout>
        </ScreenshotSection>
      </Shell>
    </Page>
  );
};

export default LiveActivityLab;
