import { test, expect } from '@playwright/test';
import { HttpStatus } from '../../src/constants/httpStatus';
import { TokenManager } from '../../src/utils/tokenManager';

test.describe('Authentication Smoke Suite', () => {
  test('Verify TokenManager issues and caches access token', async () => {
    test.info().annotations.push({ type: 'epic', description: 'Security' });
    test.info().annotations.push({ type: 'feature', description: 'Authentication' });
    test.info().annotations.push({ type: 'story', description: 'Token Acquisition & Caching' });
    test.info().annotations.push({ type: 'severity', description: 'blocker' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies the TokenManager can acquire, cache, and reuse a valid access token.' });
    const token = await TokenManager.getAccessToken();
    expect(token).toBeTruthy();
    expect(TokenManager.hasValidToken()).toBe(true);

    // Reuse token test
    const cached = await TokenManager.getAccessToken();
    expect(cached).toBe(token);
  });
});
