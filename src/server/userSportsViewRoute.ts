import type {IncomingMessage, ServerResponse} from 'node:http';
import {
  USER_SPORTS_VIEW_PATH,
  type SportsViewErrorCode,
  type SportsViewSource,
} from '@/api/sportsView';

export type SportsViewRouteResult = {
  readonly status: number;
  readonly body: unknown;
};

export type UserSportsViewRouteRequest = {
  readonly method: string | undefined;
  readonly path: string | undefined;
  readonly userId: string | null;
  readonly source: SportsViewSource | null;
};

function routePath(path: string | undefined): string {
  if (path === undefined) {
    return '';
  }
  const queryAt = path.indexOf('?');
  return queryAt === -1 ? path : path.slice(0, queryAt);
}

function failure(status: number, code: SportsViewErrorCode, message: string): SportsViewRouteResult {
  return {
    status,
    body: {
      success: false,
      status,
      error: {message, code},
    },
  };
}

/**
 * GET /user/sports-view. Status on the HTTP response and on the failure
 * envelope are the same number. The error code is one this read publishes.
 */
export function userSportsViewRouteResult(
  request: UserSportsViewRouteRequest,
): SportsViewRouteResult {
  if (routePath(request.path) !== USER_SPORTS_VIEW_PATH) {
    return failure(404, 'NOT_FOUND', 'Not found.');
  }
  if ((request.method ?? '').toUpperCase() !== 'GET') {
    return failure(405, 'METHOD_NOT_ALLOWED', 'Use GET.');
  }
  if (request.userId === null || request.userId.trim().length === 0) {
    return failure(401, 'UNAUTHENTICATED', 'Authentication required.');
  }
  if (request.source === null) {
    return failure(503, 'SPORTS_VIEW_UNAVAILABLE', 'Sports view failed.');
  }
  return {
    status: 200,
    body: {
      success: true,
      data: request.source,
    },
  };
}

export function userIdFromHeader(header: string | string[] | undefined): string | null {
  if (typeof header !== 'string') {
    return null;
  }
  const value = header.trim();
  return value.length === 0 ? null : value;
}

export function writeUserSportsViewRoute(
  request: IncomingMessage,
  response: ServerResponse,
  load: (userId: string) => SportsViewSource | null,
): void {
  const userId = userIdFromHeader(request.headers['x-pack-user']);
  const result = userSportsViewRouteResult({
    method: request.method,
    path: request.url,
    userId,
    source: userId === null ? null : load(userId),
  });
  response.statusCode = result.status;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(result.body));
}
