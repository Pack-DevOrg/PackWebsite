import React, { ReactNode, Suspense, startTransition, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useMountEffect } from "@/hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";
import {
  Award,
  BarChart3,
  BedDouble,
  Bolt,
  Calendar,
  CalendarDays,
  ChevronDown,
  CreditCard,
  DollarSign,
  History,
  MapPin,
  Menu,
  Lock,
  MoonStar,
  Mic,
  Navigation,
  PencilLine,
  Phone,
  Plane,
  Plus,
  ReceiptText,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
  UserRound,
  Wifi,
  X,
} from "lucide-react";
import {
  bookingDisclaimerLines,
  bookingProtectionRows,
  bookingSeatRows,
  bookingSpecialRequestRows,
  journeyShowcaseItems,
  hotelOptions,
  outlineItems,
  outboundFlightOptions,
  parseDisplayAmount,
  planDetailRows,
  planPreferenceChips,
  planShowcaseItems,
  recordRows,
  reviewShowcaseItems,
  returnFlightOptions,
  searchFlightOptionRows,
  searchHotelOptionRows,
  statsActivityRows,
  statsAirlineRows,
  statsPatternRows,
} from "./hero/heroJourneyData";
import type {
  PlanFlightOption,
  PlanHotelOption,
} from "./hero/heroJourneyData";

const HeroJourneyMapCard = React.lazy(() => import("./hero/HeroJourneyMapCard"));

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const marquee = keyframes`
  from {
    transform: translateX(-33.333%);
  }
  to {
    transform: translateX(-66.666%);
  }
`;

const marqueeReverse = keyframes`
  from {
    transform: translateX(-66.666%);
  }
  to {
    transform: translateX(-33.333%);
  }
`;

const reveal = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scan = keyframes`
  0% {
    transform: translateX(-15%);
    opacity: 0;
  }
  20%,
  80% {
    opacity: 1;
  }
  100% {
    transform: translateX(120%);
    opacity: 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.72;
  }
  50% {
    transform: scale(1.16);
    opacity: 1;
  }
`;

const progress = keyframes`
  from {
    transform: translateX(-36%);
  }
  to {
    transform: translateX(0%);
  }
`;

const HeroSection = styled.section`
  position: relative;
  overflow: visible;
  padding: 1rem 0 clamp(3.5rem, 7vw, 6rem);

  @media (max-width: 739px) {
    overflow: visible;
    padding: 0.95rem 0 2.6rem;
  }
`;

const Frame = styled.div`
  position: relative;
  isolation: isolate;
  border-radius: 2rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    radial-gradient(circle at 0% 0%, rgba(231, 35, 64, 0.16), transparent 28%),
    radial-gradient(circle at 100% 0%, rgba(198, 165, 88, 0.16), transparent 46%),
    radial-gradient(circle at 80% 12%, rgba(198, 165, 88, 0.07), transparent 56%),
    linear-gradient(135deg, rgba(15, 11, 8, 0.98) 0%, rgba(19, 15, 11, 0.98) 44%, rgba(25, 20, 14, 0.94) 76%, rgba(22, 17, 11, 0.98) 100%),
    linear-gradient(180deg, rgba(14, 10, 8, 0.98), rgba(8, 7, 6, 1));
  box-shadow: var(--shadow-elevated);
  overflow: visible;

  @media (max-width: 739px) {
    border-radius: 1.65rem;
    overflow: hidden;
  }
`;

const CopyScrim = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: min(56%, 48rem);
  background:
    linear-gradient(90deg, rgba(8, 7, 6, 0.985) 0%, rgba(8, 7, 6, 0.955) 56%, rgba(8, 7, 6, 0.76) 76%, rgba(8, 7, 6, 0.24) 100%);
  filter: blur(22px);
  transform: translateX(-2%);
  pointer-events: none;
  z-index: 0;

  @media (max-width: 979px) {
    width: 100%;
    height: 58%;
    bottom: auto;
    background:
      linear-gradient(180deg, rgba(8, 7, 6, 0.98) 0%, rgba(8, 7, 6, 0.92) 70%, rgba(8, 7, 6, 0.18) 100%);
    filter: blur(0);
    transform: none;
  }
`;

const TopRail = styled.div`
  display: grid;
  gap: 0.45rem;
  padding: 0.08rem 1rem 0;
  position: relative;
  z-index: 1;
  justify-items: center;
  width: min(100%, 70rem);

  @media (max-width: 739px) {
    gap: 0.34rem;
    padding: 0.1rem 0.3rem 0;
    width: 100%;
  }

  @media (max-width: 430px) {
    gap: 0.28rem;
    padding: 0.05rem 0.15rem 0;
  }
`;

const RailStatement = styled.div`
  display: grid;
  gap: 0.08rem;
  width: max-content;
  max-width: 100%;
  justify-items: center;
  justify-self: center;
  text-align: center;
  min-height: 2.35rem;
  color: rgba(255, 248, 236, 0.98);
  font-size: 1.16rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media (max-width: 739px) {
    min-height: 2.15rem;
    font-size: 0.98rem;
    letter-spacing: 0.05em;
  }
`;

const RailStatementAccent = styled.span`
  display: block;
  background: linear-gradient(135deg, #f3d27a 0%, #ebbe58 62%, #e72340 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 1.44em;
  line-height: 0.94;
`;

const MarqueeViewport = styled.div`
  width: 100%;
  overflow: hidden;
  opacity: 0.98;
  mask-image: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
`;

const MarqueeStack = styled.div`
  display: grid;
  gap: 0.48rem;
  width: 100%;

  @media (max-width: 739px) {
    gap: 0.3rem;
  }
`;

const MarqueeTrack = styled.div<{ $reverse?: boolean }>`
  display: flex;
  width: max-content;
  animation: ${({ $reverse }) => ($reverse ? marqueeReverse : marquee)} 32s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const MarqueeGroup = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 0.65rem;
  padding-right: 0.65rem;
`;

const MarqueeItem = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.66rem 0.98rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.18);
  background: rgba(243, 210, 122, 0.09);
  color: rgba(255, 244, 214, 0.94);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;

  @media (max-width: 739px) {
    padding: 0.54rem 0.72rem;
    font-size: 0.58rem;
    letter-spacing: 0.08em;
  }

  @media (max-width: 430px) {
    padding: 0.46rem 0.62rem;
    font-size: 0.52rem;
    letter-spacing: 0.07em;
  }

  &::before {
    content: "•";
    margin-right: 0.55rem;
    color: #f3d27a;

    @media (max-width: 739px) {
      margin-right: 0.36rem;
    }
  }
`;

const HeroGrid = styled.div`
  display: grid;
  gap: 1.2rem;
  padding: clamp(0.85rem, 2.2vw, 1.2rem) clamp(1.5rem, 4vw, 3rem) clamp(2.6rem, 5vw, 4.5rem);
  justify-items: center;

  @media (max-width: 739px) {
    gap: 1.1rem;
    padding: 0.7rem 0.9rem 1.45rem;
  }
`;

const CopyColumn = styled.div`
  display: grid;
  gap: 1.15rem;
  align-content: start;
  justify-items: center;
  position: relative;
  z-index: 1;
  width: min(95%, 108rem);
  text-align: center;

  @media (max-width: 979px) {
    width: 100%;
  }

  @media (max-width: 739px) {
    gap: 1.35rem;
  }
`;

const Headline = styled.h1`
  margin: 0;
  width: min(95%, 15ch);
  max-width: none;
  font-size: clamp(3.5rem, 7.2vw, 5.8rem);
  line-height: 0.9;
  letter-spacing: -0.055em;
  color: rgba(255, 248, 236, 0.98);
  text-shadow: 0 8px 30px rgba(0, 0, 0, 0.22);
  animation: ${reveal} 560ms ease-out 140ms both;

  @media (max-width: 979px) {
    width: 100%;
  }

  @media (max-width: 739px) {
    width: min(100%, 9.6ch);
    font-size: clamp(2.9rem, 13vw, 4.15rem);
    line-height: 0.92;
    letter-spacing: -0.05em;
  }

  @media (max-width: 430px) {
    width: min(100%, 8.8ch);
    font-size: clamp(2.6rem, 11.8vw, 3.55rem);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const HeadlineLine = styled.span`
  display: block;
`;

const HeadlineAccent = styled.span`
  color: #f3d27a;
`;

const SupportingCopy = styled.p`
  margin: 0;
  max-width: 31rem;
  color: rgba(247, 240, 227, 0.74);
  font-size: clamp(0.98rem, 1.35vw, 1.1rem);
  line-height: 1.5;
  text-wrap: pretty;
  animation: ${reveal} 560ms ease-out 200ms both;

  @media (max-width: 739px) {
    max-width: min(100%, 22.5rem);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  @media (max-width: 430px) {
    max-width: min(100%, 20.5rem);
    font-size: 0.89rem;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ActionSlot = styled.div`
  animation: ${reveal} 560ms ease-out 260ms both;
  width: min(100%, 40rem);
  justify-self: center;

  @media (max-width: 739px) {
    width: min(100%, 24rem);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const OutlineStage = styled.div`
  position: relative;
  width: min(100%, 72rem);
  margin-inline: auto;
  margin-top: 0.8rem;

  @media (min-width: 980px) {
    clip-path: inset(0 0 0 0);
    padding-bottom: clamp(8rem, 14vh, 11rem);
  }

  @media (max-width: 739px) {
    margin-top: 0.18rem;
  }
`;

const JourneyPlaceholder = styled.div`
  width: min(100%, 72rem);
  margin-inline: auto;
  margin-top: 1rem;
  min-height: clamp(420px, 58vw, 760px);
  border-radius: 1.8rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    linear-gradient(180deg, rgba(17, 13, 10, 0.86), rgba(11, 9, 7, 0.92)),
    rgba(255, 248, 236, 0.03);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
`;

const JourneyPlaceholderGlow = styled.div`
  width: 100%;
  height: 100%;
  background:
    linear-gradient(
      90deg,
      rgba(243, 210, 122, 0.04) 0%,
      rgba(243, 210, 122, 0.1) 42%,
      rgba(231, 35, 64, 0.08) 58%,
      rgba(243, 210, 122, 0.04) 100%
    );
  background-size: 200% 100%;
  animation: heroJourneyPlaceholder 1.8s ease-in-out infinite;

  @keyframes heroJourneyPlaceholder {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: -100% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ComparisonGrid = styled.div`
  display: grid;
  gap: 1rem;
  align-items: stretch;

  @media (min-width: 980px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
`;

const ComparisonColumn = styled.div`
  display: grid;
  gap: 0.7rem;
  align-content: start;
`;

const ColumnHeading = styled.div`
  display: grid;
  gap: 0.18rem;
  padding-inline: 0.2rem;
`;

const ColumnEyebrow = styled.span`
  color: rgba(243, 210, 122, 0.82);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const ColumnTitle = styled.h2`
  margin: 0;
  color: rgba(255, 248, 236, 0.96);
  font-size: clamp(1.3rem, 2.2vw, 1.75rem);
  line-height: 1.05;
`;

const ColumnCopy = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.72);
  font-size: 0.92rem;
  line-height: 1.45;
  max-width: 26rem;
`;

const JourneySectionHeader = styled.header`
  display: grid;
  gap: 0.55rem;
  padding: 0.2rem 0.2rem 0;
  max-width: 34rem;
  margin-inline: auto;
  justify-items: center;
  text-align: center;

  @media (min-width: 980px) {
    gap: 0.7rem;
    max-width: 38rem;
  }
`;

const JourneySectionEyebrow = styled.span`
  color: rgba(243, 210, 122, 0.86);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`;

const JourneySectionTitle = styled.h2`
  margin: 0;
  color: rgba(255, 248, 236, 0.98);
  font-size: clamp(1.9rem, 4vw, 3.15rem);
  line-height: 0.96;
  letter-spacing: -0.05em;
  text-wrap: balance;
`;

const JourneySectionCopy = styled.p`
  margin: 0;
  max-width: 30rem;
  color: rgba(247, 240, 227, 0.7);
  font-size: clamp(0.96rem, 1.35vw, 1.08rem);
  line-height: 1.5;
  text-wrap: balance;
`;

const VisualColumn = styled.div`
  position: relative;
  min-height: clamp(28rem, 48vw, 39rem);
  animation: ${reveal} 620ms ease-out 220ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const VisualGlow = styled.div`
  position: absolute;
  inset: 10% 12% auto auto;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(243, 210, 122, 0.26) 0%, rgba(243, 210, 122, 0) 70%);
  filter: blur(22px);
  pointer-events: none;
`;

const FloatingAccent = styled.div<{
  $top?: string;
  $left?: string;
  $right?: string;
  $bottom?: string;
  $size: string;
  $delay?: string;
  $tone?: "gold" | "red";
}>`
  position: absolute;
  top: ${({ $top }) => $top ?? "auto"};
  left: ${({ $left }) => $left ?? "auto"};
  right: ${({ $right }) => $right ?? "auto"};
  bottom: ${({ $bottom }) => $bottom ?? "auto"};
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border-radius: 999px;
  pointer-events: none;
  filter: blur(2px);
  opacity: 0.28;
  background: ${({ $tone = "gold" }) =>
    $tone === "gold"
      ? "radial-gradient(circle, rgba(243, 210, 122, 0.22) 0%, rgba(243, 210, 122, 0) 72%)"
      : "radial-gradient(circle, rgba(231, 35, 64, 0.18) 0%, rgba(231, 35, 64, 0) 72%)"};
  animation: ${float} 9s ease-in-out infinite;
  animation-delay: ${({ $delay = "0s" }) => $delay};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ShowcaseGrid = styled.div`
  position: relative;
  display: grid;
  gap: 1rem;
  height: 100%;
`;

const ProductPanel = styled.article<{ $accent?: "gold" | "red" | "green" }>`
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 1.8rem;
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
    width: 34%;
    background: linear-gradient(90deg, rgba(243, 210, 122, 0), rgba(243, 210, 122, 0.1), rgba(243, 210, 122, 0));
    filter: blur(10px);
    animation: ${scan} 6.4s linear infinite;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
  }
`;

const PlanDemoPanel = styled(ProductPanel)`
  margin-top: 1.6rem;
  min-height: 80rem;

  @media (max-width: 1100px) {
    min-height: auto;
  }

  @media (max-width: 739px) {
    margin-top: 1rem;
  }
`;

const PhoneShell = styled.div`
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  border-radius: 1.8rem;
  background:
    linear-gradient(180deg, rgba(13, 11, 9, 0.96), rgba(7, 7, 7, 0.98)),
    radial-gradient(circle at top center, rgba(243, 210, 122, 0.08), transparent 28%);
  border: 1px solid rgba(255, 248, 236, 0.08);
`;

const AppSurface = styled.div`
  border-radius: 1.45rem;
  overflow: hidden;
  border: 1px solid rgba(255, 248, 236, 0.1);
  background:
    linear-gradient(180deg, rgba(12, 10, 20, 0.98), rgba(8, 8, 12, 0.98)),
    radial-gradient(circle at top center, rgba(243, 210, 122, 0.08), transparent 28%);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);
`;

const AppMapFrame = styled(AppSurface)`
  padding: 0.85rem;
`;

const ReviewNarrativeItem = styled.article<{ $active: boolean }>`
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 1.15rem;
  border: 1px solid
    ${({ $active }) =>
      $active ? "rgba(243, 210, 122, 0.22)" : "rgba(243, 210, 122, 0.1)"};
  background:
    radial-gradient(
      circle at top right,
      ${({ $active }) =>
        $active ? "rgba(243, 210, 122, 0.12)" : "rgba(243, 210, 122, 0.04)"},
      transparent 38%
    ),
    linear-gradient(180deg, rgba(18, 15, 12, 0.98), rgba(14, 12, 10, 0.98));
  box-shadow:
    inset 0 1px 0 rgba(255, 248, 236, 0.03),
    ${({ $active }) =>
      $active ? "0 18px 34px rgba(0, 0, 0, 0.18)" : "0 10px 24px rgba(0, 0, 0, 0.12)"};
  transition:
    border-color 180ms ease-out,
    transform 180ms ease-out,
    box-shadow 180ms ease-out;

  @media (min-width: 980px) {
    min-height: 28rem;
    align-content: center;
    padding: 1.4rem;
  }
`;

const ReviewNarrativeOrder = styled.span`
  color: rgba(243, 210, 122, 0.82);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const ReviewNarrativeMeta = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.72);
  font-size: 0.92rem;
  line-height: 1.55;
  max-width: 28rem;

  @media (min-width: 980px) {
    max-width: 13rem;
    font-size: 0.82rem;
    line-height: 1.45;
  }
`;

const ReviewPhoneRail = styled.div`
  display: none;

  @media (min-width: 980px) {
    display: block;
    position: sticky;
    top: 3.5svh;
    align-self: start;
    justify-self: center;
    z-index: 1;
    overflow: visible;
  }
`;

const ReviewPhoneStage = styled.div`
  display: grid;
  place-items: center;
  min-height: clamp(37rem, 76svh, 42rem);
  padding: 0;
  pointer-events: none;

  @media (min-width: 980px) {
    min-height: 82svh;
  }
`;

const JourneyPhoneCrossfadeStage = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  width: min(100%, 28rem);
  min-height: clamp(37rem, 76svh, 42rem);
  max-height: clamp(37rem, 76svh, 42rem);
  overflow: visible;
  z-index: 1;
  pointer-events: none;

  @media (min-width: 980px) {
    width: min(100%, 39rem);
    min-height: 82svh;
    max-height: 82svh;
  }
`;

const ReviewPhoneSwitch = styled.div`
  width: 100%;
  height: 100%;
`;

const MobileReviewPhoneWrap = styled.div`
  display: block;

  @media (min-width: 980px) {
    display: none;
  }
`;

const JourneyShowcaseLayout = styled.div`
  display: none;
  gap: 0.9rem;
  margin-top: 1.35rem;
  align-items: start;

  @media (min-width: 980px) {
    display: grid;
    position: relative;
    grid-template-columns: minmax(4.75rem, 5.5rem) minmax(11.25rem, 13rem) minmax(31rem, 35rem);
    justify-content: center;
    gap: clamp(1.4rem, 2.2vw, 2.4rem);
    align-items: start;
    margin-top: 1.7rem;
  }
`;

const MobileJourneyShowcaseLayout = styled.div`
  position: relative;
  display: grid;
  gap: 1rem;
  margin-top: 1.35rem;
  align-items: start;

  @media (min-width: 980px) {
    display: none;
  }
`;

const JourneyChapterRail = styled.div`
  display: none;

  @media (min-width: 980px) {
    display: grid;
    position: sticky;
    top: max(2.5rem, calc(50vh - 6.35rem));
    z-index: 2;
    padding: 0.2rem 0;
    align-content: start;
    align-self: start;
  }
`;

const JourneyNarrativeColumn = styled.div`
  display: grid;
  gap: 1.6rem;

  @media (min-width: 980px) {
    position: relative;
    display: grid;
    gap: 0;
    padding: clamp(2.5rem, 5vh, 4rem) 0;
  }
`;

const DesktopJourneyNarrativeStage = styled.div`
  display: none;

  @media (min-width: 980px) {
    display: grid;
    position: sticky;
    top: max(2.25rem, calc(50vh - 6.95rem));
    min-height: 11.5rem;
    align-content: center;
  }
`;

const DesktopJourneyNarrativeLayer = styled.div<{ $active: boolean }>`
  grid-area: 1 / 1;
  display: grid;
  gap: 0.38rem;
  max-width: 100%;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transform: none;
  transition: opacity 420ms ease;
  pointer-events: none;
  text-align: center;
  justify-items: center;

  @media (min-width: 980px) {
    max-width: 11.5rem;
    text-align: left;
    justify-items: start;
  }
`;

const JourneyChapterPill = styled.a<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  min-height: 2rem;
  padding: 0.25rem 0 0.25rem 0.95rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: ${({ $active }) => ($active ? "#fff8ec" : "rgba(247, 240, 227, 0.68)")};
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: ${({ $active }) => ($active ? 1 : 0.58)};
  transition: opacity 180ms ease-out, color 180ms ease-out;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  z-index: 1;
  white-space: nowrap;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: ${({ $active }) => ($active ? "0.45rem" : "0.28rem")};
    height: ${({ $active }) => ($active ? "0.45rem" : "0.28rem")};
    border-radius: 999px;
    background: ${({ $active }) =>
      $active ? "rgba(243, 210, 122, 0.96)" : "rgba(247, 240, 227, 0.34)"};
    box-shadow: ${({ $active }) =>
      $active ? "0 0 0 0.35rem rgba(243, 210, 122, 0.12)" : "none"};
    transform: translateY(-50%);
    transition:
      width 180ms ease-out,
      height 180ms ease-out,
      background 180ms ease-out,
      box-shadow 180ms ease-out;
  }

  &:focus-visible {
    outline: 2px solid rgba(243, 210, 122, 0.5);
    outline-offset: 0.3rem;
  }

  @media (min-width: 980px) {
    white-space: normal;
  }
`;

const JourneyNarrativeItem = styled(ReviewNarrativeItem)<{
  $desktopMinHeight?: string;
  $mobileMinHeight?: string;
}>`
  scroll-margin-top: 8rem;
  min-height: ${({ $mobileMinHeight = "78svh" }) => $mobileMinHeight};
  border: none;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
  display: grid;
  gap: 1rem;
  align-content: start;
  opacity: 1;
  filter: none;
  transform: none;

  @media (min-width: 980px) {
    display: block;
    gap: 0;
    padding: 0;
    min-height: ${({ $desktopMinHeight = "118svh" }) => $desktopMinHeight};
  }
`;

const JourneyNarrativeText = styled.div`
  display: grid;
  gap: 0.4rem;
  justify-items: center;
  text-align: center;

  @media (min-width: 980px) {
    display: none;
  }
`;

const JourneyNarrativeTitle = styled.h3`
  margin: 0;
  color: rgba(255, 248, 236, 0.96);
  font-size: 1.3rem;
  line-height: 0.98;
  letter-spacing: -0.04em;
  text-wrap: balance;

  @media (min-width: 980px) {
    font-size: clamp(2rem, 2.8vw, 2.9rem);
  }
`;

const JourneyNarrativeMeta = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.66);
  font-size: 0.88rem;
  line-height: 1.45;
  text-wrap: balance;

  @media (min-width: 980px) {
    max-width: 11.5rem;
    font-size: 0.78rem;
    line-height: 1.4;
  }
`;

const JourneyNarrativeTrigger = styled.div`
  display: block;
  width: 100%;
  height: 100%;

  @media (max-width: 979px) {
    display: none;
  }
`;

const MobileJourneyInlineRail = styled.div`
  display: flex;
  gap: 0.55rem;
  overflow-x: auto;
  scrollbar-width: none;
  align-items: center;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 980px) {
    display: none;
  }
`;

const MobileJourneyInlinePhoneWrap = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  padding-top: 0.2rem;
  pointer-events: auto;

  @media (min-width: 980px) {
    display: none;
  }
`;

const StatusBar = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0.46rem 0.82rem 0.28rem;
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const StatusCenter = styled.div`
  width: clamp(5.9rem, 34%, 6.9rem);
  height: 1.36rem;
  border-radius: 999px;
  background: #050505;
  position: relative;
  justify-self: center;
`;

const StatusRight = styled.div`
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 0.28rem;
`;

const StatusTime = styled.span`
  font-variant-numeric: tabular-nums;
  font-size: 0.68rem;
  letter-spacing: -0.02em;
`;

const StatusIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.88rem;
  height: 0.88rem;
  color: rgba(255, 255, 255, 0.86);

  svg {
    width: 0.76rem;
    height: 0.76rem;
    stroke-width: 2;
  }
`;

const StatusSignal = styled.span`
  display: inline-flex;
  align-items: flex-end;
  gap: 0.09rem;
  height: 0.78rem;

  span {
    display: block;
    width: 0.11rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
  }

  span:nth-child(1) {
    height: 0.28rem;
    opacity: 0.56;
  }

  span:nth-child(2) {
    height: 0.42rem;
    opacity: 0.68;
  }

  span:nth-child(3) {
    height: 0.58rem;
    opacity: 0.8;
  }

  span:nth-child(4) {
    height: 0.7rem;
  }
`;

const TripsHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 3.08rem;
  padding: 0 0.92rem;
  background: #2b2b2b;
  color: #ffffff;
`;

const TripsBack = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.08rem;
  height: 1.08rem;
  color: rgba(255, 255, 255, 0.88);

  svg {
    width: 0.92rem;
    height: 0.92rem;
    stroke-width: 2.1;
  }
`;

const TripsTitle = styled.h3`
  margin: 0;
  text-align: center;
  font-size: 0.94rem;
  font-weight: 800;
`;

const TripsTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.32rem;
  padding: 0.68rem 0.82rem 0.82rem;
  background: #1a1a1a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const Tab = styled.div<{ $active?: boolean }>`
  display: grid;
  justify-items: center;
  gap: 0.18rem;
  color: ${({ $active }) => ($active ? "#fff8ec" : "rgba(255, 248, 236, 0.38)")};
  font-size: 0.56rem;
`;

const TabPill = styled.div<{ $active?: boolean }>`
  width: 100%;
  min-height: 2.46rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ $active }) => ($active ? "rgba(255, 255, 255, 0.1)" : "transparent")};
  background: ${({ $active }) => ($active ? "#2d2d2d" : "transparent")};
  box-shadow: ${({ $active }) => ($active ? "inset 0 1px 0 rgba(255,255,255,0.04)" : "none")};
`;

const TabIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.84rem;
  height: 0.84rem;

  svg {
    width: 0.8rem;
    height: 0.8rem;
    stroke-width: 2;
  }
`;

const JourneyPreviewScrollViewport = styled.div<{
  $scrollable?: boolean;
  $gap?: string;
  $padding?: string;
  $minHeight?: string;
}>`
  display: grid;
  gap: ${({ $gap = "0.58rem" }) => $gap};
  min-height: ${({ $minHeight = "0" }) => $minHeight};
  padding: ${({ $padding = "0.72rem 0.84rem 0.92rem" }) => $padding};
  overflow-x: hidden;
  overflow-y: ${({ $scrollable }) => ($scrollable ? "auto" : "hidden")};
  scrollbar-width: none;
  background: #121212;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const JourneyPreviewScrollContent = styled.div.attrs<{
  $progress?: number;
  $travelDistance?: string;
  $scrollable?: boolean;
  $paddingBottom?: string;
}>(({ $paddingBottom, $progress = 0, $scrollable, $travelDistance = "0px" }) => ({
  style: {
    transform: $scrollable
      ? "translate3d(0, 0, 0)"
      : `translate3d(0, calc(-1 * ${$progress} * ${$travelDistance}), 0)`,
    paddingBottom: $paddingBottom ?? ($scrollable ? "1rem" : $travelDistance),
  },
}))<{
  $progress?: number;
  $travelDistance?: string;
  $scrollable?: boolean;
  $paddingBottom?: string;
}>`
  display: grid;
  gap: inherit;
  min-height: 100%;
  will-change: transform;
`;

const TravelScroll = styled(JourneyPreviewScrollViewport).attrs<{
  $scrollable?: boolean;
}>(({ $scrollable }) => ({
  $gap: "0.58rem",
  $padding: "0.72rem 0.84rem 0.92rem",
  $minHeight: $scrollable ? "100%" : "auto",
}))``;

const TravelScrollContent = styled(JourneyPreviewScrollContent)``;

const PlanPhone = styled(AppSurface)<{
  $height?: string;
  $tabletHeight?: string;
  $mobileHeight?: string;
  $minHeight?: string;
  $tabletMinHeight?: string;
  $mobileMinHeight?: string;
  $maxWidth?: string;
  $tabletMaxWidth?: string;
  $mobileMaxWidth?: string;
}>`
  position: relative;
  overflow: hidden;
  max-width: ${({ $maxWidth }) => $maxWidth ?? "21.5rem"};
  width: 100%;
  height: ${({ $height }) => $height ?? "100%"};
  min-height: ${({ $minHeight }) => $minHeight ?? "58rem"};
  justify-self: center;
  align-self: stretch;
  border-radius: 2.1rem;
  padding: 0.42rem;
  background: linear-gradient(180deg, #272727, #111111);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 248, 236, 0.06);

  @media (max-width: 979px) {
    max-width: ${({ $tabletMaxWidth, $maxWidth }) =>
      $tabletMaxWidth ?? $maxWidth ?? "20.25rem"};
    height: ${({ $tabletHeight, $height }) => $tabletHeight ?? $height ?? "100%"};
    min-height: ${({ $tabletMinHeight, $minHeight }) => $tabletMinHeight ?? $minHeight ?? "54rem"};
  }

  @media (max-width: 739px) {
    max-width: ${({ $mobileMaxWidth, $tabletMaxWidth, $maxWidth }) =>
      $mobileMaxWidth ?? $tabletMaxWidth ?? $maxWidth ?? "18.8rem"};
    height: ${({ $mobileHeight, $tabletHeight, $height }) =>
      $mobileHeight ?? $tabletHeight ?? $height ?? "100%"};
    min-height: ${({ $mobileMinHeight, $tabletMinHeight, $minHeight }) =>
      $mobileMinHeight ?? $tabletMinHeight ?? $minHeight ?? "48rem"};
  }
`;

const PlanPhoneInner = styled.div`
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  height: 100%;
  overflow: hidden;
  border-radius: 1.72rem;
  background: #121212;
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const PlanHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 3.04rem;
  padding: 0 0.9rem;
  background: #2c2c2c;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: #fff8ec;
`;

const PlanHeaderIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  width: 0.94rem;
  height: 0.94rem;
  color: rgba(255, 248, 236, 0.82);

  svg {
    width: 0.92rem;
    height: 0.92rem;
    stroke-width: 2.1;
  }
`;

const PlanHeaderTitle = styled.h3`
  margin: 0;
  text-align: center;
  justify-self: center;
  font-size: 0.96rem;
  font-weight: 800;
`;

const PlanHeaderMeta = styled.span`
  display: inline-flex;
  align-items: center;
  justify-self: end;
  gap: 0.26rem;
  min-height: 1.34rem;
  padding: 0.1rem 0.52rem;
  border-radius: 999px;
  border: 1px solid rgba(240, 198, 45, 0.32);
  background: rgba(23, 23, 23, 0.92);
  justify-self: end;
  color: rgba(240, 198, 45, 0.92);
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0;
`;

const PlanHeaderMetaDot = styled.span`
  width: 0.34rem;
  height: 0.34rem;
  border-radius: 999px;
  background: #ff5247;
  box-shadow: 0 0 0 0.18rem rgba(255, 82, 71, 0.16);
`;

const PlanFlowScroll = styled(JourneyPreviewScrollViewport).attrs({
  $gap: "0.76rem",
  $padding: "0.94rem 0.96rem 6.1rem",
  $minHeight: "0",
})``;

const PlanScrollContent = styled(JourneyPreviewScrollContent)``;

const TravelSectionTitle = styled.h4`
  margin: 0;
  color: rgba(255, 255, 255, 0.96);
  font-size: 1rem;
  font-weight: 700;
`;

const TravelSectionHeader = styled.div<{ $centered?: boolean }>`
  text-align: ${({ $centered }) => ($centered ? "center" : "left")};
`;

const TravelSectionMeta = styled.p`
  margin: 0.12rem 0 0;
  color: rgba(174, 174, 174, 0.94);
  font-size: 0.65rem;
  line-height: 1.22;
`;

const MapCardSkeleton = styled.div`
  min-height: 11.75rem;
  border-radius: 1.06rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background:
    linear-gradient(
      90deg,
      rgba(243, 210, 122, 0.05) 0%,
      rgba(243, 210, 122, 0.12) 42%,
      rgba(231, 35, 64, 0.08) 58%,
      rgba(243, 210, 122, 0.05) 100%
    ),
    #303030;
  background-size: 200% 100%, auto;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22);
  animation: journeyMapPlaceholderShift 1.8s ease-in-out infinite;

  @keyframes journeyMapPlaceholderShift {
    0% {
      background-position: 100% 0, 0 0;
    }
    100% {
      background-position: -100% 0, 0 0;
    }
  }
`;

const RecordsList = styled.div`
  display: grid;
  gap: 0.34rem;
`;

const RecordCard = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.62rem;
  align-items: center;
  padding: 0.66rem 0.74rem;
  border-radius: 0.78rem;
  background: linear-gradient(180deg, rgba(52, 52, 56, 0.94), rgba(46, 46, 50, 0.94));
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 10px 20px rgba(0, 0, 0, 0.12);
`;

const RecordIcon = styled.div<{ $tone: string }>`
  width: 1.92rem;
  height: 1.92rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: ${({ $tone }) => `${$tone}22`};
  color: ${({ $tone }) => $tone};

  svg {
    width: 0.88rem;
    height: 0.88rem;
    stroke-width: 2.1;
  }
`;

const RecordBody = styled.div`
  display: grid;
  gap: 0.08rem;
`;

const RecordLabel = styled.span`
  color: rgba(247, 240, 227, 0.42);
  font-size: 0.64rem;
`;

const RecordValue = styled.span<{ $tone: string }>`
  color: ${({ $tone }) => $tone};
  font-size: 0.76rem;
  font-weight: 800;
`;

const RecordMeta = styled.span`
  color: rgba(247, 240, 227, 0.48);
  font-size: 0.61rem;
  line-height: 1.08;
`;

const StaticMapWrap = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const StaticMapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: baseline;
`;

const StaticMapTitle = styled.h3`
  margin: 0;
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.98rem;
  font-weight: 700;
`;

const StaticMapMeta = styled.span`
  color: rgba(247, 240, 227, 0.58);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const StaticMapCanvas = styled.div`
  position: relative;
  border-radius: 1.1rem;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 22%, rgba(101, 184, 159, 0.12), transparent 18%),
    radial-gradient(circle at 74% 30%, rgba(243, 210, 122, 0.12), transparent 20%),
    linear-gradient(180deg, rgba(12, 10, 20, 0.96), rgba(9, 9, 14, 0.98));
  border: 1px solid rgba(255, 248, 236, 0.08);
`;

const StaticMapSvg = styled.svg`
  width: 100%;
  height: auto;
  display: block;
`;

const StaticMapLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const StaticMapPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.38rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 248, 236, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(247, 240, 227, 0.74);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &::before {
    content: "";
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 999px;
    background: #f3d27a;
    box-shadow: 0 0 0 0.22rem rgba(243, 210, 122, 0.14);
  }
`;

const PromptStack = styled.div`
  display: grid;
  gap: 0.68rem;
`;

const PlanSection = styled.section`
  display: grid;
  gap: 0.56rem;
  padding: 0.76rem;
  border-radius: 1rem;
  background: #252525;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 248, 236, 0.03),
    0 10px 24px rgba(0, 0, 0, 0.14);
`;

const PlanSectionHeader = styled.div`
  display: grid;
  gap: 0.12rem;
  padding: 0 0.12rem;
`;

const PlanSectionEyebrow = styled.span`
  color: rgba(243, 210, 122, 0.82);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const PlanSectionTitle = styled.span`
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.82rem;
  font-weight: 700;
`;

const ReviewSectionTitle = styled(PlanSectionTitle)`
  font-size: 0.98rem;
`;

const PlanSectionMeta = styled.span`
  color: rgba(247, 240, 227, 0.52);
  font-size: 0.62rem;
  line-height: 1.28;
`;

const PromptBubble = styled.div`
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.72rem 0.9rem;
  border-radius: 1.1rem 1.1rem 0.36rem 1.1rem;
  background: linear-gradient(135deg, #f3d27a 0%, #ebbe58 100%);
  color: #120d08;
  font-weight: 700;
  font-size: 0.84rem;
  line-height: 1;
  box-shadow: 0 18px 30px rgba(243, 210, 122, 0.14);
`;

const OutlineSurface = styled.div`
  display: grid;
  gap: 0.85rem;
  padding: 0;
  border-radius: 1.1rem;
  background: transparent;
  border: 0;
`;

const UserBubbleRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0 0.35rem;
`;

const TimelineStack = styled.div`
  display: grid;
  gap: 0.72rem;
`;

const OutlineCardShell = styled.div<{ $expanded?: boolean }>`
  display: grid;
  gap: 0.54rem;
  padding: 0.84rem 0.92rem;
  border-radius: 0.98rem;
  background: #171717;
  border: 2px solid transparent;
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.02);

  ${({ $expanded }) =>
    $expanded
      ? `
    padding-bottom: 0.9rem;
  `
      : ""}
`;

const CardTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.8rem;
`;

const CardLabelIcon = styled.div`
  width: 1.82rem;
  height: 1.82rem;
  border-radius: 999px;
  background: rgba(99, 184, 205, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f0c62d;
  flex: 0 0 auto;
`;

const CardLabel = styled.span`
  color: #f0c62d;
  font-size: 0.88rem;
  font-weight: 700;
`;

const CalendarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const CalendarBadge = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.62rem;
  background: rgba(99, 184, 205, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f0c62d;
  flex: 0 0 auto;
`;

const DateText = styled.div`
  color: #f7f0e3;
  font-size: 0.9rem;
  line-height: 1.25;
`;

const DateAccent = styled.span`
  color: #f0c62d;
  font-weight: 700;
`;

const FlightRouteRow = styled.div`
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr) 5rem;
  gap: 0.55rem;
  align-items: center;
`;

const AirportBlock = styled.div`
  display: grid;
  justify-items: center;
  gap: 0.12rem;
  text-align: center;
`;

const AirportCode = styled.span`
  color: #f7f0e3;
  font-size: 0.94rem;
  font-weight: 700;
`;

const AirportCity = styled.span`
  color: rgba(247, 240, 227, 0.58);
  font-size: 0.58rem;
  font-weight: 500;
  line-height: 1.2;
`;

const RouteConnector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const RouteLine = styled.span`
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
`;

const HotelTitle = styled.div`
  color: #f7f0e3;
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.3;
`;

const NightsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const NightsLine = styled.span`
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  opacity: 0.6;
`;

const NightsPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #f7f0e3;
  font-size: 0.88rem;
  font-weight: 600;
`;

const EventList = styled.div`
  display: grid;
  gap: 0.42rem;
  padding: 0.15rem 0 0.15rem;
`;

const EventItem = styled.div`
  display: grid;
  gap: 0.08rem;
`;

const EventTitle = styled.span`
  color: rgba(255, 248, 236, 0.88);
  font-size: 0.72rem;
  line-height: 1.28;
`;

const EventMeta = styled.span`
  color: rgba(247, 240, 227, 0.54);
  font-size: 0.6rem;
  line-height: 1.28;
`;

const TrustInline = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-top: auto;
  padding-top: 0.25rem;
  color: rgba(247, 240, 227, 0.72);
  font-size: 0.72rem;
  line-height: 1.45;
`;

const TrustLock = styled.span`
  width: 0.8rem;
  height: 1rem;
  border-radius: 0.3rem;
  border: 1px solid rgba(255, 248, 236, 0.42);
  position: relative;
  flex: 0 0 auto;
  margin-top: 0.05rem;

  &::before {
    content: "";
    position: absolute;
    left: 50%;
    bottom: 100%;
    width: 0.5rem;
    height: 0.42rem;
    border: 1px solid rgba(255, 248, 236, 0.42);
    border-bottom: 0;
    border-radius: 999px 999px 0 0;
    transform: translateX(-50%);
  }
`;

const BookingStage = styled.div`
  display: grid;
  gap: 0.68rem;
`;

const BookingStageHeader = styled.div`
  display: grid;
  gap: 0.14rem;
  padding: 0 0.12rem;
`;

const BookingStageEyebrow = styled.span`
  color: rgba(243, 210, 122, 0.82);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const BookingStageTitle = styled.h4`
  margin: 0;
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.86rem;
  font-weight: 700;
`;

const BookingStageMeta = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.54);
  font-size: 0.64rem;
  line-height: 1.28;
`;

const SearchFilterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.58rem;
  padding: 0.08rem 0.08rem 0.34rem;
`;

const SearchFilterChip = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  justify-content: center;
  min-height: 1.96rem;
  padding: 0.26rem 0.82rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? "rgba(243, 210, 122, 0.46)" : "rgba(255, 255, 255, 0.08)")};
  background: ${({ $active }) =>
    $active ? "#f0c62d" : "#2b2b2b"};
  color: ${({ $active }) => ($active ? "#18130e" : "rgba(255, 255, 255, 0.76)")};
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;

  svg {
    width: 0.68rem;
    height: 0.68rem;
    stroke-width: 2.2;
  }
`;

const SearchSortLabel = styled.span`
  color: rgba(174, 174, 174, 0.86);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.1;
`;

const SearchSortButtons = styled.div`
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, max-content));
  gap: 0.32rem;
  padding: 0.22rem;
  border-radius: 0.8rem;
  background: #2a2a2a;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const SearchWhyPopover = styled.div`
  display: grid;
  gap: 0.32rem;
  margin: -0.02rem 0 0.28rem;
  padding: 0.8rem 0.86rem;
  border-radius: 0.86rem;
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 28px rgba(0, 0, 0, 0.28);
`;

const SearchWhyTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.68rem;
  font-weight: 700;
`;

const SearchWhyBody = styled.p`
  margin: 0;
  color: rgba(214, 214, 214, 0.84);
  font-size: 0.64rem;
  line-height: 1.34;
`;

const BookingSection = styled.section`
  display: grid;
  gap: 0.56rem;
  padding: 0.8rem;
  border-radius: 1.04rem;
  background: #252525;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 12px 28px rgba(0, 0, 0, 0.16);
`;

const BookingSectionTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
`;

const BookingSectionLabel = styled.span`
  color: rgba(240, 198, 45, 0.94);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const BookingSectionValue = styled.span`
  color: rgba(174, 174, 174, 0.94);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const CarouselShell = styled.div`
  display: grid;
  gap: 0.3rem;
`;

const CarouselViewport = styled.div`
  --carousel-gap: 0.45rem;
  --carousel-peek: 0.6rem;
  position: relative;
  overflow: hidden;
`;

const CarouselTrack = styled.div<{ $index: number; $count: number }>`
  display: flex;
  gap: var(--carousel-gap);
  padding-left: var(--carousel-peek);
  transform: translateX(
    calc(${({ $index }) => $index} * -1 * ((100% - (var(--carousel-peek) * 2)) + var(--carousel-gap)))
  );
  transition: transform 320ms ease;

  & > * {
    flex: 0 0 calc(100% - (var(--carousel-peek) * 2));
  }
`;

const CarouselSlide = styled.div`
  position: relative;
`;

const CarouselControls = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.58rem;
`;

const CarouselArrow = styled.button`
  appearance: none;
  border: 0;
  width: 1.28rem;
  height: 1.28rem;
  border-radius: 999px;
  background: transparent;
  color: rgba(240, 198, 45, 0.94);
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
`;

const CarouselMeta = styled.div`
  display: grid;
  justify-items: center;
  gap: 0.08rem;
  min-width: 0;
`;

const CarouselDots = styled.div`
  display: flex;
  align-items: center;
  gap: 0.24rem;
`;

const CarouselDot = styled.span<{ $active?: boolean }>`
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#f0c62d" : "rgba(255, 255, 255, 0.18)")};
`;

const CarouselLabel = styled.span`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.6rem;
  font-weight: 700;
`;

const CarouselArrowGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.24rem;
  justify-self: center;
`;

const CarouselRightControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  justify-self: end;
`;

const CarouselSkipButton = styled.button`
  appearance: none;
  justify-self: end;
  border: 1px solid rgba(255, 255, 255, 0.14);
  min-height: 1.58rem;
  padding: 0.2rem 0.64rem;
  border-radius: 999px;
  background: rgba(22, 22, 22, 0.88);
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.58rem;
  font-weight: 700;
  cursor: pointer;
`;

const BookingCard = styled.div<{ $selected?: boolean }>`
  display: grid;
  gap: 0.68rem;
  padding: 0.88rem;
  border-radius: 0.98rem;
  background: ${({ $selected }) =>
    $selected
      ? "#303030"
      : "#2c2c2c"};
  border: 1px solid
    ${({ $selected }) => ($selected ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.07)")};
  box-shadow: ${({ $selected }) =>
    $selected ? "0 16px 32px rgba(0, 0, 0, 0.18)" : "inset 0 1px 0 rgba(255, 255, 255, 0.02)"};
`;

const BookingCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
`;

const BookingBrand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const BookingLogo = styled.div<{ $tone?: "gold" | "red" | "green" | "blue" }>`
  width: 1.82rem;
  height: 1.82rem;
  border-radius: 0.58rem;
  display: grid;
  place-items: center;
  color: #fff8ec;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: ${({ $tone = "gold" }) =>
    $tone === "red"
      ? "linear-gradient(180deg, #a0172c, #7a101f)"
      : $tone === "green"
        ? "linear-gradient(180deg, #2f6d58, #234f40)"
        : $tone === "blue"
          ? "linear-gradient(180deg, #234a79, #17324f)"
          : "linear-gradient(180deg, #f3d27a, #c99722)"};
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
`;

const BookingLogoImage = styled.img`
  width: 1.82rem;
  height: 1.82rem;
  object-fit: contain;
  border-radius: 0.58rem;
  background: rgba(255, 255, 255, 0.94);
  padding: 0.16rem;
  box-sizing: border-box;
`;

const BookingBrandMeta = styled.div`
  display: grid;
  gap: 0.08rem;
  min-width: 0;
`;

const BookingBrandName = styled.span`
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BookingBrandSubline = styled.span`
  color: rgba(174, 174, 174, 0.92);
  font-size: 0.58rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const RankingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.36rem;
  padding: 0.2rem 0.46rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const BookingTimesRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.46rem;
  align-items: center;
`;

const BookingTimeBlock = styled.div`
  display: grid;
  gap: 0.08rem;
`;

const BookingTimeBlockRight = styled(BookingTimeBlock)`
  justify-items: end;
  text-align: right;
`;

const BookingTime = styled.span`
  color: rgba(255, 248, 236, 0.98);
  font-size: 0.86rem;
  font-weight: 800;
`;

const BookingAirport = styled.span`
  color: rgba(174, 174, 174, 0.94);
  font-size: 0.56rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const BookingConnector = styled.div`
  display: grid;
  gap: 0.14rem;
  justify-items: center;
`;

const BookingDuration = styled.span`
  color: #f0c62d;
  font-size: 0.62rem;
  font-weight: 700;
`;

const BookingLine = styled.div`
  width: 3.9rem;
  height: 1px;
  background: rgba(255, 248, 236, 0.14);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    right: -0.08rem;
    top: 50%;
    width: 0.35rem;
    height: 0.35rem;
    border-top: 1px solid rgba(255, 248, 236, 0.3);
    border-right: 1px solid rgba(255, 248, 236, 0.3);
    transform: translateY(-50%) rotate(45deg);
  }
`;

const BookingMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.46rem;
  flex-wrap: wrap;
`;

const BookingMetaText = styled.span`
  color: rgba(174, 174, 174, 0.92);
  font-size: 0.64rem;
  line-height: 1.28;
`;

const BookingPrice = styled.span`
  color: rgba(255, 248, 236, 0.98);
  font-size: 0.92rem;
  font-weight: 800;
`;

const BookingChipRow = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const BookingChip = styled.span<{ $selected?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.6rem;
  padding: 0.26rem 0.54rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $selected }) => ($selected ? "rgba(243, 210, 122, 0.32)" : "rgba(255, 255, 255, 0.09)")};
  background: ${({ $selected }) => ($selected ? "rgba(243, 210, 122, 0.12)" : "rgba(255, 255, 255, 0.03)")};
  color: ${({ $selected }) => ($selected ? "#f3d27a" : "rgba(255, 255, 255, 0.7)")};
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const BookingFieldGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.72rem;
`;

const BookingFieldStack = styled.div`
  display: grid;
  gap: 0.72rem;
`;

const BookingField = styled.div`
  display: grid;
  gap: 0.42rem;
  min-height: 4.48rem;
  padding: 1rem 1.02rem;
  border-radius: 1rem;
  background:
    linear-gradient(180deg, rgba(48, 48, 48, 0.98), rgba(35, 35, 35, 0.98)),
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.08), transparent 44%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 248, 236, 0.03);
`;

const BookingFieldLabel = styled.span`
  color: rgba(174, 174, 174, 0.9);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const BookingFieldRequired = styled.span`
  color: #f0c62d;
`;

const BookingFieldValue = styled.span`
  color: rgba(255, 248, 236, 0.9);
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.3;
`;

const BookingFieldValueRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.44rem;
`;

const BookingFieldTrailingIcon = styled.span`
  display: inline-grid;
  place-items: center;
  color: rgba(174, 174, 174, 0.84);

  svg {
    width: 0.82rem;
    height: 0.82rem;
    stroke-width: 2;
  }
`;

const BookingSelectField = styled(BookingField)`
  gap: 0.34rem;
`;

const BookingStepperField = styled(BookingField)`
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.76rem;
`;

const BookingStepperControls = styled.div`
  display: inline-grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  border-radius: 0.52rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #1f1f1f;
`;

const BookingStepperButton = styled.span`
  display: inline-grid;
  place-items: center;
  width: 1.84rem;
  height: 1.66rem;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.96rem;
  font-weight: 700;
`;

const BookingStepperValue = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 1.7rem;
  height: 1.66rem;
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.72rem;
  font-weight: 700;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
`;

const SeatActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const SeatActionButton = styled.span<{ $accent?: "gold" | "red" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.7rem;
  padding: 0.2rem 0.68rem;
  border-radius: 0.46rem;
  background: ${({ $accent }) => ($accent === "gold" ? "#f0c62d" : "#ff5b47")};
  color: ${({ $accent }) => ($accent === "gold" ? "#181818" : "#ffffff")};
  font-size: 0.62rem;
  font-weight: 800;
`;

const BookingExpandWrap = styled.div`
  display: grid;
  gap: 0.4rem;
`;

const BookingExpandButton = styled.button`
  appearance: none;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #2a2a2a;
  color: rgba(255, 248, 236, 0.9);
  min-height: 2rem;
  padding: 0.48rem 0.68rem;
  border-radius: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  cursor: pointer;
`;

const BookingExpandLabel = styled.span`
  font-size: 0.66rem;
  font-weight: 700;
`;

const BookingExpandChevron = styled.span<{ $open?: boolean }>`
  color: rgba(240, 198, 45, 0.9);
  font-size: 0.78rem;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
  transition: transform 180ms ease;
`;

const HotelBookingCard = styled(BookingCard)`
  overflow: hidden;
  padding: 0;
`;

const HotelImage = styled.div<{ $image: string }>`
  min-height: 5.4rem;
  background-image:
    linear-gradient(180deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.48)),
    url(${({ $image }) => $image});
  background-size: cover;
  background-position: center;
`;

const HotelBookingBody = styled.div`
  display: grid;
  gap: 0.56rem;
  padding: 0.78rem;
`;

const BookingFooter = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.62rem;
  margin: 0 0.94rem 0.94rem;
  padding: 0.74rem 0.82rem;
  border-radius: 1.08rem;
  background: #2a2a2a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 10px 28px rgba(10, 9, 8, 0.5),
    inset 0 1px 0 rgba(255, 248, 236, 0.04);
`;

const AppBottomComposer = styled.div`
  position: absolute;
  left: 0.88rem;
  right: 0.88rem;
  bottom: 0.88rem;
  z-index: 3;
  display: grid;
  gap: 0.56rem;
  padding: 0.82rem 0.86rem 0.76rem;
  border-radius: 1.18rem;
  background: rgba(46, 46, 46, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.32);
`;

const ComposerTopRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.42rem;
  align-items: center;
`;

const ComposerPlaceholder = styled.span`
  color: rgba(168, 168, 168, 0.92);
  font-size: 0.74rem;
`;

const ComposerAction = styled.span<{ $filled?: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 2.02rem;
  height: 2.02rem;
  border-radius: 999px;
  border: 1.5px solid rgba(240, 198, 45, 0.92);
  background: ${({ $filled }) => ($filled ? "#f0c62d" : "transparent")};
  color: ${({ $filled }) => ($filled ? "#191919" : "#f0c62d")};

  svg {
    width: 0.9rem;
    height: 0.9rem;
    stroke-width: 2;
  }
`;

const ComposerToolbar = styled.div`
  display: flex;
  gap: 0.72rem;
  color: rgba(168, 168, 168, 0.88);

  svg {
    width: 0.9rem;
    height: 0.9rem;
    stroke-width: 2;
  }
`;

const OutlineActionBar = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.62rem;
  padding: 0.3rem 0.14rem 0;
`;

const OutlineActionButton = styled.button<{ $primary?: boolean }>`
  appearance: none;
  border: 0;
  min-height: 2.9rem;
  padding: ${({ $primary }) => ($primary ? "0 1.05rem" : "0 0.88rem")};
  border-radius: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: ${({ $primary }) => ($primary ? "#f0c62d" : "#2b2b2b")};
  color: ${({ $primary }) => ($primary ? "#171717" : "#f0c62d")};
  font-size: 0.82rem;
  font-weight: 800;
  border: 1px solid ${({ $primary }) => ($primary ? "transparent" : "rgba(240, 198, 45, 0.24)")};

  svg {
    width: 0.95rem;
    height: 0.95rem;
    stroke-width: 2;
  }
`;

const BookingFooterRow = styled.div`
  display: grid;
  gap: 0.14rem;
  min-width: 0;
`;

const BookingFooterLabel = styled.span`
  color: rgba(247, 240, 227, 0.5);
  font-size: 0.6rem;
`;

const BookingFooterValue = styled.span`
  color: rgba(255, 248, 236, 0.98);
  font-size: 0.86rem;
  font-weight: 800;
  white-space: nowrap;
`;

const BookingFooterMeta = styled.span`
  color: rgba(247, 240, 227, 0.52);
  font-size: 0.62rem;
  line-height: 1.28;
`;

const BookingModalSectionCard = styled(BookingSection)`
  gap: 1rem;
  padding: 1.22rem 1.12rem 1.08rem;
  border-radius: 1.12rem;
  background:
    linear-gradient(180deg, rgba(30, 26, 23, 0.98), rgba(19, 17, 15, 0.98)),
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.08), transparent 42%);
  border: 1px solid rgba(255, 248, 236, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 18px 34px rgba(0, 0, 0, 0.18);
`;

const BookingModalSectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.74rem;
`;

const BookingModalSectionHeaderMain = styled.div`
  display: grid;
  gap: 0.18rem;
  flex: 1;
`;

const BookingModalSectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const BookingModalSectionIcon = styled.span<{ $accent?: "gold" | "blue" | "green" | "red" }>`
  display: inline-grid;
  place-items: center;
  width: 1.64rem;
  height: 1.64rem;
  border-radius: 0.44rem;
  border: 1px solid rgba(255, 248, 236, 0.08);
  background: ${({ $accent = "gold" }) =>
    $accent === "blue"
      ? "rgba(39, 89, 153, 0.18)"
      : $accent === "green"
        ? "rgba(53, 122, 93, 0.18)"
        : $accent === "red"
          ? "rgba(160, 23, 44, 0.18)"
          : "rgba(243, 210, 122, 0.16)"};
  color: ${({ $accent = "gold" }) =>
    $accent === "blue"
      ? "#8cbcff"
      : $accent === "green"
        ? "#8ed2b8"
        : $accent === "red"
          ? "#ff8ea0"
          : "#f3d27a"};

  svg {
    width: 0.86rem;
    height: 0.86rem;
    stroke-width: 2.1;
  }
`;

const BookingModalSectionTitle = styled.h4`
  margin: 0;
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.76rem;
  font-weight: 700;
`;

const BookingModalSectionMeta = styled.p`
  margin: 0.08rem 0 0;
  color: rgba(174, 174, 174, 0.92);
  font-size: 0.62rem;
  line-height: 1.42;
`;

const BookingModalSectionChevron = styled.span<{ $collapsed?: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 1.06rem;
  height: 1.06rem;
  color: rgba(174, 174, 174, 0.9);
  transform: rotate(${({ $collapsed }) => ($collapsed ? "-90deg" : "0deg")});

  svg {
    width: 0.78rem;
    height: 0.78rem;
    stroke-width: 2.1;
  }
`;

const BookingPassengerChipRow = styled.div`
  display: flex;
  gap: 0.56rem;
  flex-wrap: wrap;
  padding-bottom: 0.14rem;
`;

const BookingPassengerChip = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 1.92rem;
  padding: 0.38rem 0.86rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? "rgba(243, 210, 122, 0.35)" : "rgba(255, 255, 255, 0.08)")};
  background: ${({ $active }) =>
    $active ? "rgba(243, 210, 122, 0.92)" : "rgba(255, 255, 255, 0.03)"};
  color: ${({ $active }) => ($active ? "#16120e" : "rgba(255, 255, 255, 0.82)")};
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.04em;

  svg {
    width: 0.68rem;
    height: 0.68rem;
    stroke-width: 2.2;
  }
`;

const BookingPaymentHint = styled.p`
  margin: 0.12rem 0 0;
  color: rgba(174, 174, 174, 0.88);
  font-size: 0.61rem;
  line-height: 1.36;
`;

const StatsYearRow = styled.div`
  display: flex;
  gap: 0.46rem;
  padding: 0.12rem 0 0.3rem;
  flex-wrap: wrap;
`;

const StatsYearChip = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.98rem;
  min-height: 1.36rem;
  padding: 0.16rem 0.42rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? "rgba(243, 210, 122, 0.44)" : "rgba(255, 255, 255, 0.08)")};
  background: ${({ $active }) =>
    $active ? "rgba(243, 210, 122, 0.14)" : "rgba(255, 255, 255, 0.03)"};
  color: ${({ $active }) => ($active ? "#f0c62d" : "rgba(255, 255, 255, 0.68)")};
  font-size: 0.54rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StatsHighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.68rem;
`;

const StatsHighlightCard = styled.div`
  display: grid;
  justify-items: center;
  gap: 0.34rem;
  min-height: 7.1rem;
  padding: 1rem 0.72rem 0.94rem;
  border-radius: 1.08rem;
  background:
    linear-gradient(180deg, rgba(49, 49, 49, 0.98), rgba(38, 38, 38, 0.98)),
    radial-gradient(circle at top center, rgba(255, 255, 255, 0.04), transparent 60%);
  border: 1px solid rgba(255, 255, 255, 0.07);

  &:last-child {
    grid-column: 1 / -1;
  }
`;

const StatsHighlightLabel = styled.span`
  color: rgba(174, 174, 174, 0.86);
  font-size: 0.58rem;
  font-weight: 700;
  text-align: center;
`;

const StatsHighlightValue = styled.span`
  color: rgba(255, 255, 255, 0.98);
  font-size: 0.94rem;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const StatsHighlightMeta = styled.span`
  color: rgba(174, 174, 174, 0.92);
  font-size: 0.56rem;
  line-height: 1.3;
  text-align: center;
`;

const StatsPrimaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.68rem;
`;

const StatsPrimaryCard = styled.div`
  display: grid;
  gap: 0.34rem;
  align-content: start;
  min-height: 6.2rem;
  padding: 1rem 0.96rem 0.98rem;
  border-radius: 1.08rem;
  background:
    linear-gradient(180deg, rgba(49, 49, 49, 0.98), rgba(38, 38, 38, 0.98)),
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.07), transparent 48%);
  border: 1px solid rgba(255, 255, 255, 0.07);
`;

const StatsPrimaryValue = styled.span`
  color: rgba(255, 255, 255, 0.98);
  font-size: 1.16rem;
  font-weight: 800;
  letter-spacing: -0.04em;
`;

const StatsPrimaryLabel = styled.span`
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.64rem;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.02em;
`;

const StatsPrimaryMeta = styled.span`
  color: rgba(174, 174, 174, 0.9);
  font-size: 0.5rem;
  line-height: 1.18;
`;

const StatsStreakCard = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.64rem;
  padding: 0.96rem 1rem;
  border-radius: 1rem;
  background: #303030;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 rgba(255, 248, 236, 0.03);
`;

const StatsMetricIcon = styled.span<{ $tone: string }>`
  display: inline-grid;
  place-items: center;
  width: 2.08rem;
  height: 2.08rem;
  border-radius: 999px;
  background: ${({ $tone }) => `${$tone}22`};
  color: ${({ $tone }) => $tone};
  margin-bottom: 0.12rem;

  svg {
    width: 0.92rem;
    height: 0.92rem;
    stroke-width: 2.1;
  }
`;

const StatsRing = styled.div<{ $tone: string; $progress: number }>`
  position: relative;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #303030 57%, transparent 58%),
    conic-gradient(
      ${({ $tone }) => $tone} 0deg,
      ${({ $tone, $progress }) => $tone} calc(${({ $progress }) => $progress} * 3.6deg),
      rgba(255, 255, 255, 0.08) calc(${({ $progress }) => $progress} * 3.6deg),
      rgba(255, 255, 255, 0.08) 360deg
    );
  margin-bottom: 0.2rem;
`;

const StatsRingCenter = styled.div<{ $tone: string }>`
  position: absolute;
  inset: 0.5rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #303030;
  color: ${({ $tone }) => $tone};
  font-size: 0.9rem;
  font-weight: 800;
`;

const StatsStreakBody = styled.div`
  display: grid;
  gap: 0.14rem;
`;

const StatsSectionHeading = styled.div`
  display: grid;
  gap: 0.06rem;
`;

const StatsPanelCard = styled.div`
  display: grid;
  gap: 0.86rem;
  padding: 1.06rem;
  border-radius: 1rem;
  background: #303030;
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const StatsPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
`;

const StatsPanelTitle = styled.span`
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.72rem;
  font-weight: 700;
`;

const StatsPanelAction = styled.span`
  color: #f0c62d;
  font-size: 0.6rem;
  font-weight: 700;
`;

const StatsMiniList = styled.div`
  display: grid;
  gap: 0.54rem;
`;

const StatsMiniRow = styled.div`
  display: grid;
  gap: 0.16rem;
`;

const StatsMiniTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
`;

const StatsMiniLabel = styled.span`
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.64rem;
  font-weight: 600;
`;

const StatsMiniValue = styled.span`
  color: rgba(174, 174, 174, 0.94);
  font-size: 0.6rem;
`;

const StatsMiniMeta = styled.span`
  color: rgba(174, 174, 174, 0.82);
  font-size: 0.55rem;
  line-height: 1.22;
`;

const StatsPlacesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.56rem;
`;

const StatsPlacesCard = styled.div`
  display: grid;
  gap: 0.16rem;
  justify-items: start;
  padding: 0.82rem 0.72rem;
  border-radius: 0.86rem;
  background: #2b2b2b;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const StatsPlacesLabel = styled.span`
  color: rgba(174, 174, 174, 0.84);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const StatsPlacesValue = styled.span`
  color: rgba(255, 255, 255, 0.98);
  font-size: 0.94rem;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const StatsPlacesMeta = styled.span`
  color: rgba(174, 174, 174, 0.82);
  font-size: 0.54rem;
  line-height: 1.22;
`;

const BookingModalOverlay = styled.div`
  position: absolute;
  inset: 4.9rem 0 0;
  z-index: 3;
  display: grid;
  align-items: end;
  padding: 0 0.7rem 0.7rem;
  background:
    linear-gradient(180deg, rgba(8, 7, 6, 0) 0%, rgba(8, 7, 6, 0.18) 28%, rgba(8, 7, 6, 0.64) 100%);
  pointer-events: none;
`;

const BookingModalCard = styled.div`
  display: grid;
  gap: 0.9rem;
  padding: 0.8rem 0.88rem 1rem;
  border-radius: 1.5rem 1.5rem 1.08rem 1.08rem;
  background:
    linear-gradient(180deg, rgba(32, 28, 24, 0.98), rgba(22, 19, 16, 0.985)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
  border: 1px solid rgba(255, 248, 236, 0.08);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 248, 236, 0.08);
  pointer-events: auto;
`;

const BookingModalHandle = styled.span`
  justify-self: center;
  width: 2.3rem;
  height: 0.24rem;
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.2);
`;

const BookingModalTopBar = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.52rem;
`;

const BookingModalClose = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 999px;
  color: rgba(255, 248, 236, 0.76);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 248, 236, 0.06);
  line-height: 1;

  svg {
    width: 0.82rem;
    height: 0.82rem;
    stroke-width: 2.2;
  }
`;

const BookingModalTopTitle = styled.span`
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.82rem;
  font-weight: 700;
  text-align: center;
  justify-self: center;
`;

const BookingModalTopSpacer = styled.span`
  justify-self: end;
  width: 1.55rem;
  height: 1.55rem;
`;

const BookingModalHeader = styled.div`
  display: grid;
  gap: 0.3rem;
  justify-items: start;
`;

const BookingModalEyebrow = styled.span`
  color: rgba(243, 210, 122, 0.82);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const BookingModalTitle = styled.h4`
  margin: 0;
  color: rgba(255, 248, 236, 0.98);
  font-size: 0.92rem;
  font-weight: 800;
`;

const BookingModalMeta = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.58);
  font-size: 0.64rem;
  line-height: 1.38;
`;

const BookingModalBreakdown = styled.div`
  display: grid;
  gap: 0.46rem;
`;

const BookingModalSection = styled.div`
  display: grid;
  gap: 0.22rem;
`;

const BookingModalLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
  color: rgba(255, 248, 236, 0.92);
  font-size: 0.68rem;
  min-height: 2.9rem;
  padding: 0.92rem 0;
  border-radius: 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(255, 248, 236, 0.08);
`;

const BookingModalLineLabel = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.48rem;
  min-width: 0;
`;

const BookingModalLineIcon = styled.span<{ $accent?: "gold" | "blue" | "green" }>`
  display: inline-grid;
  place-items: center;
  width: 1.52rem;
  height: 1.52rem;
  border-radius: 0.48rem;
  background: ${({ $accent = "gold" }) =>
    $accent === "blue"
      ? "rgba(39, 89, 153, 0.16)"
      : $accent === "green"
        ? "rgba(53, 122, 93, 0.16)"
        : "rgba(243, 210, 122, 0.14)"};
  color: ${({ $accent = "gold" }) =>
    $accent === "blue" ? "#8cbcff" : $accent === "green" ? "#8ed2b8" : "#f3d27a"};

  svg {
    width: 0.72rem;
    height: 0.72rem;
    stroke-width: 2.1;
  }
`;

const BookingModalLineText = styled.div`
  display: grid;
  gap: 0.12rem;
  min-width: 0;
`;

const BookingModalLineTitle = styled.span`
  color: rgba(255, 248, 236, 0.94);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.26;
`;

const BookingModalLineMeta = styled.span`
  color: rgba(247, 240, 227, 0.46);
  font-size: 0.56rem;
  line-height: 1.3;
`;

const BookingModalAmount = styled.strong`
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.74rem;
  font-weight: 800;
  white-space: nowrap;
`;

const BookingModalSubRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.56rem;
  padding: 0.34rem 0 0.34rem 1.16rem;
`;

const BookingModalSubLabel = styled.span`
  color: rgba(247, 240, 227, 0.52);
  font-size: 0.56rem;
  line-height: 1.24;
`;

const BookingModalSubValue = styled.span`
  color: rgba(255, 248, 236, 0.78);
  font-size: 0.58rem;
  font-weight: 600;
  white-space: nowrap;
`;

const BookingModalTotal = styled(BookingModalLine)`
  min-height: 2.84rem;
  padding: 0.88rem 0 0;
  font-size: 0.74rem;
  font-weight: 800;
  background: transparent;
  border-bottom: 0;
  border-top: 2px solid rgba(243, 210, 122, 0.26);
`;

const BookingModalActions = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: center;
`;

const BookingModalBadge = styled.span`
  color: rgba(247, 240, 227, 0.56);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const BookingModalButton = styled.button`
  appearance: none;
  border: 0;
  min-height: 2.25rem;
  padding: 0.5rem 0.95rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #f3d27a 0%, #eab74f 100%);
  color: #120d08;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const BookingModalFooterNote = styled.p`
  margin: -0.1rem 0 0;
  color: rgba(247, 240, 227, 0.42);
  font-size: 0.55rem;
  line-height: 1.3;
`;

const SourceCard = styled.div`
  display: grid;
  gap: 0.56rem;
  padding: 0.82rem;
  border-radius: 1.02rem;
  background: #303030;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 12px 28px rgba(0, 0, 0, 0.18);
`;

const SourceHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.55rem;
`;

const SourceHeaderInfo = styled.div`
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  flex: 1;
`;

const SourceLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.38rem;
`;

const SourceLabelText = styled.span`
  color: rgba(174, 174, 174, 0.94);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const SourceTitle = styled.span`
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.1;
`;

const SourceSubText = styled.span`
  color: rgba(174, 174, 174, 0.94);
  font-size: 0.58rem;
  line-height: 1.2;
`;

const SourcePriceSummary = styled.div`
  display: grid;
  gap: 0.14rem;
  justify-items: end;
  text-align: right;
`;

const SourcePricePrimary = styled.span`
  color: rgba(255, 248, 236, 0.98);
  font-size: 0.82rem;
  font-weight: 800;
`;

const SourcePriceHint = styled.span`
  color: rgba(174, 174, 174, 0.94);
  font-size: 0.58rem;
  line-height: 1.1;
`;

const SourceTimeline = styled.div`
  display: grid;
  gap: 0.42rem;
  padding: 0.68rem 0.72rem;
  border-radius: 0.96rem;
  background: #252525;
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const SourceTimelineColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.62rem;
`;

const SourceTimelineColumn = styled.div`
  display: grid;
  gap: 0.12rem;
`;

const SourceTimelineLabel = styled.span`
  color: rgba(174, 174, 174, 0.9);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const SourceTimelineDetailRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.18rem;
  min-width: 0;
`;

const SourceTimelineCode = styled.span`
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.76rem;
  font-weight: 800;
`;

const SourceTimelineDetail = styled.span`
  color: rgba(174, 174, 174, 0.94);
  font-size: 0.62rem;
  line-height: 1.15;
`;

const SourceTimelineTime = styled.span`
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.78rem;
  font-weight: 800;
`;

const SourceDurationRow = styled.div`
  display: flex;
  justify-content: center;
`;

const SourceDurationPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.26rem;
  min-height: 1.25rem;
  padding: 0.16rem 0.4rem;
  border-radius: 999px;
  background: #1c1c1c;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.6rem;
  font-weight: 700;
`;

const SourceRankingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
`;

const SourceWhyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 1.2rem;
  padding: 0.16rem 0.4rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #1f1f1f;
  color: rgba(255, 248, 236, 0.9);
  font-size: 0.56rem;
  font-weight: 600;
`;

const SourceExpandButton = styled.button`
  appearance: none;
  width: 1.45rem;
  height: 1.45rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #1f1f1f;
  color: rgba(174, 174, 174, 0.92);
  display: inline-grid;
  place-items: center;
  font-size: 0.82rem;
  line-height: 1;
  cursor: default;
`;

const SourceDateBadge = styled.div`
  display: grid;
  justify-items: center;
  min-width: 2.3rem;
`;

const SourceDateDay = styled.span`
  color: rgba(247, 240, 227, 0.48);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const SourceDateNumber = styled.span`
  color: #f0c62d;
  font-size: 0.78rem;
  font-weight: 800;
`;

const SourceGallery = styled.div`
  position: relative;
  min-height: 6.9rem;
  border-radius: 0.98rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
`;

const SourceGalleryImage = styled.div<{ $image: string }>`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.44)),
    url(${({ $image }) => $image});
  background-size: cover;
  background-position: center;
`;

const SourceGalleryDots = styled.div`
  position: absolute;
  left: 50%;
  bottom: 0.55rem;
  transform: translateX(-50%);
  display: flex;
  gap: 0.28rem;
`;

const SourceGalleryDot = styled.span<{ $active?: boolean }>`
  width: 0.34rem;
  height: 0.34rem;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#ffffff" : "rgba(255,255,255,0.4)")};
`;

const SourceRatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
`;

const SourceRatingText = styled.span`
  color: rgba(255, 248, 236, 0.92);
  font-size: 0.64rem;
  font-weight: 700;
`;

const BookButton = styled.button`
  appearance: none;
  border: 0;
  width: 100%;
  min-height: 2.92rem;
  border-radius: 0.94rem;
  background: linear-gradient(180deg, #f3d27a 0%, #e5b74f 100%);
  color: #120d08;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  box-shadow:
    0 14px 26px rgba(243, 210, 122, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  cursor: pointer;
`;

const LiveStack = styled.div`
  position: relative;
  display: grid;
  gap: 0;
  padding-top: 0.5rem;
`;

const LiveCardStackItem = styled(ProductPanel)<{
  $accent?: "gold" | "red" | "green";
  $index: number;
}>`
  position: relative;
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
  min-height: 14.5rem;
  margin-top: ${({ $index }) => ($index === 0 ? "0" : "-7.5rem")};
  margin-left: ${({ $index }) => `${$index * 0.7}rem`};
  margin-right: ${({ $index }) => `${$index * 0.25}rem`};
  transform: rotate(${({ $index }) => ($index % 2 === 0 ? "-2.4deg" : "2.2deg")});
  z-index: ${({ $index }) => 5 - $index};

  @media (max-width: 739px) {
    margin-top: ${({ $index }) => ($index === 0 ? "0" : "-4.5rem")};
    transform: rotate(0deg);
    margin-left: 0;
    margin-right: 0;
  }
`;

const StatePhotoStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
`;

const StatePhoto = styled.div<{ $image: string }>`
  min-height: 3.25rem;
  border-radius: 0.8rem;
  background-image:
    linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.4)),
    url(${({ $image }) => $image});
  background-size: cover;
  background-position: center;
`;

const IslandWrap = styled.div`
  display: flex;
  justify-content: center;
`;

const IslandPill = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: center;
  width: min(100%, 22rem);
  min-height: 2.85rem;
  padding: 0 0.9rem;
  border-radius: 999px;
  background: #060606;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
`;

const IslandAccent = styled.span<{ $tone?: "gold" | "green" | "red" }>`
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: ${({ $tone = "gold" }) =>
    $tone === "green" ? "#65b89f" : $tone === "red" ? "#e72340" : "#f3d27a"};
`;

const IslandMain = styled.div`
  color: rgba(255, 248, 236, 0.92);
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const IslandMeta = styled.div`
  color: rgba(255, 248, 236, 0.68);
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const LiveTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
`;

const LiveTitle = styled.div`
  color: rgba(255, 248, 236, 0.96);
  font-size: 1.1rem;
  font-weight: 700;
`;

const LiveCountdown = styled.span`
  color: var(--color-accent);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const ProgressBar = styled.div<{ $accent?: "gold" | "green" | "red"; $width?: string }>`
  position: relative;
  overflow: hidden;
  height: 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    width: ${({ $width = "72%" }) => $width};
    border-radius: inherit;
    background: ${({ $accent = "gold" }) =>
      $accent === "green"
        ? "linear-gradient(90deg, #65b89f 0%, #9fe1cb 100%)"
        : $accent === "red"
          ? "linear-gradient(90deg, #e72340 0%, #ff6f83 100%)"
          : "linear-gradient(90deg, #f3d27a 0%, #ebbe58 100%)"};
    animation: ${progress} 2.8s ease-out both;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
`;

const MetricCard = styled.div`
  display: grid;
  gap: 0.3rem;
  padding: 0.75rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 248, 236, 0.08);
`;

const MetricLabel = styled.span`
  color: rgba(247, 240, 227, 0.58);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const MetricValue = styled.span`
  color: rgba(255, 248, 236, 0.96);
  font-size: 0.96rem;
  font-weight: 700;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const ActionChip = styled.span<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.2rem;
  padding: 0.55rem 0.72rem;
  border-radius: 999px;
  border: 1px solid ${({ $primary }) =>
    $primary ? "rgba(243, 210, 122, 0.28)" : "rgba(255, 248, 236, 0.12)"};
  background: ${({ $primary }) =>
    $primary ? "rgba(243, 210, 122, 0.12)" : "rgba(255, 255, 255, 0.03)"};
  color: rgba(255, 248, 236, 0.88);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const MicroSection = styled.div`
  display: grid;
  gap: 0.48rem;
`;

const MicroSectionHeader = styled.div`
  display: grid;
  gap: 0.08rem;
`;

const MicroSectionTitle = styled.h5`
  margin: 0;
  color: rgba(255, 248, 236, 0.94);
  font-size: 0.86rem;
  font-weight: 700;
`;

const MicroSectionMeta = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.52);
  font-size: 0.62rem;
  line-height: 1.28;
`;

const DetailGrid = styled.div`
  display: grid;
  gap: 0.42rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

const DetailCard = styled.div`
  display: grid;
  gap: 0.14rem;
  padding: 0.58rem;
  border-radius: 0.88rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 248, 236, 0.08);
`;

const DetailLabel = styled.span`
  color: rgba(247, 240, 227, 0.5);
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const DetailValue = styled.span`
  color: rgba(255, 248, 236, 0.92);
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1.2;
`;

const InsightList = styled.div`
  display: grid;
  gap: 0.42rem;
`;

const InsightRow = styled.div`
  display: grid;
  gap: 0.1rem;
  padding: 0.56rem 0.62rem;
  border-radius: 0.82rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 248, 236, 0.08);
`;

const InsightLabel = styled.span`
  color: rgba(255, 248, 236, 0.92);
  font-size: 0.7rem;
  font-weight: 700;
`;

const InsightValue = styled.span`
  color: #f0c62d;
  font-size: 0.72rem;
  font-weight: 700;
`;

const InsightMeta = styled.span`
  color: rgba(247, 240, 227, 0.52);
  font-size: 0.6rem;
  line-height: 1.24;
`;

interface HeroProps {
  readonly journeyOnly?: boolean;
  readonly waitlistSlot?: ReactNode;
}

type PictureSource = {
  readonly srcset: string;
  readonly type: string;
};

type PictureAsset = {
  readonly sources: PictureSource[];
  readonly img: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
  };
};

const resolvePictureAsset = (asset: unknown): PictureAsset | string => {
  if (!asset) return "/logo.png";
  if (typeof asset === "string") return asset;
  if (typeof asset === "object") {
    const record = asset as Record<string, unknown>;
    if (record.sources && record.img) {
      return record as PictureAsset;
    }
    if (record.default) {
      return resolvePictureAsset(record.default);
    }
  }
  return "/logo.png";
};

const heroContent = {
  en: {
    featureMarqueeItems: [
      "Flight Departure",
      "Hotel Check-in",
      "Live actions",
      "Rebooking",
      "Approval queue",
      "Calendar aware",
      "Protected arrival",
      "Group trip planning",
      "Hotel re-routing",
      "Flight disruption coverage",
    ],
    promptMarqueeItems: [
      "Book Japan",
      "Barcelona in May",
      "Jazz festival",
      "Rams game",
      "Birthday weekend",
      "Ski trip",
      "Wedding weekend",
      "Beach escape",
      "Book Apres",
      "National parks",
      "Family Disney",
      "Team offsite",
    ],
    railPrefix: "We plan, you",
    railAccent: "pack.",
    headlineLine1: "Past, present",
    headlineLine2Prefix: "and the ",
    headlineLine2Accent: "future of",
    headlineLine3Accent: "agentic travel",
    supportingCopy:
      "One prompt to get the flights, hotel, and schedule you'd pick yourself.",
    journeyEyebrow: "Journey",
    journeyTitle: "See the trip take shape without losing the thread.",
  },
  es: {
    featureMarqueeItems: [
      "Salida del vuelo",
      "Check-in del hotel",
      "Acciones en vivo",
      "Reubicación",
      "Cola de aprobación",
      "Con calendario",
      "Llegada protegida",
      "Viaje en grupo",
      "Reenrutamiento hotelero",
      "Cobertura ante disrupciones",
    ],
    promptMarqueeItems: [
      "Reserva Japón",
      "Barcelona en mayo",
      "Festival de jazz",
      "Partido de Rams",
      "Fin de semana de cumpleaños",
      "Viaje de esquí",
      "Fin de semana de boda",
      "Escapada de playa",
      "Reserva après",
      "Parques nacionales",
      "Disney en familia",
      "Retiro del equipo",
    ],
    railPrefix: "Nosotros planeamos, tú",
    railAccent: "empacas.",
    headlineLine1: "Pasado, presente",
    headlineLine2Prefix: "y el ",
    headlineLine2Accent: "futuro de",
    headlineLine3Accent: "los viajes agentivos",
    supportingCopy:
      "Un solo prompt para llegar al vuelo, hotel y plan que elegirías tú mismo.",
    journeyEyebrow: "Viaje",
    journeyTitle: "Ve cómo toma forma el viaje sin perder el hilo.",
  },
} as const;

type PlanShowcaseKey = (typeof planShowcaseItems)[number]["key"];
type ReviewShowcaseKey = (typeof reviewShowcaseItems)[number]["key"];
type JourneyShowcaseKey = (typeof journeyShowcaseItems)[number]["key"];
type JourneyPreviewMotion = {
  progress: number;
  screen: JourneyShowcaseKey;
};
const JOURNEY_PHONE_STANDARD_HEIGHT = "clamp(39rem, 82svh, 47rem)";
const JOURNEY_PHONE_TABLET_HEIGHT = "clamp(38rem, 78svh, 43rem)";
const JOURNEY_PHONE_MOBILE_HEIGHT = "clamp(37rem, 76svh, 42rem)";
const JOURNEY_PHONE_STANDARD_WIDTH = "clamp(26rem, 31vw, 29rem)";
const JOURNEY_PHONE_TABLET_WIDTH = "24rem";
const JOURNEY_PHONE_MOBILE_WIDTH = "21rem";
const JOURNEY_PREVIEW_SCROLL_DISTANCE = "18rem";
const JOURNEY_SCROLL_DISTANCES = {
  outline: "14rem",
  search: "21rem",
  booking: "24rem",
  bookingModal: "17rem",
  statsFootprint: "16rem",
  statsRecords: "8rem",
} as const;

const MOBILE_INLINE_INITIAL_SCROLL_TOP: Partial<Record<JourneyShowcaseKey, number>> = {
  plan: 0,
  search: 200,
  booking: 170,
  stats: 94,
};

const getPageScrollElement = (): HTMLElement => {
  if (typeof document === "undefined") {
    return {} as HTMLElement;
  }

  return document.body.scrollHeight > document.documentElement.scrollHeight
    ? document.body
    : document.documentElement;
};

const getPageScrollTop = (): number => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return 0;
  }

  return Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
};

const scrollPageTo = (top: number, behavior: ScrollBehavior): void => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const clampedTop = Math.max(0, top);
  const scrollElement = getPageScrollElement();

  window.scrollTo({ top: clampedTop, behavior });
  document.documentElement.scrollTo({ top: clampedTop, behavior });
  document.body.scrollTo({ top: clampedTop, behavior });

  if (scrollElement && typeof scrollElement.scrollTo === "function") {
    scrollElement.scrollTo({ top: clampedTop, behavior });
  }

  if ("scrollTop" in scrollElement) {
    scrollElement.scrollTop = clampedTop;
  }
};

const isJourneyShowcaseKey = (value: string | null): value is JourneyShowcaseKey =>
  value === "plan" || value === "search" || value === "booking" || value === "stats";

const getJourneySectionIndexAtTrigger = (
  narrativeSections: HTMLElement[],
  triggerLine: number,
  isScrollingUp: boolean
): number => {
  const sectionRects = narrativeSections.map((section) => section.getBoundingClientRect());
  // Prefer the section that actually owns the trigger line. This avoids
  // oscillating between adjacent sections when the user scrolls back upward
  // and both neighbors are close to the handoff threshold.
  const containingSectionIndex = sectionRects.findIndex(
    (sectionRect) => sectionRect.top <= triggerLine && sectionRect.bottom >= triggerLine
  );

  if (containingSectionIndex >= 0) {
    return containingSectionIndex;
  }

  if (isScrollingUp) {
    return sectionRects.findIndex((sectionRect) => sectionRect.bottom >= triggerLine);
  }

  return sectionRects.reduce<number>((candidateIndex, sectionRect, index) => {
    return sectionRect.top <= triggerLine ? index : candidateIndex;
  }, -1);
};

const getJourneySectionProgress = (
  narrativeSection: HTMLElement,
  viewportHeight: number,
  triggerLine: number
): number => {
  const sectionRect = narrativeSection.getBoundingClientRect();
  const travelHeight = Math.max(sectionRect.height - viewportHeight * 0.36, 1);
  // Use the same trigger line for both section ownership and preview motion. If
  // these anchors diverge, the phone appears to jump to a second scroll position
  // every time ownership changes between sections.
  const rawProgress = (triggerLine - sectionRect.top) / travelHeight;

  return Math.max(0, Math.min(1, rawProgress));
};

const cssLengthToPixels = (value: string): number => {
  const numeric = Number.parseFloat(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  if (value.endsWith("rem")) {
    if (typeof window === "undefined") {
      return numeric * 16;
    }

    const rootFontSize = Number.parseFloat(
      window.getComputedStyle(document.documentElement).fontSize
    );
    return numeric * (Number.isFinite(rootFontSize) ? rootFontSize : 16);
  }

  return numeric;
};

const useMeasuredTravelDistance = (fallbackDistance: string, enabled = true) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const travelDistanceRef = React.useRef(Math.max(cssLengthToPixels(fallbackDistance), 0));
  const [travelDistancePx, setTravelDistancePx] = useState(() =>
    Math.max(cssLengthToPixels(fallbackDistance), 0)
  );

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      const fallbackPx = Math.max(cssLengthToPixels(fallbackDistance), 0);
      travelDistanceRef.current = fallbackPx;
      setTravelDistancePx((current) =>
        Math.abs(current - fallbackPx) <= 1 ? current : fallbackPx
      );
      return;
    }

    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content || typeof window === "undefined") {
      return;
    }

    const measure = () => {
      const fallbackPx = cssLengthToPixels(fallbackDistance);
      const syntheticPaddingPx = travelDistanceRef.current;
      const naturalContentHeight = Math.max(content.scrollHeight - syntheticPaddingPx, 0);
      const nextDistance = Math.max(
        Math.ceil(naturalContentHeight - container.clientHeight),
        0
      );
      const resolvedDistance = Number.isFinite(nextDistance) ? nextDistance : fallbackPx;

      travelDistanceRef.current = resolvedDistance;
      setTravelDistancePx((current) => {
        if (Math.abs(current - resolvedDistance) <= 1) {
          return current;
        }

        return resolvedDistance;
      });
    };

    measure();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;

    resizeObserver?.observe(container);
    resizeObserver?.observe(content);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [enabled, fallbackDistance]);

  return {
    containerRef,
    contentRef,
    travelDistancePx,
    travelDistance: `${travelDistancePx}px`,
  };
};

const usePreviewScrollSync = (
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  scrollProgress: number,
  enabled: boolean
) => {
  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    // The preview should move through one shared travel distance regardless of
    // how tall an individual screen's content is. The browser will clamp any
    // screen that has less real scroll room than the common preview distance.
    const nextScrollTop = Math.max(
      0,
      Math.round(scrollProgress * cssLengthToPixels(JOURNEY_PREVIEW_SCROLL_DISTANCE))
    );

    if (Math.abs(scrollContainer.scrollTop - nextScrollTop) <= 1) {
      return;
    }

    scrollContainer.scrollTop = nextScrollTop;
  }, [enabled, scrollContainerRef, scrollProgress]);
};

const useInitialScrollTop = (
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  initialScrollTop: number | undefined,
  enabled: boolean
) => {
  const appliedRef = React.useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (!enabled || initialScrollTop === undefined || initialScrollTop <= 0 || appliedRef.current) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer || typeof window === "undefined") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (scrollContainer.scrollTop <= 1) {
        scrollContainer.scrollTop = initialScrollTop;
      }
      appliedRef.current = true;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [enabled, initialScrollTop, scrollContainerRef]);
};

const renderDateLabel = (date: string) => {
  const [weekday, ...rest] = date.split(" ");
  return (
    <DateText>
      <DateAccent>{weekday}</DateAccent> {rest.join(" ")}
    </DateText>
  );
};

const PlaneGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M14.6 7.2 1.9 2.4a.7.7 0 0 0-.9.8l1 3.4H7l2.2 1.4L7 9.4H2l-1 3.4a.7.7 0 0 0 .9.8l12.7-4.8a.8.8 0 0 0 0-1.5Z"
      fill="currentColor"
    />
  </svg>
);

const renderRecordIcon = (icon: (typeof recordRows)[number]["icon"]) => {
  switch (icon) {
    case "calendar":
      return <Calendar aria-hidden="true" />;
    case "dollar-sign":
      return <DollarSign aria-hidden="true" />;
    case "navigation":
      return <Navigation aria-hidden="true" />;
    case "plane":
      return <Plane aria-hidden="true" />;
    case "trending-up":
      return <TrendingUp aria-hidden="true" />;
    case "award":
      return <Award aria-hidden="true" />;
    case "map-pin":
      return <MapPin aria-hidden="true" />;
    default:
      return <Calendar aria-hidden="true" />;
  }
};

const StatusIcons = () => (
  <StatusRight aria-hidden="true">
    <StatusIcon>
      <StatusSignal>
        <span />
        <span />
        <span />
        <span />
      </StatusSignal>
    </StatusIcon>
    <StatusIcon>
      <Wifi />
    </StatusIcon>
  </StatusRight>
);

const FlightPreviewCard: React.FC<{ item: FlightPreviewItem }> = ({ item }) => (
  <OutlineCardShell>
    <CardTopRow>
      <CardLabelIcon>
        <Plane aria-hidden="true" />
      </CardLabelIcon>
      <CardLabel>Flight</CardLabel>
    </CardTopRow>
    <CalendarRow>
      <CalendarBadge>
        <CalendarDays aria-hidden="true" />
      </CalendarBadge>
      {renderDateLabel(item.date)}
    </CalendarRow>
    <FlightRouteRow>
      <AirportBlock>
        <AirportCode>{item.origin}</AirportCode>
        <AirportCity>{item.originCity}</AirportCity>
      </AirportBlock>
      <RouteConnector>
        <RouteLine />
        <PlaneGlyph />
        <RouteLine />
      </RouteConnector>
      <AirportBlock>
        <AirportCode>{item.destination}</AirportCode>
        <AirportCity>{item.destinationCity}</AirportCity>
      </AirportBlock>
    </FlightRouteRow>
  </OutlineCardShell>
);

const HotelPreviewCard: React.FC<{ item: HotelPreviewItem }> = ({ item }) => (
  <OutlineCardShell $expanded>
    <CardTopRow>
      <CardLabelIcon>
        <BedDouble aria-hidden="true" />
      </CardLabelIcon>
      <CardLabel>{item.label}</CardLabel>
    </CardTopRow>
    <HotelTitle>{item.title}</HotelTitle>
    <CalendarRow>
      <CalendarBadge>
        <CalendarDays aria-hidden="true" />
      </CalendarBadge>
      {renderDateLabel(item.checkIn)}
    </CalendarRow>
    <NightsRow>
      <NightsLine />
      <NightsPill>
        <MoonStar aria-hidden="true" />
        <span>{item.nights} nights</span>
      </NightsPill>
      <NightsLine />
    </NightsRow>
    <EventList>
      {item.events.map((event) => (
        <EventItem key={event.id}>
          <EventTitle>{event.title}</EventTitle>
          <EventMeta>{event.meta}</EventMeta>
        </EventItem>
      ))}
    </EventList>
    <CalendarRow>
      <CalendarBadge>
        <CalendarDays aria-hidden="true" />
      </CalendarBadge>
      {renderDateLabel(item.checkOut)}
    </CalendarRow>
  </OutlineCardShell>
);

const getDateBadgeParts = (value: string): { day: string; number: string } => {
  const trimmed = value.trim();
  const segments = trimmed.split(",");
  const day = (segments[0] ?? trimmed).trim().slice(0, 3).toUpperCase();
  const numberMatch = trimmed.match(/(\d{1,2})(?!.*\d)/);

  return {
    day,
    number: numberMatch?.[1] ?? "",
  };
};

const airportDisplayNames: Record<string, string> = {
  JFK: "New York",
  BCN: "Barcelona",
};

const FlightBookingCard: React.FC<{
  option: PlanFlightOption;
  sectionLabel: string;
  sectionMeta: string;
}> = ({ option, sectionLabel, sectionMeta }) => {
  const dateBadge = getDateBadgeParts(sectionMeta);
  const departureAirportName = airportDisplayNames[option.origin] ?? option.origin;
  const arrivalAirportName = airportDisplayNames[option.destination] ?? option.destination;

  return (
    <BookingSection>
      <BookingSectionTop>
        <BookingSectionLabel>{sectionLabel}</BookingSectionLabel>
        <BookingSectionValue>{sectionMeta}</BookingSectionValue>
      </BookingSectionTop>

      <SourceCard>
        <SourceHeaderRow>
          <SourceHeaderInfo>
            <SourceLabelRow>
              {option.logoSrc ? (
                <BookingLogoImage src={option.logoSrc} alt={`${option.carrier} logo`} />
              ) : (
                <BookingLogo $tone={option.accent}>{option.carrierCode}</BookingLogo>
              )}
              <SourceLabelText>Flight</SourceLabelText>
            </SourceLabelRow>
            <SourceTitle>{option.carrier}</SourceTitle>
            <SourceSubText>
              {option.carrierCode} • {option.aircraft}
            </SourceSubText>
            <SourceSubText>{option.stops}</SourceSubText>
          </SourceHeaderInfo>
          <SourcePriceSummary>
            <SourcePricePrimary>{option.price}</SourcePricePrimary>
            <SourcePriceHint>{option.fareClass}</SourcePriceHint>
            <SourceExpandButton type="button" tabIndex={-1} aria-hidden="true">
              ˅
            </SourceExpandButton>
          </SourcePriceSummary>
        </SourceHeaderRow>

        <SourceTimeline>
          <SourceTimelineColumns>
            <SourceTimelineColumn>
              <SourceTimelineLabel>Departure</SourceTimelineLabel>
              <SourceTimelineTime>{option.departureTime}</SourceTimelineTime>
              <SourceTimelineDetailRow>
                <SourceTimelineCode>{option.origin}</SourceTimelineCode>
                <SourceTimelineDetail>{departureAirportName}</SourceTimelineDetail>
              </SourceTimelineDetailRow>
            </SourceTimelineColumn>
            <SourceTimelineColumn>
              <SourceTimelineLabel>Arrival</SourceTimelineLabel>
              <SourceTimelineTime>{option.arrivalTime}</SourceTimelineTime>
              <SourceTimelineDetailRow>
                <SourceTimelineCode>{option.destination}</SourceTimelineCode>
                <SourceTimelineDetail>{arrivalAirportName}</SourceTimelineDetail>
              </SourceTimelineDetailRow>
            </SourceTimelineColumn>
          </SourceTimelineColumns>

          <SourceDurationRow>
            <SourceDurationPill>
              <span>{option.duration}</span>
              <span>•</span>
              <span>{option.stops}</span>
            </SourceDurationPill>
          </SourceDurationRow>
        </SourceTimeline>

        <SourceRankingRow>
          <SourceWhyBadge>Why this flight</SourceWhyBadge>
          <SourceDateBadge>
            <SourceDateDay>{dateBadge.day}</SourceDateDay>
            <SourceDateNumber>{dateBadge.number}</SourceDateNumber>
          </SourceDateBadge>
        </SourceRankingRow>
      </SourceCard>
    </BookingSection>
  );
};

const HotelBookingCardPreview: React.FC<{ option: PlanHotelOption }> = ({ option }) => (
  <BookingSection>
    <BookingSectionTop>
      <BookingSectionLabel>Hotel</BookingSectionLabel>
      <BookingSectionValue>9 nights</BookingSectionValue>
    </BookingSectionTop>

    <SourceCard>
      <SourceGallery>
        <SourceGalleryImage $image={option.image} />
        <SourceGalleryDots>
          <SourceGalleryDot $active />
          <SourceGalleryDot />
          <SourceGalleryDot />
        </SourceGalleryDots>
      </SourceGallery>

      <SourceHeaderRow>
        <SourceHeaderInfo>
          <SourceLabelRow>
            <BookingLogo $tone={option.accent}>{option.brandMark}</BookingLogo>
            <SourceLabelText>Hotel</SourceLabelText>
          </SourceLabelRow>
          <SourceTitle>{option.name}</SourceTitle>
          <SourceSubText>{option.brandLabel ?? option.neighborhood}</SourceSubText>
        </SourceHeaderInfo>
        <SourcePriceSummary>
          <SourcePricePrimary>{option.total}</SourcePricePrimary>
          <SourcePriceHint>{option.nightlyRate} • 9 nights</SourcePriceHint>
        </SourcePriceSummary>
      </SourceHeaderRow>

      <SourceTimeline>
        <SourceTimelineColumns>
          <SourceTimelineColumn>
            <SourceTimelineLabel>Check-in</SourceTimelineLabel>
            <SourceTimelineTime>Tue, Jun 23, 2026</SourceTimelineTime>
            <SourceTimelineDetail>{option.roomType}</SourceTimelineDetail>
          </SourceTimelineColumn>
          <SourceTimelineColumn>
            <SourceTimelineLabel>Check-out</SourceTimelineLabel>
            <SourceTimelineTime>Thu, Jul 2, 2026</SourceTimelineTime>
            <SourceTimelineDetail>{option.boardType}</SourceTimelineDetail>
          </SourceTimelineColumn>
        </SourceTimelineColumns>
      </SourceTimeline>

      <SourceRankingRow>
        <SourceWhyBadge>Why this stay</SourceWhyBadge>
        <SourceRatingRow>
          <SourceRatingText>{option.rating} stars</SourceRatingText>
        </SourceRatingRow>
      </SourceRankingRow>
    </SourceCard>
  </BookingSection>
);

const BookingCarousel: React.FC<{
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}> = ({ index, total, onPrev, onNext, children }) => (
  <CarouselShell>
    <CarouselViewport>
      <CarouselTrack $index={index} $count={total}>
        {children}
      </CarouselTrack>
    </CarouselViewport>
    {total > 1 ? (
      <CarouselControls>
        <CarouselArrowGroup>
          <CarouselArrow type="button" onClick={onPrev} aria-label="Previous option">
            ‹
          </CarouselArrow>
        </CarouselArrowGroup>
        <CarouselMeta>
          <CarouselDots>
            {Array.from({ length: total }, (_, dotIndex) => (
              <CarouselDot key={dotIndex} $active={dotIndex === index} />
            ))}
          </CarouselDots>
          <CarouselLabel>{index + 1} of {total}</CarouselLabel>
        </CarouselMeta>
        <CarouselRightControls>
          <CarouselArrow type="button" onClick={onNext} aria-label="Next option">
            ›
          </CarouselArrow>
          <CarouselSkipButton type="button">Skip</CarouselSkipButton>
        </CarouselRightControls>
      </CarouselControls>
    ) : null}
  </CarouselShell>
);

const PlanShowcasePhone: React.FC<{
  screenKey: PlanShowcaseKey;
  large?: boolean;
  journeyFullHeight?: boolean;
  scrollProgress?: number;
  scrollablePreview?: boolean;
  initialScrollTop?: number;
  outboundIndex: number;
  hotelIndex: number;
  returnIndex: number;
  onPrevOutbound: () => void;
  onNextOutbound: () => void;
  onPrevHotel: () => void;
  onNextHotel: () => void;
  onPrevReturn: () => void;
  onNextReturn: () => void;
  selectedOutboundFlight: PlanFlightOption;
  selectedHotel: PlanHotelOption;
  selectedReturnFlight: PlanFlightOption;
  totalTripPrice: string;
}> = ({
  screenKey,
  large = false,
  journeyFullHeight = false,
  scrollProgress = 0,
  scrollablePreview = false,
  initialScrollTop,
  outboundIndex,
  hotelIndex,
  returnIndex,
  onPrevOutbound,
  onNextOutbound,
  onPrevHotel,
  onNextHotel,
  onPrevReturn,
  onNextReturn,
  selectedOutboundFlight,
  selectedHotel,
  selectedReturnFlight,
  totalTripPrice,
}) => {
  const activeItem =
    planShowcaseItems.find((item) => item.key === screenKey) ?? planShowcaseItems[0];
  const isOutlineScreen = screenKey === "outline";
  const isSearchScreen = screenKey === "search";
  const isBookingScreen = screenKey === "booking";
  const phoneHeaderTitle = "Pack";
  const contentTravelDistance = isOutlineScreen
    ? JOURNEY_SCROLL_DISTANCES.outline
    : isSearchScreen
      ? JOURNEY_SCROLL_DISTANCES.search
      : JOURNEY_SCROLL_DISTANCES.booking;
  const {
    containerRef: planScrollRef,
    contentRef: planContentRef,
    travelDistance: measuredPlanTravelDistance,
  } = useMeasuredTravelDistance(contentTravelDistance, scrollablePreview);
  usePreviewScrollSync(
    planScrollRef,
    scrollProgress,
    scrollablePreview
  );
  useInitialScrollTop(planScrollRef, initialScrollTop, scrollablePreview);

  return (
    <PlanPhone
      $height={journeyFullHeight ? JOURNEY_PHONE_STANDARD_HEIGHT : undefined}
      $tabletHeight={journeyFullHeight ? JOURNEY_PHONE_TABLET_HEIGHT : undefined}
      $mobileHeight={journeyFullHeight ? JOURNEY_PHONE_MOBILE_HEIGHT : undefined}
      $minHeight={journeyFullHeight ? JOURNEY_PHONE_STANDARD_HEIGHT : activeItem.minHeight}
      $tabletMinHeight={journeyFullHeight ? JOURNEY_PHONE_TABLET_HEIGHT : undefined}
      $mobileMinHeight={journeyFullHeight ? JOURNEY_PHONE_MOBILE_HEIGHT : activeItem.mobileMinHeight}
      $maxWidth={large ? JOURNEY_PHONE_STANDARD_WIDTH : undefined}
      $tabletMaxWidth={large ? JOURNEY_PHONE_TABLET_WIDTH : undefined}
      $mobileMaxWidth={large ? JOURNEY_PHONE_MOBILE_WIDTH : undefined}
    >
      <ReviewPhoneSwitch>
        <PlanPhoneInner>
          <StatusBar>
            <StatusTime>2:50</StatusTime>
            <StatusCenter aria-hidden="true" />
            <StatusIcons />
          </StatusBar>

          {isBookingScreen ? (
            <>
              <PlanHeader>
                <PlanHeaderIcon aria-hidden="true">
                  <X />
                </PlanHeaderIcon>
                <PlanHeaderTitle>Complete Booking</PlanHeaderTitle>
                <PlanHeaderMeta>
                  Ready to book
                </PlanHeaderMeta>
              </PlanHeader>

              <PlanFlowScroll
                ref={planScrollRef}
                $scrollable={scrollablePreview}
              >
                <PlanScrollContent
                  ref={planContentRef}
                  $progress={scrollProgress}
                  $travelDistance={measuredPlanTravelDistance}
                  $scrollable={scrollablePreview}
                >
                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalSectionHeader>
                        <BookingModalSectionHeaderMain>
                          <BookingModalSectionTitleRow>
                            <BookingModalSectionIcon $accent="blue">
                              <Plane aria-hidden="true" />
                            </BookingModalSectionIcon>
                            <BookingModalSectionTitle>Your Trip</BookingModalSectionTitle>
                          </BookingModalSectionTitleRow>
                          <BookingModalSectionMeta>
                            Flight 1, Hotel 1, and Flight 2 selected for this booking.
                          </BookingModalSectionMeta>
                        </BookingModalSectionHeaderMain>
                        <BookingModalSectionChevron>
                          <ChevronDown aria-hidden="true" />
                        </BookingModalSectionChevron>
                      </BookingModalSectionHeader>
                      <BookingModalLine>
                        <BookingModalLineLabel>
                          <BookingModalLineIcon $accent="blue">
                            <Plane aria-hidden="true" />
                          </BookingModalLineIcon>
                          <BookingModalLineText>
                            <BookingModalLineTitle>Flight 1</BookingModalLineTitle>
                            <BookingModalLineMeta>
                              {selectedOutboundFlight.carrier} • {selectedOutboundFlight.origin} → {selectedOutboundFlight.destination}
                            </BookingModalLineMeta>
                          </BookingModalLineText>
                        </BookingModalLineLabel>
                        <BookingModalAmount>{selectedOutboundFlight.price}</BookingModalAmount>
                      </BookingModalLine>
                      <BookingModalLine>
                        <BookingModalLineLabel>
                          <BookingModalLineIcon $accent="green">
                            <BedDouble aria-hidden="true" />
                          </BookingModalLineIcon>
                          <BookingModalLineText>
                            <BookingModalLineTitle>Hotel 1</BookingModalLineTitle>
                            <BookingModalLineMeta>
                              {selectedHotel.name} • {selectedHotel.roomType}
                            </BookingModalLineMeta>
                          </BookingModalLineText>
                        </BookingModalLineLabel>
                        <BookingModalAmount>{selectedHotel.total}</BookingModalAmount>
                      </BookingModalLine>
                      <BookingModalLine>
                        <BookingModalLineLabel>
                          <BookingModalLineIcon $accent="blue">
                            <Plane aria-hidden="true" />
                          </BookingModalLineIcon>
                          <BookingModalLineText>
                            <BookingModalLineTitle>Flight 2</BookingModalLineTitle>
                            <BookingModalLineMeta>
                              {selectedReturnFlight.carrier} • {selectedReturnFlight.origin} → {selectedReturnFlight.destination}
                            </BookingModalLineMeta>
                          </BookingModalLineText>
                        </BookingModalLineLabel>
                        <BookingModalAmount>{selectedReturnFlight.price}</BookingModalAmount>
                      </BookingModalLine>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalSectionHeader>
                        <BookingModalSectionHeaderMain>
                          <BookingModalSectionTitleRow>
                            <BookingModalSectionIcon>
                              <UserRound aria-hidden="true" />
                            </BookingModalSectionIcon>
                            <BookingModalSectionTitle>Passenger Information</BookingModalSectionTitle>
                          </BookingModalSectionTitleRow>
                        </BookingModalSectionHeaderMain>
                        <BookingModalSectionChevron>
                          <ChevronDown aria-hidden="true" />
                        </BookingModalSectionChevron>
                      </BookingModalSectionHeader>
                      <BookingPassengerChipRow>
                        <BookingPassengerChip $active>
                          <UserRound aria-hidden="true" />
                          Marcus Aurelius
                        </BookingPassengerChip>
                        <BookingPassengerChip>
                          <Plus aria-hidden="true" />
                          Add passenger
                        </BookingPassengerChip>
                      </BookingPassengerChipRow>
                      <BookingFieldStack>
                        <BookingField><BookingFieldLabel>First Name</BookingFieldLabel><BookingFieldValue>Marcus</BookingFieldValue></BookingField>
                        <BookingField><BookingFieldLabel>Last Name</BookingFieldLabel><BookingFieldValue>Aurelius</BookingFieldValue></BookingField>
                        <BookingField><BookingFieldLabel>Date of Birth</BookingFieldLabel><BookingFieldValue>October 18, 1992</BookingFieldValue></BookingField>
                        <BookingField><BookingFieldLabel>Gender</BookingFieldLabel><BookingFieldValue>Male</BookingFieldValue></BookingField>
                        <BookingField><BookingFieldLabel>Email</BookingFieldLabel><BookingFieldValue>trips@trypackai.com</BookingFieldValue></BookingField>
                        <BookingField><BookingFieldLabel>Phone Number</BookingFieldLabel><BookingFieldValue>+12125550186</BookingFieldValue></BookingField>
                        <BookingField><BookingFieldLabel>Document Type</BookingFieldLabel><BookingFieldValue>Passport</BookingFieldValue></BookingField>
                        <BookingField><BookingFieldLabel>Document Number</BookingFieldLabel><BookingFieldValue>L9501843</BookingFieldValue></BookingField>
                      </BookingFieldStack>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalSectionHeader>
                        <BookingModalSectionHeaderMain>
                          <BookingModalSectionTitleRow>
                            <BookingModalSectionIcon $accent="green">
                              <Phone aria-hidden="true" />
                            </BookingModalSectionIcon>
                            <BookingModalSectionTitle>Contact Information</BookingModalSectionTitle>
                          </BookingModalSectionTitleRow>
                        </BookingModalSectionHeaderMain>
                        <BookingModalSectionChevron $collapsed>
                          <ChevronDown aria-hidden="true" />
                        </BookingModalSectionChevron>
                      </BookingModalSectionHeader>
                      <BookingFieldStack>
                        <BookingField><BookingFieldLabel>Email</BookingFieldLabel><BookingFieldValue>trips@trypackai.com</BookingFieldValue></BookingField>
                        <BookingField><BookingFieldLabel>Phone Number</BookingFieldLabel><BookingFieldValue>+12125550186</BookingFieldValue></BookingField>
                      </BookingFieldStack>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalSectionHeader>
                        <BookingModalSectionHeaderMain>
                          <BookingModalSectionTitleRow>
                            <BookingModalSectionIcon $accent="red">
                              <CreditCard aria-hidden="true" />
                            </BookingModalSectionIcon>
                            <BookingModalSectionTitle>Payment</BookingModalSectionTitle>
                          </BookingModalSectionTitleRow>
                        </BookingModalSectionHeaderMain>
                        <BookingModalSectionChevron $collapsed>
                          <ChevronDown aria-hidden="true" />
                        </BookingModalSectionChevron>
                      </BookingModalSectionHeader>
                      <BookingPaymentHint>
                        Demo mode: Payment is not collected yet. Tap &quot;Book Now&quot; to simulate a booking.
                      </BookingPaymentHint>
                      <BookingFieldStack>
                        <BookingField><BookingFieldLabel>Cardholder</BookingFieldLabel><BookingFieldValue>Marcus Aurelius</BookingFieldValue></BookingField>
                        <BookingField><BookingFieldLabel>Billing Address</BookingFieldLabel><BookingFieldValue>US</BookingFieldValue></BookingField>
                      </BookingFieldStack>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalSectionHeader>
                        <BookingModalSectionHeaderMain>
                          <BookingModalSectionTitleRow>
                            <BookingModalSectionIcon $accent="blue">
                              <Plane aria-hidden="true" />
                            </BookingModalSectionIcon>
                            <BookingModalSectionTitle>Flight Options</BookingModalSectionTitle>
                          </BookingModalSectionTitleRow>
                        </BookingModalSectionHeaderMain>
                        <BookingModalSectionChevron>
                          <ChevronDown aria-hidden="true" />
                        </BookingModalSectionChevron>
                      </BookingModalSectionHeader>
                      <BookingFieldGrid>
                        {searchFlightOptionRows.map((row) => (
                          <BookingField key={row.label}>
                            <BookingFieldLabel>{row.label}</BookingFieldLabel>
                            <BookingFieldValue>{row.value}</BookingFieldValue>
                          </BookingField>
                        ))}
                      </BookingFieldGrid>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalSectionHeader>
                        <BookingModalSectionHeaderMain>
                          <BookingModalSectionTitleRow>
                            <BookingModalSectionIcon $accent="gold">
                              <Plane aria-hidden="true" />
                            </BookingModalSectionIcon>
                            <BookingModalSectionTitle>Seat Selection</BookingModalSectionTitle>
                          </BookingModalSectionTitleRow>
                        </BookingModalSectionHeaderMain>
                        <BookingModalSectionChevron>
                          <ChevronDown aria-hidden="true" />
                        </BookingModalSectionChevron>
                      </BookingModalSectionHeader>
                      <InsightList>
                        {bookingSeatRows.map((row) => (
                          <InsightRow key={row.label}>
                            <InsightLabel>{row.label}</InsightLabel>
                            <InsightValue>{row.value}</InsightValue>
                            <InsightMeta>{row.meta}</InsightMeta>
                          </InsightRow>
                        ))}
                      </InsightList>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalSectionHeader>
                        <BookingModalSectionHeaderMain>
                          <BookingModalSectionTitleRow>
                            <BookingModalSectionIcon $accent="green">
                              <Award aria-hidden="true" />
                            </BookingModalSectionIcon>
                            <BookingModalSectionTitle>Hotel Options</BookingModalSectionTitle>
                          </BookingModalSectionTitleRow>
                        </BookingModalSectionHeaderMain>
                        <BookingModalSectionChevron>
                          <ChevronDown aria-hidden="true" />
                        </BookingModalSectionChevron>
                      </BookingModalSectionHeader>
                      <BookingFieldGrid>
                        {searchHotelOptionRows.map((row) => (
                          <BookingField key={row.label}>
                            <BookingFieldLabel>{row.label}</BookingFieldLabel>
                            <BookingFieldValue>{row.value}</BookingFieldValue>
                          </BookingField>
                        ))}
                      </BookingFieldGrid>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalSectionHeader>
                        <BookingModalSectionHeaderMain>
                          <BookingModalSectionTitleRow>
                            <BookingModalSectionIcon $accent="green">
                              <Sparkles aria-hidden="true" />
                            </BookingModalSectionIcon>
                            <BookingModalSectionTitle>Requests / Assistance</BookingModalSectionTitle>
                          </BookingModalSectionTitleRow>
                        </BookingModalSectionHeaderMain>
                        <BookingModalSectionChevron $collapsed>
                          <ChevronDown aria-hidden="true" />
                        </BookingModalSectionChevron>
                      </BookingModalSectionHeader>
                      <InsightList>
                        {bookingSpecialRequestRows.map((row) => (
                          <InsightRow key={row.label}>
                            <InsightLabel>{row.label}</InsightLabel>
                            <InsightValue>{row.value}</InsightValue>
                            <InsightMeta>{row.meta}</InsightMeta>
                          </InsightRow>
                        ))}
                      </InsightList>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalHeader>
                        <BookingModalEyebrow>Price Breakdown</BookingModalEyebrow>
                        <BookingModalSectionTitleRow>
                          <BookingModalSectionIcon>
                            <ReceiptText aria-hidden="true" />
                          </BookingModalSectionIcon>
                          <BookingModalTitle>Price Breakdown</BookingModalTitle>
                        </BookingModalSectionTitleRow>
                        <BookingModalMeta>All mandatory fees are included in total price.</BookingModalMeta>
                      </BookingModalHeader>
                      <BookingModalBreakdown>
                        <BookingModalSection>
                          <BookingModalLine>
                            <BookingModalLineLabel>
                              <BookingModalLineIcon $accent="blue"><Plane aria-hidden="true" /></BookingModalLineIcon>
                              <BookingModalLineText>
                                <BookingModalLineTitle>Flight (JFK → BCN)</BookingModalLineTitle>
                                <BookingModalLineMeta>{selectedOutboundFlight.carrier} • {selectedOutboundFlight.fareClass}</BookingModalLineMeta>
                              </BookingModalLineText>
                            </BookingModalLineLabel>
                            <BookingModalAmount>USD {parseDisplayAmount(selectedOutboundFlight.price).toFixed(2)}</BookingModalAmount>
                          </BookingModalLine>
                          <BookingModalSubRow><BookingModalSubLabel>Base Fare</BookingModalSubLabel><BookingModalSubValue>USD {parseDisplayAmount(selectedOutboundFlight.priceDetails.baseFare).toFixed(2)}</BookingModalSubValue></BookingModalSubRow>
                          <BookingModalSubRow><BookingModalSubLabel>Taxes & Fees</BookingModalSubLabel><BookingModalSubValue>USD {parseDisplayAmount(selectedOutboundFlight.priceDetails.taxesAndFees).toFixed(2)}</BookingModalSubValue></BookingModalSubRow>
                          <BookingModalSubRow><BookingModalSubLabel>Pack Service Fee</BookingModalSubLabel><BookingModalSubValue>USD {parseDisplayAmount(selectedOutboundFlight.priceDetails.serviceFee).toFixed(2)}</BookingModalSubValue></BookingModalSubRow>
                        </BookingModalSection>
                        <BookingModalSection>
                          <BookingModalLine>
                            <BookingModalLineLabel>
                              <BookingModalLineIcon $accent="green"><BedDouble aria-hidden="true" /></BookingModalLineIcon>
                              <BookingModalLineText>
                                <BookingModalLineTitle>Hotel ({selectedHotel.name})</BookingModalLineTitle>
                                <BookingModalLineMeta>9 nights • {selectedHotel.roomType}</BookingModalLineMeta>
                              </BookingModalLineText>
                            </BookingModalLineLabel>
                            <BookingModalAmount>USD {parseDisplayAmount(selectedHotel.total).toFixed(2)}</BookingModalAmount>
                          </BookingModalLine>
                          <BookingModalSubRow><BookingModalSubLabel>Room Rate</BookingModalSubLabel><BookingModalSubValue>USD {parseDisplayAmount(selectedHotel.priceDetails.roomRate).toFixed(2)}</BookingModalSubValue></BookingModalSubRow>
                          <BookingModalSubRow><BookingModalSubLabel>Taxes & Fees</BookingModalSubLabel><BookingModalSubValue>USD {parseDisplayAmount(selectedHotel.priceDetails.taxesAndFees).toFixed(2)}</BookingModalSubValue></BookingModalSubRow>
                          <BookingModalSubRow><BookingModalSubLabel>Pack Service Fee</BookingModalSubLabel><BookingModalSubValue>USD {parseDisplayAmount(selectedHotel.priceDetails.serviceFee).toFixed(2)}</BookingModalSubValue></BookingModalSubRow>
                        </BookingModalSection>
                        <BookingModalSection>
                          <BookingModalLine>
                            <BookingModalLineLabel>
                              <BookingModalLineIcon $accent="blue"><Plane aria-hidden="true" /></BookingModalLineIcon>
                              <BookingModalLineText>
                                <BookingModalLineTitle>Flight (BCN → JFK)</BookingModalLineTitle>
                                <BookingModalLineMeta>{selectedReturnFlight.carrier} • {selectedReturnFlight.fareClass}</BookingModalLineMeta>
                              </BookingModalLineText>
                            </BookingModalLineLabel>
                            <BookingModalAmount>USD {parseDisplayAmount(selectedReturnFlight.price).toFixed(2)}</BookingModalAmount>
                          </BookingModalLine>
                          <BookingModalSubRow><BookingModalSubLabel>Base Fare</BookingModalSubLabel><BookingModalSubValue>USD {parseDisplayAmount(selectedReturnFlight.priceDetails.baseFare).toFixed(2)}</BookingModalSubValue></BookingModalSubRow>
                          <BookingModalSubRow><BookingModalSubLabel>Taxes & Fees</BookingModalSubLabel><BookingModalSubValue>USD {parseDisplayAmount(selectedReturnFlight.priceDetails.taxesAndFees).toFixed(2)}</BookingModalSubValue></BookingModalSubRow>
                          <BookingModalSubRow><BookingModalSubLabel>Pack Service Fee</BookingModalSubLabel><BookingModalSubValue>USD {parseDisplayAmount(selectedReturnFlight.priceDetails.serviceFee).toFixed(2)}</BookingModalSubValue></BookingModalSubRow>
                        </BookingModalSection>
                        <BookingModalTotal>
                          <span>Total</span>
                          <span>USD {parseDisplayAmount(totalTripPrice).toFixed(2)}</span>
                        </BookingModalTotal>
                      </BookingModalBreakdown>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookingModalSectionCard>
                      <BookingModalSectionHeader>
                        <BookingModalSectionHeaderMain>
                          <BookingModalSectionTitleRow>
                            <BookingModalSectionIcon $accent="gold">
                              <Award aria-hidden="true" />
                            </BookingModalSectionIcon>
                            <BookingModalSectionTitle>Passenger protections</BookingModalSectionTitle>
                          </BookingModalSectionTitleRow>
                        </BookingModalSectionHeaderMain>
                        <BookingModalSectionChevron $collapsed>
                          <ChevronDown aria-hidden="true" />
                        </BookingModalSectionChevron>
                      </BookingModalSectionHeader>
                      <InsightList>
                        {bookingProtectionRows.map((row) => (
                          <InsightRow key={row.label}>
                            <InsightLabel>{row.label}</InsightLabel>
                            <InsightValue>{row.value}</InsightValue>
                            <InsightMeta>{row.meta}</InsightMeta>
                          </InsightRow>
                        ))}
                      </InsightList>
                    </BookingModalSectionCard>
                  </PlanSection>

                  <PlanSection>
                    <BookButton type="button">Book Now - USD {parseDisplayAmount(totalTripPrice).toFixed(2)}</BookButton>
                  </PlanSection>
                </PlanScrollContent>
              </PlanFlowScroll>
            </>
          ) : (
            <>
              <PlanHeader>
                <PlanHeaderIcon aria-hidden="true">
                  <Menu />
                </PlanHeaderIcon>
                <PlanHeaderTitle>{phoneHeaderTitle}</PlanHeaderTitle>
                <PlanHeaderMeta>
                  <PlanHeaderMetaDot aria-hidden="true" />
                  Live In flight
                </PlanHeaderMeta>
              </PlanHeader>

              {isOutlineScreen ? (
            <PlanFlowScroll
              ref={planScrollRef}
              $scrollable={scrollablePreview}
            >
              <PlanScrollContent
                ref={planContentRef}
                $progress={scrollProgress}
                $travelDistance={measuredPlanTravelDistance}
                $scrollable={scrollablePreview}
              >
                <PlanSection>
                  <PlanSectionHeader>
                    <PlanSectionTitle>Travel Outline</PlanSectionTitle>
                  </PlanSectionHeader>
                  <PromptStack>
                    <UserBubbleRow>
                      <PromptBubble>
                        <span>Book Barcelona</span>
                      </PromptBubble>
                    </UserBubbleRow>

                    <OutlineSurface>
                      <TimelineStack>
                        {outlineItems.map((item) =>
                          item.type === "flight" ? (
                            <FlightPreviewCard key={item.id} item={item} />
                          ) : (
                            <HotelPreviewCard key={item.id} item={item} />
                          )
                        )}
                      </TimelineStack>
                    </OutlineSurface>
                  </PromptStack>
                </PlanSection>
                <PlanSection>
                  <OutlineActionBar>
                    <OutlineActionButton type="button">
                      <PencilLine aria-hidden="true" />
                      Edit
                    </OutlineActionButton>
                    <OutlineActionButton type="button" $primary>
                      Continue
                    </OutlineActionButton>
                    <OutlineActionButton type="button">
                      <Share2 aria-hidden="true" />
                      Share
                    </OutlineActionButton>
                  </OutlineActionBar>
                </PlanSection>
              </PlanScrollContent>
            </PlanFlowScroll>
              ) : (
              <PlanFlowScroll
                ref={planScrollRef}
                $scrollable={scrollablePreview}
              >
                <PlanScrollContent
                  ref={planContentRef}
                  $progress={scrollProgress}
                  $travelDistance={measuredPlanTravelDistance}
                  $scrollable={scrollablePreview}
                >
                  <PlanSection>
                    <BookingStage>
                      {isSearchScreen ? (
                        <SearchFilterRow>
                          <SearchSortLabel>Sort by</SearchSortLabel>
                          <SearchSortButtons>
                            <SearchFilterChip>Price</SearchFilterChip>
                            <SearchFilterChip $active>Smart</SearchFilterChip>
                          </SearchSortButtons>
                        </SearchFilterRow>
                      ) : null}

                      <BookingCarousel
                        index={outboundIndex}
                        total={outboundFlightOptions.length}
                        onPrev={onPrevOutbound}
                        onNext={onNextOutbound}
                      >
                        {outboundFlightOptions.map((option) => (
                          <CarouselSlide key={option.id}>
                            <FlightBookingCard
                              option={option}
                              sectionLabel="Outbound flight"
                              sectionMeta="Tue, Jun 23"
                            />
                          </CarouselSlide>
                        ))}
                      </BookingCarousel>
                      {isSearchScreen ? (
                        <SearchWhyPopover>
                          <SearchWhyTop>
                            <span>Why this flight</span>
                            <X aria-hidden="true" />
                          </SearchWhyTop>
                          <SearchWhyBody>
                            Nonstop Delta One flight with the shortest travel time, lounge access, and the cleanest
                            arrival window for a same-day suite check-in in Barcelona.
                          </SearchWhyBody>
                        </SearchWhyPopover>
                      ) : null}
                      <BookingCarousel index={hotelIndex} total={hotelOptions.length} onPrev={onPrevHotel} onNext={onNextHotel}>
                        {hotelOptions.map((option) => (
                          <CarouselSlide key={option.id}>
                            <HotelBookingCardPreview option={option} />
                          </CarouselSlide>
                        ))}
                      </BookingCarousel>

                      <BookingCarousel
                        index={returnIndex}
                        total={returnFlightOptions.length}
                        onPrev={onPrevReturn}
                        onNext={onNextReturn}
                      >
                        {returnFlightOptions.map((option) => (
                          <CarouselSlide key={option.id}>
                            <FlightBookingCard
                              option={option}
                              sectionLabel="Return flight"
                              sectionMeta="Thu, Jul 2"
                            />
                          </CarouselSlide>
                        ))}
                      </BookingCarousel>
                    </BookingStage>
                  </PlanSection>
                </PlanScrollContent>
              </PlanFlowScroll>
              )}
              <AppBottomComposer aria-hidden="true">
                <ComposerTopRow>
                  <ComposerPlaceholder>Where to next?</ComposerPlaceholder>
                  <ComposerAction>
                    <ChevronDown />
                  </ComposerAction>
                  <ComposerAction>
                    <X />
                  </ComposerAction>
                </ComposerTopRow>
                <ComposerToolbar>
                  <Bolt />
                  <Plus />
                  <Mic />
                </ComposerToolbar>
              </AppBottomComposer>
            </>
          )}
        </PlanPhoneInner>
      </ReviewPhoneSwitch>
    </PlanPhone>
  );
};

const ReviewShowcasePhone: React.FC<{
  screenKey: ReviewShowcaseKey;
  large?: boolean;
  journeyFullHeight?: boolean;
  scrollProgress?: number;
  scrollablePreview?: boolean;
  initialScrollTop?: number;
}> = ({
  screenKey,
  large = false,
  journeyFullHeight = false,
  scrollProgress = 0,
  scrollablePreview = false,
  initialScrollTop,
}) => {
  const activeItem =
    reviewShowcaseItems.find((item) => item.key === screenKey) ?? reviewShowcaseItems[0];
  const fallbackTravelDistance =
    screenKey === "footprint"
      ? JOURNEY_SCROLL_DISTANCES.statsFootprint
      : JOURNEY_SCROLL_DISTANCES.statsRecords;
  const {
    containerRef: reviewScrollRef,
    contentRef: reviewContentRef,
    travelDistance: measuredReviewTravelDistance,
  } = useMeasuredTravelDistance(fallbackTravelDistance, scrollablePreview);
  usePreviewScrollSync(
    reviewScrollRef,
    scrollProgress,
    scrollablePreview
  );
  useInitialScrollTop(reviewScrollRef, initialScrollTop, scrollablePreview);

  return (
    <PlanPhone
      $height={journeyFullHeight ? JOURNEY_PHONE_STANDARD_HEIGHT : undefined}
      $tabletHeight={journeyFullHeight ? JOURNEY_PHONE_TABLET_HEIGHT : undefined}
      $mobileHeight={journeyFullHeight ? JOURNEY_PHONE_MOBILE_HEIGHT : undefined}
      $minHeight={journeyFullHeight ? JOURNEY_PHONE_STANDARD_HEIGHT : activeItem.minHeight}
      $tabletMinHeight={journeyFullHeight ? JOURNEY_PHONE_TABLET_HEIGHT : undefined}
      $mobileMinHeight={journeyFullHeight ? JOURNEY_PHONE_MOBILE_HEIGHT : activeItem.mobileMinHeight}
      $maxWidth={large ? JOURNEY_PHONE_STANDARD_WIDTH : undefined}
      $tabletMaxWidth={large ? JOURNEY_PHONE_TABLET_WIDTH : undefined}
      $mobileMaxWidth={large ? JOURNEY_PHONE_MOBILE_WIDTH : undefined}
    >
      <ReviewPhoneSwitch>
        <PlanPhoneInner>
          <StatusBar>
            <StatusTime>2:47</StatusTime>
            <StatusCenter aria-hidden="true" />
            <StatusIcons />
          </StatusBar>

          <TripsHeader>
            <TripsBack aria-hidden="true">
              <ChevronDown />
            </TripsBack>
            <TripsTitle>Trips</TripsTitle>
            <span />
          </TripsHeader>

          <TripsTabs>
            <Tab>
              <TabPill>
                <TabIcon>
                  <CalendarDays />
                </TabIcon>
              </TabPill>
              <span>Upcoming</span>
            </Tab>
            <Tab $active>
              <TabPill $active>
                <TabIcon>
                  <BarChart3 />
                </TabIcon>
              </TabPill>
              <span>Stats</span>
            </Tab>
            <Tab>
              <TabPill>
                <TabIcon>
                  <History />
                </TabIcon>
              </TabPill>
              <span>Past</span>
            </Tab>
          </TripsTabs>

          {screenKey === "footprint" ? (
            <TravelScroll
              $scrollable={scrollablePreview ? true : false}
              ref={reviewScrollRef}
            >
              <TravelScrollContent
                ref={reviewContentRef}
                $progress={scrollProgress}
                $travelDistance={measuredReviewTravelDistance}
                $scrollable={scrollablePreview}
              >
                <StatsYearRow>
                  <StatsYearChip $active>All</StatsYearChip>
                  <StatsYearChip>2026</StatsYearChip>
                  <StatsYearChip>2025</StatsYearChip>
                </StatsYearRow>

	                <StatsPrimaryGrid>
	                  <StatsPrimaryCard>
	                    <StatsMetricIcon $tone="#F0C62D">
	                      <Navigation aria-hidden="true" />
                    </StatsMetricIcon>
                    <StatsPrimaryValue>154k</StatsPrimaryValue>
                    <StatsPrimaryLabel>Miles Traveled</StatsPrimaryLabel>
                  </StatsPrimaryCard>
                  <StatsPrimaryCard>
                    <StatsMetricIcon $tone="#FF9800">
                      <CalendarDays aria-hidden="true" />
                    </StatsMetricIcon>
                    <StatsPrimaryValue>584</StatsPrimaryValue>
	                    <StatsPrimaryLabel>Nights Away</StatsPrimaryLabel>
	                  </StatsPrimaryCard>
	                </StatsPrimaryGrid>

                  <StatsSectionHeading>
                    <TravelSectionTitle>Traveled to</TravelSectionTitle>
                    <TravelSectionMeta>A simple visited-countries map using the same world geometry pattern as the app stats page.</TravelSectionMeta>
                  </StatsSectionHeading>

                  <Suspense fallback={<MapCardSkeleton aria-hidden="true" />}>
                    <HeroJourneyMapCard />
                  </Suspense>

	                <StatsHighlightGrid>
	                  <StatsHighlightCard>
	                    <StatsRing $tone="#E72340" $progress={38}>
	                      <StatsRingCenter $tone="#E72340">38%</StatsRingCenter>
                    </StatsRing>
                    <StatsHighlightValue>38</StatsHighlightValue>
                    <StatsHighlightLabel>Cities</StatsHighlightLabel>
                    <StatsHighlightMeta>Goal 100</StatsHighlightMeta>
                  </StatsHighlightCard>
                  <StatsHighlightCard>
                    <StatsRing $tone="#4CAF50" $progress={4}>
                      <StatsRingCenter $tone="#4CAF50">4%</StatsRingCenter>
                    </StatsRing>
                    <StatsHighlightValue>8</StatsHighlightValue>
                    <StatsHighlightLabel>Countries</StatsHighlightLabel>
                    <StatsHighlightMeta>8 / 195 visited</StatsHighlightMeta>
                  </StatsHighlightCard>
                  <StatsHighlightCard>
                    <StatsRing $tone="#2196F3" $progress={29}>
                      <StatsRingCenter $tone="#2196F3">29%</StatsRingCenter>
                    </StatsRing>
                    <StatsHighlightValue>2</StatsHighlightValue>
                    <StatsHighlightLabel>Continents</StatsHighlightLabel>
                    <StatsHighlightMeta>Europe, North America</StatsHighlightMeta>
                  </StatsHighlightCard>
                </StatsHighlightGrid>

                  <StatsStreakCard>
                    <StatsMetricIcon $tone="#F44336">
                      <Bolt aria-hidden="true" />
                    </StatsMetricIcon>
                  <StatsStreakBody>
                    <StatsPrimaryValue>12</StatsPrimaryValue>
                    <StatsPrimaryLabel>Longest Month Streak</StatsPrimaryLabel>
                    <StatsPrimaryMeta>Current streak: 4 months</StatsPrimaryMeta>
                  </StatsStreakBody>
                </StatsStreakCard>

	                <StatsSectionHeading>
	                  <TravelSectionTitle>Personal Records</TravelSectionTitle>
	                  <TravelSectionMeta>Your travel milestones and achievements</TravelSectionMeta>
	                </StatsSectionHeading>

                <RecordsList>
                  {recordRows.map((record) => (
                    <RecordCard key={record.label}>
                      <RecordIcon $tone={record.tone}>
                        {renderRecordIcon(record.icon)}
                      </RecordIcon>
                      <RecordBody>
                        <RecordLabel>{record.label}</RecordLabel>
                        <RecordValue $tone={record.tone}>{record.value}</RecordValue>
                        <RecordMeta>{record.meta}</RecordMeta>
                      </RecordBody>
                    </RecordCard>
                  ))}
                </RecordsList>

                <StatsSectionHeading>
                  <TravelSectionTitle>Places visited</TravelSectionTitle>
                  <TravelSectionMeta>Restaurants, museums, resorts detected from your trips.</TravelSectionMeta>
                </StatsSectionHeading>

                <StatsPanelCard>
                  <StatsPanelHeader>
                    <StatsPanelTitle>Places visited</StatsPanelTitle>
                    <StatsPanelAction>Show more</StatsPanelAction>
                  </StatsPanelHeader>
                  <TravelSectionMeta>
                    Scanned 63 of 131 eligible trips • 196 unique places
                  </TravelSectionMeta>
                  <StatsPlacesGrid>
                    {statsActivityRows.map((row) => (
                      <StatsPlacesCard key={row.label}>
                        <StatsPlacesLabel>{row.label}</StatsPlacesLabel>
                        <StatsPlacesValue>{row.value}</StatsPlacesValue>
                        <StatsPlacesMeta>{row.meta}</StatsPlacesMeta>
                      </StatsPlacesCard>
                    ))}
                  </StatsPlacesGrid>
                </StatsPanelCard>

                <StatsPanelCard>
                  <StatsPanelHeader>
                    <StatsPanelTitle>Categories</StatsPanelTitle>
                    <StatsPanelAction>Show more</StatsPanelAction>
                  </StatsPanelHeader>
                  <TravelSectionMeta>
                    Detected place mix from saved trips and visits.
                  </TravelSectionMeta>
                  <StatsMiniList>
                    {statsPatternRows.map((row) => (
                      <StatsMiniRow key={row.label}>
                        <StatsMiniTop>
                          <StatsMiniLabel>{row.label}</StatsMiniLabel>
                          <StatsMiniValue>{row.value}</StatsMiniValue>
                        </StatsMiniTop>
                        <StatsMiniMeta>{row.meta}</StatsMiniMeta>
                      </StatsMiniRow>
                    ))}
                  </StatsMiniList>
                </StatsPanelCard>

                <StatsPanelCard>
                  <StatsPanelHeader>
                    <StatsPanelTitle>Most visited places</StatsPanelTitle>
                    <StatsPanelAction>Show more</StatsPanelAction>
                  </StatsPanelHeader>
                  <TravelSectionMeta>
                    Top places from your detected travel history.
                  </TravelSectionMeta>
                  <StatsMiniList>
                    {statsAirlineRows.map((row) => (
                      <StatsMiniRow key={row.label}>
                        <StatsMiniTop>
                          <StatsMiniLabel>{row.label}</StatsMiniLabel>
                          <StatsMiniValue>{row.value}</StatsMiniValue>
                        </StatsMiniTop>
                        <StatsMiniMeta>{row.meta}</StatsMiniMeta>
                      </StatsMiniRow>
                    ))}
                  </StatsMiniList>
                </StatsPanelCard>
              </TravelScrollContent>
            </TravelScroll>
          ) : (
            <TravelScroll
              $scrollable={scrollablePreview ? true : false}
              ref={reviewScrollRef}
            >
              <TravelScrollContent
                ref={reviewContentRef}
                $progress={scrollProgress}
                $travelDistance={measuredReviewTravelDistance}
                $scrollable={scrollablePreview}
              >
                <div>
                  <TravelSectionTitle>Personal Records</TravelSectionTitle>
                  <TravelSectionMeta>Your travel milestones and achievements</TravelSectionMeta>
                </div>

                <RecordsList>
                  {recordRows.map((record) => (
                    <RecordCard key={record.label}>
                      <RecordIcon $tone={record.tone}>
                        {renderRecordIcon(record.icon)}
                      </RecordIcon>
                      <RecordBody>
                        <RecordLabel>{record.label}</RecordLabel>
                        <RecordValue $tone={record.tone}>{record.value}</RecordValue>
                        <RecordMeta>{record.meta}</RecordMeta>
                      </RecordBody>
                    </RecordCard>
                  ))}
                </RecordsList>
              </TravelScrollContent>
            </TravelScroll>
          )}
        </PlanPhoneInner>
      </ReviewPhoneSwitch>
    </PlanPhone>
  );
};

const JourneyShowcasePhone: React.FC<{
  screenKey: JourneyShowcaseKey;
  scrollProgress?: number;
  scrollablePreview?: boolean;
  initialScrollTop?: number;
  outboundIndex: number;
  hotelIndex: number;
  returnIndex: number;
  onPrevOutbound: () => void;
  onNextOutbound: () => void;
  onPrevHotel: () => void;
  onNextHotel: () => void;
  onPrevReturn: () => void;
  onNextReturn: () => void;
  selectedOutboundFlight: PlanFlightOption;
  selectedHotel: PlanHotelOption;
  selectedReturnFlight: PlanFlightOption;
  totalTripPrice: string;
}> = ({ screenKey, scrollProgress = 0, scrollablePreview = false, initialScrollTop, ...props }) => {
  if (screenKey === "plan") {
    return (
      <PlanShowcasePhone
        screenKey="outline"
        large
        journeyFullHeight
        scrollProgress={scrollProgress}
        scrollablePreview={scrollablePreview}
        initialScrollTop={initialScrollTop}
        {...props}
      />
    );
  }

  if (screenKey === "search") {
    return (
      <PlanShowcasePhone
        screenKey="search"
        large
        journeyFullHeight
        scrollProgress={scrollProgress}
        scrollablePreview={scrollablePreview}
        initialScrollTop={initialScrollTop}
        {...props}
      />
    );
  }

  if (screenKey === "stats") {
    return (
      <ReviewShowcasePhone
        screenKey="footprint"
        large
        journeyFullHeight
        scrollProgress={scrollProgress}
        scrollablePreview={scrollablePreview}
        initialScrollTop={initialScrollTop}
      />
    );
  }

  return (
    <PlanShowcasePhone
      screenKey="booking"
      large
      journeyFullHeight
      scrollProgress={scrollProgress}
      scrollablePreview={scrollablePreview}
      initialScrollTop={initialScrollTop}
      {...props}
    />
  );
};

const JourneyShowcasePhoneStack: React.FC<{
  activeScreen: JourneyShowcaseKey;
  previewProgress: number;
  outboundIndex: number;
  hotelIndex: number;
  returnIndex: number;
  onPrevOutbound: () => void;
  onNextOutbound: () => void;
  onPrevHotel: () => void;
  onNextHotel: () => void;
  onPrevReturn: () => void;
  onNextReturn: () => void;
  selectedOutboundFlight: PlanFlightOption;
  selectedHotel: PlanHotelOption;
  selectedReturnFlight: PlanFlightOption;
  totalTripPrice: string;
}> = ({ activeScreen, previewProgress, ...props }) => (
  <JourneyPhoneCrossfadeStage>
    {/* Keep one active phone instance mounted so chapter changes only swap content,
        not the shell. Only the active screen receives motion progress, which keeps
        the preview on one animation path instead of coordinating multiple screens. */}
    <JourneyShowcasePhone
      screenKey={activeScreen}
      scrollProgress={previewProgress}
      scrollablePreview
      {...props}
    />
  </JourneyPhoneCrossfadeStage>
);

const renderJourneyShowcasePhone = (
  screenKey: JourneyShowcaseKey,
  props: Omit<React.ComponentProps<typeof JourneyShowcasePhoneStack>, "activeScreen" | "previewProgress">
) => (
  <JourneyShowcasePhone
    screenKey={screenKey}
    scrollProgress={0}
    scrollablePreview
    initialScrollTop={MOBILE_INLINE_INITIAL_SCROLL_TOP[screenKey]}
    {...props}
  />
);

type IdleWindowLike = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const scheduleIdleJourneyRender = (
  callback: () => void,
  timeoutMs: number,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const idleWindow = window as IdleWindowLike;
  if (typeof idleWindow.requestIdleCallback === "function") {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: timeoutMs });
    return () => {
      if (typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(handle);
      }
    };
  }

  const timeoutId = window.setTimeout(callback, timeoutMs);
  return () => {
    window.clearTimeout(timeoutId);
  };
};

const Hero: React.FC<HeroProps> = ({ journeyOnly = false, waitlistSlot = null }) => {
  const { locale } = useI18n();
  const localizedContent = heroContent[locale];
  const [outboundIndex, setOutboundIndex] = useState(0);
  const [hotelIndex, setHotelIndex] = useState(0);
  const [returnIndex, setReturnIndex] = useState(0);
  const [shouldRenderJourneyShowcase, setShouldRenderJourneyShowcase] = useState(journeyOnly);
  const [activeJourneyScreen, setActiveJourneyScreen] = useState<JourneyShowcaseKey>(
    journeyShowcaseItems[0].key
  );
  const [journeyPreviewMotion, setJourneyPreviewMotion] = useState<JourneyPreviewMotion>({
    screen: journeyShowcaseItems[0].key,
    progress: 0,
  });
  const desktopJourneyNarrativeRefs = React.useRef<Array<HTMLElement | null>>([]);
  const mobileJourneyNarrativeRefs = React.useRef<Array<HTMLElement | null>>([]);
  const journeyProgrammaticTargetRef = React.useRef<JourneyShowcaseKey | null>(null);
  const journeyProgrammaticDeadlineRef = React.useRef(0);
  const lastJourneyPageScrollTopRef = React.useRef(0);
  const journeyStageRef = React.useRef<HTMLDivElement | null>(null);
  const selectedOutboundFlight = outboundFlightOptions[outboundIndex] ?? outboundFlightOptions[0];
  const selectedHotel = hotelOptions[hotelIndex] ?? hotelOptions[0];
  const selectedReturnFlight = returnFlightOptions[returnIndex] ?? returnFlightOptions[0];
  const totalTripPrice = Math.round(
    parseDisplayAmount(selectedOutboundFlight.price) +
      parseDisplayAmount(selectedHotel.total) +
      parseDisplayAmount(selectedReturnFlight.price)
  ).toLocaleString("en-US");

  useMountEffect(() => {
    if (journeyOnly || shouldRenderJourneyShowcase || typeof window === "undefined") {
      return;
    }

    const immediateHash = window.location.hash.startsWith("#journey-screen");
    if (immediateHash) {
      startTransition(() => {
        setShouldRenderJourneyShowcase(true);
      });
      return;
    }

    const activateJourneyShowcase = () => {
      startTransition(() => {
        setShouldRenderJourneyShowcase(true);
      });
    };

    const idleTimeoutMs = window.innerWidth < 740 ? 1400 : 900;
    const cancelIdle = scheduleIdleJourneyRender(activateJourneyShowcase, idleTimeoutMs);
    const stageNode = journeyStageRef.current;

    if (!stageNode) {
      return cancelIdle;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          cancelIdle();
          activateJourneyShowcase();
        }
      },
      { rootMargin: "180px 0px" }
    );

    observer.observe(stageNode);

    return () => {
      observer.disconnect();
      cancelIdle();
    };
  });

  useMountEffect(() => {
    let frameId = 0;
    const scrollElement = getPageScrollElement();
    const observedScrollTargets = new Set<EventTarget>([window]);

    // Different browsers and layouts dispatch page-scroll updates on different
    // roots. The home page currently scrolls through `body` on web, so only
    // listening to `window` can leave the journey preview frozen.
    if (scrollElement && scrollElement !== document.documentElement && scrollElement !== document.body) {
      observedScrollTargets.add(scrollElement);
    }

    const syncActiveJourneyScreen = () => {
      const sourceRefs =
        window.innerWidth >= 980
          ? desktopJourneyNarrativeRefs.current
          : mobileJourneyNarrativeRefs.current;
      const narrativeSections = sourceRefs.filter((item): item is HTMLElement => Boolean(item));

      if (narrativeSections.length === 0) {
        return;
      }

      const currentPageScrollTop = getPageScrollTop();
      const isScrollingUp = currentPageScrollTop < lastJourneyPageScrollTopRef.current;
      lastJourneyPageScrollTopRef.current = currentPageScrollTop;
      const viewportHeight = window.innerHeight;
      const chapterTriggerLine = viewportHeight * 0.46;

      const nextScreenIndex = getJourneySectionIndexAtTrigger(
        narrativeSections,
        chapterTriggerLine,
        isScrollingUp
      );
      const activeNarrativeSection = narrativeSections[nextScreenIndex];
      const nextKey = activeNarrativeSection?.getAttribute("data-journey-screen");
      const now = window.performance.now();
      const pendingTarget = journeyProgrammaticTargetRef.current;
      const pendingTargetActive = (
        pendingTarget !== null &&
        now < journeyProgrammaticDeadlineRef.current
      );

      if (isJourneyShowcaseKey(nextKey)) {
        if (pendingTargetActive) {
          if (nextKey === pendingTarget) {
            journeyProgrammaticTargetRef.current = null;
            journeyProgrammaticDeadlineRef.current = 0;
            setActiveJourneyScreen(nextKey);
          } else {
            setActiveJourneyScreen(pendingTarget);
          }
        } else {
          if (pendingTarget !== null) {
            journeyProgrammaticTargetRef.current = null;
            journeyProgrammaticDeadlineRef.current = 0;
          }
          setActiveJourneyScreen(nextKey);
        }

        const nextProgress = activeNarrativeSection
          ? getJourneySectionProgress(
              activeNarrativeSection,
              viewportHeight,
              chapterTriggerLine
            )
          : 0;

        setJourneyPreviewMotion((current) => {
          if (current.screen === nextKey && Math.abs(current.progress - nextProgress) < 0.001) {
            return current;
          }

          return {
            screen: nextKey,
            progress: nextProgress,
          };
        });
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncActiveJourneyScreen);
    };

    syncActiveJourneyScreen();
    window.addEventListener("resize", handleScroll);
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    observedScrollTargets.forEach((target) => {
      target.addEventListener("scroll", handleScroll, { passive: true });
    });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleScroll);
      document.removeEventListener("scroll", handleScroll, true);
      observedScrollTargets.forEach((target) => {
        target.removeEventListener("scroll", handleScroll);
      });
    };
  });

  const scrollToJourneyScreen = (
    event: React.MouseEvent<HTMLAnchorElement>,
    index: number,
    key: JourneyShowcaseKey
  ) => {
    event.preventDefault();

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 980;
    const sourceRefs = isDesktop
      ? desktopJourneyNarrativeRefs.current
      : mobileJourneyNarrativeRefs.current;
    const targetId = isDesktop ? `journey-screen-${key}` : `journey-screen-mobile-${key}`;
    const target =
      sourceRefs[index] ??
      document.getElementById(targetId) ??
      document.querySelector<HTMLElement>(`[data-journey-screen="${key}"]`);

    if (!target || typeof window === "undefined") {
      return;
    }

    journeyProgrammaticTargetRef.current = key;
    journeyProgrammaticDeadlineRef.current = window.performance.now() + 1400;
    setActiveJourneyScreen(key);
    const currentTop = getPageScrollTop();
    const targetTop = target.getBoundingClientRect().top + currentTop - 96;

    if (window.location.hash !== `#${targetId}`) {
      window.history.replaceState(null, "", `#${targetId}`);
    }

    window.requestAnimationFrame(() => {
      scrollPageTo(targetTop, "smooth");
      window.setTimeout(() => {
        scrollPageTo(targetTop, "auto");
      }, 520);
    });
  };

  const journeyPhoneStackProps = {
    activeScreen: activeJourneyScreen,
    previewProgress:
      journeyPreviewMotion.screen === activeJourneyScreen ? journeyPreviewMotion.progress : 0,
    outboundIndex,
    hotelIndex,
    returnIndex,
    onPrevOutbound: () => setOutboundIndex((value) => Math.max(0, value - 1)),
    onNextOutbound: () =>
      setOutboundIndex((value) => Math.min(outboundFlightOptions.length - 1, value + 1)),
    onPrevHotel: () => setHotelIndex((value) => Math.max(0, value - 1)),
    onNextHotel: () =>
      setHotelIndex((value) => Math.min(hotelOptions.length - 1, value + 1)),
    onPrevReturn: () => setReturnIndex((value) => Math.max(0, value - 1)),
    onNextReturn: () =>
      setReturnIndex((value) => Math.min(returnFlightOptions.length - 1, value + 1)),
    selectedOutboundFlight,
    selectedHotel,
    selectedReturnFlight,
    totalTripPrice,
  };

  const journeySection = (
    <OutlineStage ref={journeyStageRef}>
      <JourneySectionHeader>
        <JourneySectionEyebrow>{localizedContent.journeyEyebrow}</JourneySectionEyebrow>
        <JourneySectionTitle>{localizedContent.journeyTitle}</JourneySectionTitle>
      </JourneySectionHeader>
      {shouldRenderJourneyShowcase ? (
        <>
          <JourneyShowcaseLayout>
            <JourneyChapterRail>
              {journeyShowcaseItems.map((item, index) => (
                <JourneyChapterPill
                  key={item.key}
                  href={`#journey-screen-${item.key}`}
                  $active={activeJourneyScreen === item.key}
                  aria-pressed={activeJourneyScreen === item.key}
                  onClick={(event) => scrollToJourneyScreen(event, index, item.key)}
                >
                  {item.chapter}
                </JourneyChapterPill>
              ))}
            </JourneyChapterRail>

            <JourneyNarrativeColumn>
              <DesktopJourneyNarrativeStage aria-hidden="true">
                {journeyShowcaseItems.map((item) => (
                  <DesktopJourneyNarrativeLayer
                    key={item.key}
                    $active={activeJourneyScreen === item.key}
                  >
                    <JourneyNarrativeTitle>{item.title}</JourneyNarrativeTitle>
                    <JourneyNarrativeMeta>{item.meta}</JourneyNarrativeMeta>
                  </DesktopJourneyNarrativeLayer>
                ))}
              </DesktopJourneyNarrativeStage>
              {journeyShowcaseItems.map((item, index) => (
                <JourneyNarrativeItem
                  key={item.key}
                  id={`journey-screen-${item.key}`}
                  ref={(element) => {
                    desktopJourneyNarrativeRefs.current[index] = element;
                  }}
                  data-journey-screen={item.key}
                  $active={activeJourneyScreen === item.key}
                  $desktopMinHeight={item.desktopScrollSpan}
                >
                  <JourneyNarrativeText>
                    <JourneyNarrativeTitle>{item.title}</JourneyNarrativeTitle>
                    <JourneyNarrativeMeta>{item.meta}</JourneyNarrativeMeta>
                  </JourneyNarrativeText>
                  <JourneyNarrativeTrigger aria-hidden="true" />
                </JourneyNarrativeItem>
              ))}
            </JourneyNarrativeColumn>

            <ReviewPhoneRail>
              <ReviewPhoneStage>
                <JourneyShowcasePhoneStack {...journeyPhoneStackProps} />
              </ReviewPhoneStage>
            </ReviewPhoneRail>
          </JourneyShowcaseLayout>
          <MobileJourneyShowcaseLayout>
            <JourneyNarrativeColumn>
              <MobileJourneyInlineRail>
                {journeyShowcaseItems.map((item, index) => (
                  <JourneyChapterPill
                    key={item.key}
                    href={`#journey-screen-mobile-${item.key}`}
                    $active={activeJourneyScreen === item.key}
                    aria-pressed={activeJourneyScreen === item.key}
                    onClick={(event) => scrollToJourneyScreen(event, index, item.key)}
                  >
                    {item.chapter}
                  </JourneyChapterPill>
                ))}
              </MobileJourneyInlineRail>
              {journeyShowcaseItems.map((item, index) => (
                <JourneyNarrativeItem
                  key={item.key}
                  id={`journey-screen-mobile-${item.key}`}
                  ref={(element) => {
                    mobileJourneyNarrativeRefs.current[index] = element;
                  }}
                  data-journey-screen={item.key}
                  $active={activeJourneyScreen === item.key}
                  $mobileMinHeight={item.mobileScrollSpan}
                >
                  <JourneyNarrativeText>
                    <JourneyNarrativeTitle>{item.title}</JourneyNarrativeTitle>
                    <JourneyNarrativeMeta>{item.meta}</JourneyNarrativeMeta>
                  </JourneyNarrativeText>
                  <MobileJourneyInlinePhoneWrap>
                    {renderJourneyShowcasePhone(item.key, {
                      outboundIndex,
                      hotelIndex,
                      returnIndex,
                      onPrevOutbound: () => setOutboundIndex((value) => Math.max(0, value - 1)),
                      onNextOutbound: () =>
                        setOutboundIndex((value) =>
                          Math.min(outboundFlightOptions.length - 1, value + 1)
                        ),
                      onPrevHotel: () => setHotelIndex((value) => Math.max(0, value - 1)),
                      onNextHotel: () =>
                        setHotelIndex((value) => Math.min(hotelOptions.length - 1, value + 1)),
                      onPrevReturn: () => setReturnIndex((value) => Math.max(0, value - 1)),
                      onNextReturn: () =>
                        setReturnIndex((value) =>
                          Math.min(returnFlightOptions.length - 1, value + 1)
                        ),
                      selectedOutboundFlight,
                      selectedHotel,
                      selectedReturnFlight,
                      totalTripPrice,
                    })}
                  </MobileJourneyInlinePhoneWrap>
                  <JourneyNarrativeTrigger aria-hidden="true" />
                </JourneyNarrativeItem>
              ))}
            </JourneyNarrativeColumn>
          </MobileJourneyShowcaseLayout>
        </>
      ) : (
        <JourneyPlaceholder aria-hidden="true">
          <JourneyPlaceholderGlow />
        </JourneyPlaceholder>
      )}
    </OutlineStage>
  );

  if (journeyOnly) {
    return journeySection;
  }

  return (
    <HeroSection>
      <Frame>
        <CopyScrim aria-hidden="true" />
        <HeroGrid>
          <CopyColumn>
            <RailStatement>
              <span>{localizedContent.railPrefix}</span>
              <RailStatementAccent>{localizedContent.railAccent}</RailStatementAccent>
            </RailStatement>
            <TopRail>
              <MarqueeStack aria-hidden="true">
                <MarqueeViewport>
                  <MarqueeTrack>
                    <MarqueeGroup>
                      {localizedContent.featureMarqueeItems.map((item) => (
                        <MarqueeItem key={`feature-first-${item}`}>{item}</MarqueeItem>
                      ))}
                    </MarqueeGroup>
                    <MarqueeGroup>
                      {localizedContent.featureMarqueeItems.map((item) => (
                        <MarqueeItem key={`feature-second-${item}`}>{item}</MarqueeItem>
                      ))}
                    </MarqueeGroup>
                    <MarqueeGroup>
                      {localizedContent.featureMarqueeItems.map((item) => (
                        <MarqueeItem key={`feature-third-${item}`}>{item}</MarqueeItem>
                      ))}
                    </MarqueeGroup>
                  </MarqueeTrack>
                </MarqueeViewport>
                <MarqueeViewport>
                  <MarqueeTrack $reverse>
                    <MarqueeGroup>
                      {localizedContent.promptMarqueeItems.map((item) => (
                        <MarqueeItem key={`prompt-first-${item}`}>{item}</MarqueeItem>
                      ))}
                    </MarqueeGroup>
                    <MarqueeGroup>
                      {localizedContent.promptMarqueeItems.map((item) => (
                        <MarqueeItem key={`prompt-second-${item}`}>{item}</MarqueeItem>
                      ))}
                    </MarqueeGroup>
                    <MarqueeGroup>
                      {localizedContent.promptMarqueeItems.map((item) => (
                        <MarqueeItem key={`prompt-third-${item}`}>{item}</MarqueeItem>
                      ))}
                    </MarqueeGroup>
                  </MarqueeTrack>
                </MarqueeViewport>
              </MarqueeStack>
            </TopRail>
            <Headline>
              <HeadlineLine>{localizedContent.headlineLine1}</HeadlineLine>
              <HeadlineLine>
                {localizedContent.headlineLine2Prefix}
                <HeadlineAccent>{localizedContent.headlineLine2Accent}</HeadlineAccent>
              </HeadlineLine>
              <HeadlineLine>
                <HeadlineAccent>{localizedContent.headlineLine3Accent}</HeadlineAccent>
              </HeadlineLine>
            </Headline>
            <SupportingCopy>{localizedContent.supportingCopy}</SupportingCopy>
            <ActionSlot>{waitlistSlot}</ActionSlot>
          </CopyColumn>
        </HeroGrid>
      </Frame>
      {journeySection}
    </HeroSection>
  );
};

export default Hero;
