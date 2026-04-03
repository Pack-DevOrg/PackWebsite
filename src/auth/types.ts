export interface AuthenticatedUser {
  readonly sub: string;
  readonly email?: string;
  readonly name?: string;
  readonly givenName?: string;
  readonly familyName?: string;
  readonly picture?: string;
  readonly updatedAt?: string;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly idToken: string;
  readonly refreshToken: string;
  readonly tokenType: string;
  readonly issuedAt: number;
  readonly accessTokenExpiresAt: number;
  readonly refreshTokenExpiresAt?: number | null;
}

export interface AuthSession {
  readonly tokens: AuthTokens;
}

export interface AuthLoginCompletion {
  readonly redirectPath: string | null;
  readonly accessToken: string;
  readonly idToken: string;
  readonly tokenType: string;
}

export interface PendingPkceSession {
  readonly state: string;
  readonly verifier: string;
  readonly createdAt: number;
  readonly redirectPath?: string;
  readonly redirectUri?: string;
}
