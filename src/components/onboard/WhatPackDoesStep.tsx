import React, {useState} from 'react';
import {View} from 'react-native';
import {
  OnboardingContent,
  OnboardingPrimaryButton,
  OnboardingProgressDots,
  OnboardingSecondaryButton,
  OnboardingSubtitle,
  OnboardingTitle,
  tokens,
} from '@pack/ui-primitives';

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
    <OnboardingContent scrollEnabled={false}>
      <View style={{alignItems: 'center'}}>
        <OnboardingTitle
          style={{
            fontSize: tokens.typography.fontSize.hero44,
            lineHeight: tokens.typography.lineHeight.hero,
            color: tokens.colors.primary,
          }}>
          {screen.title}
        </OnboardingTitle>
        <OnboardingSubtitle>{screen.subtitle}</OnboardingSubtitle>
      </View>
      <View style={{alignItems: 'center', width: '100%'}}>
        <OnboardingProgressDots
          currentStep={current + 1}
          totalSteps={SCREENS.length}
        />
        <OnboardingPrimaryButton onPress={continuePager}>
          Continue
        </OnboardingPrimaryButton>
        <OnboardingSecondaryButton onPress={handleSkip}>
          Skip
        </OnboardingSecondaryButton>
      </View>
    </OnboardingContent>
  );
}
