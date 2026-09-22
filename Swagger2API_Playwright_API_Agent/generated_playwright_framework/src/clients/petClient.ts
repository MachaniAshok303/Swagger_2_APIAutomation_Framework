import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './baseApiClient';
import { PetModel } from '../models/pet.model';

/**
 * API Client Layer for Pet
 * Maps domain endpoints and executes HTTP requests using BaseApiClient
 */
export class PetClient {
  private apiClient: BaseApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new BaseApiClient(request);
  }

  async getAll(id: number | string = 10): Promise<APIResponse> {
    return await this.getById(id);
  }

  async getById(id: number | string): Promise<APIResponse> {
    return await this.apiClient.get(`/pet/${id}`);
  }

  async create(data: PetModel): Promise<APIResponse> {
    return await this.apiClient.post('/pet', { data });
  }

  async update(id: number | string, data: PetModel): Promise<APIResponse> {
    return await this.apiClient.put(`/pet`, { data });
  }

  async delete(id: number | string): Promise<APIResponse> {
    return await this.apiClient.delete(`/pet/${id}`);
  }
}
