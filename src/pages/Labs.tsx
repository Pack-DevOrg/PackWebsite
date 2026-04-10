import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  fetchLatestLogoLabRun,
  fetchTravelDetailReviewAggregate,
  generateLogoLabRun,
} from "@/api/labs";
import { useI18n } from "@/i18n/I18nProvider";
import { AuthCallbackSurface } from "@/pages/AuthCallbackPage";
import type {
  LogoLabRun,
  TravelDetailReviewOutput,
  TravelDetailReviewResult,
} from "@/schemas/labs";
import {
  LOGO_BRANDING_RESEARCH_PRINCIPLES,
  LOGO_VARIATION_PRESETS,
  getDefaultLogoStudioPrompt,
} from "@/utils/logoLab";

export type LabVideo = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  localPath: string;
};

export type LabVideoGroup = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  featuredVideoSlug: string;
  variants: LabVideo[];
};

type ComparisonPair = {
  slug: string;
  title: string;
  description: string;
  leftVideoSlug: LabVideo["slug"];
  rightVideoSlug: LabVideo["slug"];
};

type LabSection = {
  slug: string;
  title: string;
  description: string;
  href: string;
  kicker: string;
};

type BrandAsset = {
  slug: string;
  title: string;
  description: string;
  src: string;
  kicker: string;
  pathLabel: string;
};

type OgConcept = {
  slug: string;
  title: string;
  description: string;
  src: string;
  prompt: string;
  verdict: "closest" | "promising" | "mixed";
};

type TravelDetailVerdict = "wrong" | "needs_validation" | "ok";

type TravelDetailReviewState = Record<
  string,
  {
    verdict?: TravelDetailVerdict;
    note?: string;
  }
>;

const TRAVEL_DETAIL_REVIEW_STORAGE_KEY = "pack-labs-travel-detail-review-v1";

const labVideoGroups: LabVideoGroup[] = [
  {
    slug: "book-cabo-dachshund",
    title: "Book Cabo Dachshund POV",
    description:
      "First-person dachshund booking concept with a real Pack booking visual and a readable Book Cabo query.",
    tags: ["Cabo", "POV", "Dachshund", "Real app base"],
    featuredVideoSlug: "book-cabo-dachshund-v1",
    variants: [
      {
        slug: "book-cabo-dachshund-v1",
        title: "Variant 1",
        description: "Current pipeline render for the Cabo dachshund concept.",
        tags: ["Current"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/reels_15s_book_cabo_dachshund_v1/ad_001.mp4",
      },
    ],
  },
  {
    slug: "book-japan-pov-chaos",
    title: "Book Japan POV Chaos",
    description:
      "Earlier POV proof built through the same template pipeline, centered on Book Japan with a cute-hand chaos setup.",
    tags: ["Japan", "POV", "Cute hand", "Chaos"],
    featuredVideoSlug: "book-japan-pov-chaos-v1",
    variants: [
      {
        slug: "book-japan-pov-chaos-v1",
        title: "Variant 1",
        description: "Earlier POV pipeline render for the Book Japan concept.",
        tags: ["Earlier"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/reels_15s_book_japan_pov_chaos_v1/ad_001.mp4",
      },
    ],
  },
  {
    slug: "dog-book-japan-poc",
    title: "Dog Book Japan POC",
    description:
      "Initial proof-of-concept export used to validate the ad render path before the reusable labs pipeline was added.",
    tags: ["POC", "Japan", "Dog paw"],
    featuredVideoSlug: "dog-book-japan-poc-v1",
    variants: [
      {
        slug: "dog-book-japan-poc-v1",
        title: "Variant 1",
        description: "Original proof-of-concept export.",
        tags: ["Original POC"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/poc_dog_book_japan.mp4",
      },
    ],
  },
  {
    slug: "phone-overlay-poc",
    title: "Phone Overlay POC",
    description:
      "Perspective-warp overlay proofs showing both dynamic UI insertion and a real app-owned capture inserted into the phone plane.",
    tags: ["POC", "Overlay", "Screen replacement"],
    featuredVideoSlug: "overlay-dynamic-screen-poc",
    variants: [
      {
        slug: "overlay-dynamic-screen-poc",
        title: "Variant 1 · Dynamic Screen",
        description:
          "Generated app flow composited onto the existing POV phone plate.",
        tags: ["Dynamic screen", "Phone plate"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/poc/poc_overlay_dynamic_screen.mp4",
      },
      {
        slug: "overlay-real-packdev-splash-poc",
        title: "Variant 2 · Real PackDev Capture",
        description:
          "Real PackDev simulator capture composited into the phone plate.",
        tags: ["Real app asset", "PackDev"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/poc/poc_overlay_real_packdev_splash.mp4",
      },
    ],
  },
  {
    slug: "pack-travel-podcast-two-women",
    title: "Pack Travel Podcast Two Women",
    description:
      "Veo-generated podcast concept showing the iteration path from generic studio setup toward more credible couch-based interview coverage.",
    tags: ["Pack", "Travel", "Podcast", "Audio", "Subtitled"],
    featuredVideoSlug: "pack-travel-podcast-two-women-v3",
    variants: [
      {
        slug: "pack-travel-podcast-two-women-v1",
        title: "Variant 1",
        description:
          "Initial podcast render with weaker staging and rougher subtitle treatment.",
        tags: ["Initial"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/poc/pack_travel_podcast_two_women_v1_001.subtitled.mp4",
      },
      {
        slug: "pack-travel-podcast-two-women-v2",
        title: "Variant 2",
        description:
          "Couch-based setup with improved wardrobe, subtitle treatment, and warmer premium styling.",
        tags: ["Couch setup"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/poc/pack_travel_podcast_two_women_v2.subtitled.mp4",
      },
      {
        slug: "pack-travel-podcast-two-women-v3",
        title: "Variant 3",
        description:
          "Feet-visible wide master with stronger podcast interview coverage language and refined subtitles.",
        tags: ["Current best", "Feet visible", "Master wide"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/poc/pack_travel_podcast_two_women_v3.subtitled.mp4",
      },
    ],
  },
];

const comparisonPairs: ComparisonPair[] = [
  {
    slug: "cabo-vs-japan",
    title: "Current Best vs Previous POV",
    description:
      "Compare the stronger Cabo dachshund execution against the earlier Book Japan POV concept.",
    leftVideoSlug: "book-cabo-dachshund-v1",
    rightVideoSlug: "book-japan-pov-chaos-v1",
  },
  {
    slug: "pipeline-evolution",
    title: "POC vs Structured Pipeline",
    description:
      "See the jump from the first proof-of-concept to the later pipeline-driven ad render.",
    leftVideoSlug: "dog-book-japan-poc-v1",
    rightVideoSlug: "book-cabo-dachshund-v1",
  },
];

const labSections: LabSection[] = [
  {
    slug: "brand-assets",
    title: "Brand Assets",
    description:
      "Review the current logos, icons, splash art, and share cards in one place.",
    href: "/labs/brand-assets",
    kicker: "Identity system",
  },
  {
    slug: "live-activities",
    title: "Live Activities",
    description:
      "Inspect the live activity concepts and existing notification-style experiments.",
    href: "/labs/live-activities",
    kicker: "iOS surfaces",
  },
  {
    slug: "videos",
    title: "Videos",
    description:
      "Review exported ad renders, stream every generated variant in-browser, and compare concepts without leaving Labs.",
    href: "/labs/videos",
    kicker: "Exports and source files",
  },
  {
    slug: "comparisons",
    title: "Comparisons",
    description:
      "Put variants next to each other so it is obvious what improved and what regressed.",
    href: "/labs/comparisons",
    kicker: "Creative review",
  },
  {
    slug: "auth-callback",
    title: "Auth Callback",
    description:
      "Inspect the redesigned sign-in handoff page in both processing and error states.",
    href: "/labs/auth-callback",
    kicker: "Auth surfaces",
  },
];

const labVideos: LabVideo[] = labVideoGroups.flatMap((group) => group.variants);
const videoBySlug = new Map(labVideos.map((video) => [video.slug, video]));

const toViteFsUrl = (absolutePath: string): string =>
  `/@fs${encodeURI(absolutePath)}`;

const packAppAssetRoot = "/Users/noahmitsuhashi/Code/PackAll/PackApp/src/assets/images";

const brandAssets: BrandAsset[] = [
  {
    slug: "website-logo",
    title: "Website Logo",
    description:
      "Used in the website shell, auth callback view, live-activity lab, and other Pack web chrome where the standalone mark appears on dark backgrounds.",
    src: "/logo.png",
    kicker: "Website",
    pathLabel: "/public/logo.png",
  },
  {
    slug: "website-favicon",
    title: "Website Favicon",
    description:
      "Used for browser tabs, bookmark bars, and the small site icon surfaces that rely on the transparent favicon stack.",
    src: "/favicon-32.png",
    kicker: "Website",
    pathLabel: "/public/favicon-32.png",
  },
  {
    slug: "share-card",
    title: "Shared Link Card",
    description:
      "Used by shared-trip and trip-invite previews in Messages, iMessage cards, and other social link previews that read Open Graph metadata.",
    src: "/images/share-card.png",
    kicker: "Website",
    pathLabel: "/public/images/share-card.png",
  },
  {
    slug: "website-og",
    title: "Generic OG Card",
    description:
      "Used as the broader website social card for homepage-style previews and fallback web sharing outside the dedicated shared-trip flow.",
    src: "/images/og-image.png",
    kicker: "Website",
    pathLabel: "/public/images/og-image.png",
  },
  {
    slug: "app-logo",
    title: "App Logo",
    description:
      "Used inside the mobile app UI and in live-activity/logo surfaces where a transparent Pack mark is needed instead of a full app icon.",
    src: toViteFsUrl(`${packAppAssetRoot}/logo.png`),
    kicker: "PackApp",
    pathLabel: `${packAppAssetRoot}/logo.png`,
  },
  {
    slug: "app-icon",
    title: "App Icon",
    description:
      "Used for the production app icon pipeline: Expo config, iOS marketing icon generation, and the primary icon users see on their home screen.",
    src: toViteFsUrl(`${packAppAssetRoot}/app-icon-1024.png`),
    kicker: "PackApp",
    pathLabel: `${packAppAssetRoot}/app-icon-1024.png`,
  },
  {
    slug: "app-icon-dev",
    title: "Dev App Icon",
    description:
      "Used for internal dev builds and the native PackDev target so test installs stay visually distinct from the production app.",
    src: toViteFsUrl(`${packAppAssetRoot}/app-icon-1024-dev.png`),
    kicker: "PackApp",
    pathLabel: `${packAppAssetRoot}/app-icon-1024-dev.png`,
  },
  {
    slug: "splash",
    title: "Splash Art",
    description:
      "Used for the mobile launch splash screen and as the composition reference for the current shared-link card treatment.",
    src: toViteFsUrl(`${packAppAssetRoot}/splash-new.png`),
    kicker: "PackApp",
    pathLabel: `${packAppAssetRoot}/splash-new.png`,
  },
  {
    slug: "adaptive-icon",
    title: "Android Adaptive Icon",
    description:
      "Used for Android launcher rendering on devices that support adaptive icons, where the icon is masked and composited by the OS.",
    src: toViteFsUrl(`${packAppAssetRoot}/icon-android-adaptive.png`),
    kicker: "PackApp",
    pathLabel: `${packAppAssetRoot}/icon-android-adaptive.png`,
  },
];

const refinedOgConcepts: OgConcept[] = [
  {
    slug: "quiet-ember-breathing-room",
    title: "Approved Homepage OG Card",
    description:
      "Approved direction. The Pack mark stays small, the glow language stays at the edges, and the card keeps enough negative space to feel calm instead of illustrative.",
    src: "/images/og-refined/final/quiet-ember-breathing-room.png",
    verdict: "closest",
    prompt:
      "Final treatment: use the real Pack logo over a near-black field with gentle ember glows around the perimeter, preserving negative space and avoiding literal travel objects or centered spectacle.",
  },
];

const Page = styled.section`
  min-height: 100vh;
  padding: clamp(1.25rem, 3vw, 2.5rem) 0 clamp(3rem, 6vw, 5rem);
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Hero = styled.header`
  position: relative;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 28px;
  padding: clamp(1.5rem, 4vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.18), transparent 28%),
    radial-gradient(circle at 12% 78%, rgba(231, 35, 64, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(23, 19, 16, 0.94), rgba(15, 13, 11, 0.98));
  box-shadow: ${({ theme }) => theme.colors.shadow.dark};
`;

const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 1rem;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.primary.main};
`;

const Title = styled.h1`
  margin: 0;
  max-width: 12ch;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(2.4rem, 7vw, 4.8rem);
  line-height: 0.92;
  letter-spacing: -0.05em;
`;

const Intro = styled.p`
  margin: 1rem 0 0;
  max-width: 56rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: clamp(1rem, 2.2vw, 1.1rem);
  line-height: 1.7;
`;

const HeroNote = styled.div`
  margin-top: 1.35rem;
  display: inline-flex;
  max-width: 54rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 20px;
  padding: 0.9rem 1rem;
  background: rgba(255, 248, 236, 0.05);
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SectionCard = styled.article`
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1.1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};

  @media (max-width: 900px) {
    grid-column: span 1;
  }
`;

const VideoCard = styled.article`
  grid-column: span 6;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};

  @media (max-width: 900px) {
    grid-column: span 1;
  }
`;

const VideoGroupCard = styled.article`
  grid-column: span 12;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 28px;
  padding: 1.1rem;
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const VariantGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const VideoVariantCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  border-radius: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  padding: 0.95rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.05), rgba(255, 248, 236, 0.02)),
    rgba(11, 10, 9, 0.76);
`;

const ComparisonCard = styled.article`
  grid-column: span 12;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const AssetCard = styled.article`
  grid-column: span 6;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};

  @media (max-width: 900px) {
    grid-column: span 1;
  }
`;

const ConceptCard = styled.article`
  grid-column: span 12;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const AssetPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 17rem;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background:
    radial-gradient(circle at top, rgba(243, 210, 122, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(18, 18, 18, 0.98), rgba(9, 7, 6, 1));
  padding: 1.1rem;
`;

const AssetImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 24rem;
  object-fit: contain;
  border-radius: 18px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.28);
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
`;

const ReviewStats = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const ReviewPill = styled.span`
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(255, 248, 236, 0.05);
  padding: 0.45rem 0.75rem;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary.main : theme.colors.border.light};
  background: ${({ $active }) =>
    $active ? "rgba(243, 210, 122, 0.14)" : "rgba(255, 248, 236, 0.05)"};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  font: inherit;
  cursor: pointer;
`;

const ReviewCard = styled.article`
  grid-column: span 12;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const ReviewHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
`;

const ReviewMetaColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
`;

const ReviewActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: flex-start;
`;

const ReviewActionButton = styled.button<{
  $tone: "wrong" | "needsValidation" | "ok" | "neutral";
}>`
  border-radius: 999px;
  padding: 0.6rem 0.95rem;
  font: inherit;
  cursor: pointer;
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === "wrong"
        ? theme.colors.secondary.main
        : $tone === "needsValidation"
          ? theme.colors.primary.light
          : $tone === "ok"
            ? theme.colors.primary.main
            : theme.colors.border.light};
  background: ${({ $tone }) =>
    $tone === "wrong"
      ? "rgba(231, 35, 64, 0.12)"
      : $tone === "needsValidation"
        ? "rgba(243, 210, 122, 0.16)"
      : $tone === "ok"
        ? "rgba(243, 210, 122, 0.12)"
        : "rgba(255, 248, 236, 0.05)"};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PromptPanel = styled.div`
  border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(255, 248, 236, 0.04);
  padding: 0.95rem 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.6;
`;

const ReviewLegGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ReviewLegCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(11, 10, 9, 0.72);
  padding: 0.95rem;
`;

const JsonBlock = styled.pre`
  margin: 0;
  overflow: auto;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(0, 0, 0, 0.28);
  padding: 0.9rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.8rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ReviewTextArea = styled.textarea`
  width: 100%;
  min-height: 5.5rem;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(255, 248, 236, 0.04);
  padding: 0.85rem 0.95rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font: inherit;
  resize: vertical;
`;

const SurfacePreviewCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SurfaceFrame = styled.div`
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const VideoFrame = styled.div`
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background:
    radial-gradient(circle at top, rgba(243, 210, 122, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(18, 18, 18, 0.98), rgba(9, 7, 6, 1));
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const InlineVideo = styled.video`
  display: block;
  width: 100%;
  aspect-ratio: 9 / 16;
  background: #050505;
  object-fit: cover;
`;

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const VariantHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const VariantTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
`;

const Kicker = styled.span`
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.18);
  background: rgba(243, 210, 122, 0.08);
  padding: 0.35rem 0.7rem;
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.12rem, 2.5vw, 1.35rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
`;

const CardBody = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.96rem;
  line-height: 1.65;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.18);
  background: rgba(243, 210, 122, 0.08);
  padding: 0.36rem 0.7rem;
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const BaseAction = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 8.5rem;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const LinkAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 8.5rem;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const PrimaryLink = styled(BaseAction)`
  color: #14110d;
  background: ${({ theme }) => theme.colors.primary.gradient};
  box-shadow: 0 16px 34px rgba(243, 210, 122, 0.2);
`;

const SecondaryLink = styled(BaseAction)`
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  background: rgba(255, 248, 236, 0.04);
`;

const SectionLink = styled(LinkAction)`
  color: #14110d;
  background: ${({ theme }) => theme.colors.primary.gradient};
  box-shadow: 0 16px 34px rgba(243, 210, 122, 0.2);
`;

const BreadcrumbRow = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const BreadcrumbLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.88rem;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const PathLabel = styled.code`
  display: block;
  overflow-wrap: anywhere;
  border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(0, 0, 0, 0.22);
  padding: 0.8rem 0.95rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
  line-height: 1.5;
`;

const StudioGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 1.25rem;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const StudioPanel = styled.article`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1.1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const StudioForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const FieldBlock = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const FieldLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

const FieldHint = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.78rem;
  line-height: 1.5;
`;

const FieldInput = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.22);
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.8rem 0.9rem;
  font: inherit;
`;

const FieldSelect = styled.select`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.22);
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.8rem 0.9rem;
  font: inherit;
`;

const FieldTextArea = styled.textarea`
  min-height: 8.5rem;
  width: 100%;
  resize: vertical;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.22);
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.9rem 1rem;
  font: inherit;
  line-height: 1.6;
`;

const CheckboxRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.86rem;
`;

const HelperList = styled.ul`
  margin: 0;
  padding-left: 1.15rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.7;
`;

const Notice = styled.div`
  border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(255, 248, 236, 0.05);
  padding: 0.85rem 0.95rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.86rem;
  line-height: 1.6;
`;

const ErrorNotice = styled(Notice)`
  border-color: rgba(231, 35, 64, 0.45);
  color: ${({ theme }) => theme.colors.secondary.light};
  background: rgba(231, 35, 64, 0.08);
`;

const StudioActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const ButtonLikeLink = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 8.5rem;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.55;
    transform: none;
  }
`;

const PrimaryButton = styled(ButtonLikeLink)`
  color: #14110d;
  background: ${({ theme }) => theme.colors.primary.gradient};
  box-shadow: 0 16px 34px rgba(243, 210, 122, 0.2);
`;

const SecondaryButton = styled(ButtonLikeLink)`
  color: ${({ theme }) => theme.colors.text.primary};
  background: rgba(255, 248, 236, 0.04);
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const IconWall = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  border-radius: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(20, 19, 17, 0.98), rgba(8, 8, 8, 0.98));
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const IconWallHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const IconWallTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const IconWallBody = styled.p`
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const IconWallGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
  gap: 0.85rem;
`;

const IconWallItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
`;

const IconWallSurface = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.1), transparent 42%),
    linear-gradient(180deg, rgba(18, 18, 18, 0.98), rgba(6, 6, 6, 1));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 10px 22px rgba(0, 0, 0, 0.34);
  overflow: hidden;
`;

const IconWallImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const IconWallNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.55rem;
  height: 1.55rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: rgba(243, 210, 122, 0.95);
  color: #14110d;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.32);
`;

const IconWallLabel = styled.span`
  font-size: 0.75rem;
  line-height: 1.2;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const VariantCard = styled.article<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected
        ? theme.colors.primary.main
        : theme.colors.border.light};
  border-radius: 22px;
  padding: 0.95rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const VariantImageFrame = styled.div`
  position: relative;
  overflow: hidden;
  min-height: 17rem;
  border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(18, 18, 18, 0.98), rgba(9, 7, 6, 1));
`;

const VariantImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  min-height: 17rem;
  object-fit: contain;
`;

const VariantAppSizeDock = styled.div`
  position: absolute;
  right: 0.9rem;
  bottom: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.6rem 0.6rem;
  border-radius: 16px;
  background: rgba(8, 8, 8, 0.82);
  border: 1px solid rgba(243, 210, 122, 0.18);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(8px);
`;

const VariantAppSizeLabel = styled.span`
  font-size: 0.66rem;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 248, 236, 0.68);
`;

const VariantAppSizeSurface = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.1), transparent 42%),
    linear-gradient(180deg, rgba(18, 18, 18, 0.98), rgba(6, 6, 6, 1));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 10px 20px rgba(0, 0, 0, 0.32);
  overflow: hidden;
`;

const VariantAppSizeImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const VariantNumber = styled.span`
  position: absolute;
  top: 0.8rem;
  left: 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 999px;
  background: rgba(20, 17, 13, 0.78);
  border: 1px solid rgba(243, 210, 122, 0.3);
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.95rem;
  font-weight: 800;
`;

const SelectionSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const SelectionChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.18);
  background: rgba(243, 210, 122, 0.08);
  padding: 0.35rem 0.7rem;
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.76rem;
  font-weight: 700;
`;

const SectionHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0.5rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.3rem, 2.8vw, 1.8rem);
  letter-spacing: -0.04em;
`;

const SectionDescription = styled.p`
  margin: 0;
  max-width: 62rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.96rem;
  line-height: 1.7;
`;

const buildVideoTitle = (title: string) => `Pack Labs | ${title}`;

const labsContent = {
  en: {
    eyebrow: "Pack Labs",
    heroNote:
      "Labs is only available on localhost in Vite dev mode. Video pages use direct file-system paths from your local repo and are not mirrored into deployable public assets.",
    openSection: "Open section",
    openPreview: "Open preview",
    downloadLocalCopy: "Download local copy",
    home: {
      title: "A directory for live activities, videos, and comparisons.",
      description:
        "Use labs as the internal review surface for creative output. Each section is separated so you can inspect surfaces, review exports, and compare variants without mixing contexts.",
      sections: [
        {
          slug: "logo-studio",
          title: "Logo Studio",
          description:
            "Generate numbered logo variations through the PackAds Vertex setup, then refine the next round from the options you like.",
          href: "/labs/logo-studio",
          kicker: "Brand exploration",
        },
        {
          slug: "brand-assets",
          title: "Brand Assets",
          description:
            "Review the current logos, icons, splash art, and share cards in one place.",
          href: "/labs/brand-assets",
          kicker: "Identity system",
        },
        {
          slug: "live-activities",
          title: "Live Activities",
          description:
            "Inspect the live activity concepts and existing notification-style experiments.",
          href: "/labs/live-activities",
          kicker: "iOS surfaces",
        },
        {
          slug: "videos",
          title: "Videos",
          description:
            "Review exported ad renders, stream every generated variant in-browser, and compare concept groups without leaving Labs.",
          href: "/labs/videos",
          kicker: "Exports and source files",
        },
        {
          slug: "comparisons",
          title: "Comparisons",
          description:
            "Put variants next to each other so it is obvious what improved and what regressed.",
          href: "/labs/comparisons",
          kicker: "Creative review",
        },
        {
          slug: "auth-callback",
          title: "Auth Callback",
          description:
            "Inspect the redesigned sign-in handoff page in both processing and error states.",
          href: "/labs/auth-callback",
          kicker: "Auth surfaces",
        },
        {
          slug: "travel-detail-review",
          title: "Travel Detail Review",
          description:
            "Review the 78-case detail aggregate, inspect each leg payload, and mark cases that are wrong before the next prompt pass.",
          href: "/labs/travel-detail-review",
          kicker: "Extractor QA",
        },
      ],
    },
    videos: {
      title: "Video exports grouped by concept.",
      description:
        "Each card groups the variants we have generated for one concept. Play them inline, open the browser preview directly, or download the local export copy when you need it.",
      videoGroups: labVideoGroups,
    },
    comparisons: {
      title: "Side-by-side creative comparisons.",
      description:
        "Keep comparisons explicit. This section is for judging hooks, realism, motion, framing, and which version is closer to a scalable ad system.",
      pairs: comparisonPairs,
    },
    logoStudio: {
      title: "Vertex logo studio for Pack.",
      description:
        "Generate a batch of numbered logo explorations through the local PackAds Vertex path, then pick the numbers you like and push the next round in that direction.",
      promptLabel: "Base prompt",
      promptHint:
        "Start with the outcome you want, not just the object list. The system adds mascot, palette, legibility, and premium-brand constraints automatically.",
      companyLabel: "Company name",
      countLabel: "Variation count",
      refinementLabel: "Iteration note",
      refinementHint:
        "Use this after a round to say what to keep or change, for example: make it more emblematic, less cartoonish, or more app-icon friendly.",
      generateLabel: "Generate variants",
      regenerateLabel: "Push another round",
      selectedHeading: "Selected numbers",
      selectedEmpty:
        "Select the variant numbers you like, then regenerate to keep pushing in that direction.",
      selectedAction: "Use selected numbers in note",
      brainClusterLabel: "Request brain-cluster routing",
      brainClusterHint:
        "This workspace only has the PackAds Vertex path wired today. Turning this on adds a warning to the run so the missing cluster hookup stays visible.",
      researchHeading: "Brand-system rules behind the prompts",
      resultHeading: "Generated variations",
      resultHint:
        "Each image gets a fixed number so you can say which ones to keep. Internally the next run reuses the selected direction labels before generating again.",
      latestHeading: "Latest generated round",
      latestHint:
        "This page loads the most recent generated set from disk automatically so you can review the icons first and only generate again when needed.",
      generationControlsHeading: "Generate another round",
      openLocalFile: "Open local PNG",
      selectVariantLabel: "Keep",
      deselectVariantLabel: "Deselect",
    },
    brandAssets: {
      title: "Brand assets in one review surface.",
      description:
        "Use this page to inspect the live Pack mark across the website and app: logos, favicons, share cards, app icons, splash art, and Android adaptive assets.",
      assets: brandAssets,
      refinedConceptTitle: "Approved homepage OG card.",
      refinedConceptDescription:
        "This is the approved homepage social card direction now promoted into the live website OG asset.",
      refinedConcepts: refinedOgConcepts,
    },
    authCallback: {
      title: "OAuth callback review surface.",
      description:
        "Use this page to inspect the intermediate sign-in handoff exactly as it should feel during a live OAuth return, including both the happy waiting state and the recovery state.",
      processingTitle: "Processing state",
      processingBody:
        "Preview the in-between moment after Google hands the user back to Pack and before the app workspace is ready.",
      processingMessage:
        "Attempting to complete your sign-in. This should only take a moment.",
      errorTitle: "Error state",
      errorBody:
        "Preview the fallback state when the handoff fails and the user needs a clear way back into the sign-in flow.",
      errorMessage:
        "We couldn't complete the sign-in because the callback is missing required parameters. Please try signing in again.",
    },
    travelDetailReview: {
      title: "Travel detail review for the 78-case corpus.",
      description:
        "Use this page to inspect the finished detail aggregate from PackServer, mark cases wrong, and leave short notes on why the detail payload is off.",
      statsLabel: "Review progress",
      wrongFilter: "Wrong",
      needsValidationFilter: "Needs validation",
      okFilter: "OK",
      unreviewedFilter: "Unreviewed",
      allFilter: "All",
      markWrong: "Mark wrong",
      markNeedsValidation: "Needs validation on dates/cities",
      markOk: "Mark OK",
      clearReview: "Clear",
      notesLabel: "Why is it wrong?",
      sourceLabel: "Aggregate source",
      failedLabel: "Failed detail run",
      promptLabel: "Prompt",
      detailLabel: "Raw detail output",
    },
    crumbs: {
      labs: "Labs",
      logoStudio: "Logo studio",
      videos: "Videos",
      comparisons: "Comparisons",
      brandAssets: "Brand assets",
      authCallback: "Auth callback",
      travelDetailReview: "Travel detail review",
    },
  },
  es: {
    eyebrow: "Labs de Pack",
    heroNote:
      "Labs solo está disponible en localhost dentro del modo de desarrollo de Vite. Las páginas de video usan rutas directas al sistema de archivos local y no se copian a assets públicos desplegables.",
    openSection: "Abrir sección",
    openPreview: "Abrir vista previa",
    downloadLocalCopy: "Descargar copia local",
    home: {
      title: "Un directorio para live activities, videos y comparaciones.",
      description:
        "Usa labs como la superficie interna de revisión para el trabajo creativo. Cada sección está separada para que puedas inspeccionar superficies, revisar exports y comparar variantes sin mezclar contextos.",
      sections: [
        {
          slug: "logo-studio",
          title: "Logo Studio",
          description:
            "Genera variaciones numeradas de logo con la ruta Vertex de PackAds y luego refina la siguiente ronda a partir de las opciones que más te gusten.",
          href: "/labs/logo-studio",
          kicker: "Exploración de marca",
        },
        {
          slug: "brand-assets",
          title: "Brand Assets",
          description:
            "Revisa en un solo lugar los logos, iconos, splash art y tarjetas de compartir actuales.",
          href: "/labs/brand-assets",
          kicker: "Sistema de identidad",
        },
        {
          slug: "live-activities",
          title: "Live Activities",
          description:
            "Inspecciona los conceptos de live activity y los experimentos existentes con estilo de notificación.",
          href: "/labs/live-activities",
          kicker: "Superficies iOS",
        },
        {
          slug: "videos",
          title: "Videos",
          description:
            "Revisa los renders exportados, reproduce en el navegador cada variante generada y compara grupos de conceptos sin salir de Labs.",
          href: "/labs/videos",
          kicker: "Exports y archivos fuente",
        },
        {
          slug: "comparisons",
          title: "Comparaciones",
          description:
            "Pon las variantes una junto a otra para ver con claridad qué mejoró y qué empeoró.",
          href: "/labs/comparisons",
          kicker: "Revisión creativa",
        },
        {
          slug: "auth-callback",
          title: "Auth Callback",
          description:
            "Inspecciona la pantalla rediseñada de transición de inicio de sesión en estados de procesamiento y error.",
          href: "/labs/auth-callback",
          kicker: "Superficies de auth",
        },
        {
          slug: "travel-detail-review",
          title: "Travel Detail Review",
          description:
            "Revisa el aggregate de detail de 78 casos, inspecciona cada payload por leg y marca los casos incorrectos antes de la siguiente pasada de prompts.",
          href: "/labs/travel-detail-review",
          kicker: "QA del extractor",
        },
      ],
    },
    videos: {
      title: "Exports de video agrupados por concepto.",
      description:
        "Cada tarjeta agrupa las variantes que ya generamos para un concepto. Reprodúcelas en línea, abre la vista previa del navegador o descarga la copia del export local cuando la necesites.",
      videoGroups: labVideoGroups,
    },
    comparisons: {
      title: "Comparaciones creativas lado a lado.",
      description:
        "Mantén las comparaciones explícitas. Esta sección sirve para juzgar ganchos, realismo, movimiento, encuadre y qué versión está más cerca de un sistema de anuncios escalable.",
      pairs: [
        {
          ...comparisonPairs[0],
          title: "Mejor actual vs POV anterior",
          description:
            "Compara la ejecución más fuerte de Cabo con dachshund frente al concepto POV anterior de Book Japan.",
        },
        {
          ...comparisonPairs[1],
          title: "POC vs pipeline estructurado",
          description:
            "Observa el salto entre la primera prueba de concepto y el render posterior impulsado por pipeline.",
        },
      ],
    },
    logoStudio: {
      title: "Studio de logos con Vertex para Pack.",
      description:
        "Genera un lote de exploraciones numeradas con la ruta local de PackAds + Vertex y luego elige los números que te gusten para empujar la siguiente ronda en esa dirección.",
      promptLabel: "Prompt base",
      promptHint:
        "Empieza por el resultado que quieres, no solo por una lista de objetos. El sistema agrega automáticamente restricciones de mascota, paleta, legibilidad y marca premium.",
      companyLabel: "Nombre de la empresa",
      countLabel: "Cantidad de variaciones",
      refinementLabel: "Nota de iteración",
      refinementHint:
        "Úsalo después de una ronda para decir qué mantener o cambiar, por ejemplo: más emblema, menos caricatura o más apto para app icon.",
      generateLabel: "Generar variantes",
      regenerateLabel: "Empujar otra ronda",
      selectedHeading: "Números seleccionados",
      selectedEmpty:
        "Selecciona los números de variante que te gusten y luego vuelve a generar para seguir en esa dirección.",
      selectedAction: "Usar números seleccionados en la nota",
      brainClusterLabel: "Solicitar ruta brain-cluster",
      brainClusterHint:
        "En este workspace solo está conectada hoy la ruta Vertex de PackAds. Activarlo agrega una advertencia al run para dejar visible la falta del cluster.",
      researchHeading: "Reglas de sistema de marca detrás de los prompts",
      resultHeading: "Variaciones generadas",
      resultHint:
        "Cada imagen recibe un número fijo para que puedas decir cuáles mantener. Internamente la siguiente corrida reutiliza las direcciones seleccionadas antes de volver a generar.",
      latestHeading: "Última ronda generada",
      latestHint:
        "Esta página carga automáticamente desde disco el lote generado más reciente para que primero revises los iconos y solo generes otra vez cuando haga falta.",
      generationControlsHeading: "Generar otra ronda",
      openLocalFile: "Abrir PNG local",
      selectVariantLabel: "Conservar",
      deselectVariantLabel: "Quitar",
    },
    brandAssets: {
      title: "Brand assets en una sola superficie de revisión.",
      description:
        "Usa esta página para inspeccionar la marca Pack en la web y la app: logos, favicons, tarjetas de compartir, iconos de app, splash art y assets adaptativos de Android.",
      assets: brandAssets,
      refinedConceptTitle: "OG card aprobada para la homepage.",
      refinedConceptDescription:
        "Esta es la dirección aprobada para la tarjeta social de la homepage y ya fue promovida al asset OG activo del sitio.",
      refinedConcepts: refinedOgConcepts,
    },
    authCallback: {
      title: "Superficie de revisión del callback OAuth.",
      description:
        "Usa esta página para inspeccionar la transición intermedia del inicio de sesión tal como debe sentirse durante un retorno real de OAuth, incluyendo el estado de espera y el estado de recuperación.",
      processingTitle: "Estado en proceso",
      processingBody:
        "Previsualiza el momento intermedio después de que Google devuelve al usuario a Pack y antes de que el espacio de la app esté listo.",
      processingMessage:
        "Intentando completar tu inicio de sesión. Esto solo debería tardar un momento.",
      errorTitle: "Estado de error",
      errorBody:
        "Previsualiza el estado de recuperación cuando la transición falla y el usuario necesita una forma clara de volver al flujo de inicio de sesión.",
      errorMessage:
        "No pudimos completar el inicio de sesión porque al callback le faltan parámetros requeridos. Intenta iniciar sesión de nuevo.",
    },
    travelDetailReview: {
      title: "Revisión de detail para el corpus de 78 casos.",
      description:
        "Usa esta página para inspeccionar el aggregate final de detail desde PackServer, marcar los casos incorrectos y dejar notas cortas sobre por qué el payload de detail está mal.",
      statsLabel: "Progreso de revisión",
      wrongFilter: "Incorrectos",
      needsValidationFilter: "Necesita validación",
      okFilter: "Correctos",
      unreviewedFilter: "Sin revisar",
      allFilter: "Todos",
      markWrong: "Marcar incorrecto",
      markNeedsValidation: "Validar fechas/ciudades",
      markOk: "Marcar correcto",
      clearReview: "Limpiar",
      notesLabel: "¿Por qué está mal?",
      sourceLabel: "Fuente del aggregate",
      failedLabel: "Falló la corrida de detail",
      promptLabel: "Prompt",
      detailLabel: "Salida raw de detail",
    },
    crumbs: {
      labs: "Labs",
      logoStudio: "Logo studio",
      videos: "Videos",
      comparisons: "Comparaciones",
      brandAssets: "Brand assets",
      authCallback: "Auth callback",
      travelDetailReview: "Travel detail review",
    },
  },
} as const;

const loadTravelDetailReviewState = (): TravelDetailReviewState => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(TRAVEL_DETAIL_REVIEW_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed as TravelDetailReviewState;
  } catch {
    return {};
  }
};

const persistTravelDetailReviewState = (
  nextState: TravelDetailReviewState,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    TRAVEL_DETAIL_REVIEW_STORAGE_KEY,
    JSON.stringify(nextState),
  );
};

const summarizeTravelDetailOutput = (
  output: TravelDetailReviewOutput,
): string[] => {
  const lines: string[] = [];
  lines.push(`kind: ${output.kind ?? "unknown"}`);

  if (output.location) {
    lines.push(
      `location: ${output.location.label}${
        output.location.cityCode ? ` (${output.location.cityCode})` : ""
      }`,
    );
  } else {
    lines.push("location: none");
  }

  if (output.timing?.startDate || output.timing?.endDate) {
    lines.push(
      `timing: ${output.timing?.startDate ?? "?"} -> ${output.timing?.endDate ?? "?"}`,
    );
  } else {
    lines.push("timing: none");
  }

  if (output.products) {
    const productSummary = Object.entries(output.products)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");
    lines.push(`products: ${productSummary}`);
  }

  if (output.constraintStrength) {
    lines.push(`constraint: ${output.constraintStrength}`);
  }

  if (output.grounding) {
    lines.push(
      `grounding: loc=${String(output.grounding.locationGrounded ?? false)} time=${String(output.grounding.timeGrounded ?? false)}`,
    );
  }

  return lines;
};

const LabsShell: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => {
  const { locale } = useI18n();
  const localizedContent = labsContent[locale];

  return (
    <Page>
      <Helmet>
        <title>{buildVideoTitle(title)}</title>
        <meta name="description" content={description} />
      </Helmet>

      <Stack>
        <Hero>
          <Eyebrow>{localizedContent.eyebrow}</Eyebrow>
          <Title>{title}</Title>
          <Intro>{description}</Intro>
          <HeroNote>{localizedContent.heroNote}</HeroNote>
        </Hero>
        {children}
      </Stack>
    </Page>
  );
};

export const LabsHomePage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];

  return (
    <LabsShell
      title={localizedContent.home.title}
      description={localizedContent.home.description}
    >
      <Grid>
        {localizedContent.home.sections.map((section) => (
          <SectionCard key={section.slug}>
            <Kicker>{section.kicker}</Kicker>
            <CardTitle>{section.title}</CardTitle>
            <CardBody>{section.description}</CardBody>
            <LinkRow>
              <SectionLink to={pathFor(section.href)}>{localizedContent.openSection}</SectionLink>
            </LinkRow>
          </SectionCard>
        ))}
      </Grid>
    </LabsShell>
  );
};

export const LabsVideosPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];

  return (
    <LabsShell
      title={localizedContent.videos.title}
      description={localizedContent.videos.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/videos")}>{localizedContent.crumbs.videos}</BreadcrumbLink>
      </BreadcrumbRow>
      <Grid>
        {localizedContent.videos.videoGroups.map((group) => (
          <VideoGroupCard key={group.slug}>
            <Meta>
              <Kicker>{group.tags.join(" · ")}</Kicker>
              <CardTitle>{group.title}</CardTitle>
              <CardBody>{group.description}</CardBody>
              <TagRow>
                {group.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </TagRow>
            </Meta>
            <VariantGrid>
              {group.variants.map((video) => {
                const previewUrl = toViteFsUrl(video.localPath);
                const isFeatured = video.slug === group.featuredVideoSlug;

                return (
                  <VideoVariantCard key={video.slug}>
                    <VideoFrame>
                      <InlineVideo controls preload="metadata" playsInline src={previewUrl} />
                    </VideoFrame>
                    <Meta>
                      <VariantHeader>
                        <VariantTitle>{video.title}</VariantTitle>
                        {isFeatured ? <Tag>Featured</Tag> : null}
                      </VariantHeader>
                      <CardBody>{video.description}</CardBody>
                      <TagRow>
                        {video.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </TagRow>
                      <LinkRow>
                        <PrimaryLink href={previewUrl} target="_blank" rel="noreferrer">
                          {localizedContent.openPreview}
                        </PrimaryLink>
                        <SecondaryLink href={previewUrl} download>
                          {localizedContent.downloadLocalCopy}
                        </SecondaryLink>
                      </LinkRow>
                      <PathLabel>{video.localPath}</PathLabel>
                    </Meta>
                  </VideoVariantCard>
                );
              })}
            </VariantGrid>
          </VideoGroupCard>
        ))}
      </Grid>
    </LabsShell>
  );
};

export const LabsComparisonsPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];
  const localizedVideos = new Map(
    localizedContent.videos.videoGroups
      .flatMap((group) => group.variants)
      .map((video) => [video.slug, video]),
  );

  return (
    <LabsShell
      title={localizedContent.comparisons.title}
      description={localizedContent.comparisons.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/comparisons")}>{localizedContent.crumbs.comparisons}</BreadcrumbLink>
      </BreadcrumbRow>
      <Grid>
        {localizedContent.comparisons.pairs.map((pair) => {
          const leftVideo = localizedVideos.get(pair.leftVideoSlug);
          const rightVideo = localizedVideos.get(pair.rightVideoSlug);

          if (!leftVideo || !rightVideo) {
            return null;
          }

          return (
            <ComparisonCard key={pair.slug}>
              <Meta>
                <CardTitle>{pair.title}</CardTitle>
                <CardBody>{pair.description}</CardBody>
              </Meta>
              <ComparisonGrid>
                {[leftVideo, rightVideo].map((video) => (
                  <div key={video.slug}>
                    <VideoFrame>
                      <InlineVideo
                        controls
                        preload="metadata"
                        playsInline
                        src={toViteFsUrl(video.localPath)}
                      />
                    </VideoFrame>
                    <Meta>
                      <CardTitle>{video.title}</CardTitle>
                      <CardBody>{video.description}</CardBody>
                      <TagRow>
                        {video.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </TagRow>
                      <LinkRow>
                        <PrimaryLink
                          href={toViteFsUrl(video.localPath)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {localizedContent.openPreview}
                        </PrimaryLink>
                        <SecondaryLink href={toViteFsUrl(video.localPath)} download>
                          {localizedContent.downloadLocalCopy}
                        </SecondaryLink>
                      </LinkRow>
                      <PathLabel>{video.localPath}</PathLabel>
                    </Meta>
                  </div>
                ))}
              </ComparisonGrid>
            </ComparisonCard>
          );
        })}
      </Grid>
    </LabsShell>
  );
};

export const LabsLogoStudioPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];
  const [companyName, setCompanyName] = React.useState("Pack");
  const [prompt, setPrompt] = React.useState(getDefaultLogoStudioPrompt());
  const [count, setCount] = React.useState("6");
  const [refinementNote, setRefinementNote] = React.useState("");
  const [requestBrainCluster, setRequestBrainCluster] = React.useState(false);
  const [selectedPresetIds, setSelectedPresetIds] = React.useState<string[]>([]);
  const [currentRun, setCurrentRun] = React.useState<LogoLabRun | null>(null);
  const latestRunQuery = useQuery({
    queryKey: ["labs", "logo-studio", "latest-run"],
    queryFn: fetchLatestLogoLabRun,
    staleTime: 1000 * 30,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: generateLogoLabRun,
    onSuccess: (run) => {
      setCurrentRun(run);
      setSelectedPresetIds(run.selectedPresetIds);
    },
  });
  const displayedRun = currentRun ?? latestRunQuery.data ?? null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void generateMutation.mutateAsync({
      companyName,
      prompt,
      count: Number(count),
      refinementNote,
      selectedPresetIds,
      requestBrainCluster,
    });
  };

  const togglePresetSelection = (presetId: string) => {
    setSelectedPresetIds((current) =>
      current.includes(presetId)
        ? current.filter((value) => value !== presetId)
        : [...current, presetId],
    );
  };

  const selectedPresets = LOGO_VARIATION_PRESETS.filter((preset) =>
    selectedPresetIds.includes(preset.id),
  );
  const selectedNumbers = (displayedRun?.variants ?? [])
    .filter((variant) => selectedPresetIds.includes(variant.presetId))
    .map((variant) => `#${variant.number}`);

  const applySelectedNumbersToNote = () => {
    if (selectedPresets.length === 0) {
      return;
    }

    const selectedLabels = selectedPresets.map((preset) => preset.label).join(", ");
    const numberLabel = selectedNumbers.join(", ");
    setRefinementNote(
      `Push further toward ${selectedLabels}${numberLabel ? ` from ${numberLabel}` : ""}. Keep the strongest silhouette and premium black-and-gold restraint, but tighten the icon readability.`,
    );
  };

  return (
    <LabsShell
      title={localizedContent.logoStudio.title}
      description={localizedContent.logoStudio.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/logo-studio")}>
          {localizedContent.crumbs.logoStudio}
        </BreadcrumbLink>
      </BreadcrumbRow>
      <SectionHeading>
        <SectionTitle>{localizedContent.logoStudio.latestHeading}</SectionTitle>
        <SectionDescription>
          {displayedRun
            ? `${displayedRun.companyName} · ${displayedRun.generatedAt}`
            : localizedContent.logoStudio.latestHint}
        </SectionDescription>
      </SectionHeading>
      {latestRunQuery.isError && !currentRun ? (
        <Notice>
          {latestRunQuery.error instanceof Error
            ? latestRunQuery.error.message
            : "No generated logo round is available yet."}
        </Notice>
      ) : null}
      {displayedRun ? (
        <>
          <IconWall aria-label="App-size icon comparison">
            <IconWallHeader>
              <IconWallTitle>App-Size Comparison</IconWallTitle>
              <IconWallBody>
                This view approximates home-screen scale so you can judge what
                actually reads as an iPhone app icon before looking at the large
                previews.
              </IconWallBody>
            </IconWallHeader>
            <IconWallGrid>
              {displayedRun.variants.map((variant) => (
                <IconWallItem key={`${variant.id}-app-size`}>
                  <IconWallNumber>{variant.number}</IconWallNumber>
                  <IconWallSurface>
                    <IconWallImage
                      src={variant.previewUrl}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                  </IconWallSurface>
                  <IconWallLabel>#{variant.number}</IconWallLabel>
                </IconWallItem>
              ))}
            </IconWallGrid>
          </IconWall>
          <ResultsGrid>
            {displayedRun.variants.map((variant) => {
              const isSelected = selectedPresetIds.includes(variant.presetId);
              return (
                <VariantCard key={variant.id} $selected={isSelected}>
                  <VariantImageFrame>
                    <VariantNumber>{variant.number}</VariantNumber>
                    <VariantImage
                      src={variant.previewUrl}
                      alt={`${variant.presetLabel} logo exploration`}
                      loading="lazy"
                    />
                    <VariantAppSizeDock>
                      <VariantAppSizeLabel>App Size</VariantAppSizeLabel>
                      <VariantAppSizeSurface>
                        <VariantAppSizeImage
                          src={variant.previewUrl}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                        />
                      </VariantAppSizeSurface>
                    </VariantAppSizeDock>
                  </VariantImageFrame>
                  <Meta>
                    <Kicker>{variant.presetLabel}</Kicker>
                    <CardTitle>{variant.direction}</CardTitle>
                    <CardBody>{variant.prompt}</CardBody>
                    <LinkRow>
                      <PrimaryButton
                        type="button"
                        onClick={() => togglePresetSelection(variant.presetId)}
                      >
                        {isSelected
                          ? localizedContent.logoStudio.deselectVariantLabel
                          : `${localizedContent.logoStudio.selectVariantLabel} #${variant.number}`}
                      </PrimaryButton>
                      <SecondaryLink
                        href={variant.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {localizedContent.logoStudio.openLocalFile}
                      </SecondaryLink>
                    </LinkRow>
                  </Meta>
                </VariantCard>
              );
            })}
          </ResultsGrid>
        </>
      ) : null}
      <StudioGrid>
        <StudioPanel>
          <SectionHeading>
            <SectionTitle>{localizedContent.logoStudio.generationControlsHeading}</SectionTitle>
            <SectionDescription>
              {localizedContent.logoStudio.latestHint}
            </SectionDescription>
          </SectionHeading>
          <StudioForm onSubmit={handleSubmit}>
            <FieldBlock>
              <FieldLabel>{localizedContent.logoStudio.promptLabel}</FieldLabel>
              <FieldTextArea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </FieldBlock>
            <FieldGrid>
              <FieldBlock>
                <FieldLabel>{localizedContent.logoStudio.companyLabel}</FieldLabel>
                <FieldInput
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </FieldBlock>
              <FieldBlock>
                <FieldLabel>{localizedContent.logoStudio.countLabel}</FieldLabel>
                <FieldSelect
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                >
                  {["4", "6", "8"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FieldSelect>
              </FieldBlock>
            </FieldGrid>
            <FieldBlock>
              <FieldLabel>{localizedContent.logoStudio.refinementLabel}</FieldLabel>
              <FieldTextArea
                value={refinementNote}
                onChange={(event) => setRefinementNote(event.target.value)}
              />
              <FieldHint>{localizedContent.logoStudio.refinementHint}</FieldHint>
            </FieldBlock>
            <CheckboxRow>
              <input
                type="checkbox"
                checked={requestBrainCluster}
                onChange={(event) => setRequestBrainCluster(event.target.checked)}
              />
              <span>{localizedContent.logoStudio.brainClusterLabel}</span>
            </CheckboxRow>
            <FieldHint>{localizedContent.logoStudio.brainClusterHint}</FieldHint>
            <StudioActionRow>
              <PrimaryButton type="submit" disabled={generateMutation.isPending}>
                {currentRun
                  ? localizedContent.logoStudio.regenerateLabel
                  : localizedContent.logoStudio.generateLabel}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                disabled={selectedPresets.length === 0}
                onClick={applySelectedNumbersToNote}
              >
                {localizedContent.logoStudio.selectedAction}
              </SecondaryButton>
            </StudioActionRow>
          </StudioForm>
          {generateMutation.isError ? (
            <ErrorNotice>
              {generateMutation.error instanceof Error
                ? generateMutation.error.message
                : "Generation failed."}
            </ErrorNotice>
          ) : null}
          {currentRun?.warnings.length ? (
            <Stack>
              {currentRun.warnings.map((warning) => (
                <Notice key={warning}>{warning}</Notice>
              ))}
            </Stack>
          ) : null}
        </StudioPanel>
        <StudioPanel>
          <SectionHeading>
            <SectionTitle>{localizedContent.logoStudio.researchHeading}</SectionTitle>
            <SectionDescription>
              {localizedContent.logoStudio.resultHint}
            </SectionDescription>
          </SectionHeading>
          <HelperList>
            {LOGO_BRANDING_RESEARCH_PRINCIPLES.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </HelperList>
          <Notice>
            {localizedContent.logoStudio.selectedHeading}:{" "}
            {selectedNumbers.length > 0
              ? selectedNumbers.join(", ")
              : localizedContent.logoStudio.selectedEmpty}
          </Notice>
          {selectedPresets.length > 0 ? (
            <SelectionSummary>
              {selectedPresets.map((preset) => (
                <SelectionChip key={preset.id}>{preset.label}</SelectionChip>
              ))}
            </SelectionSummary>
          ) : null}
        </StudioPanel>
      </StudioGrid>
    </LabsShell>
  );
};

export const LabsBrandAssetsPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];

  return (
    <LabsShell
      title={localizedContent.brandAssets.title}
      description={localizedContent.brandAssets.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/brand-assets")}>
          {localizedContent.crumbs.brandAssets}
        </BreadcrumbLink>
      </BreadcrumbRow>
      <Grid>
        {localizedContent.brandAssets.assets.map((asset) => (
          <AssetCard key={asset.slug}>
            <AssetPreview>
              <AssetImage src={asset.src} alt={asset.title} loading="lazy" />
            </AssetPreview>
            <Meta>
              <Kicker>{asset.kicker}</Kicker>
              <CardTitle>{asset.title}</CardTitle>
              <CardBody>{asset.description}</CardBody>
              <PathLabel>{asset.pathLabel}</PathLabel>
            </Meta>
          </AssetCard>
        ))}
      </Grid>
      <SectionHeading>
        <SectionTitle>{localizedContent.brandAssets.refinedConceptTitle}</SectionTitle>
        <SectionDescription>
          {localizedContent.brandAssets.refinedConceptDescription}
        </SectionDescription>
      </SectionHeading>
      <Grid>
        {localizedContent.brandAssets.refinedConcepts.map((concept) => (
          <ConceptCard key={concept.slug}>
            <AssetPreview>
              <AssetImage src={concept.src} alt={concept.title} loading="lazy" />
            </AssetPreview>
            <Meta>
              <Kicker>
                {concept.verdict === "closest"
                  ? "Closest"
                  : concept.verdict === "promising"
                    ? "Promising"
                    : "Mixed result"}
              </Kicker>
              <CardTitle>{concept.title}</CardTitle>
              <CardBody>{concept.description}</CardBody>
              <PathLabel>{concept.prompt}</PathLabel>
            </Meta>
          </ConceptCard>
        ))}
      </Grid>
    </LabsShell>
  );
};

export const LabsAuthCallbackPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];

  return (
    <LabsShell
      title={localizedContent.authCallback.title}
      description={localizedContent.authCallback.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/auth-callback")}>
          {localizedContent.crumbs.authCallback}
        </BreadcrumbLink>
      </BreadcrumbRow>
      <ComparisonGrid>
        <SurfacePreviewCard>
          <Meta>
            <Kicker>{localizedContent.authCallback.processingTitle}</Kicker>
            <CardTitle>{localizedContent.authCallback.processingTitle}</CardTitle>
            <CardBody>{localizedContent.authCallback.processingBody}</CardBody>
          </Meta>
          <SurfaceFrame>
            <AuthCallbackSurface
              state="processing"
              detailMessage={localizedContent.authCallback.processingMessage}
            />
          </SurfaceFrame>
        </SurfacePreviewCard>
        <SurfacePreviewCard>
          <Meta>
            <Kicker>{localizedContent.authCallback.errorTitle}</Kicker>
            <CardTitle>{localizedContent.authCallback.errorTitle}</CardTitle>
            <CardBody>{localizedContent.authCallback.errorBody}</CardBody>
          </Meta>
          <SurfaceFrame>
            <AuthCallbackSurface
              state="error"
              detailMessage={localizedContent.authCallback.errorMessage}
            />
          </SurfaceFrame>
        </SurfacePreviewCard>
      </ComparisonGrid>
    </LabsShell>
  );
};

export const LabsTravelDetailReviewPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];
  const [filter, setFilter] = React.useState<
    "all" | "wrong" | "needs_validation" | "ok" | "unreviewed"
  >("all");
  const [reviewState, setReviewState] = React.useState<TravelDetailReviewState>(
    () => loadTravelDetailReviewState(),
  );

  const detailReviewQuery = useQuery({
    queryKey: ["labs", "travel-detail-review", "detail-aggregate"],
    queryFn: () => fetchTravelDetailReviewAggregate(),
    staleTime: Infinity,
    retry: false,
  });

  const setVerdict = (
    caseId: string,
    verdict: TravelDetailVerdict | undefined,
  ) => {
    setReviewState((current) => {
      const nextState: TravelDetailReviewState = {
        ...current,
        [caseId]: {
          ...current[caseId],
          verdict,
        },
      };
      if (!nextState[caseId]?.verdict && !nextState[caseId]?.note) {
        delete nextState[caseId];
      }
      persistTravelDetailReviewState(nextState);
      return nextState;
    });
  };

  const setNote = (caseId: string, note: string) => {
    setReviewState((current) => {
      const trimmed = note.trim();
      const nextState: TravelDetailReviewState = {
        ...current,
        [caseId]: {
          ...current[caseId],
          note,
        },
      };
      if (!nextState[caseId]?.verdict && !trimmed) {
        delete nextState[caseId];
      }
      persistTravelDetailReviewState(nextState);
      return nextState;
    });
  };

  const filteredResults = React.useMemo(() => {
    const results = detailReviewQuery.data?.results ?? [];
    return results.filter((result) => {
      const verdict = reviewState[result.caseId]?.verdict;
      if (filter === "wrong") {
        return verdict === "wrong";
      }
      if (filter === "ok") {
        return verdict === "ok";
      }
      if (filter === "needs_validation") {
        return verdict === "needs_validation";
      }
      if (filter === "unreviewed") {
        return !verdict;
      }
      return true;
    });
  }, [detailReviewQuery.data?.results, filter, reviewState]);

  const reviewStats = React.useMemo(() => {
    const reviews = Object.values(reviewState);
    return {
      wrong: reviews.filter((value) => value.verdict === "wrong").length,
      needsValidation: reviews.filter(
        (value) => value.verdict === "needs_validation",
      ).length,
      ok: reviews.filter((value) => value.verdict === "ok").length,
      unreviewed: Math.max(
        (detailReviewQuery.data?.results.length ?? 0) - reviews.length,
        0,
      ),
    };
  }, [detailReviewQuery.data?.results.length, reviewState]);

  return (
    <LabsShell
      title={localizedContent.travelDetailReview.title}
      description={localizedContent.travelDetailReview.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/travel-detail-review")}>
          {localizedContent.crumbs.travelDetailReview}
        </BreadcrumbLink>
      </BreadcrumbRow>
      <Stack>
        <FilterRow>
          <ReviewStats aria-label={localizedContent.travelDetailReview.statsLabel}>
            <ReviewPill>
              {localizedContent.travelDetailReview.statsLabel}:{" "}
              {detailReviewQuery.data?.passedCount ?? 0}/{detailReviewQuery.data?.totalCases ?? 0}{" "}
              passed
            </ReviewPill>
            <ReviewPill>{reviewStats.wrong} wrong</ReviewPill>
            <ReviewPill>{reviewStats.needsValidation} needs validation</ReviewPill>
            <ReviewPill>{reviewStats.ok} ok</ReviewPill>
            <ReviewPill>{reviewStats.unreviewed} unreviewed</ReviewPill>
          </ReviewStats>
          <FilterButton
            type="button"
            $active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            {localizedContent.travelDetailReview.allFilter}
          </FilterButton>
          <FilterButton
            type="button"
            $active={filter === "wrong"}
            onClick={() => setFilter("wrong")}
          >
            {localizedContent.travelDetailReview.wrongFilter}
          </FilterButton>
          <FilterButton
            type="button"
            $active={filter === "needs_validation"}
            onClick={() => setFilter("needs_validation")}
          >
            {localizedContent.travelDetailReview.needsValidationFilter}
          </FilterButton>
          <FilterButton
            type="button"
            $active={filter === "ok"}
            onClick={() => setFilter("ok")}
          >
            {localizedContent.travelDetailReview.okFilter}
          </FilterButton>
          <FilterButton
            type="button"
            $active={filter === "unreviewed"}
            onClick={() => setFilter("unreviewed")}
          >
            {localizedContent.travelDetailReview.unreviewedFilter}
          </FilterButton>
        </FilterRow>
        <PathLabel>
          {localizedContent.travelDetailReview.sourceLabel}:{" "}
          /Users/noahmitsuhashi/Code/PackAll/PackServer/tmp/travel-extraction-stage-corpus/2026-04-10T05-34-34-314Z-25a9579a/aggregate.json
        </PathLabel>
      </Stack>
      {detailReviewQuery.isLoading ? (
        <Notice>Loading detail aggregate…</Notice>
      ) : null}
      {detailReviewQuery.isError ? (
        <ErrorNotice>
          {detailReviewQuery.error instanceof Error
            ? detailReviewQuery.error.message
            : "Failed to load detail aggregate."}
        </ErrorNotice>
      ) : null}
      {detailReviewQuery.data ? (
        <Grid>
          {filteredResults.map((result: TravelDetailReviewResult) => {
            const review = reviewState[result.caseId];
            const verdict = review?.verdict;
            const casePrompt = result.artifact?.message ?? "";
            const legs = result.artifact?.legs ?? [];

            return (
              <ReviewCard key={result.caseId}>
                <ReviewHeader>
                  <ReviewMetaColumn>
                    <Kicker>{result.passed ? "Passed detail" : localizedContent.travelDetailReview.failedLabel}</Kicker>
                    <CardTitle>{result.caseId}</CardTitle>
                    <CardBody>{localizedContent.travelDetailReview.promptLabel}</CardBody>
                  </ReviewMetaColumn>
                  <ReviewActions>
                    <ReviewActionButton
                      type="button"
                      $tone="wrong"
                      onClick={() => setVerdict(result.caseId, "wrong")}
                    >
                      {verdict === "wrong" ? "Wrong marked" : localizedContent.travelDetailReview.markWrong}
                    </ReviewActionButton>
                    <ReviewActionButton
                      type="button"
                      $tone="needsValidation"
                      onClick={() =>
                        setVerdict(result.caseId, "needs_validation")
                      }
                    >
                      {verdict === "needs_validation"
                        ? "Needs validation marked"
                        : localizedContent.travelDetailReview.markNeedsValidation}
                    </ReviewActionButton>
                    <ReviewActionButton
                      type="button"
                      $tone="ok"
                      onClick={() => setVerdict(result.caseId, "ok")}
                    >
                      {verdict === "ok" ? "OK marked" : localizedContent.travelDetailReview.markOk}
                    </ReviewActionButton>
                    <ReviewActionButton
                      type="button"
                      $tone="neutral"
                      onClick={() => setVerdict(result.caseId, undefined)}
                    >
                      {localizedContent.travelDetailReview.clearReview}
                    </ReviewActionButton>
                  </ReviewActions>
                </ReviewHeader>
                <PromptPanel>{casePrompt}</PromptPanel>
                {result.error ? <ErrorNotice>{result.error}</ErrorNotice> : null}
                {legs.length > 0 ? (
                  <ReviewLegGrid>
                    {legs.map((leg) => {
                      const detailOutput =
                        leg.stages.find((stage) => stage.stage === "detail")
                          ?.output as TravelDetailReviewOutput | undefined;

                      return (
                        <ReviewLegCard key={leg.legId}>
                          <Meta>
                            <Kicker>{leg.kind}</Kicker>
                            <CardTitle>{leg.title}</CardTitle>
                            {detailOutput ? (
                              <CardBody>
                                {summarizeTravelDetailOutput(detailOutput).join(" · ")}
                              </CardBody>
                            ) : (
                              <CardBody>No detail output</CardBody>
                            )}
                          </Meta>
                          <CardBody>{localizedContent.travelDetailReview.detailLabel}</CardBody>
                          <JsonBlock>
                            {JSON.stringify(detailOutput ?? null, null, 2)}
                          </JsonBlock>
                        </ReviewLegCard>
                      );
                    })}
                  </ReviewLegGrid>
                ) : null}
                <div>
                  <CardBody>{localizedContent.travelDetailReview.notesLabel}</CardBody>
                  <ReviewTextArea
                    value={review?.note ?? ""}
                    onChange={(event) =>
                      setNote(result.caseId, event.target.value)
                    }
                    placeholder="Placeholder locations, fake grounding, wrong timing, etc."
                  />
                </div>
              </ReviewCard>
            );
          })}
        </Grid>
      ) : null}
    </LabsShell>
  );
};

const LabsPage: React.FC = () => {
  return <LabsHomePage />;
};

export default LabsPage;
