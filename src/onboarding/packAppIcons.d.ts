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
