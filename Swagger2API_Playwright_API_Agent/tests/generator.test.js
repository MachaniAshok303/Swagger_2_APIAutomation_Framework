const assert = require('assert');
const { parseSwaggerSpec } = require('../services/swaggerParser');
const { generatePlaywrightFramework } = require('../services/codeGenerator');
const { generatePostmanCollection } = require('../services/postmanGenerator');
const petstoreSpec = require('../sample_specs/petstore_v3.json');

console.log('🧪 Running Playwright Framework Generator Tests...');

const parsed = parseSwaggerSpec(petstoreSpec);
const framework = generatePlaywrightFramework(parsed, { includeSecurity: true, includeNegative: true });

// Test 1: File count and essential enterprise files
assert.ok(framework.files.length >= 15, 'Should generate enterprise framework files');

const paths = framework.files.map(f => f.path);
assert.ok(paths.includes('playwright.config.ts'), 'Must include playwright.config.ts');
assert.ok(paths.includes('package.json'), 'Must include package.json');
assert.ok(paths.includes('tsconfig.json'), 'Must include tsconfig.json');
assert.ok(paths.includes('src/clients/baseApiClient.ts'), 'Must include src/clients/baseApiClient.ts');
assert.ok(paths.includes('src/utils/tokenManager.ts'), 'Must include src/utils/tokenManager.ts');
assert.ok(paths.includes('src/fixtures/api.fixture.ts'), 'Must include src/fixtures/api.fixture.ts');
assert.ok(paths.includes('.github/workflows/api-tests.yml'), 'Must include CI/CD workflow');
assert.ok(paths.includes('config/environments/dev.config.ts'), 'Must include dev environment config');
assert.ok(paths.includes('config/environments/qa.config.ts'), 'Must include qa environment config');

// Test 2: BaseApiClient contains user requested methods
const baseClient = framework.files.find(f => f.path === 'src/clients/baseApiClient.ts');
assert.ok(baseClient.content.includes("class BaseApiClient"), 'Must export BaseApiClient');
assert.ok(baseClient.content.includes("async get(endpoint: string, options = {})"), 'Must include exact get signature');
assert.ok(baseClient.content.includes("async post(endpoint: string, payloadOrOptions: any = {}, options = {})"), 'Must include exact post signature');

// Test 3: Token Manager contains caching architecture
const tokenManager = framework.files.find(f => f.path === 'src/utils/tokenManager.ts');
assert.ok(tokenManager.content.includes("class TokenManager"), 'Must export TokenManager');
assert.ok(tokenManager.content.includes("cachedToken"), 'Must implement cachedToken');

// Test 4: Custom Playwright Fixture extends test
const apiFixture = framework.files.find(f => f.path === 'src/fixtures/api.fixture.ts');
assert.ok(apiFixture.content.includes("base.extend"), 'Fixture must extend Playwright test');

// Test 5: Playwright config includes Allure reporter
const pwConfig = framework.files.find(f => f.path === 'playwright.config.ts');
assert.ok(pwConfig.content.includes("allure-playwright"), 'Config must include allure-playwright reporter');

// Test 7: Sequential E2E Workflow generation
assert.ok(paths.includes('tests/e2e/e2e-workflow.spec.ts'), 'Must include tests/e2e/e2e-workflow.spec.ts');
const e2eSpec = framework.files.find(f => f.path === 'tests/e2e/e2e-workflow.spec.ts');
assert.ok(e2eSpec.content.includes("test.describe.serial"), 'E2E workflow must run sequentially with test.describe.serial');

// Test 8: Strategy options filtering
const filteredFramework = generatePlaywrightFramework(parsed, {
  includeSequentialE2E: true,
  includePositive: false,
  includeNegative: false,
  includeSecurity: false
});
const filteredPaths = filteredFramework.files.map(f => f.path);
assert.ok(filteredPaths.includes('tests/e2e/e2e-workflow.spec.ts'), 'Filtered must have e2e');
assert.ok(!filteredPaths.some(p => p.includes('smoke')), 'Filtered must omit smoke tests');
assert.ok(!filteredPaths.some(p => p.includes('negative')), 'Filtered must omit negative tests');
assert.ok(!filteredPaths.some(p => p.startsWith('tests/security')), 'Filtered must omit security tests');

// Test 9: Validated Auth Token injection
const authFramework = generatePlaywrightFramework(parsed, {
  validatedAuthToken: 'bearer-test-xyz-987'
});
const envFile = authFramework.files.find(f => f.path === '.env');
assert.ok(envFile.content.includes('AUTH_TOKEN=bearer-test-xyz-987'), 'Must inject validatedAuthToken into .env');

// Test 9b: Postman collection must not fall back to api.example.com when a real Swagger source URL is available
const placeholderServerSpec = {
  openapi: '3.0.0',
  info: { title: 'Template API', version: '1.0.0' },
  servers: [
    { url: 'https://api.example.com/api/v1' }
  ],
  paths: {
    '/Activities': {
      get: {
        tags: ['Activities'],
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
const postmanCollection = generatePostmanCollection(parsedPlaceholderServer);
const baseUrlVariable = postmanCollection.variable.find(v => v.key === 'baseUrl');
assert.strictEqual(baseUrlVariable.value, 'https://fakerestapi.azurewebsites.net/api/v1/', 'Postman collection must use the resolved Swagger source base URL');

// Test 10: Ajv Contract Validation in contract tests
const contractSpec = framework.files.find(f => f.path.includes('.contract.spec.ts'));
assert.ok(contractSpec, 'Must generate contract spec');
assert.ok(contractSpec.content.includes("import Ajv from 'ajv'"), 'Contract spec must import Ajv');
assert.ok(contractSpec.content.includes("ajv.compile("), 'Contract spec must compile schema with Ajv');
assert.ok(contractSpec.content.includes("expect(isValid).toBe(true)"), 'Contract spec must assert isValid with Ajv');

// Test 11: Sensitive Credential Masking in Logger
const loggerFile = framework.files.find(f => f.path === 'src/utils/logger.ts');
assert.ok(loggerFile.content.includes('***REDACTED***'), 'Logger must mask sensitive credentials');

// Test 12: Security BOLA Spec fixes unassigned variable bug
const bolaSpec = framework.files.find(f => f.path === 'tests/security/bola-idor.spec.ts');
assert.ok(bolaSpec, 'Must generate bola-idor spec');
assert.ok(!bolaSpec.content.includes('${sampleResource}'), 'BOLA spec must resolve sampleResource to a concrete endpoint name');

console.log('✅ Enterprise Framework & Postman Generator Tests Passed!');

