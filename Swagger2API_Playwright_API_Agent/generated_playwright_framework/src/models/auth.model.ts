/**
 * Authentication Data Models
 */
export interface LoginCredentials {
  username?: string;
  email?: string;
  password?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

export interface OAuthTokenRequest {
  grant_type: string;
  client_id: string;
  client_secret: string;
  scope?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}
