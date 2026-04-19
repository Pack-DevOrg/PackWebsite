function serializeQueryString(querystring) {
  var pairs = [];
  for (var key in querystring) {
    if (!Object.prototype.hasOwnProperty.call(querystring, key)) {
      continue;
    }
    var entry = querystring[key];
    if (entry.multiValue && entry.multiValue.length > 0) {
      for (var index = 0; index < entry.multiValue.length; index++) {
        var item = entry.multiValue[index];
        pairs.push(item.value ? key + '=' + item.value : key);
      }
      continue;
    }
    pairs.push(entry.value ? key + '=' + entry.value : key);
  }
  return pairs.length > 0 ? '?' + pairs.join('&') : '';
}

function hasFileExtension(uri) {
  return /\.[a-zA-Z0-9]+$/.test(uri);
}

function isAppShellRoute(uri) {
  return uri === '/app' || uri.indexOf('/app/') === 0;
}

function canonicalizeUri(uri) {
  if (uri === '/') {
    return '/';
  }
  return uri.endsWith('/') ? uri.slice(0, -1) : uri;
}

function redirect(url, statusCode, statusDescription) {
  return {
    statusCode: statusCode,
    statusDescription: statusDescription,
    headers: {
      location: { value: url },
      'cache-control': { value: 'public, max-age=300' },
    },
  };
}

function acceptsMarkdown(headers) {
  var acceptHeader = headers.accept;
  if (!acceptHeader || !acceptHeader.value) {
    return false;
  }

  return acceptHeader.value.toLowerCase().indexOf('text/markdown') !== -1;
}

var markdownRouteMap = {
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

function handler(event) {
  var request = event.request;
  var headers = request.headers || {};
  var hostHeader = headers.host || {};
  var host = hostHeader.value || '';
  var uri = request.uri || '/';
  var querySuffix = serializeQueryString(request.querystring || {});
  var canonicalUri = canonicalizeUri(uri);

  if (host === 'trypackai.com') {
    return redirect(
      'https://www.trypackai.com' + canonicalUri + querySuffix,
      301,
      'Moved Permanently'
    );
  }

  if (host === 'app.trypackai.com') {
    var canonicalAppPath = canonicalUri === '/' ? '/app' : canonicalUri;
    return redirect(
      'https://www.trypackai.com' + canonicalAppPath + querySuffix,
      302,
      'Found'
    );
  }

  if (host === 'app.itsdoneai.com') {
    if (uri === '/' || uri === '/verify') {
      return redirect('https://app.itsdoneai.com/app' + querySuffix, 302, 'Found');
    }
  }

  if (uri !== canonicalUri) {
    return redirect(
      'https://www.trypackai.com' + canonicalUri + querySuffix,
      301,
      'Moved Permanently'
    );
  }

  if (acceptsMarkdown(headers) && markdownRouteMap[canonicalUri]) {
    request.uri = markdownRouteMap[canonicalUri];
    return request;
  }

  if (uri === '/') {
    return request;
  }

  if (hasFileExtension(uri) || isAppShellRoute(uri)) {
    return request;
  }

  request.uri = uri + '/index.html';
  return request;
}
