import { APIRequestContext, APIResponse } from '@playwright/test';
import { Logger } from '../utils/logger';

/**
 * Base API Client Layer
 * Encapsulates standard Playwright APIRequestContext HTTP operations.
 * Automatically normalizes endpoint paths relative to baseURL and wraps flat JSON payloads.
 */
export class BaseApiClient {

  constructor(private request: APIRequestContext) {}

  private cleanEndpoint(endpoint: string): string {
    return endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  }

  private normalizeEndpoint(endpoint: string): string {
    const clean = this.cleanEndpoint(endpoint);
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  private isAbsoluteUrl(endpoint: string): boolean {
    const normalized = String(endpoint || '').toLowerCase();
    return normalized.startsWith('http://') || normalized.startsWith('https://');
  }

  private buildFullUrl(endpoint: string): string {
    if (this.isAbsoluteUrl(endpoint)) return endpoint;
    const baseUrl = process.env.BASE_URL || '';
    if (!baseUrl) return this.normalizeEndpoint(endpoint);
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return new URL(this.cleanEndpoint(endpoint), normalizedBase).toString();
  }

  private prepareOptions(payloadOrOptions: any, extraOptions: any = {}): any {
    if (!payloadOrOptions) return extraOptions;
    if (typeof payloadOrOptions === 'object' && 'data' in payloadOrOptions && Object.keys(payloadOrOptions).length === 1) {
      return { ...payloadOrOptions, ...extraOptions };
    }
    if (typeof payloadOrOptions === 'object' && ('headers' in payloadOrOptions || 'params' in payloadOrOptions || 'timeout' in payloadOrOptions)) {
      return { ...payloadOrOptions, ...extraOptions };
    }
    return { data: payloadOrOptions, ...extraOptions };
  }

  private extractPayload(options: any): any {
    if (!options || typeof options !== 'object') return null;
    if ('data' in options) return options.data;
    if ('form' in options) return options.form;
    if ('multipart' in options) return '[multipart/form-data]';
    if ('params' in options) return options.params;
    return null;
  }

  private maskCredential(value: string): string {
    const trimmed = String(value || '').trim();
    if (!trimmed) return 'Not used';
    if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}***${trimmed.slice(-1)}`;
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
  }

  private detectTokenConsumed(options: any): string {
    const headers = options && typeof options === 'object' && options.headers && typeof options.headers === 'object'
      ? options.headers
      : {};
    const authorization = headers.Authorization || headers.authorization;
    const apiKeyHeaderName = process.env.API_KEY_HEADER || 'X-API-Key';
    const explicitApiKey = headers[apiKeyHeaderName] || headers[apiKeyHeaderName.toLowerCase()] || headers['x-api-key'];

    if (authorization) return this.maskCredential(String(authorization));
    if (explicitApiKey) return this.maskCredential(String(explicitApiKey));
    if (process.env.AUTH_TOKEN) return `Bearer ${this.maskCredential(process.env.AUTH_TOKEN)}`;
    if (process.env.BASIC_AUTH) return `Basic ${this.maskCredential(process.env.BASIC_AUTH)}`;
    if (process.env.API_KEY) return `${apiKeyHeaderName} ${this.maskCredential(process.env.API_KEY)}`;
    return 'Not used';
  }

  private async executeRequest(
    method: string,
    endpoint: string,
    reqOptions: any,
    sender: (cleanEndpoint: string, requestOptions: any) => Promise<APIResponse>
  ): Promise<APIResponse> {
    const clean = this.cleanEndpoint(endpoint);
    const trace: any = {
      method: method.toUpperCase(),
      endpoint: this.normalizeEndpoint(endpoint),
      urlType: this.isAbsoluteUrl(endpoint) ? 'absolute' : 'relative',
      fullUrl: this.buildFullUrl(endpoint),
      payloadSent: this.extractPayload(reqOptions),
      tokenConsumed: this.detectTokenConsumed(reqOptions)
    };

    Logger.request(trace.method, clean, reqOptions);
    const startedAt = Date.now();
    const response = await sender(clean, reqOptions);
    trace.statusCode = response.status();
    trace.responseTimeMs = Date.now() - startedAt;
    Logger.response(trace.method, clean, trace.statusCode);
    Logger.apiTrace(trace);
    return response;
  }

  async get(endpoint: string, options = {}): Promise<APIResponse> {
    return this.executeRequest('GET', endpoint, options, (clean, reqOptions) => this.request.get(clean, reqOptions));
  }

  async post(endpoint: string, payloadOrOptions: any = {}, options = {}): Promise<APIResponse> {
    const reqOptions = this.prepareOptions(payloadOrOptions, options);
    return this.executeRequest('POST', endpoint, reqOptions, (clean, requestOptions) => this.request.post(clean, requestOptions));
  }

  async put(endpoint: string, payloadOrOptions: any = {}, options = {}): Promise<APIResponse> {
    const reqOptions = this.prepareOptions(payloadOrOptions, options);
    return this.executeRequest('PUT', endpoint, reqOptions, (clean, requestOptions) => this.request.put(clean, requestOptions));
  }

  async patch(endpoint: string, payloadOrOptions: any = {}, options = {}): Promise<APIResponse> {
    const reqOptions = this.prepareOptions(payloadOrOptions, options);
    return this.executeRequest('PATCH', endpoint, reqOptions, (clean, requestOptions) => this.request.patch(clean, requestOptions));
  }

  async delete(endpoint: string, options = {}): Promise<APIResponse> {
    return this.executeRequest('DELETE', endpoint, options, (clean, reqOptions) => this.request.delete(clean, reqOptions));
  }
}
