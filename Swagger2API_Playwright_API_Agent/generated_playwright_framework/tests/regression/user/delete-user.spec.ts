import { test, expect } from '../../../src/fixtures/api.fixture';

test.describe('Delete User Specification', () => {
  test('Skip: Endpoint does not support DELETE operation', async () => {
    test.skip(true, 'User spec does not declare a DELETE endpoint');
  });
});
