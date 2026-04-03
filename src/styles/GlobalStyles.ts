import { createGlobalStyle } from 'styled-components';

/**
 * @component GlobalStyles
 * @description Defines global CSS styles for the DoneAI website using `styled-components`.
 * This component sets up CSS variables for colors, spacing, typography, and layout,
 * and applies a global reset for consistent styling across browsers.
 *
 * @returns {React.ComponentType} A styled-components `GlobalStyle` component.
 *
 * @cssResetChoices
 * - `box-sizing: border-box;`: Ensures consistent box model behavior.
 * - `margin: 0; padding: 0;`: Resets default margins and paddings on all elements.
 * - `html, body`: Sets base font, line height, and background/text colors.
 * - Headings (`h1`-`h6`): Defines font weights, line heights, and default margins.
 * - Links (`a`): Sets accent color, removes text decoration, and adds a hover transition.
 * - Buttons (`button`): Resets default button styles.
 * - `prefers-reduced-motion`: Provides an accessibility feature to disable animations for users
 *   who prefer reduced motion.
 *
 * @accessibilityFeatures
 * - `prefers-reduced-motion` media query: Respects user preferences for reduced motion,
 *   enhancing accessibility for those sensitive to animations.
 * - Semantic HTML elements (e.g., `h1`, `p`, `a`, `button`) are encouraged by the base styles.
 * - `font-family`: Uses a system font stack (`-apple-system`, `BlinkMacSystemFont`, etc.)
 *   for better native feel and readability across different operating systems.
 */
const GlobalStyles = createGlobalStyle`
  :root {
    --color-accent: #f3d27a;
    --color-accent-soft: rgba(243, 210, 122, 0.18);
    --color-secondary-accent: #e72340;
    --color-text-primary: #f7f0e3;
    --color-text-secondary: rgba(247, 240, 227, 0.72);
    --color-text-muted: rgba(247, 240, 227, 0.5);
    --color-bg-primary: #0f0d0b;
    --color-bg-secondary: #171310;
    --color-bg-tertiary: #211b16;
    --color-surface: rgba(255, 248, 236, 0.05);
    --color-surface-strong: rgba(255, 248, 236, 0.08);
    --color-success: #65b89f;
    --color-error: #ef4444;
    --color-border: rgba(243, 210, 122, 0.14);
    --color-border-medium: rgba(243, 210, 122, 0.2);
    --color-border-strong: rgba(243, 210, 122, 0.34);
    --page-gradient:
      radial-gradient(circle at 10% 10%, rgba(231, 35, 64, 0.18), transparent 26%),
      radial-gradient(circle at 85% 12%, rgba(243, 210, 122, 0.16), transparent 22%),
      radial-gradient(circle at 50% 100%, rgba(243, 210, 122, 0.09), transparent 28%),
      linear-gradient(180deg, #0f0d0b 0%, #140f0c 46%, #0d0b09 100%);
    
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 1rem;
    --space-4: 1.5rem;
    --space-5: 2.5rem;
    --space-6: 3.5rem;
    --space-7: 5rem;
    --space-xs: 0.25rem;
    --space-s: 0.5rem;
    --space-m: 1rem;
    --space-l: 1.5rem;
    --space-xl: 2.5rem;
    
    --font-size-xs: 0.75rem;
    --font-size-small: 0.875rem;
    --font-size-base: 1rem;
    --font-size-medium: 1.125rem;
    --font-size-large: 1.25rem;
    --font-size-xl: 1.5rem;
    --font-size-2xl: 1.875rem;
    --font-size-3xl: 2.25rem;
    --font-heading: 'Inter Variable', 'Inter', 'Segoe UI', sans-serif;
    --font-body: 'Inter Variable', 'Inter', 'Segoe UI', sans-serif;
    
    --max-width: 1240px;
    --border-radius: 1.25rem;
    --border-radius-m: 0.5rem;
    --border-radius-xl: 1.5rem;
    --shadow-elevated: 0 28px 80px rgba(0, 0, 0, 0.35);
    --shadow-soft: 0 12px 38px rgba(0, 0, 0, 0.18);
    
    --transition-default: 0.3s ease;
  }

  /* Screen-reader-only utility */
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  /* Skip link for keyboard users */
  .skip-link {
    position: absolute;
    left: var(--space-2);
    top: var(--space-2);
    z-index: 2000;
    padding: 0.75rem 1rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.92);
    border: 2px solid var(--color-accent);
    color: var(--color-text-primary);
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .skip-link:focus-visible {
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
    clip-path: none;
    white-space: normal;
    opacity: 1;
    pointer-events: auto;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    font-family: var(--font-body);
    line-height: 1.5;
    height: 100%;
    min-height: 100vh;
    scroll-behavior: smooth;
    background: var(--page-gradient);
    color: var(--color-text-primary);
    overflow-x: hidden;
  }
  
  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    font-weight: 700;
    line-height: 1;
    margin-bottom: var(--space-2);
    letter-spacing: -0.025em;
  }

  h1 {
    font-size: var(--font-size-3xl);
  }

  h2 {
    font-size: var(--font-size-2xl);
  }

  h3 {
    font-size: var(--font-size-xl);
  }

  p {
    margin-bottom: var(--space-2);
    color: var(--color-text-secondary);
  }

  a {
    color: var(--color-accent);
    text-decoration: none;
    transition: opacity var(--transition-default);
  }

  a:hover {
    opacity: 0.8;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255, 248, 236, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 248, 236, 0.04) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 78%);
    opacity: 0.16;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  input, button {
    font: inherit;
  }

  /* Ensure keyboard focus is always visible (WCAG 2.4.7 / 2.4.11) */
  :where(
    a,
    button,
    input,
    select,
    textarea,
    summary,
    [role='button'],
    [role='link'],
    [tabindex]:not([tabindex='-1'])
  ):focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 3px;
  }
  
  /* Media/sizing normalization to prevent baseline misalignment and overflow */
  img, svg {
    display: block;
    max-width: 100%;
    height: auto;
  }
  
  /* Reusable centered container utility */
  .container {
    width: 100%;
    max-width: var(--max-width);
    margin-inline: auto;
    padding-inline: 1rem;
  }
  
  @media (min-width: 768px) {
    .container {
      padding-inline: 1.5rem;
    }
  }
  
  /* Prefer small viewport units on modern mobile browsers for stable vertical sizing */
  @supports (min-height: 100svh) {
    html, body {
      min-height: 100svh;
    }
  }
  
  /* Debug: Prevent excessive content height */
  .voice-optimized-content,
  .conversational-ai-content,
  .semantic-search-content,
  .ai-training-content,
  .performance-optimization-content {
    display: none !important;
    position: absolute !important;
    left: -10000px !important;
    top: -10000px !important;
    width: 1px !important;
    height: 1px !important;
    overflow: hidden !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    z-index: -999 !important;
  }
  
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default GlobalStyles;
