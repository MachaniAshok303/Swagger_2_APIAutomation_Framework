import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import testData from '../../test-data/pet/valid-pet.json';

test.describe('Pet Smoke Tests', () => {
  test('Verify Pet endpoint is healthy and reachable', async ({ petService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Health' });
    test.info().annotations.push({ type: 'feature', description: 'Pet Resource' });
    test.info().annotations.push({ type: 'story', description: 'Smoke - Endpoint Availability' });
    test.info().annotations.push({ type: 'severity', description: 'blocker' });
    test.info().annotations.push({ type: 'tag', description: 'smoke, pet, health-check' });
    test.info().annotations.push({ type: 'description', description: 'Verifies that the Pet API endpoint is healthy, reachable, and returns a 2xx status.' });
    const response = await petService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
