import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './baseApiClient';
import { UserModel } from '../models/user.model';

/**
 * API Client Layer for User
 * Maps domain endpoints and executes HTTP requests using BaseApiClient
 */
export class UserClient {
  private apiClient: BaseApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new BaseApiClient(request);
  }

  async getAll(id: number | string = 'user1'): Promise<APIResponse> {
    return await this.getById(id);
  }

  async getById(id: number | string): Promise<APIResponse> {
    return await this.apiClient.get(`/user/${id}`);
  }

  async create(data: UserModel): Promise<APIResponse> {
    return await this.apiClient.post('/user', { data });
  }

  async update(id: number | string, data: UserModel): Promise<APIResponse> {
    return await this.apiClient.put(`/user/${id}`, { data });
  }

  async delete(id: number | string): Promise<APIResponse> {
    return await this.apiClient.delete(`/user/${id}`);
  }
}
