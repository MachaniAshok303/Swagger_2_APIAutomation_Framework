import { TokenManager } from '../../utils/tokenManager';

/**
 * Central Authentication Manager
 * Connects tests to Token Cache and provides ready-to-use authorization headers
 */
export class AuthManager {
  static async getAccessToken(): Promise<string> {
    return await TokenManager.getAccessToken();
  }

  static async getAuthHeader(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`
    };
  }
}
