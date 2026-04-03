/**
 * @file theme.ts
 * @description Global theme configuration for the DoneAI website.
 * This file centralizes all design tokens, including colors, spacing, typography, and other design-related variables,
 * to ensure consistent styling across the application and simplify site-wide styling changes.
 */

/**
 * @constant colors
 * @description Defines the color palette for the DoneAI website.
 * Includes primary, secondary, success, error, background, text, and border colors,
 * as well as shadow and gradient definitions.
 */
export const colors = {
  primary: {
    main: "#f3d27a",
    light: "#f8e6b3",
    dark: "#c5a04a",
    gradient: "linear-gradient(135deg, #f3d27a 0%, #f8e6b3 100%)",
  },
  secondary: {
    main: "#e72340",
    light: "#ff7676",
    dark: "#c61c36",
    gradient: "linear-gradient(135deg, #e72340 0%, #ff7676 100%)",
  },
  success: {
    main: "#65b89f",
    light: "#8BC34A",
    dark: "#4CAF50",
    gradient: "linear-gradient(135deg, #4CAF50, #8BC34A)",
  },
  error: {
    main: "#ef4444", // Same as --color-error
    light: "#ff6b6b",
    dark: "#c62828",
  },
  background: {
    primary: "#0f0d0b",
    secondary: "#171310",
    tertiary: "#211b16",
    card: "rgba(255, 248, 236, 0.05)",
    cardElevated: "rgba(255, 248, 236, 0.08)",
    input: "rgba(255, 248, 236, 0.08)",
    inputFocus: "rgba(255, 248, 236, 0.12)",
  },
  text: {
    primary: "#f7f0e3",
    secondary: "rgba(247, 240, 227, 0.72)",
    tertiary: "rgba(247, 240, 227, 0.52)",
    placeholder: "rgba(247, 240, 227, 0.38)",
    white: "#ffffff",
  },
  border: {
    light: "rgba(243, 210, 122, 0.12)",
    medium: "rgba(243, 210, 122, 0.2)",
    strong: "rgba(243, 210, 122, 0.34)",
    input: "rgba(247, 240, 227, 0.16)",
  },
  shadow: {
    light: "rgba(0, 0, 0, 0.14)",
    medium: "0 20px 60px rgba(0, 0, 0, 0.28)",
    dark: "0 30px 90px rgba(0, 0, 0, 0.38)",
    darker: "rgba(0, 0, 0, 0.5)",
    primary: "rgba(243, 210, 122, 0.24)",
    primaryHover: "rgba(243, 210, 122, 0.34)",
    primaryActive: "rgba(243, 210, 122, 0.28)",
    success: "rgba(101, 184, 159, 0.3)",
  },
  gradients: {
    primaryAccent: "linear-gradient(135deg, #f3d27a 0%, #e72340 58%, #f8e6b3 100%)",
    primaryButton: "linear-gradient(135deg, #f3d27a 0%, #ebbe58 100%)",
    formHeader: "linear-gradient(90deg, #f3d27a, #e72340, #f7f0e3)",
    shimmer:
      "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
    textLight: "linear-gradient(90deg, #fff7e7, #d3c4aa)",
  },
  accent: {
    gold: "#f3d27a",
    sand: "#d6c1a0",
    clay: "#e72340",
    darkGray: "#171310",
  },
};

// Spacing system - matches existing CSS variables
export const spacing = {
  1: "0.25rem",
  2: "0.5rem",
  3: "1rem",
  4: "1.5rem",
  5: "2.5rem",
  6: "3.5rem",
  7: "5rem",
};

// Typography system - comprehensive font settings for global branding
export const typography = {
  // Font families
  fontFamily: {
    primary:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    heading:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    code: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
  },

  // Font sizes
  fontSizes: {
    xs: "0.75rem", // 12px
    small: "0.875rem", // 14px
    base: "1rem", // 16px
    medium: "1.125rem", // 18px
    large: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
    "6xl": "3.75rem", // 60px
  },

  // Font weights
  fontWeights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line heights
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },

  // Text transform
  textTransform: {
    uppercase: "uppercase",
    lowercase: "lowercase",
    capitalize: "capitalize",
    normalCase: "none",
  },

  // Text decoration
  textDecoration: {
    underline: "underline",
    lineThrough: "line-through",
    noUnderline: "none",
  },

  // Paragraph spacing
  paragraphSpacing: {
    small: "0.75em",
    medium: "1em",
    large: "1.5em",
  },

  // Styles for specific elements
  styles: {
    h1: {
      fontSize: "1.875rem",
      lineHeight: 1.3,
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "1.5rem",
      lineHeight: 1.4,
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "1.25rem",
      lineHeight: 1.4,
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.125rem",
      lineHeight: 1.4,
      fontWeight: 600,
    },
    body: {
      fontSize: "1rem",
      lineHeight: 1.6,
      fontWeight: 400,
    },
    caption: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      fontWeight: 400,
    },
    button: {
      fontSize: "1rem",
      lineHeight: 1.4,
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
  },
};

// Other design tokens
export const design = {
  borderRadius: {
    none: "0",
    small: "0.125rem", // 2px
    default: "0.375rem", // 6px
    medium: "0.5rem", // 8px
    large: "1rem", // 16px
    xl: "1.5rem", // 24px
    xxl: "2rem",
    full: "9999px", // Circle/pill
  },
  maxWidth: "1200px",
  transition: {
    default: "0.3s ease",
    fast: "0.15s ease",
    slow: "0.5s ease",
    bounce: "0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
  },
  boxShadow: {
    none: "none",
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    default: "0 4px 6px rgba(0, 0, 0, 0.1)",
    md: "0 4px 10px rgba(0, 0, 0, 0.15)",
    lg: "0 10px 20px rgba(0, 0, 0, 0.2)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  zIndex: {
    hide: -1,
    base: 0,
    raised: 1,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },
};

// Brand-specific values and information
export const brand = {
  name: "Pack",
  tagline: "Your AI travel assistant",
  logo: {
    primary: "/assets/logo.svg",
    favicon: "/favicon.png",
    minWidth: "48px",
    minHeight: "48px",
  },
  social: {
    twitter:
      "https://twitter.com/intent/tweet?text=I%20just%20joined%20the%20waitlist%20for%20Route%20%40itsdoneai",
    domain: "itsdoneai.com",
  },
  // Animation and motion preferences
  animation: {
    default: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
    entrance: {
      duration: 0.5,
      ease: [0, 0, 0.2, 1],
    },
    exit: {
      duration: 0.4,
      ease: [0.4, 0, 1, 1],
    },
    bounce: {
      duration: 0.6,
      ease: [0.68, -0.55, 0.27, 1.55],
    },
  },
  // Media query breakpoints
  breakpoints: {
    xs: "480px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    xxl: "1536px",
  },
};

// Export default theme object with all tokens
const theme = {
  colors,
  spacing,
  typography,
  design,
  brand,
};

export default theme;
