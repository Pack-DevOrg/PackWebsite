import React from 'react';
import {useAuth} from '@/auth/AuthContext';
import {TokenProvider} from '@/schemas/common';
import styled from 'styled-components';

import {
  onboardTokens,
  ProviderButton,
  SheetCard,
  StepBody,
  StepTitle,
} from './OnboardPrimitives';

/** Sign-in only, like the app's SignupLoginScreen (Google / Apple + terms).
 * Phone verification is its own onboarding step (VerifyPhoneStep). */
export type SignupLoginStepProps = Record<string, never>;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${onboardTokens.spacing.m}px;
  padding: ${onboardTokens.spacing.l}px ${onboardTokens.spacing.m}px;
`;

const Accent = styled.span`
  color: ${onboardTokens.primary};
`;

const BrandMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: ${onboardTokens.spacing.xs}px;
`;






const Policy = styled.p`
  margin: 0;
  color: ${onboardTokens.textSecondary};
  font-size: ${onboardTokens.fontSize.xs}px;
`;

const PolicyLink = styled.a`
  color: ${onboardTokens.primary};
  font-weight: ${onboardTokens.fontWeight.semibold};
`;

function GoogleBrandIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true">
      <path
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1022-1.17.2822-1.71V4.9582H.9573A8.9965 8.9965 0 000 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3459l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleBrandIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="#FFFFFF"
      aria-hidden="true">
      <g transform="translate(0.65 0.67)">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.86 3.29.86.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z" />
        <path d="M15.53 3.83c.73-.83 1.22-1.99 1.09-3.14-1.05.04-2.32.7-3.08 1.56-.68.78-1.27 2.04-1.11 3.24 1.17.09 2.37-.6 3.1-1.66z" />
      </g>
    </svg>
  );
}

export function SignupLoginStep() {
  const {login} = useAuth();
  const startLogin = (identityProvider: typeof TokenProvider.Google | typeof TokenProvider.Apple) => {
    void login({identityProvider, redirectPath: '/onboard'});
  };
  return (
    <SheetCard>
      <Stack>
        <StepTitle>
          Welcome to <Accent>Pack</Accent>
        </StepTitle>
        <StepBody>Choose your preferred sign-in method</StepBody>
        <ProviderButton provider="google" onClick={() => startLogin(TokenProvider.Google)}>
          <BrandMark>
            <GoogleBrandIcon />
          </BrandMark>
          Continue with Google
        </ProviderButton>
        <ProviderButton provider="apple" onClick={() => startLogin(TokenProvider.Apple)}>
          <BrandMark>
            <AppleBrandIcon />
          </BrandMark>
          Continue with Apple
        </ProviderButton>
        <Policy>
          By continuing you agree to our{' '}
          <PolicyLink href="/terms/">Terms of Service</PolicyLink> and{' '}
          <PolicyLink href="/privacy/">Privacy Policy</PolicyLink>.
        </Policy>
      </Stack>
    </SheetCard>
  );
}
