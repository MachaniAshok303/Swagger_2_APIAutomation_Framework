import { APIRequestContext, APIResponse } from '@playwright/test';
import { PetClient } from '../../clients/petClient';
import { PetModel, CreatePetRequest, UpdatePetRequest } from '../../models/pet.model';

/**
 * Service Layer for Pet
 * Encapsulates domain business logic, data transformation, and invokes API Client.
 */
export class PetService {
  private client: PetClient;

  constructor(request: APIRequestContext) {
    this.client = new PetClient(request);
  }

  async fetchAll(): Promise<APIResponse> {
    return await this.client.getAll();
  }

  async fetchById(id: number | string): Promise<APIResponse> {
    return await this.client.getById(id);
  }

  async create(data: CreatePetRequest): Promise<APIResponse> {
    return await this.client.create(data);
  }

  async update(id: number | string, data: UpdatePetRequest): Promise<APIResponse> {
    return await this.client.update(id, data);
  }

  async delete(id: number | string): Promise<APIResponse> {
    return await this.client.delete(id);
  }
}
