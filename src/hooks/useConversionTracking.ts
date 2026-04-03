/**
 * useConversionTracking - Custom hook for comprehensive conversion tracking
 * 
 * Features:
 * - High-level conversion event tracking
 * - A/B test event tracking
 * - User journey tracking
 * - Custom event parameters
 * - Performance monitoring
 * 
 * Based on 2025 conversion optimization best practices
 */

import { useCallback, useRef } from 'react';
import { useTracking } from '../components/TrackingProvider';
import { useMountEffect } from './useMountEffect';

// Standard conversion events based on GA4 and Meta Pixel best practices
export type ConversionEvent = 
  | 'page_view'
  | 'login'
  | 'sign_up'
  | 'generate_lead'
  | 'waitlist_join'
  | 'newsletter_subscribe'
  | 'contact_submit'
  | 'form_start'
  | 'form_submit'
  | 'click_cta'
  | 'scroll_milestone'
  | 'video_play'
  | 'video_complete'
  | 'download'
  | 'social_share'
  | 'search'
  | 'engagement_high';

interface ConversionEventParams {
  // Standard parameters
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  
  // Custom parameters
  form_name?: string;
  cta_text?: string;
  cta_location?: string;
  page_section?: string;
  scroll_percent?: number;
  video_title?: string;
  video_duration?: number;
  download_filename?: string;
  social_platform?: string;
  search_term?: string;
  ab_test_name?: string;
  ab_test_variant?: string;
  
  // User journey parameters
  session_id?: string;
  user_engagement?: 'low' | 'medium' | 'high';
  page_load_time?: number;
  time_on_page?: number;
  
  // Additional metadata
  [key: string]: any;
}

interface UseConversionTrackingReturn {
  trackConversion: (event: ConversionEvent, params?: ConversionEventParams) => void;
  trackFormStart: (formName: string, params?: ConversionEventParams) => void;
  trackFormSubmit: (formName: string, params?: ConversionEventParams) => void;
  trackCTAClick: (ctaText: string, location: string, params?: ConversionEventParams) => void;
  trackScrollMilestone: (percent: number, params?: ConversionEventParams) => void;
  trackVideoEngagement: (action: 'play' | 'pause' | 'complete', videoTitle: string, params?: ConversionEventParams) => void;
  trackABTest: (testName: string, variant: string, params?: ConversionEventParams) => void;
  startEngagementTracking: () => void;
  stopEngagementTracking: () => void;
}

/**
 * Custom hook for comprehensive conversion tracking
 */
export const useConversionTracking = (): UseConversionTrackingReturn => {
  const { trackEvent, hasConsent } = useTracking();
  
  // Track engagement metrics
  const engagementStartTime = useRef<number>(Date.now());
  const scrollDepth = useRef<number>(0);
  const clickCount = useRef<number>(0);
  const engagementTimer = useRef<NodeJS.Timeout | null>(null);
  const hasConsentRef = useRef(hasConsent);
  const trackEventRef = useRef(trackEvent);
  const sessionIdRef = useRef(generateSessionId());

  hasConsentRef.current = hasConsent;
  trackEventRef.current = trackEvent;

  /**
   * Main conversion tracking function
   */
  const trackConversion = useCallback((
    event: ConversionEvent, 
    params: ConversionEventParams = {}
  ) => {
    if (!hasConsentRef.current) return;

    // Add standard metadata
    const { event_id: eventId, email_hash: emailHash, ...restParams } = params;

    const enrichedParams = {
      ...restParams,
      timestamp: Date.now(),
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || '(direct)',
      session_id: restParams.session_id || sessionIdRef.current,
    } as ConversionEventParams & { event_id?: string; email_hash?: string };

    if (eventId) {
      enrichedParams.event_id = eventId;
    }

    if (emailHash) {
      enrichedParams.email_hash = emailHash;
    }

    trackEventRef.current(event, enrichedParams);
  }, []);

  /**
   * Track form interactions
   */
  const trackFormStart = useCallback((formName: string, params: ConversionEventParams = {}) => {
    trackConversion('form_start', {
      ...params,
      form_name: formName,
      event_category: 'engagement',
      event_label: 'form_interaction',
    });
  }, [trackConversion]);

  const trackFormSubmit = useCallback((formName: string, params: ConversionEventParams = {}) => {
    trackConversion('form_submit', {
      ...params,
      form_name: formName,
      event_category: 'conversion',
      event_label: 'form_completion',
      value: 1, // Standard conversion value
    });
  }, [trackConversion]);

  /**
   * Track CTA clicks
   */
  const trackCTAClick = useCallback((
    ctaText: string, 
    location: string, 
    params: ConversionEventParams = {}
  ) => {
    trackConversion('click_cta', {
      ...params,
      cta_text: ctaText,
      cta_location: location,
      event_category: 'engagement',
      event_label: 'cta_click',
    });
  }, [trackConversion]);

  /**
   * Track scroll milestones
   */
  const trackScrollMilestone = useCallback((percent: number, params: ConversionEventParams = {}) => {
    trackConversion('scroll_milestone', {
      ...params,
      scroll_percent: percent,
      event_category: 'engagement',
      event_label: `scroll_${percent}%`,
    });
  }, [trackConversion]);

  /**
   * Track video engagement
   */
  const trackVideoEngagement = useCallback((
    action: 'play' | 'pause' | 'complete',
    videoTitle: string,
    params: ConversionEventParams = {}
  ) => {
    const eventMap = {
      play: 'video_play',
      pause: 'video_play', // Both map to video_play in GA4
      complete: 'video_complete',
    };

    trackConversion(eventMap[action] as ConversionEvent, {
      ...params,
      video_title: videoTitle,
      video_action: action,
      event_category: 'engagement',
      event_label: 'video_interaction',
    });
  }, [trackConversion]);

  /**
   * Track A/B test assignments and conversions
   */
  const trackABTest = useCallback((
    testName: string,
    variant: string,
    params: ConversionEventParams = {}
  ) => {
    trackConversion('page_view', {
      ...params,
      ab_test_name: testName,
      ab_test_variant: variant,
      event_category: 'experiment',
      event_label: `${testName}_${variant}`,
    });
  }, [trackConversion]);

  /**
   * Start tracking user engagement metrics
   */
  const startEngagementTracking = useCallback(() => {
    engagementStartTime.current = Date.now();
    clickCount.current = 0;
    scrollDepth.current = 0;

    // Track scroll depth
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercent = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      
      if (scrollPercent > scrollDepth.current) {
        scrollDepth.current = scrollPercent;
        
        // Track milestone events
        if (scrollPercent >= 25 && scrollPercent < 50 && scrollDepth.current < 50) {
          trackScrollMilestone(25);
        } else if (scrollPercent >= 50 && scrollPercent < 75 && scrollDepth.current < 75) {
          trackScrollMilestone(50);
        } else if (scrollPercent >= 75 && scrollPercent < 90 && scrollDepth.current < 90) {
          trackScrollMilestone(75);
        } else if (scrollPercent >= 90 && scrollDepth.current < 100) {
          trackScrollMilestone(90);
        }
      }
    };

    // Track click interactions
    const handleClick = () => {
      clickCount.current += 1;
    };

    // Set up high engagement tracking
    engagementTimer.current = setTimeout(() => {
      const timeOnPage = Date.now() - engagementStartTime.current;
      
      // Define high engagement criteria
      if (timeOnPage > 30000 || // 30 seconds on page
          scrollDepth.current > 50 || // Scrolled past 50%
          clickCount.current > 3) { // Multiple clicks
        
        trackConversion('engagement_high', {
          time_on_page: timeOnPage,
          max_scroll_depth: scrollDepth.current,
          click_count: clickCount.current,
          event_category: 'engagement',
          event_label: 'high_engagement',
        });
      }
    }, 30000); // Check after 30 seconds

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      if (engagementTimer.current) {
        clearTimeout(engagementTimer.current);
      }
    };
  }, [trackConversion, trackScrollMilestone]);

  /**
   * Stop engagement tracking
   */
  const stopEngagementTracking = useCallback(() => {
    if (engagementTimer.current) {
      clearTimeout(engagementTimer.current);
      engagementTimer.current = null;
    }
  }, []);

  useMountEffect(() => {
    const cleanup = startEngagementTracking();

    return () => {
      cleanup?.();
      if (hasConsentRef.current && engagementStartTime.current) {
        const timeOnPage = Date.now() - engagementStartTime.current;
        trackEventRef.current('page_engagement', {
          time_on_page: timeOnPage,
          max_scroll_depth: scrollDepth.current,
          click_count: clickCount.current,
          event_category: 'engagement',
          event_label: 'page_exit',
        });
      }
    };
  });

  return {
    trackConversion,
    trackFormStart,
    trackFormSubmit,
    trackCTAClick,
    trackScrollMilestone,
    trackVideoEngagement,
    trackABTest,
    startEngagementTracking,
    stopEngagementTracking,
  };
};

/**
 * Generate a session ID for tracking
 */
function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default useConversionTracking;
