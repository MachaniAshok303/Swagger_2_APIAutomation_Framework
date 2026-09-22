import { test as base } from '@playwright/test';
import { PetService } from '../services/pet/pet.service';
import { StoreService } from '../services/store/store.service';
import { UserService } from '../services/user/user.service';
import { BaseApiClient } from '../clients/baseApiClient';
import { TokenManager } from '../utils/tokenManager';

/**
 * Custom Playwright Fixture injecting all Domain Services and BaseApiClient directly into tests
 */
type ApiServices = {
  baseApiClient: BaseApiClient;
  tokenManager: typeof TokenManager;
  petService: PetService;
  storeService: StoreService;
  userService: UserService;
};

export const test = base.extend<ApiServices>({
  baseApiClient: async ({ request }, use) => {
    await use(new BaseApiClient(request));
  },
  tokenManager: async ({}, use) => {
    await use(TokenManager);
  },
  petService: async ({ request }, use) => {
    await use(new PetService(request));
  },
  storeService: async ({ request }, use) => {
    await use(new StoreService(request));
  },
  userService: async ({ request }, use) => {
    await use(new UserService(request));
  },
});

export { expect } from '@playwright/test';
