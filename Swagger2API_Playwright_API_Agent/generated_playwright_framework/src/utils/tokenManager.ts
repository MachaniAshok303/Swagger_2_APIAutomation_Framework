/**
 * Token Manager with In-Memory Caching Architecture
 * Implements Token Cache pattern:
 * Check Token -> Is token valid?
 *   YES -> Reuse cached token
 *   NO  -> Generate fresh token & update cache
 */
export class TokenManager {
  private static cachedToken: string | null = null;
  private static expiresAt: number = 0;

  /**
   * Retrieves a valid cached access token, or requests a fresh one if expired.
   */
  static async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && now < this.expiresAt) {
      return this.cachedToken;
    }

    // Refresh or retrieve token
    const freshToken = process.env.AUTH_TOKEN || `bearer-token-${now}`;
    this.cachedToken = freshToken;
    // Cache valid for 55 minutes
    this.expiresAt = now + (55 * 60 * 1000);
    return freshToken;
  }

  /**
   * Checks if current cached token is valid
   */
  static hasValidToken(): boolean {
    return Boolean(this.cachedToken && Date.now() < this.expiresAt);
  }

  /**
   * Invalidates token (useful for negative/unauthorized security tests)
   */
  static invalidate(): void {
    this.cachedToken = null;
    this.expiresAt = 0;
  }
}
