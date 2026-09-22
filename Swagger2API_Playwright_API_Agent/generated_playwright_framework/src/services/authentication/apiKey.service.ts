/**
 * API Key Authentication Service
 */
export class ApiKeyService {
  static getHeaders(apiKey: string): Record<string, string> {
    return {
      'x-api-key': apiKey || process.env.API_KEY || 'default-api-key'
    };
  }
}
