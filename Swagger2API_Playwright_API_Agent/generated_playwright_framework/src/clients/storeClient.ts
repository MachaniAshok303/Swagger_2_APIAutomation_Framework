import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './baseApiClient';
import { StoreModel } from '../models/store.model';

/**
 * API Client Layer for Store
 * Maps domain endpoints and executes HTTP requests using BaseApiClient
 */
export class StoreClient {
  private apiClient: BaseApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new BaseApiClient(request);
  }

  async getAll(id: number | string = 10): Promise<APIResponse> {
    return await this.getById(id);
  }

  async getById(id: number | string): Promise<APIResponse> {
    return await this.apiClient.get(`/store/order/${id}`);
  }

  async create(data: StoreModel): Promise<APIResponse> {
    return await this.apiClient.post('/store/order', { data });
  }

  async update(id: number | string, data: StoreModel): Promise<APIResponse> {
    return await this.apiClient.put(`/store/order/${id}`, { data });
  }

  async delete(id: number | string): Promise<APIResponse> {
    return await this.apiClient.delete(`/store/order/${id}`);
  }
}
