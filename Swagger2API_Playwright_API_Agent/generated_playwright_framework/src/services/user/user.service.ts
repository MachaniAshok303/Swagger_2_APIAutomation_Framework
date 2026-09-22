import { APIRequestContext, APIResponse } from '@playwright/test';
import { UserClient } from '../../clients/userClient';
import { UserModel, CreateUserRequest, UpdateUserRequest } from '../../models/user.model';

/**
 * Service Layer for User
 * Encapsulates domain business logic, data transformation, and invokes API Client.
 */
export class UserService {
  private client: UserClient;

  constructor(request: APIRequestContext) {
    this.client = new UserClient(request);
  }

  async fetchAll(): Promise<APIResponse> {
    return await this.client.getAll();
  }

  async fetchById(id: number | string): Promise<APIResponse> {
    return await this.client.getById(id);
  }

  async create(data: CreateUserRequest): Promise<APIResponse> {
    return await this.client.create(data);
  }

  async update(id: number | string, data: UpdateUserRequest): Promise<APIResponse> {
    return await this.client.update(id, data);
  }

  async delete(id: number | string): Promise<APIResponse> {
    return await this.client.delete(id);
  }
}
