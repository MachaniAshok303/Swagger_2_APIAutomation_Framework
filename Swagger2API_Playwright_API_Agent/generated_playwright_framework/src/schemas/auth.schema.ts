/**
 * JSON Validation Schema for Authentication Responses
 */
export const AuthTokenSchema = {
  type: 'object',
  required: ['accessToken'],
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    tokenType: { type: 'string' },
    expiresIn: { type: 'number' }
  }
};
