import React, {useContext, useLayoutEffect, useRef} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
// @ts-expect-error PackApp's navigation package is resolved at build and test time.
import {NavigationContainer, NavigationContainerRefContext} from '@react-navigation/native';
import {LinearGradient} from 'expo-linear-gradient';
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
// @ts-expect-error PackApp source is resolved by Vite and Jest, not this tsconfig.
import {AppleOutlineIcon} from '@pack/app/icons/svg/AppleOutlineIcon';
// @ts-expect-error PackApp source is resolved by Vite and Jest, not this tsconfig.
import {GoogleOutlineIcon} from '@pack/app/icons/svg/GoogleOutlineIcon';
// @ts-expect-error PackApp source is resolved by Vite and Jest, not this tsconfig.
import {MicrosoftIcon} from '@pack/app/icons/svg/MicrosoftIcon';
// @ts-expect-error PackApp source is resolved by Vite and Jest, not this tsconfig.
import {theme} from '@pack/app/themes';

import {tokens} from '../tokens';
import {TravelGlobeBackground} from './TravelGlobeBackground';

export {
  ONBOARDING_CTA_MAX_WIDTH,
  OnboardingEyebrow,
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
  OnboardingSubtitle,
// @ts-expect-error PackApp source is resolved by Vite and Jest, not this tsconfig.
} from '@pack/app/components/onboarding/OnboardingComponents';

// @ts-expect-error PackApp source is resolved by Vite and Jest, not this tsconfig.
import {OnboardingContainer as AppOnboardingContainer, OnboardingContent as AppOnboardingContent, OnboardingHeader as AppOnboardingHeader, OnboardingSecondaryButton, OnboardingTitle as AppOnboardingTitle} from '@pack/app/components/onboarding/OnboardingComponents';

const WEB_SAFE_AREA = {
  insets: {top: 0, right: 0, bottom: 0, left: 0},
  frame: {x: 0, y: 0, width: 0, height: 0},
};

type HeaderProps = {
  readonly currentStep?: number;
  readonly totalSteps?: number;
  readonly onBack?: () => void;
  readonly showBack?: boolean;
  readonly backAccessibilityLabel?: string;
};

// NavigationContainer publishes NavigationContainerRefContext, not NavigationContext
// (that one appears only after a navigator screen). Checking NavigationContext made
// every shell mount its own container, and Content + Header then nested.
const ShellContext = React.createContext(false);

function Providers({children}: {readonly children: React.ReactElement}): React.ReactElement {
  const shell = useContext(ShellContext);
  const navigation = useContext(NavigationContainerRefContext);
  const insets = useContext(SafeAreaInsetsContext);
  if (shell) {
    return children;
  }
  let tree = children;
  if (!navigation) {
    tree = <NavigationContainer>{tree}</NavigationContainer>;
  }
  if (!insets) {
    tree = (
      <SafeAreaProvider initialMetrics={WEB_SAFE_AREA}>{tree}</SafeAreaProvider>
    );
  }
  return <ShellContext.Provider value={true}>{tree}</ShellContext.Provider>;
}

function BackLabel({
  label,
  children,
}: {
  readonly label?: string;
  readonly children: React.ReactElement;
}): React.ReactElement {
  const ref = useRef<View>(null);
  useLayoutEffect(() => {
    if (!label || label === 'Go back') {
      return;
    }
    const root = ref.current as unknown as HTMLElement | null;
    const button = root?.querySelector?.('[aria-label="Go back"]');
    button?.setAttribute('aria-label', label);
  });
  return <View ref={ref}>{children}</View>;
}

export function OnboardingTitle(
  props: React.ComponentProps<typeof AppOnboardingTitle>,
): React.ReactElement {
  return (
    <View accessibilityRole="header">
      <AppOnboardingTitle {...props} />
    </View>
  );
}

export function OnboardingContainer({
  showGlobe = true,
  children,
  ...rest
}: React.ComponentProps<typeof AppOnboardingContainer> & {
  readonly showGlobe?: boolean;
}): React.ReactElement {
  return (
    <Providers>
      <AppOnboardingContainer {...rest}>
        {showGlobe ? <TravelGlobeBackground /> : null}
        {children}
      </AppOnboardingContainer>
    </Providers>
  );
}

export function OnboardingContent(
  props: React.ComponentProps<typeof AppOnboardingContent>,
): React.ReactElement {
  return (
    <Providers>
      <AppOnboardingContent {...props} />
    </Providers>
  );
}

export function OnboardingHeader({
  backAccessibilityLabel,
  ...rest
}: HeaderProps): React.ReactElement {
  return (
    <Providers>
      <BackLabel label={backAccessibilityLabel}>
        <AppOnboardingHeader {...rest} />
      </BackLabel>
    </Providers>
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
      style={styles.link}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.linkGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <Text style={styles.linkText}>{children}</Text>
      </LinearGradient>
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
  const ref = useRef<View>(null);
  useLayoutEffect(() => {
    const root = ref.current as unknown as HTMLElement | null;
    const button = root?.querySelector?.('[role="button"]');
    button?.setAttribute('aria-label', accessibilityLabel);
  });
  return (
    <View ref={ref} style={styles.skipSlot}>
      <OnboardingSecondaryButton onPress={onPress} fullWidth testID={testID}>
        Skip for now
      </OnboardingSecondaryButton>
    </View>
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

type ProviderKind = 'google' | 'apple';

function defaultProviderLabel(provider: ProviderKind): string {
  if (provider === 'google') {
    return 'Continue with Google';
  }
  return 'Continue with Apple';
}

export function ProviderMark({
  provider,
  size,
  color,
}: {
  readonly provider: 'google' | 'microsoft' | 'apple';
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

export function OnboardingProviderButton({
  provider,
  onPress,
  children,
  testID,
}: {
  readonly provider: ProviderKind;
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
  link: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    marginBottom: theme.spacing.m,
  },
  linkGradient: {
    minHeight: tokens.buttonHeightL,
    paddingVertical: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: theme.typography.fontWeight.bold as '700',
    color: theme.colors.textOnPrimary,
    textAlign: 'center',
  },
  skipSlot: {
    width: '100%',
    alignSelf: 'stretch',
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
    fontWeight: tokens.typography.fontWeight.semibold as '600',
  },
});

