import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './baseApiClient';
import { LoginCredentials, OAuthTokenRequest } from '../models/auth.model';

/**
 * Dedicated Client for Authentication Endpoints
 */
export class AuthClient {
  private apiClient: BaseApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new BaseApiClient(request);
  }

  async login(credentials: LoginCredentials): Promise<APIResponse> {
    return await this.apiClient.post('/api/auth/login', { data: credentials });
  }

  async refreshToken(refreshToken: string): Promise<APIResponse> {
    return await this.apiClient.post('/api/auth/refresh', { data: { refreshToken } });
  }

  async oauthToken(body: OAuthTokenRequest): Promise<APIResponse> {
    return await this.apiClient.post('/oauth/token', { data: body });
  }

  async logout(): Promise<APIResponse> {
    return await this.apiClient.post('/api/auth/logout');
  }
}
