import React from "react";
import { Helmet } from "react-helmet-async";
import { useI18n } from "@/i18n/I18nProvider";

export const SITE_ORIGIN = "https://www.trypackai.com";
const DEFAULT_SHARE_IMAGE_URL = `${SITE_ORIGIN}/images/og-image.png`;
const DEFAULT_TWITTER_IMAGE_URL = `${SITE_ORIGIN}/images/twitter-card.png`;
const DEFAULT_ROBOTS =
  "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

export type JsonLd =
  | Record<string, unknown>
  | {
      readonly "@context": string;
      readonly "@graph": readonly Record<string, unknown>[];
    };

interface PageSeoProps {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly imageUrl?: string;
  readonly twitterImageUrl?: string;
  readonly robots?: string;
  readonly schema?: readonly JsonLd[];
}

function normalizePath(pathname: string): string {
  if (pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function buildAbsoluteUrl(pathname: string): string {
  const normalizedPath = normalizePath(pathname);
  return normalizedPath === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${normalizedPath}`;
}

export function createOrganizationSchema(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Pack",
    url: SITE_ORIGIN,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_ORIGIN}/logo.png`,
    },
    description:
      "Pack is an AI travel assistant that turns prompts, confirmations, calendars, and preferences into organized trips you can review and book in one place.",
    foundingDate: "2024",
    email: "support@trypackai.com",
    sameAs: [
      "https://x.com/trypackai",
      "https://www.linkedin.com/company/106734468/",
      "https://www.instagram.com/trypackai/",
      "https://www.tiktok.com/@trypackai_",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "584 Castro St, Suite #4036",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94114",
      addressCountry: "US",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "support@trypackai.com",
        contactType: "customer support",
        availableLanguage: ["en", "es"],
      },
    ],
    knowsAbout: [
      "AI travel planning",
      "trip organization",
      "email confirmation parsing",
      "flight booking",
      "hotel booking",
      "travel itinerary management",
      "travel-day coordination",
    ],
    areaServed: {
      "@type": "Place",
      name: "Worldwide",
    },
  };
}

export function createWebsiteSchema(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_ORIGIN,
    name: "Pack",
    publisher: {
      "@id": ORGANIZATION_ID,
    },
    inLanguage: "en-US",
  };
}

export function createWebPageSchema(
  title: string,
  description: string,
  url: string,
): Record<string, unknown> {
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: title,
    description,
    url,
    isPartOf: {
      "@id": WEBSITE_ID,
    },
    about: {
      "@id": ORGANIZATION_ID,
    },
  };
}

export function createSoftwareApplicationSchema(
  title: string,
  description: string,
): Record<string, unknown> {
  return {
    "@type": "SoftwareApplication",
    "@id": `${SITE_ORIGIN}/#software-application`,
    name: title,
    description,
    url: SITE_ORIGIN,
    applicationCategory: "TravelApplication",
    operatingSystem: "iOS, Android, Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    },
    publisher: {
      "@id": ORGANIZATION_ID,
    },
  };
}

export default function PageSeo({
  title,
  description,
  path,
  imageUrl = DEFAULT_SHARE_IMAGE_URL,
  twitterImageUrl = DEFAULT_TWITTER_IMAGE_URL,
  robots = DEFAULT_ROBOTS,
  schema = [],
}: PageSeoProps): React.ReactElement {
  const { languageTag, pathFor, pathForLocale } = useI18n();
  const canonicalUrl = buildAbsoluteUrl(pathFor(path));
  const spanishUrl = buildAbsoluteUrl(pathForLocale(path, "es"));
  const englishUrl = buildAbsoluteUrl(pathForLocale(path, "en"));
  const structuredData: JsonLd[] = [
    {
      "@context": "https://schema.org",
      "@graph": [
        createOrganizationSchema(),
        createWebsiteSchema(),
        createWebPageSchema(title, description, canonicalUrl),
      ],
    },
    ...schema,
  ];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="author" content="Pack" />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={englishUrl} />
      <link rel="alternate" hrefLang="es" href={spanishUrl} />
      <link rel="alternate" hrefLang="x-default" href={englishUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Pack" />
      <meta property="og:locale" content={languageTag} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@trypackai" />
      <meta name="twitter:creator" content="@trypackai" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twitterImageUrl} />
      {structuredData.map((entry, index) => (
        <script key={`${canonicalUrl}-jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}
