import React from 'react';
import styled from 'styled-components';

import {publicContactConfig} from '../../config/appConfig';
import {copyTextToClipboard} from '../../utils/clipboard';
import {
  OnboardStepFrame,
  SheetCard,
  StepBody,
  StepTitle,
  onboardTokens,
} from './OnboardPrimitives';

export const COMPLETE_SMS_BODY = 'Hi Pack';
export const COMPLETE_DESKTOP_MIN_WIDTH_PX = 740;

const COMPLETE_HIGHLIGHTS = [
  'Smart trip planning',
  'Personalized recommendations',
  'Built with love',
] as const;

export function buildCompleteSmsHrefBecauseSendblue(
  e164: string,
  body: string,
): string {
  return `sms:${e164}?body=${encodeURIComponent(body)}`;
}

function viewportIsDesktopBecauseMinWidth(width: number): boolean {
  return width >= COMPLETE_DESKTOP_MIN_WIDTH_PX;
}

function currentViewportWidthBecauseWindow(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.innerWidth;
}

function copyPackNumberBecauseDesktop(e164: string): void {
  void copyTextToClipboard(e164);
}

const CopyBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.m}px;
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
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${onboardTokens.spacing.m}px;
  width: 100%;
`;

const CtaLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 100%;
  height: ${onboardTokens.buttonHeightL}px;
  border: none;
  border-radius: ${onboardTokens.borderRadius.r10}px;
  background: ${onboardTokens.primary};
  color: ${onboardTokens.textOnPrimary};
  font-size: ${onboardTokens.fontSize.m}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
  text-decoration: none;
  box-sizing: border-box;
`;

const DesktopNumberRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${onboardTokens.spacing.s}px;
`;

const PackNumber = styled.span`
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.m}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  height: ${onboardTokens.buttonHeightL / 2}px;
  padding: 0 ${onboardTokens.spacing.s12}px;
  border: 1px solid ${onboardTokens.borderMedium};
  border-radius: ${onboardTokens.borderRadius.r10}px;
  background: ${onboardTokens.darkGray3};
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.s}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
`;

export function CompleteStep(): React.ReactElement {
  const packSmsE164 = publicContactConfig.packSmsE164;
  const smsHref = buildCompleteSmsHrefBecauseSendblue(
    packSmsE164,
    COMPLETE_SMS_BODY,
  );
  const showDesktopNumber = viewportIsDesktopBecauseMinWidth(
    currentViewportWidthBecauseWindow(),
  );

  return (
    <SheetCard $fill>
      <OnboardStepFrame>
        <CopyBlock>
          <Checkmark>✓</Checkmark>
          <StepTitle>You&apos;re all set!</StepTitle>
          <StepBody>Relax, we&apos;ve got you covered.</StepBody>
          <Highlights>
            {COMPLETE_HIGHLIGHTS.map((label) => (
              <Highlight key={label}>{label}</Highlight>
            ))}
          </Highlights>
        </CopyBlock>
        <CtaWrap>
          <CtaLink href={smsHref}>Let us handle the rest</CtaLink>
          {showDesktopNumber ? (
            <DesktopNumberRow data-testid="complete-pack-number">
              <PackNumber>{packSmsE164}</PackNumber>
              <CopyButton
                type="button"
                onClick={() => {
                  copyPackNumberBecauseDesktop(packSmsE164);
                }}>
                Copy
              </CopyButton>
            </DesktopNumberRow>
          ) : null}
        </CtaWrap>
      </OnboardStepFrame>
    </SheetCard>
  );
}
