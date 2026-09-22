/**
 * TypeScript Data Model Interface for Pet
 */
export interface PetModel {
  id?: number;
  name?: string;
  status?: string;
}

export interface CreatePetRequest extends PetModel {}
export interface UpdatePetRequest extends PetModel {}
