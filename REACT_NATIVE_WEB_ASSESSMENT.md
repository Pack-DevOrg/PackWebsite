# React Native Web Migration Assessment for PackApp

**Assessment Date:** 2025-11-05
**Mobile App Stack:** React Native 0.76.9 + Expo SDK 52
**Target Platform:** Web (React Native Web via Expo)

---

## Executive Summary

**Feasibility:** ✅ **HIGHLY FEASIBLE** with Expo SDK 52
**Difficulty:** ⚠️ **MEDIUM** (4-6 weeks)
**Code Reuse:** 🎯 **75-85%**
**Recommended Approach:** Expo Router for unified web/mobile codebase

### Key Finding
Since you're using **Expo SDK 52**, React Native Web is **built-in and well-supported**. The biggest challenges will be:
1. Email parsing UI/UX differences (web vs mobile)
2. Google/Microsoft OAuth redirects (different flow on web)
3. Calendar integration (expo-calendar doesn't support web)
4. Offline storage differences (expo-file-system vs IndexedDB)

---

## Technology Stack Analysis

### ✅ Excellent Web Compatibility (90-100%)

| Technology | Version | Web Support | Notes |
|-----------|---------|-------------|-------|
| **Expo SDK** | 52 | ✅ Perfect | React Native Web built-in |
| **TypeScript** | Latest | ✅ Perfect | Works identically |
| **Zustand** | Latest | ✅ Perfect | Web-first state library |
| **TanStack Query** | Latest | ✅ Perfect | Originally built for React web |
| **AWS Cognito** | via Amplify | ✅ Excellent | Web SDK available |
| **Stripe** | Latest | ✅ Excellent | Better web support than mobile |
| **PostHog** | Latest | ✅ Perfect | Web-first analytics |
| **Jest** | Latest | ✅ Perfect | Universal testing framework |

### ⚠️ Good Web Compatibility (60-89%)

| Technology | Web Support | Migration Notes |
|-----------|-------------|-----------------|
| **Reanimated v3** | ⚠️ 70% | Web support exists but limited. Complex gestures may need fallbacks. |
| **AWS Amplify** | ⚠️ 85% | Core features work, but some mobile-specific APIs differ. |
| **Expo Router** | ⚠️ 90% | Web support excellent, but deep linking needs web URL structure. |

### ❌ Requires Platform-Specific Code (0-59%)

| Technology | Web Support | Alternative |
|-----------|-------------|-------------|
| **Expo Calendar** | ❌ None | Use web calendar APIs or skip feature |
| **Google/Microsoft Email APIs** | ⚠️ Different OAuth | Web OAuth flow requires redirect URLs |
| **Biometric Auth** | ❌ None | Use WebAuthn or skip for web |
| **Push Notifications** | ⚠️ Different API | Web Push API (requires different setup) |
| **Offline Storage** | ⚠️ Different API | IndexedDB instead of file system |

---

## Feature-by-Feature Assessment

### 1. Email Parsing & LLM Integration ✅ **Easy** (1-2 days)

**Current Mobile Implementation:**
- Google/Microsoft OAuth for email access
- Backend LLM processing via Lambda
- TanStack Query for data fetching
- Zustand for state management

**Web Migration:**
- ✅ OAuth flow works on web (different redirect URLs)
- ✅ Backend LLM calls identical
- ✅ TanStack Query works perfectly
- ✅ Zustand works identically

**Changes Needed:**
```typescript
// Mobile OAuth redirect
const redirectUri = 'com.doneai.app://oauth/callback';

// Web OAuth redirect (add this)
const redirectUri = Platform.select({
  web: 'https://trypackai.com/oauth/callback',
  default: 'com.doneai.app://oauth/callback'
});
```

**Effort:** 1-2 days (configure web OAuth URLs in Google/Microsoft console)

---

### 2. AWS Cognito Authentication ✅ **Easy** (2-3 days)

**Current Mobile Implementation:**
- AWS Cognito with OAuth PKCE
- AWS Amplify integration
- Biometric authentication

**Web Migration:**
- ✅ Cognito works identically on web
- ✅ Amplify Auth module supports web
- ❌ Biometric auth not available (use WebAuthn or skip)

**Changes Needed:**
```typescript
// Configure Amplify for web
Amplify.configure({
  Auth: {
    ...config,
    oauth: {
      ...oauthConfig,
      redirectSignIn: Platform.select({
        web: 'https://trypackai.com/',
        default: 'com.doneai.app://'
      }),
      redirectSignOut: Platform.select({
        web: 'https://trypackai.com/',
        default: 'com.doneai.app://'
      })
    }
  }
});

// Biometric fallback for web
const authenticateWithBiometric = async () => {
  if (Platform.OS === 'web') {
    // Use password or skip
    return authenticateWithPassword();
  }
  return LocalAuthentication.authenticateAsync();
};
```

**Effort:** 2-3 days (configure Cognito hosted UI, test OAuth flows)

---

### 3. Trip Organization & Display ✅ **Easy** (1-2 days)

**Current Mobile Implementation:**
- React Native components (View, Text, ScrollView, FlatList)
- Zustand state management
- Reanimated v3 animations

**Web Migration:**
- ✅ All React Native primitives work on web
- ✅ Zustand works identically
- ⚠️ Reanimated v3 has limited web support

**Changes Needed:**
```typescript
// Use simple animations on web, complex on mobile
const useAnimationStyle = () => {
  if (Platform.OS === 'web') {
    // Simple CSS-based animation
    return { transition: 'all 0.3s ease' };
  }
  // Full Reanimated on mobile
  return useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(offset.value) }]
  }));
};
```

**Effort:** 1-2 days (test and adjust animations)

---

### 4. Calendar Integration ❌ **Requires Rework** (3-5 days)

**Current Mobile Implementation:**
- Expo Calendar API
- Add trips to device calendar
- Detect calendar conflicts

**Web Migration:**
- ❌ expo-calendar has no web support
- ✅ Alternative: Download .ics file or use Google Calendar API

**Changes Needed:**
```typescript
// Platform-specific calendar implementation
const addToCalendar = async (trip: Trip) => {
  if (Platform.OS === 'web') {
    // Generate .ics file for download
    const icsContent = generateICS(trip);
    downloadFile('trip.ics', icsContent);

    // OR use Google Calendar API
    const event = await googleCalendar.insert(trip);
  } else {
    // Use Expo Calendar
    await Calendar.createEventAsync(trip);
  }
};
```

**Effort:** 3-5 days (implement .ics generation or Google Calendar API)

---

### 5. Stripe Payment Integration ✅ **Easy** (2-3 days)

**Current Mobile Implementation:**
- Stripe React Native SDK
- Payment collection for bookings

**Web Migration:**
- ✅ Stripe has excellent web SDK (actually easier than mobile)
- ✅ Payment Elements for web
- ✅ Same backend integration

**Changes Needed:**
```typescript
// Platform-specific Stripe components
import { PaymentSheet } from '@stripe/stripe-react-native';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';

const CheckoutForm = () => {
  if (Platform.OS === 'web') {
    return (
      <Elements stripe={stripePromise}>
        <PaymentElement />
      </Elements>
    );
  }
  return <PaymentSheet />;
};
```

**Effort:** 2-3 days (implement Stripe.js, test payment flows)

---

### 6. Offline Storage & Sync ⚠️ **Moderate** (5-7 days)

**Current Mobile Implementation:**
- Expo FileSystem for offline data
- AsyncStorage for settings
- TanStack Query for sync

**Web Migration:**
- ⚠️ expo-file-system has limited web support
- ✅ AsyncStorage works via localStorage
- ✅ TanStack Query works identically
- ✅ Alternative: IndexedDB for large data

**Changes Needed:**
```typescript
// Storage abstraction
const storage = Platform.select({
  web: {
    async write(key: string, data: string) {
      localStorage.setItem(key, data);
    },
    async read(key: string) {
      return localStorage.getItem(key);
    }
  },
  default: {
    async write(key: string, data: string) {
      await FileSystem.writeAsStringAsync(path, data);
    },
    async read(key: string) {
      return await FileSystem.readAsStringAsync(path);
    }
  }
});

// For large data on web, use IndexedDB
import { openDB } from 'idb';
const db = await openDB('doneai', 1, {
  upgrade(db) {
    db.createObjectStore('trips');
  }
});
```

**Effort:** 5-7 days (implement IndexedDB wrapper, test offline scenarios)

---

### 7. Push Notifications ⚠️ **Moderate** (3-5 days)

**Current Mobile Implementation:**
- Expo Notifications
- AWS SNS/Pinpoint for delivery
- Trip alerts and updates

**Web Migration:**
- ⚠️ Web Push API available but different implementation
- ✅ Service Workers for background notifications
- ⚠️ Requires HTTPS and user permission

**Changes Needed:**
```typescript
// Platform-specific notification registration
const registerForPushNotifications = async () => {
  if (Platform.OS === 'web') {
    // Web Push API
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });
    return subscription;
  } else {
    // Expo Notifications
    const { status } = await Notifications.requestPermissionsAsync();
    const token = await Notifications.getExpoPushTokenAsync();
    return token;
  }
};
```

**Effort:** 3-5 days (implement service worker, test web push)

---

### 8. Navigation & Routing ✅ **Easy** (1-2 days)

**Current Mobile Implementation:**
- Likely using Expo Router or React Navigation

**Web Migration:**
- ✅ Expo Router works on web with URLs
- ✅ React Navigation has web support

**Changes Needed:**
```typescript
// Expo Router works out of the box on web
app/
├── (tabs)/
│   ├── index.tsx           → https://trypackai.com/
│   ├── trips.tsx           → https://trypackai.com/trips
│   └── profile.tsx         → https://trypackai.com/profile
├── trip/[id].tsx           → https://trypackai.com/trip/123
└── _layout.tsx

// Deep linking works automatically
<Link href="/trip/123">View Trip</Link>
```

**Effort:** 1-2 days (test URL routing, configure redirects)

---

### 9. Analytics (PostHog) ✅ **Perfect** (0-1 day)

**Current Mobile Implementation:**
- PostHog React Native SDK

**Web Migration:**
- ✅ PostHog works perfectly on web (it's web-first)
- ✅ Same API across platforms

**Changes Needed:**
```typescript
// No changes needed - works identically
posthog.capture('trip_created', { tripId: '123' });
```

**Effort:** 0-1 day (verify events work on web)

---

## Dependency Analysis (117 Production Dependencies)

### Critical Dependencies to Review

Based on your 117 production dependencies, here are the categories to check:

#### ✅ Will Work Perfectly (Estimated 70-80 packages)
- All React/JavaScript libraries (lodash, date-fns, etc.)
- State management (Zustand, TanStack Query)
- HTTP clients (axios, fetch)
- Validation (Zod, Yup)
- Date/time (date-fns, dayjs)
- Utilities (ramda, lodash)

#### ⚠️ Need Platform-Specific Code (Estimated 15-20 packages)
- Expo Calendar
- Expo Notifications
- Expo FileSystem
- Expo SecureStore
- React Native Maps (if used)
- React Native Camera (if used)

#### ❌ Web Incompatible (Estimated 5-10 packages)
- Native biometric libraries
- Native payment SDKs (if not Stripe)
- Device-specific sensors

### Self-Assessment Checklist

**Run this in your mobile app directory to identify problematic dependencies:**

```bash
# Check for native modules
grep -E "react-native-|expo-" package.json | grep -v "react-native-web"

# Check for platform-specific files
find . -name "*.ios.*" -o -name "*.android.*"

# Check for Platform.OS usage
grep -r "Platform\.OS" --include="*.ts" --include="*.tsx" src/

# Check for native module imports
grep -r "NativeModules" --include="*.ts" --include="*.tsx" src/
```

---

## Effort Estimation

### Total Migration Timeline

| Phase | Duration | Risk | Notes |
|-------|----------|------|-------|
| **Phase 1: Setup & Config** | 2-3 days | Low | Expo web setup, build config |
| **Phase 2: Core Features** | 8-12 days | Medium | Auth, email parsing, trip display |
| **Phase 3: Platform-Specific** | 10-15 days | High | Calendar, storage, notifications |
| **Phase 4: Payment Integration** | 3-5 days | Medium | Stripe web implementation |
| **Phase 5: Testing & Polish** | 5-7 days | Medium | Cross-browser, responsive design |
| **Phase 6: Deployment** | 2-3 days | Low | Build optimization, CDN setup |
| **TOTAL** | **30-45 days** | **MEDIUM** | **6-9 weeks** |

### Resource Requirements

- **1 Senior React Native/Web Developer** (full-time)
- **0.5 Backend Developer** (OAuth setup, API adjustments)
- **0.25 DevOps Engineer** (web deployment, CDN)
- **0.25 QA Engineer** (cross-browser testing)

---

## Risk Assessment

### High Risk Items (Must Address)

1. **OAuth Redirect URLs** (Risk: Critical)
   - Google/Microsoft console config
   - Cognito hosted UI setup
   - Deep linking on web
   - **Mitigation:** Test OAuth flows early, have fallback auth methods

2. **Calendar Integration** (Risk: High)
   - expo-calendar doesn't support web
   - No direct device calendar access
   - **Mitigation:** Use .ics downloads or Google Calendar API

3. **Offline Storage** (Risk: High)
   - Different storage APIs (FileSystem vs IndexedDB)
   - Data migration complexity
   - **Mitigation:** Abstract storage layer early

### Medium Risk Items (Plan For)

1. **Animation Performance** (Risk: Medium)
   - Reanimated v3 web support limited
   - May need to simplify animations
   - **Mitigation:** Use CSS transitions for web, keep Reanimated for mobile

2. **Bundle Size** (Risk: Medium)
   - Web bundle may be large with all dependencies
   - Initial load time concerns
   - **Mitigation:** Code splitting, lazy loading

3. **Cross-Browser Support** (Risk: Medium)
   - Safari, Chrome, Firefox differences
   - Mobile browser quirks
   - **Mitigation:** Test on all major browsers early

### Low Risk Items (Monitor)

1. **SEO** (Risk: Low)
   - React Native Web doesn't SSR by default
   - May affect discoverability
   - **Mitigation:** Use marketing website for SEO, web app for functionality

---

## Architecture Recommendations

### Option 1: Unified Expo Monorepo (Recommended)

```
PackApp/
├── app/                    # Expo Router (iOS, Android, Web)
│   ├── (auth)/
│   │   ├── login.tsx       # All platforms
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── index.tsx       # Home (all platforms)
│   │   ├── trips.tsx       # Trips list
│   │   └── profile.tsx
│   ├── trip/
│   │   └── [id].tsx        # Dynamic trip detail
│   └── _layout.tsx
├── components/             # Shared components
│   ├── TripCard.tsx
│   ├── Calendar.web.tsx    # Web-specific
│   ├── Calendar.native.tsx # Mobile-specific
│   └── Calendar.tsx        # Shared interface
├── services/               # API clients (work on all platforms)
│   ├── api.ts
│   ├── auth.ts
│   └── storage/
│       ├── index.ts        # Platform-agnostic interface
│       ├── storage.web.ts  # IndexedDB
│       └── storage.native.ts # FileSystem
├── hooks/                  # Shared hooks
└── package.json            # Single dependency list
```

**Pros:**
- ✅ Single codebase
- ✅ Shared business logic (100%)
- ✅ Code splitting by platform when needed
- ✅ Unified testing

**Cons:**
- ⚠️ Larger web bundle
- ⚠️ Some platform-specific files needed

### Option 2: Separate Marketing + App

```
PackWebsite/                # Keep as marketing site (current)
PackApp/                    # Mobile + web app (Expo)
packages/                   # Shared business logic
```

**Pros:**
- ✅ Optimized marketing site for SEO
- ✅ Separate deployment pipelines
- ✅ Smaller app bundle

**Cons:**
- ❌ Two codebases to maintain
- ❌ Logic duplication

**Recommendation:** Use Option 1 (Unified Monorepo) and keep the marketing website separate.

---

## Step-by-Step Migration Plan

### Week 1: Setup & Assessment

**Day 1-2: Environment Setup**
```bash
# In your mobile app directory
cd PackApp

# Add web support
npx expo install react-native-web react-dom @expo/metro-runtime

# Test basic web build
npx expo start --web
```

**Day 3-5: Dependency Audit**
- Run dependency checker scripts
- Identify platform-specific code
- Create migration task list
- Set up staging environment

**Deliverable:** Migration task board, risk register

### Week 2-3: Core Features

**Day 6-10: Authentication & API**
- Configure Cognito web redirects
- Set up Google/Microsoft OAuth for web
- Test API calls from web
- Implement storage abstraction layer

**Day 11-15: UI Components**
- Test all screens on web
- Fix layout issues
- Adjust responsive design
- Simplify animations for web

**Deliverable:** Core app runs on web with auth

### Week 4-5: Platform-Specific Features

**Day 16-20: Calendar & Storage**
- Implement .ics download for calendar
- Set up IndexedDB wrapper
- Test offline mode on web
- Implement data sync

**Day 21-25: Payments & Notifications**
- Integrate Stripe.js for web
- Set up web push notifications
- Test payment flows
- Configure service workers

**Deliverable:** Feature parity (except biometrics)

### Week 6: Testing & Deployment

**Day 26-30: Polish & Deploy**
- Cross-browser testing
- Performance optimization
- Code splitting
- Production build & deploy

**Deliverable:** Live web app

---

## Platform-Specific Code Patterns

### 1. File Naming Convention

```
components/
├── Calendar.tsx           # Shared interface/logic
├── Calendar.web.tsx       # Web implementation
└── Calendar.native.tsx    # Mobile implementation

// Usage (Expo automatically picks the right file)
import { Calendar } from './Calendar';
```

### 2. Platform.select() Pattern

```typescript
const config = Platform.select({
  web: {
    storage: 'indexeddb',
    calendar: 'ics-download',
    notifications: 'web-push'
  },
  ios: {
    storage: 'filesystem',
    calendar: 'expo-calendar',
    notifications: 'expo-notifications'
  },
  android: {
    storage: 'filesystem',
    calendar: 'expo-calendar',
    notifications: 'expo-notifications'
  }
});
```

### 3. Conditional Imports

```typescript
// Dynamic platform imports
const getStorageImpl = () => {
  if (Platform.OS === 'web') {
    return import('./storage.web');
  }
  return import('./storage.native');
};
```

---

## Testing Strategy

### Unit Tests (No Changes Needed)

```typescript
// Jest works identically on all platforms
describe('Trip Parser', () => {
  it('extracts flight info from email', () => {
    const trip = parseTripEmail(mockEmail);
    expect(trip.flights).toHaveLength(2);
  });
});
```

### Integration Tests (Add Web Scenarios)

```typescript
// Test web-specific flows
describe('Web OAuth Flow', () => {
  it('redirects to Google OAuth', async () => {
    // Mock window.location
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.loginWithGoogle());
    expect(window.location.href).toContain('accounts.google.com');
  });
});
```

### E2E Tests (Add Web Browser)

```typescript
// Add Playwright for web E2E
import { test, expect } from '@playwright/test';

test('book a trip on web', async ({ page }) => {
  await page.goto('https://www.trypackai.com');
  await page.click('text=New Trip');
  // ... test flow
});
```

---

## Performance Optimization

### Code Splitting Strategy

```typescript
// Lazy load heavy features
const EmailParser = lazy(() => import('./features/EmailParser'));
const BookingFlow = lazy(() => import('./features/BookingFlow'));

// Split by route
const routes = [
  { path: '/', component: lazy(() => import('./pages/Home')) },
  { path: '/trips', component: lazy(() => import('./pages/Trips')) }
];
```

### Bundle Analysis

```bash
# Analyze web bundle size
npx expo export:web --dump-assetmap

# Look for large dependencies
npx source-map-explorer web-build/static/js/*.js
```

### Target Metrics

- **Initial Load:** < 3 seconds (3G)
- **Bundle Size:** < 500KB (gzipped)
- **Lighthouse Score:** > 90
- **First Contentful Paint:** < 1.5s

---

## Deployment Options

### Option 1: Expo Hosting (Easiest)

```bash
# Build for web
npx expo export:web

# Deploy to Expo
eas build:web
eas submit:web
```

### Option 2: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
npx expo export:web
vercel --prod web-build/
```

### Option 3: AWS S3 + CloudFront

```bash
# Build
npx expo export:web

# Deploy to S3
aws s3 sync web-build/ s3://www.trypackai.com

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

---

## Cost Implications

### Additional Costs for Web

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **CDN (CloudFront)** | $10-50 | Based on traffic |
| **Web Hosting (S3)** | $5-20 | Storage + requests |
| **Web Push Service** | $0-30 | OneSignal/Firebase |
| **Monitoring (Sentry)** | $26+ | Web error tracking |
| **Total Additional** | **$41-126/mo** | Low to medium traffic |

### Cost Savings

- ✅ Shared backend (no additional cost)
- ✅ Shared auth infrastructure
- ✅ Shared analytics (PostHog)
- ✅ No separate web team needed

---

## Success Criteria

### Week 2 Milestone
- [ ] Web app loads successfully
- [ ] Auth flow works (email/password)
- [ ] API calls succeed
- [ ] Basic navigation works

### Week 4 Milestone
- [ ] OAuth flows working (Google/Microsoft)
- [ ] Trip list displays correctly
- [ ] Email parsing works
- [ ] Offline mode functional

### Week 6 Milestone (Launch Ready)
- [ ] All core features working
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Mobile responsive
- [ ] Performance optimized (Lighthouse > 90)
- [ ] Payment flow working
- [ ] Production deployed

---

## Next Steps

### Immediate Actions (This Week)

1. **Run Dependency Audit** (1 hour)
   ```bash
   cd PackApp
   npm list --depth=0 | grep "react-native"
   npm list --depth=0 | grep "expo"
   ```

2. **Test Basic Web Build** (30 minutes)
   ```bash
   npx expo install react-native-web react-dom
   npx expo start --web
   ```

3. **Document Platform-Specific Code** (2 hours)
   ```bash
   grep -r "Platform.OS" src/ > platform-code-locations.txt
   find . -name "*.ios.*" -o -name "*.android.*" > platform-files.txt
   ```

4. **Create Migration Board** (1 hour)
   - List all features
   - Mark web compatibility status
   - Estimate effort per feature

### Week 1 Actions

1. Set up web build pipeline
2. Configure Cognito for web
3. Set up Google/Microsoft OAuth web redirects
4. Create storage abstraction layer
5. Test authentication flows on web

### Decision Points

**By End of Week 1:**
- [ ] Confirm web build works
- [ ] Verify no major blockers
- [ ] Approve migration timeline
- [ ] Allocate resources

**By End of Week 2:**
- [ ] Auth working on web
- [ ] Decide on calendar solution (.ics vs Google Calendar API)
- [ ] Confirm payment integration approach

**By End of Week 4:**
- [ ] Go/no-go decision for web launch
- [ ] Set launch date
- [ ] Plan marketing

---

## Conclusion

### Summary Assessment

**React Native Web migration is HIGHLY FEASIBLE for your Expo-based travel app.**

**Key Strengths:**
- ✅ Using Expo SDK 52 (excellent web support)
- ✅ Modern tech stack (Zustand, TanStack Query, TypeScript)
- ✅ 75-85% code reuse potential
- ✅ Clear migration path

**Main Challenges:**
- ⚠️ Calendar integration needs rework
- ⚠️ OAuth flows need web configuration
- ⚠️ Offline storage differences
- ⚠️ Animation library limitations

**Recommendation:**
**Proceed with migration using unified Expo Router codebase.**

**Estimated Timeline:** 6-9 weeks
**Estimated Effort:** 30-45 developer days
**Risk Level:** Medium (manageable with proper planning)

**Expected Outcome:**
A production-ready web app that shares 75-85% of code with your mobile app, deployed alongside your marketing website.

---

## Resources & Documentation

### Official Documentation
- [Expo Web Support](https://docs.expo.dev/workflow/web/)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

### Community Resources
- [Expo Discord](https://chat.expo.dev/) - #expo-web channel
- [React Native Web Cookbook](https://necolas.github.io/react-native-web/docs/installation/)

### Tools
- [Expo Web Debugger](https://docs.expo.dev/debugging/runtime-issues/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) (if using Redux)

---

**Assessment Created By:** Claude
**For:** PackApp → Web Migration
**Contact:** Open GitHub issue for questions
