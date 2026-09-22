import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/pet/valid-pet.json';

test.describe('Create Pet Specification', () => {
  test('Should successfully create a new Pet with valid payload', async ({ petService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Pet Resource' });
    test.info().annotations.push({ type: 'story', description: 'POST - Create Pet' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies a valid POST request creates a Pet resource and returns 200/201.' });
    const response = await petService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
