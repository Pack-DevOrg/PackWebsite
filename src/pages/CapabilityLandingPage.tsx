import React from "react";
import styled from "styled-components";
import { CheckCircle, ArrowRight, LayoutGrid } from "lucide-react";
import WaitlistForm from "@/components/WaitlistForm";
import PrefetchLink from "@/components/PrefetchLink";
import FeaturePhone, { useFeatureMediaAvailable } from "@/components/FeaturePhone";
import CarouselTabBand from "@/components/CarouselTabBand";
import { capabilityIcons } from "@/components/capabilityIcons";
import { useI18n } from "@/i18n/I18nProvider";
import PageSeo, { buildAbsoluteUrl } from "@/seo/pageSeo";
import { createFeatureVideoSchema } from "@/seo/videoSchema";
import {
  capabilityPageDefinitionMap,
  type CapabilityPageSlug,
} from "@/content/capabilityPages";
import {
  capabilityScreenMap,
  journeyOrderedCapabilitySlugs,
} from "@/content/featureScreens";

const PageContainer = styled.section`
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-3);

  @media (min-width: 768px) {
    padding: var(--space-5) var(--space-4);
  }
`;

/* The features family's shared header: same band as the /features showcase,
   here in link mode — every capability is a sibling tab, chevrons walk the
   journey order, and the leading Overview tab returns to the showcase. */
const BandWrap = styled.div`
  margin-bottom: var(--space-4);
`;

const PageGrid = styled.div<{ $withPhone: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);

  @media (min-width: 1080px) {
    grid-template-columns: ${({ $withPhone }) =>
      $withPhone ? "minmax(13rem, 16rem) minmax(0, 1fr)" : "minmax(0, 1fr)"};
    align-items: start;
  }
`;

/* The demo clip of this feature's screen rides along as you read. */
const PhoneRail = styled.aside`
  display: none;

  @media (min-width: 1080px) {
    display: grid;
    gap: var(--space-2);
    position: sticky;
    top: 5.5rem;
  }
`;

const PhoneRailCaption = styled(PrefetchLink)`
  justify-self: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  text-decoration: none;

  b {
    color: var(--color-accent);
    font-weight: 600;
  }

  &:hover {
    color: var(--color-text-primary);
  }
`;

const ContentColumn = styled.div`
  min-width: 0;
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

const NarrativeSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-5);

  @media (min-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const NarrativeCard = styled.div`
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius);
`;

const NarrativeLabel = styled.p`
  margin: 0;
  color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const NarrativeTitle = styled.h2`
  margin: 0;
  font-size: var(--font-size-large);
  color: var(--color-text-primary);
`;

const NarrativeBody = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-medium);
  line-height: 1.7;
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
  const screen = capabilityScreenMap[slug];
  const mediaAvailable = useFeatureMediaAvailable();
  const withPhone = Boolean(screen) && mediaAvailable;
  const canonicalPath = `/${page.slug}`;
  // The clip of this capability's screen plays in the page's phone rail;
  // its VideoObject makes the page eligible for video indexing.
  const videoSchema = screen
    ? createFeatureVideoSchema(screen.id, canonicalPath)
    : null;
  const capabilitySchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${buildAbsoluteUrl(canonicalPath)}#faq`,
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

  return (
    <PageContainer>
      <PageSeo
        title={`${page.seoTitle ?? page.pageTitle} | Pack`}
        description={page.seoDescription ?? page.pageSubtitle}
        path={canonicalPath}
        schema={videoSchema ? [capabilitySchema, videoSchema] : [capabilitySchema]}
      />
      <BandWrap>
        <CarouselTabBand
          ariaLabel="Pack features"
          activeId={slug}
          items={[
            {
              id: "features-overview",
              label: "Overview",
              icon: <LayoutGrid />,
              href: pathFor("/features"),
            },
            ...journeyOrderedCapabilitySlugs.map((capabilitySlug) => {
              const definition = capabilityPageDefinitionMap[capabilitySlug];
              return {
                id: capabilitySlug,
                label: definition.chipLabel ?? definition.navLabel,
                icon: capabilityIcons[capabilitySlug],
                href: pathFor(`/${capabilitySlug}`),
              };
            }),
          ]}
        />
      </BandWrap>
      <PageGrid $withPhone={withPhone}>
        {withPhone && screen ? (
          <PhoneRail>
            <FeaturePhone
              screenId={screen.id}
              active
              withVideo
              loop
              preload="auto"
            />
            <PhoneRailCaption to={pathFor("/features")}>
              In the app: <b>{screen.label}</b> — see all screens
            </PhoneRailCaption>
          </PhoneRail>
        ) : null}
        <ContentColumn>
      <Hero>
        <Eyebrow>Pack feature</Eyebrow>
        <Title>{page.pageTitle}</Title>
        <Subtitle>{page.pageSubtitle}</Subtitle>
        <Intro>{page.intro}</Intro>
      </Hero>

      <NarrativeSection>
        <NarrativeCard>
          <NarrativeLabel>Traveler Problem</NarrativeLabel>
          <NarrativeTitle>The problem we kept seeing as travelers</NarrativeTitle>
          <NarrativeBody>{page.problemStatement}</NarrativeBody>
        </NarrativeCard>

        <NarrativeCard>
          <NarrativeLabel>Pack Solution</NarrativeLabel>
          <NarrativeTitle>How this feature solves it</NarrativeTitle>
          <NarrativeBody>{page.solutionStatement}</NarrativeBody>
        </NarrativeCard>
      </NarrativeSection>

      <SectionGrid>
        <SectionCard>
          <SectionTitle>Where the friction shows up</SectionTitle>
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
          <SectionTitle>How Pack solves it</SectionTitle>
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
          <SectionTitle>What changes for the traveler</SectionTitle>
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
        <FaqTitle>Common travel problems this helps solve</FaqTitle>
        {page.faqs.map((faq) => (
          <FaqItem key={faq.question}>
            <Question>{faq.question}</Question>
            <Answer>{faq.answer}</Answer>
          </FaqItem>
        ))}
      </FaqSection>

      <CtaSection>
        <CtaTitle>See how Pack would handle this for your next trip</CtaTitle>
        <CtaBody>
          Join the waitlist for early access to a travel system that keeps planning,
          travel context, and travel-day utility connected.
        </CtaBody>
        <WaitlistForm />
      </CtaSection>
        </ContentColumn>
      </PageGrid>
    </PageContainer>
  );
};

export default CapabilityLandingPage;
