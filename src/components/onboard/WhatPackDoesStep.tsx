import React, {useState} from 'react';
import styled from 'styled-components';

import {
  OnboardStepFrame,
  PrimaryButton,
  ProgressDots,
  SheetCard,
  StepBody,
  StepHeroTitle,
  onboardTokens,
} from './OnboardPrimitives';

export interface WhatPackDoesStepProps {
  onNext?: () => void;
  onSkip?: () => void;
}

const SCREENS = [
  {
    key: 'past',
    title: 'Past',
    subtitle: 'Trips that log themselves — every flight, hotel, and mile.',
  },
  {
    key: 'present',
    title: 'Present',
    subtitle:
      'Leave-by alerts, TSA waits, and countdowns on your lock screen.',
  },
  {
    key: 'future',
    title: 'Future',
    subtitle:
      'Describe the trip like you would to a friend. The busywork plans itself away.',
  },
] as const;

const LAST_SCREEN_INDEX = SCREENS.length - 1;

function noopBecauseOptional(): void {
  return;
}

function defaultOnNextBecauseOptional(
  onNext: WhatPackDoesStepProps['onNext'],
): () => void {
  if (onNext === undefined) {
    return noopBecauseOptional;
  }
  return onNext;
}

function defaultOnSkipBecauseOptional(
  onSkip: WhatPackDoesStepProps['onSkip'],
): () => void {
  if (onSkip === undefined) {
    return noopBecauseOptional;
  }
  return onSkip;
}

function nextIndexBecausePager(current: number): number {
  if (current >= LAST_SCREEN_INDEX) {
    return LAST_SCREEN_INDEX;
  }
  return current + 1;
}

const CopyBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.s}px;
  text-align: center;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.s}px;
  width: 100%;
`;

const SkipButton = styled.button`
  padding: ${onboardTokens.spacing.s}px ${onboardTokens.spacing.m}px;
  border: none;
  background: none;
  color: ${onboardTokens.textSecondary};
  font-size: ${onboardTokens.fontSize.m}px;
  cursor: pointer;
`;

export function WhatPackDoesStep({
  onNext,
  onSkip,
}: WhatPackDoesStepProps): React.ReactElement {
  const [current, setCurrent] = useState(0);
  const handleNext = defaultOnNextBecauseOptional(onNext);
  const handleSkip = defaultOnSkipBecauseOptional(onSkip);
  const screen = SCREENS[current];

  const continuePager = (): void => {
    if (current >= LAST_SCREEN_INDEX) {
      handleNext();
      return;
    }
    setCurrent(nextIndexBecausePager(current));
  };

  return (
    <SheetCard $fill>
      <OnboardStepFrame>
        <CopyBlock>
          <StepHeroTitle>{screen.title}</StepHeroTitle>
          <StepBody>{screen.subtitle}</StepBody>
        </CopyBlock>
        <Actions>
          <ProgressDots count={SCREENS.length} activeIndex={current} />
          <PrimaryButton type="button" onClick={continuePager}>
            Continue
          </PrimaryButton>
          <SkipButton type="button" onClick={handleSkip}>
            Skip
          </SkipButton>
        </Actions>
      </OnboardStepFrame>
    </SheetCard>
  );
}
