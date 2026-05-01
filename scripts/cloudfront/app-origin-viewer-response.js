function normalizeRouteFromRequestUri(uri) {
  if (!uri || uri === '/index.html') {
    return '/';
  }

  if (uri.endsWith('/index.html')) {
    return uri.slice(0, -'/index.html'.length) || '/';
  }

  return uri;
}

var alternateMarkdownMap = {
  '/': '/index.md',
  '/capabilities': '/capabilities.md',
  '/features': '/features.md',
  '/how-it-works': '/how-it-works.md',
  '/faq': '/faq.md',
  '/support': '/support.md',
  '/accessibility': '/accessibility.md',
  '/privacy': '/PrivacyPolicy.md',
  '/terms': '/TermsOfService.md',
  '/travel-history': '/travel-history.md',
  '/travel-stats': '/travel-stats.md',
  '/loyalty-details': '/loyalty-details.md',
  '/trip-planning-from-events': '/trip-planning-from-events.md',
  '/trip-updates': '/trip-updates.md',
  '/travel-booking': '/travel-booking.md',
  '/upcoming-trip-details': '/upcoming-trip-details.md',
  '/airport-security-wait-times': '/airport-security-wait-times.md',
  '/trip-calendar-sync': '/trip-calendar-sync.md',
  '/connected-accounts': '/connected-accounts.md',
  '/traveler-profiles': '/traveler-profiles.md',
  '/trip-sharing': '/trip-sharing.md',
  '/live-trip-views': '/live-trip-views.md',
  '/trip-expenses': '/trip-expenses.md',
};

function buildLinkHeader(route) {
  var links = [
    '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
    '</.well-known/api/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
    '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
    '</.well-known/mcp.json>; rel="describedby"; type="application/json"; title="Pack public docs MCP manifest"',
  ];

  var alternate = alternateMarkdownMap[route];
  if (alternate) {
    links.push('<' + alternate + '>; rel="alternate"; type="text/markdown"');
  }

  return links.join(', ');
}

function handler(event) {
  var request = event.request || {};
  var response = event.response;
  var headers = response.headers;
  var route = normalizeRouteFromRequestUri(request.uri || '/');
  var contentSecurityPolicy =
    "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self' https://www.facebook.com; frame-ancestors 'none'; upgrade-insecure-requests; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://nominatim.openstreetmap.org; script-src-elem 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://nominatim.openstreetmap.org; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' https://api.trypackai.com https://78o58odzab.execute-api.us-east-1.amazonaws.com https://auth.trypackai.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.facebook.com https://www.google.com https://www.recaptcha.net https://sentry.avs.io https://tsa-board.trypackai.com https://*.cloudfront.net https://nominatim.openstreetmap.org https://analytics.tiktok.com; frame-src 'self' https://www.google.com/recaptcha/ https://www.recaptcha.net/recaptcha/ https://www.googletagmanager.com https://www.facebook.com; font-src 'self' data: https://fonts.gstatic.com; worker-src 'self'; manifest-src 'self'; media-src 'self' https:;";

  headers['strict-transport-security'] = {
    value: 'max-age=63072000; includeSubDomains; preload',
  };
  headers['content-security-policy'] = {
    value: contentSecurityPolicy,
  };
  headers['x-content-type-options'] = { value: 'nosniff' };
  headers['x-frame-options'] = { value: 'DENY' };
  headers['x-xss-protection'] = { value: '0' };
  headers['x-permitted-cross-domain-policies'] = { value: 'none' };
  headers['x-download-options'] = { value: 'noopen' };
  headers['cross-origin-opener-policy'] = { value: 'same-origin' };
  headers['cross-origin-resource-policy'] = { value: 'same-origin' };
  headers['origin-agent-cluster'] = { value: '?1' };
  headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };
  headers['permissions-policy'] = {
    value: 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  };

  if (alternateMarkdownMap[route]) {
    headers.link = {
      value: buildLinkHeader(route),
    };
  }

  return response;
}
