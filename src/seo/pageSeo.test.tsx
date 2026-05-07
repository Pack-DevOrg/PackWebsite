import React from "react";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import PageSeo, {
  createPersonSchema,
  createSoftwareApplicationSchema,
  TEAM_MEMBER_PROFILES,
} from "@/seo/pageSeo";

function renderPageSeo(schema: React.ComponentProps<typeof PageSeo>["schema"]) {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <HelmetProvider>
        <I18nProvider>
          <PageSeo
            title="Pack | AI travel assistant"
            description="Pack helps travelers organize trips."
            path="/"
            schema={schema}
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
});
