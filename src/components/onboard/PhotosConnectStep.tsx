import React from 'react';
import {Text, View} from 'react-native';
import {
  OnboardingContent,
  OnboardingPrimaryButton,
  OnboardingSkipButton,
  OnboardingSubtitle,
  OnboardingTitle,
  SheetGrabber,
  SheetHeader,
  tokens,
} from '@pack/ui-primitives';

export interface PhotosConnectStepProps {
  onSkip?: () => void;
  onContinue?: () => void;
  onSharePhotos?: () => void | Promise<void>;
}

const HEADLINE_STATS = [
  {key: 'countries', label: 'Countries'},
  {key: 'continents', label: 'Continents'},
  {key: 'cities', label: 'Cities'},
] as const;

const CATEGORY_LABELS = [
  'Restaurants & cafés',
  'Bars',
  'Landmarks',
  'Museums',
  'Parks',
  'Shopping',
  'Activities',
] as const;

const CATEGORY_DOT_COLORS = [
  tokens.colors.primary,
  tokens.colors.textSecondary,
  tokens.colors.textPrimary,
  tokens.colors.borderMedium,
  tokens.colors.darkGray3,
  tokens.colors.textSecondary,
  tokens.colors.primary,
] as const;

function noopAction(): void {
  return;
}

function defaultSkipBecauseNoop(
  onSkip: PhotosConnectStepProps['onSkip'],
): () => void {
  if (onSkip === undefined) {
    return noopAction;
  }
  return onSkip;
}

export function PhotosConnectStep({
  onSkip,
  onSharePhotos,
}: PhotosConnectStepProps): React.ReactElement {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const handleSkip = defaultSkipBecauseNoop(onSkip);

  const handleSharePhotos = (): void => {
    setSheetOpen(false);
    if (onSharePhotos === undefined) {
      return;
    }
    void onSharePhotos();
  };

  return (
    <OnboardingContent scrollEnabled={false}>
      <View style={{alignItems: 'center', gap: tokens.spacing.m}}>
        <OnboardingTitle>
          Let&apos;s see the{' '}
          <Text style={{color: tokens.colors.primary}}>places</Text> you&apos;ve
          been
        </OnboardingTitle>
        <OnboardingSubtitle>
          Pack matches photos to find things you&apos;ve visited.
        </OnboardingSubtitle>
        <View
          style={{
            width: '100%',
            backgroundColor: tokens.colors.darkGray2,
            borderWidth: 1,
            borderColor: tokens.colors.borderSubtle,
            borderRadius: tokens.borderRadius.r16,
            paddingVertical: tokens.spacing.s,
            paddingHorizontal: tokens.spacing.m,
          }}>
          <View
            style={{
              width: '100%',
              aspectRatio: 960 / 500,
              borderRadius: tokens.borderRadius.r16,
              backgroundColor: tokens.colors.darkGray3,
            }}
          />
          <View style={{flexDirection: 'row', width: '100%', marginTop: tokens.spacing.s}}>
            {HEADLINE_STATS.map((stat) => (
              <View
                key={stat.key}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: tokens.spacing.xs,
                }}>
                <Text
                  style={{
                    color: tokens.colors.textPrimary,
                    fontSize: tokens.typography.fontSize.xl,
                    fontWeight: tokens.typography.fontWeight.bold,
                  }}>
                  0
                </Text>
                <Text
                  style={{
                    color: tokens.colors.textSecondary,
                    fontSize: tokens.typography.fontSize.xs,
                    fontWeight: tokens.typography.fontWeight.semibold,
                  }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
          <View
            style={{
              gap: tokens.spacing.s,
              marginTop: tokens.spacing.s,
              padding: tokens.spacing.m,
              borderRadius: tokens.borderRadius.r16,
              backgroundColor: tokens.colors.darkGray3,
              borderWidth: 1,
              borderColor: tokens.colors.borderSubtle,
            }}>
            {CATEGORY_LABELS.map((label, index) => (
              <View
                key={label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: tokens.spacing.s,
                  }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        CATEGORY_DOT_COLORS[index] ?? tokens.colors.primary,
                    }}
                  />
                  <Text
                    style={{
                      color: tokens.colors.textPrimary,
                      fontSize: tokens.typography.fontSize.s,
                      fontWeight: tokens.typography.fontWeight.semibold,
                    }}>
                    {label}
                  </Text>
                </View>
                <Text
                  style={{
                    color: tokens.colors.textPrimary,
                    fontSize: tokens.typography.fontSize.s,
                    fontWeight: tokens.typography.fontWeight.bold,
                  }}>
                  0
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={{width: '100%', alignItems: 'center'}}>
        <OnboardingPrimaryButton onPress={() => setSheetOpen(true)}>
          Connect Photos
        </OnboardingPrimaryButton>
        <OnboardingSkipButton
          onPress={handleSkip}
          testID="photos-skip-button"
          accessibilityLabel="Skip connecting Photos for now"
        />
      </View>
      {sheetOpen ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: tokens.colors.overlay70,
            justifyContent: 'flex-end',
          }}>
          <View
            style={{
              backgroundColor: tokens.colors.darkGray2,
              borderTopLeftRadius: tokens.borderRadius.r28,
              borderTopRightRadius: tokens.borderRadius.r28,
              paddingHorizontal: tokens.spacing.m,
              paddingBottom: tokens.spacing.l,
              gap: tokens.spacing.s,
            }}>
            <SheetGrabber />
            <SheetHeader title="Share your photos" />
            <OnboardingSubtitle>
              Pack finds the trips, landmarks, and restaurants hiding in your
              library.
            </OnboardingSubtitle>
            <View
              style={{
                padding: tokens.spacing.m,
                borderRadius: tokens.borderRadius.r16,
                backgroundColor: tokens.colors.darkGray3,
                borderWidth: 1,
                borderColor: tokens.colors.borderSubtle,
              }}>
              <Text
                style={{
                  color: tokens.colors.textPrimary,
                  fontSize: tokens.typography.fontSize.m15,
                  fontWeight: tokens.typography.fontWeight.bold,
                }}>
                Private by default
              </Text>
              <Text
                style={{
                  color: tokens.colors.textSecondary,
                  fontSize: tokens.typography.fontSize.xs,
                }}>
                Only photo metadata — times, dates, places — is shared with us.{' '}
                <Text
                  style={{
                    color: tokens.colors.textPrimary,
                    fontWeight: tokens.typography.fontWeight.bold,
                  }}>
                  Never your photos.
                </Text>
              </Text>
            </View>
            <OnboardingPrimaryButton onPress={handleSharePhotos}>
              Share Photos
            </OnboardingPrimaryButton>
          </View>
        </View>
      ) : null}
    </OnboardingContent>
  );
}
