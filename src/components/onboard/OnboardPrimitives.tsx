import React from 'react';
import styled, {createGlobalStyle} from 'styled-components';

export const onboardTokens = Object.freeze({
  primary: '#F0C62D',
  accent: '#F0C62D',
  textOnPrimary: '#000000',
  buttonPrimaryText: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#909090',
  darkGray2: '#1E1E1E',
  darkGray3: '#2C2C2C',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderMedium: 'rgba(255, 255, 255, 0.2)',
  overlay70: 'rgba(0, 0, 0, 0.7)',
  googleBackground: '#FFFFFF',
  googleText: '#3C4043',
  appleBackground: '#000000',
  appleText: '#FFFFFF',
  buttonHeightL: 55,
  spacing: Object.freeze({
    xs: 4,
    s: 8,
    s12: 12,
    m: 16,
    l: 24,
  }),
  borderRadius: Object.freeze({
    r10: 10,
    l: 12,
    r16: 16,
    r28: 28,
  }),
  fontSize: Object.freeze({
    xs: 12,
    s: 14,
    m: 16,
    m15: 15,
    xl: 20,
  }),
  fontWeight: Object.freeze({
    semibold: '600' as const,
    bold: '700' as const,
  }),
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

function defaultProviderChildrenBecauseBrand(
  children: React.ReactNode | undefined,
  provider: ProviderKind,
): React.ReactNode {
  if (children !== undefined) {
    return children;
  }
  return defaultProviderLabelBecauseBrand(provider);
}

function defaultButtonTypeBecauseSafe(
  type: React.ButtonHTMLAttributes<HTMLButtonElement>['type'] | undefined,
): React.ButtonHTMLAttributes<HTMLButtonElement>['type'] {
  if (type === undefined) {
    return 'button';
  }
  return type;
}

function providerSurfaceBecauseBrand(provider: ProviderKind): string {
  if (provider === 'google') {
    return onboardTokens.googleBackground;
  }
  return onboardTokens.appleBackground;
}

function providerInkBecauseBrand(provider: ProviderKind): string {
  if (provider === 'google') {
    return onboardTokens.googleText;
  }
  return onboardTokens.appleText;
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

export const OnboardShell = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 430px;
  margin-inline: auto;
`;

export const OnboardStepFrame = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  justify-content: space-between;
  gap: ${onboardTokens.spacing.m}px;
  padding: ${onboardTokens.spacing.l}px ${onboardTokens.spacing.m}px;
`;

export const SheetCard = styled.div<{ $fill?: boolean }>`
  background: ${onboardTokens.darkGray2};
  border: 1px solid ${onboardTokens.borderSubtle};
  border-radius: ${onboardTokens.borderRadius.r28}px
    ${onboardTokens.borderRadius.r28}px 0 0;
  box-shadow: none;
  backdrop-filter: none;
  ${(props) =>
    props.$fill === true
      ? `
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    overflow: hidden;
  `
      : ''}
`;

const StyledPrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 100%;
  height: ${onboardTokens.buttonHeightL}px;
  border: none;
  border-radius: ${onboardTokens.borderRadius.r10}px;
  background: ${onboardTokens.primary};
  color: ${onboardTokens.textOnPrimary};
  font-size: ${onboardTokens.fontSize.m}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
`;

export interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function PrimaryButton({type, children, ...rest}: PrimaryButtonProps) {
  return (
    <StyledPrimaryButton type={defaultButtonTypeBecauseSafe(type)} {...rest}>
      {children}
    </StyledPrimaryButton>
  );
}

const StyledProviderButton = styled.button<{ $provider: ProviderKind }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 100%;
  height: ${onboardTokens.buttonHeightL}px;
  border: none;
  border-radius: ${onboardTokens.borderRadius.r10}px;
  background: ${(props) => providerSurfaceBecauseBrand(props.$provider)};
  color: ${(props) => providerInkBecauseBrand(props.$provider)};
  font-size: ${onboardTokens.fontSize.xl}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
`;

export interface ProviderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: ProviderKind;
  children?: React.ReactNode;
}

export function ProviderButton({
  provider,
  type,
  children,
  ...rest
}: ProviderButtonProps) {
  return (
    <StyledProviderButton
      $provider={provider}
      type={defaultButtonTypeBecauseSafe(type)}
      {...rest}>
      {defaultProviderChildrenBecauseBrand(children, provider)}
    </StyledProviderButton>
  );
}

const DotsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${onboardTokens.spacing.xs}px;
`;

const Dot = styled.span<{ $active: boolean }>`
  width: ${onboardTokens.spacing.s}px;
  height: ${onboardTokens.spacing.s}px;
  border-radius: ${onboardTokens.borderRadius.l}px;
  background: ${(props) =>
    props.$active ? onboardTokens.primary : onboardTokens.borderMedium};
`;

export interface ProgressDotsProps {
  count: number;
  activeIndex: number;
}

export function ProgressDots({count, activeIndex}: ProgressDotsProps) {
  const dots = Array.from({length: count}, (_, index) => {
    const isActive = index === activeIndex;
    return (
      <Dot
        key={index}
        $active={isActive}
        data-testid="onboard-progress-dot"
        data-active={isActive ? 'true' : 'false'}
      />
    );
  });

  return <DotsRow data-testid="onboard-progress-dots">{dots}</DotsRow>;
}

export const StepTitle = styled.h2`
  margin: 0;
  font-size: ${onboardTokens.fontSize.m15}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
  color: ${onboardTokens.textPrimary};
`;

export const StepHeroTitle = styled.h2`
  margin: 0;
  font-size: 44px;
  line-height: 50px;
  font-weight: ${onboardTokens.fontWeight.bold};
  color: ${onboardTokens.primary};
  text-align: center;
`;

export const StepBody = styled.p`
  margin: 0;
  font-size: ${onboardTokens.fontSize.s}px;
  color: ${onboardTokens.textSecondary};
`;
