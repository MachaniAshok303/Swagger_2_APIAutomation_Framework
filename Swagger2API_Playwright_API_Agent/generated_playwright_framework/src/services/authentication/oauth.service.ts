import { APIRequestContext } from '@playwright/test';
import { AuthClient } from '../../clients/authClient';
import { OAuthTokenResponse } from '../../models/auth.model';

/**
 * OAuth 2.0 Authentication Service
 * Handles Client Credentials, Authorization Code, and Refresh flows
 */
export class OAuthService {
  private authClient: AuthClient;

  constructor(request: APIRequestContext) {
    this.authClient = new AuthClient(request);
  }

  async getClientCredentialsToken(clientId: string, clientSecret: string): Promise<OAuthTokenResponse> {
    const response = await this.authClient.oauthToken({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    });
    return await response.json();
  }
}
