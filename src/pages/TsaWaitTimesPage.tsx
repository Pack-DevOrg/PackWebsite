import React, { useDeferredValue, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import {
  ArrowUpRight,
  ChevronDown,
  X,
  MapPinned,
  Search,
} from "lucide-react";
import type { AirportWaitTimeObservation } from "@/schemas/airport-security";
import { fetchPublicAirportSecuritySummary } from "@/api/airportSecurity";
import { useApiClient } from "@/api/useApiClient";
import { useAuth } from "@/auth/AuthContext";
import { appConfig } from "@/config/appConfig";
import WaitlistForm from "@/components/WaitlistForm";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { useMountEffect } from "@/hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";
import { getAcceptanceNoticeLegalCopy } from "@/legal/legalUiCopy";
import { formatLocalizedDate } from "@/i18n/format";
import { deleteCookie, getCookie, setCookie } from "@/utils/cookies";

// Bridge current live board data until the backend rollout consistently
// includes countryName in the public payload.
const AIRPORT_SEARCH_ALIASES: Record<string, readonly string[]> = {
  CDG: ["france", "french republic"],
  ORY: ["france", "french republic"],
};

const AIRPORT_SEARCH_ALIAS_RANK: Record<string, number> = {
  CDG: 2,
  ORY: 1,
};

const WAITLIST_MODAL_FORCE_QUERY_KEY = "forceModal";

const normalizeAirportSearchText = (value: string | undefined): string =>
  (value ?? "").trim().toLowerCase();

const Page = styled.section`
  display: grid;
  gap: var(--space-5);
  padding: var(--space-3);
`;

const LlmNotice = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const Panel = styled.section`
  border-radius: 1.5rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background: rgba(255, 248, 236, 0.04);
  padding: clamp(1rem, 3vw, 1.4rem);
`;

const SearchWrap = styled.section`
  display: grid;
  gap: 1rem;
`;

const SearchFieldWrap = styled.div`
  position: relative;
`;

const ControlGrid = styled.div`
  display: grid;
  gap: 0.9rem;

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
  }
`;

const SearchBar = styled.label`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.05);
  padding: 0.9rem 1rem;
  color: rgba(247, 240, 227, 0.7);
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fff7e7;
  font-size: 1rem;

  &::placeholder {
    color: rgba(247, 240, 227, 0.4);
  }
`;

const ClearSearchButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.08);
  color: rgba(247, 240, 227, 0.74);
  cursor: pointer;

  &:hover {
    background: rgba(255, 248, 236, 0.14);
    color: #fff7e7;
  }
`;

const SearchSuggestions = styled.div`
  position: absolute;
  top: calc(100% + 0.55rem);
  left: 0;
  right: 0;
  z-index: 8;
  display: grid;
  gap: 0.35rem;
  border: 1px solid rgba(243, 210, 122, 0.14);
  border-radius: 1.1rem;
  background:
    linear-gradient(180deg, rgba(24, 18, 13, 0.98), rgba(16, 12, 9, 0.98)),
    rgba(17, 13, 10, 0.96);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.34);
  padding: 0.45rem;
`;

const SearchSuggestionButton = styled.button`
  display: grid;
  gap: 0.15rem;
  width: 100%;
  border: 0;
  border-radius: 0.85rem;
  background: transparent;
  color: #fff7e7;
  text-align: left;
  padding: 0.8rem 0.9rem;
  cursor: pointer;

  &:hover {
    background: rgba(255, 248, 236, 0.06);
  }
`;

const SearchSuggestionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 700;
`;

const SearchSuggestionCode = styled.span`
  color: #f3d27a;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const SearchSuggestionMeta = styled.div`
  color: rgba(247, 240, 227, 0.62);
  font-size: 0.9rem;
`;

const UtilityButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border-radius: 1rem;
  border: 1px solid rgba(243, 210, 122, 0.28);
  background: linear-gradient(135deg, #f3d27a 0%, #eab54d 100%);
  color: #100d0b;
  font-weight: 800;
  padding: 0.92rem 1rem;
  cursor: pointer;
  box-shadow: 0 18px 40px rgba(243, 210, 122, 0.18);
`;

const UtilityNote = styled.div`
  color: rgba(247, 240, 227, 0.62);
  font-size: 0.9rem;
`;

const AirportGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const ResultsMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  color: rgba(247, 240, 227, 0.64);
  font-size: 0.92rem;
`;

const ResultsMetaStrong = styled.span`
  color: #fff7e7;
  font-weight: 700;
`;

const AirportCard = styled.article`
  display: grid;
  gap: 1rem;
  border-radius: 1.45rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(17, 13, 10, 0.88);
  padding: 1.15rem;
`;

const AirportCardTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
`;

const AirportHeading = styled.div`
  display: grid;
  gap: 0.3rem;
`;

const AirportCode = styled.div`
  color: #f3d27a;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const AirportName = styled.h3`
  margin: 0;
  color: #fff7e7;
  font-size: 1.15rem;
`;

const AirportMeta = styled.div`
  color: rgba(247, 240, 227, 0.64);
  font-size: 0.92rem;
`;

const AirportMetaLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
`;

const DistancePill = styled.span`
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.14);
  background: rgba(243, 210, 122, 0.08);
  color: #fff0be;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
`;

const ObservationGroup = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const TerminalBlock = styled.section<{ $highlighted?: boolean }>`
  border-radius: 1.1rem;
  background: ${({ $highlighted }) =>
    $highlighted
      ? "linear-gradient(180deg, rgba(243, 210, 122, 0.12), rgba(255, 248, 236, 0.05))"
      : "rgba(255, 248, 236, 0.04)"};
  border: 1px solid
    ${({ $highlighted }) =>
      $highlighted ? "rgba(243, 210, 122, 0.24)" : "rgba(243, 210, 122, 0.08)"};
  box-shadow: ${({ $highlighted }) =>
    $highlighted ? "0 0 0 1px rgba(243, 210, 122, 0.12)" : "none"};
  padding: 0.9rem;
`;

const TerminalTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 0.8rem;
  color: #fff7e7;
  font-size: 0.95rem;
`;

const WaitRow = styled.div`
  display: grid;
  gap: 0.75rem;
  align-items: start;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(243, 210, 122, 0.08);

  @media (min-width: 640px) {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  &:first-of-type {
    border-top: 0;
    padding-top: 0;
  }
`;

const WaitLabel = styled.div`
  display: grid;
  gap: 0.22rem;
`;

const WaitLocation = styled.div`
  color: #fff7e7;
  font-weight: 700;
`;

const WaitProgram = styled.div`
  color: rgba(247, 240, 227, 0.56);
  font-size: 0.82rem;
  text-transform: capitalize;
`;

const WaitBadge = styled.div<{ $tone: "open" | "closed" | "unknown" | "unavailable" | "guidance" }>`
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
  background: ${({ $tone }) => {
    if ($tone === "guidance") {
      return "rgba(249, 115, 22, 0.16)";
    }

    if ($tone === "closed") {
      return "rgba(239, 68, 68, 0.14)";
    }

    if ($tone === "unknown" || $tone === "unavailable") {
      return "rgba(148, 163, 184, 0.14)";
    }

    return "rgba(243, 210, 122, 0.14)";
  }};
  color: ${({ $tone }) => {
    if ($tone === "guidance") {
      return "#ffd7b0";
    }

    if ($tone === "closed") {
      return "#ffd5d5";
    }

    if ($tone === "unknown" || $tone === "unavailable") {
      return "#e2e8f0";
    }

    return "#fff4cc";
  }};
  border: 1px solid
    ${({ $tone }) => {
      if ($tone === "guidance") {
        return "rgba(249, 115, 22, 0.3)";
      }

      if ($tone === "closed") {
        return "rgba(239, 68, 68, 0.22)";
      }

      if ($tone === "unknown" || $tone === "unavailable") {
        return "rgba(148, 163, 184, 0.24)";
      }

      return "rgba(243, 210, 122, 0.22)";
    }};
  font-weight: 800;
  font-size: 0.82rem;
`;

const WaitBadgeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  justify-content: flex-start;

  @media (min-width: 640px) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
`;

const WaitBadgeLabel = styled.span`
  display: inline-block;
  margin-right: 0.35rem;
  color: rgba(247, 240, 227, 0.58);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

const SourceMetaWrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

const SourcePill = styled.span<{ $tone: "official" | "predicted" | "other" }>`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.28rem 0.58rem;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "official"
        ? "rgba(74, 222, 128, 0.24)"
        : $tone === "predicted"
          ? "rgba(249, 115, 22, 0.28)"
          : "rgba(243, 210, 122, 0.16)"};
  background:
    ${({ $tone }) =>
      $tone === "official"
        ? "rgba(74, 222, 128, 0.12)"
        : $tone === "predicted"
          ? "rgba(249, 115, 22, 0.14)"
          : "rgba(243, 210, 122, 0.08)"};
  color:
    ${({ $tone }) =>
      $tone === "official"
        ? "#d6ffe2"
        : $tone === "predicted"
          ? "#ffd7b0"
          : "#fff0be"};
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: help;
`;

const SourceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  color: rgba(247, 240, 227, 0.58);
  font-size: 0.82rem;
`;

const SupportLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: rgba(247, 240, 227, 0.58);
  text-decoration: none;

  &:hover {
    color: rgba(247, 240, 227, 0.82);
  }
`;

const PaginationWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  padding-top: 0.25rem;
`;

const PaginationButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 7.5rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.16);
  background: rgba(255, 248, 236, 0.05);
  color: #fff7e7;
  font-weight: 700;
  padding: 0.8rem 1rem;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.42;
  }
`;

const PaginationInfo = styled.div`
  color: rgba(247, 240, 227, 0.62);
  font-size: 0.9rem;
  text-align: center;
`;

const EmptyState = styled.div`
  border-radius: 1.35rem;
  border: 1px dashed rgba(243, 210, 122, 0.18);
  background: rgba(255, 248, 236, 0.03);
  padding: 1.4rem;
  color: rgba(247, 240, 227, 0.72);
  line-height: 1.6;
`;

const FaqList = styled.div`
  display: grid;
  gap: 1rem;
`;

const FaqItem = styled.div`
  border-radius: 1.3rem;
  border: 1px solid rgba(243, 210, 122, 0.14);
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.08), transparent 36%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.05), rgba(255, 248, 236, 0.03));
  box-shadow: inset 0 1px 0 rgba(255, 248, 236, 0.04);
  overflow: hidden;
`;

const FaqQuestion = styled.button`
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff7e7;
  text-align: left;
  padding: 1.15rem 1.2rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  cursor: pointer;
`;

const FaqQuestionMeta = styled.div`
  display: grid;
  gap: 0.32rem;
`;

const FaqEyebrow = styled.div`
  color: rgba(243, 210, 122, 0.72);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const FaqQuestionText = styled.div`
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.35;
`;

const FaqChevron = styled.div<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.14);
  background: rgba(255, 248, 236, 0.04);
  color: #f3d27a;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
  transition: transform 140ms ease;
`;

const FaqAnswer = styled.div`
  padding: 0 1.2rem 1.2rem;
  color: rgba(247, 240, 227, 0.72);
  line-height: 1.7;
  font-size: 0.98rem;
  border-top: 1px solid rgba(243, 210, 122, 0.08);
`;

const FaqLead = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-bottom: 1.1rem;
`;

const FaqLeadEyebrow = styled.div`
  color: rgba(243, 210, 122, 0.72);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const FaqLeadTitle = styled.h2`
  margin: 0;
  color: #fff7e7;
  font-size: clamp(1.4rem, 3vw, 2rem);
  letter-spacing: -0.03em;
`;

const FaqLeadText = styled.p`
  margin: 0;
  max-width: 44rem;
  color: rgba(247, 240, 227, 0.68);
  line-height: 1.65;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  justify-content: center;
  align-content: center;
  justify-items: center;
  align-items: center;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.5rem;
  background: rgba(7, 5, 4, 0.74);
  backdrop-filter: blur(12px);

  @media (min-width: 640px) {
    padding: clamp(0.55rem, 2vw, 2rem);
  }
`;

const Modal = styled.div`
  width: min(calc(100vw - 1rem), 840px);
  position: relative;
  max-height: calc(100dvh - 1rem);
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  border-radius: 1.35rem;
  border: 1px solid rgba(243, 210, 122, 0.16);
  background:
    radial-gradient(circle at top left, rgba(231, 35, 64, 0.14), transparent 26%),
    linear-gradient(180deg, rgba(18, 14, 10, 0.98), rgba(12, 9, 7, 0.98));
  box-shadow: 0 32px 100px rgba(0, 0, 0, 0.42);
  padding: 0.9rem;

  @media (min-width: 640px) {
    max-height: calc(100dvh - clamp(1.1rem, 4vw, 4rem));
    border-radius: 1.6rem;
    padding: 1.2rem;
  }
`;

const ModalHeader = styled.div`
  display: grid;
  gap: 0.45rem;
  padding: 0.8rem 0.9rem 0.9rem;
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(231, 35, 64, 0.16), transparent 34%),
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.16), transparent 38%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.02));
  border: 1px solid rgba(243, 210, 122, 0.12);

  @media (min-width: 640px) {
    padding: 1.15rem 1.25rem 1.25rem;
  }
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #fff7e7;
  font-size: clamp(1.75rem, 4vw, 2.35rem);
  line-height: 1.04;
  letter-spacing: -0.04em;
  padding-bottom: 0.08em;
`;

const ModalText = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.72);
  font-size: 0.96rem;
  line-height: 1.5;

  @media (min-width: 640px) {
    font-size: 1rem;
    line-height: 1.6;
  }
`;

const ModalActions = styled.div`
  display: grid;
  gap: 0.65rem;
  padding: 0.45rem 0 0.05rem;
  justify-items: center;
`;

const ModalDivider = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  gap: 0.9rem;
  margin: 0.45rem 0 0.35rem;
  color: rgba(247, 240, 227, 0.4);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  &::before,
  &::after {
    content: "";
    height: 1px;
    background: rgba(247, 240, 227, 0.16);
  }
`;

const GoogleLoginButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: min(100%, 360px);
  margin-top: 0.2rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #131314;
  color: #e3e3e3;
  font-weight: 800;
  padding: 0.85rem 1rem;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
  font-family:
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
  font-size: 0.875rem;
  line-height: 1.25rem;
  letter-spacing: 0.01em;
  text-align: center;

  &:hover:not(:disabled) {
    background: #1e1f20;
  }

  &:disabled {
    cursor: default;
    opacity: 0.65;
  }
`;

const GoogleLogoWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
`;

const ModalLegalNote = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.62);
  font-size: 0.92rem;
  line-height: 1.6;
  text-align: center;

  a {
    color: rgba(255, 244, 214, 0.88);
  }
`;

const BrandWord = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #fff0be 0%, #f3d27a 42%, #e72340 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ModalFooter = styled.div`
  display: grid;
  gap: 0.7rem;
  justify-items: center;
  padding: 0.6rem 0.35rem 0.1rem;
`;

const ModalDismissButton = styled.button`
  border: 0;
  background: transparent;
  color: rgba(247, 240, 227, 0.46);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 120ms ease;

  &:hover {
    color: rgba(247, 240, 227, 0.74);
  }
`;

const GoogleMark: React.FC = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2582h2.9086c1.7018-1.5668 2.6837-3.8741 2.6837-6.6155Z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1791l-2.9086-2.2582c-.8059.54-1.8368.8591-3.0478.8591-2.3441 0-4.3282-1.5823-5.0364-3.7091H.9568v2.3318A8.9997 8.9997 0 0 0 9 18Z"
    />
    <path
      fill="#FBBC05"
      d="M3.9636 10.7127A5.4108 5.4108 0 0 1 3.6818 9c0-.5945.1023-1.1727.2818-1.7127V4.9555H.9568A8.9996 8.9996 0 0 0 0 9c0 1.4518.3477 2.8268.9568 4.0445l3.0068-2.3318Z"
    />
    <path
      fill="#EA4335"
      d="M9 3.5782c1.3214 0 2.5077.4541 3.4405 1.3459l2.5814-2.5814C13.4632.8918 11.426 0 9 0A8.9997 8.9997 0 0 0 .9568 4.9555l3.0068 2.3318C4.6718 5.1605 6.6559 3.5782 9 3.5782Z"
    />
  </svg>
);

const formatTimestamp = (value: string | undefined): string => {
  if (!value) {
    return "Awaiting the next refresh";
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return "Awaiting the next refresh";
  }

  return formatLocalizedDate(new Date(timestamp), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const buildAirportSupportMailtoHref = (params: {
  airportCode: string;
  airportName: string;
  boardGeneratedAt?: string;
  pageUrl?: string;
  snapshot?: {
    fetchStatus?: string;
    observedAt?: string;
    fetchedAt?: string;
    refreshIntervalMinutes?: number;
    exactWaitMinutes?: number;
    minWaitMinutes?: number;
    maxWaitMinutes?: number;
    observations?: AirportWaitTimeObservation[];
  } | null;
}): string => {
  const { airportCode, airportName, boardGeneratedAt, pageUrl, snapshot } = params;
  const subject = `TSA wait board issue: ${airportCode}`;
  const bodyLines = [
    `Hi Pack,`,
    ``,
    `Something looks wrong with the TSA wait board entry for ${airportCode} (${airportName}).`,
    ``,
    `What looks wrong:`,
    ``,
    `Debug footer:`,
    `airportCode=${airportCode}`,
    `airportName=${airportName}`,
    `boardGeneratedAt=${boardGeneratedAt ?? "unknown"}`,
    `snapshotFetchStatus=${snapshot?.fetchStatus ?? "unknown"}`,
    `snapshotObservedAt=${snapshot?.observedAt ?? "unknown"}`,
    `snapshotFetchedAt=${snapshot?.fetchedAt ?? "unknown"}`,
    `snapshotRefreshIntervalMinutes=${String(snapshot?.refreshIntervalMinutes ?? "unknown")}`,
    `snapshotExactWaitMinutes=${String(snapshot?.exactWaitMinutes ?? "unknown")}`,
    `snapshotMinWaitMinutes=${String(snapshot?.minWaitMinutes ?? "unknown")}`,
    `snapshotMaxWaitMinutes=${String(snapshot?.maxWaitMinutes ?? "unknown")}`,
    `snapshotObservationCount=${String(snapshot?.observations?.length ?? 0)}`,
    `pageUrl=${pageUrl ?? "unknown"}`,
  ];

  return `mailto:support@itsdoneai.com?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
};

const getObservationTerminalLabel = (observation: AirportWaitTimeObservation): string =>
  observation.terminalDisplayName ??
  observation.terminalKey ??
  "Airport-wide";

const getObservationProgramLabel = (observation: AirportWaitTimeObservation): string => {
  if (observation.screeningProgram === "unknown") {
    return observation.laneStatus === "closed" ? "Closed lane" : "Security";
  }

  if (observation.screeningProgram === "tsa_precheck") {
    return "TSA PreCheck";
  }

  if (observation.screeningProgram === "expedited_reservation") {
    return "Reserved lane";
  }

  return observation.screeningProgram.replace(/_/g, " ");
};

const getWaitLabel = (
  observation: AirportWaitTimeObservation,
  fetchStatus?: string
): string => {
  const state = getObservationWaitState(observation, fetchStatus);

  if (state === "closed") {
    return observation.displayWaitText?.trim() || "Closed";
  }

  if (state === "unavailable") {
    return observation.displayWaitText?.trim() || "Unavailable";
  }

  const hasNumericWait =
    typeof observation.exactWaitMinutes === "number" ||
    typeof observation.minWaitMinutes === "number" ||
    typeof observation.maxWaitMinutes === "number";

  if (observation.displayWaitText) {
    return observation.displayWaitText;
  }

  if (typeof observation.exactWaitMinutes === "number") {
    return `${observation.exactWaitMinutes} min`;
  }

  if (
    typeof observation.minWaitMinutes === "number" &&
    typeof observation.maxWaitMinutes === "number"
  ) {
    return `${observation.minWaitMinutes}-${observation.maxWaitMinutes} min`;
  }

  return "Unknown";
};

const getObservationWaitState = (
  observation: AirportWaitTimeObservation,
  fetchStatus?: string
): "open" | "closed" | "unknown" | "unavailable" | "guidance" => {
  if (fetchStatus === "guidance_only") {
    return "guidance";
  }

  const normalizedDisplayWaitText = observation.displayWaitText?.trim().toLowerCase() ?? "";
  const hasNumericWait =
    typeof observation.exactWaitMinutes === "number" ||
    typeof observation.minWaitMinutes === "number" ||
    typeof observation.maxWaitMinutes === "number";

  if (
    normalizedDisplayWaitText === "closed" ||
    normalizedDisplayWaitText === "closure" ||
    normalizedDisplayWaitText === "temporarily closed"
  ) {
    return "closed";
  }

  if (
    normalizedDisplayWaitText === "unavailable" ||
    normalizedDisplayWaitText === "not available" ||
    normalizedDisplayWaitText === "not currently available" ||
    normalizedDisplayWaitText === "-"
  ) {
    return "unavailable";
  }

  if (hasNumericWait || normalizedDisplayWaitText.length > 0) {
    return observation.laneStatus === "closed" ? "closed" : "open";
  }

  if (observation.laneStatus === "closed") {
    return "closed";
  }

  if (observation.laneStatus === "unavailable") {
    return "unavailable";
  }

  return "unknown";
};

type WaitRowGroup = {
  locationLabel: string;
  items: AirportWaitTimeObservation[];
};

type TerminalObservationGroup = {
  terminalLabel: string;
  items: WaitRowGroup[];
};

const groupObservationsByTerminal = (
  observations: AirportWaitTimeObservation[]
): TerminalObservationGroup[] => {
  const buckets = new Map<string, AirportWaitTimeObservation[]>();

  observations.forEach((observation) => {
    const key = getObservationTerminalLabel(observation);
    const existing = buckets.get(key) ?? [];
    existing.push(observation);
    buckets.set(key, existing);
  });

  return Array.from(buckets.entries()).map(([terminalLabel, items]) => {
    const rowGroups = new Map<string, AirportWaitTimeObservation[]>();

    items.forEach((observation) => {
      const rowKey =
        observation.checkpointDisplayName ??
        observation.checkpointKey ??
        observation.locationDisplayName;
      const existing = rowGroups.get(rowKey) ?? [];
      existing.push(observation);
      rowGroups.set(rowKey, existing);
    });

    return {
      terminalLabel,
      items: Array.from(rowGroups.entries()).map(([locationLabel, rowItems]) => ({
        locationLabel,
        items: rowItems.sort((left, right) => {
          const priority = (program: AirportWaitTimeObservation["screeningProgram"]): number => {
            if (program === "general") {
              return 0;
            }
            if (program === "tsa_precheck") {
              return 1;
            }
            if (program === "clear") {
              return 2;
            }
            if (program === "priority") {
              return 3;
            }
            if (program === "expedited_reservation") {
              return 4;
            }
            return 5;
          };

          return priority(left.screeningProgram) - priority(right.screeningProgram);
        }),
      })),
    };
  });
};

const getAirportSortWaitMinutes = (airport: {
  snapshot: {
    fetchStatus?: string;
    observations?: AirportWaitTimeObservation[];
    exactWaitMinutes?: number;
    minWaitMinutes?: number;
    maxWaitMinutes?: number;
  } | null;
}): number => {
  if (airport.snapshot?.fetchStatus !== "available") {
    return -1;
  }

  const observationWaits = (airport.snapshot?.observations ?? []).flatMap((observation) => {
    const waitValue =
      observation.exactWaitMinutes ??
      observation.maxWaitMinutes ??
      observation.minWaitMinutes;
    return typeof waitValue === "number" ? [waitValue] : [];
  });

  const snapshotWait =
    airport.snapshot?.exactWaitMinutes ??
    airport.snapshot?.maxWaitMinutes ??
    airport.snapshot?.minWaitMinutes;

  if (typeof snapshotWait === "number") {
    observationWaits.push(snapshotWait);
  }

  return observationWaits.length > 0 ? Math.max(...observationWaits) : -1;
};

const hasLivePulledWaits = (airport: {
  snapshot: {
    fetchStatus?: string;
    observations?: AirportWaitTimeObservation[];
    exactWaitMinutes?: number;
    minWaitMinutes?: number;
    maxWaitMinutes?: number;
  } | null;
}): boolean =>
  airport.snapshot?.fetchStatus === "available" &&
  ((airport.snapshot.observations ?? []).some((observation) => {
    const state = getObservationWaitState(observation, airport.snapshot?.fetchStatus);
    const hasNumericWait =
      typeof observation.exactWaitMinutes === "number" ||
      typeof observation.minWaitMinutes === "number" ||
      typeof observation.maxWaitMinutes === "number";

    return state === "open" || state === "closed" || hasNumericWait;
  }) ||
    typeof airport.snapshot.exactWaitMinutes === "number" ||
    typeof airport.snapshot.maxWaitMinutes === "number" ||
    typeof airport.snapshot.minWaitMinutes === "number");

const hasMeaningfulObservationRows = (airport: {
  snapshot: {
    fetchStatus?: string;
    observations?: AirportWaitTimeObservation[];
  } | null;
}): boolean => {
  if (airport.snapshot?.fetchStatus === "guidance_only") {
    return true;
  }

  return (airport.snapshot?.observations ?? []).some((observation) => {
    const state = getObservationWaitState(observation, airport.snapshot?.fetchStatus);
    return state !== "unavailable" && state !== "unknown";
  });
};

const getAirportAvailabilityMessage = (airport: {
  snapshot: {
    fetchStatus?: string;
  } | null;
}): string => {
  switch (airport.snapshot?.fetchStatus) {
    case "guidance_only":
      return "Guidance only. This airport is publishing screening guidance or recommended timing rather than a live checkpoint wait.";
    case "blocked":
    case "redirected":
    case "unparsed":
      return "Unavailable. The airport source is not exposing usable live wait data right now.";
    case "error":
      return "Error. We hit a problem while checking this airport's source.";
    case "available":
      return "Unknown. The source is live, but it is not publishing a clean wait value right now.";
    default:
      return "Unknown. We could not find live wait data for this airport right now.";
  }
};

const getSnapshotSourceTone = (snapshot: {
  sourceLabel?: string;
} | null): "official" | "predicted" | "other" => {
  if (!snapshot) {
    return "other";
  }

  if (snapshot.sourceLabel === "estimated_third_party") {
    return "predicted";
  }

  if (snapshot.sourceLabel === "public_airport") {
    return "official";
  }

  return "other";
};

const getSnapshotSourcePillLabel = (snapshot: {
  sourceLabel?: string;
} | null): string | null => {
  if (snapshot?.sourceLabel === "estimated_third_party") {
    return "Estimated third party";
  }
  if (snapshot?.sourceLabel === "public_airport") {
    return "Public airport";
  }
  return null;
};

const getSnapshotSourceTooltip = (snapshot: {
  sourceLabel?: string;
} | null): string => {
  if (!snapshot) {
    return "Source unavailable.";
  }

  switch (snapshot.sourceLabel) {
    case "public_airport":
      return "Based on publicly available airport information.";
    case "estimated_third_party":
      return "Estimated from a third-party source, not a live official checkpoint reading.";
    default:
      return "Source unavailable.";
  }
};

const toRadians = (value: number): number => (value * Math.PI) / 180;

const getDistanceMiles = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): number => {
  const earthRadiusMiles = 3958.8;
  const deltaLatitude = toRadians(destination.latitude - origin.latitude);
  const deltaLongitude = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(deltaLongitude / 2) ** 2;

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(haversine));
};

const isSnapshotStale = (snapshot: {
  observedAt?: string;
  fetchedAt?: string;
  refreshIntervalMinutes?: number;
} | null): boolean => {
  if (!snapshot) {
    return true;
  }

  const freshestTimestamp = Date.parse(snapshot.observedAt ?? snapshot.fetchedAt ?? "");
  if (!Number.isFinite(freshestTimestamp)) {
    return true;
  }

  const refreshIntervalMinutes = snapshot.refreshIntervalMinutes ?? 15;
  return Date.now() - freshestTimestamp > refreshIntervalMinutes * 3 * 60 * 1000;
};

const getAirportSearchScore = (
  airport: {
    airportCode: string;
    airportName: string;
    cityName: string;
    regionName: string;
    countryName?: string;
  },
  normalizedQuery: string
): number => {
  if (normalizedQuery.length === 0) {
    return 0;
  }

  const normalizedCountryName = normalizeAirportSearchText(airport.countryName);
  const searchableText = [
    airport.airportCode,
    airport.airportName,
    airport.cityName,
    airport.regionName,
    normalizedCountryName,
  ]
    .join(" ")
    .toLowerCase();

  const aliasRank = AIRPORT_SEARCH_ALIAS_RANK[airport.airportCode] ?? 0;
  const aliases = AIRPORT_SEARCH_ALIASES[airport.airportCode] ?? [];

  if (normalizedCountryName.length > 0 && normalizedCountryName === normalizedQuery) {
    return 200 + aliasRank;
  }

  const hasExactAliasMatch = aliases.some((alias) => alias === normalizedQuery);
  if (hasExactAliasMatch) {
    return 190 + aliasRank;
  }

  if (searchableText.includes(normalizedQuery)) {
    return 10 + aliasRank;
  }

  return -1;
};

const FAQ_ITEMS = [
  {
    id: "doneai",
    eyebrow: "Pack",
    question: "Why is Pack publishing TSA wait times publicly?",
    answer:
      "Pack ❤️ travelers. We want to give people the best travel experience we possibly can, and making airport wait information easier to find and easier to use is one small part of that.",
  },
  {
    id: "sources",
    eyebrow: "Sources",
    question: "How are these current wait times calculated?",
    answer:
      "We pull together publicly available checkpoint information from airport websites and other airport-run passenger pages, then package it into something easier to scan. Today this page reflects the public information airports publish. In the future, the Pack app will also let travelers see crowdsourced signals from other travelers.",
  },
  {
    id: "accuracy",
    eyebrow: "Freshness",
    question: "How often does the board update?",
    answer:
      "We refresh this board every 15 minutes for the airports we actively track. That said, some airport pages update more slowly than others, and some can go stale or disappear for a while, so the timestamp on each card matters.",
  },
  {
    id: "confidence",
    eyebrow: "Accuracy",
    question: "How accurate is this board?",
    answer:
      "It is only as good as the public airport information behind it. We package the latest public wait-time signals we can find into something easier to check, but if an airport's published data is delayed, sparse, or wrong, this board can be too. In the future, the Pack app will also let travelers see crowdsourced traffic signals from other app users, so you can get a clearer picture from your fellow travelers as well.",
  },
  {
    id: "terminals",
    eyebrow: "Coverage",
    question: "Why do some airports show terminal detail while others do not?",
    answer:
      "Every airport publishes this differently. If an airport gives terminal or checkpoint detail, we show it. If it only gives a broad airport-wide status, that is what you will see here too.",
  },
  {
    id: "missing",
    eyebrow: "Missing data",
    question: "Why does an airport show up here without a current wait time?",
    answer:
      "Sometimes an airport is part of our coverage set but is not publishing usable live data at that moment. We still keep it in search so you know we looked, but the amount of detail we can show still depends on what that airport is making publicly available.",
  },
  {
    id: "stale",
    eyebrow: "Stale data",
    question: "What should I do if a wait time looks stale or off?",
    answer:
      "Check the timestamp on the card first. If it looks old, missing, or just does not match what you are seeing, treat the board as stale and give yourself extra margin. Public airport data can change quickly, and this page is only as good as the information airports make available.",
  },
  {
    id: "planning",
    eyebrow: "Travel day",
    question: "Should I plan around this number exactly?",
    answer:
      "No. Treat it as a useful signal, not a promise. Security lines can move quickly for better or worse, so you should still leave margin for traffic, bag drop, terminal changes, and the kind of airport chaos that never makes it into a neat number.",
  },
  {
    id: "manual",
    eyebrow: "Detail",
    question: "Why do some cards have more detail than others?",
    answer:
      "Airport security information is still published in a lot of inconsistent ways, and some airports expose much better public data than others. We package what we can into a consistent board, but coverage and detail still depend on what each airport makes publicly available.",
  },
  {
    id: "feedback",
    eyebrow: "Feedback",
    question: "What if something looks wrong?",
    answer:
      "Tell us. Each card includes a quick way to reach support, and we would rather hear about a weird airport page, broken scrape, or misleading wait than leave it sitting there.",
  },
];

const WAITLIST_MODAL_COMPLETED_KEY = "tsa-waits-email-modal-completed";
const WAITLIST_MODAL_HANDOFF_QUERY_KEY = "doneaiStartLogin";
const WAITLIST_MODAL_HANDOFF_REDIRECT_QUERY_KEY = "doneaiRedirectPath";
const WAITLIST_MODAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
const AIRPORTS_PAGE_SIZE = 5;

const stripWaitlistModalQueryFlags = (value: string): string => {
  if (typeof window === "undefined") {
    return value;
  }

  const baseOrigin = window.location.origin;

  try {
    const parsedUrl = value.startsWith("http://") || value.startsWith("https://")
      ? new URL(value)
      : new URL(value, baseOrigin);

    parsedUrl.searchParams.delete(WAITLIST_MODAL_FORCE_QUERY_KEY);
    parsedUrl.searchParams.delete(WAITLIST_MODAL_HANDOFF_QUERY_KEY);
    parsedUrl.searchParams.delete(WAITLIST_MODAL_HANDOFF_REDIRECT_QUERY_KEY);

    if (parsedUrl.origin === baseOrigin) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }

    return parsedUrl.toString();
  } catch {
    return value;
  }
};

const getCrossSubdomainCookieDomain = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "trypackai.com" || hostname.endsWith(".trypackai.com")) {
    return ".trypackai.com";
  }
  if (hostname === "itsdoneai.com" || hostname.endsWith(".itsdoneai.com")) {
    return ".itsdoneai.com";
  }

  return undefined;
};

const persistWaitlistModalCompletion = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WAITLIST_MODAL_COMPLETED_KEY, "1");
  setCookie(WAITLIST_MODAL_COMPLETED_KEY, "1", {
    domain: getCrossSubdomainCookieDomain(),
    maxAgeSeconds: WAITLIST_MODAL_COOKIE_MAX_AGE_SECONDS,
    sameSite: "Lax",
  });
};

const clearWaitlistModalCompletion = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WAITLIST_MODAL_COMPLETED_KEY);
  deleteCookie(WAITLIST_MODAL_COMPLETED_KEY, {
    domain: getCrossSubdomainCookieDomain(),
    sameSite: "Lax",
  });
};

const hasCompletedWaitlistModal = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(WAITLIST_MODAL_COMPLETED_KEY) === "1" ||
    getCookie(WAITLIST_MODAL_COMPLETED_KEY) === "1"
  );
};

const resolveBootstrapAuthCallbackUrl = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const hostname = window.location.hostname.trim().toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${window.location.origin}/auth/callback`;
  }

  return appConfig.cognitoRedirectUri;
};

const TsaWaitTimesPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const acceptanceNotice = getAcceptanceNoticeLegalCopy(locale);
  const isClient = typeof window !== "undefined";
  const apiClient = useApiClient();
  const { login, status } = useAuth();
  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsTopRef = useRef<HTMLElement | null>(null);
  const trimmedQuery = query.trim();
  const deferredAirportQuery = useDeferredValue(trimmedQuery.toLowerCase());
  const { trackCTAClick } = useConversionTracking();
  const bootstrapAuthCallbackUrl = resolveBootstrapAuthCallbackUrl();

  useQuery({
    queryKey: ["tsa-auth-user-bootstrap", status],
    queryFn: async () => {
      const response = await apiClient.request<unknown>({
        path: "/user/information",
      });
      return response ?? null;
    },
    enabled: isClient && status === "authenticated",
    staleTime: Infinity,
    retry: false,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-airport-security-summary"],
    queryFn: fetchPublicAirportSecuritySummary,
    enabled: isClient,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (status === "authenticated") {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has(WAITLIST_MODAL_FORCE_QUERY_KEY)) {
        currentUrl.searchParams.delete(WAITLIST_MODAL_FORCE_QUERY_KEY);
        const nextSearch = currentUrl.searchParams.toString();
        const nextUrl = `${currentUrl.pathname}${nextSearch ? `?${nextSearch}` : ""}${currentUrl.hash}`;
        window.history.replaceState({}, document.title, nextUrl);
      }

      persistWaitlistModalCompletion();
      setIsModalOpen(false);
      return;
    }

    const forceModal =
      new URLSearchParams(window.location.search).get(WAITLIST_MODAL_FORCE_QUERY_KEY) === "1";

    if (forceModal) {
      clearWaitlistModalCompletion();
    }

    if (!forceModal && hasCompletedWaitlistModal()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsModalOpen(true);
      trackCTAClick("TSA Waitlist Modal Auto Open", "tsa_waits_modal_auto");
    }, 3200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [status, trackCTAClick]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentUrl = new URL(window.location.href);
    if (
      currentUrl.searchParams.get(WAITLIST_MODAL_HANDOFF_QUERY_KEY) !== "1" ||
      status !== "unauthenticated"
    ) {
      return;
    }

    const redirectPath =
      stripWaitlistModalQueryFlags(
        currentUrl.searchParams.get(WAITLIST_MODAL_HANDOFF_REDIRECT_QUERY_KEY) ||
          currentUrl.toString()
      );

    currentUrl.searchParams.delete(WAITLIST_MODAL_HANDOFF_QUERY_KEY);
    currentUrl.searchParams.delete(WAITLIST_MODAL_HANDOFF_REDIRECT_QUERY_KEY);
    const nextSearch = currentUrl.searchParams.toString();
    const nextUrl = `${currentUrl.pathname}${nextSearch ? `?${nextSearch}` : ""}${currentUrl.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
    persistWaitlistModalCompletion();
    void login({
      redirectPath,
      redirectUri: bootstrapAuthCallbackUrl,
      useCanonicalOrigin: false,
    });
  }, [bootstrapAuthCallbackUrl, login, status]);

  useMountEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    const existingSchema = document.querySelector('script[data-schema="tsa-faq"]');
    if (existingSchema) {
      existingSchema.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", "tsa-faq");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  });

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleWaitlistSuccess = () => {
    persistWaitlistModalCompletion();
    setIsModalOpen(false);
  };

  const handleGoogleLogin = () => {
    persistWaitlistModalCompletion();
    trackCTAClick("TSA Waitlist Modal Google Login", "tsa_waits_modal_google_login");

    void login({
      redirectPath:
        typeof window === "undefined"
          ? "/tsa"
          : stripWaitlistModalQueryFlags(window.location.href),
      redirectUri: bootstrapAuthCallbackUrl,
      useCanonicalOrigin: false,
    });
  };

  const requestLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Location is unavailable in this browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError("We couldn't access your location.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
      }
    );
  };

  const allAirports = (data?.airports ?? [])
    .map((airport) => ({
      ...airport,
      distanceMiles: userLocation
        ? getDistanceMiles(userLocation, {
            latitude: airport.latitude,
            longitude: airport.longitude,
          })
        : null,
    }))
    .sort((left, right) => {
      if (userLocation && left.distanceMiles !== null && right.distanceMiles !== null) {
        return left.distanceMiles - right.distanceMiles;
      }

      const waitDifference =
        getAirportSortWaitMinutes(right) - getAirportSortWaitMinutes(left);
      if (waitDifference !== 0) {
        return waitDifference;
      }

      const liveDifference =
        Number(hasLivePulledWaits(right)) - Number(hasLivePulledWaits(left));
      if (liveDifference !== 0) {
        return liveDifference;
      }

      return left.airportCode.localeCompare(right.airportCode);
    });

  const airportSearchResults = allAirports
    .map((airport) => ({
      airport,
      searchScore: getAirportSearchScore(airport, deferredAirportQuery),
    }))
    .filter(({ searchScore }) => searchScore >= 0)
    .sort((left, right) => right.searchScore - left.searchScore)
    .map(({ airport }) => airport);

  const airports = airportSearchResults;

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredAirportQuery, userLocation]);

  const changePage = (nextPage: number) => {
    setCurrentPage(nextPage);

    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      resultsTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const totalPages = Math.max(1, Math.ceil(airports.length / AIRPORTS_PAGE_SIZE));
  const normalizedCurrentPage = Math.min(currentPage, totalPages);
  const visibleAirports = airports.slice(
    (normalizedCurrentPage - 1) * AIRPORTS_PAGE_SIZE,
    normalizedCurrentPage * AIRPORTS_PAGE_SIZE
  );

  const suggestedAirports =
    deferredAirportQuery.length === 0 ? [] : airportSearchResults.slice(0, 6);

  const showSuggestions =
    isSearchFocused &&
    deferredAirportQuery.length > 0 &&
    suggestedAirports.length > 0;

  const currentPageUrl =
    typeof window === "undefined" ? "https://trypackai.com/tsa/" : window.location.href;

  return (
    <Page>
      <LlmNotice>
        Scraping our website or parsing it? We'd prefer you didn't, but please
        reach out to{" "}
        <a href="mailto:friends@itsdoneai.com">friends@itsdoneai.com</a> and
        we'd love to help you build your own with sources. Human? We'd still
        love to meet you if you're seeing this.
      </LlmNotice>
      <SearchWrap id="live-board" ref={resultsTopRef}>
        <ActionRow>
          <UtilityButton type="button" onClick={requestLocation}>
            <MapPinned size={18} />
            {isLocating
              ? "Finding nearby airports..."
              : userLocation
                ? "Sorted by your location"
                : "Use my location"}
          </UtilityButton>
        </ActionRow>
        {locationError ? <UtilityNote>{locationError}</UtilityNote> : null}
        {userLocation ? (
          <UtilityNote>
            Airports are sorted by distance from your current location.
          </UtilityNote>
        ) : null}
        <UtilityNote>
          Search by airport code, airport name, city, region, or country.
        </UtilityNote>
        <ControlGrid>
          <SearchFieldWrap>
            <SearchBar>
              <Search size={18} />
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  window.setTimeout(() => {
                    setIsSearchFocused(false);
                  }, 120);
                }}
                placeholder="Search airport, city, country, or code"
                aria-label="Search airport wait times"
              />
              {trimmedQuery.length > 0 ? (
                <ClearSearchButton
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery("");
                    setIsSearchFocused(false);
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </ClearSearchButton>
              ) : null}
            </SearchBar>
            {showSuggestions ? (
              <SearchSuggestions role="listbox" aria-label="Search suggestions">
                {suggestedAirports.map((airport) => (
                  <SearchSuggestionButton
                    key={airport.airportCode}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setQuery(airport.airportName);
                      setIsSearchFocused(false);
                    }}
                  >
                    <SearchSuggestionTitle>
                      <SearchSuggestionCode>
                        {airport.airportCode}
                      </SearchSuggestionCode>
                      <span>{airport.airportName}</span>
                    </SearchSuggestionTitle>
                    <SearchSuggestionMeta>
                      {airport.cityName}, {airport.regionName}
                    </SearchSuggestionMeta>
                  </SearchSuggestionButton>
                ))}
              </SearchSuggestions>
            ) : null}
          </SearchFieldWrap>
        </ControlGrid>
      </SearchWrap>

      {isLoading ? (
        <EmptyState>Loading the latest airport snapshots…</EmptyState>
      ) : null}

      {isError ? (
        <EmptyState>
          We could not get fresh airport data right now. Current waits are
          temporarily unknown until the next successful refresh.
        </EmptyState>
      ) : null}

      {!isLoading && !isError ? (
        <>
          {airports.length === 0 ? (
            <EmptyState>
              No airports match that search yet. Try a city or airport code.
            </EmptyState>
          ) : (
            <>
              <ResultsMeta>
                <span>
                  <>
                    Showing{" "}
                    <ResultsMetaStrong>
                      {visibleAirports.length === 0
                        ? "0"
                        : `${(normalizedCurrentPage - 1) * AIRPORTS_PAGE_SIZE + 1}-${Math.min(
                            normalizedCurrentPage * AIRPORTS_PAGE_SIZE,
                            airports.length
                          )}`}
                    </ResultsMetaStrong>{" "}
                    of <ResultsMetaStrong>{airports.length}</ResultsMetaStrong> tracked
                    airports
                  </>
                </span>
                <span>
                  {userLocation
                    ? "Airports are sorted by distance from your location."
                    : "Airports are sorted by the longest live pulled wait first."}
                </span>
              </ResultsMeta>
              {totalPages > 1 ? (
                <PaginationWrap>
                  <PaginationButton
                    type="button"
                    onClick={() =>
                      changePage(Math.max(1, normalizedCurrentPage - 1))
                    }
                    disabled={normalizedCurrentPage === 1}
                  >
                    Previous page
                  </PaginationButton>
                  <PaginationInfo>
                    Page {normalizedCurrentPage} of {totalPages}
                  </PaginationInfo>
                  <PaginationButton
                    type="button"
                    onClick={() =>
                      changePage(Math.min(totalPages, normalizedCurrentPage + 1))
                    }
                    disabled={normalizedCurrentPage === totalPages}
                  >
                    Next page
                  </PaginationButton>
                </PaginationWrap>
              ) : null}
              <AirportGrid>
              {visibleAirports.map((airport) => {
                const observationGroups = groupObservationsByTerminal(
                  airport.snapshot?.observations ?? []
                );
                const airportHasUsableWaits = hasLivePulledWaits(airport);
                return (
                  <AirportCard key={airport.airportCode}>
                    <AirportCardTop>
                      <AirportHeading>
                        <AirportCode>{airport.airportCode}</AirportCode>
                        <AirportName>{airport.airportName}</AirportName>
                        <AirportMetaLine>
                          <AirportMeta>
                            {airport.cityName}, {airport.regionName}
                          </AirportMeta>
                          {airport.distanceMiles !== null ? (
                            <DistancePill>
                              {airport.distanceMiles < 10
                                ? `${airport.distanceMiles.toFixed(1)} mi`
                                : `${Math.round(airport.distanceMiles)} mi`}
                            </DistancePill>
                          ) : null}
                        </AirportMetaLine>
                      </AirportHeading>
                    </AirportCardTop>
                    {observationGroups.length > 0 &&
                    hasMeaningfulObservationRows(airport) ? (
                      <ObservationGroup>
                        {observationGroups.map((group) => (
                          <TerminalBlock
                            key={`${airport.airportCode}-${group.terminalLabel}`}
                            $highlighted={false}
                          >
                            <TerminalTitle>
                              {group.terminalLabel}
                            </TerminalTitle>
                            {group.items.map((rowGroup, index) => (
                              <WaitRow
                                key={`${rowGroup.locationLabel}-${index}`}
                              >
                                <WaitLabel>
                                  <WaitLocation>
                                    {rowGroup.locationLabel}
                                  </WaitLocation>
                                  {rowGroup.items.length === 1 ? (
                                    <WaitProgram>
                                      {getObservationProgramLabel(rowGroup.items[0]!)}
                                    </WaitProgram>
                                  ) : null}
                                </WaitLabel>
                                <WaitBadgeStack>
                                  {rowGroup.items.map((observation) => (
                                    <WaitBadge
                                      key={`${observation.screeningProgram}-${observation.locationDisplayName}`}
                                      $tone={getObservationWaitState(
                                        observation,
                                        airport.snapshot?.fetchStatus
                                      )}
                                    >
                                      <WaitBadgeLabel>
                                        {airport.snapshot?.fetchStatus === "guidance_only"
                                          ? "Guidance only"
                                          : getObservationProgramLabel(observation)}
                                      </WaitBadgeLabel>
                                      {getWaitLabel(
                                        observation,
                                        airport.snapshot?.fetchStatus
                                      )}
                                    </WaitBadge>
                                  ))}
                                </WaitBadgeStack>
                              </WaitRow>
                            ))}
                          </TerminalBlock>
                        ))}
                      </ObservationGroup>
                    ) : (
                      <EmptyState>
                        {airportHasUsableWaits ? (
                          <>
                            This airport is live, but the source is currently
                            publishing an airport-level summary instead of
                            explicit terminal rows.
                          </>
                        ) : (
                          <>
                            {getAirportAvailabilityMessage(airport)} We still
                            show it here so you can search for it.
                          </>
                        )}
                      </EmptyState>
                    )}

                    <SourceRow>
                      <SourceMetaWrap>
                        <span>
                          Last updated{" "}
                          {formatTimestamp(
                            airport.snapshot?.observedAt ?? airport.snapshot?.fetchedAt
                          )}
                        </span>
                        {airport.snapshot &&
                        getSnapshotSourcePillLabel(airport.snapshot) ? (
                          <SourcePill
                            $tone={getSnapshotSourceTone(airport.snapshot)}
                            title={getSnapshotSourceTooltip(airport.snapshot)}
                            aria-label={getSnapshotSourceTooltip(airport.snapshot)}
                          >
                            {getSnapshotSourcePillLabel(airport.snapshot)}
                          </SourcePill>
                        ) : null}
                      </SourceMetaWrap>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
                        <SupportLink
                          href={buildAirportSupportMailtoHref({
                            airportCode: airport.airportCode,
                            airportName: airport.airportName,
                            boardGeneratedAt: data?.generatedAt,
                            pageUrl: currentPageUrl,
                            snapshot: airport.snapshot,
                          })}
                        >
                          Something wrong?
                          <ArrowUpRight size={14} />
                        </SupportLink>
                      </div>
                    </SourceRow>
                  </AirportCard>
                );
              })}
              </AirportGrid>
              {totalPages > 1 ? (
                <PaginationWrap>
                  <PaginationButton
                    type="button"
                    onClick={() =>
                      changePage(Math.max(1, normalizedCurrentPage - 1))
                    }
                    disabled={normalizedCurrentPage === 1}
                  >
                    Previous page
                  </PaginationButton>
                  <PaginationInfo>
                    Page {normalizedCurrentPage} of {totalPages}
                  </PaginationInfo>
                  <PaginationButton
                    type="button"
                    onClick={() =>
                      changePage(Math.min(totalPages, normalizedCurrentPage + 1))
                    }
                    disabled={normalizedCurrentPage === totalPages}
                  >
                    Next page
                  </PaginationButton>
                </PaginationWrap>
              ) : null}
            </>
          )}
        </>
      ) : null}

      <Panel id="details">
        <FaqLead>
          <FaqLeadEyebrow>FAQ</FaqLeadEyebrow>
          <FaqLeadTitle>How this board works</FaqLeadTitle>
          <FaqLeadText>
            The useful part should be the wait times. These details exist so
            travelers, answer engines, and assistants can understand where the
            data comes from, how fresh it is, and where to go when an airport
            only publishes a manual page.
          </FaqLeadText>
        </FaqLead>
        <FaqList>
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.id}>
              <FaqQuestion
                type="button"
                onClick={() =>
                  setOpenFaqId((current) => (current === item.id ? null : item.id))
                }
              >
                <FaqQuestionMeta>
                  <FaqEyebrow>{item.eyebrow}</FaqEyebrow>
                  <FaqQuestionText>{item.question}</FaqQuestionText>
                </FaqQuestionMeta>
                <FaqChevron $open={openFaqId === item.id}>
                  <ChevronDown size={16} />
                </FaqChevron>
              </FaqQuestion>
              {openFaqId === item.id ? (
                <FaqAnswer>{item.answer}</FaqAnswer>
              ) : null}
            </FaqItem>
          ))}
        </FaqList>
      </Panel>

      {isModalOpen ? (
        <Overlay role="dialog" aria-modal="true" aria-labelledby="tsa-email-title">
          <Modal>
            <ModalHeader>
              <ModalTitle id="tsa-email-title">
                Get early access to <BrandWord>Pack</BrandWord> and TSA times
              </ModalTitle>
              <ModalText>
                <BrandWord>Pack</BrandWord> takes your inbox, calendar,
                preferences, and booking options and turns &quot;Book my meetings
                next month&quot; into the hotels, flights, and rental cars you
                would book yourself.
              </ModalText>
            </ModalHeader>
            <ModalActions>
              <GoogleLoginButton
                type="button"
                onClick={handleGoogleLogin}
                disabled={status === "loading"}
              >
                <GoogleLogoWrap>
                  <GoogleMark />
                </GoogleLogoWrap>
                Continue with Google
              </GoogleLoginButton>
              <ModalDivider>Or</ModalDivider>
            </ModalActions>
            <WaitlistForm
              variant="embedded"
              showTitle={false}
              onSuccess={handleWaitlistSuccess}
              showLegalNotice={false}
            />
            <ModalFooter>
              <ModalDismissButton type="button" onClick={closeModal}>
                I'm already on the waitlist
              </ModalDismissButton>
              <ModalLegalNote>
                {acceptanceNotice.prefix}{" "}
                <a href={pathFor("/terms")}>{acceptanceNotice.termsLabel}</a>{" "}
                {acceptanceNotice.middle}{" "}
                <a href={pathFor("/privacy")}>{acceptanceNotice.privacyLabel}</a>.{" "}
                {acceptanceNotice.suffix}{" "}
                <a href={pathFor("/privacy-request")}>
                  {acceptanceNotice.privacyChoicesLabel}
                </a>.
              </ModalLegalNote>
            </ModalFooter>
          </Modal>
        </Overlay>
      ) : null}
    </Page>
  );
};

export default TsaWaitTimesPage;
