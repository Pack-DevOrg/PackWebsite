/**
 * PrefetchLink - Intelligent Link Prefetching Component
 *
 * Provides aggressive prefetching strategies to make navigation feel instant:
 * - Hover-based prefetching (desktop)
 * - Viewport-based prefetching (mobile-friendly)
 * - Idle callback scheduling to avoid blocking main thread
 * - React.lazy() component preloading
 * - React Query data prefetching support
 *
 * Usage:
 *   <PrefetchLink to="/features" prefetchOnHover prefetchOnViewport>
 *     Features
 *   </PrefetchLink>
 */

import React, { useRef, useCallback } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {env} from '../utils/env';
import { useMountEffect } from '@/hooks/useMountEffect';

interface PrefetchLinkProps extends LinkProps {
  /** Enable prefetch on hover (default: true) */
  prefetchOnHover?: boolean;
  /** Enable prefetch when link enters viewport (default: true) */
  prefetchOnViewport?: boolean;
  /** Delay in ms before prefetching on hover (default: 50ms) */
  hoverDelay?: number;
  /** React Query key to prefetch */
  queryKey?: string[];
  /** React Query prefetch function */
  queryFn?: () => Promise<unknown>;
  /** Priority hint for prefetch timing */
  priority?: 'high' | 'low';
}

// Route -> Lazy Component mapping for prefetching
const routeComponentMap: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  '/faq': () => import('../pages/FAQ'),
  '/features': () => import('../pages/Features'),
  '/how-it-works': () => import('../pages/HowItWorks'),
  '/terms': () => import('../pages/TermsOfService'),
  '/privacy': () => import('../pages/PrivacyPolicy'),
  '/privacy-request': () => import('../pages/PrivacyRequest'),
};

// Track which routes have been prefetched to avoid duplicate work
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's lazy-loaded component
 */
const prefetchRoute = (to: string): void => {
  if (prefetchedRoutes.has(to)) {
    return;
  }

  const componentLoader = routeComponentMap[to];
  if (!componentLoader) {
    return;
  }

  prefetchedRoutes.add(to);

  // Schedule prefetch during idle time
  const schedulePrefetch = () => {
    if (typeof window === 'undefined') {
      return;
    }

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(
        () => {
          componentLoader().catch((err) => {
            if (env.DEV) {
              console.warn(`Failed to prefetch route ${to}:`, err);
            }
            prefetchedRoutes.delete(to); // Allow retry
          });
        },
        { timeout: 2000 }
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        componentLoader().catch((err) => {
          if (env.DEV) {
            console.warn(`Failed to prefetch route ${to}:`, err);
          }
          prefetchedRoutes.delete(to);
        });
      }, 100);
    }
  };

  schedulePrefetch();
};

export const PrefetchLink = React.forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  (
    {
      to,
      prefetchOnHover = false,
      prefetchOnViewport = false,
      hoverDelay = 50,
      queryKey,
      queryFn,
      priority = 'low',
      children,
      onMouseEnter,
      ...props
    },
    ref
  ) => {
    const queryClient = useQueryClient();
    const linkRef = useRef<HTMLAnchorElement>(null);
    const hoverTimeoutRef = useRef<number>();
    const prefetchedRef = useRef(false);

    const performPrefetch = useCallback(() => {
      if (prefetchedRef.current) {
        return;
      }

      prefetchedRef.current = true;

      // Prefetch route component
      const routePath = typeof to === 'string' ? to : to.pathname || '';
      if (routePath) {
        prefetchRoute(routePath);
      }

      // Prefetch React Query data if provided
      if (queryKey && queryFn && queryClient) {
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        });
      }
    }, [to, queryKey, queryFn, queryClient]);

    // Hover-based prefetching
    const handleMouseEnter = useCallback(
      (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (prefetchOnHover) {
          // Clear any existing timeout
          if (hoverTimeoutRef.current) {
            window.clearTimeout(hoverTimeoutRef.current);
          }

          // Schedule prefetch with delay
          hoverTimeoutRef.current = window.setTimeout(() => {
            performPrefetch();
          }, hoverDelay);
        }

        // Call original onMouseEnter handler if provided
        if (onMouseEnter) {
          onMouseEnter(event);
        }
      },
      [prefetchOnHover, hoverDelay, performPrefetch, onMouseEnter]
    );

    const handleMouseLeave = useCallback(() => {
      // Cancel pending prefetch on mouse leave
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    }, []);

    useMountEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          window.clearTimeout(hoverTimeoutRef.current);
        }
      };
    });

    const setCombinedRef = useCallback((node: HTMLAnchorElement | null) => {
      linkRef.current = node;
      if (!ref) {
        return;
      }
      if (typeof ref === 'function') {
        ref(node);
        return;
      }
      (ref as React.MutableRefObject<HTMLAnchorElement | null>).current = node;
    }, [ref]);

    return (
      <>
        {prefetchOnViewport && linkRef.current ? (
          <ViewportPrefetchObserver
            key={`${String(typeof to === 'string' ? to : to.pathname || '')}:${priority}`}
            linkRef={linkRef}
            performPrefetch={performPrefetch}
            priority={priority}
          />
        ) : null}
        <Link
          {...props}
          to={to}
          ref={setCombinedRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </Link>
      </>
    );
  }
);

const ViewportPrefetchObserver: React.FC<{
  readonly linkRef: React.MutableRefObject<HTMLAnchorElement | null>;
  readonly performPrefetch: () => void;
  readonly priority: 'high' | 'low';
}> = ({ linkRef, performPrefetch, priority }) => {
  useMountEffect(() => {
    if (!linkRef.current) {
      return;
    }

    const rootMargin = priority === 'high' ? '200px' : '50px';
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            performPrefetch();
          }
        });
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(linkRef.current);
    return () => {
      observer.disconnect();
    };
  });

  return null;
};

PrefetchLink.displayName = 'PrefetchLink';

export default PrefetchLink;
