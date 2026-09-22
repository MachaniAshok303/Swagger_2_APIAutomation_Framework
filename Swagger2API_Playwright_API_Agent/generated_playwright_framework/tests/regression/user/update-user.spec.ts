import { test, expect } from '../../../src/fixtures/api.fixture';

test.describe('Update User Specification', () => {
  test('Skip: Endpoint does not support PUT/PATCH update', async () => {
    test.skip(true, 'User spec does not declare a PUT or PATCH endpoint');
  });
});
