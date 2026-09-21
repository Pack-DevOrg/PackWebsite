import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {
  OnboardingContent,
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
  OnboardingSubtitle,
  OnboardingTitle,
  tokens,
} from '@pack/ui-primitives';

export interface NotificationsStepProps {
  onAllow?: () => void;
  onSkip?: () => void;
  onContinue?: () => void;
}

const CONSENT_TITLE = 'Travel tips & product updates';
const CONSENT_SUBTITLE =
  'Occasional news and relevant offers. Off unless you say yes — change it anytime in Settings.';

const PREVIEW_EXAMPLES = [
  {
    id: 'gate-change',
    title: 'Gate changed to B22',
    message:
      'SY 211 to Tokyo now boards at Gate B22 — leave by 1:20 PM to make it.',
    timeLabel: 'now',
  },
  {
    id: 'plan-ready',
    title: 'Tampa for Thanksgiving',
    message: 'LAX → TPA Nov 26 · 3 nights in Tampa · TPA → LAX Nov 29',
    timeLabel: 'now',
  },
] as const;

function noopBecauseNeverBlock(): void {
  return;
}

function defaultOnContinueBecauseNeverBlock(
  onContinue: NotificationsStepProps['onContinue'],
): () => void {
  if (onContinue === undefined) {
    return noopBecauseNeverBlock;
  }
  return onContinue;
}

function defaultOnAllowBecauseOptional(
  onAllow: NotificationsStepProps['onAllow'],
): () => void {
  if (onAllow === undefined) {
    return noopBecauseNeverBlock;
  }
  return onAllow;
}

function defaultOnSkipBecauseOptional(
  onSkip: NotificationsStepProps['onSkip'],
): () => void {
  if (onSkip === undefined) {
    return noopBecauseNeverBlock;
  }
  return onSkip;
}

export function NotificationsStep({
  onAllow,
  onSkip,
  onContinue,
}: NotificationsStepProps): React.ReactElement {
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const continueFlow = defaultOnContinueBecauseNeverBlock(onContinue);
  const allow = defaultOnAllowBecauseOptional(onAllow);
  const skip = defaultOnSkipBecauseOptional(onSkip);

  return (
    <OnboardingContent scrollEnabled={false}>
      <View style={{gap: tokens.spacing.l}}>
        <OnboardingTitle>
          Turn on{' '}
          <Text style={{color: tokens.colors.accent}}>trip alerts</Text>
        </OnboardingTitle>
        <View
          testID="onboarding-notifications-preview"
          style={{width: '90%', alignSelf: 'center', gap: tokens.spacing.s12}}>
          {PREVIEW_EXAMPLES.map((example) => (
            <View
              key={example.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: tokens.spacing.s12,
                borderRadius: tokens.borderRadius.r16,
                borderWidth: 1,
                borderColor: tokens.colors.borderSubtle,
                backgroundColor: tokens.colors.darkGray3,
                padding: tokens.spacing.s12,
              }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: tokens.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    color: tokens.colors.textOnPrimary,
                    fontSize: tokens.typography.fontSize.xs,
                    fontWeight: tokens.typography.fontWeight.bold,
                  }}>
                  P
                </Text>
              </View>
              <View style={{flex: 1, minWidth: 0}}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: tokens.spacing.s,
                  }}>
                  <Text
                    style={{
                      color: tokens.colors.textPrimary,
                      fontSize: tokens.typography.fontSize.m15,
                      fontWeight: tokens.typography.fontWeight.semibold,
                    }}
                    numberOfLines={1}>
                    {example.title}
                  </Text>
                  <Text
                    style={{
                      color: tokens.colors.textSecondary,
                      fontSize: tokens.typography.fontSize.xs,
                    }}>
                    {example.timeLabel}
                  </Text>
                </View>
                <Text
                  style={{
                    color: tokens.colors.textSecondary,
                    fontSize: tokens.typography.fontSize.s,
                    lineHeight: 18,
                  }}>
                  {example.message}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.m,
          }}>
          <View style={{flex: 1}}>
            <Text
              style={{
                color: tokens.colors.textPrimary,
                fontSize: tokens.typography.fontSize.m15,
                fontWeight: tokens.typography.fontWeight.semibold,
              }}>
              {CONSENT_TITLE}
            </Text>
            <OnboardingSubtitle style={{textAlign: 'left', marginBottom: 0}}>
              {CONSENT_SUBTITLE}
            </OnboardingSubtitle>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Travel tips and product updates"
            accessibilityState={{checked: marketingOptIn}}
            testID="onboarding-notifications-marketing-toggle"
            onPress={() => {
              setMarketingOptIn(!marketingOptIn);
            }}
            style={{
              width: 51,
              height: 31,
              borderRadius: 16,
              backgroundColor: marketingOptIn
                ? tokens.colors.primary
                : tokens.colors.borderMedium,
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}>
            <View
              style={{
                width: 27,
                height: 27,
                borderRadius: 14,
                backgroundColor: tokens.colors.textPrimary,
                alignSelf: marketingOptIn ? 'flex-end' : 'flex-start',
              }}
            />
          </Pressable>
        </View>
      </View>
      <View style={{alignItems: 'center', width: '100%'}}>
        <OnboardingPrimaryButton
          testID="onboarding-notifications-primary"
          onPress={() => {
            allow();
            continueFlow();
          }}>
          Turn on notifications
        </OnboardingPrimaryButton>
        <OnboardingSecondaryButton
          testID="onboarding-notifications-skip"
          onPress={() => {
            skip();
            continueFlow();
          }}>
          Not now
        </OnboardingSecondaryButton>
      </View>
    </OnboardingContent>
  );
}
