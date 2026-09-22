import { test, expect } from '../../../src/fixtures/api.fixture';

test.describe('Update Store Specification', () => {
  test('Skip: Endpoint does not support PUT/PATCH update', async () => {
    test.skip(true, 'Store spec does not declare a PUT or PATCH endpoint');
  });
});
