import React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import theme from './theme';

// Type declaration for theme to ensure type safety when accessing theme properties
declare module 'styled-components' {
  type Theme = typeof theme;
  export interface DefaultTheme extends Theme {}
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider component that wraps the application to provide theme context
 * to all styled-components
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <StyledThemeProvider theme={theme}>
      {children}
    </StyledThemeProvider>
  );
};

export default ThemeProvider;
