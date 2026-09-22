import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/pet/valid-pet.json';

test.describe('Delete Pet Specification', () => {
  test('Should successfully delete Pet by ID', async ({ petService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Pet Resource' });
    test.info().annotations.push({ type: 'story', description: 'DELETE - Remove Pet' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies a DELETE request removes the Pet resource successfully.' });
    const targetId = (testData as any).id || (testData as any).username || (testData as any).ID || 1;
    const response = await petService.delete(targetId);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT, HttpStatus.NOT_FOUND]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
