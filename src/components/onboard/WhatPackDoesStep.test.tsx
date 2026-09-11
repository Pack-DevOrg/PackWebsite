import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { WhatPackDoesStep } from "./WhatPackDoesStep";

const INTERNAL_IDENTIFIERS =
  /WhatPackDoesStep|ConnectedAccountsDemoScreen|Screen[A-Z]|data-step/;

const PAST_TITLE = "Past";
const PAST_BODY = "Trips that log themselves — every flight, hotel, and mile.";
const PRESENT_TITLE = "Present";
const PRESENT_BODY =
  "Leave-by alerts, TSA waits, and countdowns on your lock screen.";
const FUTURE_TITLE = "Future";
const FUTURE_BODY =
  "Describe the trip like you would to a friend. The busywork plans itself away.";

describe("WhatPackDoesStep", () => {
  it("pins past/present/future headlines and bodies one screen at a time", () => {
    const { container } = render(<WhatPackDoesStep />);
    const leaked = `${container.innerHTML}${container.textContent ?? ""}`;

    expect(screen.getByText(PAST_TITLE)).toBeInTheDocument();
    expect(screen.getByText(PAST_BODY)).toBeInTheDocument();
    expect(screen.queryByText(PRESENT_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(PRESENT_BODY)).not.toBeInTheDocument();
    expect(screen.queryByText(FUTURE_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(FUTURE_BODY)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
    expect(leaked).not.toMatch(INTERNAL_IDENTIFIERS);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.queryByText(PAST_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(PAST_BODY)).not.toBeInTheDocument();
    expect(screen.getByText(PRESENT_TITLE)).toBeInTheDocument();
    expect(screen.getByText(PRESENT_BODY)).toBeInTheDocument();
    expect(screen.queryByText(FUTURE_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(FUTURE_BODY)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.queryByText(PAST_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(PAST_BODY)).not.toBeInTheDocument();
    expect(screen.queryByText(PRESENT_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(PRESENT_BODY)).not.toBeInTheDocument();
    expect(screen.getByText(FUTURE_TITLE)).toBeInTheDocument();
    expect(screen.getByText(FUTURE_BODY)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(INTERNAL_IDENTIFIERS);
    expect(container.innerHTML).not.toMatch(INTERNAL_IDENTIFIERS);
  });

  it("calls onSkip once from Skip and does not fire onNext", () => {
    const onSkip = jest.fn();
    const onNext = jest.fn();
    render(<WhatPackDoesStep onNext={onNext} onSkip={onSkip} />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("fires onNext once on the third Continue and not on the first two", () => {
    const onNext = jest.fn();
    render(<WhatPackDoesStep onNext={onNext} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(PRESENT_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(FUTURE_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("no-ops Continue and Skip when handlers are omitted", () => {
    render(<WhatPackDoesStep />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
  });
});
