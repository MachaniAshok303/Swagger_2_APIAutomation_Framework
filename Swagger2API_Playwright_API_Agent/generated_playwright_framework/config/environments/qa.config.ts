export const config = {
  env: 'qa',
  baseUrl: process.env.BASE_URL || 'https://petstore.swagger.io/v2/',
  timeout: 30000,
  auth: {
    clientId: process.env.CLIENT_ID || 'qa-client-id',
    clientSecret: process.env.CLIENT_SECRET || 'qa-secret-key'
  }
};
