/* eslint-disable @typescript-eslint/no-unused-vars -- Live Activity lab keeps alternate device mock components staged for screenshot iteration. */
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
import {
  LAB_FIXTURE_LIST,
  LAB_REFERENCE_NOW,
} from "../labs/liveActivityModel/fixtures";
import type { Action, ContentState } from "../labs/liveActivityModel/contentState";
import {
  buildDynamicIslandModel,
  buildMetricBoxes,
  buildStatusBarModel,
  buildLockScreenSurfaceModelFor,
} from "../labs/liveActivityModel/derivation";
import { conciseTimeRemaining } from "../labs/liveActivityModel/helpers";
import type {
  DynamicIslandModel,
  EmphasisColor,
  MetricBox,
  StatusBarModel,
} from "../labs/liveActivityModel/viewModels";

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

// Tone the lock-screen metric card paints, derived from the native MetricBox
// EmphasisColor union. The lab keeps four tone tokens; the seven semantic
// emphases collapse onto them.
type MetricTone = "accent" | "warning" | "danger" | "neutral";

// A lock-screen metric card, projected from a derived `MetricBox`.
type MetricCard = {
  title: string;
  value: string;
  detail?: string;
  hideTitle: boolean;
  tone: MetricTone;
};

// One lock-screen action button, projected from a derived `Action`.
type ActionItem = {
  label: string;
  icon: IconKey;
  primary?: boolean;
};

// Each lab surface renders from this fully-derived state: every display token is
// computed by the model layer (`buildMetricBoxes`, `buildStatusBarModel`,
// `buildDynamicIslandModel`, `buildLockScreenSurfaceModelFor`) from a
// `ContentState` at `LAB_REFERENCE_NOW`. Only `label`/`title` carry through for
// the directory and i18n; nothing here is hand-authored display copy.
type LabState = {
  key: string;
  label: string;
  accent: AccentTone;
  // Resolved primary title (e.g. flight_arrival surfaces the flight number).
  title: string;
  icon: IconKey;
  // Concise live time-remaining to the island countdown target ("1h30m"/"22m").
  compactTime: string;
  metricBoxes: MetricBox[];
  metricCards: MetricCard[];
  statusBar: StatusBarModel | null;
  dynamicIsland: DynamicIslandModel;
  actions: ActionItem[];
  lockScreen: {
    fullMetricLimit: number;
    midMetricLimit: number;
    compactMetricLimit: number;
    showStatusBarInCompact: boolean;
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
  outline: 1px solid rgba(255, 255, 255, 0.1);
  outline-offset: -1px;
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

const ActionDock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

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

// Leading column of the compact island: Pack logo stacked over the concise
// time-remaining, mirroring the minimal presentation so the island stays narrow.
const CompactLeadingStack = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  line-height: 1;
`;

const CompactTimeText = styled.span`
  margin-top: 1px;
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const CompactGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  color: #ffffff;
  flex: none;
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

// ---------------------------------------------------------------------------
// Derive each lab state from a ContentState fixture.
//
// Every display token below is COMPUTED by the model layer at
// `LAB_REFERENCE_NOW` (each fixture's own deterministic reference now, matching
// the native review renders). The render helpers consume these derived models;
// nothing here is hand-authored display copy.
// ---------------------------------------------------------------------------

// Accent tone per native event kind (mirrors the lab's prior per-state accent).
function accentForKind(kind: string): AccentTone {
  switch (kind) {
    case "flight_departure":
    case "flight_arrival":
    case "activity":
      return "flight";
    case "flight_arrived":
    case "hotel_checkin":
      return "ground";
    default:
      return "generic";
  }
}

// Project a native MetricBox EmphasisColor onto one of the lab's four metric
// card tones. Native paints `leaveIn`/highlight pills with the dark-on-saffron
// treatment, which reads as the accent tone here.
function metricToneForEmphasis(emphasis: EmphasisColor): MetricTone {
  switch (emphasis) {
    case "accent":
    case "dark":
    case "success":
      return "accent";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    case "white":
    case "secondary":
    default:
      return "neutral";
  }
}

// Map an action's SF Symbol icon hint onto the lab IconKey union.
function actionIconKey(icon: string | undefined): IconKey {
  switch (icon) {
    case "car.fill":
    case "car":
      return "car";
    case "map.fill":
    case "map":
      return "map";
    default:
      return "next";
  }
}

function projectMetricCard(box: MetricBox): MetricCard {
  return {
    title: box.title,
    value: box.value,
    detail: box.detail,
    hideTitle: !box.showsTitle || box.title.length === 0,
    tone: metricToneForEmphasis(box.emphasis),
  };
}

function projectActions(actions: Action[]): ActionItem[] {
  // Native renders the current-navigation actions; the lab dock shows the first
  // two as a single row, matching the prior single-row presentation.
  return actions.slice(0, 2).map((action) => ({
    label: action.title,
    icon: actionIconKey(action.icon),
    primary: action.style === "primary",
  }));
}

// Resolved primary title: flight_arrival surfaces the flight number, mirroring
// the native `liveActivityTitle`.
function resolveTitle(state: ContentState): string {
  const primary = state.primary;
  if (primary.kind !== "flight_arrival") {
    return primary.title;
  }
  const flight = primary.details.find(
    (r) =>
      r.sourceKey.toLowerCase() === "flightlabel" ||
      r.sourceKey.toLowerCase() === "flight"
  );
  const value = flight?.value.trim();
  return value != null && value.length > 0 ? value : primary.title;
}

function buildLabState(key: string, state: ContentState, label: string): LabState {
  const now = LAB_REFERENCE_NOW;
  const dynamicIsland = buildDynamicIslandModel(state, now);
  const statusBar = buildStatusBarModel(state, now);
  const metricBoxes = buildMetricBoxes(state, now);
  const lockScreen = buildLockScreenSurfaceModelFor(state, now);
  const isPast = state.primary.startAt <= now;
  const compactTime =
    dynamicIsland.countdownTargetAt != null
      ? conciseTimeRemaining(dynamicIsland.countdownTargetAt, now)
      : "";
  return {
    key,
    label,
    accent: accentForKind(state.primary.kind),
    title: resolveTitle(state),
    icon: dynamicIsland.compactLeadingSymbolName ?? "calendar",
    compactTime,
    metricBoxes,
    metricCards: metricBoxes.map(projectMetricCard),
    statusBar,
    dynamicIsland,
    actions: projectActions(state.actions),
    lockScreen: {
      fullMetricLimit: lockScreen.fullMetricLimit,
      midMetricLimit: lockScreen.midMetricLimit,
      compactMetricLimit: lockScreen.compactMetricLimit,
      showStatusBarInCompact: lockScreen.showStatusBarInCompact && !isPast,
    },
  };
}

// English directory labels per fixture key (the prior hand-authored `label`).
const LAB_STATE_LABELS_EN: Record<string, string> = {
  flight_departure: "Flight Departure",
  flight_departure_sparse: "Departure · Sparse",
  flight_arrival: "In Flight",
  flight_arrival_delayed: "Flight Delayed",
  flight_arrived: "Flight Arrived",
  flight_arrived_sparse: "Arrived · Sparse",
  hotel_checkin: "Hotel Check-in",
  hotel_checkin_no_navigation: "Hotel · No Navigation",
  activity: "Activity",
  activity_long_title_no_navigation: "Activity · Long Title",
  generic_event: "Generic",
  scrubber_activity: "Scrubber Activity",
  scrubber_hotel: "Scrubber Hotel",
  scrubber_landed: "Scrubber Landed",
};

const LAB_STATE_LABELS_ES: Record<string, string> = {
  flight_departure: "Salida del vuelo",
  flight_departure_sparse: "Salida · Mínima",
  flight_arrival: "En vuelo",
  flight_arrival_delayed: "Vuelo retrasado",
  flight_arrived: "Vuelo aterrizado",
  flight_arrived_sparse: "Aterrizado · Mínima",
  hotel_checkin: "Check-in del hotel",
  hotel_checkin_no_navigation: "Hotel · Sin navegación",
  activity: "Actividad",
  activity_long_title_no_navigation: "Actividad · Título largo",
  generic_event: "Genérico",
  scrubber_activity: "Actividad scrubber",
  scrubber_hotel: "Hotel scrubber",
  scrubber_landed: "Aterrizado scrubber",
};

// Spanish translations for the derived action button labels.
function localizeActionLabel(label: string, locale: SupportedLocale): string {
  if (locale !== "es") {
    return label;
  }
  const translations: Record<string, string> = {
    Maps: "Mapas",
    Open: "Abrir",
    "Uber to airport": "Uber al aeropuerto",
    "Uber to hotel": "Uber al hotel",
    "Uber to dinner": "Uber a cena",
    Uber: "Uber",
  };
  return translations[label] ?? label;
}

function getLocalizedLiveActivityStates(locale: SupportedLocale): LabState[] {
  const labels =
    locale === "es" ? LAB_STATE_LABELS_ES : LAB_STATE_LABELS_EN;
  return LAB_FIXTURE_LIST.map(({ key, state }) => {
    const labState = buildLabState(key, state, labels[key] ?? key);
    if (locale !== "es") {
      return labState;
    }
    return {
      ...labState,
      actions: labState.actions.map((action) => ({
        ...action,
        label: localizeActionLabel(action.label, locale),
      })),
    };
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

function getNativeReviewBaseName(state: LabState): string {
  return state.key;
}

function getScreenshotSurfaces(
  state: LabState,
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
  localizedStates: LabState[],
  localizedContent: LiveActivityLabContent
): ScreenshotGroup[] {
  return localizedStates.map((state) => ({
    key: state.key,
    label: state.label,
    title: state.title,
    surfaces: getScreenshotSurfaces(state, localizedContent),
  }));
}

function renderIcon(icon: IconKey, size = 14) {
  const Icon = iconMap[icon];
  return <Icon size={size} strokeWidth={2.1} aria-hidden="true" />;
}

function normalizeInfoToken(value: string | undefined | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Map a derived EmphasisColor onto the lab's AccentTone, used for the status-bar
// fill and countdown color so emphasis is honored visually.
function accentForEmphasis(
  emphasis: EmphasisColor,
  fallback: AccentTone
): AccentTone {
  switch (emphasis) {
    case "success":
      return "ground";
    case "danger":
    case "warning":
    case "accent":
      return "flight";
    default:
      return fallback;
  }
}

// The live countdown token shown when no explicit trailing/minimal text exists:
// concise time-remaining to the island countdown target ("1h30m" / "22m").
function islandCountdownToken(state: LabState): string {
  return state.compactTime || state.statusBar?.countdownToken || "";
}

function renderMetricCard(state: LabState, metric: MetricCard, index: number) {
  const secondaryLine = metric.detail;
  return (
    <Metric
      key={`${state.key}-metric-${index}`}
      $tone={metric.tone}
    >
      <MetricHeader>
        {!metric.hideTitle ? <MetricTitle>{metric.title}</MetricTitle> : null}
      </MetricHeader>
      <MetricValue $tone={metric.tone}>{metric.value}</MetricValue>
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

function renderStatusBar(state: LabState) {
  const status = state.statusBar;
  if (status == null) {
    return null;
  }
  const fillAccent = accentForEmphasis(
    status.progressColor ?? status.countdownEmphasis,
    state.accent
  );
  const leftText = status.leadingText || status.startLabel;
  const rightText =
    status.endLabel ||
    (status.countdownCaption
      ? `${status.countdownToken} ${status.countdownCaption}`
      : status.countdownToken);
  const hasLeadingText = Boolean(leftText);
  return (
    <StatusFrame $accent={fillAccent}>
      <StatusRow $hasLeading={hasLeadingText}>
        {hasLeadingText ? (
          <LeadingWrap>
            <LeadingText>{leftText}</LeadingText>
          </LeadingWrap>
        ) : null}
        <Track>
          <TrackClip>
            <ProgressFill $width={status.progressFraction} $accent={fillAccent} />
            <ReservedFill $width={status.reservedFraction} />
          </TrackClip>
        </Track>
        <CountdownRail>
          {status.usesEndpointLabelStyleForEndText ? (
            <EndpointValue>{rightText}</EndpointValue>
          ) : (
            <CountdownValue $accent={fillAccent}>{rightText}</CountdownValue>
          )}
        </CountdownRail>
      </StatusRow>
      {status.detailText ? (
        <StatusDetailText>{status.detailText}</StatusDetailText>
      ) : null}
    </StatusFrame>
  );
}

function shouldRenderWatchMiniBar(state: LabState): boolean {
  const status = state.statusBar;
  return status != null && (status.progressFraction > 0 || status.reservedFraction > 0);
}

function renderWatchStatusBar(state: LabState) {
  const status = state.statusBar;
  if (status == null) {
    return null;
  }
  const fillAccent = accentForEmphasis(
    status.progressColor ?? status.countdownEmphasis,
    state.accent
  );
  return (
    <WatchMiniStatusBar>
      <WatchMiniTrack>
        <ProgressFill $width={status.progressFraction} $accent={fillAccent} />
        <ReservedFill $width={status.reservedFraction} />
      </WatchMiniTrack>
    </WatchMiniStatusBar>
  );
}

function watchTimerIcon(state: LabState): IconKey {
  return state.statusBar?.countdownCaption === "Leave" ? "car" : "clock";
}

function watchTimerText(state: LabState): string {
  const status = state.statusBar;
  if (status == null) {
    return islandCountdownToken(state);
  }
  if (status.countdownCaption) {
    return `${status.countdownToken} ${status.countdownCaption}`;
  }
  return status.countdownToken;
}

// Watch detail lines, derived from the lock-screen metric boxes: short
// "title value" (or value-only) fragments, de-duplicated against the title and
// the timer chip. Native's small widget mirrors these same metric tokens.
function watchDetailCandidates(state: LabState): string[] {
  const lines: string[] = [];
  for (const metric of state.metricCards) {
    const title = metric.title.trim();
    const value = metric.value.trim();
    if (!value) {
      continue;
    }
    if (metric.hideTitle || !title) {
      lines.push(value);
    } else if (title.length <= 10 && value.length <= 16) {
      lines.push(`${title} ${value}`);
    } else {
      lines.push(value);
    }
    if (metric.detail) {
      lines.push(metric.detail.trim());
    }
  }
  return lines;
}

function renderWatchSurface(state: LabState) {
  const blocked = new Set<string>([
    normalizeInfoToken(state.title),
    normalizeInfoToken(watchTimerText(state)),
    normalizeInfoToken(state.statusBar?.countdownToken),
  ]);
  const lines: string[] = [];
  for (const candidate of watchDetailCandidates(state)) {
    const token = normalizeInfoToken(candidate);
    if (!token || blocked.has(token)) {
      continue;
    }
    blocked.add(token);
    lines.push(candidate);
    if (lines.length === 3) {
      break;
    }
  }
  const destinationLine = lines.length > 0 ? lines[lines.length - 1] : undefined;
  const detailLines = destinationLine ? lines.slice(0, -1).slice(0, 2) : lines.slice(0, 2);
  const showsMiniBar = shouldRenderWatchMiniBar(state);

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
            <WatchDetailLine key={`${state.key}-watch-${index}`} $accented={index === 0}>
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

function renderMetricRow(state: LabState) {
  const visibleMetrics = state.metricCards.slice(
    0,
    Math.min(3, state.lockScreen.fullMetricLimit)
  );

  return (
    <MetricRow
      key={`${state.key}-metrics`}
      $count={Math.max(1, visibleMetrics.length)}
    >
      {visibleMetrics.map((metric, index) =>
        renderMetricCard(state, metric, index)
      )}
    </MetricRow>
  );
}

function renderActionRows(state: LabState) {
  const visibleActions = state.actions.slice(0, 2);
  if (visibleActions.length === 0) {
    return null;
  }
  return (
    <ActionDock>
      <ActionButtons $count={visibleActions.length}>
        {visibleActions.map((action, index) => (
          <ActionPill
            key={`${state.key}-action-${index}`}
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
    </ActionDock>
  );
}

function renderTopRow(state: LabState) {
  return (
    <TopRow>
      <DoneLogo src={packLogo} alt="Pack logo" $size={20} />
      <TitleBlock>
        <TitleRow>
          <LiveTitle>{state.title}</LiveTitle>
          <CountdownCluster>{islandCountdownToken(state)}</CountdownCluster>
        </TitleRow>
      </TitleBlock>
      <ClusterIconWrap $accent={state.accent}>
        {renderIcon(state.icon, 12)}
      </ClusterIconWrap>
    </TopRow>
  );
}

function renderLiveActivityContent(state: LabState) {
  const hasMetrics = state.metricCards.length > 0;

  return (
    <LiveActivityFrame $accent={state.accent}>
      {renderTopRow(state)}
      {renderStatusBar(state)}
      {hasMetrics ? renderMetricRow(state) : null}
      {renderActionRows(state)}
    </LiveActivityFrame>
  );
}

function renderLockScreenSurface(
  state: LabState,
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
                {renderLiveActivityContent(state)}
              </div>
            </LockScreenActivityWrap>
          </LockScreenCrop>
        </LockScreenCropFrame>
      </LockScreenStage>
    </SurfaceSection>
  );
}

function renderExpandedIsland(state: LabState) {
  const di = state.dynamicIsland;
  // Trailing: explicit token if present, else the live countdown (mirrors
  // native, which shows the countdown in the trailing slot, never the compact
  // detail token).
  const trailingText =
    di.expandedTrailingText ??
    (di.showsCountdown ? islandCountdownToken(state) : undefined);

  return (
    <IslandExpanded data-capture-target="dynamic-island-expanded-raw">
      <IslandRegion>
        <ExpandedLogoWrap>
          <DoneLogo src={packLogo} alt="Pack logo" $size={16} />
          {di.expandedLeadingText ? (
            <IslandText>{di.expandedLeadingText}</IslandText>
          ) : null}
        </ExpandedLogoWrap>
      </IslandRegion>
      <IslandRegion $align="center">
        <IslandText>{di.expandedText ?? state.title}</IslandText>
      </IslandRegion>
      <IslandRegion $align="end">
        {trailingText ? <IslandText>{trailingText}</IslandText> : null}
      </IslandRegion>
    </IslandExpanded>
  );
}

function renderCompactIsland(state: LabState) {
  // Leading: Pack logo over the concise time-remaining, then the kind glyph.
  // Trailing: the derived compact detail token (gate / seat / claim / name).
  const time = islandCountdownToken(state);
  const glyph = state.dynamicIsland.compactLeadingSymbolName ?? state.icon;
  const detail = state.dynamicIsland.compactTrailingText;
  return (
    <CompactIslandShell data-capture-target="dynamic-island-compact-raw">
      <CompactIslandSegment $align="left">
        <CompactLeadingStack>
          <DoneLogo src={packLogo} alt="Pack logo" $size={14} />
          {time ? <CompactTimeText>{time}</CompactTimeText> : null}
        </CompactLeadingStack>
        <CompactGlyph>{renderIcon(glyph, 12)}</CompactGlyph>
      </CompactIslandSegment>
      <CompactIslandCameraGap />
      <CompactIslandSegment $align="right">
        {detail ? <IslandText>{detail}</IslandText> : null}
      </CompactIslandSegment>
    </CompactIslandShell>
  );
}

function renderMinimalIsland(state: LabState) {
  const di = state.dynamicIsland;
  const minimalText = di.minimalText ?? islandCountdownToken(state);
  const minimalIcon = di.minimalSymbolName ?? di.compactLeadingSymbolName ?? state.icon;

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
  state: LabState,
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
  state: LabState,
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
  state: LabState,
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
  localizedStates: LabState[],
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
