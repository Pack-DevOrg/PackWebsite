import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import {
  ONBOARDING_CTA_MAX_WIDTH,
  OnboardingContainer as AppOnboardingContainer,
  OnboardingContent,
  OnboardingEyebrow,
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
  OnboardingSubtitle,
  OnboardingTitle as AppOnboardingTitle,
} from '@pack/app/onboarding/OnboardingComponents';
import {AppleOutlineIcon} from '@pack/app/icons/AppleOutlineIcon';
import {ChevronLeftIcon} from '@pack/app/icons/ChevronLeftIcon';
import {GoogleOutlineIcon} from '@pack/app/icons/GoogleOutlineIcon';
import {MicrosoftIcon} from '@pack/app/icons/MicrosoftIcon';

import {tokens} from '../tokens';

export {
  ONBOARDING_CTA_MAX_WIDTH,
  OnboardingContent,
  OnboardingEyebrow,
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
  OnboardingSubtitle,
};

export function OnboardingTitle(
  props: React.ComponentProps<typeof AppOnboardingTitle>,
): React.ReactElement {
  return (
    <Text accessibilityRole="header" style={styles.titleWrap}>
      <AppOnboardingTitle {...props} />
    </Text>
  );
}

export function OnboardingHeader({
  currentStep,
  totalSteps = 10,
  onBack,
  showBack = true,
  backAccessibilityLabel = 'Go back',
}: {
  readonly currentStep?: number;
  readonly totalSteps?: number;
  readonly onBack?: () => void;
  readonly showBack?: boolean;
  readonly backAccessibilityLabel?: string;
}): React.ReactElement {
  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          style={(state: PressableStateCallbackType) => [
            styles.backButton,
            state.pressed ? styles.backButtonPressed : null,
          ]}
          onPress={onBack}
          accessibilityLabel={backAccessibilityLabel}
          accessibilityRole="button">
          <ChevronLeftIcon size={20} color={tokens.colors.textSecondary} />
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      {currentStep !== undefined ? (
        <View style={styles.progressContainer}>
          <OnboardingProgressDots currentStep={currentStep} totalSteps={totalSteps} />
        </View>
      ) : (
        <View style={styles.progressContainer} />
      )}
      <View style={styles.headerSpacer} />
    </View>
  );
}

type AppContainerProps = React.ComponentProps<typeof AppOnboardingContainer>;

export function OnboardingContainer({
  showGlobe: _showGlobe,
  ...props
}: AppContainerProps & {readonly showGlobe?: boolean}): React.ReactElement {
  return <AppOnboardingContainer {...props} />;
}

type OnboardingPrimaryLinkProps = {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

export function OnboardingPrimaryLink({
  href,
  children,
  testID,
  accessibilityLabel,
}: OnboardingPrimaryLinkProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="link"
      href={href}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={styles.primaryLink}>
      <OnboardingPrimaryButton onPress={() => undefined}>{children}</OnboardingPrimaryButton>
    </Pressable>
  );
}

type OnboardingSkipButtonProps = {
  readonly onPress: () => void;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

export function OnboardingSkipButton({
  onPress,
  testID = 'connected-accounts-skip-button',
  accessibilityLabel = 'Skip for now',
}: OnboardingSkipButtonProps): React.ReactElement {
  return (
    <OnboardingSecondaryButton onPress={onPress} fullWidth testID={testID}>
      {accessibilityLabel}
    </OnboardingSecondaryButton>
  );
}

export function OnboardingProgressDots({
  currentStep,
  totalSteps,
}: {
  readonly currentStep: number;
  readonly totalSteps: number;
}): React.ReactElement {
  const dots = Array.from({length: totalSteps}, (_, index) => {
    const isActive = index === currentStep - 1;
    return (
      <View
        key={index}
        testID="onboard-progress-dot"
        accessibilityState={{selected: isActive}}
        style={[styles.dot, isActive ? styles.dotActive : styles.dotIdle]}
      />
    );
  });
  return (
    <View style={styles.progressDots} testID="onboard-progress-dots">
      {dots}
    </View>
  );
}

type ProviderKind = 'google' | 'apple' | 'microsoft';

export function ProviderMark({
  provider,
  size,
  color,
}: {
  readonly provider: ProviderKind;
  readonly size: number;
  readonly color: string;
}): React.ReactElement {
  if (provider === 'google') {
    return <GoogleOutlineIcon size={size} />;
  }
  if (provider === 'microsoft') {
    return <MicrosoftIcon size={size} />;
  }
  return <AppleOutlineIcon size={size} color={color} />;
}

function defaultProviderLabel(provider: ProviderKind): string {
  if (provider === 'google') {
    return 'Continue with Google';
  }
  if (provider === 'microsoft') {
    return 'Continue with Microsoft';
  }
  return 'Continue with Apple';
}

export function OnboardingProviderButton({
  provider,
  onPress,
  children,
  testID,
}: {
  readonly provider: Exclude<ProviderKind, 'microsoft'>;
  readonly onPress: () => void;
  readonly children?: React.ReactNode;
  readonly testID?: string;
}): React.ReactElement {
  const isGoogle = provider === 'google';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      testID={testID}
      style={[
        styles.providerButton,
        {
          backgroundColor: isGoogle
            ? tokens.colors.googleBackground
            : tokens.colors.appleBackground,
        },
      ]}>
      <View style={styles.providerButtonRow}>
        <View style={styles.providerMark}>
          <ProviderMark
            provider={provider}
            size={isGoogle ? 18 : 20}
            color={isGoogle ? tokens.colors.googleText : tokens.colors.appleText}
          />
        </View>
        <Text
          style={[
            styles.providerButtonText,
            {
              color: isGoogle ? tokens.colors.googleText : tokens.colors.appleText,
            },
          ]}>
          {children ?? defaultProviderLabel(provider)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: tokens.spacing.m,
    minHeight: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: tokens.borderRadius.r20,
    backgroundColor: tokens.colors.backgroundTransparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  primaryLink: {
    width: '100%',
    maxWidth: ONBOARDING_CTA_MAX_WIDTH,
    alignSelf: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  dot: {
    width: tokens.spacing.s,
    height: tokens.spacing.s,
    borderRadius: tokens.borderRadius.l,
  },
  dotActive: {
    backgroundColor: tokens.colors.primary,
  },
  dotIdle: {
    backgroundColor: tokens.colors.borderMedium,
  },
  providerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerMark: {
    marginRight: 12,
  },
  providerButton: {
    width: '100%',
    height: tokens.buttonHeightL,
    borderRadius: tokens.borderRadius.r10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerButtonText: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
});
