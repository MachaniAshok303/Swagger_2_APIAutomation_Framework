import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/user/valid-user.json';

test.describe.serial('User Full Regression CRUD Suite', () => {
  let createdId: number | string = (testData as any).id || (testData as any).username || (testData as any).ID || 1;



  test('Step 2: Create a new User', async ({ userService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'User Resource' });
    test.info().annotations.push({ type: 'story', description: 'POST - Create User' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a valid POST request to the User endpoint creates a resource and returns 200/201.' });
    const response = await userService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED]).toContain(response.status());
    expect(response.ok()).toBe(true);

    try {
      const body = await response.json();
      if (body && (body.id || body.username || body.ID)) {
        createdId = body.id || body.username || body.ID;
      }
    } catch (e) {}
  });






});
