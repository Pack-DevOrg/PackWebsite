# PackWebsite - Marketing and Waitlist Platform

> **React-based marketing website and waitlist platform for Pack**

## Overview

PackWebsite is a modern, responsive marketing website built with React and TypeScript that serves as the primary landing page for Pack. It features an interactive waitlist form, comprehensive privacy policy integration, and smooth animations to create an engaging user experience for potential users.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git for version control
- Modern web browser for testing

### Development Setup

```bash
# Clone repository and navigate to website directory
cd PackWebsite

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## 🏗️ Architecture

### Technology Stack

| Category       | Technology          | Purpose                               |
| -------------- | ------------------- | ------------------------------------- |
| **Framework**  | React 18            | Component-based UI development        |
| **Language**   | TypeScript          | Type-safe development                 |
| **Build Tool** | Vite                | Fast development and optimized builds |
| **Styling**    | Styled Components   | CSS-in-JS with theme support          |
| **Animations** | Framer Motion       | Smooth animations and transitions     |
| **Routing**    | React Router        | Client-side navigation                |
| **Icons**      | Lucide React        | Consistent icon library               |
| **Security**   | Google reCAPTCHA v3 | Bot protection                        |
| **Hosting**    | GitHub Pages        | Static site hosting                   |

### Design System

The website implements a comprehensive design system with:

- **Theme Architecture**: Centralized color palette, typography, and spacing
- **Responsive Design**: Mobile-first approach with breakpoint system
- **Animation System**: Consistent motion design with Framer Motion
- **Component Library**: Reusable UI components with props interfaces

## 🎯 Key Features

### 🎨 Modern Design

- **Responsive Layout**: Optimized for all device sizes
- **Smooth Animations**: Framer Motion-powered transitions
- **Theme Integration**: Consistent design tokens and styling
- **Accessibility**: WCAG compliant interface elements

### 📝 Waitlist Management

- **Interactive Form**: Real-time validation and feedback
- **Bot Protection**: Google reCAPTCHA v3 integration
- **Error Handling**: Comprehensive validation and user feedback
- **Privacy Compliance**: GDPR-compliant consent mechanisms

### 🔒 Security and Privacy

- **Data Protection**: Secure form submission with validation
- **Privacy Policy**: Comprehensive privacy policy integration
- **Terms of Service**: Clear terms and conditions
- **Consent Management**: User-controlled data collection

### ⚡ Performance

- **Fast Loading**: Vite-optimized build process
- **Code Splitting**: Efficient bundle splitting
- **Asset Optimization**: Compressed images and fonts
- **Caching Strategy**: Optimized for CDN delivery

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Footer.tsx      # Site footer with links
│   ├── Header.tsx      # Site navigation header
│   ├── Hero.tsx        # Landing page hero section
│   ├── Layout.tsx      # Page layout wrapper
│   ├── ValueProp.tsx   # Value proposition section
│   └── WaitlistForm.tsx # Interactive waitlist form
├── pages/               # Page components
│   ├── PrivacyPolicy.tsx          # Privacy policy page
│   ├── TermsOfService.tsx         # Terms of service page
│   ├── VerifiedPage.tsx           # Email verification success
│   └── VerificationFailedPage.tsx # Email verification failure
├── styles/              # Styling and theme
│   ├── GlobalStyles.ts  # Global CSS styles
│   ├── ThemeProvider.tsx # Theme context provider
│   ├── theme.ts         # Design system tokens
│   └── THEME-GUIDE.md   # Theme usage documentation
├── types/               # TypeScript type definitions
│   └── recaptcha.d.ts   # reCAPTCHA type declarations
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## 🧩 Component Architecture

### Core Components

#### Layout Components

- **Layout**: Main page wrapper with header, content area, and footer
- **Header**: Navigation with responsive design and logo
- **Footer**: Links, social media, and legal information

#### Content Components

- **Hero**: Eye-catching landing section with call-to-action
- **ValueProp**: Value proposition with animated features
- **WaitlistForm**: Interactive form with validation and reCAPTCHA

#### Page Components

- **PrivacyPolicy**: Comprehensive privacy policy with markdown support
- **TermsOfService**: Terms and conditions page
- **VerifiedPage**: Email verification success confirmation
- **VerificationFailedPage**: Email verification error handling

### Component Props and Interfaces

```typescript
// Example component interface
interface WaitlistFormProps {
  onSubmit?: (email: string) => void;
  theme?: Theme;
}

// Form validation states
interface FormState {
  email: string;
  consent: boolean;
  errors: ValidationErrors;
  isLoading: boolean;
  isSubmitted: boolean;
}
```

## 🎨 Design System

### Theme Structure (`src/styles/theme.ts`)

The design system includes comprehensive tokens for:

```typescript
interface Theme {
  colors: {
    primary: ColorScale; // Brand primary colors
    secondary: ColorScale; // Brand secondary colors
    background: BackgroundColors; // Surface colors
    text: TextColors; // Typography colors
    border: BorderColors; // Border and divider colors
    error: ColorScale; // Error state colors
    success: ColorScale; // Success state colors
    gradients: GradientColors; // Brand gradients
  };
  typography: TypographySystem;
  spacing: SpacingScale;
  breakpoints: BreakpointSystem;
}
```

### Animation System

Consistent animation patterns using Framer Motion:

```typescript
// Example animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};
```

## 🌐 API Integration

### Waitlist API

The waitlist form integrates with the PackServer backend:

```typescript
// API endpoint configuration
const API_CONFIG = {
  endpoint: import.meta.env.VITE_API_ENDPOINT,
  timeout: 10000,
  retries: 3,
};

// Form submission flow
const submitWaitlist = async (formData: WaitlistData) => {
  // 1. Validate form data
  // 2. Execute reCAPTCHA challenge
  // 3. Submit to backend API
  // 4. Handle response and update UI
};
```

### reCAPTCHA Integration

Google reCAPTCHA v3 provides invisible bot protection:

```typescript
// reCAPTCHA configuration
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}
```

## 🚀 Deployment

### GitHub Pages Deployment

Automated deployment via GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install and Build
        run: |
          npm install
          npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
```

### Environment Configuration

Environment variables for different deployment stages:

```bash
# Development
VITE_API_ENDPOINT=http://localhost:3000/api
VITE_RECAPTCHA_SITE_KEY=development_key

# Production
VITE_API_ENDPOINT=https://api.itsdoneai.com
VITE_RECAPTCHA_SITE_KEY=production_key
```

### Custom Domain Setup

Configure custom domain with GitHub Pages:

1. **DNS Configuration**:

   ```
   A    @    185.199.108.153
   A    @    185.199.109.153
   A    @    185.199.110.153
   A    @    185.199.111.153
   CNAME www  username.github.io
   ```

2. **Repository Settings**:
   - Enable GitHub Pages
   - Set custom domain: `itsdoneai.com`
   - Enforce HTTPS

## 🧪 Testing Strategy

### Component Testing

```bash
# Run component tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Manual Testing Checklist

- [ ] Form validation (email format, required fields)
- [ ] reCAPTCHA functionality
- [ ] Responsive design across devices
- [ ] Animation performance
- [ ] Privacy policy links
- [ ] Error handling scenarios

## 🔒 Security and Privacy

### Data Protection

- **Form Validation**: Client-side and server-side validation
- **Bot Protection**: reCAPTCHA v3 integration
- **HTTPS Enforcement**: Secure data transmission
- **Privacy Compliance**: GDPR-compliant data handling

### Privacy Implementation

- **Consent Management**: User-controlled data collection
- **Policy Integration**: Accessible privacy policy and terms
- **Data Minimization**: Only collect necessary information
- **Transparency**: Clear data usage explanations

## 📊 Performance Optimization

### Build Optimization

- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Efficient bundle organization
- **Asset Compression**: Optimized images and fonts
- **Caching Strategy**: Browser and CDN caching

### Runtime Performance

- **Lazy Loading**: Component and route-based splitting
- **Memoization**: React.memo for expensive components
- **Animation Optimization**: Hardware-accelerated animations
- **Bundle Analysis**: Regular size monitoring

## 📚 Documentation

### Component Documentation

- [Theme Guide](src/styles/THEME-GUIDE.md) - Design system usage
- [Contents Mapping](CONTENTS.md) - Complete file reference

### Development Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Styled Components](https://styled-components.com/)
- [Framer Motion](https://www.framer.com/motion/)

## 🤝 Contributing

### Development Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automated code formatting
- **Component Documentation**: JSDoc comments for all components

### Component Guidelines

- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow design system patterns
- Include accessibility attributes
- Write comprehensive component documentation

---

## 🔗 Related Projects

- [PackApp](../PackApp/README.md) - React Native mobile application
- [PackServer](../PackServer/README.md) - Serverless backend infrastructure

---

_Built with 🎨 modern web technologies for performance and user experience_
