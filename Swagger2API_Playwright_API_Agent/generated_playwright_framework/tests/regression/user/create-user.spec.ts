import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/user/valid-user.json';

test.describe('Create User Specification', () => {
  test('Should successfully create a new User with valid payload', async ({ userService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'User Resource' });
    test.info().annotations.push({ type: 'story', description: 'POST - Create User' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies a valid POST request creates a User resource and returns 200/201.' });
    const response = await userService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
