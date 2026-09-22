import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import testData from '../../test-data/store/valid-store.json';

test.describe('Store Smoke Tests', () => {
  test('Verify Store endpoint is healthy and reachable', async ({ storeService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Health' });
    test.info().annotations.push({ type: 'feature', description: 'Store Resource' });
    test.info().annotations.push({ type: 'story', description: 'Smoke - Endpoint Availability' });
    test.info().annotations.push({ type: 'severity', description: 'blocker' });
    test.info().annotations.push({ type: 'tag', description: 'smoke, store, health-check' });
    test.info().annotations.push({ type: 'description', description: 'Verifies that the Store API endpoint is healthy, reachable, and returns a 2xx status.' });
    const response = await storeService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
