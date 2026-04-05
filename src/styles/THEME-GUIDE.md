# Pack Website Theme Guide

This guide explains how to use the global theme system to maintain consistent colors, typography, and branding across the website.

## Overview

The theme system centralizes all design tokens and brand identity elements in a single location, making it easy to maintain a cohesive look and feel throughout the website by modifying one file.

## Theme Structure

The theme is organized into comprehensive categories:

- **colors**: All color definitions

  - primary: Main brand colors
  - success: Positive action colors
  - error: Error and warning colors
  - background: Background colors for different UI elements
  - text: Text colors with varying emphasis
  - border: Border colors with different opacities
  - shadow: Shadow colors with opacity values
  - gradients: Predefined gradient combinations
  - accent: Additional accent colors

- **spacing**: Consistent spacing values

- **typography**: Comprehensive typography system

  - fontFamily: Font stacks for different content types
  - fontSizes: Complete range of font sizes with pixel equivalents
  - fontWeights: Full range of font weights from thin to black
  - lineHeights: Various line heights for different contexts
  - letterSpacing: Text tracking options
  - textTransform: Capitalization settings
  - textDecoration: Underline and strikethrough settings
  - paragraphSpacing: Consistent paragraph spacing options
  - styles: Predefined typography styles for common elements (h1-h4, body, etc.)

- **design**: UI design tokens

  - borderRadius: Range of border radius values from none to pill
  - maxWidth: Maximum content width
  - transition: Animation timing presets
  - boxShadow: Elevation system with consistent shadows
  - zIndex: Z-axis stacking hierarchy

- **brand**: Brand identity and guidelines
  - name and tagline: Official brand text
  - logo: Logo specifications and paths
  - social: Social media information
  - animation: Motion design presets
  - breakpoints: Responsive design breakpoints

## How to Use the Theme

### 1. In styled-components

```tsx
import styled from "styled-components";

// Access theme values in styled-components
const MyComponent = styled.div`
  background-color: ${(props) => props.theme.colors.background.primary};
  color: ${(props) => props.theme.colors.text.primary};
  padding: ${(props) => props.theme.spacing[3]};
  border-radius: ${(props) => props.theme.design.borderRadius.default};
  font-family: ${(props) => props.theme.typography.fontFamily.primary};
  font-size: ${(props) => props.theme.typography.fontSizes.base};
  font-weight: ${(props) => props.theme.typography.fontWeights.medium};
  line-height: ${(props) => props.theme.typography.lineHeights.normal};
  letter-spacing: ${(props) => props.theme.typography.letterSpacing.normal};

  // Using gradients
  background: ${(props) => props.theme.colors.gradients.primaryButton};

  // Transitions
  transition: all ${(props) => props.theme.design.transition.default};

  // Box shadows for elevation
  box-shadow: ${(props) => props.theme.design.boxShadow.md};

  // Responsive design with breakpoints
  @media (min-width: ${(props) => props.theme.brand.breakpoints.md}) {
    font-size: ${(props) => props.theme.typography.fontSizes.lg};
  }
`;
```

### 2. Using CSS Variables (Backwards Compatibility)

The existing CSS variables still work to maintain compatibility with the current codebase.

```tsx
const LegacyComponent = styled.div`
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: var(--space-3);
`;
```

## Updating the Theme

To change the colors or other theme values, edit the `src/styles/theme.ts` file.

### Example: Changing the Primary Color

```ts
// In src/styles/theme.ts
export const colors = {
  primary: {
    main: "#FF0000", // Change from #f92f60 to red
    light: "#FF6666", // Adjust light variant
    dark: "#CC0000", // Adjust dark variant
    gradient: "linear-gradient(90deg, #FF0000, #FF6666)",
  },
  // ...other colors
};
```

## Implementation Steps

To fully implement this theming system across your app:

1. Wrap your app with the ThemeProvider in your main App.tsx file
2. Gradually refactor components to use the theme object instead of direct color references
3. For new components, use the theme object exclusively

## Theme Provider Setup

The theme provider is already set up, but needs to be added to your main App.tsx file:

```tsx
import { ThemeProvider } from "./styles/ThemeProvider";

function App() {
  return <ThemeProvider>{/* Your app components */}</ThemeProvider>;
}
```

## Example Component Refactoring

### Before:

```tsx
const Button = styled.button`
  background: linear-gradient(90deg, var(--color-accent), #ff7676);
  color: white;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  letter-spacing: 0.03em;
`;
```

### After:

```tsx
const Button = styled.button`
  background: ${(props) => props.theme.colors.gradients.primaryButton};
  color: ${(props) => props.theme.colors.text.white};
  border-radius: ${(props) => props.theme.design.borderRadius.default};
  font-family: ${(props) => props.theme.typography.fontFamily.primary};
  font-size: ${(props) => props.theme.typography.fontSizes.base};
  font-weight: ${(props) => props.theme.typography.fontWeights.semibold};
  letter-spacing: ${(props) => props.theme.typography.letterSpacing.wide};
  transition: all ${(props) => props.theme.design.transition.default};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.design.boxShadow.md};
  }
`;
```

## Using Brand Information

Access brand-specific values for consistent messaging:

```tsx
import React from "react";
import { useTheme } from "styled-components";

const BrandedFooter = () => {
  const theme = useTheme();

  return (
    <footer>
      <h3>{theme.brand.name}</h3>
      <p>{theme.brand.tagline}</p>
      <a href={theme.brand.social.twitter}>Follow us on Twitter</a>
    </footer>
  );
};
```

## Benefits

1. **Brand Consistency**: All brand elements come from a single source of truth
2. **Comprehensive Typography**: Complete typography system ensures text consistency
3. **Theme Switching**: Makes it easier to implement dark/light modes
4. **Responsive Design**: Built-in breakpoints for consistent responsive behavior
5. **Animation Standards**: Predefined animation timings and easing for consistent motion
6. **TypeScript Support**: Full type checking when accessing theme values
7. **Documentation**: All design tokens are named and organized logically
