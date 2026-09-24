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

import {tokens} from '../tokens';
import {TravelGlobeBackground} from './TravelGlobeBackground';

type LinearGradientProps = {
  readonly colors: readonly string[];
  readonly style?: StyleProp<ViewStyle>;
  readonly start?: {readonly x: number; readonly y: number};
  readonly end?: {readonly x: number; readonly y: number};
  readonly children?: React.ReactNode;
};

function gradientAngle(
  start: {readonly x: number; readonly y: number},
  end: {readonly x: number; readonly y: number},
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

function LinearGradient({
  colors,
  style,
  start = {x: 0, y: 0},
  end = {x: 0, y: 1},
  children,
}: LinearGradientProps): React.ReactElement {
  const image = `linear-gradient(${gradientAngle(start, end)}deg, ${colors.join(', ')})`;
  return (
    <View
      style={[
        styles.gradientFill,
        style,
        {backgroundImage: image} as unknown as ViewStyle,
      ]}>
      {children}
    </View>
  );
}

function SafeAreaView({
  style,
  children,
}: {
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: React.ReactNode;
}): React.ReactElement {
  return <View style={[styles.safeArea, style]}>{children}</View>;
}

function ProviderMark({
  provider,
  size,
  color,
}: {
  readonly provider: 'google' | 'microsoft' | 'apple';
  readonly size: number;
  readonly color: string;
}): React.ReactElement {
  if (provider === 'microsoft') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
      </svg>
    );
  }
  if (provider === 'google') {
    return (
      <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
        <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853" />
        <path d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1022-1.17.2822-1.71V4.9582H.9573A8.9965 8.9965 0 000 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z" fill="#FBBC05" />
        <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3459l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z" fill="#EA4335" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" focusable="false">
      <g transform="translate(0.65 0.67)">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.86 3.29.86.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z" />
        <path d="M15.53 3.83c.73-.83 1.22-1.99 1.09-3.14-1.05.04-2.32.7-3.08 1.56-.68.78-1.27 2.04-1.11 3.24 1.17.09 2.37-.6 3.1-1.66z" />
      </g>
    </svg>
  );
}

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
    <Text
      accessibilityRole="link"
      href={href}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.primaryButton,
        styles.primaryButtonConstrained,
        {maxWidth: ONBOARDING_CTA_MAX_WIDTH},
      ] as unknown as StyleProp<TextStyle>}>
      <LinearGradient
        colors={[tokens.colors.primary, tokens.colors.primaryDark]}
        style={styles.primaryButtonGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <Text style={styles.primaryButtonText}>{children}</Text>
      </LinearGradient>
    </Text>
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
  gradientFill: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    minHeight: 0,
  },
  primaryButtonGradient: {
    width: '100%',
    alignSelf: 'stretch',
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
