import React from "react";
import styled from "styled-components";
import { CheckCircle, ArrowRight } from "lucide-react";
import WaitlistForm from "@/components/WaitlistForm";
import PrefetchLink from "@/components/PrefetchLink";
import { useMountEffect } from "@/hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";
import {
  capabilityPageDefinitions,
  capabilityPageDefinitionMap,
  type CapabilityPageSlug,
} from "@/content/capabilityPages";

const PageContainer = styled.section`
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-3);

  @media (min-width: 768px) {
    padding: var(--space-5) var(--space-4);
  }
`;

const Hero = styled.div`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  padding: var(--space-5);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius);
`;

const Eyebrow = styled.p`
  margin: 0;
  color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--font-size-2xl);
  color: var(--color-text-primary);

  @media (min-width: 768px) {
    font-size: var(--font-size-3xl);
  }
`;

const Subtitle = styled.p`
  margin: 0;
  max-width: 48rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-large);
  line-height: 1.6;
`;

const Intro = styled.p`
  margin: 0;
  max-width: 52rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-medium);
  line-height: 1.7;
`;

const CapabilityStrip = styled.div`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius);
`;

const CapabilityStripTitle = styled.h2`
  margin: 0;
  font-size: var(--font-size-large);
  color: var(--color-text-primary);
`;

const CapabilityChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const CapabilityChip = styled(PrefetchLink)<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.65rem 0.95rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) =>
      $active ? "rgba(249, 47, 96, 0.34)" : "rgba(255, 255, 255, 0.08)"};
  background: ${({ $active }) =>
    $active ? "rgba(249, 47, 96, 0.12)" : "rgba(255, 255, 255, 0.03)"};
  color: ${({ $active }) =>
    $active ? "var(--color-text-primary)" : "var(--color-text-secondary)"};
  text-decoration: none;
  font-size: var(--font-size-small);
  line-height: 1.2;

  &:hover {
    border-color: rgba(249, 47, 96, 0.3);
    color: var(--color-text-primary);
  }
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-5);

  @media (min-width: 960px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const SectionCard = styled.div`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--font-size-large);
  color: var(--color-text-primary);
`;

const BulletList = styled.ul`
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const BulletItem = styled.li`
  display: flex;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.6;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    margin-top: 0.15rem;
    color: var(--color-accent);
  }
`;

const SupportingPanel = styled.div`
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  background: rgba(249, 47, 96, 0.08);
  border: 1px solid rgba(249, 47, 96, 0.18);
  border-radius: var(--border-radius);
`;

const SupportingTitle = styled.h2`
  margin: 0;
  font-size: var(--font-size-large);
  color: var(--color-text-primary);
`;

const SupportingDescription = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
`;

const SupportingLink = styled(PrefetchLink)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: fit-content;
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: 600;

  &:hover {
    color: var(--color-accent);
  }
`;

const FaqSection = styled.div`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  padding: var(--space-5);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius);
`;

const FaqTitle = styled.h2`
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
`;

const FaqItem = styled.div`
  display: grid;
  gap: var(--space-1);
  padding-top: var(--space-2);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const Question = styled.h3`
  margin: 0;
  font-size: var(--font-size-medium);
  color: var(--color-text-primary);
`;

const Answer = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.7;
`;

const RelatedSection = styled.div`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
`;

const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const RelatedCard = styled(PrefetchLink)`
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius);
  color: inherit;
  text-decoration: none;

  &:hover {
    border-color: rgba(249, 47, 96, 0.3);
    transform: translateY(-2px);
  }
`;

const RelatedLabel = styled.h3`
  margin: 0;
  font-size: var(--font-size-medium);
  color: var(--color-text-primary);
`;

const RelatedDescription = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.6;
`;

const PagerSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-5);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const PagerCard = styled(PrefetchLink)`
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius);
  color: inherit;
  text-decoration: none;

  &:hover {
    border-color: rgba(249, 47, 96, 0.3);
  }
`;

const PagerLabel = styled.span`
  color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const PagerTitle = styled.h3`
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-medium);
`;

const PagerDescription = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.6;
`;

const CtaSection = styled.div`
  text-align: center;
  padding: var(--space-5);
  background: rgba(249, 47, 96, 0.1);
  border-radius: var(--border-radius);
  border: 1px solid rgba(249, 47, 96, 0.2);
`;

const CtaTitle = styled.h2`
  margin: 0 0 var(--space-2);
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
`;

const CtaBody = styled.p`
  margin: 0 0 var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-medium);
  line-height: 1.6;
`;

interface CapabilityLandingPageProps {
  readonly slug: CapabilityPageSlug;
}

const CapabilityLandingPage: React.FC<CapabilityLandingPageProps> = ({ slug }) => {
  const { pathFor } = useI18n();
  const page = capabilityPageDefinitionMap[slug];
  const pageIndex = capabilityPageDefinitions.findIndex(
    (definition) => definition.slug === slug
  );
  const previousPage =
    pageIndex >= 0
      ? capabilityPageDefinitions[
          (pageIndex - 1 + capabilityPageDefinitions.length) %
            capabilityPageDefinitions.length
        ]
      : null;
  const nextPage =
    pageIndex >= 0
      ? capabilityPageDefinitions[
          (pageIndex + 1) % capabilityPageDefinitions.length
        ]
      : null;

  useMountEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          name: page.pageTitle,
          description: page.pageSubtitle,
          url: `https://trypackai.com/${page.slug}`,
        },
        {
          "@type": "FAQPage",
          mainEntity: page.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        },
      ],
    };

    const existingSchema = document.querySelector(
      `script[data-schema="capability-${page.slug}"]`
    );
    if (existingSchema) {
      existingSchema.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", `capability-${page.slug}`);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const mountedSchema = document.querySelector(
        `script[data-schema="capability-${page.slug}"]`
      );
      if (mountedSchema) {
        mountedSchema.remove();
      }
    };
  });

  return (
    <PageContainer>
      <Hero>
        <Eyebrow>Pack capability</Eyebrow>
        <Title>{page.pageTitle}</Title>
        <Subtitle>{page.pageSubtitle}</Subtitle>
        <Intro>{page.intro}</Intro>
      </Hero>

      <CapabilityStrip>
        <CapabilityStripTitle>Explore more of what Pack can do</CapabilityStripTitle>
        <CapabilityChipList>
          {capabilityPageDefinitions.map((definition) => (
            <CapabilityChip
              key={definition.slug}
              to={pathFor(`/${definition.slug}`)}
              $active={definition.slug === slug}
            >
              {definition.navLabel}
            </CapabilityChip>
          ))}
        </CapabilityChipList>
      </CapabilityStrip>

      <SectionGrid>
        <SectionCard>
          <SectionTitle>{page.signalsTitle}</SectionTitle>
          <BulletList>
            {page.signals.map((signal) => (
              <BulletItem key={signal}>
                <CheckCircle />
                <span>{signal}</span>
              </BulletItem>
            ))}
          </BulletList>
        </SectionCard>

        <SectionCard>
          <SectionTitle>{page.helpTitle}</SectionTitle>
          <BulletList>
            {page.helpPoints.map((point) => (
              <BulletItem key={point}>
                <CheckCircle />
                <span>{point}</span>
              </BulletItem>
            ))}
          </BulletList>
        </SectionCard>

        <SectionCard>
          <SectionTitle>{page.outputTitle}</SectionTitle>
          <BulletList>
            {page.outputPoints.map((point) => (
              <BulletItem key={point}>
                <CheckCircle />
                <span>{point}</span>
              </BulletItem>
            ))}
          </BulletList>
        </SectionCard>
      </SectionGrid>

      {page.supportingLink ? (
        <SupportingPanel>
          <SupportingTitle>{page.supportingLink.label}</SupportingTitle>
          <SupportingDescription>
            {page.supportingLink.description}
          </SupportingDescription>
          <SupportingLink to={pathFor(page.supportingLink.href)}>
            Open the board
            <ArrowRight size={16} />
          </SupportingLink>
        </SupportingPanel>
      ) : null}

      <FaqSection>
        <FaqTitle>Frequently asked questions</FaqTitle>
        {page.faqs.map((faq) => (
          <FaqItem key={faq.question}>
            <Question>{faq.question}</Question>
            <Answer>{faq.answer}</Answer>
          </FaqItem>
        ))}
      </FaqSection>

      <RelatedSection>
        <FaqTitle>Related Pack pages</FaqTitle>
        <RelatedGrid>
          {page.related.map((relatedSlug) => {
            const relatedPage = capabilityPageDefinitionMap[
              relatedSlug as CapabilityPageSlug
            ];
            return (
              <RelatedCard key={relatedPage.slug} to={pathFor(`/${relatedPage.slug}`)}>
                <RelatedLabel>{relatedPage.navLabel}</RelatedLabel>
                <RelatedDescription>
                  {relatedPage.featureDescription}
                </RelatedDescription>
              </RelatedCard>
            );
          })}
        </RelatedGrid>
      </RelatedSection>

      {previousPage && nextPage ? (
        <PagerSection>
          <PagerCard to={pathFor(`/${previousPage.slug}`)}>
            <PagerLabel>Previous capability</PagerLabel>
            <PagerTitle>{previousPage.navLabel}</PagerTitle>
            <PagerDescription>
              {previousPage.featureDescription}
            </PagerDescription>
          </PagerCard>
          <PagerCard to={pathFor(`/${nextPage.slug}`)}>
            <PagerLabel>Next capability</PagerLabel>
            <PagerTitle>{nextPage.navLabel}</PagerTitle>
            <PagerDescription>
              {nextPage.featureDescription}
            </PagerDescription>
          </PagerCard>
        </PagerSection>
      ) : null}

      <CtaSection>
        <CtaTitle>See how Pack would handle this for your next trip</CtaTitle>
        <CtaBody>
          Join the waitlist for early access to a travel system that keeps planning,
          travel context, and travel-day utility connected.
        </CtaBody>
        <WaitlistForm />
      </CtaSection>
    </PageContainer>
  );
};

export default CapabilityLandingPage;
