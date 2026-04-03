import 'styled-components';
import { colors, spacing, typography } from './styles/theme';

// Combine them into a single theme type matching appTheme in main.tsx
const appThemeForTyping = {
  colors,
  spacing,
  typography,
};

export type AppTheme = typeof appThemeForTyping;

declare module 'styled-components' {
   
  export interface DefaultTheme extends AppTheme {}
}
