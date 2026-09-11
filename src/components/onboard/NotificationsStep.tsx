import React, {useState} from 'react';
import styled from 'styled-components';

import {
  PrimaryButton,
  SheetCard,
  StepBody,
  StepTitle,
  onboardTokens,
} from './OnboardPrimitives';

export interface NotificationsStepProps {
  onAllow?: () => void;
  onSkip?: () => void;
  onContinue?: () => void;
}

const CONSENT_TITLE = 'Travel tips & product updates';
const CONSENT_SUBTITLE =
  'Occasional news and relevant offers. Off unless you say yes — change it anytime in Settings.';

const PREVIEW_EXAMPLES = [
  {
    id: 'gate-change',
    title: 'Gate changed to B22',
    message:
      'SY 211 to Tokyo now boards at Gate B22 — leave by 1:20 PM to make it.',
    timeLabel: 'now',
  },
  {
    id: 'plan-ready',
    title: 'Tampa for Thanksgiving',
    message: 'LAX → TPA Nov 26 · 3 nights in Tampa · TPA → LAX Nov 29',
    timeLabel: 'now',
  },
] as const;

function noopBecauseNeverBlock(): void {
  return;
}

function defaultOnContinueBecauseNeverBlock(
  onContinue: NotificationsStepProps['onContinue'],
): () => void {
  if (onContinue === undefined) {
    return noopBecauseNeverBlock;
  }
  return onContinue;
}

function defaultOnAllowBecauseOptional(
  onAllow: NotificationsStepProps['onAllow'],
): () => void {
  if (onAllow === undefined) {
    return noopBecauseNeverBlock;
  }
  return onAllow;
}

function defaultOnSkipBecauseOptional(
  onSkip: NotificationsStepProps['onSkip'],
): () => void {
  if (onSkip === undefined) {
    return noopBecauseNeverBlock;
  }
  return onSkip;
}

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${onboardTokens.spacing.l}px;
  padding: ${onboardTokens.spacing.l}px ${onboardTokens.spacing.m}px;
`;

const TitleAccent = styled.span`
  color: ${onboardTokens.accent};
`;

const PreviewStack = styled.div`
  display: flex;
  flex-direction: column;
  width: 90%;
  align-self: center;
  gap: ${onboardTokens.spacing.s12}px;
`;

const PreviewCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${onboardTokens.spacing.s12}px;
  border-radius: ${onboardTokens.borderRadius.r16}px;
  border: 1px solid ${onboardTokens.borderSubtle};
  background: ${onboardTokens.darkGray3};
  padding: ${onboardTokens.spacing.s12}px;
`;

const PreviewIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: ${onboardTokens.primary};
  color: ${onboardTokens.textOnPrimary};
  font-size: ${onboardTokens.fontSize.xs}px;
  font-weight: ${onboardTokens.fontWeight.bold};
`;

const PreviewBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PreviewTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${onboardTokens.spacing.s}px;
`;

const PreviewTitle = styled.span`
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.m15}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PreviewTime = styled.span`
  color: ${onboardTokens.textSecondary};
  font-size: ${onboardTokens.fontSize.xs}px;
`;

const PreviewMessage = styled.span`
  color: ${onboardTokens.textSecondary};
  font-size: ${onboardTokens.fontSize.s}px;
  line-height: 18px;
`;

const ConsentRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${onboardTokens.spacing.m}px;
  padding: 0 ${onboardTokens.spacing.xs}px;
`;

const ConsentCopy = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ConsentHeading = styled.p`
  margin: 0;
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.m15}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.s}px;
  margin-top: ${onboardTokens.spacing.s}px;
`;

const SkipButton = styled.button`
  padding: ${onboardTokens.spacing.s}px ${onboardTokens.spacing.m}px;
  border: none;
  background: none;
  color: ${onboardTokens.textSecondary};
  font-size: ${onboardTokens.fontSize.m}px;
  cursor: pointer;
`;

const ToggleTrack = styled.span<{ $on: boolean }>`
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
  flex-shrink: 0;
  border-radius: 16px;
  background: ${(props) =>
    props.$on ? onboardTokens.primary : onboardTokens.borderMedium};
`;

const ToggleThumb = styled.span<{ $on: boolean }>`
  position: absolute;
  top: 2px;
  left: ${(props) => (props.$on ? '22px' : '2px')};
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: ${onboardTokens.textPrimary};
`;

const ToggleInput = styled.input`
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
`;

const ToggleControl = styled.span`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
`;

export function NotificationsStep({
  onAllow,
  onSkip,
  onContinue,
}: NotificationsStepProps): React.ReactElement {
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const continueFlow = defaultOnContinueBecauseNeverBlock(onContinue);
  const allow = defaultOnAllowBecauseOptional(onAllow);
  const skip = defaultOnSkipBecauseOptional(onSkip);

  return (
    <SheetCard>
      <Frame>
        <StepTitle>
          Turn on <TitleAccent>trip alerts</TitleAccent>
        </StepTitle>
        <PreviewStack data-testid="onboarding-notifications-preview">
          {PREVIEW_EXAMPLES.map((example) => (
            <PreviewCard key={example.id}>
              <PreviewIcon aria-hidden="true">P</PreviewIcon>
              <PreviewBody>
                <PreviewTitleRow>
                  <PreviewTitle>{example.title}</PreviewTitle>
                  <PreviewTime>{example.timeLabel}</PreviewTime>
                </PreviewTitleRow>
                <PreviewMessage>{example.message}</PreviewMessage>
              </PreviewBody>
            </PreviewCard>
          ))}
        </PreviewStack>
        <ConsentRow>
          <ConsentCopy>
            <ConsentHeading>{CONSENT_TITLE}</ConsentHeading>
            <StepBody>{CONSENT_SUBTITLE}</StepBody>
          </ConsentCopy>
          <ToggleControl>
            <ToggleTrack $on={marketingOptIn}>
              <ToggleThumb $on={marketingOptIn} />
            </ToggleTrack>
            <ToggleInput
              type="checkbox"
              role="switch"
              aria-label="Travel tips and product updates"
              data-testid="onboarding-notifications-marketing-toggle"
              checked={marketingOptIn}
              onChange={(event) => {
                setMarketingOptIn(event.target.checked);
              }}
            />
          </ToggleControl>
        </ConsentRow>
        <Actions>
          <PrimaryButton
            type="button"
            data-testid="onboarding-notifications-primary"
            onClick={() => {
              allow();
              continueFlow();
            }}
          >
            Turn on notifications
          </PrimaryButton>
          <SkipButton
            type="button"
            data-testid="onboarding-notifications-skip"
            onClick={() => {
              skip();
              continueFlow();
            }}
          >
            Not now
          </SkipButton>
        </Actions>
      </Frame>
    </SheetCard>
  );
}
