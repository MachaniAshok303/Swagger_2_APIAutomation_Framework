import { test, expect } from '../../../src/fixtures/api.fixture';

test.describe('Delete Store Specification', () => {
  test('Skip: Endpoint does not support DELETE operation', async () => {
    test.skip(true, 'Store spec does not declare a DELETE endpoint');
  });
});
