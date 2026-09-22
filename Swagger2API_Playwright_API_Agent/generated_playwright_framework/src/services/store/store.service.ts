import { APIRequestContext, APIResponse } from '@playwright/test';
import { StoreClient } from '../../clients/storeClient';
import { StoreModel, CreateStoreRequest, UpdateStoreRequest } from '../../models/store.model';

/**
 * Service Layer for Store
 * Encapsulates domain business logic, data transformation, and invokes API Client.
 */
export class StoreService {
  private client: StoreClient;

  constructor(request: APIRequestContext) {
    this.client = new StoreClient(request);
  }

  async fetchAll(): Promise<APIResponse> {
    return await this.client.getAll();
  }

  async fetchById(id: number | string): Promise<APIResponse> {
    return await this.client.getById(id);
  }

  async create(data: CreateStoreRequest): Promise<APIResponse> {
    return await this.client.create(data);
  }

  async update(id: number | string, data: UpdateStoreRequest): Promise<APIResponse> {
    return await this.client.update(id, data);
  }

  async delete(id: number | string): Promise<APIResponse> {
    return await this.client.delete(id);
  }
}
