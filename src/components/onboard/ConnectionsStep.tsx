import React from 'react';
import styled from 'styled-components';

import {
  PrimaryButton,
  SheetCard,
  StepBody,
  StepTitle,
  onboardTokens,
} from './OnboardPrimitives';

export interface ConnectionsStepProps {
  onContinue?: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  onConnectGoogle?: () => void;
  onConnectMicrosoft?: () => void;
  googleConnected?: boolean;
  microsoftConnected?: boolean;
  googleEmail?: string | null;
  microsoftEmail?: string | null;
  googleLoading?: boolean;
  microsoftLoading?: boolean;
}

function noopHandlerBecauseUnset(): void {
  return;
}

function defaultHandlerBecauseNoop(
  handler: (() => void) | undefined,
): () => void {
  if (handler === undefined) {
    return noopHandlerBecauseUnset;
  }
  return handler;
}

function defaultFalseBecauseUnset(value: boolean | undefined): boolean {
  if (value === undefined) {
    return false;
  }
  return value;
}

function defaultEmailBecauseNone(
  value: string | null | undefined,
): string | null {
  if (value === undefined) {
    return null;
  }
  return value;
}

function anyProviderConnectedBecauseRows(
  googleConnected: boolean,
  microsoftConnected: boolean,
): boolean {
  if (googleConnected) {
    return true;
  }
  return microsoftConnected;
}

function googleAccountLabelBecauseState(
  loading: boolean,
  connected: boolean,
): string {
  if (loading) {
    return 'Connecting...';
  }
  if (connected) {
    return 'Add another Google account';
  }
  return 'Connect Google';
}

function microsoftAccountLabelBecauseState(
  loading: boolean,
  connected: boolean,
): string {
  if (loading) {
    return 'Connecting...';
  }
  if (connected) {
    return 'Add another Microsoft account';
  }
  return 'Connect Microsoft';
}

function connectedSubtitleBecauseEmail(email: string | null): string | null {
  if (email === null) {
    return null;
  }
  if (email === '') {
    return null;
  }
  return `Connected: ${email}`;
}

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${onboardTokens.spacing.m}px;
  padding: ${onboardTokens.spacing.l}px ${onboardTokens.spacing.m}px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.s}px;
  text-align: center;
`;

const BackButton = styled.button`
  align-self: flex-start;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.xl}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
  cursor: pointer;
`;

const Security = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${onboardTokens.spacing.s}px;
  padding: ${onboardTokens.spacing.s}px ${onboardTokens.spacing.m}px;
  border: 1px solid ${onboardTokens.borderSubtle};
  border-radius: ${onboardTokens.borderRadius.r16}px;
  background: ${onboardTokens.darkGray3};
  text-align: left;
`;

const SecurityCopy = styled.p`
  margin: 0;
  color: ${onboardTokens.textSecondary};
  font-size: ${onboardTokens.fontSize.xs}px;
  line-height: 16px;
`;

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${onboardTokens.spacing.s}px;
`;

const AccountRow = styled.button<{ $connected: boolean; $disabledLook: boolean }>`
  display: flex;
  align-items: center;
  gap: ${onboardTokens.spacing.m}px;
  width: 100%;
  min-height: 60px;
  padding: ${onboardTokens.spacing.s}px ${onboardTokens.spacing.s12}px;
  border: 1px solid
    ${(props) =>
      props.$connected ? onboardTokens.primary : onboardTokens.borderSubtle};
  border-radius: ${onboardTokens.borderRadius.r16}px;
  background: ${onboardTokens.darkGray3};
  color: ${onboardTokens.textPrimary};
  text-align: left;
  cursor: pointer;
  opacity: ${(props) => (props.$disabledLook ? 0.6 : 1)};
`;

const AccountMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: 1px solid ${onboardTokens.borderSubtle};
  border-radius: ${onboardTokens.borderRadius.l}px;
  background: ${onboardTokens.darkGray2};
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.m}px;
  font-weight: ${onboardTokens.fontWeight.bold};
`;

const AccountCopy = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const AccountTitle = styled.span<{ $muted: boolean }>`
  font-size: ${onboardTokens.fontSize.m}px;
  font-weight: ${onboardTokens.fontWeight.bold};
  color: ${(props) =>
    props.$muted ? onboardTokens.textSecondary : onboardTokens.textPrimary};
`;

const AccountSubtitle = styled.span`
  font-size: ${onboardTokens.fontSize.xs}px;
  color: ${onboardTokens.textSecondary};
`;

const SoonLabel = styled.span`
  font-size: ${onboardTokens.fontSize.xs}px;
  font-style: italic;
  color: ${onboardTokens.textSecondary};
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
  min-height: 32px;
  border: 1px solid ${onboardTokens.borderMedium};
  border-radius: ${onboardTokens.borderRadius.l}px;
  background: ${onboardTokens.darkGray3};
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.m15}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
  cursor: pointer;
`;

function skipControlBecauseDisconnected(
  anyConnected: boolean,
  onSkip: () => void,
): React.ReactNode {
  if (anyConnected) {
    return null;
  }
  return (
    <SkipButton
      type="button"
      onClick={onSkip}
      data-testid="connected-accounts-skip-button">
      Skip for now
    </SkipButton>
  );
}

function connectedEmailLine(email: string | null): React.ReactNode {
  const subtitle = connectedSubtitleBecauseEmail(email);
  if (subtitle === null) {
    return null;
  }
  return <AccountSubtitle>{subtitle}</AccountSubtitle>;
}

export function ConnectionsStep({
  onContinue,
  onSkip,
  onBack,
  onConnectGoogle,
  onConnectMicrosoft,
  googleConnected,
  microsoftConnected,
  googleEmail,
  microsoftEmail,
  googleLoading,
  microsoftLoading,
}: ConnectionsStepProps): React.ReactElement {
  const handleContinue = defaultHandlerBecauseNoop(onContinue);
  const handleSkip = defaultHandlerBecauseNoop(onSkip);
  const handleBack = defaultHandlerBecauseNoop(onBack);
  const handleConnectGoogle = defaultHandlerBecauseNoop(onConnectGoogle);
  const handleConnectMicrosoft = defaultHandlerBecauseNoop(onConnectMicrosoft);
  const googleIsConnected = defaultFalseBecauseUnset(googleConnected);
  const microsoftIsConnected = defaultFalseBecauseUnset(microsoftConnected);
  const googleAddress = defaultEmailBecauseNone(googleEmail);
  const microsoftAddress = defaultEmailBecauseNone(microsoftEmail);
  const googleIsLoading = defaultFalseBecauseUnset(googleLoading);
  const microsoftIsLoading = defaultFalseBecauseUnset(microsoftLoading);
  const anyConnected = anyProviderConnectedBecauseRows(
    googleIsConnected,
    microsoftIsConnected,
  );

  return (
    <SheetCard>
      <Frame>
        <BackButton type="button" aria-label="Back" onClick={handleBack}>
          ‹
        </BackButton>
        <Header>
          <StepTitle>Connections</StepTitle>
          <StepBody data-testid="connected-accounts-why-connect">
            Straight from your inbox and calendar.
          </StepBody>
        </Header>
        <Security>
          <SecurityCopy>
            Google-approved auditors have reviewed how we protect your data. Everything stays encrypted between you and Pack.
          </SecurityCopy>
        </Security>
        <AccountList>
          <AccountRow
            type="button"
            $connected={googleIsConnected}
            $disabledLook={false}
            data-testid="connect-google-button"
            disabled={googleIsLoading}
            onClick={handleConnectGoogle}>
            <AccountMark>G</AccountMark>
            <AccountCopy>
              <AccountTitle $muted={false}>
                {googleAccountLabelBecauseState(
                  googleIsLoading,
                  googleIsConnected,
                )}
              </AccountTitle>
              {connectedEmailLine(
                googleIsConnected ? googleAddress : null,
              )}
            </AccountCopy>
          </AccountRow>
          <AccountRow
            type="button"
            $connected={microsoftIsConnected}
            $disabledLook={false}
            data-testid="connect-microsoft-button"
            disabled={microsoftIsLoading}
            onClick={handleConnectMicrosoft}>
            <AccountMark>M</AccountMark>
            <AccountCopy>
              <AccountTitle $muted={false}>
                {microsoftAccountLabelBecauseState(
                  microsoftIsLoading,
                  microsoftIsConnected,
                )}
              </AccountTitle>
              {connectedEmailLine(
                microsoftIsConnected ? microsoftAddress : null,
              )}
            </AccountCopy>
          </AccountRow>
          <AccountRow
            type="button"
            $connected={false}
            $disabledLook={true}
            data-testid="connect-apple-button"
            disabled={true}>
            <AccountMark>A</AccountMark>
            <AccountCopy>
              <AccountTitle $muted={true}>Connect Apple</AccountTitle>
            </AccountCopy>
            <SoonLabel>Soon</SoonLabel>
          </AccountRow>
        </AccountList>
        <Actions>
          <PrimaryButton
            type="button"
            disabled={!anyConnected}
            onClick={handleContinue}>
            Continue
          </PrimaryButton>
          {skipControlBecauseDisconnected(anyConnected, handleSkip)}
        </Actions>
      </Frame>
    </SheetCard>
  );
}
