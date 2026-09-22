/**
 * TypeScript Data Model Interface for Store
 */
export interface StoreModel {
  id?: number;
  petId?: number;
  quantity?: number;
  status?: string;
  complete?: boolean;
}

export interface CreateStoreRequest extends StoreModel {}
export interface UpdateStoreRequest extends StoreModel {}
