import { test as base } from '@playwright/test';
import { AuthManager } from '../services/authentication/authManager';

type AuthFixtures = {
  authToken: string;
};

export const test = base.extend<AuthFixtures>({
  authToken: async ({}, use) => {
    const token = await AuthManager.getAccessToken();
    await use(token);
  }
});

export { expect } from '@playwright/test';
