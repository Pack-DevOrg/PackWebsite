import 'styled-components';
import { colors, spacing, typography } from './styles/theme';

// Combine them into a single theme type matching appTheme in main.tsx.
export interface AppTheme {
  readonly colors: typeof colors;
  readonly spacing: typeof spacing;
  readonly typography: typeof typography;
}

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
