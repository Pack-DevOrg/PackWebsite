import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {
  OnboardingContent,
  OnboardingHeader,
  OnboardingPrimaryButton,
  OnboardingSkipButton,
  OnboardingSubtitle,
  OnboardingTitle,
  ProviderMark,
  tokens,
} from '@pack/ui-primitives';

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

function skipControlBecauseDisconnected(
  anyConnected: boolean,
  onSkip: () => void,
): React.ReactNode {
  if (anyConnected) {
    return null;
  }
  return <OnboardingSkipButton onPress={onSkip} />;
}

function connectedEmailLine(email: string | null): React.ReactNode {
  const subtitle = connectedSubtitleBecauseEmail(email);
  if (subtitle === null) {
    return null;
  }
  return (
    <Text
      style={{
        fontSize: tokens.typography.fontSize.xs,
        color: tokens.colors.textSecondary,
      }}>
      {subtitle}
    </Text>
  );
}

function AccountRow({
  connected,
  disabledLook,
  testID,
  disabled,
  onPress,
  mark,
  title,
  subtitle,
  soon,
}: {
  readonly connected: boolean;
  readonly disabledLook: boolean;
  readonly testID: string;
  readonly disabled: boolean;
  readonly onPress?: () => void;
  readonly mark: React.ReactNode;
  readonly title: string;
  readonly subtitle: React.ReactNode;
  readonly soon?: boolean;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacing.m,
        width: '100%',
        minHeight: 60,
        paddingVertical: tokens.spacing.s,
        paddingHorizontal: tokens.spacing.s12,
        borderWidth: 1,
        borderColor: connected
          ? tokens.colors.primary
          : tokens.colors.borderSubtle,
        borderRadius: tokens.borderRadius.r16,
        backgroundColor: tokens.colors.darkGray3,
        opacity: disabledLook ? 0.6 : 1,
      }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: tokens.borderRadius.l,
          borderWidth: 1,
          borderColor: tokens.colors.borderSubtle,
          backgroundColor: tokens.colors.darkGray2,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {mark}
      </View>
      <View style={{flex: 1, minWidth: 0}}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.m,
            fontWeight: tokens.typography.fontWeight.bold,
            color: disabledLook
              ? tokens.colors.textSecondary
              : tokens.colors.textPrimary,
          }}>
          {title}
        </Text>
        {subtitle}
      </View>
      {soon === true ? (
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            fontStyle: 'italic',
            color: tokens.colors.textSecondary,
          }}>
          Soon
        </Text>
      ) : null}
    </Pressable>
  );
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
    <OnboardingContent scrollEnabled={false}>
      <View style={{gap: tokens.spacing.m, minHeight: 0}}>
        <OnboardingHeader
          showBack
          onBack={handleBack}
          backAccessibilityLabel="Back"
        />
        <View style={{alignItems: 'center'}}>
          <OnboardingTitle>Connections</OnboardingTitle>
          <OnboardingSubtitle testID="connected-accounts-why-connect">
            Straight from your inbox and calendar.
          </OnboardingSubtitle>
        </View>
        <View
          style={{
            paddingVertical: tokens.spacing.s,
            paddingHorizontal: tokens.spacing.m,
            borderWidth: 1,
            borderColor: tokens.colors.borderSubtle,
            borderRadius: tokens.borderRadius.r16,
            backgroundColor: tokens.colors.darkGray3,
          }}>
          <Text
            style={{
              color: tokens.colors.textSecondary,
              fontSize: tokens.typography.fontSize.xs,
              lineHeight: 16,
            }}>
            Google-approved auditors have reviewed how we protect your data. Everything stays encrypted between you and Pack.
          </Text>
        </View>
        <View style={{gap: tokens.spacing.s}}>
          <AccountRow
            connected={googleIsConnected}
            disabledLook={false}
            testID="connect-google-button"
            disabled={googleIsLoading}
            onPress={handleConnectGoogle}
            mark={
              <ProviderMark
                provider="google"
                size={18}
                color={tokens.colors.textPrimary}
              />
            }
            title={googleAccountLabelBecauseState(
              googleIsLoading,
              googleIsConnected,
            )}
            subtitle={connectedEmailLine(
              googleIsConnected ? googleAddress : null,
            )}
          />
          <AccountRow
            connected={microsoftIsConnected}
            disabledLook={false}
            testID="connect-microsoft-button"
            disabled={microsoftIsLoading}
            onPress={handleConnectMicrosoft}
            mark={
              <ProviderMark
                provider="microsoft"
                size={18}
                color={tokens.colors.textPrimary}
              />
            }
            title={microsoftAccountLabelBecauseState(
              microsoftIsLoading,
              microsoftIsConnected,
            )}
            subtitle={connectedEmailLine(
              microsoftIsConnected ? microsoftAddress : null,
            )}
          />
          <AccountRow
            connected={false}
            disabledLook
            testID="connect-apple-button"
            disabled
            mark={
              <ProviderMark
                provider="apple"
                size={20}
                color={tokens.colors.textSecondary}
              />
            }
            title="Connect Apple"
            subtitle={null}
            soon
          />
        </View>
      </View>
      <View style={{width: '100%', alignItems: 'center'}}>
        <OnboardingPrimaryButton
          disabled={!anyConnected}
          onPress={handleContinue}>
          Continue
        </OnboardingPrimaryButton>
        {skipControlBecauseDisconnected(anyConnected, handleSkip)}
      </View>
    </OnboardingContent>
  );
}
