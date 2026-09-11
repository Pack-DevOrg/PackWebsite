import React, {useState} from 'react';
import styled from 'styled-components';

import {
  onboardTokens,
  ProviderButton,
  SheetCard,
  StepBody,
  StepTitle,
} from './OnboardPrimitives';

export interface SignupLoginStepProps {
  prefillPhone?: string;
}

function defaultPhoneBecausePrefill(prefillPhone: string | undefined): string {
  if (prefillPhone === undefined) {
    return '';
  }
  return prefillPhone;
}

function emptyCodeBoxesBecauseUnset(): string[] {
  return ['', '', '', '', '', ''];
}

function lastNumericDigitBecauseBox(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) {
    return '';
  }
  return digits.charAt(digits.length - 1);
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${onboardTokens.spacing.m}px;
  padding: ${onboardTokens.spacing.l}px ${onboardTokens.spacing.m}px;
`;

const Accent = styled.span`
  color: ${onboardTokens.primary};
`;

const PhoneField = styled.input`
  width: 100%;
  box-sizing: border-box;
  height: ${onboardTokens.buttonHeightL}px;
  padding: 0 ${onboardTokens.spacing.s12}px;
  border: 1px solid ${onboardTokens.borderMedium};
  border-radius: ${onboardTokens.borderRadius.r10}px;
  background: ${onboardTokens.darkGray3};
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.m}px;
`;

const CodeRow = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: ${onboardTokens.spacing.s}px;
`;

const CodeBox = styled.input`
  width: 100%;
  box-sizing: border-box;
  height: ${onboardTokens.buttonHeightL}px;
  text-align: center;
  border: 1px solid ${onboardTokens.borderMedium};
  border-radius: ${onboardTokens.borderRadius.r10}px;
  background: ${onboardTokens.darkGray3};
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.xl}px;
`;

const Resend = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.s}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
  cursor: pointer;
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

export function SignupLoginStep({prefillPhone}: SignupLoginStepProps) {
  const [phone, setPhone] = useState(() =>
    defaultPhoneBecausePrefill(prefillPhone),
  );
  const [codeBoxes, setCodeBoxes] = useState(emptyCodeBoxesBecauseUnset);

  return (
    <SheetCard>
      <Stack>
        <StepTitle>
          Welcome to <Accent>Pack</Accent>
        </StepTitle>
        <StepBody>Choose your preferred sign-in method</StepBody>
        <ProviderButton provider="google" />
        <ProviderButton provider="apple" />
        <PhoneField
          type="tel"
          autoComplete="tel"
          aria-label="Phone number"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
          }}
        />
        <CodeRow>
          {codeBoxes.map((digit, index) => (
            <CodeBox
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${index + 1} of 6`}
              value={digit}
              onChange={(event) => {
                const nextDigit = lastNumericDigitBecauseBox(event.target.value);
                setCodeBoxes((current) =>
                  current.map((existing, boxIndex) => {
                    if (boxIndex === index) {
                      return nextDigit;
                    }
                    return existing;
                  }),
                );
              }}
            />
          ))}
        </CodeRow>
        <Resend type="button">Resend</Resend>
        <Policy>
          By continuing you agree to our{' '}
          <PolicyLink href="/terms/">Terms of Service</PolicyLink> and{' '}
          <PolicyLink href="/privacy/">Privacy Policy</PolicyLink>.
        </Policy>
      </Stack>
    </SheetCard>
  );
}
