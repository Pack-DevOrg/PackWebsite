import React from 'react';
import styled from 'styled-components';

import {
  PrimaryButton,
  SheetCard,
  StepBody,
  StepTitle,
  onboardTokens,
} from './OnboardPrimitives';

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
  onboardTokens.primary,
  onboardTokens.textSecondary,
  onboardTokens.textPrimary,
  onboardTokens.borderMedium,
  onboardTokens.darkGray3,
  onboardTokens.textSecondary,
  onboardTokens.primary,
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

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.m}px;
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  padding: ${onboardTokens.spacing.l}px ${onboardTokens.spacing.m}px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.s}px;
  text-align: center;
  width: 100%;
`;

const Headline = styled(StepTitle)`
  font-size: 36px;
  line-height: 42px;
  font-weight: ${onboardTokens.fontWeight.bold};
  text-align: center;
`;

const Accent = styled.span`
  color: ${onboardTokens.primary};
`;

const Subtitle = styled(StepBody)`
  text-align: center;
`;

const PassportCard = styled.div`
  width: 100%;
  background: ${onboardTokens.darkGray2};
  border: 1px solid ${onboardTokens.borderSubtle};
  border-radius: ${onboardTokens.borderRadius.r16}px;
  padding: ${onboardTokens.spacing.s}px ${onboardTokens.spacing.m}px;
`;

const MapPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 960 / 500;
  border-radius: ${onboardTokens.borderRadius.r16}px;
  background: ${onboardTokens.darkGray3};
`;

const MetricsRow = styled.div`
  display: flex;
  width: 100%;
  margin-top: ${onboardTokens.spacing.s}px;
`;

const Metric = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: ${onboardTokens.spacing.xs}px;
`;

const MetricValue = styled.span`
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.xl}px;
  font-weight: ${onboardTokens.fontWeight.bold};
`;

const MetricLabel = styled.span`
  color: ${onboardTokens.textSecondary};
  font-size: ${onboardTokens.fontSize.xs}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${onboardTokens.spacing.s}px;
  margin-top: ${onboardTokens.spacing.s}px;
  padding: ${onboardTokens.spacing.m}px;
  border-radius: ${onboardTokens.borderRadius.r16}px;
  background: ${onboardTokens.darkGray3};
  border: 1px solid ${onboardTokens.borderSubtle};
`;

const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${onboardTokens.spacing.m}px;
`;

const CategoryLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${onboardTokens.spacing.s}px;
  min-width: 156px;
`;

const CategoryDot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: ${(props) => props.$color};
`;

const CategoryLabel = styled.span`
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.s}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
`;

const CategoryValue = styled.span`
  min-width: 24px;
  text-align: right;
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.s}px;
  font-weight: ${onboardTokens.fontWeight.bold};
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${onboardTokens.spacing.s}px;
  width: 100%;
`;

const SkipButton = styled.button`
  cursor: pointer;
  padding: ${onboardTokens.spacing.s}px ${onboardTokens.spacing.m}px;
  min-height: 32px;
  border-radius: ${onboardTokens.borderRadius.l}px;
  background: ${onboardTokens.darkGray3};
  border: 1px solid ${onboardTokens.borderMedium};
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.m15}px;
  font-weight: ${onboardTokens.fontWeight.semibold};
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: ${onboardTokens.overlay70};
`;

const Sheet = styled(SheetCard)`
  width: 100%;
  max-width: 460px;
  padding: ${onboardTokens.spacing.s}px ${onboardTokens.spacing.m}px
    ${onboardTokens.spacing.l}px;
  display: flex;
  flex-direction: column;
  gap: ${onboardTokens.spacing.s}px;
`;

const SheetHeadline = styled(StepTitle)`
  font-size: ${onboardTokens.fontSize.xl}px;
  font-weight: ${onboardTokens.fontWeight.bold};
  text-align: center;
`;

const SheetCopy = styled(StepBody)`
  text-align: center;
`;

const PrivacyCard = styled.div`
  width: 100%;
  margin-top: ${onboardTokens.spacing.m}px;
  padding: ${onboardTokens.spacing.m}px;
  border-radius: ${onboardTokens.borderRadius.r16}px;
  background: ${onboardTokens.darkGray3};
  border: 1px solid ${onboardTokens.borderSubtle};
`;

const PrivacyTitle = styled.p`
  margin: 0 0 ${onboardTokens.spacing.xs}px;
  color: ${onboardTokens.textPrimary};
  font-size: ${onboardTokens.fontSize.m15}px;
  font-weight: ${onboardTokens.fontWeight.bold};
  text-align: left;
`;

const PrivacyBody = styled.p`
  margin: 0;
  color: ${onboardTokens.textSecondary};
  font-size: ${onboardTokens.fontSize.xs}px;
  text-align: left;
`;

const PrivacyStrong = styled.span`
  color: ${onboardTokens.textPrimary};
  font-weight: ${onboardTokens.fontWeight.bold};
`;

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
    <Root>
      <Header>
        <Headline>
          Let&apos;s see the <Accent>places</Accent> you&apos;ve been
        </Headline>
        <Subtitle>
          Pack matches photos to find things you&apos;ve visited.
        </Subtitle>
      </Header>

      <PassportCard>
        <MapPlaceholder />
        <MetricsRow>
          {HEADLINE_STATS.map((stat) => (
            <Metric key={stat.key}>
              <MetricValue>0</MetricValue>
              <MetricLabel>{stat.label}</MetricLabel>
            </Metric>
          ))}
        </MetricsRow>
        <CategoryList>
          {CATEGORY_LABELS.map((label, index) => (
            <CategoryRow key={label}>
              <CategoryLeft>
                <CategoryDot $color={CATEGORY_DOT_COLORS[index] ?? onboardTokens.primary} />
                <CategoryLabel>{label}</CategoryLabel>
              </CategoryLeft>
              <CategoryValue>0</CategoryValue>
            </CategoryRow>
          ))}
        </CategoryList>
      </PassportCard>

      <Actions>
        <PrimaryButton type="button" onClick={() => setSheetOpen(true)}>
          Connect Photos
        </PrimaryButton>
        <SkipButton
          type="button"
          onClick={handleSkip}
          aria-label="Skip connecting Photos for now">
          Skip for now
        </SkipButton>
      </Actions>

      {sheetOpen ? (
        <Overlay>
          <Sheet>
            <SheetHeadline>Share your photos</SheetHeadline>
            <SheetCopy>
              Pack finds the trips, landmarks, and restaurants hiding in your
              library.
            </SheetCopy>
            <PrivacyCard>
              <PrivacyTitle>Private by default</PrivacyTitle>
              <PrivacyBody>
                Only photo metadata — times, dates, places — is shared with us.{' '}
                <PrivacyStrong>Never your photos.</PrivacyStrong>
              </PrivacyBody>
            </PrivacyCard>
            <PrimaryButton type="button" onClick={handleSharePhotos}>
              Share Photos
            </PrimaryButton>
          </Sheet>
        </Overlay>
      ) : null}
    </Root>
  );
}
