import React, { useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";

import { appConfig } from "@/config/appConfig";
import { useMountEffect } from "@/hooks/useMountEffect";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type TripDraftOption = {
  readonly id?: string;
  readonly label?: string;
  readonly title?: string;
  readonly name?: string;
  readonly summary?: string;
};

export type TripDraftLeg = {
  readonly kind: string;
  readonly from: string;
  readonly to: string;
  readonly options: readonly (TripDraftOption | string)[];
};

export type TripDraft = {
  readonly window: {
    readonly depart: string;
    readonly return: string;
  };
  readonly legs: readonly TripDraftLeg[];
};

export type TripDraftFetch = (token: string) => Promise<TripDraft>;

const DEFAULT_POLL_MS = 5_000;

const Page = styled.section`
  min-height: 60vh;
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
  color: var(--color-text-primary, #fff8ec);
`;

const WindowHeading = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 1.5rem;
`;

const LegList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1.25rem;
`;

const OptionList = styled.ul`
  list-style: disc;
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
`;

const StatusText = styled.p`
  margin: 0;
  color: var(--color-text-secondary, rgba(255, 248, 236, 0.72));
`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTripDraft(value: unknown): value is TripDraft {
  if (!isRecord(value) || !isRecord(value.window) || !Array.isArray(value.legs)) {
    return false;
  }
  if (typeof value.window.depart !== "string" || typeof value.window.return !== "string") {
    return false;
  }
  return value.legs.every((leg) => {
    if (!isRecord(leg) || !Array.isArray(leg.options)) {
      return false;
    }
    return (
      typeof leg.kind === "string" &&
      typeof leg.from === "string" &&
      typeof leg.to === "string"
    );
  });
}

/** Dates already written as "Nov 24" stay as-is. ISO dates become that shape. */
function displayDraftDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value;
  }
  const month = MONTHS[Number(match[2]) - 1];
  const day = Number(match[3]);
  if (!month || day < 1) {
    return value;
  }
  return `${month} ${day}`;
}

function optionLabel(option: TripDraftOption | string, index: number): string {
  if (typeof option === "string") {
    return option;
  }
  const label = option.label ?? option.title ?? option.name ?? option.summary ?? option.id;
  return label && label.length > 0 ? label : `Option ${index + 1}`;
}

function optionKey(option: TripDraftOption | string, index: number): string {
  if (typeof option === "string") {
    return `${option}-${index}`;
  }
  return option.id ?? `${optionLabel(option, index)}-${index}`;
}

async function fetchTripDraft(token: string): Promise<TripDraft> {
  const response = await fetch(
    `${appConfig.apiBaseUrl}/api/i/${encodeURIComponent(token)}`,
  );
  if (!response.ok) {
    throw new Error(`Trip draft fetch failed (${response.status})`);
  }
  const payload: unknown = await response.json();
  if (!isTripDraft(payload)) {
    throw new Error("Trip draft payload is not a draft");
  }
  return payload;
}

export const TripDraftArtifact: React.FC<{
  readonly token: string;
  readonly fetchDraft: TripDraftFetch;
  readonly pollIntervalMs?: number;
}> = ({ token, fetchDraft, pollIntervalMs = DEFAULT_POLL_MS }) => {
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const [failed, setFailed] = useState(false);

  useMountEffect(() => {
    let cancelled = false;

    const load = () => {
      void Promise.resolve()
        .then(() => fetchDraft(token))
        .then(
          (next) => {
            if (!cancelled) {
              setDraft(next);
              setFailed(false);
            }
          },
          () => {
            if (!cancelled) {
              setFailed(true);
            }
          },
        );
    };

    load();
    // Poll and refetch on focus. No websocket in this seat.
    const onFocus = () => {
      load();
    };
    window.addEventListener("focus", onFocus);
    const intervalId = window.setInterval(load, pollIntervalMs);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(intervalId);
    };
  });

  if (!draft) {
    return (
      <Page aria-label="Trip draft">
        <StatusText>{failed ? "This draft link could not be loaded." : "Loading draft…"}</StatusText>
      </Page>
    );
  }

  return (
    <Page aria-label="Trip draft">
      <WindowHeading>
        <span>{displayDraftDate(draft.window.depart)}</span>
        {" to "}
        <span>{displayDraftDate(draft.window.return)}</span>
      </WindowHeading>
      <LegList>
        {draft.legs.map((leg, legIndex) => (
          <li key={`${leg.kind}-${leg.from}-${leg.to}-${legIndex}`}>
            <span>{leg.kind}</span>{" "}
            <span>{leg.from}</span>
            {" to "}
            <span>{leg.to}</span>
            <OptionList>
              {leg.options.map((option, optionIndex) => (
                <li key={optionKey(option, optionIndex)}>
                  {optionLabel(option, optionIndex)}
                </li>
              ))}
            </OptionList>
          </li>
        ))}
      </LegList>
    </Page>
  );
};

const TripDraftArtifactPage: React.FC = () => {
  const { token = "" } = useParams();
  return <TripDraftArtifact key={token} token={token} fetchDraft={fetchTripDraft} />;
};

export default TripDraftArtifactPage;
