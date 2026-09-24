import type {FC} from 'react';

type AppIconProps = {
  size?: number;
  color?: string;
  style?: unknown;
};

declare module 'pack-app/icons/svg/GoogleOutlineIcon' {
  export const GoogleOutlineIcon: FC<AppIconProps>;
}

declare module 'pack-app/icons/svg/AppleOutlineIcon' {
  export const AppleOutlineIcon: FC<AppIconProps>;
}

declare module 'pack-app/icons/svg/MicrosoftIcon' {
  export const MicrosoftIcon: FC<AppIconProps>;
}

declare module 'pack-app/components/onboarding/OnboardingComponents' {
  import type {ReactNode} from 'react';

  type AppOnboardingProps = {
    readonly children?: ReactNode;
    readonly currentStep?: number;
    readonly totalSteps?: number;
    readonly onBack?: () => void;
    readonly showBack?: boolean;
    readonly centered?: boolean;
    readonly style?: unknown;
    readonly scrollEnabled?: boolean;
    readonly onPress?: () => void;
    readonly loading?: boolean;
    readonly disabled?: boolean;
    readonly showDisabledStyle?: boolean;
    readonly maxWidth?: number;
    readonly fullWidth?: boolean;
    readonly testID?: string;
  };

  export const ONBOARDING_CTA_MAX_WIDTH: number;
  export const OnboardingContainer: FC<AppOnboardingProps>;
  export const OnboardingContent: FC<AppOnboardingProps>;
  export const OnboardingHeader: FC<AppOnboardingProps>;
  export const OnboardingEyebrow: FC<AppOnboardingProps>;
  export const OnboardingPrimaryButton: FC<AppOnboardingProps>;
  export const OnboardingSecondaryButton: FC<AppOnboardingProps>;
  export const OnboardingSubtitle: FC<AppOnboardingProps>;
  export const OnboardingTitle: FC<AppOnboardingProps>;
}
