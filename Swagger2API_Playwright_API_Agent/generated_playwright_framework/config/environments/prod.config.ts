export const config = {
  env: 'prod',
  baseUrl: process.env.BASE_URL || 'https://petstore.swagger.io/v2/',
  timeout: 30000,
  auth: {
    clientId: process.env.CLIENT_ID || 'prod-client-id',
    clientSecret: process.env.CLIENT_SECRET || 'prod-secret-key'
  }
};
