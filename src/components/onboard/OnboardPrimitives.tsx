import React from 'react';
import styled, {createGlobalStyle} from 'styled-components';
import {
  OnboardingPrimaryButton,
  OnboardingProgressDots,
  OnboardingProviderButton,
  tokens,
} from '@pack/ui-primitives';

export const onboardTokens = Object.freeze({
  primary: tokens.colors.primary,
  accent: tokens.colors.accent,
  textOnPrimary: tokens.colors.textOnPrimary,
  buttonPrimaryText: tokens.colors.buttonPrimaryText,
  textPrimary: tokens.colors.textPrimary,
  textSecondary: tokens.colors.textSecondary,
  darkGray2: tokens.colors.darkGray2,
  darkGray3: tokens.colors.darkGray3,
  borderSubtle: tokens.colors.borderSubtle,
  borderMedium: tokens.colors.borderMedium,
  overlay70: tokens.colors.overlay70,
  googleBackground: tokens.colors.googleBackground,
  googleText: tokens.colors.googleText,
  appleBackground: tokens.colors.appleBackground,
  appleText: tokens.colors.appleText,
  buttonHeightL: tokens.buttonHeightL,
  spacing: tokens.spacing,
  borderRadius: tokens.borderRadius,
  fontSize: tokens.typography.fontSize,
  fontWeight: tokens.typography.fontWeight,
});

export type ProviderKind = 'google' | 'apple';

export function defaultProviderLabelBecauseBrand(
  provider: ProviderKind,
): string {
  if (provider === 'google') {
    return 'Continue with Google';
  }
  return 'Continue with Apple';
}

export const OnboardViewportLock = createGlobalStyle`
  html,
  body,
  #root {
    height: 100dvh;
    max-height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
  }
`;

export const OnboardViewport = styled.main`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-height: 100dvh;
  min-height: 100dvh;
  width: 100%;
  overflow: hidden;
  padding-top: env(safe-area-inset-top, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  background: ${onboardTokens.textOnPrimary};
  color: ${onboardTokens.textPrimary};
`;

export interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: PrimaryButtonProps): React.ReactElement {
  return (
    <OnboardingPrimaryButton
      disabled={disabled}
      onPress={() => {
        if (typeof onClick === 'function') {
          onClick({} as React.MouseEvent<HTMLButtonElement>);
        }
      }}>
      {children}
    </OnboardingPrimaryButton>
  );
}

export interface ProviderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: ProviderKind;
  children?: React.ReactNode;
}

export function ProviderButton({
  provider,
  children,
  onClick,
}: ProviderButtonProps): React.ReactElement {
  return (
    <OnboardingProviderButton
      provider={provider}
      onPress={() => {
        if (typeof onClick === 'function') {
          onClick({} as React.MouseEvent<HTMLButtonElement>);
        }
      }}>
      {children ?? defaultProviderLabelBecauseBrand(provider)}
    </OnboardingProviderButton>
  );
}

export interface ProgressDotsProps {
  count: number;
  activeIndex: number;
}

export function ProgressDots({
  count,
  activeIndex,
}: ProgressDotsProps): React.ReactElement {
  return (
    <OnboardingProgressDots
      currentStep={activeIndex + 1}
      totalSteps={count}
    />
  );
}
