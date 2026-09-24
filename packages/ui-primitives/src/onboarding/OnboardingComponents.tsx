import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {LinearGradient} from '../shims/LinearGradient';
import {SafeAreaView} from '../shims/SafeArea';
import {ProviderMark} from '../shims/ProviderMark';
import {tokens} from '../tokens';
import {TravelGlobeBackground} from './TravelGlobeBackground';

export const ONBOARDING_CTA_MAX_WIDTH = 320;

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

type OnboardingContentProps = {
  readonly children: React.ReactNode;
  readonly centered?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly scrollEnabled?: boolean;
};

type OnboardingTitleProps = {
  readonly children: React.ReactNode;
  readonly style?: StyleProp<TextStyle>;
};

type OnboardingSubtitleProps = {
  readonly children: React.ReactNode;
  readonly style?: StyleProp<TextStyle>;
  readonly testID?: string;
};

type OnboardingPrimaryButtonProps = {
  readonly onPress: () => void;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly showDisabledStyle?: boolean;
  readonly children: React.ReactNode;
  readonly maxWidth?: number;
  readonly fullWidth?: boolean;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

type OnboardingPrimaryLinkProps = {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

type OnboardingSecondaryButtonProps = {
  readonly onPress: () => void;
  readonly children: React.ReactNode;
  readonly fullWidth?: boolean;
  readonly maxWidth?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

type OnboardingSkipButtonProps = {
  readonly onPress: () => void;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

type ProviderKind = 'google' | 'apple';

type OnboardingProviderButtonProps = {
  readonly provider: ProviderKind;
  readonly onPress: () => void;
  readonly children?: React.ReactNode;
  readonly testID?: string;
};

function defaultProviderLabel(provider: ProviderKind): string {
  if (provider === 'google') {
    return 'Continue with Google';
  }
  return 'Continue with Apple';
}

export function OnboardingContainer({
  children,
  currentStep,
  totalSteps = 10,
  onBack,
  showBack = true,
  showGlobe = true,
}: OnboardingContainerProps): React.ReactElement {
  const showHeader = showBack === true || currentStep !== undefined;
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          tokens.colors.black,
          tokens.colors.darkGray1,
          tokens.colors.darkGray2,
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{x: 0.1, y: 0}}
        end={{x: 0.9, y: 1}}
      />
      {showGlobe ? <TravelGlobeBackground /> : null}
      {showHeader ? (
        <OnboardingHeader
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          showBack={showBack}
        />
      ) : null}
      <View style={styles.foreground}>{children}</View>
    </SafeAreaView>
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
          <OnboardingProgressDots
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
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

export function OnboardingContent({
  children,
  centered = false,
  style,
  scrollEnabled = true,
}: OnboardingContentProps): React.ReactElement {
  const contentStyles = [
    styles.content,
    centered ? styles.contentCentered : null,
    style,
  ];
  if (!scrollEnabled) {
    return <View style={contentStyles}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.contentScroll}
      contentContainerStyle={contentStyles}
      bounces={false}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
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

export function OnboardingSubtitle({
  children,
  style,
  testID,
}: OnboardingSubtitleProps): React.ReactElement {
  return (
    <Text testID={testID} style={[styles.subtitle, style]}>
      {children}
    </Text>
  );
}

export function OnboardingEyebrow({
  children,
  style,
  align = 'center',
}: {
  readonly children: React.ReactNode;
  readonly style?: StyleProp<TextStyle>;
  readonly align?: 'center' | 'left';
}): React.ReactElement {
  return (
    <Text
      style={[
        styles.eyebrowText,
        align === 'center' ? styles.eyebrowCenter : styles.eyebrowLeft,
        style,
      ]}>
      {children}
    </Text>
  );
}

export function OnboardingPrimaryButton({
  onPress,
  loading = false,
  disabled = false,
  showDisabledStyle = true,
  maxWidth,
  fullWidth = false,
  testID,
  accessibilityLabel,
  children,
}: OnboardingPrimaryButtonProps): React.ReactElement {
  const resolvedMaxWidth = fullWidth
    ? undefined
    : (maxWidth ?? ONBOARDING_CTA_MAX_WIDTH);
  const isInteractionDisabled = disabled || loading;
  const isVisuallyDisabled = isInteractionDisabled && showDisabledStyle;
  return (
    <Pressable
      style={(state: PressableStateCallbackType) => [
        styles.primaryButton,
        state.pressed && styles.primaryButtonPressed,
        isVisuallyDisabled && styles.primaryButtonDisabled,
        fullWidth
          ? styles.primaryButtonFullWidth
          : styles.primaryButtonConstrained,
        !fullWidth && resolvedMaxWidth !== undefined
          ? {maxWidth: resolvedMaxWidth}
          : null,
      ]}
      onPress={onPress}
      disabled={isInteractionDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}>
      <LinearGradient
        colors={
          isVisuallyDisabled
            ? [tokens.colors.gray, tokens.colors.gray]
            : [tokens.colors.primary, tokens.colors.primaryDark]
        }
        style={styles.primaryButtonGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <Text style={styles.primaryButtonText}>
          {loading ? 'Loading...' : children}
        </Text>
      </LinearGradient>
    </Pressable>
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
      style={[
        styles.primaryButton,
        styles.primaryButtonConstrained,
        {maxWidth: ONBOARDING_CTA_MAX_WIDTH},
      ]}>
      <LinearGradient
        colors={[tokens.colors.primary, tokens.colors.primaryDark]}
        style={styles.primaryButtonGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <Text style={styles.primaryButtonText}>{children}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function OnboardingSecondaryButton({
  onPress,
  children,
  fullWidth = false,
  maxWidth = ONBOARDING_CTA_MAX_WIDTH,
  style,
  testID,
}: OnboardingSecondaryButtonProps): React.ReactElement {
  return (
    <Pressable
      style={(state: PressableStateCallbackType) => [
        styles.secondaryButton,
        fullWidth
          ? styles.secondaryButtonFullWidth
          : [styles.secondaryButtonConstrained, {maxWidth}],
        state.pressed && styles.secondaryButtonPressed,
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      testID={testID}>
      <Text style={styles.secondaryButtonText}>{children}</Text>
    </Pressable>
  );
}

export function OnboardingSkipButton({
  onPress,
  testID = 'connected-accounts-skip-button',
  accessibilityLabel = 'Skip for now',
}: OnboardingSkipButtonProps): React.ReactElement {
  return (
    <Pressable
      style={(state: PressableStateCallbackType) => [
        styles.secondaryButton,
        styles.secondaryButtonFullWidth,
        state.pressed && styles.secondaryButtonPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}>
      <Text style={styles.secondaryButtonText}>Skip for now</Text>
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
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: tokens.colors.black,
  },
  foreground: {
    flex: 1,
    minHeight: 0,
    zIndex: 1,
  },
  eyebrowCenter: {
    alignSelf: 'center',
  },
  eyebrowLeft: {
    alignSelf: 'flex-start',
  },
  eyebrowText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: tokens.spacing.m,
    minHeight: 60,
    zIndex: 1,
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
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  progressText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textSecondary,
    fontWeight: tokens.typography.fontWeight.medium,
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
  content: {
    flexGrow: 1,
    paddingHorizontal: tokens.spacing.m,
    paddingVertical: tokens.spacing.xl,
    justifyContent: 'space-between',
  },
  contentScroll: {
    flex: 1,
  },
  contentCentered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.typography.fontSize.xxxl32,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
    textAlign: 'center',
    marginBottom: tokens.spacing.m,
    lineHeight: tokens.typography.lineHeight.title,
  },
  subtitle: {
    fontSize: tokens.typography.fontSize.m,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: tokens.typography.lineHeight.subtitle,
    marginBottom: tokens.spacing.xl,
  },
  primaryButton: {
    borderRadius: tokens.borderRadius.l,
    overflow: 'hidden',
    backgroundColor: tokens.colors.primary,
    marginBottom: tokens.spacing.m,
  },
  primaryButtonConstrained: {
    width: '100%',
    alignSelf: 'center',
  },
  primaryButtonFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  primaryButtonPressed: {
    transform: [{scale: 0.98}],
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonGradient: {
    minHeight: tokens.buttonHeightL,
    paddingVertical: tokens.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: tokens.typography.fontSize.l,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textOnPrimary,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.m,
    borderRadius: tokens.borderRadius.xl,
    backgroundColor: tokens.colors.backgroundTransparent,
    borderWidth: 1,
    borderColor: tokens.colors.borderSubtle,
    marginBottom: tokens.spacing.m,
  },
  secondaryButtonConstrained: {
    width: '100%',
    alignSelf: 'center',
  },
  secondaryButtonFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  secondaryButtonPressed: {
    opacity: 0.7,
    transform: [{scale: 0.98}],
  },
  secondaryButtonText: {
    fontSize: tokens.typography.fontSize.m,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
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
