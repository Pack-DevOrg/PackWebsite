import type {ComponentType, FC, ReactNode} from 'react';

declare module 'expo-linear-gradient' {
  export const LinearGradient: ComponentType<{
    colors: readonly string[];
    start?: {x: number; y: number};
    end?: {x: number; y: number};
    style?: unknown;
    children?: ReactNode;
  }>;
}

declare module 'react-native-safe-area-context' {
  export const SafeAreaProvider: ComponentType<{
    children?: ReactNode;
    initialMetrics?: unknown;
  }>;
  export const SafeAreaView: ComponentType<{
    children?: ReactNode;
    style?: unknown;
  }>;
}

declare module 'react-native-svg' {
  export const Svg: ComponentType<{
    children?: ReactNode;
    width?: number;
    height?: number;
    viewBox?: string;
    fill?: string;
    style?: unknown;
  }>;
  export const Path: ComponentType<{d?: string; fill?: string}>;
  export const Rect: ComponentType<Record<string, unknown>>;
  export const G: ComponentType<{children?: ReactNode}>;
}

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
