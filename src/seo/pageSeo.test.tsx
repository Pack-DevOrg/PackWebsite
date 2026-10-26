import React from "react";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import fs from "node:fs";
import path from "node:path";
import PageSeo, {
  DEFAULT_SHARE_IMAGE_URL,
  HERO_SHARE_VIDEO_URL,
  SITE_ORIGIN,
  createPersonSchema,
  createSoftwareApplicationSchema,
  TEAM_MEMBER_PROFILES,
} from "@/seo/pageSeo";

function renderPageSeo(
  schema: React.ComponentProps<typeof PageSeo>["schema"],
  videoUrl?: string,
) {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <HelmetProvider>
        <I18nProvider>
          <PageSeo
            title="Pack | AI travel assistant"
            description="Pack helps travelers organize trips."
            path="/"
            schema={schema}
            videoUrl={videoUrl}
          />
        </I18nProvider>
      </HelmetProvider>
    </MemoryRouter>,
  );
}

describe("PageSeo", () => {
  afterEach(() => {
    document.head.querySelectorAll("script[type='application/ld+json']")
      .forEach((script) => script.remove());
  });

  it("emits one consolidated schema.org graph for base and page schema", async () => {
    renderPageSeo([
      createSoftwareApplicationSchema(
        "Pack",
        "AI travel assistant for trip planning and organization.",
      ),
      ...TEAM_MEMBER_PROFILES.map((member) => createPersonSchema(member)),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is Pack?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Pack is an AI travel assistant.",
            },
          },
        ],
      },
    ]);

    await waitFor(() => {
      expect(
        document.head.querySelectorAll("script[type='application/ld+json']"),
      ).toHaveLength(1);
    });

    const schemaScript = document.head.querySelector(
      "script[type='application/ld+json']",
    );
    const structuredData = JSON.parse(schemaScript?.textContent ?? "{}") as {
      readonly "@context"?: string;
      readonly "@graph"?: ReadonlyArray<Record<string, unknown>>;
    };

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@graph"]?.map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
      "WebPage",
      "SoftwareApplication",
      "Person",
      "Person",
      "FAQPage",
    ]);
    expect(structuredData["@graph"]?.[2]["@id"]).toBe(
      "https://www.trypackai.com/#webpage",
    );
    expect(structuredData["@graph"]?.[6]).not.toHaveProperty("@context");
  });

  function metaContent(selector: string): string | null | undefined {
    return document.head.querySelector(selector)?.getAttribute("content");
  }

  it("emits the og:video set next to unchanged og:image and twitter:card when a video url is given", async () => {
    renderPageSeo([], HERO_SHARE_VIDEO_URL);

    await waitFor(() => {
      expect(metaContent('meta[property="og:video"]')).toBe(HERO_SHARE_VIDEO_URL);
    });
    expect(HERO_SHARE_VIDEO_URL).toBe(`${SITE_ORIGIN}/videos/hero-share.mp4`);
    expect(metaContent('meta[property="og:video:secure_url"]')).toBe(HERO_SHARE_VIDEO_URL);
    expect(metaContent('meta[property="og:video:type"]')).toBe("video/mp4");
    expect(metaContent('meta[property="og:video:width"]')).toBe("1200");
    expect(metaContent('meta[property="og:video:height"]')).toBe("630");
    expect(metaContent('meta[property="og:image"]')).toBe(DEFAULT_SHARE_IMAGE_URL);
    expect(metaContent('meta[property="og:image:width"]')).toBe("1200");
    expect(metaContent('meta[property="og:image:height"]')).toBe("630");
    expect(metaContent('meta[name="twitter:card"]')).toBe("summary_large_image");
  });

  it("emits no og:video tag when the video url is absent", async () => {
    renderPageSeo([]);

    await waitFor(() => {
      expect(metaContent('meta[property="og:image"]')).toBe(DEFAULT_SHARE_IMAGE_URL);
    });
    expect(document.head.querySelectorAll('meta[property^="og:video"]')).toHaveLength(0);
  });

  it("points og:video at a file that ships in public/videos", () => {
    const file = path.join(
      process.cwd(),
      "public",
      new URL(HERO_SHARE_VIDEO_URL).pathname,
    );
    const head = fs.readFileSync(file).subarray(0, 4096);
    expect(head.includes(Buffer.from("ftyp"))).toBe(true);
    expect(head.includes(Buffer.from("moov"))).toBe(true);
    expect(fs.statSync(file).size).toBeLessThan(1024 * 1024);
  });
});
