/**
 * @file Breadcrumbs.tsx
 * @description Navigation breadcrumbs component with SEO schema markup
 * 
 * This component provides hierarchical navigation breadcrumbs for the website,
 * showing users their current location within the site structure. It includes:
 * - Automatic breadcrumb generation based on current route
 * - Structured data markup for SEO (Schema.org BreadcrumbList)
 * - Accessible navigation with proper ARIA attributes
 * - Responsive design with hover states
 * 
 * The component automatically hides on the home page and generates appropriate
 * JSON-LD structured data for search engine optimization.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { ChevronRight, Home } from 'lucide-react';
import PrefetchLink from './PrefetchLink';
import { useMountEffect } from '@/hooks/useMountEffect';
import { useI18n } from '@/i18n/I18nProvider';
import { stripLocaleFromPath } from '@/i18n/config';

/**
 * Main container for the breadcrumb navigation
 * Uses semantic nav element for accessibility and applies consistent spacing
 */
const BreadcrumbContainer = styled.nav`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

/**
 * Ordered list containing breadcrumb items
 * Uses semantic ol element for proper accessibility
 */
const BreadcrumbList = styled.ol`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
`;

const BreadcrumbItem = styled.li`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const BreadcrumbLink = styled(PrefetchLink)`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-small);
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-accent);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const BreadcrumbSeparator = styled.span`
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
  opacity: 0.5;
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const BreadcrumbCurrent = styled.span`
  color: var(--color-text-primary);
  font-size: var(--font-size-small);
  font-weight: 500;
`;

/**
 * Props interface for the Breadcrumbs component
 */
interface BreadcrumbsProps {
  /** Optional CSS class name for styling customization */
  className?: string;
}

/**
 * Breadcrumbs navigation component
 * 
 * Automatically generates breadcrumbs based on the current route and provides
 * structured data markup for SEO. The component is hidden on the home page
 * and for single-item breadcrumb trails.
 * 
 * @param props - Component props
 * @param props.className - Optional CSS class for styling
 * @returns JSX element or null if breadcrumbs should be hidden
 */
const BreadcrumbsInstance: React.FC<BreadcrumbsProps> = ({ className }) => {
  const location = useLocation();
  const pathname = stripLocaleFromPath(location.pathname);
  const { pathFor, t } = useI18n();

  /**
   * Mapping of route paths to display labels
   * Add new routes here to ensure proper breadcrumb generation
   */
  const pageMap: Record<string, string> = {
    '/': t('common.home'),
    '/features': t('breadcrumb.features'),
    '/faq': t('breadcrumb.faq'),
    '/how-it-works': t('breadcrumb.howItWorks'),
    '/terms': t('breadcrumb.terms'),
    '/privacy': t('breadcrumb.privacy'),
    '/do-not-sell': t('breadcrumb.doNotSell'),
    '/privacy-request': t('breadcrumb.privacyRequest'),
    '/privacy-request/verify': t('breadcrumb.privacyRequestVerify'),
    '/accessibility': t('breadcrumb.accessibility'),
  };

  /**
   * Generates breadcrumb items based on current pathname
   * Creates an array of breadcrumb objects with path and label
   * 
   * @returns Array of breadcrumb items with path and label properties
   */
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ path: '/', label: t('common.home') }];

    let currentPath = '';
    paths.forEach(path => {
      currentPath += `/${path}`;
      const label = pageMap[currentPath];
      if (label) {
        breadcrumbs.push({ path: currentPath, label });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  /**
   * Effect to generate and inject SEO breadcrumb schema markup
   * Creates JSON-LD structured data for search engines
   */
  useMountEffect(() => {
    /**
     * Generates Schema.org BreadcrumbList structured data
     * and injects it into the document head for SEO
     */
    const generateBreadcrumbSchema = () => {
      if (breadcrumbs.length <= 1) return; // Don't show schema for home page only

      const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.label,
          "item": `https://trypackai.com${crumb.path === '/' ? '' : '#' + crumb.path}`
        }))
      };

      // Remove existing breadcrumb schema
      const existingSchema = document.querySelector('script[data-schema="breadcrumb"]');
      if (existingSchema) {
        existingSchema.remove();
      }

      // Add new schema
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-schema', 'breadcrumb');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    generateBreadcrumbSchema();

    // Cleanup on unmount
    return () => {
      const schema = document.querySelector('script[data-schema="breadcrumb"]');
      if (schema) {
        schema.remove();
      }
    };
  });

  // Don't show breadcrumbs on home page or if there's only one item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <BreadcrumbContainer className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <BreadcrumbItem key={crumb.path}>
            {index === breadcrumbs.length - 1 ? (
              // Current page (no link)
              <BreadcrumbCurrent>{crumb.label}</BreadcrumbCurrent>
            ) : (
              <>
                  <BreadcrumbLink to={pathFor(crumb.path)}>
                  {index === 0 && <Home />}
                  {crumb.label}
                </BreadcrumbLink>
                <BreadcrumbSeparator>
                  <ChevronRight />
                </BreadcrumbSeparator>
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </BreadcrumbContainer>
  );
};

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className }) => {
  const { pathname } = useLocation();

  return <BreadcrumbsInstance key={pathname} className={className} />;
};

export default Breadcrumbs;
