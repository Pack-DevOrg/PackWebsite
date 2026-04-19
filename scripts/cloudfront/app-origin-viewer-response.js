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

  headers['strict-transport-security'] = {
    value: 'max-age=63072000; includeSubDomains; preload',
  };
  headers['content-security-policy'] = {
    value:
      "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https:; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: https://tsa-board.trypackai.com; frame-src 'self' https://www.google.com/recaptcha/ https://*.google.com; font-src 'self' data: https:;",
  };
  headers['x-content-type-options'] = { value: 'nosniff' };
  headers['x-frame-options'] = { value: 'DENY' };
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
