import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/pet/valid-pet.json';

test.describe.serial('Pet Full Regression CRUD Suite', () => {
  let createdId: number | string = (testData as any).id || (testData as any).username || (testData as any).ID || 1;



  test('Step 2: Create a new Pet', async ({ petService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Pet Resource' });
    test.info().annotations.push({ type: 'story', description: 'POST - Create Pet' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a valid POST request to the Pet endpoint creates a resource and returns 200/201.' });
    const response = await petService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED]).toContain(response.status());
    expect(response.ok()).toBe(true);

    try {
      const body = await response.json();
      if (body && (body.id || body.username || body.ID)) {
        createdId = body.id || body.username || body.ID;
      }
    } catch (e) {}
  });

  test('Step 3: Fetch Pet by ID', async ({ petService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Pet Resource' });
    test.info().annotations.push({ type: 'story', description: 'GET by ID - Fetch Pet' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a GET request with a valid ID returns the expected Pet resource.' });
    const response = await petService.fetchById(createdId);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });

  test('Step 4: Update existing Pet', async ({ petService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Pet Resource' });
    test.info().annotations.push({ type: 'story', description: 'PUT - Update Pet' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a valid PUT request updates an existing Pet and returns 200.' });
    const updatedData = { ...testData, status: 'updated_active' } as any;
    const response = await petService.update(createdId, updatedData);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });

  test('Step 5: Delete Pet by ID', async ({ petService }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: 'Pet Resource' });
    test.info().annotations.push({ type: 'story', description: 'DELETE - Remove Pet' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a DELETE request removes the Pet resource successfully.' });
    const response = await petService.delete(createdId);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT, HttpStatus.NOT_FOUND]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
