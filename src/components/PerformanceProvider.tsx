import React, { createContext, useContext, useState } from 'react';
import { useMountEffect } from '@/hooks/useMountEffect';

interface PerformanceContextType {
  isSlowConnection: boolean;
  reduceAnimations: boolean;
  preloadImages: boolean;
}

const PerformanceContext = createContext<PerformanceContextType>({
  isSlowConnection: false,
  reduceAnimations: false,
  preloadImages: true,
});

export const usePerformance = () => useContext(PerformanceContext);

interface PerformanceProviderProps {
  children: React.ReactNode;
}

const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [preloadImages, setPreloadImages] = useState(true);

  useMountEffect(() => {
    // Check connection speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const isSlowNetwork = connection.effectiveType === 'slow-2g' || 
                             connection.effectiveType === '2g' ||
                             connection.saveData;
        setIsSlowConnection(isSlowNetwork);
        setReduceAnimations(isSlowNetwork);
        setPreloadImages(!isSlowNetwork);
      }
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setReduceAnimations(true);
    }

    // Memory pressure detection
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory && memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
        setReduceAnimations(true);
        setPreloadImages(false);
      }
    }
  });

  return (
    <PerformanceContext.Provider value={{
      isSlowConnection,
      reduceAnimations,
      preloadImages
    }}>
      <ReduceMotionDatasetCoordinator
        key={reduceAnimations ? 'reduced' : 'full'}
        reduceAnimations={reduceAnimations}
      />
      {children}
    </PerformanceContext.Provider>
  );
};

const ReduceMotionDatasetCoordinator: React.FC<{
  readonly reduceAnimations: boolean;
}> = ({ reduceAnimations }) => {
  useMountEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    if (reduceAnimations) {
      root.dataset.reduceMotion = 'true';
      return () => {
        delete root.dataset.reduceMotion;
      };
    }
    delete root.dataset.reduceMotion;
    return undefined;
  });

  return null;
};

export default PerformanceProvider;
