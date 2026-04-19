import {useMountEffect} from "@/hooks/useMountEffect";
import {
  capabilityPageDefinitionMap,
  capabilityPageDefinitions,
  type CapabilityPageDefinition,
  type CapabilityPageSlug,
} from "@/content/capabilityPages";

type WebMcpToolResult =
  | string
  | number
  | boolean
  | null
  | {[key: string]: WebMcpToolResult}
  | readonly WebMcpToolResult[];

type CapabilitySummary = {
  slug: CapabilityPageSlug;
  navLabel: string;
  featureTitle: string;
  featureDescription: string;
  canonicalUrl: string;
  related: string[];
};

const createCapabilityUrl = (slug: CapabilityPageSlug): string =>
  `${window.location.origin}/${slug}`;

const toCapabilitySummary = (
  page: CapabilityPageDefinition,
): CapabilitySummary => ({
  slug: page.slug as CapabilityPageSlug,
  navLabel: page.navLabel,
  featureTitle: page.featureTitle,
  featureDescription: page.featureDescription,
  canonicalUrl: createCapabilityUrl(page.slug as CapabilityPageSlug),
  related: page.related.map((relatedSlug) =>
    `${window.location.origin}/${relatedSlug}`,
  ),
});

const scoreCapability = (
  page: CapabilityPageDefinition,
  query: string,
): number => {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const haystack = [
    page.slug,
    page.navLabel,
    page.featureTitle,
    page.featureDescription,
    page.pageTitle,
    page.pageSubtitle,
    page.intro,
    page.problemStatement,
    page.solutionStatement,
    ...page.signals,
    ...page.helpPoints,
    ...page.outputPoints,
    ...page.related,
    ...page.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (page.slug.includes(term)) {
      score += 8;
    }
    if (page.navLabel.toLowerCase().includes(term)) {
      score += 6;
    }
    if (page.featureTitle.toLowerCase().includes(term)) {
      score += 5;
    }
    if (page.featureDescription.toLowerCase().includes(term)) {
      score += 4;
    }
    if (page.pageTitle.toLowerCase().includes(term)) {
      score += 3;
    }
    if (haystack.includes(term)) {
      score += 1;
    }
  }

  return score;
};

const parseCapabilitySlugInput = (
  input: unknown,
): {slug: CapabilityPageSlug} => input as {slug: CapabilityPageSlug};

const parseCapabilityRecommendationInput = (
  input: unknown,
): {goal: string; limit?: number} => input as {goal: string; limit?: number};

const registerTools = (): void | (() => void) => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return;
  }

  const modelContext = navigator.modelContext;
  if (!modelContext) {
    return;
  }

  const abortController = new AbortController();
  const toolDefinitions: ModelContextToolDefinition[] = [
    {
      name: "pack.list_capabilities",
      title: "List Pack Capabilities",
      description:
        "List Pack capability pages that agents should use for feature-specific product questions.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: async (): Promise<WebMcpToolResult> => ({
        capabilities: capabilityPageDefinitions.map((page) =>
          toCapabilitySummary(page),
        ),
      }),
    },
    {
      name: "pack.get_capability_details",
      title: "Get Pack Capability Details",
      description:
        "Return the best public Pack capability page details for one specific capability.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: {
            type: "string",
            enum: capabilityPageDefinitions.map((page) => page.slug),
          },
        },
        required: ["slug"],
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: async (input: unknown): Promise<WebMcpToolResult> => {
        const {slug} = parseCapabilitySlugInput(input);
        const page = capabilityPageDefinitionMap[slug];
        return {
          slug: page.slug,
          navLabel: page.navLabel,
          pageTitle: page.pageTitle,
          pageSubtitle: page.pageSubtitle,
          intro: page.intro,
          featureTitle: page.featureTitle,
          featureDescription: page.featureDescription,
          signals: page.signals,
          helpPoints: page.helpPoints,
          outputPoints: page.outputPoints,
          faqs: page.faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
          })),
          canonicalUrl: createCapabilityUrl(page.slug as CapabilityPageSlug),
          related: page.related.map((relatedSlug) => ({
            slug: relatedSlug,
            url: `${window.location.origin}/${relatedSlug}`,
          })),
        };
      },
    },
    {
      name: "pack.recommend_capabilities",
      title: "Recommend Pack Capabilities",
      description:
        "Recommend the best Pack capability pages for a user goal such as booking, updating a trip, group travel, or travel-day readiness.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          goal: {
            type: "string",
            minLength: 1,
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 5,
          },
        },
        required: ["goal"],
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: async (input: unknown): Promise<WebMcpToolResult> => {
        const request = parseCapabilityRecommendationInput(input);
        const matches = capabilityPageDefinitions
          .map((page) => ({
            page,
            score: scoreCapability(page, request.goal),
          }))
          .filter((entry) => entry.score > 0)
          .sort((left, right) => right.score - left.score)
          .slice(0, request.limit ?? 3)
          .map((entry) => ({
            ...toCapabilitySummary(entry.page),
            score: entry.score,
            reason: entry.page.pageSubtitle,
          }));

        return {
          goal: request.goal,
          matches,
        };
      },
    },
    {
      name: "pack.get_support_resources",
      title: "Get Pack Support Resources",
      description:
        "Return the primary public Pack support, privacy, accessibility, and legal resources.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: async (): Promise<WebMcpToolResult> => ({
        supportEmail: "support@trypackai.com",
        resources: [
          {name: "Support", url: `${window.location.origin}/support`},
          {name: "FAQ", url: `${window.location.origin}/faq`},
          {name: "Accessibility", url: `${window.location.origin}/accessibility`},
          {name: "Privacy Policy", url: `${window.location.origin}/PrivacyPolicy`},
          {name: "Terms of Service", url: `${window.location.origin}/TermsOfService`},
          {name: "Authorized Agent", url: `${window.location.origin}/AuthorizedAgent`},
        ],
      }),
    },
  ];

  if (typeof modelContext.registerTool === "function") {
    for (const tool of toolDefinitions) {
      try {
        modelContext.registerTool(tool, {signal: abortController.signal});
      } catch (error) {
        console.warn("Pack WebMCP tool registration failed", {
          toolName: tool.name,
          error,
        });
      }
    }
  }

  const compatibilityProvideContext = (
    modelContext as {
      provideContext?: (context: {tools: readonly unknown[]}) => void;
    }
  ).provideContext;
  if (typeof compatibilityProvideContext === "function") {
    try {
      compatibilityProvideContext({
        tools: toolDefinitions,
      });
    } catch (error) {
      console.warn("Pack WebMCP provideContext compatibility call failed", {
        error,
      });
    }
  }

  return () => {
    abortController.abort();
  };
};

export const WebMcpRegistrar = (): null => {
  useMountEffect(() => registerTools());
  return null;
};
