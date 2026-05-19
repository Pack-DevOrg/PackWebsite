import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  fetchLatestLogoLabRun,
  fetchLatestVideoLabManifest,
  fetchTravelDetailReviewAggregate,
  generateVideoLabRun,
  generateLogoLabRun,
} from "@/api/labs";
import { useI18n } from "@/i18n/I18nProvider";
import { AuthCallbackSurface } from "@/pages/AuthCallbackPage";
import type {
  LogoLabRun,
  TravelDetailReviewOutput,
  TravelDetailReviewResult,
  VideoLabManifest,
  VideoLabVariant,
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

type Soundmark = {
  slug: string;
  title: string;
  useCase: string;
  description: string;
  src: string;
  duration: string;
};

type SoundmarkScenario = {
  label: string;
  soundmarkSlug: Soundmark["slug"];
};

type DesignLabConcept = {
  slug: string;
  label: string;
  title: string;
  thesis: string;
  focus: string[];
};

type DesignLabSignal = {
  label: string;
  value: string;
  detail: string;
};

type ReferenceSoundmark = Soundmark & {
  sourceUrl: string;
  username: string;
  rating: number | null;
  ratingCount: number;
  tags: string[];
  foundBy: string;
  rank: number;
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
    featuredVideoSlug: "pack-travel-podcast-two-women-v6",
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
      {
        slug: "pack-travel-podcast-two-women-v5",
        title: "Variant 5",
        description:
          "Separate cream couches, left guest sitting criss-cross applesauce, subtler feet, and a cuter women-led podcast set with real generated audio.",
        tags: ["Featured", "Criss-cross posture", "Cute set", "Real audio"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/poc/pack_travel_podcast_two_women_v5.subtitled.mp4",
      },
      {
        slug: "pack-travel-podcast-two-women-v6",
        title: "Variant 6",
        description:
          "Wide master plus face-focused singles, with explicit no fan-service framing constraints and real generated audio.",
        tags: ["Featured", "Face-focused singles", "Wide master", "Real audio"],
        localPath:
          "/Users/noahmitsuhashi/Code/PackAll/PackAds/demo_project/exports/poc/pack_travel_podcast_two_women_v6.subtitled.mp4",
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

const soundmarks: Soundmark[] = [
  {
    slug: "passport-stamp-chime",
    title: "Passport Stamp Chime",
    useCase: "Primary brand sound",
    description:
      "A tactile stamp click followed by a warm two-note lift for the moment Pack captures a travel detail.",
    src: "/labs/soundmarks/passport-stamp-chime.wav",
    duration: "0.75s",
  },
  {
    slug: "packed-chime",
    title: "Packed Chime",
    useCase: "Trip ready",
    description:
      "A clean rising confirmation for a generated itinerary, imported booking, or successful save.",
    src: "/labs/soundmarks/packed-chime.wav",
    duration: "0.90s",
  },
  {
    slug: "compass-ping",
    title: "Compass Ping",
    useCase: "Live travel update",
    description:
      "A bright locator tone for airport timing, route, or other travel-day changes.",
    src: "/labs/soundmarks/compass-ping.wav",
    duration: "0.84s",
  },
  {
    slug: "pack-pulse",
    title: "Pack Pulse",
    useCase: "Calm notification",
    description:
      "A soft tap-and-tone reminder for useful notifications that should not feel urgent.",
    src: "/labs/soundmarks/pack-pulse.wav",
    duration: "0.80s",
  },
  {
    slug: "gentle-nudge",
    title: "Gentle Nudge",
    useCase: "Needs attention",
    description:
      "A tiny prompt for missing traveler details, quiet reminders, or incomplete setup.",
    src: "/labs/soundmarks/gentle-nudge.wav",
    duration: "0.45s",
  },
];

const soundmarkScenarios: SoundmarkScenario[] = [
  {
    label: "Email confirmation imported",
    soundmarkSlug: "passport-stamp-chime",
  },
  {
    label: "Your trip is ready",
    soundmarkSlug: "packed-chime",
  },
  {
    label: "Airport timing changed",
    soundmarkSlug: "compass-ping",
  },
  {
    label: "Add traveler details",
    soundmarkSlug: "gentle-nudge",
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

const designLabConcepts: DesignLabConcept[] = [
  {
    slug: "command-center",
    label: "01",
    title: "Command Center",
    thesis: "One instruction. One live route. No hunting.",
    focus: ["What now", "What changed", "What to share"],
  },
  {
    slug: "trip-sheet",
    label: "02",
    title: "Trip Sheet",
    thesis: "A day reads like a map, not a spreadsheet.",
    focus: ["Route first", "Day rhythm", "Travel gaps"],
  },
  {
    slug: "artifact-cards",
    label: "03",
    title: "Artifact Cards",
    thesis: "Every reservation becomes an object you recognize instantly.",
    focus: ["Wallet stack", "Real proof", "Material memory"],
  },
  {
    slug: "connected-sources",
    label: "04",
    title: "Connected Sources",
    thesis: "Show the output before asking for trust.",
    focus: ["Input -> output", "Bounded access", "Latest win"],
  },
  {
    slug: "setup-passport",
    label: "05",
    title: "Setup Passport",
    thesis: "Setup feels like becoming trip-ready, not doing chores.",
    focus: ["Passport cover", "Stamps", "Blank visas"],
  },
  {
    slug: "memory-mode",
    label: "06",
    title: "Memory Mode",
    thesis: "Past trips feel private, warm, and worth reopening.",
    focus: ["Photo rhythm", "Quiet captions", "Locked by default"],
  },
  {
    slug: "packs-permissions",
    label: "07",
    title: "Packs Permissions",
    thesis: "Sharing shows the exact result before anything leaves.",
    focus: ["Recipient view", "Visible", "Hidden"],
  },
];

const designLabSignals: DesignLabSignal[] = [
  {
    label: "Quality bar",
    value: "Specific travel surfaces",
    detail: "Every module has to earn its shape from a traveler job, not from a dashboard template.",
  },
  {
    label: "Prototype intent",
    value: "Decision-ready",
    detail: "This lab is built to compare directions and pick implementation slices for mobile.",
  },
  {
    label: "Product value",
    value: "Less generic, more Pack",
    detail: "The redesign foregrounds imported proof, timing, route context, and collaboration boundaries.",
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

const SoundmarkCard = styled.article<{ $active?: boolean }>`
  grid-column: span 4;
  display: flex;
  min-height: 17rem;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.1rem;
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary.main : theme.colors.border.light};
  border-radius: 24px;
  padding: 1rem;
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.08), transparent 26%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow:
    ${({ $active }) =>
      $active ? "0 0 0 3px rgba(243, 210, 122, 0.14)," : ""}
    ${({ theme }) => theme.colors.shadow.medium};

  @media (max-width: 1080px) {
    grid-column: span 6;
  }

  @media (max-width: 900px) {
    grid-column: span 1;
  }
`;

const SoundmarkControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
`;

const SoundmarkButton = styled.button`
  display: inline-flex;
  min-width: 7rem;
  min-height: 2.8rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary.gradient};
  color: #14110d;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 16px 34px rgba(243, 210, 122, 0.2);

  &:focus-visible {
    outline: 3px solid rgba(243, 210, 122, 0.45);
    outline-offset: 3px;
  }
`;

const DurationLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.86rem;
`;

const SoundmarkStatus = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 22px;
  background: rgba(255, 248, 236, 0.05);
  padding: 1rem;
`;

const NowPlayingLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.86rem;
`;

const NowPlayingValue = styled.strong`
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ScenarioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const ScenarioButton = styled.button`
  display: flex;
  min-height: 5.7rem;
  flex-direction: column;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 18px;
  background: rgba(255, 248, 236, 0.05);
  padding: 0.9rem;
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: left;
  font: inherit;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.light};
  }

  &:focus-visible {
    outline: 3px solid rgba(243, 210, 122, 0.45);
    outline-offset: 3px;
  }
`;

const ScenarioLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const ScenarioSound = styled.strong`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.96rem;
`;

const SoundmarkReviewShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 46rem;
  margin: 0 auto;
  width: 100%;
`;

const SoundmarkReviewCard = styled.article`
  display: flex;
  min-height: 26rem;
  flex-direction: column;
  justify-content: center;
  gap: 1.35rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 28px;
  padding: clamp(1.4rem, 4vw, 2.2rem);
  text-align: center;
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.1), transparent 30%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const SoundmarkReviewTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.02;
  letter-spacing: -0.04em;
`;

const SoundmarkReviewMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
`;

const SoundmarkReviewControls = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.8rem;
  align-items: center;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const SoundmarkReviewButton = styled.button<{ $tone?: "yes" | "no" | "play" }>`
  min-height: ${({ $tone }) => ($tone === "play" ? "4.5rem" : "4rem")};
  min-width: ${({ $tone }) => ($tone === "play" ? "11rem" : "0")};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === "yes"
        ? theme.colors.primary.light
        : $tone === "no"
          ? theme.colors.secondary.main
          : theme.colors.border.light};
  border-radius: 14px;
  background: ${({ theme, $tone }) =>
    $tone === "play"
      ? theme.colors.primary.gradient
      : $tone === "yes"
        ? "rgba(243, 210, 122, 0.15)"
        : $tone === "no"
          ? "rgba(231, 35, 64, 0.14)"
          : "rgba(255, 248, 236, 0.05)"};
  color: ${({ $tone, theme }) =>
    $tone === "play" ? "#14110d" : theme.colors.text.primary};
  font: inherit;
  font-size: 1.02rem;
  font-weight: 900;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid rgba(243, 210, 122, 0.45);
    outline-offset: 3px;
  }
`;

const SoundmarkReviewStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.9rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.92rem;

  strong {
    color: ${({ theme }) => theme.colors.primary.light};
  }
`;

const ReviewerPill = styled.div`
  display: inline-flex;
  width: fit-content;
  align-self: center;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.05);
  padding: 0.5rem 0.8rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
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
  min-width: 0;
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

  code {
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;

const ErrorNotice = styled(Notice)`
  border-color: rgba(231, 35, 64, 0.45);
  color: ${({ theme }) => theme.colors.secondary.light};
  background: rgba(231, 35, 64, 0.08);
`;

const DesignLabBoard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(20rem, 0.95fr);
  gap: 1.25rem;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const DesignLabStage = styled.article`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 28px;
  background:
    radial-gradient(circle at 80% 8%, rgba(243, 210, 122, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.07), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.78);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const TravelCanvas = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 38rem;
  padding: clamp(1rem, 3vw, 1.4rem);
  gap: 1rem;
`;

const CanvasTopBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: flex-start;
`;

const CanvasTitleBlock = styled.div`
  min-width: 0;
`;

const CanvasTitle = styled.h2`
  margin: 0.25rem 0 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.65rem, 4vw, 2.45rem);
  line-height: 1;
  letter-spacing: -0.04em;
`;

const CanvasMeta = styled.p`
  margin: 0.65rem 0 0;
  max-width: 42rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.96rem;
  line-height: 1.65;
`;

const DeviceChrome = styled.div`
  align-self: stretch;
  border-radius: 30px;
  border: 1px solid rgba(255, 248, 236, 0.13);
  background:
    linear-gradient(180deg, rgba(8, 8, 8, 0.95), rgba(3, 3, 3, 0.98)),
    #050505;
  padding: 0.75rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 28px 80px rgba(0, 0, 0, 0.36);
`;

const DeviceScreen = styled.div`
  min-height: 29rem;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(255, 248, 236, 0.1);
  background:
    radial-gradient(circle at 86% 0%, rgba(243, 210, 122, 0.12), transparent 30%),
    linear-gradient(145deg, rgba(255, 248, 236, 0.08), transparent 32%),
    linear-gradient(180deg, #191510 0%, #0d0c0b 100%);
`;

const PhoneStatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem 0.25rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.78rem;
  font-weight: 800;
`;

const StatusGlyphs = styled.span`
  letter-spacing: 0.16em;
`;

const PhoneHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 248, 236, 0.09);
`;

const PhoneLabel = styled.span`
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const PhoneTitle = styled.strong`
  display: block;
  margin-top: 0.25rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.1rem;
  line-height: 1.2;
`;

const PhoneBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.24);
  background: rgba(243, 210, 122, 0.1);
  padding: 0 0.75rem;
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
`;

const PhoneBody = styled.div`
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
`;

const PhoneScrollBody = styled(PhoneBody)`
  align-content: start;
  min-height: 31rem;
  max-height: 42rem;
  overflow: hidden;
`;

const PhoneBottomNav = styled.nav`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
  margin: 0.25rem 1rem 1rem;
  border-radius: 22px;
  border: 1px solid rgba(255, 248, 236, 0.1);
  background: rgba(2, 2, 2, 0.42);
  padding: 0.4rem;
`;

const PhoneNavItem = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  min-height: 2.4rem;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: ${({ $active }) =>
    $active ? "rgba(243, 210, 122, 0.16)" : "transparent"};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary.light : theme.colors.text.secondary};
  font-size: 0.72rem;
  font-weight: 800;
`;

const TravelMap = styled.div`
  min-height: 8.5rem;
  border-radius: 22px;
  border: 1px solid rgba(255, 248, 236, 0.1);
  background:
    linear-gradient(135deg, rgba(243, 210, 122, 0.2), transparent 28%),
    linear-gradient(45deg, transparent 48%, rgba(255, 248, 236, 0.16) 49%, rgba(255, 248, 236, 0.16) 51%, transparent 52%),
    radial-gradient(circle at 72% 28%, rgba(231, 35, 64, 0.45) 0 0.35rem, transparent 0.38rem),
    radial-gradient(circle at 24% 70%, rgba(243, 210, 122, 0.65) 0 0.34rem, transparent 0.37rem),
    #242019;
`;

const HeroMap = styled(TravelMap)`
  position: relative;
  min-height: 12rem;
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(38, 173, 198, 0.24), transparent 30%),
    linear-gradient(28deg, transparent 47%, rgba(255, 248, 236, 0.18) 48%, rgba(255, 248, 236, 0.18) 50%, transparent 51%),
    linear-gradient(112deg, transparent 46%, rgba(243, 210, 122, 0.2) 47%, rgba(243, 210, 122, 0.2) 49%, transparent 50%),
    radial-gradient(circle at 68% 32%, rgba(231, 35, 64, 0.72) 0 0.42rem, transparent 0.45rem),
    radial-gradient(circle at 30% 72%, rgba(243, 210, 122, 0.78) 0 0.42rem, transparent 0.45rem),
    radial-gradient(circle at 52% 54%, rgba(38, 173, 198, 0.72) 0 0.36rem, transparent 0.39rem),
    #211e18;
`;

const MapOverlayCard = styled.div`
  position: absolute;
  left: 0.85rem;
  right: 0.85rem;
  bottom: 0.85rem;
  display: grid;
  gap: 0.35rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 248, 236, 0.13);
  background: rgba(7, 7, 7, 0.68);
  padding: 0.75rem;
  backdrop-filter: blur(18px);
`;

const TravelRail = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const RailTile = styled.div`
  min-width: 0;
  border-radius: 18px;
  border: 1px solid rgba(255, 248, 236, 0.11);
  background: rgba(255, 248, 236, 0.05);
  padding: 0.75rem;
`;

const RailLabel = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const RailValue = styled.strong`
  display: block;
  margin-top: 0.35rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.95rem;
  line-height: 1.25;
`;

const ArtifactCode = styled.span`
  display: inline-flex;
  margin-bottom: 0.75rem;
  border-radius: 999px;
  background: rgba(243, 210, 122, 0.13);
  padding: 0.32rem 0.55rem;
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
`;

const SourceList = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const SourceRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  border-radius: 18px;
  border: 1px solid rgba(255, 248, 236, 0.1);
  background: rgba(255, 248, 236, 0.045);
  padding: 0.75rem;
`;

const SourceValue = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.8rem;
`;

const MockSection = styled.section`
  display: grid;
  gap: 0.8rem;
`;

const ActionChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const ActionChip = styled.span`
  display: inline-flex;
  min-height: 2.25rem;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 248, 236, 0.12);
  background: rgba(255, 248, 236, 0.055);
  padding: 0 0.75rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.78rem;
  font-weight: 700;
`;

const TimelineList = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const TimelineItem = styled.div<{ $tone?: "primary" | "warn" | "calm" }>`
  display: grid;
  grid-template-columns: 4.1rem 1fr;
  gap: 0.75rem;
  align-items: start;
  border-radius: 18px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "primary"
        ? "rgba(243, 210, 122, 0.32)"
        : $tone === "warn"
          ? "rgba(231, 35, 64, 0.32)"
          : "rgba(255, 248, 236, 0.1)"};
  background: ${({ $tone }) =>
    $tone === "primary"
      ? "rgba(243, 210, 122, 0.09)"
      : $tone === "warn"
        ? "rgba(231, 35, 64, 0.08)"
        : "rgba(255, 248, 236, 0.045)"};
  padding: 0.75rem;
`;

const TimeBlock = styled.span`
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.04em;
`;

const TicketGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 0.75rem;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const TicketCard = styled.div<{ $accent?: "gold" | "red" }>`
  min-width: 0;
  border-radius: 22px;
  border: 1px solid
    ${({ $accent }) =>
      $accent === "red" ? "rgba(231, 35, 64, 0.32)" : "rgba(243, 210, 122, 0.26)"};
  background:
    linear-gradient(90deg, rgba(255, 248, 236, 0.08), transparent 58%),
    ${({ $accent }) =>
      $accent === "red" ? "rgba(231, 35, 64, 0.08)" : "rgba(243, 210, 122, 0.08)"};
  padding: 0.95rem;
`;

const PassCard = styled(TicketCard)`
  position: relative;
  overflow: hidden;
  min-height: 16rem;
  background:
    radial-gradient(circle at 20% 12%, rgba(255, 248, 236, 0.16), transparent 26%),
    radial-gradient(circle at 78% 10%, rgba(243, 210, 122, 0.2), transparent 28%),
    linear-gradient(180deg, rgba(38, 34, 29, 0.95), rgba(10, 9, 8, 0.95));

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 58%;
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background: #0d0c0b;
  }

  &::before {
    left: -0.6rem;
  }

  &::after {
    right: -0.6rem;
  }
`;

const TicketRoute = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  margin: 0.7rem 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.25rem, 4vw, 1.9rem);
  font-weight: 900;
  letter-spacing: -0.04em;
`;

const Barcode = styled.div`
  height: 2.3rem;
  border-radius: 8px;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255, 248, 236, 0.78) 0 0.12rem,
      transparent 0.12rem 0.28rem,
      rgba(255, 248, 236, 0.52) 0.28rem 0.45rem,
      transparent 0.45rem 0.7rem
    );
  opacity: 0.55;
`;

const LargeBarcode = styled(Barcode)`
  height: 4.4rem;
  margin-top: 0.9rem;
  border-radius: 12px;
  opacity: 0.78;
`;

const PassportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
`;

const StampTile = styled.div<{ $done?: boolean }>`
  min-height: 5.7rem;
  border-radius: 18px;
  border: 1px dashed
    ${({ $done }) =>
      $done ? "rgba(243, 210, 122, 0.45)" : "rgba(255, 248, 236, 0.15)"};
  background: ${({ $done }) =>
    $done ? "rgba(243, 210, 122, 0.11)" : "rgba(255, 248, 236, 0.035)"};
  padding: 0.7rem;
`;

const ProgressTrack = styled.div`
  overflow: hidden;
  height: 0.55rem;
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.09);
`;

const ProgressFill = styled.div<{ $width: string }>`
  height: 100%;
  width: ${({ $width }) => $width};
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.primary.gradient};
`;

const MemoryHero = styled.div`
  min-height: 11rem;
  border-radius: 22px;
  border: 1px solid rgba(255, 248, 236, 0.12);
  background:
    radial-gradient(circle at 72% 28%, rgba(243, 210, 122, 0.32), transparent 24%),
    linear-gradient(135deg, rgba(231, 35, 64, 0.2), transparent 36%),
    linear-gradient(180deg, #2a231b, #0f0d0b);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

const PermissionRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
  border-radius: 18px;
  border: 1px solid rgba(255, 248, 236, 0.1);
  background: rgba(255, 248, 236, 0.045);
  padding: 0.8rem;
`;

const ToggleMock = styled.span<{ $on?: boolean }>`
  position: relative;
  display: inline-flex;
  width: 3.25rem;
  height: 1.85rem;
  flex: 0 0 auto;
  border-radius: 999px;
  background: ${({ $on }) =>
    $on ? "rgba(243, 210, 122, 0.9)" : "rgba(255, 248, 236, 0.12)"};

  &::after {
    content: "";
    position: absolute;
    top: 0.22rem;
    left: ${({ $on }) => ($on ? "1.62rem" : "0.25rem")};
    width: 1.38rem;
    height: 1.38rem;
    border-radius: 50%;
    background: ${({ $on }) => ($on ? "#15110d" : "rgba(255, 248, 236, 0.82)")};
  }
`;

const FloatingPrimaryAction = styled.div`
  display: inline-flex;
  min-height: 3.2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary.gradient};
  color: #14110d;
  padding: 0 1rem;
  font-size: 0.92rem;
  font-weight: 900;
  box-shadow: 0 18px 36px rgba(243, 210, 122, 0.24);
`;

const PillSegment = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 248, 236, 0.11);
  background: rgba(255, 248, 236, 0.055);
  padding: 0.3rem;
`;

const PillSegmentItem = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  min-height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${({ $active }) =>
    $active ? "rgba(255, 248, 236, 0.92)" : "transparent"};
  color: ${({ theme, $active }) =>
    $active ? "#17130f" : theme.colors.text.secondary};
  font-size: 0.78rem;
  font-weight: 900;
`;

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
`;

const LargeDisplay = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(2rem, 8vw, 3.3rem);
  line-height: 0.92;
  letter-spacing: -0.07em;
`;

const MiniMetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
`;

const SourceIcon = styled.span<{ $tone?: "mail" | "calendar" | "photos" }>`
  display: inline-flex;
  width: 2.65rem;
  height: 2.65rem;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  background: ${({ $tone }) =>
    $tone === "mail"
      ? "linear-gradient(135deg, #4285f4, #ea4335)"
      : $tone === "calendar"
        ? "linear-gradient(135deg, #33a852, #4285f4)"
        : "linear-gradient(135deg, #fbbc04, #ea4335)"};
  color: white;
  font-size: 0.82rem;
  font-weight: 900;
`;

const PassportCover = styled.div`
  overflow: hidden;
  border-radius: 26px;
  border: 1px solid rgba(243, 210, 122, 0.25);
  background:
    radial-gradient(circle at 50% 12%, rgba(243, 210, 122, 0.28), transparent 22%),
    linear-gradient(145deg, #33291c, #14110d 72%);
  padding: 1rem;
`;

const StampMark = styled.span`
  display: inline-flex;
  width: 3.3rem;
  height: 3.3rem;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(243, 210, 122, 0.58);
  border-radius: 50%;
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transform: rotate(-10deg);
`;

const MemoryPhotoGrid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  grid-template-rows: repeat(2, minmax(5.3rem, 1fr));
  gap: 0.65rem;
`;

const MemoryPhotoTile = styled.div<{ $variant?: "wide" | "warm" | "cool" }>`
  border-radius: 20px;
  border: 1px solid rgba(255, 248, 236, 0.1);
  background: ${({ $variant }) =>
    $variant === "warm"
      ? "linear-gradient(145deg, rgba(243, 210, 122, 0.36), rgba(231, 35, 64, 0.16)), #211b15"
      : $variant === "cool"
        ? "linear-gradient(145deg, rgba(38, 173, 198, 0.36), rgba(255, 248, 236, 0.08)), #151d20"
        : "linear-gradient(145deg, rgba(255, 248, 236, 0.16), rgba(243, 210, 122, 0.2)), #261f17"};
  ${({ $variant }) => ($variant === "wide" ? "grid-row: span 2;" : "")}
`;

const AvatarStack = styled.div`
  display: flex;
  align-items: center;
`;

const AvatarDot = styled.span<{ $index: number }>`
  display: inline-flex;
  width: 2.05rem;
  height: 2.05rem;
  align-items: center;
  justify-content: center;
  margin-left: ${({ $index }) => ($index === 0 ? "0" : "-0.45rem")};
  border: 2px solid #17130f;
  border-radius: 50%;
  background: ${({ $index }) =>
    $index === 0
      ? "linear-gradient(135deg, #f0c62d, #e72340)"
      : $index === 1
        ? "linear-gradient(135deg, #26adc6, #f0c62d)"
        : "rgba(255, 248, 236, 0.16)"};
  color: #17130f;
  font-size: 0.7rem;
  font-weight: 900;
`;

const DesignTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const DesignTab = styled.button<{ $active?: boolean }>`
  min-height: 2.75rem;
  border-radius: 999px;
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary.main : theme.colors.border.light};
  background: ${({ $active }) =>
    $active ? "rgba(243, 210, 122, 0.14)" : "rgba(255, 248, 236, 0.05)"};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.55rem 0.85rem;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid rgba(243, 210, 122, 0.45);
    outline-offset: 3px;
  }
`;

const DesignSidePanel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DesignSignalGrid = styled.div`
  display: grid;
  gap: 0.85rem;
`;

const DesignSignalCard = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  padding: 1rem;
`;

const DesignFocusList = styled.ul`
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const DesignFocusItem = styled.li`
  border-radius: 16px;
  border: 1px solid rgba(255, 248, 236, 0.1);
  background: rgba(255, 248, 236, 0.045);
  padding: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.45;
`;

const VisualLabPage = styled.section`
  min-height: 100vh;
  padding: clamp(1.25rem, 3vw, 2.75rem) 0 clamp(4rem, 7vw, 6rem);
  color: #18130d;
`;

const VisualLabShell = styled.div`
  display: grid;
  gap: clamp(1rem, 2vw, 1.5rem);
`;

const VisualLabHeader = styled.header`
  display: grid;
  gap: 0.45rem;
  max-width: 56rem;
`;

const VisualLabTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.65rem, 3vw, 2.75rem);
  line-height: 0.96;
  letter-spacing: -0.04em;
`;

const VisualLabSubhead = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.55;
`;

const VisualLabTabs = styled.nav`
  display: flex;
  gap: 0.7rem;
  overflow-x: auto;
  padding: 0.25rem 0 0.5rem;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const VisualLabTab = styled.button<{ $active?: boolean }>`
  flex: 0 0 auto;
  min-height: 3.2rem;
  border: 1px solid ${({ $active }) => ($active ? "#15100b" : "rgba(21, 16, 11, 0.14)")};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#15100b" : "rgba(255, 248, 236, 0.72)")};
  color: ${({ $active }) => ($active ? "#fff8ec" : "#18130d")};
  padding: 0 1rem;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 850;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? "0 18px 42px rgba(21, 16, 11, 0.22)" : "none"};

  &:focus-visible {
    outline: 3px solid rgba(240, 198, 45, 0.65);
    outline-offset: 3px;
  }
`;

const ScreenWall = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 23rem), 1fr));
  gap: 1rem;
  align-items: start;
`;

const ScreenStudyCard = styled.article<{ $tone: string }>`
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255, 248, 236, 0.1);
  background:
    ${({ $tone }) =>
      $tone === "memory-mode"
        ? "linear-gradient(145deg, #050505, #161010)"
        : $tone === "artifact-cards"
          ? "linear-gradient(145deg, #efedf1, #d6d4da)"
          : $tone === "setup-passport"
            ? "linear-gradient(145deg, #173725, #06140e)"
            : $tone === "connected-sources"
              ? "linear-gradient(145deg, #f8fbff, #eef4ff)"
              : $tone === "packs-permissions"
                ? "linear-gradient(145deg, #fff7e8, #f7ecd8)"
                : "linear-gradient(145deg, #fbf6ed, #e9edf4)"};
  padding: 0.9rem;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
`;

const ScreenStudyHeader = styled.div<{ $dark?: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  padding: 0.15rem 0.2rem 0.75rem;
  color: ${({ $dark }) => ($dark ? "#fff8ec" : "#15100b")};
`;

const ScreenStudyTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
`;

const ScreenStudyKicker = styled.span`
  color: currentColor;
  opacity: 0.48;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const ScreenStudyBody = styled.div`
  display: grid;
  place-items: center;
`;

const VisualShowcase = styled.article<{ $tone: string }>`
  display: grid;
  grid-template-columns: minmax(0, 0.72fr) minmax(22rem, 1fr);
  gap: clamp(1rem, 4vw, 2.5rem);
  align-items: center;
  min-height: 41rem;
  overflow: hidden;
  border-radius: 36px;
  background:
    ${({ $tone }) =>
      $tone === "memory-mode"
        ? "radial-gradient(circle at 72% 18%, rgba(231, 35, 64, 0.24), transparent 24%), linear-gradient(135deg, #080707, #1b1214 56%, #080707)"
        : $tone === "artifact-cards"
          ? "radial-gradient(circle at 78% 18%, rgba(92, 255, 143, 0.18), transparent 22%), linear-gradient(135deg, #efedf1, #d6d4da)"
          : $tone === "setup-passport"
            ? "radial-gradient(circle at 20% 16%, rgba(240, 198, 45, 0.24), transparent 23%), linear-gradient(135deg, #183829, #07140f)"
            : $tone === "connected-sources"
              ? "linear-gradient(135deg, #f8fbff, #eef4ff)"
              : $tone === "packs-permissions"
                ? "linear-gradient(135deg, #fff7e8, #f7ecd8)"
                : "linear-gradient(135deg, #fbf6ed, #e9edf4)"};
  padding: clamp(1rem, 3vw, 1.5rem);
  box-shadow: 0 34px 100px rgba(20, 12, 5, 0.24);

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`;

const VisualPosterCopy = styled.div<{ $light?: boolean }>`
  display: grid;
  gap: 1rem;
  align-content: center;
  color: ${({ $light }) => ($light ? "#fff8ec" : "#15100b")};
`;

const VisualPosterIndex = styled.span<{ $light?: boolean }>`
  color: ${({ $light }) => ($light ? "rgba(255, 248, 236, 0.64)" : "rgba(21, 16, 11, 0.48)")};
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`;

const VisualPosterTitle = styled.h2`
  margin: 0;
  max-width: 9ch;
  font-size: clamp(2.5rem, 8vw, 6.25rem);
  line-height: 0.84;
  letter-spacing: -0.07em;
`;

const VisualPosterSentence = styled.p<{ $light?: boolean }>`
  margin: 0;
  max-width: 28rem;
  color: ${({ $light }) => ($light ? "rgba(255, 248, 236, 0.74)" : "rgba(21, 16, 11, 0.68)")};
  font-size: clamp(1rem, 2vw, 1.22rem);
  line-height: 1.5;
`;

const VisualProofStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const VisualProofPill = styled.span<{ $light?: boolean }>`
  border-radius: 999px;
  border: 1px solid ${({ $light }) => ($light ? "rgba(255, 248, 236, 0.22)" : "rgba(21, 16, 11, 0.14)")};
  background: ${({ $light }) => ($light ? "rgba(255, 248, 236, 0.08)" : "rgba(255, 255, 255, 0.5)")};
  padding: 0.55rem 0.8rem;
  color: ${({ $light }) => ($light ? "rgba(255, 248, 236, 0.88)" : "rgba(21, 16, 11, 0.72)")};
  font-size: 0.78rem;
  font-weight: 850;
`;

const DeviceGallery = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  min-height: 38rem;

  @media (max-width: 980px) {
    min-height: 38rem;
  }
`;

const GalleryPhone = styled.div<{ $surface?: string }>`
  position: relative;
  width: min(100%, 24rem);
  min-height: 36rem;
  overflow: hidden;
  border-radius: 3rem;
  border: 0.75rem solid #080808;
  background: ${({ $surface }) =>
    $surface === "light"
      ? "#f8f6f1"
      : $surface === "wallet"
        ? "#ececf1"
        : $surface === "passport"
          ? "#092017"
          : $surface === "journal"
            ? "#050505"
            : "#101010"};
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.36),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
`;

const ScreenWallPhone = styled(GalleryPhone)`
  width: min(100%, 21.25rem);
  min-height: 34rem;
  border-width: 0.65rem;
  box-shadow:
    0 22px 52px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
`;

const GalleryStatus = styled.div<{ $dark?: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 0.85rem 1.15rem 0;
  color: ${({ $dark }) => ($dark ? "#15100b" : "#fff")};
  font-size: 0.8rem;
  font-weight: 900;
`;

const SoftMap = styled.div<{ $dark?: boolean }>`
  position: relative;
  min-height: 17rem;
  overflow: hidden;
  background:
    linear-gradient(32deg, transparent 48%, ${({ $dark }) => ($dark ? "rgba(255,255,255,0.18)" : "rgba(20, 80, 130, 0.16)")} 49%, transparent 51%),
    linear-gradient(118deg, transparent 44%, ${({ $dark }) => ($dark ? "rgba(255,255,255,0.12)" : "rgba(37, 118, 168, 0.14)")} 45%, transparent 47%),
    radial-gradient(circle at 24% 62%, #2aa86f 0 0.55rem, transparent 0.58rem),
    radial-gradient(circle at 74% 34%, #e72340 0 0.55rem, transparent 0.58rem),
    ${({ $dark }) =>
      $dark
        ? "linear-gradient(135deg, #1c2531, #0b1118)"
        : "linear-gradient(135deg, #dcecf0, #f8f2e5)"};
`;

const RouteGlow = styled.div<{ $left?: string; $top?: string; $rotate?: string }>`
  position: absolute;
  left: ${({ $left }) => $left ?? "20%"};
  top: ${({ $top }) => $top ?? "48%"};
  width: 64%;
  height: 0.45rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #eb3349, #f45c43);
  transform: rotate(${({ $rotate }) => $rotate ?? "-18deg"});
  box-shadow: 0 0 22px rgba(231, 35, 64, 0.35);
`;

const FloatingSheet = styled.div`
  position: relative;
  margin: -3.4rem 1rem 0;
  border-radius: 2rem;
  background: rgba(255, 255, 255, 0.96);
  color: #15100b;
  padding: 1.05rem;
  box-shadow: 0 18px 50px rgba(35, 24, 12, 0.24);
`;

const MassiveInstruction = styled.strong`
  display: block;
  font-size: clamp(2rem, 7vw, 3.35rem);
  line-height: 0.92;
  letter-spacing: -0.07em;
`;

const SheetSubline = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.45rem;
  color: rgba(21, 16, 11, 0.58);
  font-size: 1.1rem;
  font-weight: 850;
`;

const CommandStep = styled.div<{ $urgent?: boolean }>`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  align-items: center;
  margin: 0.85rem 1rem 0;
  border-radius: 1.35rem;
  background: ${({ $urgent }) => ($urgent ? "#15100b" : "#ffffff")};
  color: ${({ $urgent }) => ($urgent ? "#fff8ec" : "#15100b")};
  padding: 0.8rem;
  box-shadow: 0 10px 32px rgba(35, 24, 12, 0.13);

  ${RailValue} {
    color: ${({ $urgent }) => ($urgent ? "#fff8ec" : "#15100b")};
  }

  ${SourceValue} {
    color: ${({ $urgent }) =>
      $urgent ? "rgba(255, 248, 236, 0.72)" : "rgba(21, 16, 11, 0.62)"};
  }
`;

const StepDot = styled.span<{ $tone?: string }>`
  display: grid;
  place-items: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 1rem;
  background: ${({ $tone }) =>
    $tone === "red" ? "#e72340" : $tone === "blue" ? "#2578d5" : "#f0c62d"};
  color: ${({ $tone }) => ($tone === "yellow" ? "#15100b" : "#fff")};
  font-weight: 950;
`;

const MapSheet = styled.div`
  position: absolute;
  inset: auto 0 0;
  min-height: 27rem;
  border-radius: 2rem 2rem 0 0;
  background: #fff;
  color: #15100b;
  padding: 1rem 1.2rem;
  box-shadow: 0 -18px 50px rgba(35, 24, 12, 0.2);

  ${RailLabel} {
    color: rgba(21, 16, 11, 0.5);
  }

  ${RailValue} {
    color: #15100b;
  }

  ${SourceValue} {
    color: rgba(21, 16, 11, 0.58);
  }
`;

const DayTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
  border-radius: 999px;
  background: #f0f1f4;
  padding: 0.25rem;
`;

const DayTab = styled.span<{ $active?: boolean }>`
  display: grid;
  place-items: center;
  min-height: 2.25rem;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#15100b" : "transparent")};
  color: ${({ $active }) => ($active ? "#fff" : "rgba(21,16,11,0.58)")};
  font-size: 0.78rem;
  font-weight: 900;
`;

const MapTimeline = styled.div`
  display: grid;
  gap: 0.95rem;
  margin-top: 1rem;
  padding-left: 1.3rem;
  border-left: 3px solid #2578d5;
`;

const TimelineStop = styled.div`
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: -1.75rem;
    top: 0.15rem;
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 50%;
    background: #2578d5;
    box-shadow: 0 0 0 4px #e7f0ff;
  }
`;

const WalletStack = styled.div`
  display: grid;
  gap: 0;
  padding: 5rem 1rem 1rem;
`;

const WalletPass = styled.div<{ $kind?: string }>`
  min-height: ${({ $kind }) => ($kind === "hero" ? "17rem" : "8.5rem")};
  margin-top: ${({ $kind }) => ($kind === "hero" ? "0" : "-2.2rem")};
  border-radius: 2rem;
  background: ${({ $kind }) =>
    $kind === "hotel"
      ? "linear-gradient(135deg, #b76b46, #6d341d)"
      : $kind === "dinner"
        ? "linear-gradient(135deg, #15100b, #35302a)"
        : "linear-gradient(135deg, #ffffff, #f5f5f2)"};
  color: ${({ $kind }) => ($kind === "hero" ? "#15100b" : "#fff8ec")};
  padding: 1rem;
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.18);

  ${RailLabel} {
    color: ${({ $kind }) =>
      $kind === "hero" ? "rgba(21, 16, 11, 0.48)" : "rgba(255, 248, 236, 0.7)"};
  }

  ${RailValue},
  ${SourceValue} {
    color: ${({ $kind }) =>
      $kind === "hero" ? "#15100b" : "rgba(255, 248, 236, 0.92)"};
  }
`;

const AirportRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.4rem 0;
  font-size: 3rem;
  font-weight: 950;
  letter-spacing: -0.08em;
`;

const FakeQr = styled.div<{ $dark?: boolean }>`
  height: 5.4rem;
  border-radius: 0.7rem;
  background:
    repeating-linear-gradient(90deg, ${({ $dark }) => ($dark ? "#fff" : "#15100b")} 0 0.18rem, transparent 0.18rem 0.38rem),
    repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 0.22rem, transparent 0.22rem 0.5rem);
  opacity: 0.75;
`;

const SourceCanvas = styled.div`
  padding: 1.15rem;
  color: #15100b;

  ${RailValue} {
    color: #15100b;
  }

  ${SourceValue} {
    color: rgba(21, 16, 11, 0.62);
  }
`;

const SourceHero = styled.div`
  display: grid;
  gap: 0.35rem;
  margin: 1.25rem 0;
`;

const SourcePipeGrid = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const SourcePipeCard = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.8rem;
  align-items: center;
  border-radius: 1.4rem;
  background: #fff;
  padding: 0.85rem;
  box-shadow: 0 12px 28px rgba(32, 62, 96, 0.11);

  ${RailValue} {
    color: #15100b;
  }

  ${SourceValue} {
    color: rgba(21, 16, 11, 0.6);
  }
`;

const OutputChip = styled.span`
  border-radius: 999px;
  background: #edf5ff;
  color: #1d65b7;
  padding: 0.45rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 900;
`;

const PassportSpread = styled.div`
  margin: 4.4rem 1rem 1rem;
  border-radius: 2rem;
  background: linear-gradient(135deg, #2d5c43, #0d2b1d);
  color: #f8e7bd;
  padding: 1.2rem;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.36);

  ${RailLabel},
  ${SourceValue} {
    color: rgba(248, 231, 189, 0.7);
  }

  ${RailValue} {
    color: #f8e7bd;
  }
`;

const PassportSeal = styled.div`
  display: grid;
  place-items: center;
  width: 7rem;
  height: 7rem;
  margin: 1.4rem auto;
  border: 2px solid rgba(248, 231, 189, 0.58);
  border-radius: 50%;
  color: #f8e7bd;
  font-size: 0.84rem;
  font-weight: 950;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const PassportStampGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
`;

const PassportStamp = styled.div<{ $empty?: boolean }>`
  min-height: 4.6rem;
  border: 1px dashed rgba(248, 231, 189, 0.48);
  border-radius: 1rem;
  padding: 0.7rem;
  opacity: ${({ $empty }) => ($empty ? 0.42 : 1)};
`;

const JournalCanvas = styled.div`
  min-height: 40rem;
  background: #050505;
  color: #fff;
  padding: 1rem;
`;

const JournalMomentTitle = styled.strong`
  display: block;
  margin-top: 0.45rem;
  color: #fff;
  font-size: 4.1rem;
  line-height: 0.86;
  letter-spacing: -0.055em;
`;

const JournalMomentWord = styled.span`
  display: block;
`;

const JournalCaption = styled.p`
  margin: 0.75rem 0 0;
  max-width: 17rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 1.08rem;
  line-height: 1.35;
`;

const JournalGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  margin-top: 1.2rem;
`;

const JournalPhoto = styled.div<{ $size?: string }>`
  min-height: ${({ $size }) => ($size === "large" ? "14rem" : "7rem")};
  grid-column: ${({ $size }) => ($size === "large" ? "span 2" : "span 1")};
  border-radius: 1.25rem;
  background:
    ${({ $size }) =>
      $size === "large"
        ? "linear-gradient(135deg, rgba(240, 198, 45, 0.52), rgba(231, 35, 64, 0.24)), #23130f"
        : "linear-gradient(135deg, rgba(38, 173, 198, 0.42), rgba(240, 198, 45, 0.18)), #131313"};
`;

const ShareCanvas = styled.div`
  min-height: 40rem;
  background: #fff8ec;
  color: #15100b;
  padding: 1.15rem;

  ${RailLabel} {
    color: rgba(21, 16, 11, 0.48);
  }

  ${RailValue} {
    color: #15100b;
  }

  ${SourceValue} {
    color: rgba(255, 248, 236, 0.7);
  }
`;

const InviteCard = styled.div`
  margin-top: 1rem;
  border-radius: 1.7rem;
  background: #fff;
  padding: 1rem;
  box-shadow: 0 18px 44px rgba(42, 24, 12, 0.14);

  > ${RailLabel} {
    color: rgba(21, 16, 11, 0.48);
  }
`;

const MiniPreview = styled.div`
  display: grid;
  gap: 0.55rem;
  margin: 1rem 0;
  border-radius: 1.25rem;
  background: #15100b;
  color: #fff8ec;
  padding: 0.9rem;
`;

const VisibilityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
`;

const VisibilityCard = styled.div<{ $hidden?: boolean }>`
  min-height: 8rem;
  border-radius: 1.25rem;
  background: ${({ $hidden }) => ($hidden ? "#f0e6d7" : "#e8f6ec")};
  padding: 0.8rem;

  ${RailLabel} {
    color: rgba(21, 16, 11, 0.48);
  }

  ${RailValue} {
    color: #15100b;
  }
`;

const StudioActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const WorkspaceMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const WorkspaceStatCard = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(255, 248, 236, 0.04);
  padding: 0.9rem 0.95rem;
`;

const WorkspaceStatLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const WorkspaceStatValue = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.2rem, 2.2vw, 1.6rem);
  font-weight: 800;
  letter-spacing: -0.04em;
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
          slug: "design-labs",
          title: "Design Labs",
          description:
            "Review the travel-native redesign system for command center, trip sheet, artifacts, sources, passport setup, memories, and Packs permissions.",
          href: "/labs/design-labs",
          kicker: "Product redesign",
        },
        {
          slug: "logo-studio",
          title: "Logo Studio",
          description:
            "Generate numbered logo variations through the PackAds Vertex setup, then refine the next round from the options you like.",
          href: "/labs/logo-studio",
          kicker: "Brand exploration",
        },
        {
          slug: "soundmarks",
          title: "Soundmarks",
          description:
            "Audition the current Pack audio identity sketches and map them to travel-product moments.",
          href: "/labs/soundmarks",
          kicker: "Audio identity",
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
        {
          slug: "pack-deeperbench-report",
          title: "Pack DeeperBench Report",
          description:
            "Open the canonical Pack DeeperBench benchmark page with the latest hard-100 and hardest-10 comparison results.",
          href: "/pack-deeperbench",
          kicker: "Benchmark QA",
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
    soundmarks: {
      title: "100 soundmark candidates for Pack.",
      description:
        "Review short, clean, fun reference sounds for ad endings and notifications. Use the fast yes/no flow, then copy the review JSON so the next search can get sharper.",
      options: soundmarks,
      scenarios: soundmarkScenarios,
      nowPlayingEmpty: "Nothing yet",
      playLabel: "Play",
      scenarioHeading: "Try them in context.",
      scenarioDescription:
        "These buttons map the same files to moments that would exist in the mobile app, which makes it easier to judge whether the tone fits the workflow.",
      guidanceTitle: "Usage guidance.",
      guidanceBody:
        "Choose one primary brand sound first, then generate or commission polished WAV variants and test them on actual iPhone speakers at low volume. The strongest current direction is Passport Stamp Chime.",
      referenceHuntLabel: "Open 100 reference candidates",
      referenceHuntHref: "/labs/soundmarks/reference-hunt.html",
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
    designLabs: {
      title: "Travel-native design labs.",
      description:
        "A proper review surface for the Pack app redesign direction: product-specific screens, interaction systems, and implementation-ready slices without flattening everything into generic panels.",
      concepts: designLabConcepts,
      signals: designLabSignals,
    },
    crumbs: {
      labs: "Labs",
      designLabs: "Design labs",
      logoStudio: "Logo studio",
      videos: "Videos",
      comparisons: "Comparisons",
      brandAssets: "Brand assets",
      soundmarks: "Soundmarks",
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
          slug: "design-labs",
          title: "Design Labs",
          description:
            "Revisa el sistema de rediseño travel-native para command center, trip sheet, artifacts, sources, setup passport, memories y permisos de Packs.",
          href: "/labs/design-labs",
          kicker: "Rediseño de producto",
        },
        {
          slug: "logo-studio",
          title: "Logo Studio",
          description:
            "Genera variaciones numeradas de logo con la ruta Vertex de PackAds y luego refina la siguiente ronda a partir de las opciones que más te gusten.",
          href: "/labs/logo-studio",
          kicker: "Exploración de marca",
        },
        {
          slug: "soundmarks",
          title: "Soundmarks",
          description:
            "Escucha los bocetos actuales de identidad sonora de Pack y asígnalos a momentos del producto de viaje.",
          href: "/labs/soundmarks",
          kicker: "Identidad sonora",
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
        {
          slug: "pack-deeperbench-report",
          title: "Pack DeeperBench Report",
          description:
            "Abre la página canónica de Pack DeeperBench con los últimos resultados del hard-100 y la comparación hardest-10.",
          href: "/pack-deeperbench",
          kicker: "QA de benchmark",
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
    soundmarks: {
      title: "100 candidatos de soundmark para Pack.",
      description:
        "Revisa referencias cortas, limpias y divertidas para cierres de anuncios y notificaciones. Usa el flujo rápido sí/no y copia el JSON para afinar la siguiente búsqueda.",
      options: soundmarks,
      scenarios: soundmarkScenarios,
      nowPlayingEmpty: "Nada todavía",
      playLabel: "Reproducir",
      scenarioHeading: "Pruébalos en contexto.",
      scenarioDescription:
        "Estos botones asignan los mismos archivos a momentos que existirían en la app móvil para juzgar mejor si el tono encaja con el flujo.",
      guidanceTitle: "Guía de uso.",
      guidanceBody:
        "Elige primero un sonido principal de marca, luego genera o encarga variantes WAV pulidas y pruébalas en speakers reales de iPhone a bajo volumen. La dirección más fuerte ahora es Passport Stamp Chime.",
      referenceHuntLabel: "Abrir 100 referencias",
      referenceHuntHref: "/labs/soundmarks/reference-hunt.html",
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
    designLabs: {
      title: "Labs de diseño travel-native.",
      description:
        "Una superficie de revisión propia para la dirección de rediseño de Pack: pantallas específicas del producto, sistemas de interacción y cortes listos para implementación sin convertir todo en paneles genéricos.",
      concepts: designLabConcepts,
      signals: designLabSignals,
    },
    crumbs: {
      labs: "Labs",
      designLabs: "Design labs",
      logoStudio: "Logo studio",
      videos: "Videos",
      comparisons: "Comparaciones",
      brandAssets: "Brand assets",
      soundmarks: "Soundmarks",
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

const loadReferenceSoundmarks = async (round: string): Promise<ReferenceSoundmark[]> => {
  const fileNameByRound: Record<string, string> = {
    "1": "reference-sounds.json",
    "2": "reference-sounds-round2.json",
    "3": "reference-sounds-round3.json",
  };
  const fileName = fileNameByRound[round] ?? fileNameByRound["1"];
  const response = await fetch(`/labs/soundmarks/${fileName}`);

  if (!response.ok) {
    throw new Error(`Failed to load soundmark references: ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    id?: unknown;
    title?: unknown;
    url?: unknown;
    previewMp3?: unknown;
    duration?: unknown;
    username?: unknown;
    rating?: unknown;
    ratingCount?: unknown;
    tags?: unknown;
    foundBy?: unknown;
    rank?: unknown;
  }>;

  return payload
    .filter((item) => typeof item.id === "string" && typeof item.title === "string")
    .map((item) => {
      const tags = Array.isArray(item.tags)
        ? item.tags.filter((tag): tag is string => typeof tag === "string")
        : [];
      const duration =
        typeof item.duration === "number" ? item.duration : Number(item.duration ?? 0);
      const rank = typeof item.rank === "number" ? item.rank : Number(item.rank ?? 0);
      const foundBy = typeof item.foundBy === "string" ? item.foundBy : "reference";
      const username = typeof item.username === "string" ? item.username : "unknown";
      const rating = typeof item.rating === "number" ? item.rating : null;
      const ratingCount =
        typeof item.ratingCount === "number"
          ? item.ratingCount
          : Number(item.ratingCount ?? 0);

      return {
        slug: item.id,
        title: item.title,
        useCase: `#${rank || "?"} · ${foundBy.split(", ")[0]}`,
        description: [
          username ? `by ${username}` : null,
          rating ? `rating ${rating.toFixed(1)} (${ratingCount})` : null,
          tags.length > 0 ? tags.slice(0, 5).join(", ") : null,
        ]
          .filter(Boolean)
          .join(" · "),
        src: typeof item.previewMp3 === "string" ? item.previewMp3 : "",
        duration: `${duration.toFixed(2)}s`,
        sourceUrl: typeof item.url === "string" ? item.url : "",
        username,
        rating,
        ratingCount,
        tags,
        foundBy,
        rank,
      };
    });
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

const DesignLabPreview: React.FC<{ concept: DesignLabConcept }> = ({ concept }) => {
  const badgeBySlug: Record<string, string> = {
    "command-center": "Today",
    "trip-sheet": "Tokyo",
    "artifact-cards": "Proof",
    "connected-sources": "Sources",
    "setup-passport": "Ready",
    "memory-mode": "Private",
    "packs-permissions": "Shared",
  };

  const renderSurface = () => {
    switch (concept.slug) {
      case "command-center":
        return (
          <>
            <HeroMap aria-hidden="true">
              <MapOverlayCard>
                <RailLabel>Live command center</RailLabel>
                <RailValue>JFK Terminal 8 is 32 min away</RailValue>
                <SourceValue>Traffic is clear. Leave by 6:10a to keep a 38 min airport buffer.</SourceValue>
              </MapOverlayCard>
            </HeroMap>
            <TravelRail>
              <RailTile>
                <RailLabel>Now</RailLabel>
                <RailValue>Leave for JFK in 18 min</RailValue>
              </RailTile>
              <RailTile>
                <RailLabel>Next</RailLabel>
                <RailValue>AA 181 boarding at B22</RailValue>
              </RailTile>
              <RailTile>
                <RailLabel>Watch</RailLabel>
                <RailValue>Rain may push arrival 24 min</RailValue>
              </RailTile>
            </TravelRail>
            <TimelineList>
              <TimelineItem $tone="primary">
                <TimeBlock>6:10a</TimeBlock>
                <div>
                  <RailValue>Car pickup window</RailValue>
                  <SourceValue>MapKit ETA plus calendar buffer. Prompt: confirm checked bags.</SourceValue>
                </div>
              </TimelineItem>
              <TimelineItem>
                <TimeBlock>8:05a</TimeBlock>
                <div>
                  <RailValue>Flight AA 181</RailValue>
                  <SourceValue>Gate B22 imported from Gmail. Seat 12A from airline receipt.</SourceValue>
                </div>
              </TimelineItem>
              <TimelineItem $tone="warn">
                <TimeBlock>1 tap</TimeBlock>
                <div>
                  <RailValue>Share airport pickup with Mia</RailValue>
                  <SourceValue>Pack can send only landing time, terminal, and live delay status.</SourceValue>
                </div>
              </TimelineItem>
            </TimelineList>
            <ActionChipRow>
              <FloatingPrimaryAction>Book ride</FloatingPrimaryAction>
              <ActionChip>Share live ETA</ActionChip>
              <ActionChip>Show source proof</ActionChip>
            </ActionChipRow>
          </>
        );
      case "trip-sheet":
        return (
          <>
            <HeroMap aria-hidden="true">
              <MapOverlayCard>
                <DayHeader>
                  <div>
                    <RailLabel>Tokyo route sheet</RailLabel>
                    <RailValue>3 days · 2 cities · 9 places</RailValue>
                  </div>
                  <PhoneBadge>Live</PhoneBadge>
                </DayHeader>
              </MapOverlayCard>
            </HeroMap>
            <PillSegment>
              <PillSegmentItem $active>Day 1</PillSegmentItem>
              <PillSegmentItem>Day 2</PillSegmentItem>
              <PillSegmentItem>Day 3</PillSegmentItem>
            </PillSegment>
            <TimelineList>
              <TimelineItem $tone="primary">
                <TimeBlock>Day 1</TimeBlock>
                <div>
                  <RailValue>New York to Tokyo</RailValue>
                  <SourceValue>Flight, airport transfer, hotel check-in, and first reservation in one route sheet.</SourceValue>
                </div>
              </TimelineItem>
              <TimelineItem>
                <TimeBlock>Day 2</TimeBlock>
                <div>
                  <RailValue>Shibuya base day</RailValue>
                  <SourceValue>Breakfast hold, museum ticket, dinner reservation, transit timing.</SourceValue>
                </div>
              </TimelineItem>
              <TimelineItem>
                <TimeBlock>Day 3</TimeBlock>
                <div>
                  <RailValue>Kyoto rail move</RailValue>
                  <SourceValue>Shinkansen ticket, luggage transfer note, ryokan arrival window.</SourceValue>
                </div>
              </TimelineItem>
            </TimelineList>
            <FloatingPrimaryAction>Resolve today’s timing</FloatingPrimaryAction>
          </>
        );
      case "artifact-cards":
        return (
          <TicketGrid>
            <PassCard>
              <PhoneLabel>Boarding pass</PhoneLabel>
              <TicketRoute>
                <span>JFK</span>
                <span>HND</span>
              </TicketRoute>
              <TravelRail>
                <RailTile>
                  <RailLabel>Gate</RailLabel>
                  <RailValue>B22</RailValue>
                </RailTile>
                <RailTile>
                  <RailLabel>Seat</RailLabel>
                  <RailValue>12A</RailValue>
                </RailTile>
                <RailTile>
                  <RailLabel>Group</RailLabel>
                  <RailValue>3</RailValue>
                </RailTile>
              </TravelRail>
              <LargeBarcode />
            </PassCard>
            <PassCard $accent="red">
              <PhoneLabel>Stay artifact</PhoneLabel>
              <RailValue>Trunk Hotel Yoyogi Park</RailValue>
              <CanvasMeta>Check-in after 3p. Confirmation and address stay attached to the card.</CanvasMeta>
              <ArtifactCode>PIN 4821</ArtifactCode>
              <MiniMetricGrid>
                <RailTile>
                  <RailLabel>Room</RailLabel>
                  <RailValue>King</RailValue>
                </RailTile>
                <RailTile>
                  <RailLabel>Nights</RailLabel>
                  <RailValue>4</RailValue>
                </RailTile>
              </MiniMetricGrid>
              <LargeBarcode />
            </PassCard>
          </TicketGrid>
        );
      case "connected-sources":
        return (
          <SourceList>
            <SourceRow>
              <SourceIcon $tone="mail">G</SourceIcon>
              <div>
                <RailValue>Gmail</RailValue>
                <SourceValue>Last imported: AA 181 flight change. Powers trips, artifacts, and live alerts.</SourceValue>
              </div>
              <PhoneBadge>On</PhoneBadge>
            </SourceRow>
            <SourceRow>
              <SourceIcon $tone="calendar">Cal</SourceIcon>
              <div>
                <RailValue>Calendar</RailValue>
                <SourceValue>Reads travel holds only. Prevents route conflicts and missed booking windows.</SourceValue>
              </div>
              <PhoneBadge>Scoped</PhoneBadge>
            </SourceRow>
            <SourceRow>
              <SourceIcon $tone="photos">Ph</SourceIcon>
              <div>
                <RailValue>Photos</RailValue>
                <SourceValue>Private recap suggestions after a trip. Never shared into Packs by default.</SourceValue>
              </div>
              <PhoneBadge>Review</PhoneBadge>
            </SourceRow>
            <Notice>
              Privacy boundary: each pipe states what it can read, what it creates,
              and which surfaces can use the output.
            </Notice>
          </SourceList>
        );
      case "setup-passport":
        return (
          <>
            <PassportCover>
              <DayHeader>
                <div>
                  <PhoneLabel>Pack Passport</PhoneLabel>
                  <LargeDisplay>72%</LargeDisplay>
                  <CanvasMeta>Traveler readiness for international trips.</CanvasMeta>
                </div>
                <StampMark>Ready</StampMark>
              </DayHeader>
              <ProgressTrack>
                <ProgressFill $width="72%" />
              </ProgressTrack>
            </PassportCover>
            <PassportGrid>
              <StampTile $done>
                <RailLabel>Home airport</RailLabel>
                <RailValue>JFK</RailValue>
              </StampTile>
              <StampTile $done>
                <RailLabel>Passport</RailLabel>
                <RailValue>Saved</RailValue>
              </StampTile>
              <StampTile>
                <RailLabel>Seat pref</RailLabel>
                <RailValue>Add</RailValue>
              </StampTile>
              <StampTile $done>
                <RailLabel>Payment</RailLabel>
                <RailValue>Ready</RailValue>
              </StampTile>
              <StampTile>
                <RailLabel>Diet</RailLabel>
                <RailValue>Missing</RailValue>
              </StampTile>
              <StampTile $done>
                <RailLabel>Companion</RailLabel>
                <RailValue>Mia</RailValue>
              </StampTile>
            </PassportGrid>
            <ActionChipRow>
              <ActionChip>Add seat preference</ActionChip>
              <ActionChip>Send companion setup</ActionChip>
            </ActionChipRow>
          </>
        );
      case "memory-mode":
        return (
          <>
            <MemoryHero>
              <PhoneLabel>Private recap</PhoneLabel>
              <CanvasTitle>Japan spring loop</CanvasTitle>
              <CanvasMeta>4 cities, 11 saved places, 38 imported memories.</CanvasMeta>
            </MemoryHero>
            <MemoryPhotoGrid>
              <MemoryPhotoTile $variant="wide" />
              <MemoryPhotoTile $variant="warm" />
              <MemoryPhotoTile $variant="cool" />
            </MemoryPhotoGrid>
            <PassportGrid>
              {["Tokyo", "Kyoto", "Naoshima", "Osaka", "Best meal", "Next time"].map(
                (stamp) => (
                  <StampTile key={stamp} $done>
                    <RailLabel>Stamp</RailLabel>
                    <RailValue>{stamp}</RailValue>
                  </StampTile>
                ),
              )}
            </PassportGrid>
            <Notice>
              Memories are private by default, with selective cards that can be reused
              for planning the next trip.
            </Notice>
          </>
        );
      case "packs-permissions":
        return (
          <>
            <TicketCard>
              <PhoneLabel>Invite preview</PhoneLabel>
              <DayHeader>
                <RailValue>Mia can coordinate Tokyo arrival</RailValue>
                <AvatarStack>
                  <AvatarDot $index={0}>M</AvatarDot>
                  <AvatarDot $index={1}>N</AvatarDot>
                  <AvatarDot $index={2}>+</AvatarDot>
                </AvatarStack>
              </DayHeader>
              <CanvasMeta>She sees live arrival, hotel address, and dinner holds. Payment, passport, and private notes stay hidden.</CanvasMeta>
            </TicketCard>
            <SourceList>
              <PermissionRow>
                <div>
                  <RailValue>Live flight and delay status</RailValue>
                  <SourceValue>Useful for pickup coordination.</SourceValue>
                </div>
                <ToggleMock $on />
              </PermissionRow>
              <PermissionRow>
                <div>
                  <RailValue>Hotel address and check-in window</RailValue>
                  <SourceValue>Visible, but confirmation code stays private.</SourceValue>
                </div>
                <ToggleMock $on />
              </PermissionRow>
              <PermissionRow>
                <div>
                  <RailValue>Payment receipts and profile details</RailValue>
                  <SourceValue>Hidden from this Pack by default.</SourceValue>
                </div>
                <ToggleMock />
              </PermissionRow>
            </SourceList>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <DeviceChrome>
      <DeviceScreen>
        <PhoneStatusBar>
          <span>9:41</span>
          <StatusGlyphs>●●▰</StatusGlyphs>
        </PhoneStatusBar>
        <PhoneHeader>
          <div>
            <PhoneLabel>Pack redesign</PhoneLabel>
            <PhoneTitle>{concept.title}</PhoneTitle>
          </div>
          <PhoneBadge>{badgeBySlug[concept.slug] ?? "Lab"}</PhoneBadge>
        </PhoneHeader>
        <PhoneScrollBody>
          {renderSurface()}
        </PhoneScrollBody>
        <PhoneBottomNav aria-label="Mock Pack tabs">
          <PhoneNavItem $active>Today</PhoneNavItem>
          <PhoneNavItem>Trips</PhoneNavItem>
          <PhoneNavItem>Packs</PhoneNavItem>
          <PhoneNavItem>Profile</PhoneNavItem>
        </PhoneBottomNav>
      </DeviceScreen>
    </DeviceChrome>
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

export const LabsDesignLabsPage: React.FC = () => {
  const { pathFor } = useI18n();

  const phoneSurfaceFor = (concept: DesignLabConcept): string | undefined =>
    concept.slug === "artifact-cards"
      ? "wallet"
      : concept.slug === "setup-passport"
        ? "passport"
        : concept.slug === "memory-mode"
          ? "journal"
          : concept.slug === "connected-sources" ||
              concept.slug === "packs-permissions" ||
              concept.slug === "trip-sheet" ||
              concept.slug === "command-center"
            ? "light"
            : undefined;

  const screenIsDark = (concept: DesignLabConcept): boolean =>
    concept.slug === "memory-mode" || concept.slug === "setup-passport";

  const renderGallerySurface = (concept: DesignLabConcept) => {
    const phoneSurface = phoneSurfaceFor(concept);

    switch (concept.slug) {
      case "command-center":
        return (
          <ScreenWallPhone $surface={phoneSurface}>
            <GalleryStatus $dark>
              <span>9:41</span>
              <span>LTE 100%</span>
            </GalleryStatus>
            <SoftMap>
              <RouteGlow $left="15%" $top="54%" $rotate="-16deg" />
            </SoftMap>
            <FloatingSheet>
              <MassiveInstruction>Leave at 7:47 AM</MassiveInstruction>
              <SheetSubline>
                <span>Arrive 8:30</span>
                <span>43 min</span>
              </SheetSubline>
            </FloatingSheet>
            <CommandStep $urgent>
              <StepDot $tone="red">!</StepDot>
              <div>
                <RailValue>Gate changed to B22</RailValue>
                <SourceValue>Walk 5 min after security. Boarding starts at 8:05.</SourceValue>
              </div>
            </CommandStep>
            <CommandStep>
              <StepDot $tone="blue">M</StepDot>
              <div>
                <RailValue>Share pickup ETA with Mia</RailValue>
                <SourceValue>Live arrival only. Hotel and receipts stay private.</SourceValue>
              </div>
            </CommandStep>
          </ScreenWallPhone>
        );
      case "trip-sheet":
        return (
          <ScreenWallPhone $surface={phoneSurface}>
            <GalleryStatus $dark>
              <span>9:41</span>
              <span>Tokyo</span>
            </GalleryStatus>
            <SoftMap>
              <RouteGlow $left="10%" $top="46%" $rotate="12deg" />
              <RouteGlow $left="31%" $top="58%" $rotate="-24deg" />
            </SoftMap>
            <MapSheet>
              <DayTabs>
                <DayTab $active>Mon</DayTab>
                <DayTab>Tue</DayTab>
                <DayTab>Wed</DayTab>
                <DayTab>Thu</DayTab>
              </DayTabs>
              <SheetSubline>
                <span>Day 1</span>
                <span>3 transfers</span>
              </SheetSubline>
              <MapTimeline>
                <TimelineStop>
                  <RailValue>JFK to HND</RailValue>
                  <SourceValue>AA 181 · Terminal 8 · seat 12A</SourceValue>
                </TimelineStop>
                <TimelineStop>
                  <RailValue>Airport train to Shibuya</RailValue>
                  <SourceValue>63 min · Suica works · platform 2</SourceValue>
                </TimelineStop>
                <TimelineStop>
                  <RailValue>Trunk Hotel Yoyogi Park</RailValue>
                  <SourceValue>Check-in after 3 PM · PIN saved</SourceValue>
                </TimelineStop>
              </MapTimeline>
            </MapSheet>
          </ScreenWallPhone>
        );
      case "artifact-cards":
        return (
          <ScreenWallPhone $surface={phoneSurface}>
            <GalleryStatus $dark>
              <span>9:41</span>
              <span>Wallet</span>
            </GalleryStatus>
            <WalletStack>
              <WalletPass $kind="hero">
                <RailLabel>AA 181</RailLabel>
                <AirportRow>
                  <span>JFK</span>
                  <span>HND</span>
                </AirportRow>
                <MiniMetricGrid>
                  <RailTile>
                    <RailLabel>Seat</RailLabel>
                    <RailValue>12A</RailValue>
                  </RailTile>
                  <RailTile>
                    <RailLabel>Gate</RailLabel>
                    <RailValue>B22</RailValue>
                  </RailTile>
                </MiniMetricGrid>
                <FakeQr />
              </WalletPass>
              <WalletPass $kind="hotel">
                <RailLabel>Hotel key</RailLabel>
                <LargeDisplay>4821</LargeDisplay>
                <SourceValue>Trunk Hotel Yoyogi Park</SourceValue>
              </WalletPass>
              <WalletPass $kind="dinner">
                <RailLabel>Dinner hold</RailLabel>
                <RailValue>Narisawa · 7:30 PM · 2 guests</RailValue>
              </WalletPass>
            </WalletStack>
          </ScreenWallPhone>
        );
      case "connected-sources":
        return (
          <ScreenWallPhone $surface={phoneSurface}>
            <GalleryStatus $dark>
              <span>9:41</span>
              <span>Private</span>
            </GalleryStatus>
            <SourceCanvas>
              <SourceHero>
                <MassiveInstruction>Connect the trip brain.</MassiveInstruction>
                <SourceValue>Each source shows what it reads, then what it creates.</SourceValue>
              </SourceHero>
              <SourcePipeGrid>
                <SourcePipeCard>
                  <SourceIcon $tone="mail">G</SourceIcon>
                  <div>
                    <RailValue>Gmail</RailValue>
                    <SourceValue>Reads travel confirmations only.</SourceValue>
                  </div>
                  <OutputChip>Flight pass</OutputChip>
                </SourcePipeCard>
                <SourcePipeCard>
                  <SourceIcon $tone="calendar">Cal</SourceIcon>
                  <div>
                    <RailValue>Calendar</RailValue>
                    <SourceValue>Finds conflicts and buffer windows.</SourceValue>
                  </div>
                  <OutputChip>Timing rail</OutputChip>
                </SourcePipeCard>
                <SourcePipeCard>
                  <SourceIcon $tone="photos">Ph</SourceIcon>
                  <div>
                    <RailValue>Photos</RailValue>
                    <SourceValue>Builds private recaps after travel.</SourceValue>
                  </div>
                  <OutputChip>Memory book</OutputChip>
                </SourcePipeCard>
              </SourcePipeGrid>
            </SourceCanvas>
          </ScreenWallPhone>
        );
      case "setup-passport":
        return (
          <ScreenWallPhone $surface={phoneSurface}>
            <GalleryStatus>
              <span>9:41</span>
              <span>Ready</span>
            </GalleryStatus>
            <PassportSpread>
              <RailLabel>Pack Passport</RailLabel>
              <PassportSeal>Japan ready</PassportSeal>
              <LargeDisplay>72%</LargeDisplay>
              <SourceValue>One missing detail before this traveler is fully trip-ready.</SourceValue>
              <PassportStampGrid>
                <PassportStamp>
                  <RailLabel>Home airport</RailLabel>
                  <RailValue>JFK</RailValue>
                </PassportStamp>
                <PassportStamp>
                  <RailLabel>Passport</RailLabel>
                  <RailValue>Saved</RailValue>
                </PassportStamp>
                <PassportStamp $empty>
                  <RailLabel>Seat pref</RailLabel>
                  <RailValue>Blank</RailValue>
                </PassportStamp>
                <PassportStamp>
                  <RailLabel>Companion</RailLabel>
                  <RailValue>Mia</RailValue>
                </PassportStamp>
              </PassportStampGrid>
            </PassportSpread>
          </ScreenWallPhone>
        );
      case "memory-mode":
        return (
          <ScreenWallPhone $surface={phoneSurface}>
            <GalleryStatus>
              <span>9:41</span>
              <span>Private</span>
            </GalleryStatus>
            <JournalCanvas>
              <VisualPosterIndex $light>Japan spring loop</VisualPosterIndex>
              <JournalMomentTitle>
                38
                <JournalMomentWord>moments</JournalMomentWord>
              </JournalMomentTitle>
              <JournalCaption>
                A trip becomes something you want to reopen.
              </JournalCaption>
              <JournalGrid>
                <JournalPhoto $size="large" />
                <JournalPhoto />
                <JournalPhoto />
                <JournalPhoto />
                <JournalPhoto />
              </JournalGrid>
            </JournalCanvas>
          </ScreenWallPhone>
        );
      case "packs-permissions":
        return (
          <ScreenWallPhone $surface={phoneSurface}>
            <GalleryStatus $dark>
              <span>9:41</span>
              <span>Send</span>
            </GalleryStatus>
            <ShareCanvas>
              <MassiveInstruction>Send this Pack to Mia?</MassiveInstruction>
              <InviteCard>
                <RailLabel>She will see</RailLabel>
                <MiniPreview>
                  <RailValue>AA 181 lands at 4:45 AM</RailValue>
                  <SourceValue>Terminal 3 · hotel area · dinner hold</SourceValue>
                </MiniPreview>
                <VisibilityGrid>
                  <VisibilityCard>
                    <RailLabel>Visible</RailLabel>
                    <RailValue>Flight status, hotel area, dinner time</RailValue>
                  </VisibilityCard>
                  <VisibilityCard $hidden>
                    <RailLabel>Hidden</RailLabel>
                    <RailValue>Payment, passport, private notes</RailValue>
                  </VisibilityCard>
                </VisibilityGrid>
              </InviteCard>
            </ShareCanvas>
          </ScreenWallPhone>
        );
      default:
        return null;
    }
  };

  return (
    <VisualLabPage>
      <Helmet>
        <title>{buildVideoTitle("Design screens")}</title>
        <meta
          name="description"
          content="Pack app redesign screen studies for command, itinerary, artifacts, sources, readiness, memories, and sharing."
        />
      </Helmet>
      <VisualLabShell>
        <BreadcrumbRow aria-label="Labs breadcrumb">
          <BreadcrumbLink to={pathFor("/labs")}>Labs</BreadcrumbLink>
          <BreadcrumbLink to={pathFor("/labs/design-labs")}>Design labs</BreadcrumbLink>
        </BreadcrumbRow>
        <VisualLabHeader>
          <div>
            <VisualLabTitle>Pack screens.</VisualLabTitle>
            <VisualLabSubhead>
              Seven product surfaces as concrete mobile screens.
            </VisualLabSubhead>
          </div>
        </VisualLabHeader>
        <ScreenWall aria-label="Design screen studies">
          {designLabConcepts.map((concept) => (
            <ScreenStudyCard
              key={concept.slug}
              $tone={concept.slug}
            >
              <ScreenStudyHeader $dark={screenIsDark(concept)}>
                <ScreenStudyTitle>{concept.title}</ScreenStudyTitle>
                <ScreenStudyKicker>{concept.label}</ScreenStudyKicker>
              </ScreenStudyHeader>
              <ScreenStudyBody>{renderGallerySurface(concept)}</ScreenStudyBody>
            </ScreenStudyCard>
          ))}
        </ScreenWall>
      </VisualLabShell>
    </VisualLabPage>
  );
};

export const LabsVideosPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];
  const [templateId, setTemplateId] = React.useState("");
  const [count, setCount] = React.useState("2");
  const [autoSubtitles, setAutoSubtitles] = React.useState(false);
  const [subtitleBurn, setSubtitleBurn] = React.useState(false);
  const [currentManifest, setCurrentManifest] = React.useState<VideoLabManifest | null>(
    null,
  );
  const latestManifestQuery = useQuery({
    queryKey: ["labs", "videos", "latest-manifest"],
    queryFn: fetchLatestVideoLabManifest,
    staleTime: 1000 * 15,
    retry: false,
  });
  const generateMutation = useMutation({
    mutationFn: generateVideoLabRun,
    onSuccess: (manifest) => {
      setCurrentManifest(manifest);
      if (manifest.templates.length > 0 && !templateId) {
        setTemplateId(manifest.templates[0].id);
      }
    },
  });
  const displayedManifest = currentManifest ?? latestManifestQuery.data ?? null;

  React.useEffect(() => {
    if (!displayedManifest || displayedManifest.templates.length === 0 || templateId) {
      return;
    }

    setTemplateId(displayedManifest.templates[0].id);
  }, [displayedManifest, templateId]);

  const selectedTemplate =
    displayedManifest?.templates.find((template) => template.id === templateId) ?? null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!templateId) {
      return;
    }

    void generateMutation.mutateAsync({
      templateId,
      count: Number(count),
      autoSubtitles,
      subtitleBurn,
    });
  };

  const renderVideoCard = (
    video: VideoLabVariant,
    featuredSlug: string | null,
  ): React.ReactNode => {
    const isFeatured = video.slug === featuredSlug;

    return (
      <VideoVariantCard key={video.id}>
        <VideoFrame>
          <InlineVideo controls preload="metadata" playsInline src={video.previewUrl} />
        </VideoFrame>
        <Meta>
          <VariantHeader>
            <VariantTitle>{video.title}</VariantTitle>
            {isFeatured ? <Tag>Featured</Tag> : null}
          </VariantHeader>
          <CardBody>{video.description}</CardBody>
          <TagRow>
            {video.tags.map((tag) => (
              <Tag key={`${video.id}-${tag}`}>{tag}</Tag>
            ))}
          </TagRow>
          <LinkRow>
            <PrimaryLink href={video.previewUrl} target="_blank" rel="noreferrer">
              {localizedContent.openPreview}
            </PrimaryLink>
            <SecondaryLink href={video.previewUrl} download>
              {localizedContent.downloadLocalCopy}
            </SecondaryLink>
          </LinkRow>
          <PathLabel>{video.localPath}</PathLabel>
        </Meta>
      </VideoVariantCard>
    );
  };

  return (
    <LabsShell
      title={localizedContent.videos.title}
      description={localizedContent.videos.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/videos")}>{localizedContent.crumbs.videos}</BreadcrumbLink>
      </BreadcrumbRow>
      <StudioGrid>
        <StudioPanel>
          <SectionHeading>
            <SectionTitle>Local video workspace</SectionTitle>
            <SectionDescription>
              {displayedManifest
                ? "Your local PackAds workspace is connected. Generate new short-form ads here, then review them below as soon as they land in exports."
                : "Load the local PackAds export manifest, then generate or review ads in place."}
            </SectionDescription>
          </SectionHeading>
          {latestManifestQuery.isError && !currentManifest ? (
            <ErrorNotice>
              {latestManifestQuery.error instanceof Error
                ? latestManifestQuery.error.message
                : "Failed to load the local video workspace."}
            </ErrorNotice>
          ) : null}
          <Notice>
            Templates are read from <code>PackAds/demo_project/templates.json</code> and
            exports are shown from <code>PackAds/demo_project/exports</code>. This is a
            local-only dev bridge between the website and PackAds.
          </Notice>
          {displayedManifest ? (
            <WorkspaceMetaGrid>
              <WorkspaceStatCard>
                <WorkspaceStatLabel>Templates</WorkspaceStatLabel>
                <WorkspaceStatValue>{displayedManifest.templates.length}</WorkspaceStatValue>
              </WorkspaceStatCard>
              <WorkspaceStatCard>
                <WorkspaceStatLabel>Export Groups</WorkspaceStatLabel>
                <WorkspaceStatValue>{displayedManifest.groups.length}</WorkspaceStatValue>
              </WorkspaceStatCard>
            </WorkspaceMetaGrid>
          ) : null}
          {displayedManifest ? (
            <>
              <FieldBlock>
                <FieldLabel>Templates Registry</FieldLabel>
                <PathLabel>{displayedManifest.projectDir}/templates.json</PathLabel>
              </FieldBlock>
              <FieldBlock>
                <FieldLabel>Exports Directory</FieldLabel>
                <PathLabel>{displayedManifest.exportsDir}</PathLabel>
              </FieldBlock>
            </>
          ) : null}
          {selectedTemplate ? (
            <Notice>
              <strong>{selectedTemplate.channelLabel}</strong>: {selectedTemplate.description}
            </Notice>
          ) : null}
        </StudioPanel>
        <StudioPanel>
          <SectionHeading>
            <SectionTitle>Generate new exports</SectionTitle>
            <SectionDescription>
              Use the local PackAds builder to render TikTok, Meta Reels, and other short-form
              template variants directly into the exports directory.
            </SectionDescription>
          </SectionHeading>
          <StudioForm onSubmit={handleSubmit}>
            <FieldGrid>
              <FieldBlock>
                <FieldLabel>Template</FieldLabel>
                <FieldSelect
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                  disabled={!displayedManifest || generateMutation.isPending}
                >
                  {displayedManifest?.templates.length ? null : (
                    <option value="">No templates found</option>
                  )}
                  {(displayedManifest?.templates ?? []).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title} · {template.channelLabel}
                    </option>
                  ))}
                </FieldSelect>
                <FieldHint>
                  Template tags stay visible below so you can distinguish TikTok-style and Meta
                  Reels outputs before generating.
                </FieldHint>
              </FieldBlock>
              <FieldBlock>
                <FieldLabel>Ad count</FieldLabel>
                <FieldSelect
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  disabled={generateMutation.isPending}
                >
                  {["1", "2", "3", "4", "5", "6"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </FieldSelect>
                <FieldHint>
                  Each run writes <code>ad_XXX.mp4</code> files into the template export folder.
                </FieldHint>
              </FieldBlock>
            </FieldGrid>
            <CheckboxRow>
              <input
                type="checkbox"
                checked={autoSubtitles}
                onChange={(event) => setAutoSubtitles(event.target.checked)}
                disabled={generateMutation.isPending}
              />
              Generate subtitle files for this run
            </CheckboxRow>
            <CheckboxRow>
              <input
                type="checkbox"
                checked={subtitleBurn}
                onChange={(event) => setSubtitleBurn(event.target.checked)}
                disabled={generateMutation.isPending || !autoSubtitles}
              />
              Burn subtitles into extra <code>.subtitled.mp4</code> exports
            </CheckboxRow>
            <StudioActionRow>
              <PrimaryButton type="submit" disabled={generateMutation.isPending || !templateId}>
                {generateMutation.isPending ? "Generating…" : "Generate videos"}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                disabled={latestManifestQuery.isFetching}
                onClick={() => {
                  void latestManifestQuery.refetch();
                }}
              >
                Refresh exports
              </SecondaryButton>
            </StudioActionRow>
          </StudioForm>
          {generateMutation.isError ? (
            <ErrorNotice>
              {generateMutation.error instanceof Error
                ? generateMutation.error.message
                : "Video generation failed."}
            </ErrorNotice>
          ) : null}
        </StudioPanel>
      </StudioGrid>
      <Grid>
        {(displayedManifest?.groups ?? []).map((group) => (
          <VideoGroupCard key={group.slug}>
            <Meta>
              <Kicker>
                {group.channelLabel}
                {group.tags.length > 0 ? ` · ${group.tags.join(" · ")}` : ""}
              </Kicker>
              <CardTitle>{group.title}</CardTitle>
              <CardBody>{group.description}</CardBody>
              <TagRow>
                {group.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </TagRow>
            </Meta>
            {group.variants.length > 0 ? (
              <VariantGrid>
                {group.variants.map((video) =>
                  renderVideoCard(video, group.featuredVideoSlug),
                )}
              </VariantGrid>
            ) : (
              <Notice>
                No exports have been generated for <code>{group.templateId}</code> on this
                machine yet. Use the generator above to write a local run into this folder.
              </Notice>
            )}
          </VideoGroupCard>
        ))}
        {displayedManifest && displayedManifest.groups.length === 0 ? (
          <Notice>No video templates were found in the local PackAds workspace.</Notice>
        ) : null}
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

export const LabsSoundmarksPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const reviewer =
    typeof window === "undefined"
      ? "default"
      : new URLSearchParams(window.location.search).get("reviewer")?.trim() ||
        "default";
  const reviewerSlug = reviewer
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "default";
  const round =
    typeof window === "undefined"
      ? "1"
      : new URLSearchParams(window.location.search).get("round")?.trim() || "1";
  const roundSlug = ["1", "2", "3"].includes(round) ? round : "1";
  const storagePrefix = `pack-labs-reference-soundmarks-v1:round-${roundSlug}:${reviewerSlug}`;
  const referenceSoundmarksQuery = useQuery({
    queryKey: ["labs", "soundmarks", "references", roundSlug],
    queryFn: () => loadReferenceSoundmarks(roundSlug),
  });
  const options = referenceSoundmarksQuery.data ?? [];
  const isShortlistRound = roundSlug === "3";
  const [browseIndex, setBrowseIndex] = React.useState(0);
  const readStoredSlugs = (key: string): string[] => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      return JSON.parse(window.localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };
  const writeStoredSlugs = (key: string, slugs: readonly string[]) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(slugs));
  };
  const likedKey = `${storagePrefix}:liked`;
  const rejectedKey = `${storagePrefix}:rejected`;
  const historyKey = `${storagePrefix}:history`;
  const [likedSlugs, setLikedSlugs] = React.useState<string[]>(() =>
    readStoredSlugs(likedKey),
  );
  const [rejectedSlugs, setRejectedSlugs] = React.useState<string[]>(() =>
    readStoredSlugs(rejectedKey),
  );
  const [history, setHistory] = React.useState<
    Array<{ decision: "yes" | "no"; slug: string }>
  >(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      return JSON.parse(window.localStorage.getItem(historyKey) || "[]");
    } catch {
      return [];
    }
  });

  const findNextSoundmark = (
    liked: readonly string[],
    rejected: readonly string[],
  ) => {
    const decided = new Set([...liked, ...rejected]);
    return options.find((soundmark) => !decided.has(soundmark.slug)) ?? null;
  };
  const browseSoundmarkIndex =
    options.length > 0 ? Math.min(browseIndex, options.length - 1) : 0;
  const currentSoundmark = isShortlistRound
    ? options[browseSoundmarkIndex] ?? null
    : findNextSoundmark(likedSlugs, rejectedSlugs);
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const playSoundmark = (soundmark: Soundmark) => {
    stopAudio();
    const audio = new Audio(soundmark.src);
    audioRef.current = audio;
    void audio.play();
  };

  const decide = (decision: "yes" | "no") => {
    if (!currentSoundmark || isShortlistRound) {
      return;
    }

    stopAudio();
    const nextLiked = likedSlugs.filter((slug) => slug !== currentSoundmark.slug);
    const nextRejected = rejectedSlugs.filter(
      (slug) => slug !== currentSoundmark.slug,
    );

    if (decision === "yes") {
      nextLiked.push(currentSoundmark.slug);
    } else {
      nextRejected.push(currentSoundmark.slug);
    }

    const nextHistory = [...history, { decision, slug: currentSoundmark.slug }];
    setLikedSlugs(nextLiked);
    setRejectedSlugs(nextRejected);
    setHistory(nextHistory);
    writeStoredSlugs(likedKey, nextLiked);
    writeStoredSlugs(rejectedKey, nextRejected);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    }
  };

  const browse = (direction: "previous" | "next") => {
    if (!isShortlistRound || options.length === 0) {
      return;
    }

    stopAudio();
    setBrowseIndex((currentIndex) => {
      if (direction === "previous") {
        return currentIndex === 0 ? options.length - 1 : currentIndex - 1;
      }

      return currentIndex === options.length - 1 ? 0 : currentIndex + 1;
    });
  };

  const undo = () => {
    const last = history.at(-1);

    if (!last) {
      return;
    }

    stopAudio();
    const nextLiked = likedSlugs.filter((slug) => slug !== last.slug);
    const nextRejected = rejectedSlugs.filter((slug) => slug !== last.slug);
    const nextHistory = history.slice(0, -1);
    setLikedSlugs(nextLiked);
    setRejectedSlugs(nextRejected);
    setHistory(nextHistory);
    writeStoredSlugs(likedKey, nextLiked);
    writeStoredSlugs(rejectedKey, nextRejected);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    }
  };

  const copyReviewJson = async () => {
    const payload = {
      v: 1,
      r: reviewerSlug,
      d: roundSlug,
      y: isShortlistRound ? options.map((soundmark) => soundmark.slug) : likedSlugs,
      n: isShortlistRound ? [] : rejectedSlugs,
    };
    const text = JSON.stringify(payload, null, 2);

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.log(text);
    }
  };
  const decideRef = React.useRef(decide);
  const browseRef = React.useRef(browse);
  const isShortlistRoundRef = React.useRef(isShortlistRound);
  const undoRef = React.useRef(undo);
  const playCurrentRef = React.useRef(() => {
    if (currentSoundmark) {
      playSoundmark(currentSoundmark);
    }
  });

  decideRef.current = decide;
  browseRef.current = browse;
  isShortlistRoundRef.current = isShortlistRound;
  undoRef.current = undo;
  playCurrentRef.current = () => {
    if (currentSoundmark) {
      playSoundmark(currentSoundmark);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        if (isShortlistRoundRef.current) {
          browseRef.current("previous");
        } else {
          decideRef.current("no");
        }
      } else if (event.key === "ArrowRight") {
        if (isShortlistRoundRef.current) {
          browseRef.current("next");
        } else {
          decideRef.current("yes");
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        playCurrentRef.current();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        undoRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <LabsShell
      title={localizedContent.soundmarks.title}
      description={localizedContent.soundmarks.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/soundmarks")}>
          {localizedContent.crumbs.soundmarks}
        </BreadcrumbLink>
      </BreadcrumbRow>
      <SoundmarkReviewShell>
        <ReviewerPill>
          Reviewer: {reviewerSlug} · Round {roundSlug}
        </ReviewerPill>
        {referenceSoundmarksQuery.isLoading ? (
          <SoundmarkReviewCard>
            <Kicker>{localizedContent.soundmarks.guidanceTitle}</Kicker>
            <SoundmarkReviewTitle>Loading references</SoundmarkReviewTitle>
            <CardBody>Loading the soundmark list.</CardBody>
          </SoundmarkReviewCard>
        ) : referenceSoundmarksQuery.isError ? (
          <SoundmarkReviewCard>
            <Kicker>{localizedContent.soundmarks.guidanceTitle}</Kicker>
            <SoundmarkReviewTitle>Could not load references</SoundmarkReviewTitle>
            <CardBody>
              Open the 100-reference board below, or refresh once the dev server
              has served the JSON file.
            </CardBody>
          </SoundmarkReviewCard>
        ) : currentSoundmark ? (
          <>
            <SoundmarkReviewCard>
              <Kicker>{currentSoundmark.useCase}</Kicker>
              <SoundmarkReviewTitle>{currentSoundmark.title}</SoundmarkReviewTitle>
              <CardBody>{currentSoundmark.description}</CardBody>
              <SoundmarkReviewMeta>
                <span>{currentSoundmark.duration}</span>
                <span>{currentSoundmark.src}</span>
              </SoundmarkReviewMeta>
            </SoundmarkReviewCard>
            <SoundmarkReviewControls>
              <SoundmarkReviewButton
                type="button"
                $tone="no"
                onClick={() =>
                  isShortlistRound ? browse("previous") : decide("no")
                }
              >
                {isShortlistRound ? "← Previous" : "← No"}
              </SoundmarkReviewButton>
              <div>
                <SoundmarkReviewButton
                  type="button"
                  $tone="play"
                  onClick={() => playSoundmark(currentSoundmark)}
                >
                  {localizedContent.soundmarks.playLabel}
                </SoundmarkReviewButton>
                {!isShortlistRound ? (
                  <SoundmarkReviewButton type="button" onClick={undo}>
                    Undo
                  </SoundmarkReviewButton>
                ) : null}
              </div>
              <SoundmarkReviewButton
                type="button"
                $tone="yes"
                onClick={() => (isShortlistRound ? browse("next") : decide("yes"))}
              >
                {isShortlistRound ? "Next →" : "Yes →"}
              </SoundmarkReviewButton>
            </SoundmarkReviewControls>
          </>
        ) : (
          <SoundmarkReviewCard>
            <Kicker>{localizedContent.soundmarks.guidanceTitle}</Kicker>
            <SoundmarkReviewTitle>Review complete</SoundmarkReviewTitle>
            <CardBody>
              Copy the review JSON and send it over so the next search can be
              tighter.
            </CardBody>
          </SoundmarkReviewCard>
        )}
        <SoundmarkReviewStats>
          {isShortlistRound ? (
            <>
              <span>
                Position{" "}
                <strong>
                  {options.length > 0 ? browseSoundmarkIndex + 1 : 0} / {options.length}
                </strong>
              </span>
              <span>
                Shortlist <strong>{options.length}</strong>
              </span>
            </>
          ) : (
            <>
              <span>
                Yes <strong>{likedSlugs.length}</strong>
              </span>
              <span>
                No <strong>{rejectedSlugs.length}</strong>
              </span>
              <span>
                Remaining{" "}
                <strong>
                  {Math.max(options.length - likedSlugs.length - rejectedSlugs.length, 0)}
                </strong>
              </span>
            </>
          )}
        </SoundmarkReviewStats>
        <LinkRow>
          <SecondaryLink as="button" type="button" onClick={copyReviewJson}>
            Copy review JSON
          </SecondaryLink>
          {!isShortlistRound ? (
            <SecondaryLink as="button" type="button" onClick={undo}>
              Undo
            </SecondaryLink>
          ) : null}
          <SecondaryLink href={`${pathFor("/labs/soundmarks")}?reviewer=matt`}>
            Start Matt review
          </SecondaryLink>
          <SecondaryLink
            href={`${pathFor("/labs/soundmarks")}?round=2&reviewer=${reviewerSlug}`}
          >
            Open round 2
          </SecondaryLink>
          <SecondaryLink
            href={`${pathFor("/labs/soundmarks")}?round=3&reviewer=${reviewerSlug}`}
          >
            Open round 3
          </SecondaryLink>
        </LinkRow>
      </SoundmarkReviewShell>
      <SectionHeading>
        <SectionTitle>{localizedContent.soundmarks.guidanceTitle}</SectionTitle>
        <SectionDescription>{localizedContent.soundmarks.guidanceBody}</SectionDescription>
      </SectionHeading>
      <LinkRow>
        <SecondaryLink href={localizedContent.soundmarks.referenceHuntHref}>
          {localizedContent.soundmarks.referenceHuntLabel}
        </SecondaryLink>
      </LinkRow>
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
