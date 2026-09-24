import React from 'react';
import {View} from 'react-native';

export const ONBOARDING_CTA_MAX_WIDTH = 320;

export function OnboardingContainer({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  return React.createElement('div', null, children);
}

export function OnboardingContent({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  return React.createElement('div', null, children);
}

export function OnboardingEyebrow({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  return React.createElement('span', null, children);
}

export function OnboardingHeader({
  backAccessibilityLabel = 'Go back',
  showBack = true,
  onBack,
}: {
  backAccessibilityLabel?: string;
  showBack?: boolean;
  onBack?: () => void;
}): React.ReactElement {
  if (!showBack) {
    return React.createElement('div', null);
  }
  return React.createElement(
    'button',
    {type: 'button', onClick: onBack},
    backAccessibilityLabel,
  );
}

export function OnboardingPrimaryButton(props: {
  children?: React.ReactNode;
  testID?: string;
  onPress?: () => void;
  disabled?: boolean;
}): React.ReactElement {
  return React.createElement(
    'button',
    {
      type: 'button',
      disabled: Boolean(props.disabled),
      onClick: props.onPress,
      'data-testid': props.testID ?? 'app-onboarding-primary',
    },
    props.children,
  );
}

export function OnboardingSecondaryButton(props: {
  children?: React.ReactNode;
  testID?: string;
  onPress?: () => void;
  fullWidth?: boolean;
}): React.ReactElement {
  return React.createElement(
    'button',
    {
      type: 'button',
      onClick: props.onPress,
      'data-testid': props.testID ?? 'app-onboarding-secondary',
      'data-full-width': props.fullWidth ? 'true' : 'false',
    },
    props.children,
  );
}

export function OnboardingSubtitle({
  children,
  testID,
}: {
  children?: React.ReactNode;
  testID?: string;
}): React.ReactElement {
  return React.createElement('div', {'data-testid': testID}, children);
}

export function OnboardingTitle({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  return React.createElement('span', null, children);
}

function iconMark(testID: string) {
  return function IconMark(): React.ReactElement {
    return React.createElement('span', {'data-testid': testID});
  };
}

export const GoogleOutlineIcon = iconMark('app-google-icon');
export const AppleOutlineIcon = iconMark('app-apple-icon');
export const MicrosoftIcon = iconMark('app-microsoft-icon');
export const ChevronLeftIcon = iconMark('app-chevron-icon');

export function useNavigation(): {goBack: () => void; navigate: () => void} {
  return {
    goBack() {},
    navigate() {},
  };
}

export function useFocusEffect(_effect: () => void | (() => void)): void {}

export function useSharedValue<T>(value: T): {value: T} {
  return {value};
}

export function useAnimatedStyle(factory: () => object): object {
  return factory();
}

export function withTiming<T>(value: T): T {
  return value;
}

export function withSequence<T>(value: T): T {
  return value;
}

export function withDelay<T>(_delayMs: number, value: T): T {
  return value;
}

const Animated = {
  View,
};

export default Animated;
