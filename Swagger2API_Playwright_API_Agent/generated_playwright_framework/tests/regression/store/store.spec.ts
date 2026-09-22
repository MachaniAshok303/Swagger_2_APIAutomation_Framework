import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/store/valid-store.json';

test.describe.serial('Store Full Regression CRUD Suite', () => {
  let createdId: number | string = (testData as any).id || (testData as any).username || (testData as any).ID || 1;



  test('Step 2: Create a new Store', async ({ storeService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Store Resource' });
    test.info().annotations.push({ type: 'story', description: 'POST - Create Store' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a valid POST request to the Store endpoint creates a resource and returns 200/201.' });
    const response = await storeService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED]).toContain(response.status());
    expect(response.ok()).toBe(true);

    try {
      const body = await response.json();
      if (body && (body.id || body.username || body.ID)) {
        createdId = body.id || body.username || body.ID;
      }
    } catch (e) {}
  });

  test('Step 3: Fetch Store by ID', async ({ storeService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Store Resource' });
    test.info().annotations.push({ type: 'story', description: 'GET by ID - Fetch Store' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a GET request with a valid ID returns the expected Store resource.' });
    const response = await storeService.fetchById(createdId);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });




});
