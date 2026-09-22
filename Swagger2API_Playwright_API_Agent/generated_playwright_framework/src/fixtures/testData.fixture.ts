import { test as base } from '@playwright/test';
import { FileUtils } from '../utils/fileUtils';

type TestDataFixtures = {
  securityPayloads: any;
};

export const test = base.extend<TestDataFixtures>({
  securityPayloads: async ({}: any, use: any) => {
    const payloads = FileUtils.readJson('./test-data/security/security-payloads.json');
    await use(payloads);
  }
});

export { expect } from '@playwright/test';
