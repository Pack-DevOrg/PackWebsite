import React from "react";
import styled from "styled-components";
import {
  BarChart3,
  CalendarCheck,
  Clock3,
  Cloud,
  GitBranch,
  MailSearch,
  Plane,
  SearchCheck,
} from "lucide-react";
import PageSeo, { buildAbsoluteUrl } from "@/seo/pageSeo";

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

const Kicker = styled.p`
  margin: 0;
  color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  max-width: 820px;
  margin: 0;
  color: var(--color-text-primary);
  font-size: clamp(2rem, 5vw, 4.25rem);
  line-height: 1.02;
`;

const Intro = styled.p`
  max-width: 760px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-large);
  line-height: 1.7;
`;

const MetaGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
  margin: var(--space-4) 0 0;
`;

const MetaItem = styled.div`
  border: 1px solid rgba(243, 210, 122, 0.14);
  border-radius: var(--border-radius);
  background: rgba(255, 248, 236, 0.04);
  padding: var(--space-3);

  dt {
    color: var(--color-text-secondary);
    font-size: var(--font-size-small);
    margin-bottom: 0.35rem;
  }

  dd {
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
    font-weight: 700;
    margin: 0;
  }
`;

const Section = styled.section`
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-5);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
`;

const SectionText = styled.p`
  max-width: 780px;
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-3);
`;

const Card = styled.article`
  display: grid;
  align-content: start;
  gap: var(--space-2);
  min-height: 190px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.035);
  padding: var(--space-4);

  svg {
    width: 28px;
    height: 28px;
    color: var(--color-accent);
  }

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
`;

const CommandBlock = styled.pre`
  overflow-x: auto;
  margin: 0;
  border: 1px solid rgba(243, 210, 122, 0.12);
  border-radius: var(--border-radius);
  background: rgba(0, 0, 0, 0.32);
  color: var(--color-text-primary);
  padding: var(--space-4);
  font-size: var(--font-size-small);
  line-height: 1.7;
`;

const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const Note = styled.p`
  max-width: 860px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.7;
`;

const TextLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const flowCards = [
  {
    title: "Trip parsing",
    body:
      "Recover the real travel state from a noisy household inbox and calendar, including forwarded flight and hotel confirmations.",
    icon: MailSearch,
  },
  {
    title: "Trip planning",
    body:
      "Resolve natural requests against private constraints, public events, existing bookings, and calendar conflicts.",
    icon: CalendarCheck,
  },
  {
    title: "Travel search",
    body:
      "Select flights and hotels from synthetic inventory with prices, seat counts, room fit, timing, and preference traps.",
    icon: Plane,
  },
  {
    title: "Scored efficiency",
    body:
      "Report quality, pass rate, cost, tokens, tool calls, score per dollar, and score per minute for each agent run.",
    icon: BarChart3,
  },
];

const awsCards = [
  {
    title: "Prepare jobs",
    body:
      "Generate S3 case inputs and SQS messages from a checked manifest covering the public dev suite.",
    icon: Cloud,
  },
  {
    title: "Run workers",
    body:
      "Fargate-compatible workers fetch cases, expose local tools, call any HTTP-compatible agent, score, and write S3 artifacts.",
    icon: SearchCheck,
  },
  {
    title: "Collect results",
    body:
      "Aggregate per-case run bundles into run.json, case-results.jsonl, summary.json, and leaderboard.json.",
    icon: Clock3,
  },
];

const TravelContextBenchmark = () => (
  <Page>
    <PageSeo
      title="Travel Context Benchmark | Pack"
      description="Pack's AWS-runnable benchmark for evaluating travel agents on noisy household context, public events, mock flight and hotel search, quality, time, and cost."
      path="/benchmark/travel-context"
      schema={[
        {
          "@type": "Dataset",
          name: "Travel Context Benchmark",
          description:
            "Synthetic benchmark for evidence-grounded travel agents over household email, calendar, public events, and mock travel inventory.",
          url: buildAbsoluteUrl("/benchmark/travel-context"),
          license: "https://www.apache.org/licenses/LICENSE-2.0",
          creator: {
            "@type": "Organization",
            name: "Pack",
          },
        },
      ]}
    />
    <Header>
      <Kicker>Benchmark v0</Kicker>
      <Title>Travel agents should handle the mess around the trip.</Title>
      <Intro>
        Travel Context Benchmark evaluates whether an agent can parse a noisy
        household inbox, plan around calendars and public events, search mock
        flights and hotels, and report quality, runtime, and cost.
      </Intro>
      <MetaGrid>
        <MetaItem>
          <dt>Public scenarios</dt>
          <dd>30</dd>
        </MetaItem>
        <MetaItem>
          <dt>Hard prompt seeds</dt>
          <dd>100</dd>
        </MetaItem>
        <MetaItem>
          <dt>Inbox smoke</dt>
          <dd>10k/person</dd>
        </MetaItem>
        <MetaItem>
          <dt>Inventory smoke</dt>
          <dd>1M + 1M</dd>
        </MetaItem>
      </MetaGrid>
    </Header>

    <Section>
      <SectionTitle>What It Measures</SectionTitle>
      <SectionText>
        The benchmark is designed for realistic travel-agent workflows: short
        human prompts, relevant private context buried among stale travel items,
        calendar blocks, public event timing, and flight or hotel options that
        can be valid, invalid, cheap, expensive, useful, or distracting.
      </SectionText>
      <CardGrid>
        {flowCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <Icon aria-hidden="true" />
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </Card>
          );
        })}
      </CardGrid>
    </Section>

    <Section>
      <SectionTitle>AWS Run Path</SectionTitle>
      <SectionText>
        The repo includes an AWS-oriented execution path: a manifest builder, a
        run-prep step that writes S3 inputs and SQS messages, a worker entrypoint
        for Fargate, and a collector for official score artifacts.
      </SectionText>
      <CardGrid>
        {awsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <Icon aria-hidden="true" />
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </Card>
          );
        })}
      </CardGrid>
    </Section>

    <Section>
      <SectionTitle>Official Score Policy</SectionTitle>
      <SectionText>
        Official results use the full no-grace harness: tens of thousands of
        synthetic inbox messages, large flight and hotel inventories exposed
        through benchmark APIs, strict schema validation, and fully loaded cost
        accounting. Invalid model JSON, invalid evidence kinds, and missing
        required fields fail the case instead of being repaired.
      </SectionText>
      <Note>
        The current public page intentionally does not show the earlier 20-case
        scaffold diagnostics as a leaderboard. Those runs validated the runner,
        not the real full-corpus benchmark.
      </Note>
    </Section>

    <Section>
      <SectionTitle>Run It Locally</SectionTitle>
      <CommandBlock>{`npm ci
npm run typecheck
npm run validate-release
npm run suite -- --out-dir tmp/travel-context-benchmark/dev-suite`}</CommandBlock>
      <LinkRow>
        <TextLink href="https://github.com/Pack-DevOrg" rel="noopener noreferrer" target="_blank">
          <GitBranch aria-hidden="true" />
          GitHub release repo coming next
        </TextLink>
      </LinkRow>
    </Section>
  </Page>
);

export default TravelContextBenchmark;
