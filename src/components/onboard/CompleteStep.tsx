import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {
  OnboardingContent,
  OnboardingPrimaryLink,
  OnboardingSubtitle,
  OnboardingTitle,
  tokens,
} from '@pack/ui-primitives';

import {publicContactConfig} from '../../config/appConfig';
import {copyTextToClipboard} from '../../utils/clipboard';

export const COMPLETE_SMS_BODY = 'Hi Pack';
export const COMPLETE_DESKTOP_MIN_WIDTH_PX = 740;

const COMPLETE_HIGHLIGHTS = [
  'Smart trip planning',
  'Personalized recommendations',
  'Built with love',
] as const;

export function buildCompleteSmsHrefBecauseSendblue(
  e164: string,
  body: string,
): string {
  return `sms:${e164}?body=${encodeURIComponent(body)}`;
}

function viewportIsDesktopBecauseMinWidth(width: number): boolean {
  return width >= COMPLETE_DESKTOP_MIN_WIDTH_PX;
}

function currentViewportWidthBecauseWindow(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.innerWidth;
}

function copyPackNumberBecauseDesktop(e164: string): void {
  void copyTextToClipboard(e164);
}

export function CompleteStep(): React.ReactElement {
  const packSmsE164 = publicContactConfig.packSmsE164;
  const smsHref = buildCompleteSmsHrefBecauseSendblue(
    packSmsE164,
    COMPLETE_SMS_BODY,
  );
  const showDesktopNumber = viewportIsDesktopBecauseMinWidth(
    currentViewportWidthBecauseWindow(),
  );

  return (
    <OnboardingContent scrollEnabled={false}>
      <View style={{alignItems: 'center', gap: tokens.spacing.m}}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: tokens.colors.success,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{
              color: tokens.colors.textOnPrimary,
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold,
            }}>
            ✓
          </Text>
        </View>
        <OnboardingTitle>You&apos;re all set!</OnboardingTitle>
        <OnboardingSubtitle>Relax, we&apos;ve got you covered.</OnboardingSubtitle>
        <View style={{alignItems: 'center', gap: tokens.spacing.s}}>
          {COMPLETE_HIGHLIGHTS.map((label) => (
            <Text
              key={label}
              style={{
                color: tokens.colors.textPrimary,
                fontSize: tokens.typography.fontSize.m,
                fontWeight: tokens.typography.fontWeight.semibold,
              }}>
              {label}
            </Text>
          ))}
        </View>
      </View>
      <View style={{width: '100%', alignItems: 'center'}}>
        <OnboardingPrimaryLink href={smsHref}>
          Let us handle the rest
        </OnboardingPrimaryLink>
        {showDesktopNumber ? (
          <View
            testID="complete-pack-number"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: tokens.spacing.s,
            }}>
            <Text
              style={{
                color: tokens.colors.textPrimary,
                fontSize: tokens.typography.fontSize.m,
                fontWeight: tokens.typography.fontWeight.semibold,
              }}>
              {packSmsE164}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                copyPackNumberBecauseDesktop(packSmsE164);
              }}
              style={{
                height: tokens.buttonHeightL / 2,
                paddingHorizontal: tokens.spacing.s12,
                borderWidth: 1,
                borderColor: tokens.colors.borderMedium,
                borderRadius: tokens.borderRadius.r10,
                backgroundColor: tokens.colors.darkGray3,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  color: tokens.colors.textPrimary,
                  fontSize: tokens.typography.fontSize.s,
                  fontWeight: tokens.typography.fontWeight.semibold,
                }}>
                Copy
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </OnboardingContent>
  );
}
