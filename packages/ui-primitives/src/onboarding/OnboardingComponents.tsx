import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppleOutlineIcon} from 'pack-app/icons/svg/AppleOutlineIcon';
import {GoogleOutlineIcon} from 'pack-app/icons/svg/GoogleOutlineIcon';
import {MicrosoftIcon} from 'pack-app/icons/svg/MicrosoftIcon';
import {
  ONBOARDING_CTA_MAX_WIDTH,
  OnboardingContainer as AppOnboardingContainer,
  OnboardingContent as AppOnboardingContent,
  OnboardingEyebrow,
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
  OnboardingSubtitle,
} from 'pack-app/components/onboarding/OnboardingComponents';

import {tokens} from '../tokens';
import {TravelGlobeBackground} from './TravelGlobeBackground';

export {
  ONBOARDING_CTA_MAX_WIDTH,
  OnboardingEyebrow,
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
  OnboardingSubtitle,
};

const WEB_SAFE_AREA = {
  insets: {top: 0, right: 0, bottom: 0, left: 0},
  frame: {x: 0, y: 0, width: 0, height: 0},
};

type ProviderName = 'google' | 'microsoft' | 'apple';

type OnboardingContainerProps = {
  readonly children: React.ReactNode;
  readonly currentStep?: number;
  readonly totalSteps?: number;
  readonly onBack?: () => void;
  readonly showBack?: boolean;
  readonly showGlobe?: boolean;
};

type OnboardingHeaderProps = {
  readonly currentStep?: number;
  readonly totalSteps?: number;
  readonly onBack?: () => void;
  readonly showBack?: boolean;
  readonly backAccessibilityLabel?: string;
};

type OnboardingTitleProps = {
  readonly children: React.ReactNode;
  readonly style?: StyleProp<TextStyle>;
};

type OnboardingContentProps = {
  readonly children: React.ReactNode;
  readonly centered?: boolean;
  readonly style?: unknown;
  readonly scrollEnabled?: boolean;
};

type OnboardingPrimaryLinkProps = {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

type OnboardingSkipButtonProps = {
  readonly onPress: () => void;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

type OnboardingProviderButtonProps = {
  readonly provider: 'google' | 'apple';
  readonly onPress: () => void;
  readonly children?: React.ReactNode;
  readonly testID?: string;
};

export function ProviderMark({
  provider,
  size,
  color,
}: {
  readonly provider: ProviderName;
  readonly size: number;
  readonly color: string;
}): React.ReactElement {
  if (provider === 'microsoft') {
    return <MicrosoftIcon size={size} />;
  }
  if (provider === 'google') {
    return <GoogleOutlineIcon size={size} />;
  }
  return <AppleOutlineIcon size={size} color={color} />;
}

export function OnboardingContainer({
  children,
  showGlobe = true,
  showBack,
  currentStep,
  totalSteps,
  onBack,
}: OnboardingContainerProps): React.ReactElement {
  return (
    <SafeAreaProvider initialMetrics={WEB_SAFE_AREA}>
      <AppOnboardingContainer
        showBack={showBack}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}>
        {showGlobe ? <TravelGlobeBackground /> : null}
        {children}
      </AppOnboardingContainer>
    </SafeAreaProvider>
  );
}

export function OnboardingHeader({
  currentStep,
  totalSteps = 10,
  onBack,
  showBack = true,
  backAccessibilityLabel = 'Go back',
}: OnboardingHeaderProps): React.ReactElement {
  const handleBack = (): void => {
    if (onBack !== undefined) {
      onBack();
    }
  };
  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          style={(state: PressableStateCallbackType) => [
            styles.backButton,
            state.pressed && styles.backButtonPressed,
          ]}
          onPress={handleBack}
          accessibilityLabel={backAccessibilityLabel}
          accessibilityRole="button">
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      {currentStep !== undefined ? (
        <View style={styles.progressContainer}>
          <OnboardingProgressDots currentStep={currentStep} totalSteps={totalSteps} />
          <Text style={styles.progressText}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
      ) : (
        <View style={styles.progressContainer} />
      )}
      <View style={styles.headerSpacer} />
    </View>
  );
}

export function OnboardingTitle({
  children,
  style,
}: OnboardingTitleProps): React.ReactElement {
  return (
    <Text accessibilityRole="header" style={[styles.title, style]}>
      {children}
    </Text>
  );
}

export function OnboardingContent(
  props: OnboardingContentProps,
): React.ReactElement {
  return (
    <SafeAreaProvider initialMetrics={WEB_SAFE_AREA}>
      <AppOnboardingContent {...props} />
    </SafeAreaProvider>
  );
}

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
      style={styles.linkHit}>
      <OnboardingPrimaryButton onPress={() => undefined}>
        {children}
      </OnboardingPrimaryButton>
    </Pressable>
  );
}

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

function defaultProviderLabel(provider: 'google' | 'apple'): string {
  if (provider === 'google') {
    return 'Continue with Google';
  }
  return 'Continue with Apple';
}

export function OnboardingProviderButton({
  provider,
  onPress,
  children,
  testID,
}: OnboardingProviderButtonProps): React.ReactElement {
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
              color: isGoogle
                ? tokens.colors.googleText
                : tokens.colors.appleText,
            },
          ]}>
          {children ?? defaultProviderLabel(provider)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    transform: [{scale: 0.95}],
  },
  backGlyph: {
    color: tokens.colors.textSecondary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: tokens.typography.fontWeight.semibold,
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
  progressText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textSecondary,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  title: {
    fontSize: tokens.typography.fontSize.xxxl32,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
    textAlign: 'center',
    marginBottom: tokens.spacing.m,
    lineHeight: tokens.typography.lineHeight.title,
  },
  linkHit: {
    width: '100%',
    maxWidth: ONBOARDING_CTA_MAX_WIDTH,
    alignSelf: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xs,
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
