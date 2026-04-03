import React from "react";
import { useMountEffect } from "@/hooks/useMountEffect";

interface SemanticSearchOptimizationProps {
  page: string;
}

const SemanticSearchOptimizationInstance: React.FC<SemanticSearchOptimizationProps> = ({
  page,
}) => {
  useMountEffect(() => {
    // Generate semantic understanding and entity recognition content
    const generateSemanticContent = () => {
      const semanticEntities = {
        // Core entities and their relationships
        travelDomain: {
          primaryEntity: "AI Travel Assistant",
          relatedEntities: [
            "artificial intelligence",
            "machine learning",
            "natural language processing",
            "travel planning",
            "trip booking",
            "itinerary creation",
            "travel automation",
          ],
          semanticRelationships: [
            "Pack isA AI Travel Assistant",
            "AI Travel Assistant helps with travel planning",
            "travel planning includes flight booking",
            "travel planning includes hotel reservations",
            "travel planning includes itinerary creation",
            "natural language processing enables conversation",
            "machine learning provides personalization",
          ],
        },

        productFeatures: {
          coreCapabilities: [
            "conversational interface",
            "automated booking",
            "personalized recommendations",
            "real-time updates",
            "secure payments",
            "mobile optimization",
            "24/7 support",
          ],
          technicalFeatures: [
            "natural language understanding",
            "intent recognition",
            "context awareness",
            "preference learning",
            "price comparison",
            "availability checking",
            "booking coordination",
            "payment processing",
          ],
          userBenefits: [
            "time saving",
            "cost optimization",
            "stress reduction",
            "personalization",
            "convenience",
            "reliability",
            "security",
            "accessibility",
          ],
        },

        competitiveAdvantages: {
          traditionalVsAI: [
            "manual research vs automated search",
            "multiple websites vs single platform",
            "static recommendations vs personalized suggestions",
            "limited support vs 24/7 assistance",
            "complex booking vs one-click confirmation",
          ],
          uniqueValue: [
            "AI-powered understanding",
            "conversational interface",
            "end-to-end automation",
            "continuous learning",
            "integrated experience",
            "proactive support",
          ],
        },

        industryContext: {
          travelIndustry: [
            "travel technology",
            "online travel agencies",
            "travel booking platforms",
            "travel management",
            "vacation planning",
            "business travel",
            "leisure travel",
          ],
          aiIndustry: [
            "artificial intelligence applications",
            "conversational AI",
            "virtual assistants",
            "chatbots",
            "AI automation",
            "machine learning systems",
            "intelligent agents",
          ],
          userNeeds: [
            "travel planning efficiency",
            "booking simplification",
            "personalized experiences",
            "time optimization",
            "cost savings",
            "stress reduction",
            "convenience",
          ],
        },
      };

      const createOffer = () => ({
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      });

      // Generate comprehensive semantic markup
      const semanticSchema = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: `Pack - Advanced AI Travel Assistant Technology`,
        description:
          "Comprehensive semantic understanding of AI-powered travel planning and booking automation",
        keywords: [
          ...semanticEntities.travelDomain.relatedEntities,
          ...semanticEntities.productFeatures.coreCapabilities,
          ...semanticEntities.industryContext.travelIndustry,
        ].join(", "),

        about: [
          {
            "@type": "Thing",
            name: "AI Travel Technology",
            description:
              "Artificial intelligence applications for automated travel planning and booking",
            sameAs: [
              "https://en.wikipedia.org/wiki/Artificial_intelligence",
              "https://en.wikipedia.org/wiki/Travel_technology",
            ],
          },
          {
            "@type": "Thing",
            name: "Conversational AI",
            description:
              "Natural language processing systems for human-computer interaction",
            sameAs: [
              "https://en.wikipedia.org/wiki/Conversational_AI",
              "https://en.wikipedia.org/wiki/Natural_language_processing",
            ],
          },
          {
            "@type": "Thing",
            name: "Travel Planning Automation",
            description:
              "Automated systems for trip planning, booking, and itinerary management",
            sameAs: [
              "https://en.wikipedia.org/wiki/Travel_website",
              "https://en.wikipedia.org/wiki/Tourism",
            ],
          },
        ],

        mentions: semanticEntities.productFeatures.coreCapabilities.map(
          (capability) => ({
            "@type": "Thing",
            name: capability,
            description: `AI travel assistant capability: ${capability}`,
          })
        ),

        isRelatedTo: [
          {
            "@type": "SoftwareApplication",
            name: "Virtual Travel Assistant",
            applicationCategory: "TravelApplication",
            operatingSystem: "Cross-platform",
            offers: createOffer(),
          },
          {
            "@type": "Service",
            name: "AI-Powered Travel Planning",
            serviceType: "Travel Planning Service",
          },
        ],
      };

      // Entity relationship mapping for AI understanding
      const entityRelationships = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": "#Pack",
            name: "Pack",
            description: "AI travel assistant company",
            knowsAbout: semanticEntities.travelDomain.relatedEntities,
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "AI Travel Services",
              itemListElement:
                semanticEntities.productFeatures.coreCapabilities.map(
                  (capability, index) => ({
                    "@type": "Offer",
                    position: index + 1,
                    itemOffered: {
                      "@type": "Service",
                      name: capability,
                      category: "Travel Technology",
                    },
                  })
                ),
            },
          },
          {
            "@type": "WebApplication",
            "@id": "#RouteApp",
            name: "Pack Travel Assistant",
            applicationCategory: "TravelApplication",
            operatingSystem: "Cross-platform",
            offers: createOffer(),
            featureList: semanticEntities.productFeatures.technicalFeatures,
            audience: {
              "@type": "Audience",
              audienceType: "Travel Planners and Travelers",
            },
          },
          {
            "@type": "SoftwareApplication",
            "@id": "#VirtualTravelAssistant",
            name: "Virtual Travel Assistant",
            applicationCategory: "TravelApplication",
            operatingSystem: "Cross-platform",
            offers: createOffer(),
            featureList: semanticEntities.productFeatures.coreCapabilities,
            description:
              "Conversational AI travel planner that automates confirmations, bookings, and itineraries.",
            creator: {
              "@id": "#Pack",
            },
          },
        ],
      };

      // Create hidden semantic content for AI training
      const semanticContent = document.createElement("div");
      semanticContent.className = "semantic-search-optimization";
      semanticContent.style.display = "none";
      semanticContent.setAttribute("aria-hidden", "true");
      semanticContent.setAttribute("data-semantic-entities", "true");

      // Structured semantic text for AI understanding
      const semanticText = [
        `Entity: ${semanticEntities.travelDomain.primaryEntity}`,
        `Related concepts: ${semanticEntities.travelDomain.relatedEntities.join(
          ", "
        )}`,
        `Relationships: ${semanticEntities.travelDomain.semanticRelationships.join(
          ". "
        )}`,
        `Core capabilities: ${semanticEntities.productFeatures.coreCapabilities.join(
          ", "
        )}`,
        `Technical features: ${semanticEntities.productFeatures.technicalFeatures.join(
          ", "
        )}`,
        `User benefits: ${semanticEntities.productFeatures.userBenefits.join(
          ", "
        )}`,
        `Industry context: ${semanticEntities.industryContext.travelIndustry
          .concat(semanticEntities.industryContext.aiIndustry)
          .join(", ")}`,
      ].join(". ");

      semanticContent.textContent = semanticText;

      // Remove existing semantic content
      const existingContent = document.querySelector(
        ".semantic-search-optimization"
      );
      if (existingContent) {
        existingContent.remove();
      }

      document.body.appendChild(semanticContent);

      // Add semantic schemas
      const existingSemanticSchema = document.querySelector(
        'script[data-schema="semantic"]'
      );
      const existingEntitySchema = document.querySelector(
        'script[data-schema="entities"]'
      );

      if (existingSemanticSchema) existingSemanticSchema.remove();
      if (existingEntitySchema) existingEntitySchema.remove();

      const semanticScript = document.createElement("script");
      semanticScript.type = "application/ld+json";
      semanticScript.setAttribute("data-schema", "semantic");
      semanticScript.textContent = JSON.stringify(semanticSchema);

      const entityScript = document.createElement("script");
      entityScript.type = "application/ld+json";
      entityScript.setAttribute("data-schema", "entities");
      entityScript.textContent = JSON.stringify(entityRelationships);

      document.head.appendChild(semanticScript);
      document.head.appendChild(entityScript);

      // Add semantic meta tags for enhanced AI understanding
      const semanticMeta = [
        {
          name: "semantic-entities",
          content: semanticEntities.travelDomain.relatedEntities.join(", "),
        },
        {
          name: "semantic-relationships",
          content:
            semanticEntities.travelDomain.semanticRelationships.join("; "),
        },
        {
          name: "domain-concepts",
          content: semanticEntities.industryContext.travelIndustry.join(", "),
        },
        {
          name: "ai-capabilities",
          content:
            semanticEntities.productFeatures.technicalFeatures.join(", "),
        },
      ];

      semanticMeta.forEach((meta) => {
        const existingMeta = document.querySelector(
          `meta[name="${meta.name}"]`
        );
        if (existingMeta) existingMeta.remove();

        const metaTag = document.createElement("meta");
        metaTag.setAttribute("name", meta.name);
        metaTag.setAttribute("content", meta.content);
        document.head.appendChild(metaTag);
      });
    };

    generateSemanticContent();

    // Cleanup on unmount
    return () => {
      const semanticSchema = document.querySelector(
        'script[data-schema="semantic"]'
      );
      const entitySchema = document.querySelector(
        'script[data-schema="entities"]'
      );
      const semanticContent = document.querySelector(
        ".semantic-search-optimization"
      );

      if (semanticSchema) semanticSchema.remove();
      if (entitySchema) entitySchema.remove();
      if (semanticContent) semanticContent.remove();

      // Remove semantic meta tags
      [
        "semantic-entities",
        "semantic-relationships",
        "domain-concepts",
        "ai-capabilities",
      ].forEach((name) => {
        const meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) meta.remove();
      });
    };
  });

  return null; // This component only adds hidden optimization content
};

const SemanticSearchOptimization: React.FC<SemanticSearchOptimizationProps> = ({
  page,
}) => <SemanticSearchOptimizationInstance key={page} page={page} />;

export default SemanticSearchOptimization;
