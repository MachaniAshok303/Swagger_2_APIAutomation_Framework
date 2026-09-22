const assert = require('assert');
const { parseSwaggerSpec } = require('../services/swaggerParser');
const petstoreSpec = require('../sample_specs/petstore_v3.json');

console.log('🧪 Running Swagger Parser Unit Tests...');

// Test 1: Parses valid JSON spec
const parsed = parseSwaggerSpec(petstoreSpec);
assert.strictEqual(parsed.title, 'Swagger Petstore - OpenAPI 3.0', 'Title should match');
assert.strictEqual(parsed.version, '1.0.11', 'Version should match');
assert.strictEqual(parsed.totalEndpoints, 7, 'Should parse 7 endpoints');

// Test 2: Validates tag groups
assert.ok(parsed.tagGroups['Pet'], 'Should group by Pet tag');
assert.ok(parsed.tagGroups['Store'], 'Should group by Store tag');
assert.ok(parsed.tagGroups['User'], 'Should group by User tag');

// Test 3: Validates parameter parsing
const getPet = parsed.endpoints.find(e => e.operationId === 'getPetById');
assert.ok(getPet, 'getPetById operation should exist');
assert.strictEqual(getPet.parameters.path.length, 1, 'Should have 1 path param');
assert.strictEqual(getPet.parameters.path[0].name, 'petId');

// Test 4: Detects Authentication Requirements for Public Petstore Spec
assert.ok(parsed.authRequirement, 'Parsed spec must contain authRequirement');
assert.strictEqual(parsed.authRequirement.requiresAuth, false, 'Petstore sample spec has no security definitions and is classified as PUBLIC');
assert.strictEqual(parsed.authRequirement.authType, 'none', 'Petstore authType should be none');
assert.ok(parsed.authRequirement.probeEndpoint, 'Must designate a probe endpoint');

// Test 5: Detects Authenticated APIs with securitySchemes (Bearer Token / JWT)
const authSpec = {
  openapi: '3.0.0',
  info: { title: 'Authenticated Heroku Addons API', version: '3.0.0' },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/addons': {
      get: {
        summary: 'List addons',
        responses: { '200': { description: 'OK' } }
      }
    }
  }
};
const parsedAuth = parseSwaggerSpec(authSpec);
assert.strictEqual(parsedAuth.authRequirement.requiresAuth, true, 'Spec with securitySchemes must require auth');
assert.strictEqual(parsedAuth.authRequirement.authType, 'bearer', 'authType must be bearer');
assert.strictEqual(parsedAuth.authRequirement.probeEndpoint, '/addons', 'Probe endpoint should be /addons');

// Test 6: Detects API Key in header
const apiKeySpec = {
  swagger: '2.0',
  info: { title: 'Weather API', version: '1.0.0' },
  securityDefinitions: {
    api_key: {
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header'
    }
  },
  security: [{ api_key: [] }],
  paths: {
    '/current': {
      get: {
        summary: 'Get weather',
        responses: { '200': { description: 'OK' } }
      }
    }
  }
};
const parsedApiKey = parseSwaggerSpec(apiKeySpec);
assert.strictEqual(parsedApiKey.authRequirement.requiresAuth, true, 'API Key spec must require auth');
assert.strictEqual(parsedApiKey.authRequirement.authType, 'apiKey', 'authType must be apiKey');
assert.strictEqual(parsedApiKey.authRequirement.headerName, 'X-API-Key', 'headerName must be X-API-Key');

// Test 7: Detects endpoint-level security
const endpointSecSpec = {
  openapi: '3.0.0',
  info: { title: 'Mixed Auth API', version: '1.0.0' },
  paths: {
    '/public-health': {
      get: {
        summary: 'Health check',
        responses: { '200': { description: 'OK' } }
      }
    },
    '/secure-data': {
      get: {
        summary: 'Secure data',
        security: [{ oauth2: ['read'] }],
        responses: { '200': { description: 'OK' } }
      }
    }
  }
};
const parsedMixed = parseSwaggerSpec(endpointSecSpec);
assert.strictEqual(parsedMixed.authRequirement.requiresAuth, true, 'Spec with endpoint-level security must require auth');
assert.strictEqual(parsedMixed.authRequirement.endpointsWithSecurityCount, 1, 'Should track 1 endpoint with security');

// Test 8: Replaces placeholder OpenAPI server host with the real Swagger source origin
const placeholderServerSpec = {
  openapi: '3.0.0',
  info: { title: 'Template API', version: '1.0.0' },
  servers: [
    { url: 'https://api.example.com/api/v1' }
  ],
  paths: {
    '/Activities': {
      get: {
        summary: 'List activities',
        responses: { '200': { description: 'OK' } }
      }
    }
  }
};
const parsedPlaceholderServer = parseSwaggerSpec(
  placeholderServerSpec,
  'https://fakerestapi.azurewebsites.net/swagger/v1/swagger.json'
);
assert.strictEqual(
  parsedPlaceholderServer.baseUrl,
  'https://fakerestapi.azurewebsites.net/api/v1/',
  'Placeholder server hosts must be replaced with the real Swagger source origin while preserving the server path'
);

console.log('✅ Swagger Parser Tests Passed!');

