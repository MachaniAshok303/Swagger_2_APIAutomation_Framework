import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/pet/valid-pet.json';

test.describe('Update Pet Specification', () => {
  test('Should successfully update existing Pet', async ({ petService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Pet Resource' });
    test.info().annotations.push({ type: 'story', description: 'PUT - Update Pet' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies a valid PUT/PATCH request updates an existing Pet and returns 200.' });
    const targetId = (testData as any).id || (testData as any).username || (testData as any).ID || 1;
    const response = await petService.update(targetId, { ...testData, status: 'modified' } as any);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
