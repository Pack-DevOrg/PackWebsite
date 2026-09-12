import React from 'react';
import styled from 'styled-components';

import {
  buildAppStoreUrl,
  DEFAULT_APPLE_APP_ID,
} from '../../utils/appDeepLink';
import {
  PrimaryButton,
  SheetCard,
  StepBody,
  StepTitle,
  onboardTokens,
} from './OnboardPrimitives';

export interface CompleteStepProps {
  onContinue?: () => void;
}

const APPLE_APP_ID = DEFAULT_APPLE_APP_ID;

const COMPLETE_HIGHLIGHTS = [
  'Smart trip planning',
  'Personalized recommendations',
  'Built with love',
] as const;

export const completeStepLocation = {
  assign(url: string): void {
    window.location.assign(url);
  },
};

function defaultOnContinueBecauseAppStore(
  onContinue: CompleteStepProps['onContinue'],
): () => void {
  if (onContinue === undefined) {
    return () => {
      completeStepLocation.assign(buildAppStoreUrl(APPLE_APP_ID));
    };
  }
  return onContinue;
}

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.m}px;
  padding: ${onboardTokens.spacing.l}px ${onboardTokens.spacing.m}px;
`;

const Checkmark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${onboardTokens.primary};
  color: ${onboardTokens.textOnPrimary};
  font-size: ${onboardTokens.fontSize.xl}px;
  font-weight: ${onboardTokens.fontWeight.bold};
`;

const Highlights = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.s}px;
`;

const Highlight = styled.li`
  margin: 0;
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.m}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
`;

const CtaWrap = styled.div`
  width: 100%;
`;

export function CompleteStep({
  onContinue,
}: CompleteStepProps): React.ReactElement {
  const handleContinue = defaultOnContinueBecauseAppStore(onContinue);

  return (
    <SheetCard>
      <Frame>
        <Checkmark>✓</Checkmark>
        <StepTitle>You&apos;re all set!</StepTitle>
        <StepBody>Relax, we&apos;ve got you covered.</StepBody>
        <Highlights>
          {COMPLETE_HIGHLIGHTS.map((label) => (
            <Highlight key={label}>{label}</Highlight>
          ))}
        </Highlights>
        <CtaWrap>
          <PrimaryButton type="button" onClick={handleContinue}>
            Let us handle the rest
          </PrimaryButton>
        </CtaWrap>
      </Frame>
    </SheetCard>
  );
}
