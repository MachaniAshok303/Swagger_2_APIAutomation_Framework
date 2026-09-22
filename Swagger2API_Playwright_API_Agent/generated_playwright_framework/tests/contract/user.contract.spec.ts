import Ajv from 'ajv';
import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import { UserSchema } from '../../src/schemas/user.schema';
import testData from '../../test-data/user/valid-user.json';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(UserSchema);

test.describe('User Contract Validation Suite', () => {
  test('Response schema matches expected OpenAPI contract', async ({ userService }) => {
    test.info().annotations.push({ type: 'epic', description: 'Contract Testing' });
    test.info().annotations.push({ type: 'feature', description: 'User API Contract' });
    test.info().annotations.push({ type: 'story', description: 'Schema Validation - User' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    
    test.info().annotations.push({ type: 'description', description: 'Validates that the User API response schema matches the OpenAPI specification contract.' });
    const response = await userService.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED]).toContain(response.status());
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data).toBeDefined();
    const targetItem = Array.isArray(data) ? data[0] : data;
    if (targetItem) {
      const isValid = validate(targetItem);
      if (!isValid) {
        console.error('Contract Schema Validation Errors:', validate.errors);
      }
      expect(isValid).toBe(true);
    }
  });
});
