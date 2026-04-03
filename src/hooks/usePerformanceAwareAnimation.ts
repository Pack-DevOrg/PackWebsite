import { useState } from 'react';
import { useMountEffect } from '@/hooks/useMountEffect';

export interface AnimationPreferences {
  shouldAnimate: boolean;
  reduceMotion: boolean;
  isSlowDevice: boolean;
  isSlowConnection: boolean;
}

export const usePerformanceAwareAnimation = (): AnimationPreferences => {
  const [preferences, setPreferences] = useState<AnimationPreferences>({
    shouldAnimate: true,
    reduceMotion: false,
    isSlowDevice: false,
    isSlowConnection: false,
  });

  useMountEffect(() => {
    const checkPreferences = () => {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Check device capabilities
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const isSlowDevice = hardwareConcurrency < 4;
      
      // Check memory constraints
      const deviceMemory = (navigator as any).deviceMemory;
      const isLowMemory = deviceMemory && deviceMemory < 4;
      
      // Check connection speed
      let isSlowConnection = false;
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          isSlowConnection = connection.effectiveType === 'slow-2g' || 
                            connection.effectiveType === '2g' ||
                            connection.saveData;
        }
      }
      
      // Determine if we should animate
      const shouldReduce = prefersReducedMotion || isSlowDevice || isLowMemory || isSlowConnection;
      
      setPreferences({
        shouldAnimate: !shouldReduce,
        reduceMotion: prefersReducedMotion,
        isSlowDevice: isSlowDevice || isLowMemory,
        isSlowConnection,
      });
    };

    checkPreferences();

    // Listen for changes in reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => checkPreferences();
    
    // Use modern addEventListener if available, fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  });

  return preferences;
};

// Animation config based on performance
export const getAnimationConfig = (preferences: AnimationPreferences) => {
  if (!preferences.shouldAnimate) {
    return {
      duration: 0,
      ease: 'linear' as const,
      stagger: 0,
    };
  }
  
  if (preferences.isSlowDevice || preferences.isSlowConnection) {
    return {
      duration: 0.3,
      ease: 'easeOut' as const,
      stagger: 0.05,
    };
  }
  
  return {
    duration: 0.5,
    ease: 'easeOut' as const,
    stagger: 0.1,
  };
};
