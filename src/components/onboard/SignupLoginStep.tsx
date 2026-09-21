import React from 'react';
import {Text, View} from 'react-native';
import {useAuth} from '@/auth/AuthContext';
import {TokenProvider} from '@/schemas/common';
import {
  OnboardingContent,
  OnboardingProviderButton,
  OnboardingSubtitle,
  OnboardingTitle,
  tokens,
} from '@pack/ui-primitives';

export type SignupLoginStepProps = Record<string, never>;

export function SignupLoginStep() {
  const {login} = useAuth();
  const startLogin = (
    identityProvider:
      | typeof TokenProvider.Google
      | typeof TokenProvider.Apple,
  ) => {
    void login({identityProvider, redirectPath: '/onboard'});
  };
  return (
    <OnboardingContent scrollEnabled={false}>
      <View>
        <OnboardingTitle>
          Welcome to{' '}
          <Text style={{color: tokens.colors.primary}}>Pack</Text>
        </OnboardingTitle>
        <OnboardingSubtitle>
          Choose your preferred sign-in method
        </OnboardingSubtitle>
      </View>
      <View style={{gap: tokens.spacing.m, width: '100%'}}>
        <OnboardingProviderButton
          provider="google"
          onPress={() => startLogin(TokenProvider.Google)}>
          Continue with Google
        </OnboardingProviderButton>
        <OnboardingProviderButton
          provider="apple"
          onPress={() => startLogin(TokenProvider.Apple)}>
          Continue with Apple
        </OnboardingProviderButton>
        <Text
          style={{
            color: tokens.colors.textSecondary,
            fontSize: tokens.typography.fontSize.xs,
            textAlign: 'center',
          }}>
          By continuing you agree to our{' '}
          <Text
            accessibilityRole="link"
            href="/terms/"
            style={{
              color: tokens.colors.primary,
              fontWeight: tokens.typography.fontWeight.semibold,
            }}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            accessibilityRole="link"
            href="/privacy/"
            style={{
              color: tokens.colors.primary,
              fontWeight: tokens.typography.fontWeight.semibold,
            }}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </OnboardingContent>
  );
}
