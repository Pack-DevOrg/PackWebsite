import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  ArrowLeft,
  ArrowUpRight,
  BatteryMedium,
  BedDouble,
  CalendarDays,
  CarFront,
  ChevronRight,
  LocateFixed,
  Map,
  Navigation,
  Plane,
  ShieldCheck,
  Sparkles,
  Sun,
  Ticket,
  Umbrella,
  Users,
} from "lucide-react";

import festivalAerial from "@/assets/labs/upcoming-coachella-aerial.webp";

type PhaseId = "travel" | "day" | "festival";
type Tone = "next" | "later";
type Event = {
  time: string;
  relative: string;
  title: string;
  location: string;
  detail: string;
  tone: Tone;
};
type Phase = {
  id: PhaseId;
  tab: string;
  date: string;
  clock: string;
  eyebrow: string;
  headline: string;
  rationale: string;
  countdown: string;
  action: string;
  mode: "uber" | "maps";
  destination: string;
  route: string;
  routeTime: string;
  confidence: string;
  contextTitle: string;
  contextDetail: string;
  mapLabel: string;
  explanation: string;
  visual: "flight" | "hotel" | "festival";
  signals: [string, string, "sun" | "battery" | "shade"][];
  events: Event[];
};

const phases: Phase[] = [
  {
    id: "travel",
    tab: "Travel day",
    date: "Thu 11",
    clock: "6:18 AM",
    eyebrow: "Next · flight",
    headline: "Leave for JFK at 6:42",
    rationale:
      "Security is 18 min and traffic is lighter than expected. This keeps your preferred 25 min lounge buffer without waking you earlier than necessary.",
    countdown: "24m",
    action: "Call Uber",
    mode: "uber",
    destination: "JFK · Terminal 8",
    route: "The Ludlow → American departures",
    routeTime: "38 min drive",
    confidence: "Traffic and security updated 2 min ago",
    contextTitle: "AA 2849 · JFK → PSP",
    contextDetail: "On time · Gate 42 · Seat 8A",
    mapLabel: "Your path to boarding",
    explanation:
      "Using live traffic, terminal security, your checked-bag status, lounge preference, and boarding group.",
    visual: "flight",
    signals: [
      ["Boarding", "8:15 AM", "shade"],
      ["Security", "18 min", "battery"],
      ["Weather", "Clear", "sun"],
    ],
    events: [
      {
        time: "6:42",
        relative: "in 24m",
        title: "Ride to JFK",
        location: "Pickup outside The Ludlow",
        detail: "Terminal 8 · traffic already included",
        tone: "next",
      },
      {
        time: "8:55",
        relative: "in 2h 37m",
        title: "AA 2849 to Palm Springs",
        location: "JFK · Gate 42",
        detail: "Boarding 8:15 · Seat 8A · Wi-Fi available",
        tone: "later",
      },
      {
        time: "12:08",
        relative: "local time",
        title: "Land at PSP",
        location: "Palm Springs International",
        detail: "Bags at carousel 3 · rental car reserved",
        tone: "later",
      },
    ],
  },
  {
    id: "day",
    tab: "In Palm Springs",
    date: "Fri 12",
    clock: "9:14 AM",
    eyebrow: "Today · easy start",
    headline: "Breakfast is downstairs until 10:30",
    rationale:
      "Your room is confirmed for late checkout. Nothing needs your attention until the 12:40 pickup, so the morning stays open.",
    countdown: "3h 26m",
    action: "Hotel details",
    mode: "maps",
    destination: "La Quinta Resort · Casita 214",
    route: "Breakfast → room → lobby pickup",
    routeTime: "Pickup 12:40",
    confidence: "Hotel and calendar details synced",
    contextTitle: "La Quinta Resort",
    contextDetail: "Checked in · Late checkout 2 PM",
    mapLabel: "Your day at a glance",
    explanation:
      "Using your hotel reservation, calendar, local travel time, meal preferences, and the commitments you marked important.",
    visual: "hotel",
    signals: [
      ["Checkout", "2:00 PM", "shade"],
      ["Room", "214", "battery"],
      ["Outside", "82°", "sun"],
    ],
    events: [
      {
        time: "10:30",
        relative: "closes in 1h 16m",
        title: "Breakfast at Twenty6",
        location: "Hotel courtyard",
        detail: "Included with stay · outdoor table preferred",
        tone: "next",
      },
      {
        time: "12:40",
        relative: "in 3h 26m",
        title: "Car to Empire Polo Club",
        location: "Lobby pickup",
        detail: "Driver confirmed · 31 min · shared with 2 friends",
        tone: "later",
      },
      {
        time: "7:15",
        relative: "tonight",
        title: "Dinner reservation",
        location: "Workshop Kitchen + Bar",
        detail: "Table for 4 · confirmation 8K4P · 18 min drive",
        tone: "later",
      },
    ],
  },
  {
    id: "festival",
    tab: "Festival day",
    date: "Fri 12",
    clock: "4:42 PM",
    eyebrow: "Live context · move soon",
    headline: "Head to Mojave in 6 min",
    rationale:
      "Japanese Breakfast is one of your top artists. The shaded route preserves your walking buffer and still gets you to the west rail meetup.",
    countdown: "6m",
    action: "Open route",
    mode: "maps",
    destination: "Mojave stage · west rail",
    route: "Sonora → Mojave",
    routeTime: "11 min walk",
    confidence: "Crowd density changed 1 min ago",
    contextTitle: "Empire Polo Club",
    contextDetail: "Live venue context · 37 saved places",
    mapLabel: "Your next ground",
    explanation:
      "Using your saved artists, walking pace, heat sensitivity, battery level, meetup locations, and live venue conditions.",
    visual: "festival",
    signals: [
      ["Feels like", "98°", "sun"],
      ["Phone", "68%", "battery"],
      ["Shade", "82% route", "shade"],
    ],
    events: [
      {
        time: "5:05",
        relative: "in 23m",
        title: "Japanese Breakfast",
        location: "Mojave",
        detail: "Top priority · west rail meetup",
        tone: "next",
      },
      {
        time: "6:25",
        relative: "in 1h 43m",
        title: "Dinner reservation",
        location: "Outstanding in the Field",
        detail: "Confirmation 8K4P · 16 min walk",
        tone: "later",
      },
    ],
  },
];

const Page = styled.main`
  min-height: 100vh;
  background: #0f0d0b;
  color: ${(p) => p.theme.colors.text.primary};
  padding: 1rem;
`;
const Shell = styled.div`
  width: min(100%, 1480px);
  margin: auto;
  border: 1px solid rgba(243, 210, 122, 0.14);
  background: #12100e;
  min-height: calc(100vh - 2rem);
`;
const Topbar = styled.header`
  min-height: 68px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(243, 210, 122, 0.12);
`;
const Back = styled(Link)`
  color: ${(p) => p.theme.colors.text.secondary};
  display: flex;
  gap: 0.55rem;
  align-items: center;
  min-height: 44px;
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 700;
  &:hover,
  &:focus-visible {
    color: ${(p) => p.theme.colors.text.primary};
  }
`;
const Wordmark = styled.div`
  font-size: 1.1rem;
  font-weight: 900;
  color: ${(p) => p.theme.colors.primary.main};
`;
const LabTag = styled.span`
  color: ${(p) => p.theme.colors.text.tertiary};
  font: 700 0.7rem ${(p) => p.theme.typography.fontFamily.code};
  text-transform: uppercase;
`;
const Canvas = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(330px, 0.72fr);
  min-height: calc(100vh - 102px);
  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;
const Main = styled.section`
  min-width: 0;
  padding: clamp(1.25rem, 3vw, 3.5rem);
  border-right: 1px solid rgba(243, 210, 122, 0.12);
  @media (max-width: 980px) {
    border-right: 0;
  }
`;
const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  h1 {
    margin: 0;
    font-size: clamp(1.65rem, 3vw, 3rem);
    line-height: 1;
    font-weight: 850;
  }
  p {
    margin: 0.45rem 0 0;
    color: ${(p) => p.theme.colors.text.secondary};
    font-size: 0.9rem;
  }
`;
const Clock = styled.div`
  text-align: right;
  font: 700 0.8rem ${(p) => p.theme.typography.fontFamily.code};
  color: ${(p) => p.theme.colors.text.secondary};
  line-height: 1.6;
`;
const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid rgba(247, 240, 227, 0.14);
  margin-bottom: clamp(1.75rem, 4vw, 3rem);
`;
const Tab = styled.button<{ $active: boolean }>`
  min-height: 58px;
  border: 0;
  border-right: 1px solid rgba(247, 240, 227, 0.12);
  background: ${(p) => (p.$active ? "#f3d27a" : "transparent")};
  color: ${(p) => (p.$active ? "#171310" : "rgba(247,240,227,.62)")};
  cursor: pointer;
  font-weight: 800;
  font-size: 0.84rem;
  &:last-child {
    border-right: 0;
  }
  &:hover {
    color: ${(p) => (p.$active ? "#171310" : "#f7f0e3")};
  }
  &:focus-visible {
    outline: 3px solid #e72340;
    outline-offset: 2px;
  }
`;
const Priority = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
  align-items: end;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(247, 240, 227, 0.14);
  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;
const Eyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${(p) => p.theme.colors.secondary.light};
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  margin-bottom: 0.8rem;
`;
const Headline = styled.h2`
  margin: 0;
  max-width: 780px;
  font-size: clamp(2.4rem, 6vw, 5.7rem);
  line-height: 0.97;
  font-weight: 850;
  letter-spacing: 0;
`;
const Rationale = styled.p`
  max-width: 660px;
  margin: 1.15rem 0 0;
  color: ${(p) => p.theme.colors.text.secondary};
  font-size: clamp(0.95rem, 1.3vw, 1.12rem);
  line-height: 1.6;
`;
const Countdown = styled.div`
  color: ${(p) => p.theme.colors.primary.main};
  font: 850 clamp(3.5rem, 8vw, 7rem) / 0.85
    ${(p) => p.theme.typography.fontFamily.heading};
  text-align: right;
  small {
    display: block;
    font-size: 0.76rem;
    margin-top: 0.75rem;
    color: ${(p) => p.theme.colors.text.tertiary};
    text-transform: uppercase;
  }
  @media (max-width: 620px) {
    text-align: left;
  }
`;
const ActionBand = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(247, 240, 227, 0.14);
  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;
const Route = styled.div`
  display: flex;
  gap: 0.9rem;
  align-items: center;
  min-width: 0;
  strong {
    display: block;
    font-size: 1.05rem;
  }
  span {
    color: ${(p) => p.theme.colors.text.secondary};
    font-size: 0.82rem;
  }
`;
const IconBox = styled.div`
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  background: rgba(243, 210, 122, 0.12);
  color: ${(p) => p.theme.colors.primary.main};
`;
const Action = styled.button`
  border: 0;
  min-height: 50px;
  padding: 0 1.2rem;
  background: ${(p) => p.theme.colors.primary.main};
  color: #171310;
  font-weight: 850;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  &:hover {
    background: ${(p) => p.theme.colors.primary.light};
  }
  &:focus-visible {
    outline: 3px solid ${(p) => p.theme.colors.secondary.main};
    outline-offset: 2px;
  }
`;
const Signals = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: rgba(247, 240, 227, 0.12);
  margin: 1.5rem 0 2.4rem;
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;
const Signal = styled.div`
  background: #12100e;
  padding: 1rem;
  display: flex;
  gap: 0.7rem;
  align-items: center;
  color: ${(p) => p.theme.colors.text.secondary};
  strong {
    display: block;
    color: ${(p) => p.theme.colors.text.primary};
    font-size: 0.92rem;
  }
  span {
    font-size: 0.72rem;
  }
`;
const AgendaHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.8rem;
  h3 {
    margin: 0;
    font-size: 1rem;
  }
  span {
    color: ${(p) => p.theme.colors.text.tertiary};
    font-size: 0.74rem;
  }
`;
const Agenda = styled.div`
  display: grid;
  gap: 0.65rem;
`;
const Item = styled.button<{ $tone: Tone }>`
  width: 100%;
  min-height: 92px;
  border: 1px solid
    ${(p) =>
      p.$tone === "next" ? "rgba(243,210,122,.34)" : "rgba(247,240,227,.12)"};
  background: ${(p) =>
    p.$tone === "next" ? "rgba(243,210,122,.055)" : "transparent"};
  color: inherit;
  cursor: pointer;
  display: grid;
  grid-template-columns: 82px 1fr auto;
  gap: 1rem;
  text-align: left;
  align-items: center;
  padding: 0.95rem 1rem;
  &:hover {
    border-color: rgba(243, 210, 122, 0.42);
  }
  &:focus-visible {
    outline: 3px solid ${(p) => p.theme.colors.primary.main};
    outline-offset: 2px;
  }
  @media (max-width: 520px) {
    grid-template-columns: 64px 1fr auto;
    padding-inline: 0.75rem;
  }
`;
const Time = styled.div`
  font: 800 0.9rem ${(p) => p.theme.typography.fontFamily.code};
  span {
    display: block;
    margin-top: 0.4rem;
    color: ${(p) => p.theme.colors.primary.main};
    font: 700 0.68rem ${(p) => p.theme.typography.fontFamily.primary};
  }
`;
const Copy = styled.div`
  min-width: 0;
  strong {
    font-size: 1.02rem;
    display: block;
  }
  span {
    display: block;
    color: ${(p) => p.theme.colors.text.secondary};
    font-size: 0.78rem;
    margin-top: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
const Side = styled.aside`
  min-width: 0;
  display: flex;
  flex-direction: column;
`;
const Image = styled.div<{ $visual: Phase["visual"] }>`
  position: relative;
  min-height: 380px;
  background: ${(p) =>
    p.$visual === "festival"
      ? `#211b16 url(${festivalAerial}) center/cover no-repeat`
      : p.$visual === "flight"
        ? "#182334"
        : "#28342c"};
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(15, 13, 11, 0.22);
  }
`;
const ContextVisual = styled.div`
  position: absolute;
  z-index: 1;
  inset: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 4.5rem;
  box-sizing: border-box;
  color: #f7f0e3;
`;
const ContextIcon = styled.div`
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(247, 240, 227, 0.35);
`;
const AirportPair = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font: 850 clamp(2.8rem, 5vw, 4.6rem) / 1
    ${(p) => p.theme.typography.fontFamily.heading};
  span {
    height: 1px;
    flex: 1;
    background: rgba(247, 240, 227, 0.35);
  }
`;
const RoomNumber = styled.div`
  font: 850 clamp(4rem, 8vw, 7rem) / 0.85
    ${(p) => p.theme.typography.fontFamily.heading};
  small {
    display: block;
    margin-bottom: 0.7rem;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
`;
const Caption = styled.div`
  position: absolute;
  z-index: 1;
  left: 1.25rem;
  right: 1.25rem;
  bottom: 1.25rem;
  color: white;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.8);
  strong {
    display: block;
    font-size: 1.25rem;
  }
  span {
    font-size: 0.78rem;
    opacity: 0.82;
  }
`;
const Spatial = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
`;
const SpatialHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 {
    margin: 0;
    font-size: 0.78rem;
    text-transform: uppercase;
  }
  span {
    color: ${(p) => p.theme.colors.success.main};
    font-size: 0.7rem;
    display: flex;
    gap: 0.35rem;
    align-items: center;
  }
`;
const RouteMap = styled.div`
  position: relative;
  min-height: 210px;
  border: 1px solid rgba(247, 240, 227, 0.12);
  background-color: #171310;
  background-image: linear-gradient(
      rgba(247, 240, 227, 0.045) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(247, 240, 227, 0.045) 1px, transparent 1px);
  background-size: 28px 28px;
  overflow: hidden;
  &::before {
    content: "";
    position: absolute;
    width: 64%;
    height: 48%;
    left: 17%;
    top: 24%;
    border: 3px dashed ${(p) => p.theme.colors.primary.main};
    border-left-color: transparent;
    border-radius: 50%;
    transform: rotate(-12deg);
  }
`;
const Pin = styled.div<{ $x: number; $y: number; $active?: boolean }>`
  position: absolute;
  left: ${(p) => p.$x}%;
  top: ${(p) => p.$y}%;
  transform: translate(-50%, -50%);
  width: ${(p) => (p.$active ? 38 : 28)}px;
  height: ${(p) => (p.$active ? 38 : 28)}px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${(p) =>
    p.$active ? p.theme.colors.secondary.main : p.theme.colors.primary.main};
  color: #171310;
  border: 4px solid #171310;
`;
const RouteSummary = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: end;
  strong {
    display: block;
    font-size: 1.05rem;
  }
  span {
    color: ${(p) => p.theme.colors.text.secondary};
    font-size: 0.76rem;
    line-height: 1.5;
  }
`;
const Mini = styled.button`
  width: 48px;
  height: 48px;
  border: 1px solid rgba(247, 240, 227, 0.18);
  background: transparent;
  color: ${(p) => p.theme.colors.text.primary};
  cursor: pointer;
  display: grid;
  place-items: center;
  &:hover {
    background: rgba(247, 240, 227, 0.07);
  }
  &:focus-visible {
    outline: 3px solid ${(p) => p.theme.colors.primary.main};
  }
`;
const Preference = styled.div`
  margin-top: auto;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(247, 240, 227, 0.12);
  display: flex;
  gap: 0.8rem;
  color: ${(p) => p.theme.colors.text.secondary};
  font-size: 0.78rem;
  line-height: 1.5;
  strong {
    color: ${(p) => p.theme.colors.text.primary};
  }
`;
const Toast = styled.div`
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  background: #f7f0e3;
  color: #171310;
  padding: 0.8rem 1rem;
  font-weight: 750;
  box-shadow: 0 14px 50px rgba(0, 0, 0, 0.4);
  z-index: 10;
`;

function SignalIcon({ kind }: { kind: Phase["signals"][number][2] }) {
  if (kind === "sun") return <Sun size={19} />;
  if (kind === "battery") return <BatteryMedium size={19} />;
  return <Umbrella size={19} />;
}

export default function UpcomingLab() {
  const [phaseId, setPhaseId] = useState<PhaseId>("travel");
  const [toast, setToast] = useState<string | null>(null);
  const phase = phases.find((item) => item.id === phaseId) ?? phases[1];
  const show = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <Page>
      <Helmet>
        <title>Upcoming Field Dashboard | Pack Labs</title>
        <meta
          name="description"
          content="A personalized, time-sensitive upcoming travel and event dashboard prototype."
        />
      </Helmet>
      <Shell>
        <Topbar>
          <Back to="/labs">
            <ArrowLeft size={17} /> Labs
          </Back>
          <Wordmark>
            Pack<span style={{ color: "#e72340" }}>.</span>
          </Wordmark>
          <LabTag>Upcoming / 01</LabTag>
        </Topbar>
        <Canvas>
          <Main>
            <Meta>
              <div>
                <h1>Palm Springs · Apr 11–15</h1>
                <p>4 nights · 1 flight · 1 hotel · 7 plans</p>
              </div>
              <Clock>
                {phase.clock}
                <br />
                {phase.date}
              </Clock>
            </Meta>
            <Tabs role="tablist" aria-label="Trip phase">
              {phases.map((item) => (
                <Tab
                  key={item.id}
                  role="tab"
                  aria-selected={item.id === phase.id}
                  $active={item.id === phase.id}
                  onClick={() => setPhaseId(item.id)}
                >
                  {item.tab}
                </Tab>
              ))}
            </Tabs>
            <Priority>
              <div>
                <Eyebrow>
                  <Sparkles size={14} />
                  {phase.eyebrow}
                </Eyebrow>
                <Headline>{phase.headline}</Headline>
                <Rationale>{phase.rationale}</Rationale>
              </div>
              <Countdown>
                {phase.countdown}
                <small>until next</small>
              </Countdown>
            </Priority>
            <ActionBand>
              <Route>
                <IconBox>
                  {phase.mode === "uber" ? (
                    <CarFront size={21} />
                  ) : (
                    <Navigation size={21} />
                  )}
                </IconBox>
                <div>
                  <strong>{phase.destination}</strong>
                  <span>
                    {phase.route} · {phase.routeTime}
                  </span>
                </div>
              </Route>
              <Action
                onClick={() =>
                  show(`${phase.action} opened for ${phase.destination}`)
                }
              >
                {phase.action}
                <ArrowUpRight size={18} />
              </Action>
            </ActionBand>
            <Signals>
              {phase.signals.map(([label, value, kind]) => (
                <Signal key={label}>
                  <SignalIcon kind={kind} />
                  <div>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                </Signal>
              ))}
            </Signals>
            <AgendaHead>
              <h3>Coming up</h3>
              <span>{phase.events.length} useful moments</span>
            </AgendaHead>
            <Agenda>
              {phase.events.map((item) => (
                <Item
                  key={`${phase.id}-${item.time}-${item.title}`}
                  $tone={item.tone}
                  onClick={() => show(`${item.title} details opened`)}
                >
                  <Time>
                    {item.time}
                    <span>{item.relative}</span>
                  </Time>
                  <Copy>
                    <strong>{item.title}</strong>
                    <span>
                      {item.location} · {item.detail}
                    </span>
                  </Copy>
                  <ChevronRight size={19} />
                </Item>
              ))}
            </Agenda>
          </Main>
          <Side>
            <Image $visual={phase.visual}>
              {phase.visual !== "festival" ? (
                <ContextVisual>
                  <ContextIcon>
                    {phase.visual === "flight" ? (
                      <Plane size={25} />
                    ) : (
                      <BedDouble size={25} />
                    )}
                  </ContextIcon>
                  {phase.visual === "flight" ? (
                    <AirportPair>
                      JFK <span /> PSP
                    </AirportPair>
                  ) : (
                    <RoomNumber>
                      <small>Your room</small>
                      214
                    </RoomNumber>
                  )}
                </ContextVisual>
              ) : null}
              <Caption>
                <strong>{phase.contextTitle}</strong>
                <span>{phase.contextDetail}</span>
              </Caption>
            </Image>
            <Spatial>
              <SpatialHead>
                <h3>{phase.mapLabel}</h3>
                <span>
                  <LocateFixed size={13} />
                  context live
                </span>
              </SpatialHead>
              <RouteMap aria-label={`Route preview for ${phase.route}`}>
                <Pin $x={23} $y={68}>
                  {phase.visual === "flight" ? (
                    <CarFront size={14} />
                  ) : phase.visual === "hotel" ? (
                    <BedDouble size={14} />
                  ) : (
                    <Users size={14} />
                  )}
                </Pin>
                <Pin $x={52} $y={35} $active>
                  <Navigation size={17} />
                </Pin>
                <Pin $x={79} $y={62}>
                  {phase.visual === "flight" ? (
                    <Plane size={14} />
                  ) : phase.visual === "hotel" ? (
                    <CalendarDays size={14} />
                  ) : (
                    <Ticket size={14} />
                  )}
                </Pin>
              </RouteMap>
              <RouteSummary>
                <div>
                  <strong>{phase.routeTime}</strong>
                  <span>
                    {phase.confidence}
                    <br />
                    Destination: {phase.destination}
                  </span>
                </div>
                <Mini
                  aria-label="Open full map"
                  onClick={() => show("Full trip map opened")}
                >
                  <Map size={20} />
                </Mini>
              </RouteSummary>
              <Preference>
                <ShieldCheck size={19} />
                <div>
                  <strong>Why Pack changed this</strong>
                  <br />
                  {phase.explanation}
                </div>
              </Preference>
            </Spatial>
          </Side>
        </Canvas>
      </Shell>
      {toast ? <Toast role="status">{toast}</Toast> : null}
    </Page>
  );
}
