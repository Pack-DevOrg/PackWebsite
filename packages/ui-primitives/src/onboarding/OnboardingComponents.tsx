import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  ONBOARDING_CTA_MAX_WIDTH,
  OnboardingContainer as AppOnboardingContainer,
  OnboardingContent as AppOnboardingContent,
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
  OnboardingTitle as AppOnboardingTitle,
} from '@pack/app/onboarding/OnboardingComponents';
import {AppleOutlineIcon} from '@pack/app/icons/AppleOutlineIcon';
import {ChevronLeftIcon} from '@pack/app/icons/ChevronLeftIcon';
import {GoogleOutlineIcon} from '@pack/app/icons/GoogleOutlineIcon';
import {MicrosoftIcon} from '@pack/app/icons/MicrosoftIcon';

import {tokens} from '../tokens';
import {TravelGlobeBackground} from './TravelGlobeBackground';

export {
  ONBOARDING_CTA_MAX_WIDTH,
  OnboardingEyebrow,
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
  OnboardingSubtitle,
} from '@pack/app/onboarding/OnboardingComponents';

const safeAreaMetrics = {frame: {x: 0, y: 0, width: 0, height: 0}, insets: {top: 0, right: 0, bottom: 0, left: 0}};

function withSafeArea(node: React.ReactElement): React.ReactElement {
  return <SafeAreaProvider initialMetrics={safeAreaMetrics}>{node}</SafeAreaProvider>;
}

type AppContainerProps = React.ComponentProps<typeof AppOnboardingContainer>;

export function OnboardingContainer({
  showGlobe = false,
  children,
  ...rest
}: AppContainerProps & {readonly showGlobe?: boolean}): React.ReactElement {
  return withSafeArea(
    <AppOnboardingContainer {...rest}>
      {showGlobe ? <TravelGlobeBackground /> : null}
      {children}
    </AppOnboardingContainer>,
  );
}

export function OnboardingContent(
  props: React.ComponentProps<typeof AppOnboardingContent>,
): React.ReactElement {
  return withSafeArea(<AppOnboardingContent {...props} />);
}

export function OnboardingHeader({
  onBack,
  showBack = true,
  backAccessibilityLabel = 'Go back',
}: {
  readonly onBack?: () => void;
  readonly showBack?: boolean;
  readonly backAccessibilityLabel?: string;
  readonly currentStep?: number;
  readonly totalSteps?: number;
}): React.ReactElement {
  if (!showBack) {
    return <View />;
  }
  return (
    <Pressable
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel={backAccessibilityLabel}
      style={styles.backButton}>
      <ChevronLeftIcon size={20} color={tokens.colors.textSecondary} />
    </Pressable>
  );
}

export function OnboardingTitle(
  props: React.ComponentProps<typeof AppOnboardingTitle>,
): React.ReactElement {
  return (
    <Text accessibilityRole="header">
      <AppOnboardingTitle {...props} />
    </Text>
  );
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={styles.skipButton}>
      <Text style={styles.skipText}>Skip for now</Text>
    </Pressable>
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
        dataSet={{active: isActive ? 'true' : 'false'}}
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

const styles = {
  primaryLink: {
    width: '100%' as const,
    maxWidth: ONBOARDING_CTA_MAX_WIDTH,
    alignSelf: 'center' as const,
  },
  skipButton: {
    width: '100%' as const,
    maxWidth: ONBOARDING_CTA_MAX_WIDTH,
    alignSelf: 'center' as const,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.m,
    borderRadius: tokens.borderRadius.xl,
    backgroundColor: tokens.colors.backgroundTransparent,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    marginBottom: tokens.spacing.m,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  skipText: {
    fontSize: tokens.typography.fontSize.m,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textSecondary,
    textAlign: 'center' as const,
  },
  progressDots: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  providerMark: {
    marginRight: 12,
  },
  providerButton: {
    width: '100%' as const,
    height: tokens.buttonHeightL,
    borderRadius: tokens.borderRadius.r10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  providerButtonText: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
};
