import React, { useState, useRef, useCallback } from 'react';
import { usePerformance } from './PerformanceProvider';
import { useMountEffect } from '@/hooks/useMountEffect';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = React.memo(({
  src,
  alt,
  className,
  style,
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { preloadImages } = usePerformance();

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      setIsInView(true);
    }
  }, []);

  useMountEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  });

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const shouldLoad = preloadImages || isInView;

  return (
    <div ref={imgRef} className={className} style={style}>
      {shouldLoad && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            width: '100%',
            height: 'auto',
            ...style
          }}
        />
      )}
      {!isLoaded && !hasError && placeholder && (
        <div
          style={{
            backgroundColor: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            minHeight: '200px',
            ...style
          }}
        >
          {placeholder}
        </div>
      )}
      {hasError && (
        <div
          style={{
            backgroundColor: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            minHeight: '200px',
            ...style
          }}
        >
          Failed to load image
        </div>
      )}
    </div>
  );
});

export default LazyImage;
