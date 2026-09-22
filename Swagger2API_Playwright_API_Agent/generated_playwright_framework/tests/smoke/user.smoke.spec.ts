import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import testData from '../../test-data/user/valid-user.json';

test.describe('User Smoke Tests', () => {
  test('Verify User endpoint is healthy and reachable', async ({ userService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Health' });
    test.info().annotations.push({ type: 'feature', description: 'User Resource' });
    test.info().annotations.push({ type: 'story', description: 'Smoke - Endpoint Availability' });
    test.info().annotations.push({ type: 'severity', description: 'blocker' });
    test.info().annotations.push({ type: 'tag', description: 'smoke, user, health-check' });
    test.info().annotations.push({ type: 'description', description: 'Verifies that the User API endpoint is healthy, reachable, and returns a 2xx status.' });
    const response = await userService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
