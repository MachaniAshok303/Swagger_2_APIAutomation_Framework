import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/store/valid-store.json';

test.describe('Create Store Specification', () => {
  test('Should successfully create a new Store with valid payload', async ({ storeService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Store Resource' });
    test.info().annotations.push({ type: 'story', description: 'POST - Create Store' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies a valid POST request creates a Store resource and returns 200/201.' });
    const response = await storeService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
