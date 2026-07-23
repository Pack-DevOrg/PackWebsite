/**
 * @file Breadcrumbs.tsx
 * @description Schema-only breadcrumb trail (Schema.org BreadcrumbList)
 *
 * Emits BreadcrumbList JSON-LD for the current route so search engines can
 * show the page's position in the site hierarchy. Deliberately renders no
 * visible markup: the site's design has no breadcrumb bar, and the trail is
 * derived from the same route map that drives navigation labels.
 *
 * The trail is generated from the current route via `pageMap`. Routes missing
 * from the map produce no crumb; a trail with only "Home" emits nothing.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { stripLocaleFromPath } from '@/i18n/config';
import { capabilityPageDefinitions } from '@/content/capabilityPages';
import {
  orderedSeoGuideSlugs,
  seoGuideDefinitionMap,
} from '@/content/seoGuides';
import { buildAbsoluteUrl } from '@/seo/pageSeo';

const Breadcrumbs: React.FC = () => {
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
    '/about': t('nav.about'),
    '/support': t('nav.support'),
    '/tsa': 'TSA Wait Times',
    '/terms': t('breadcrumb.terms'),
    '/privacy': t('breadcrumb.privacy'),
    '/privacy-request': t('breadcrumb.privacyRequest'),
    '/privacy-request/verify': t('breadcrumb.privacyRequestVerify'),
    '/accessibility': t('breadcrumb.accessibility'),
    ...Object.fromEntries(
      capabilityPageDefinitions.map((page) => [`/${page.slug}`, page.navLabel]),
    ),
    ...Object.fromEntries(
      orderedSeoGuideSlugs.map((slug) => [
        `/guides/${slug}`,
        seoGuideDefinitionMap[slug].eyebrow,
      ]),
    ),
  };

  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ path: '/', label: t('common.home') }];

  let currentPath = '';
  paths.forEach((path) => {
    currentPath += `/${path}`;
    const label = pageMap[currentPath];
    if (label) {
      breadcrumbs.push({ path: currentPath, label });
    }
  });

  // No schema on the home page or for unmapped routes
  if (breadcrumbs.length <= 1) {
    return null;
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: buildAbsoluteUrl(pathFor(crumb.path)),
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};

export default Breadcrumbs;
