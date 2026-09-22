/**
 * TypeScript Data Model Interface for User
 */
export interface UserModel {
  id?: number;
  username?: string;
  email?: string;
  password?: string;
}

export interface CreateUserRequest extends UserModel {}
export interface UpdateUserRequest extends UserModel {}
