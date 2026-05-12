import React from "react";
import styled from "styled-components";
import { ArrowRight, CheckCircle, GitCompare, Search } from "lucide-react";
import PrefetchLink from "@/components/PrefetchLink";
import PageSeo, { buildAbsoluteUrl } from "@/seo/pageSeo";
import {
  isSeoGuideSlug,
  seoGuideDefinitionMap,
  type SeoGuideDefinition,
  type SeoGuideFaq,
} from "@/content/seoGuides";

const Page = styled.main`
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: var(--space-4) var(--space-3) var(--space-6);

  @media (min-width: 768px) {
    padding: var(--space-5) var(--space-4) var(--space-7);
  }
`;

const Header = styled.header`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
`;

const Eyebrow = styled.p`
  margin: 0;
  color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  max-width: 920px;
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  line-height: 1.08;

  @media (min-width: 768px) {
    font-size: var(--font-size-4xl);
  }
`;

const Intro = styled.p`
  max-width: 860px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-large);
  line-height: 1.7;
`;

const PillList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const Pill = styled.span`
  border: 1px solid rgba(243, 210, 122, 0.16);
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.045);
  color: var(--color-text-secondary);
  padding: 0.55rem 0.8rem;
  font-size: var(--font-size-small);
  line-height: 1.3;
`;

const Panel = styled.section`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  border: 1px solid rgba(243, 210, 122, 0.14);
  border-radius: var(--border-radius);
  background: rgba(255, 248, 236, 0.04);
  padding: var(--space-4);
`;

const PanelHeader = styled.div`
  display: flex;
  gap: var(--space-2);
  align-items: center;

  svg {
    width: 22px;
    height: 22px;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
  }
`;

const BodyText = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-5);

  @media (min-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Card = styled.article`
  display: grid;
  gap: var(--space-2);
  align-content: start;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.035);
  padding: var(--space-4);

  h2,
  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.65;
  }
`;

const BulletList = styled.ul`
  display: grid;
  gap: var(--space-2);
  margin: var(--space-1) 0 0;
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

const Section = styled.section`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
`;

const FaqGrid = styled.div`
  display: grid;
  gap: var(--space-3);
`;

const FaqItem = styled.article`
  display: grid;
  gap: var(--space-1);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--space-3);

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-medium);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }
`;

const LinkList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const RelatedLink = styled(PrefetchLink)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  color: var(--color-text-primary);
  text-decoration: none;
  padding: 0.65rem 0.9rem;
  font-weight: 700;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(243, 210, 122, 0.35);
    color: var(--color-accent);
  }
`;

function createFaqSchema(faqs: readonly SeoGuideFaq[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function createGuideSchema(guide: SeoGuideDefinition): Record<string, unknown> {
  return {
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url: buildAbsoluteUrl(`/guides/${guide.slug}`),
    author: {
      "@type": "Organization",
      name: "Pack",
    },
    publisher: {
      "@type": "Organization",
      name: "Pack",
      url: "https://www.trypackai.com",
    },
    mainEntityOfPage: buildAbsoluteUrl(`/guides/${guide.slug}`),
    keywords: guide.primaryKeywords.join(", "),
  };
}

const SeoGuidePage: React.FC<{ readonly slug?: string }> = ({ slug }) => {
  if (!isSeoGuideSlug(slug)) {
    return null;
  }

  const guide = seoGuideDefinitionMap[slug];
  const path = `/guides/${guide.slug}`;

  return (
    <Page>
      <PageSeo
        title={`${guide.title} | Pack`}
        description={guide.description}
        path={path}
        schema={[createGuideSchema(guide), createFaqSchema(guide.faqs)]}
      />
      <Header>
        <Eyebrow>{guide.eyebrow}</Eyebrow>
        <Title>{guide.title}</Title>
        <Intro>{guide.intro}</Intro>
        <PillList aria-label="Primary guide topics">
          {guide.primaryKeywords.map((keyword) => (
            <Pill key={keyword}>{keyword}</Pill>
          ))}
        </PillList>
      </Header>

      <Panel>
        <PanelHeader>
          <Search aria-hidden="true" />
          <h2>How Pack is different</h2>
        </PanelHeader>
        <BodyText>{guide.competitorFrame}</BodyText>
      </Panel>

      <Section>
        <SectionTitle>What Pack brings together</SectionTitle>
        <CardGrid>
          {guide.proofPoints.map((point) => (
            <Card key={point}>
              <BulletItem>
                <CheckCircle aria-hidden="true" />
                <span>{point}</span>
              </BulletItem>
            </Card>
          ))}
        </CardGrid>
      </Section>

      <CardGrid>
        {guide.sections.map((section) => (
          <Card key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            <BulletList>
              {section.points.map((point) => (
                <BulletItem key={point}>
                  <CheckCircle aria-hidden="true" />
                  <span>{point}</span>
                </BulletItem>
              ))}
            </BulletList>
          </Card>
        ))}
      </CardGrid>

      <Section>
        <SectionTitle>How to compare options</SectionTitle>
        <CardGrid>
          {guide.comparisons.map((comparison) => (
            <Card key={comparison.title}>
              <GitCompare aria-hidden="true" />
              <h3>{comparison.title}</h3>
              <p>{comparison.body}</p>
              <BulletList>
                {comparison.points.map((point) => (
                  <BulletItem key={point}>
                    <CheckCircle aria-hidden="true" />
                    <span>{point}</span>
                  </BulletItem>
                ))}
              </BulletList>
            </Card>
          ))}
        </CardGrid>
      </Section>

      <Panel>
        <PanelHeader>
          <Search aria-hidden="true" />
          <h2>Common questions</h2>
        </PanelHeader>
        <FaqGrid>
          {guide.faqs.map((faq) => (
            <FaqItem key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </FaqItem>
          ))}
        </FaqGrid>
      </Panel>

      <Section>
        <SectionTitle>Related Pack capabilities</SectionTitle>
        <LinkList>
          {guide.relatedLinks.map((link) => (
            <RelatedLink key={link.href} to={link.href}>
              {link.label}
              <ArrowRight aria-hidden="true" />
            </RelatedLink>
          ))}
        </LinkList>
      </Section>
    </Page>
  );
};

export default SeoGuidePage;
