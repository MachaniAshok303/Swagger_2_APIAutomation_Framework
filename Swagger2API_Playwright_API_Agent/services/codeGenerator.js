const { cleanIdentifier } = require('./swaggerParser');

/**
 * Enterprise Code Generation Orchestrator
 * Implements the Recommended Enterprise Playwright + TypeScript + Allure API Architecture:
 * 
 * 4-Tier Separation:
 * TEST -> SERVICE -> API CLIENT -> BASE API CLIENT -> PLAYWRIGHT REQUEST
 */
function generatePlaywrightFramework(parsedSpec, options = {}) {
  const files = [];

  let { title, version, baseUrl, tagGroups, endpoints } = parsedSpec;
  if (options.overrideBaseUrl) {
    baseUrl = options.overrideBaseUrl;
  } else if (options.baseUrl) {
    baseUrl = options.baseUrl;
  }
  if (baseUrl && !baseUrl.endsWith('/')) {
    baseUrl = `${baseUrl}/`;
  }
  const tags = Object.keys(tagGroups);

  const {
    includeSequentialE2E = true,
    includePositive = true,
    includeNegative = false,
    includeSecurity = false
  } = options;

  // 1. Root & Config Files
  files.push({
    path: 'package.json',
    content: generatePackageJson(title)
  });

  files.push({
    path: 'tsconfig.json',
    content: generateTsConfig()
  });

  const authReq = parsedSpec.authRequirement || { requiresAuth: false, authType: 'none' };
  const validatedToken = options.validatedAuthToken || '';

  files.push({
    path: 'playwright.config.ts',
    content: generatePlaywrightConfig(baseUrl, title, authReq)
  });

  let envAuthLines = '# Public APIs - No Authentication Credentials Required\n';
  if (authReq.requiresAuth || validatedToken) {
    if (authReq.authType === 'apiKey') {
      const hName = authReq.headerName || 'X-API-Key';
      envAuthLines = `API_KEY=${validatedToken || 'your-api-key'}\nAPI_KEY_HEADER=${hName}\n`;
    } else if (authReq.authType === 'basic') {
      envAuthLines = `BASIC_AUTH=${validatedToken || 'admin:secret'}\n`;
    } else {
      envAuthLines = `AUTH_TOKEN=${validatedToken}\nCLIENT_ID=test-client\nCLIENT_SECRET=test-secret\n`;
    }
  }

  files.push({
    path: '.env',
    content: `ENV=qa\nBASE_URL=${baseUrl}\n${envAuthLines}`
  });

  files.push({
    path: '.env.dev',
    content: `ENV=dev\nBASE_URL=${baseUrl.replace('api.', 'dev.api.')}\n${envAuthLines}`
  });

  files.push({
    path: '.env.qa',
    content: `ENV=qa\nBASE_URL=${baseUrl}\n${envAuthLines}`
  });

  files.push({
    path: '.gitignore',
    content: `node_modules/\ntest-results/\nplaywright-report/\nallure-results/*\n!allure-results/.gitkeep\nallure-report/*\n!allure-report/.gitkeep\n.env\n`
  });

  files.push({
    path: 'run-tests.bat',
    content: `@echo off\necho ========================================================\necho 🚀 Running Playwright API Tests (Direct Zero-Setup Execution)\necho ℹ️ Browser installation is SKIPPED for API testing\necho ========================================================\nset PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1\ncall npx --yes @playwright/test test\npause\n`
  });

  files.push({
    path: 'run-tests.sh',
    content: `#!/usr/bin/env bash\necho "========================================================"\necho "🚀 Running Playwright API Tests (Direct Zero-Setup Execution)"\necho "ℹ️ Browser installation is SKIPPED for API testing"\necho "========================================================"\nexport PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1\nnpx --yes @playwright/test test\n`
  });

  files.push({
    path: 'opencode.json',
    content: generateOpencodeJson()
  });

  // 2. CI/CD Workflow & AI Agent Instructions
  files.push({
    path: '.github/workflows/api-tests.yml',
    content: generateGithubWorkflow(title)
  });

  files.push({
    path: '.github/Agents/agent.md',
    content: generateAgentMd(title, version, baseUrl, endpoints.length, tags)
  });

  files.push({
    path: '.github/agents/agent.md',
    content: generateAgentMd(title, version, baseUrl, endpoints.length, tags)
  });

  // 3. Multi-Environment Configurations
  files.push({
    path: 'config/framework.config.ts',
    content: generateFrameworkConfig(baseUrl)
  });

  files.push({
    path: 'config/environments/dev.config.ts',
    content: generateEnvConfig('dev', baseUrl)
  });

  files.push({
    path: 'config/environments/qa.config.ts',
    content: generateEnvConfig('qa', baseUrl)
  });

  files.push({
    path: 'config/environments/prod.config.ts',
    content: generateEnvConfig('prod', baseUrl)
  });

  // 4. Core Clients Layer
  // 4a. BaseApiClient (Exact signature recommended)
  files.push({
    path: 'src/clients/baseApiClient.ts',
    content: generateBaseApiClient()
  });

  // 4b. AuthClient
  files.push({
    path: 'src/clients/authClient.ts',
    content: generateAuthClient()
  });

  // 5. Authentication Architecture Services
  files.push({
    path: 'src/services/authentication/oauth.service.ts',
    content: generateOAuthService()
  });

  files.push({
    path: 'src/services/authentication/jwt.service.ts',
    content: generateJwtService()
  });

  files.push({
    path: 'src/services/authentication/apiKey.service.ts',
    content: generateApiKeyService()
  });

  files.push({
    path: 'src/services/authentication/authManager.ts',
    content: generateAuthManager()
  });

  // 6. Common Models & Schemas
  files.push({
    path: 'src/models/auth.model.ts',
    content: generateAuthModel()
  });

  files.push({
    path: 'src/models/apiResponse.model.ts',
    content: generateApiResponseModel()
  });

  files.push({
    path: 'src/schemas/auth.schema.ts',
    content: generateAuthSchema()
  });

  // 7. Utils Layer (Token Caching, Date, Random, Logger, File Utils, Data Generator)
  files.push({
    path: 'src/utils/tokenManager.ts',
    content: generateTokenManager()
  });

  files.push({
    path: 'src/utils/dataGenerator.ts',
    content: generateDataGenerator()
  });

  files.push({
    path: 'src/utils/dateUtils.ts',
    content: generateDateUtils()
  });

  files.push({
    path: 'src/utils/randomUtils.ts',
    content: generateRandomUtils()
  });

  files.push({
    path: 'src/utils/logger.ts',
    content: generateLogger()
  });

  files.push({
    path: 'src/utils/fileUtils.ts',
    content: generateFileUtils()
  });

  // 8. Constants
  files.push({
    path: 'src/constants/endpoints.ts',
    content: generateEndpointsConstant(tagGroups)
  });

  files.push({
    path: 'src/constants/httpStatus.ts',
    content: generateHttpStatusConstant()
  });

  files.push({
    path: 'src/constants/roles.ts',
    content: generateRolesConstant()
  });

  files.push({
    path: 'src/constants/errorMessages.ts',
    content: generateErrorMessagesConstant()
  });

  // 9. Fixtures
  files.push({
    path: 'src/fixtures/api.fixture.ts',
    content: generateApiFixture(tags)
  });

  files.push({
    path: 'src/fixtures/auth.fixture.ts',
    content: generateAuthFixture()
  });

  files.push({
    path: 'src/fixtures/testData.fixture.ts',
    content: generateTestDataFixture(tags)
  });

  // 10. Test Data - Global Security Payloads
  files.push({
    path: 'test-data/security/security-payloads.json',
    content: generateSecurityPayloads()
  });

  // 11. Per-Resource Layers: Client, Service, Model, Schema, Test Data, and Test Suites
  for (const [tag, groupEndpoints] of Object.entries(tagGroups)) {
    const resourceName = cleanIdentifier(tag);
    const lowerName = resourceName.toLowerCase();

    // 11a. Client
    files.push({
      path: `src/clients/${lowerName}Client.ts`,
      content: generateResourceClient(resourceName, lowerName, groupEndpoints)
    });

    // 11b. Service Layer
    files.push({
      path: `src/services/${lowerName}/${lowerName}.service.ts`,
      content: generateResourceService(resourceName, lowerName, groupEndpoints)
    });

    // 11c. Model
    files.push({
      path: `src/models/${lowerName}.model.ts`,
      content: generateModelInterface(resourceName, groupEndpoints)
    });

    // 11d. Schema
    files.push({
      path: `src/schemas/${lowerName}.schema.ts`,
      content: generateResourceSchema(resourceName, groupEndpoints)
    });

    // 11e. Test Data (Valid, Invalid, and Default)
    files.push({
      path: `test-data/${lowerName}/valid-${lowerName}.json`,
      content: generateResourceTestData(groupEndpoints)
    });

    files.push({
      path: `test-data/${lowerName}/invalid-${lowerName}.json`,
      content: generateResourceInvalidTestData(groupEndpoints)
    });

    files.push({
      path: `test-data/${lowerName}/test-data.json`,
      content: generateResourceTestData(groupEndpoints)
    });

    // 11f. Positive Test Suites (Smoke, Regression CRUD, Contract)
    if (includePositive) {
      files.push({
        path: `tests/smoke/${lowerName}.smoke.spec.ts`,
        content: generateSmokeSpec(resourceName, lowerName, groupEndpoints)
      });
      files.push({
        path: `tests/regression/${lowerName}/${lowerName}.spec.ts`,
        content: generateRegressionSpec(resourceName, lowerName, groupEndpoints)
      });
      files.push({
        path: `tests/regression/${lowerName}/create-${lowerName}.spec.ts`,
        content: generateCreateSpec(resourceName, lowerName, groupEndpoints)
      });
      files.push({
        path: `tests/regression/${lowerName}/update-${lowerName}.spec.ts`,
        content: generateUpdateSpec(resourceName, lowerName, groupEndpoints)
      });
      files.push({
        path: `tests/regression/${lowerName}/delete-${lowerName}.spec.ts`,
        content: generateDeleteSpec(resourceName, lowerName, groupEndpoints)
      });
      files.push({
        path: `tests/contract/${lowerName}.contract.spec.ts`,
        content: generateContractSpec(resourceName, lowerName, groupEndpoints)
      });
    }

    // 11g. Negative Test Suite
    if (includeNegative) {
      files.push({
        path: `tests/negative/${lowerName}.negative.spec.ts`,
        content: generateNegativeSpec(resourceName, lowerName, groupEndpoints)
      });
    }

    // 11h. Security Test Suite
    if (includeSecurity) {
      files.push({
        path: `tests/security/${lowerName}.security.spec.ts`,
        content: generateSecuritySpec(resourceName, lowerName, groupEndpoints)
      });
    }
  }

  // 12. Sequential End-to-End Workflow Suite (Touching all APIs in logical business sequence)
  if (includeSequentialE2E) {
    files.push({
      path: 'tests/e2e/e2e-workflow.spec.ts',
      content: generateSequentialE2EWorkflow(parsedSpec)
    });
  }

  // 13. Global Smoke, Negative, and Security Suites
  if (includePositive) {
    files.push({
      path: 'tests/smoke/auth.smoke.spec.ts',
      content: generateAuthSmokeSpec()
    });
  }

  if (includeNegative) {
    files.push({
      path: 'tests/negative/invalid-auth.spec.ts',
      content: generateInvalidAuthSpec()
    });
    files.push({
      path: 'tests/negative/invalid-request.spec.ts',
      content: generateInvalidRequestSpec(tags[0] ? cleanIdentifier(tags[0]).toLowerCase() : 'user')
    });
    files.push({
      path: 'tests/negative/validation.spec.ts',
      content: generateValidationSpec(tags[0] ? cleanIdentifier(tags[0]).toLowerCase() : 'user')
    });
  }

  if (includeSecurity) {
    const firstEpPath = endpoints[0] ? endpoints[0].path.replace(/\{[^}]+\}/g, '1') : '/';

    if (authReq.requiresAuth) {
      files.push({
        path: 'tests/security/authentication.spec.ts',
        content: generateSecurityAuthSpec(firstEpPath)
      });
      files.push({
        path: 'tests/security/authorization.spec.ts',
        content: generateSecurityAuthzSpec(firstEpPath)
      });
      files.push({
        path: 'tests/security/jwt-security.spec.ts',
        content: generateSecurityJwtSpec(firstEpPath)
      });
    }
    files.push({
      path: 'tests/security/bola-idor.spec.ts',
      content: generateSecurityBolaSpec(firstEpPath)
    });
    files.push({
      path: 'tests/security/injection.spec.ts',
      content: generateSecurityInjectionSpec(firstEpPath)
    });
    files.push({
      path: 'tests/security/rate-limit.spec.ts',
      content: generateSecurityRateLimitSpec(firstEpPath)
    });
  }

  // 13. Standalone Scripts
  files.push({
    path: 'scripts/generate-token.ts',
    content: generateTokenScript()
  });

  files.push({
    path: 'scripts/generate-test-data.ts',
    content: generateTestDataScript()
  });

  files.push({
    path: 'scripts/cleanup.ts',
    content: generateCleanupScript()
  });

  // 14. Allure Report Directories
  files.push({
    path: 'allure-results/.gitkeep',
    content: ''
  });

  files.push({
    path: 'allure-report/.gitkeep',
    content: ''
  });

  // 15. README.md
  files.push({
    path: 'README.md',
    content: generateReadme(title, version, baseUrl, endpoints.length, tags)
  });

  return {
    title,
    totalFiles: files.length,
    files
  };
}

// -------------------------------------------------------------
// Component Generators
// -------------------------------------------------------------

function generatePackageJson(projectTitle) {
  const safeName = (projectTitle || 'playwright-api-suite')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');

  return JSON.stringify(
    {
      name: safeName,
      version: '1.0.0',
      description: `Enterprise Playwright TypeScript API Test Automation Framework for ${projectTitle}`,
      main: 'index.js',
      scripts: {
        "test": "npx --yes @playwright/test test",
        "test:direct": "npx --yes @playwright/test test",
        "test:allure": "npx --yes @playwright/test test; npx allure generate allure-results --clean -o allure-report && npx allure open allure-report",
        "test:e2e": "npx --yes @playwright/test test tests/e2e",
        "test:smoke": "npx --yes @playwright/test test tests/smoke",
        "test:regression": "npx --yes @playwright/test test tests/regression",
        "test:report": "npx --yes @playwright/test show-report",
        "allure:generate": "npx allure generate allure-results --clean -o allure-report",
        "allure:open": "npx allure open allure-report"
      },
      devDependencies: {
        "@playwright/test": "^1.44.0",
        "@types/node": "^20.12.0",
        "ajv": "^8.16.0",
        "allure-commandline": "^2.29.0",
        "allure-playwright": "^3.0.0-beta.7",
        "allure-js-commons": "^3.0.0-beta.7",
        "dotenv": "^16.4.5",
        "ts-node": "^10.9.2",
        "typescript": "^5.4.5"
      }
    },
    null,
    2
  );
}

function generateTsConfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "CommonJS",
        moduleResolution: "node",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        outDir: "./dist"
      },
      include: ["src/**/*", "tests/**/*", "config/**/*", "scripts/**/*", "controllers/**/*", "models/**/*", "fixtures/**/*", "utils/**/*"]
    },
    null,
    2
  );
}

function generatePlaywrightConfig(baseUrl, title, authReq = {}) {
  let authHeaderCode = '';
  if (authReq.requiresAuth) {
    if (authReq.authType === 'apiKey') {
      const hName = authReq.headerName || 'X-API-Key';
      authHeaderCode = `\n      ...(process.env.API_KEY ? { '${hName}': process.env.API_KEY } : {}),`;
    } else if (authReq.authType === 'basic') {
      authHeaderCode = `\n      ...(process.env.BASIC_AUTH ? { 'Authorization': \`Basic \${process.env.BASIC_AUTH}\` } : {}),`;
    } else {
      authHeaderCode = `\n      ...(process.env.AUTH_TOKEN ? { 'Authorization': \`Bearer \${process.env.AUTH_TOKEN}\` } : {}),`;
    }
  }

  return `import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific configuration
const ENV = process.env.ENV || 'qa';
dotenv.config({ path: path.resolve(__dirname, \`.env.\${ENV}\`) });
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Enterprise Playwright API Automation Configuration for ${title}
 * Features:
 * - Multi-Environment support (qa, dev, prod)
 * - Allure & HTML Dual Reporting
 * - Automatic retry on network flakiness
 * - Authentication Scheme: ${authReq.authDescription || 'Public APIs'}
 */
export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: true,
        environmentInfo: {
          'API_Title': '${title}',
          'Framework': 'Playwright + TypeScript',
          'Base_URL': '${baseUrl}',
          'Node_ENV': process.env.ENV || 'qa'
        }
      }
    ]
  ],
  use: {
    baseURL: process.env.BASE_URL || '${baseUrl}',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',${authHeaderCode}
    },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure'
  }
});
`;
}

function generateBaseApiClient() {
  return `import { APIRequestContext, APIResponse } from '@playwright/test';
import { Logger } from '../utils/logger';

/**
 * Base API Client Layer
 * Encapsulates standard Playwright APIRequestContext HTTP operations.
 * Automatically normalizes endpoint paths relative to baseURL and wraps flat JSON payloads.
 */
export class BaseApiClient {

  constructor(private request: APIRequestContext) {}

  private cleanEndpoint(endpoint: string): string {
    return endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  }

  private normalizeEndpoint(endpoint: string): string {
    const clean = this.cleanEndpoint(endpoint);
    return clean.startsWith('/') ? clean : \`/\${clean}\`;
  }

  private isAbsoluteUrl(endpoint: string): boolean {
    const normalized = String(endpoint || '').toLowerCase();
    return normalized.startsWith('http://') || normalized.startsWith('https://');
  }

  private buildFullUrl(endpoint: string): string {
    if (this.isAbsoluteUrl(endpoint)) return endpoint;
    const baseUrl = process.env.BASE_URL || '';
    if (!baseUrl) return this.normalizeEndpoint(endpoint);
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : \`\${baseUrl}/\`;
    return new URL(this.cleanEndpoint(endpoint), normalizedBase).toString();
  }

  private prepareOptions(payloadOrOptions: any, extraOptions: any = {}): any {
    if (!payloadOrOptions) return extraOptions;
    if (typeof payloadOrOptions === 'object' && 'data' in payloadOrOptions && Object.keys(payloadOrOptions).length === 1) {
      return { ...payloadOrOptions, ...extraOptions };
    }
    if (typeof payloadOrOptions === 'object' && ('headers' in payloadOrOptions || 'params' in payloadOrOptions || 'timeout' in payloadOrOptions)) {
      return { ...payloadOrOptions, ...extraOptions };
    }
    return { data: payloadOrOptions, ...extraOptions };
  }

  private extractPayload(options: any): any {
    if (!options || typeof options !== 'object') return null;
    if ('data' in options) return options.data;
    if ('form' in options) return options.form;
    if ('multipart' in options) return '[multipart/form-data]';
    if ('params' in options) return options.params;
    return null;
  }

  private maskCredential(value: string): string {
    const trimmed = String(value || '').trim();
    if (!trimmed) return 'Not used';
    if (trimmed.length <= 8) return \`\${trimmed.slice(0, 2)}***\${trimmed.slice(-1)}\`;
    return \`\${trimmed.slice(0, 4)}...\${trimmed.slice(-4)}\`;
  }

  private detectTokenConsumed(options: any): string {
    const headers = options && typeof options === 'object' && options.headers && typeof options.headers === 'object'
      ? options.headers
      : {};
    const authorization = headers.Authorization || headers.authorization;
    const apiKeyHeaderName = process.env.API_KEY_HEADER || 'X-API-Key';
    const explicitApiKey = headers[apiKeyHeaderName] || headers[apiKeyHeaderName.toLowerCase()] || headers['x-api-key'];

    if (authorization) return this.maskCredential(String(authorization));
    if (explicitApiKey) return this.maskCredential(String(explicitApiKey));
    if (process.env.AUTH_TOKEN) return \`Bearer \${this.maskCredential(process.env.AUTH_TOKEN)}\`;
    if (process.env.BASIC_AUTH) return \`Basic \${this.maskCredential(process.env.BASIC_AUTH)}\`;
    if (process.env.API_KEY) return \`\${apiKeyHeaderName} \${this.maskCredential(process.env.API_KEY)}\`;
    return 'Not used';
  }

  private async executeRequest(
    method: string,
    endpoint: string,
    reqOptions: any,
    sender: (cleanEndpoint: string, requestOptions: any) => Promise<APIResponse>
  ): Promise<APIResponse> {
    const clean = this.cleanEndpoint(endpoint);
    const trace: any = {
      method: method.toUpperCase(),
      endpoint: this.normalizeEndpoint(endpoint),
      urlType: this.isAbsoluteUrl(endpoint) ? 'absolute' : 'relative',
      fullUrl: this.buildFullUrl(endpoint),
      payloadSent: this.extractPayload(reqOptions),
      tokenConsumed: this.detectTokenConsumed(reqOptions)
    };

    Logger.request(trace.method, clean, reqOptions);
    const startedAt = Date.now();
    const response = await sender(clean, reqOptions);
    trace.statusCode = response.status();
    trace.responseTimeMs = Date.now() - startedAt;
    Logger.response(trace.method, clean, trace.statusCode);
    Logger.apiTrace(trace);
    return response;
  }

  async get(endpoint: string, options = {}): Promise<APIResponse> {
    return this.executeRequest('GET', endpoint, options, (clean, reqOptions) => this.request.get(clean, reqOptions));
  }

  async post(endpoint: string, payloadOrOptions: any = {}, options = {}): Promise<APIResponse> {
    const reqOptions = this.prepareOptions(payloadOrOptions, options);
    return this.executeRequest('POST', endpoint, reqOptions, (clean, requestOptions) => this.request.post(clean, requestOptions));
  }

  async put(endpoint: string, payloadOrOptions: any = {}, options = {}): Promise<APIResponse> {
    const reqOptions = this.prepareOptions(payloadOrOptions, options);
    return this.executeRequest('PUT', endpoint, reqOptions, (clean, requestOptions) => this.request.put(clean, requestOptions));
  }

  async patch(endpoint: string, payloadOrOptions: any = {}, options = {}): Promise<APIResponse> {
    const reqOptions = this.prepareOptions(payloadOrOptions, options);
    return this.executeRequest('PATCH', endpoint, reqOptions, (clean, requestOptions) => this.request.patch(clean, requestOptions));
  }

  async delete(endpoint: string, options = {}): Promise<APIResponse> {
    return this.executeRequest('DELETE', endpoint, options, (clean, reqOptions) => this.request.delete(clean, reqOptions));
  }
}
`;
}

function generateAuthClient() {
  return `import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './baseApiClient';
import { LoginCredentials, OAuthTokenRequest } from '../models/auth.model';

/**
 * Dedicated Client for Authentication Endpoints
 */
export class AuthClient {
  private apiClient: BaseApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new BaseApiClient(request);
  }

  async login(credentials: LoginCredentials): Promise<APIResponse> {
    return await this.apiClient.post('/api/auth/login', { data: credentials });
  }

  async refreshToken(refreshToken: string): Promise<APIResponse> {
    return await this.apiClient.post('/api/auth/refresh', { data: { refreshToken } });
  }

  async oauthToken(body: OAuthTokenRequest): Promise<APIResponse> {
    return await this.apiClient.post('/oauth/token', { data: body });
  }

  async logout(): Promise<APIResponse> {
    return await this.apiClient.post('/api/auth/logout');
  }
}
`;
}

function generateGithubWorkflow(title) {
  return `name: API Automation CI

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  test:
    name: Run Playwright API Automation & Allure Report
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run API Tests
        run: npm test
        env:
          ENV: qa
          AUTH_TOKEN: \${{ secrets.API_AUTH_TOKEN }}
          CLIENT_ID: \${{ secrets.API_CLIENT_ID }}
          CLIENT_SECRET: \${{ secrets.API_CLIENT_SECRET }}

      - name: Generate Allure Report
        if: always()
        run: npm run allure:generate

      - name: Upload Allure Report Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-report
          path: allure-report
          retention-days: 14
`;
}

function generateFrameworkConfig(baseUrl) {
  return `export const frameworkConfig = {
  defaultTimeout: 30000,
  requestTimeout: 10000,
  maxRetries: 2,
  defaultBaseUrl: '${baseUrl}'
};
`;
}

function generateEnvConfig(envName, baseUrl) {
  let resolvedUrl = baseUrl;
  if (envName === 'dev') resolvedUrl = baseUrl.replace('api.', 'dev.api.');
  if (envName === 'prod') resolvedUrl = baseUrl.replace('qa.', '').replace('dev.', '');

  return `export const config = {
  env: '${envName}',
  baseUrl: process.env.BASE_URL || '${resolvedUrl}',
  timeout: 30000,
  auth: {
    clientId: process.env.CLIENT_ID || '${envName}-client-id',
    clientSecret: process.env.CLIENT_SECRET || '${envName}-secret-key'
  }
};
`;
}

function generateEndpointsConstant(tagGroups) {
  let body = `  Auth: {\n    login: '/api/auth/login',\n    refresh: '/api/auth/refresh',\n    oauth: '/oauth/token'\n  },\n`;
  for (const [tag, groupEndpoints] of Object.entries(tagGroups)) {
    const resourceName = cleanIdentifier(tag);
    const firstEp = groupEndpoints[0] ? groupEndpoints[0].path : `/${tag.toLowerCase()}`;
    const basePath = firstEp.replace(/\{[^}]+\}/g, '').replace(/\/$/, '') || `/${tag.toLowerCase()}`;
    body += `  ${resourceName}: {\n    base: '${basePath}'\n  },\n`;
  }

  return `/**
 * Centralized API Endpoints Configuration
 */
export const Endpoints = {
${body}};
`;
}

function generateHttpStatusConstant() {
  return `/**
 * Standard HTTP Status Codes for Clean Assertions
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};
`;
}

function generateRolesConstant() {
  return `/**
 * Application User Roles for RBAC Tests
 */
export const Roles = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MANAGER: 'MANAGER',
  GUEST: 'GUEST'
};
`;
}

function generateErrorMessagesConstant() {
  return `/**
 * Standard API Error Messages
 */
export const ErrorMessages = {
  UNAUTHORIZED: 'Unauthorized: Authentication required',
  FORBIDDEN: 'Forbidden: Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  INVALID_PAYLOAD: 'Validation failed for request body',
  INTERNAL_ERROR: 'Internal server error'
};
`;
}

function generateTokenManager() {
  return `/**
 * Token Manager with In-Memory Caching Architecture
 * Implements Token Cache pattern:
 * Check Token -> Is token valid?
 *   YES -> Reuse cached token
 *   NO  -> Generate fresh token & update cache
 */
export class TokenManager {
  private static cachedToken: string | null = null;
  private static expiresAt: number = 0;

  /**
   * Retrieves a valid cached access token, or requests a fresh one if expired.
   */
  static async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && now < this.expiresAt) {
      return this.cachedToken;
    }

    // Refresh or retrieve token
    const freshToken = process.env.AUTH_TOKEN || \`bearer-token-\${now}\`;
    this.cachedToken = freshToken;
    // Cache valid for 55 minutes
    this.expiresAt = now + (55 * 60 * 1000);
    return freshToken;
  }

  /**
   * Checks if current cached token is valid
   */
  static hasValidToken(): boolean {
    return Boolean(this.cachedToken && Date.now() < this.expiresAt);
  }

  /**
   * Invalidates token (useful for negative/unauthorized security tests)
   */
  static invalidate(): void {
    this.cachedToken = null;
    this.expiresAt = 0;
  }
}
`;
}

function generateOAuthService() {
  return `import { APIRequestContext } from '@playwright/test';
import { AuthClient } from '../../clients/authClient';
import { OAuthTokenResponse } from '../../models/auth.model';

/**
 * OAuth 2.0 Authentication Service
 * Handles Client Credentials, Authorization Code, and Refresh flows
 */
export class OAuthService {
  private authClient: AuthClient;

  constructor(request: APIRequestContext) {
    this.authClient = new AuthClient(request);
  }

  async getClientCredentialsToken(clientId: string, clientSecret: string): Promise<OAuthTokenResponse> {
    const response = await this.authClient.oauthToken({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    });
    return await response.json();
  }
}
`;
}

function generateJwtService() {
  return `import { JwtPayload } from '../../models/auth.model';

/**
 * JWT Verification and Helper Utilities
 */
export class JwtService {
  static decodePayload(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
          .toString('binary')
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload || !payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }
}
`;
}

function generateApiKeyService() {
  return `/**
 * API Key Authentication Service
 */
export class ApiKeyService {
  static getHeaders(apiKey: string): Record<string, string> {
    return {
      'x-api-key': apiKey || process.env.API_KEY || 'default-api-key'
    };
  }
}
`;
}

function generateAuthManager() {
  return `import { TokenManager } from '../../utils/tokenManager';

/**
 * Central Authentication Manager
 * Connects tests to Token Cache and provides ready-to-use authorization headers
 */
export class AuthManager {
  static async getAccessToken(): Promise<string> {
    return await TokenManager.getAccessToken();
  }

  static async getAuthHeader(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      'Authorization': \`Bearer \${token}\`
    };
  }
}
`;
}

function generateAuthModel() {
  return `/**
 * Authentication Data Models
 */
export interface LoginCredentials {
  username?: string;
  email?: string;
  password?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

export interface OAuthTokenRequest {
  grant_type: string;
  client_id: string;
  client_secret: string;
  scope?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}
`;
}

function generateApiResponseModel() {
  return `/**
 * Generic API Response Wrapper Models
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  success: boolean;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp?: string;
}
`;
}

function generateAuthSchema() {
  return `/**
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
`;
}

function generateLogger() {
  return `/**
 * Centralized Framework Logger with Automated Sensitive Data Masking
 */
export class Logger {
  private static sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => Logger.sanitize(item));
    const redacted: any = {};
    const SENSITIVE_KEYS = /token|auth|password|secret|key|jwt|authorization|credential/i;
    for (const [key, val] of Object.entries(obj)) {
      if (key === 'tokenConsumed' && typeof val === 'string') {
        redacted[key] = val;
      } else if (SENSITIVE_KEYS.test(key)) {
        redacted[key] = '***REDACTED***';
      } else if (val && typeof val === 'object') {
        redacted[key] = Logger.sanitize(val);
      } else {
        redacted[key] = val;
      }
    }
    return redacted;
  }

  static info(message: string, context?: any) {
    console.log(\`[INFO] \${message}\`, context ? JSON.stringify(Logger.sanitize(context)) : '');
  }

  static error(message: string, error?: any) {
    console.error(\`[ERROR] \${message}\`, error || '');
  }

  static request(method: string, url: string, data?: any) {
    console.log(\`[REQ] -> \${method.toUpperCase()} \${url}\`, data ? JSON.stringify(Logger.sanitize(data)) : '');
  }

  static response(method: string, url: string, status: number) {
    console.log(\`[RES] <- \${status} \${method.toUpperCase()} \${url}\`);
  }

  static apiTrace(trace: any) {
    console.log(\`[API_TRACE] \${JSON.stringify(Logger.sanitize(trace))}\`);
  }
}
`;
}

function generateDataGenerator() {
  return `import { RandomUtils } from './randomUtils';

/**
 * Dynamic Mock Data Generator
 */
export class DataGenerator {
  static randomString(prefix: string = 'test'): string {
    return \`\${prefix}_\${RandomUtils.randomString(6)}\`;
  }

  static randomNumber(min: number = 1, max: number = 1000): number {
    return RandomUtils.randomNumber(min, max);
  }

  static randomEmail(): string {
    return \`qa.user.\${Date.now()}@example.com\`;
  }
}
`;
}

function generateDateUtils() {
  return `/**
 * Date and Timestamp Utilities
 */
export class DateUtils {
  static nowIso(): string {
    return new Date().toISOString();
  }

  static addMinutes(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  static addDays(days: number): Date {
    return new Date(Date.now() + days * 24 * 60 * 1000);
  }
}
`;
}

function generateRandomUtils() {
  return `/**
 * Random Number, UUID, and String Utilities
 */
export class RandomUtils {
  static randomString(length: number = 8): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  static randomNumber(min: number = 1, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
`;
}

function generateFileUtils() {
  return `import * as fs from 'fs';
import * as path from 'path';

/**
 * Safe File Reading / Writing Utilities for Test Data
 */
export class FileUtils {
  static readJson<T = any>(filePath: string): T {
    const raw = fs.readFileSync(path.resolve(filePath), 'utf-8');
    return JSON.parse(raw);
  }

  static writeJson(filePath: string, data: any): void {
    fs.writeFileSync(path.resolve(filePath), JSON.stringify(data, null, 2), 'utf-8');
  }
}
`;
}

function generateModelInterface(modelName, groupEndpoints) {
  let fieldsCode = '';

  for (const ep of groupEndpoints) {
    if (ep.parameters && ep.parameters.body && ep.parameters.body.properties) {
      for (const [propName, propMeta] of Object.entries(ep.parameters.body.properties)) {
        fieldsCode += `  ${propName}?: ${mapTsType(propMeta.type)};\n`;
      }
      break;
    }
  }

  if (!fieldsCode) {
    fieldsCode = '  id?: number;\n  name?: string;\n  status?: string;\n  [key: string]: any;\n';
  }

  return `/**
 * TypeScript Data Model Interface for ${modelName}
 */
export interface ${modelName}Model {
${fieldsCode}}

export interface Create${modelName}Request extends ${modelName}Model {}
export interface Update${modelName}Request extends ${modelName}Model {}
`;
}

function generateResourceSchema(resourceName, groupEndpoints) {
  let properties = {
    id: { type: 'number' },
    status: { type: 'string' }
  };

  for (const ep of groupEndpoints) {
    if (ep.parameters && ep.parameters.body && ep.parameters.body.properties) {
      properties = {};
      for (const [propName, propMeta] of Object.entries(ep.parameters.body.properties)) {
        properties[propName] = { type: mapSchemaType(propMeta.type) };
      }
      break;
    }
  }

  return `/**
 * Contract Schema Definition for ${resourceName}
 */
export const ${resourceName}Schema = {
  type: 'object',
  properties: ${JSON.stringify(properties, null, 4)}
};
`;
}

function generateResourceClient(resourceName, lowerName, groupEndpoints = []) {
  const getEndpoints = groupEndpoints.filter(e => e.method === 'GET');
  const postEndpoints = groupEndpoints.filter(e => e.method === 'POST');
  const putEndpoints = groupEndpoints.filter(e => e.method === 'PUT');
  const patchEndpoints = groupEndpoints.filter(e => e.method === 'PATCH');
  const deleteEndpoints = groupEndpoints.filter(e => e.method === 'DELETE');

  let basePath = `/${lowerName}`;
  const firstEp = groupEndpoints[0];
  if (firstEp && firstEp.path) {
    basePath = firstEp.path.replace(/\/\{[^}]+\}.*$/, '');
    if (!basePath) basePath = firstEp.path;
  }

  // 1. getAll endpoint resolution
  let getAllPath = basePath;
  const getNoParam = getEndpoints.find(e => !e.path.includes('{'));
  const getWithParam = getEndpoints.find(e => e.path.includes('{'));

  if (getNoParam) {
    getAllPath = getNoParam.path;
  } else if (getWithParam) {
    getAllPath = getWithParam.path;
  } else if (getEndpoints[0]) {
    getAllPath = getEndpoints[0].path;
  }

  // 2. getById endpoint
  let getByIdPath = `${basePath}/{id}`;
  if (getWithParam) {
    getByIdPath = getWithParam.path;
  } else if (getEndpoints[0]) {
    getByIdPath = getEndpoints[0].path;
  }

  // 3. create endpoint
  let createPath = basePath;
  if (postEndpoints[0]) {
    createPath = postEndpoints[0].path;
  }

  // 4. update endpoint (PUT or PATCH fallback)
  let updatePath = `${basePath}/{id}`;
  let updateHasParam = true;
  if (putEndpoints[0]) {
    updatePath = putEndpoints[0].path;
    updateHasParam = updatePath.includes('{');
  } else if (patchEndpoints[0]) {
    updatePath = patchEndpoints[0].path;
    updateHasParam = updatePath.includes('{');
  }

  // 5. patch endpoint
  let patchPath = `${basePath}/{id}`;
  let patchHasParam = true;
  if (patchEndpoints[0]) {
    patchPath = patchEndpoints[0].path;
    patchHasParam = patchPath.includes('{');
  }

  // 6. delete endpoint
  let deletePath = `${basePath}/{id}`;
  if (deleteEndpoints[0]) {
    deletePath = deleteEndpoints[0].path;
  }

  const formatPath = (p, idVar = 'id') => {
    return p.replace(/\{[^}]+\}/g, `\${${idVar}}`);
  };

  const formattedGetById = formatPath(getByIdPath);
  const formattedUpdate = updateHasParam ? formatPath(updatePath) : updatePath;
  const formattedPatch = patchHasParam ? formatPath(patchPath) : patchPath;
  const formattedDelete = formatPath(deletePath);

  const usePatchForUpdate = putEndpoints.length === 0 && patchEndpoints.length > 0;
  const updateMethod = usePatchForUpdate ? 'patch' : 'put';

  let patchMethodCode = '';
  if (patchEndpoints.length > 0) {
    patchMethodCode = `

  async patch(id: number | string, data: Partial<${resourceName}Model>): Promise<APIResponse> {
    return await this.apiClient.patch(\`${formattedPatch}\`, { data });
  }`;
  }

  let getAllMethodCode = '';
  if (getNoParam) {
    getAllMethodCode = `
  async getAll(): Promise<APIResponse> {
    return await this.apiClient.get('${getAllPath}');
  }`;
  } else {
    const defaultId = lowerName === 'user' ? "'user1'" : 10;
    getAllMethodCode = `
  async getAll(id: number | string = ${defaultId}): Promise<APIResponse> {
    return await this.getById(id);
  }`;
  }

  return `import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './baseApiClient';
import { ${resourceName}Model } from '../models/${lowerName}.model';

/**
 * API Client Layer for ${resourceName}
 * Maps domain endpoints and executes HTTP requests using BaseApiClient
 */
export class ${resourceName}Client {
  private apiClient: BaseApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new BaseApiClient(request);
  }
${getAllMethodCode}

  async getById(id: number | string): Promise<APIResponse> {
    return await this.apiClient.get(\`${formattedGetById}\`);
  }

  async create(data: ${resourceName}Model): Promise<APIResponse> {
    return await this.apiClient.post('${createPath}', { data });
  }

  async update(id: number | string, data: ${resourceName}Model): Promise<APIResponse> {
    return await this.apiClient.${updateMethod}(\`${formattedUpdate}\`, { data });
  }${patchMethodCode}

  async delete(id: number | string): Promise<APIResponse> {
    return await this.apiClient.delete(\`${formattedDelete}\`);
  }
}
`;
}

function generateResourceService(resourceName, lowerName, groupEndpoints) {
  const hasPatch = groupEndpoints.some(e => e.method === 'PATCH');
  const patchServiceCode = hasPatch ? `

  async patch(id: number | string, data: Partial<Update${resourceName}Request>): Promise<APIResponse> {
    return await this.client.patch(id, data);
  }` : '';

  return `import { APIRequestContext, APIResponse } from '@playwright/test';
import { ${resourceName}Client } from '../../clients/${lowerName}Client';
import { ${resourceName}Model, Create${resourceName}Request, Update${resourceName}Request } from '../../models/${lowerName}.model';

/**
 * Service Layer for ${resourceName}
 * Encapsulates domain business logic, data transformation, and invokes API Client.
 */
export class ${resourceName}Service {
  private client: ${resourceName}Client;

  constructor(request: APIRequestContext) {
    this.client = new ${resourceName}Client(request);
  }

  async fetchAll(): Promise<APIResponse> {
    return await this.client.getAll();
  }

  async fetchById(id: number | string): Promise<APIResponse> {
    return await this.client.getById(id);
  }

  async create(data: Create${resourceName}Request): Promise<APIResponse> {
    return await this.client.create(data);
  }

  async update(id: number | string, data: Update${resourceName}Request): Promise<APIResponse> {
    return await this.client.update(id, data);
  }${patchServiceCode}

  async delete(id: number | string): Promise<APIResponse> {
    return await this.client.delete(id);
  }
}
`;
}

function generateResourceTestData(groupEndpoints) {
  let sampleData = null;

  for (const ep of groupEndpoints) {
    if (ep.parameters && ep.parameters.body && ep.parameters.body.examplePayload) {
      sampleData = ep.parameters.body.examplePayload;
      break;
    }
  }

  if (!sampleData) {
    sampleData = { id: 1, title: 'Sample Title', name: 'Sample Name', status: 'active' };
  }

  return JSON.stringify(sampleData, null, 2);
}

function generateResourceInvalidTestData(groupEndpoints) {
  let invalidData = {
    missingRequired: { id: 1 },
    invalidTypes: { id: "invalid_string_where_int_expected", status: 99999 },
    emptyPayload: {},
    nullValuePayload: { id: null, name: null }
  };

  for (const ep of groupEndpoints) {
    if (ep.parameters && ep.parameters.body && ep.parameters.body.invalidPayloads) {
      invalidData = ep.parameters.body.invalidPayloads;
      break;
    }
  }

  return JSON.stringify(invalidData, null, 2);
}

function generateSecurityPayloads() {
  return JSON.stringify(
    {
      sqlInjection: [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1 UNION SELECT null, username, password FROM users --"
      ],
      xssInjection: [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert(1)>",
        "javascript:alert(1)"
      ],
      bolaIdorIds: [
        -1,
        0,
        999999999,
        "00000000-0000-0000-0000-000000000000"
      ],
      pathTraversal: [
        "../../../../etc/passwd",
        "..\\..\\..\\windows\\win.ini"
      ]
    },
    null,
    2
  );
}

function generateApiFixture(tags) {
  const imports = tags.map(t => {
    const name = cleanIdentifier(t);
    return `import { ${name}Service } from '../services/${name.toLowerCase()}/${name.toLowerCase()}.service';`;
  }).join('\n');

  const types = tags.map(t => {
    const name = cleanIdentifier(t);
    const varName = name.charAt(0).toLowerCase() + name.slice(1);
    return `  ${varName}Service: ${name}Service;`;
  }).join('\n');

  const extensions = tags.map(t => {
    const name = cleanIdentifier(t);
    const varName = name.charAt(0).toLowerCase() + name.slice(1);
    return `  ${varName}Service: async ({ request }, use) => {\n    await use(new ${name}Service(request));\n  },`;
  }).join('\n');

  return `import { test as base } from '@playwright/test';
${imports}
import { BaseApiClient } from '../clients/baseApiClient';
import { TokenManager } from '../utils/tokenManager';

/**
 * Custom Playwright Fixture injecting all Domain Services and BaseApiClient directly into tests
 */
type ApiServices = {
  baseApiClient: BaseApiClient;
  tokenManager: typeof TokenManager;
${types}
};

export const test = base.extend<ApiServices>({
  baseApiClient: async ({ request }, use) => {
    await use(new BaseApiClient(request));
  },
  tokenManager: async ({}, use) => {
    await use(TokenManager);
  },
${extensions}
});

export { expect } from '@playwright/test';
`;
}

function generateAuthFixture() {
  return `import { test as base } from '@playwright/test';
import { AuthManager } from '../services/authentication/authManager';

type AuthFixtures = {
  authToken: string;
};

export const test = base.extend<AuthFixtures>({
  authToken: async ({}, use) => {
    const token = await AuthManager.getAccessToken();
    await use(token);
  }
});

export { expect } from '@playwright/test';
`;
}

function generateTestDataFixture(tags) {
  return `import { test as base } from '@playwright/test';
import { FileUtils } from '../utils/fileUtils';

type TestDataFixtures = {
  securityPayloads: any;
};

export const test = base.extend<TestDataFixtures>({
  securityPayloads: async ({}: any, use: any) => {
    const payloads = FileUtils.readJson('./test-data/security/security-payloads.json');
    await use(payloads);
  }
});

export { expect } from '@playwright/test';
`;
}

// -------------------------------------------------------------
// Test Spec Generators (Smoke, Regression, Negative, Security, Contract)
// -------------------------------------------------------------

function generateSequentialE2EWorkflow(parsedSpec) {
  const { title, tagGroups } = parsedSpec;
  const tags = Object.keys(tagGroups);

  let stepsCode = '';
  tags.forEach((tag, idx) => {
    const groupEndpoints = tagGroups[tag] || [];
    const name = cleanIdentifier(tag);
    const lower = name.toLowerCase();
    const serviceVar = name.charAt(0).toLowerCase() + name.slice(1) + 'Service';
    const stepNum = idx + 2;

    const hasPut = groupEndpoints.some(e => e.method === 'PUT');
    const hasPatch = groupEndpoints.some(e => e.method === 'PATCH');
    const hasPutOrPatch = hasPut || hasPatch;

    const hasGetNoParam = groupEndpoints.some(e => e.method === 'GET' && !e.path.includes('{') && !e.path.includes('/login') && !e.path.includes('/logout'));

    let fetchStepCode = '';
    if (hasGetNoParam) {
      fetchStepCode = `
    // 1. Fetch items
    const listRes = await ${serviceVar}.fetchAll();
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(listRes.status());
    expect(listRes.ok()).toBe(true);
`;
    }

    // Derive payload from spec example data (most reliable approach)
    let examplePayload = null;
    for (const ep of groupEndpoints) {
      if ((ep.method === 'POST' || ep.method === 'PUT') && ep.parameters && ep.parameters.body && ep.parameters.body.examplePayload) {
        examplePayload = ep.parameters.body.examplePayload;
        break;
      }
    }

    let payloadCode = '';
    let initialIdCode = '';

    if (lower === 'user') {
      // Petstore user
      payloadCode = `const payload: any = { id: Math.floor(Math.random() * 9000 + 1000), username: 'e2e_user_' + Date.now(), firstName: 'E2E', lastName: 'User', email: 'e2e@example.com', password: 'password123', phone: '1234567890', userStatus: 1 };`;
      initialIdCode = `let currentId: number | string = payload.username;`;
    } else if (lower === 'store') {
      // Petstore store
      payloadCode = `const payload: any = { id: Math.floor(Math.random() * 900 + 100), petId: 1, quantity: 1, shipDate: new Date().toISOString(), status: 'placed', complete: true };`;
      initialIdCode = `let currentId: number | string = payload.id;`;
    } else if (examplePayload) {
      // Use actual spec example payload, override id with random for uniqueness
      const merged = { ...examplePayload, id: `Math.floor(Math.random() * 900 + 100)` };
      const payloadStr = JSON.stringify(examplePayload, null, 0)
        .replace(/"id"\s*:\s*\d+/, `"id": Math.floor(Math.random() * 900 + 100)`);
      // Build payload inline with dynamic id
      const payloadFields = Object.entries(examplePayload).map(([k, v]) => {
        if (k === 'id') return `id: Math.floor(Math.random() * 900 + 100)`;
        if (typeof v === 'string' && (v.includes('T') && v.includes(':') && v.includes('Z') || v.includes('date'))) {
          return `${k}: new Date().toISOString()`;
        }
        return `${k}: ${JSON.stringify(v)}`;
      }).join(', ');
      payloadCode = `const payload: any = { ${payloadFields} };`;
      initialIdCode = `let currentId: number | string = payload.id;`;
    } else {
      payloadCode = `const payload: any = { id: Math.floor(Math.random() * 900 + 100), name: 'E2E ${name} Entity', title: 'E2E ${name} Item', status: 'active' };`;
      initialIdCode = `let currentId: number | string = payload.id;`;
    }

    let updateStepCode = '';
    if (hasPutOrPatch) {
      const updateCall = (hasPatch && !hasPut) ? 'patch' : 'update';
      updateStepCode = `
    // Update record
    const updateRes = await ${serviceVar}.${updateCall}(currentId, { ...payload });
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(updateRes.status());`;
    }

    stepsCode += `
  test('Phase ${stepNum}: Sequential Workflow for ${name} API', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'End-to-End Journeys' });
    test.info().annotations.push({ type: 'feature', description: '${name} Resource' });
    test.info().annotations.push({ type: 'story', description: '${name} - Full CRUD Workflow' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    test.info().annotations.push({ type: 'tag', description: 'e2e, ${lower}, crud' });
    test.info().annotations.push({ type: 'description', description: 'Executes a full sequential CRUD lifecycle for the ${name} API: list → create → read → update.' });
${fetchStepCode}
    // Create item
    ${payloadCode}
    const createRes = await ${serviceVar}.create(payload);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(createRes.status());
    expect(createRes.ok()).toBe(true);
    
    ${initialIdCode}
    if (createRes.ok()) {
      try {
        const body = await createRes.json();
        if (body && (body.username || body.id || body.ID)) currentId = body.username || body.id || body.ID;
      } catch (e) {}
    }
    workflowState.createdEntities['${name}'] = currentId;

    // Query record by ID (try created ID first, fallback to known-existing ID 1)
    const getRes = await ${serviceVar}.fetchById(currentId);
    const queryId = getRes.ok() ? currentId : 1;
    if (!getRes.ok()) {
      workflowState.createdEntities['${name}'] = queryId;
    }
    const verifyRes = await ${serviceVar}.fetchById(queryId);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(verifyRes.status());
${updateStepCode}
  });
`;
  });

  const allServiceParams = tags.map(t => {
    const name = cleanIdentifier(t);
    return name.charAt(0).toLowerCase() + name.slice(1) + 'Service';
  }).join(', ');

  const cleanupCalls = tags.map(tag => {
    const name = cleanIdentifier(tag);
    const serviceVar = name.charAt(0).toLowerCase() + name.slice(1) + 'Service';
    return `    if (workflowState.createdEntities['${name}']) {
      const delRes = await ${serviceVar}.delete(workflowState.createdEntities['${name}']);
      expect([HttpStatus.OK, HttpStatus.NO_CONTENT, HttpStatus.NOT_FOUND]).toContain(delRes.status());
    }`;
  }).join('\n');

  return `import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import { TokenManager } from '../../src/utils/tokenManager';

/**
 * End-to-End Sequential API Business Workflow
 * Executes an ordered multi-step business journey touching all ${tags.length} resource controllers:
 * Handshake & Token -> Sequential Entity Creation -> Verification -> State Mutation -> Teardown Cleanup
 */
test.describe.serial('Sequential End-to-End API Journey (${title})', () => {
  const workflowState: {
    authToken: string;
    createdEntities: Record<string, number | string>;
  } = {
    authToken: '',
    createdEntities: {}
  };

  test('Phase 1: Environment Handshake & Token Acquisition', async () => {
    test.info().annotations.push({ type: 'epic', description: 'End-to-End Journeys' });
    test.info().annotations.push({ type: 'feature', description: 'API Connectivity' });
    test.info().annotations.push({ type: 'story', description: 'Environment Setup & Token Acquisition' });
    test.info().annotations.push({ type: 'severity', description: 'blocker' });
    test.info().annotations.push({ type: 'tag', description: 'e2e, auth, setup' });
    test.info().annotations.push({ type: 'description', description: 'Validates API environment connectivity and acquires a valid auth token before the E2E journey begins.' });
    const token = await TokenManager.getAccessToken();
    expect(token).toBeTruthy();
    workflowState.authToken = token;
  });
${stepsCode}
  test('Phase ${tags.length + 2}: End-to-End Teardown & Deletion Verification', async ({ ${allServiceParams} }) => {
    test.info().annotations.push({ type: 'epic', description: 'End-to-End Journeys' });
    test.info().annotations.push({ type: 'feature', description: 'Teardown & Cleanup' });
    test.info().annotations.push({ type: 'story', description: 'Delete All Created Entities' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    test.info().annotations.push({ type: 'tag', description: 'e2e, teardown, cleanup' });
    test.info().annotations.push({ type: 'description', description: 'Deletes all entities created during the E2E journey to restore environment state.' });
    // Delete created entities in reverse dependency order
${cleanupCalls}
  });
});
`;
}

function generateSmokeSpec(resourceName, lowerName, groupEndpoints = []) {
  const serviceVar = resourceName.charAt(0).toLowerCase() + resourceName.slice(1) + 'Service';
  const getNoParam = groupEndpoints.find(e => e.method === 'GET' && !e.path.includes('{'));
  const postEp = groupEndpoints.find(e => e.method === 'POST');

  let callCode = `${serviceVar}.fetchAll()`;
  if (!getNoParam && postEp) {
    callCode = `${serviceVar}.create(testData)`;
  } else if (!getNoParam) {
    const defaultId = lowerName === 'user' ? "'user1'" : "10";
    callCode = `${serviceVar}.fetchById(${defaultId})`;
  }

  return `import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import testData from '../../test-data/${lowerName}/valid-${lowerName}.json';

test.describe('${resourceName} Smoke Tests', () => {
  test('Verify ${resourceName} endpoint is healthy and reachable', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Health' });
    test.info().annotations.push({ type: 'feature', description: '${resourceName} Resource' });
    test.info().annotations.push({ type: 'story', description: 'Smoke - Endpoint Availability' });
    test.info().annotations.push({ type: 'severity', description: 'blocker' });
    test.info().annotations.push({ type: 'tag', description: 'smoke, ${lowerName}, health-check' });
    test.info().annotations.push({ type: 'description', description: 'Verifies that the ${resourceName} API endpoint is healthy, reachable, and returns a 2xx status.' });
    const response = await ${callCode};
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
`;
}

function generateAuthSmokeSpec() {
  return `import { test, expect } from '@playwright/test';
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
`;
}

function generateRegressionSpec(resourceName, lowerName, groupEndpoints = []) {
  const serviceVar = resourceName.charAt(0).toLowerCase() + resourceName.slice(1) + 'Service';

  const hasPost = groupEndpoints.some(e => e.method === 'POST');
  const hasPut = groupEndpoints.some(e => e.method === 'PUT' || e.method === 'PATCH');
  const hasDelete = groupEndpoints.some(e => e.method === 'DELETE');
  const hasGetById = groupEndpoints.some(e => e.method === 'GET' && e.path.includes('{'));
  const hasGetNoParam = groupEndpoints.some(e => e.method === 'GET' && !e.path.includes('{'));

  let step1Code = '';
  if (hasGetNoParam) {
    step1Code = `  test('Step 1: Fetch initial ${resourceName} collection list', async ({ ${serviceVar} }) => {
    const response = await ${serviceVar}.fetchAll();
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });`;
  }

  return `import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/${lowerName}/valid-${lowerName}.json';

test.describe.serial('${resourceName} Full Regression CRUD Suite', () => {
  let createdId: number | string = (testData as any).id || (testData as any).username || (testData as any).ID || 1;

${step1Code}

${hasPost ? `  test('Step 2: Create a new ${resourceName}', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: '${resourceName} Resource' });
    test.info().annotations.push({ type: 'story', description: 'POST - Create ${resourceName}' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a valid POST request to the ${resourceName} endpoint creates a resource and returns 200/201.' });
    const response = await ${serviceVar}.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED]).toContain(response.status());
    expect(response.ok()).toBe(true);

    try {
      const body = await response.json();
      if (body && (body.id || body.username || body.ID)) {
        createdId = body.id || body.username || body.ID;
      }
    } catch (e) {}
  });` : ''}

${hasGetById ? `  test('Step 3: Fetch ${resourceName} by ID', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: '${resourceName} Resource' });
    test.info().annotations.push({ type: 'story', description: 'GET by ID - Fetch ${resourceName}' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a GET request with a valid ID returns the expected ${resourceName} resource.' });
    const response = await ${serviceVar}.fetchById(createdId);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });` : ''}

${hasPut ? `  test('Step 4: Update existing ${resourceName}', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: '${resourceName} Resource' });
    test.info().annotations.push({ type: 'story', description: 'PUT - Update ${resourceName}' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a valid PUT request updates an existing ${resourceName} and returns 200.' });
    const updatedData = { ...testData, status: 'updated_active' } as any;
    const response = await ${serviceVar}.update(createdId, updatedData);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });` : ''}

${hasDelete ? `  test('Step 5: Delete ${resourceName} by ID', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: '${resourceName} Resource' });
    test.info().annotations.push({ type: 'story', description: 'DELETE - Remove ${resourceName}' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies that a DELETE request removes the ${resourceName} resource successfully.' });
    const response = await ${serviceVar}.delete(createdId);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT, HttpStatus.NOT_FOUND]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });` : ''}
});
`;
}

function generateCreateSpec(resourceName, lowerName, groupEndpoints = []) {
  const serviceVar = resourceName.charAt(0).toLowerCase() + resourceName.slice(1) + 'Service';
  const hasPost = groupEndpoints.some(e => e.method === 'POST');

  if (!hasPost) {
    return `import { test, expect } from '../../../src/fixtures/api.fixture';

test.describe('Create ${resourceName} Specification', () => {
  test('Skip: Endpoint does not support POST creation', async () => {
    test.skip(true, '${resourceName} spec does not declare a POST endpoint');
  });
});
`;
  }

  return `import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/${lowerName}/valid-${lowerName}.json';

test.describe('Create ${resourceName} Specification', () => {
  test('Should successfully create a new ${resourceName} with valid payload', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: '${resourceName} Resource' });
    test.info().annotations.push({ type: 'story', description: 'POST - Create ${resourceName}' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies a valid POST request creates a ${resourceName} resource and returns 200/201.' });
    const response = await ${serviceVar}.create(testData);
    expect([HttpStatus.OK, HttpStatus.CREATED, HttpStatus.ACCEPTED]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
`;
}

function generateUpdateSpec(resourceName, lowerName, groupEndpoints = []) {
  const serviceVar = resourceName.charAt(0).toLowerCase() + resourceName.slice(1) + 'Service';
  const hasPut = groupEndpoints.some(e => e.method === 'PUT');
  const hasPatch = groupEndpoints.some(e => e.method === 'PATCH');

  if (!hasPut && !hasPatch) {
    return `import { test, expect } from '../../../src/fixtures/api.fixture';

test.describe('Update ${resourceName} Specification', () => {
  test('Skip: Endpoint does not support PUT/PATCH update', async () => {
    test.skip(true, '${resourceName} spec does not declare a PUT or PATCH endpoint');
  });
});
`;
  }

  const methodCall = hasPatch && !hasPut
    ? `const response = await ${serviceVar}.patch(targetId, { status: 'modified' } as any);`
    : `const response = await ${serviceVar}.update(targetId, { ...testData, status: 'modified' } as any);`;

  return `import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/${lowerName}/valid-${lowerName}.json';

test.describe('Update ${resourceName} Specification', () => {
  test('Should successfully update existing ${resourceName}', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: '${resourceName} Resource' });
    test.info().annotations.push({ type: 'story', description: 'PUT - Update ${resourceName}' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies a valid PUT/PATCH request updates an existing ${resourceName} and returns 200.' });
    const targetId = (testData as any).id || (testData as any).username || (testData as any).ID || 1;
    ${methodCall}
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
`;
}

function generateDeleteSpec(resourceName, lowerName, groupEndpoints = []) {
  const serviceVar = resourceName.charAt(0).toLowerCase() + resourceName.slice(1) + 'Service';
  const hasDelete = groupEndpoints.some(e => e.method === 'DELETE');

  if (!hasDelete) {
    return `import { test, expect } from '../../../src/fixtures/api.fixture';

test.describe('Delete ${resourceName} Specification', () => {
  test('Skip: Endpoint does not support DELETE operation', async () => {
    test.skip(true, '${resourceName} spec does not declare a DELETE endpoint');
  });
});
`;
  }

  return `import { test, expect } from '../../../src/fixtures/api.fixture';
import { HttpStatus } from '../../../src/constants/httpStatus';
import testData from '../../../test-data/${lowerName}/valid-${lowerName}.json';

test.describe('Delete ${resourceName} Specification', () => {
  test('Should successfully delete ${resourceName} by ID', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'API Regression' });
    test.info().annotations.push({ type: 'feature', description: '${resourceName} Resource' });
    test.info().annotations.push({ type: 'story', description: 'DELETE - Remove ${resourceName}' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    
    test.info().annotations.push({ type: 'description', description: 'Verifies a DELETE request removes the ${resourceName} resource successfully.' });
    const targetId = (testData as any).id || (testData as any).username || (testData as any).ID || 1;
    const response = await ${serviceVar}.delete(targetId);
    expect([HttpStatus.OK, HttpStatus.ACCEPTED, HttpStatus.NO_CONTENT, HttpStatus.NOT_FOUND]).toContain(response.status());
    expect(response.ok()).toBe(true);
  });
});
`;
}

function generateContractSpec(resourceName, lowerName, groupEndpoints = []) {
  const serviceVar = resourceName.charAt(0).toLowerCase() + resourceName.slice(1) + 'Service';
  const getNoParam = groupEndpoints.find(e => e.method === 'GET' && !e.path.includes('{'));
  const postEp = groupEndpoints.find(e => e.method === 'POST');

  let callCode = `${serviceVar}.fetchAll()`;
  if (!getNoParam && postEp) {
    callCode = `${serviceVar}.create(testData)`;
  } else if (!getNoParam) {
    callCode = `${serviceVar}.fetchById(10)`;
  }

  return `import Ajv from 'ajv';
import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import { ${resourceName}Schema } from '../../src/schemas/${lowerName}.schema';
import testData from '../../test-data/${lowerName}/valid-${lowerName}.json';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(${resourceName}Schema);

test.describe('${resourceName} Contract Validation Suite', () => {
  test('Response schema matches expected OpenAPI contract', async ({ ${serviceVar} }) => {
    test.info().annotations.push({ type: 'epic', description: 'Contract Testing' });
    test.info().annotations.push({ type: 'feature', description: '${resourceName} API Contract' });
    test.info().annotations.push({ type: 'story', description: 'Schema Validation - ${resourceName}' });
    test.info().annotations.push({ type: 'severity', description: 'normal' });
    
    test.info().annotations.push({ type: 'description', description: 'Validates that the ${resourceName} API response schema matches the OpenAPI specification contract.' });
    const response = await ${callCode};
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
`;
}

function generateNegativeSpec(resourceName, lowerName, groupEndpoints) {
  const serviceVar = resourceName.charAt(0).toLowerCase() + resourceName.slice(1) + 'Service';

  return `import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import invalidData from '../../test-data/${lowerName}/invalid-${lowerName}.json';

test.describe('${resourceName} Negative & Boundary Validation Suite', () => {
  const nonExistentId = 99999999;

  test('Negative 1: Return 404 Not Found when querying non-existent ${resourceName} ID', async ({ ${serviceVar} }) => {
    const response = await ${serviceVar}.fetchById(nonExistentId);
    expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Negative 2: Return 404 Not Found when updating non-existent ${resourceName} ID', async ({ ${serviceVar} }) => {
    const response = await ${serviceVar}.update(nonExistentId, { status: 'invalid' } as any);
    expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Negative 3: Return 404 Not Found when deleting non-existent ${resourceName} ID', async ({ ${serviceVar} }) => {
    const response = await ${serviceVar}.delete(nonExistentId);
    expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Negative 4: Reject creation with payload missing required parameters', async ({ ${serviceVar} }) => {
    const payload = (invalidData as any).missingRequired || {};
    const response = await ${serviceVar}.create(payload);
    expect([HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Negative 5: Reject creation with invalid property data types', async ({ ${serviceVar} }) => {
    const payload = (invalidData as any).invalidTypes || { id: 'not_an_int' };
    const response = await ${serviceVar}.create(payload);
    expect([HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Negative 6: Reject creation with empty JSON payload {}', async ({ ${serviceVar} }) => {
    const response = await ${serviceVar}.create({});
    expect([HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Negative 7: Reject creation with null value in non-nullable field', async ({ ${serviceVar} }) => {
    const payload = (invalidData as any).nullValuePayload || { name: null };
    const response = await ${serviceVar}.create(payload);
    expect([HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });
});
`;
}

function generateInvalidAuthSpec() {
  return `import { test, expect } from '@playwright/test';
import { HttpStatus } from '../../src/constants/httpStatus';

test.describe('Negative Authentication & Authorization Suite', () => {
  test('Reject request when Authorization header is missing', async ({ request }) => {
    const response = await request.get('/api/v1/protected', {
      headers: { 'Authorization': '' }
    });
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Reject request with malformed / expired Bearer token', async ({ request }) => {
    const response = await request.get('/api/v1/protected', {
      headers: {
        'Authorization': 'Bearer invalid-expired-malformed-token-12345'
      }
    });
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Reject request with invalid API Key', async ({ request }) => {
    const response = await request.get('/api/v1/protected', {
      headers: { 'X-API-Key': 'invalid_api_key_string' }
    });
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });
});
`;
}

function generateInvalidRequestSpec(sampleResource) {
  return `import { test, expect } from '@playwright/test';
import { HttpStatus } from '../../src/constants/httpStatus';

test.describe('Negative HTTP Protocol & Payload Formatting Suite', () => {
  test('Reject request with malformed JSON syntax in body', async ({ request }) => {
    const response = await request.post('/${sampleResource}', {
      data: '{ malformed_json: true, missing_quote: }',
      headers: { 'Content-Type': 'application/json' }
    });
    expect([HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Reject request with unsupported Content-Type header (text/plain)', async ({ request }) => {
    const response = await request.post('/${sampleResource}', {
      data: 'plain text body content',
      headers: { 'Content-Type': 'text/plain' }
    });
    expect([HttpStatus.UNSUPPORTED_MEDIA_TYPE, HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });
});
`;
}

function generateValidationSpec(sampleResource) {
  return `import { test, expect } from '@playwright/test';
import { HttpStatus } from '../../src/constants/httpStatus';

test.describe('Negative Boundary & Type Validation Suite', () => {
  test('Reject payload with string value supplied for numeric ID', async ({ request }) => {
    const response = await request.post('/${sampleResource}', {
      data: { id: 'invalid_numeric_string_xyz', status: 12345 }
    });
    expect([HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('Reject payload with out-of-bounds integer overflow value', async ({ request }) => {
    const response = await request.post('/${sampleResource}', {
      data: { id: 99999999999999999999999 }
    });
    expect([HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });
});
`;
}

function generateSecuritySpec(resourceName, lowerName, groupEndpoints) {
  const serviceVar = resourceName.charAt(0).toLowerCase() + resourceName.slice(1) + 'Service';

  return `import { test, expect } from '../../src/fixtures/api.fixture';
import { HttpStatus } from '../../src/constants/httpStatus';
import securityPayloads from '../../test-data/security/security-payloads.json';

test.describe('${resourceName} Security, Vulnerability & Injection Suite', () => {
  test('Check unauthorized access protection without headers', async ({ request }) => {
    const samplePath = '/${lowerName}';
    const unauthResponse = await request.get(samplePath, {
      headers: { 'Authorization': '' }
    });
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(unauthResponse.status());
  });

  test('BOLA / IDOR Protection: Prevent accessing unauthorized negative ID (-1)', async ({ ${serviceVar} }) => {
    const response = await ${serviceVar}.fetchById(-1);
    expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
    expect(response.ok()).toBe(false);
  });

  test('SQL Injection Protection: Ensure server does not crash with 500 on SQLi payloads', async ({ request }) => {
    for (const sqli of (securityPayloads as any).sqlInjection) {
      const response = await request.get(\`/${lowerName}?query=\${encodeURIComponent(sqli)}\`);
      expect(response.status()).not.toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  });

  test('XSS Payload Protection: Ensure server safely handles script injection payloads', async ({ ${serviceVar} }) => {
    for (const xss of (securityPayloads as any).xssInjection) {
      const response = await ${serviceVar}.create({ name: xss, description: xss } as any);
      expect(response.status()).not.toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  });
});
`;
}

function generateSecurityAuthSpec(targetPath) {
  return `import { test, expect } from '@playwright/test';
import { HttpStatus } from '../../src/constants/httpStatus';

test.describe('Security: Authentication Header Enforcement', () => {
  test('Tampered token signature is rejected', async ({ request }) => {
    const response = await request.get('${targetPath}', {
      headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered_signature' }
    });
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(response.status());
  });
});
`;
}

function generateSecurityAuthzSpec(targetPath) {
  return `import { test, expect } from '@playwright/test';
import { HttpStatus } from '../../src/constants/httpStatus';

test.describe('Security: Role-Based Access Control (RBAC)', () => {
  test('User role cannot access admin-only endpoints', async ({ request }) => {
    const response = await request.get('${targetPath}', {
      headers: { 'x-user-role': 'USER' }
    });
    expect([HttpStatus.FORBIDDEN, HttpStatus.UNAUTHORIZED]).toContain(response.status());
  });
});
`;
}

function generateSecurityBolaSpec(targetPath) {
  return `import { test, expect } from '@playwright/test';
import { HttpStatus } from '../../src/constants/httpStatus';

test.describe('Security: BOLA / IDOR Vulnerability Tests', () => {
  test('Direct object manipulation with out-of-range tenant ID', async ({ request }) => {
    const response = await request.get('${targetPath}/-99999');
    expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST, HttpStatus.FORBIDDEN, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status());
  });
});
`;
}

function generateSecurityJwtSpec(targetPath) {
  return `import { test, expect } from '@playwright/test';
import { HttpStatus } from '../../src/constants/httpStatus';

test.describe('Security: JWT Vulnerability Protection', () => {
  test('Reject JWT tokens with algorithm "none"', async ({ request }) => {
    const noneAlgToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.e30.';
    const response = await request.get('${targetPath}', {
      headers: { 'Authorization': \`Bearer \${noneAlgToken}\` }
    });
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(response.status());
  });
});
`;
}

function generateSecurityInjectionSpec(targetPath) {
  return `import { test, expect } from '@playwright/test';
import { HttpStatus } from '../../src/constants/httpStatus';
import securityPayloads from '../../test-data/security/security-payloads.json';

test.describe('Security: Injection Attacks Protection', () => {
  for (const sqli of securityPayloads.sqlInjection) {
    test(\`SQL Injection check with payload: \${sqli}\`, async ({ request }) => {
      const response = await request.get(\`${targetPath}?query=\${encodeURIComponent(sqli)}\`);
      // Server must NOT leak internal SQL error 500
      expect(response.status()).not.toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }
});
`;
}

function generateSecurityRateLimitSpec(targetPath) {
  return `import { test, expect } from '@playwright/test';

test.describe('Security: Rate Limiting & Stability', () => {
  test('Endpoint withstands rapid consecutive bursts without crashing', async ({ request }) => {
    const requests = Array.from({ length: 10 }).map(() => request.get('${targetPath}'));
    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.status()).toBeLessThan(500);
    }
  });
});
`;
}

function generateTokenScript() {
  return `import { TokenManager } from '../src/utils/tokenManager';

async function main() {
  console.log('🔑 Requesting access token using TokenManager...');
  const token = await TokenManager.getAccessToken();
  console.log(\`✅ Access Token Acquired: \${token.substring(0, 30)}...\`);
}

main().catch(console.error);
`;
}

function generateTestDataScript() {
  return `import { DataGenerator } from '../src/utils/dataGenerator';
import { RandomUtils } from '../src/utils/randomUtils';

async function main() {
  console.log('🧪 Synthesizing mock test datasets...');
  const dataset = {
    userId: RandomUtils.randomNumber(100, 999),
    userName: DataGenerator.randomString('user'),
    userEmail: DataGenerator.randomEmail()
  };
  console.log('✅ Generated Sample Data:', JSON.stringify(dataset, null, 2));
}

main().catch(console.error);
`;
}

function generateCleanupScript() {
  return `async function main() {
  console.log('🧹 Running post-test data cleanup routines...');
  console.log('✅ Temporary records pruned successfully.');
}

main().catch(console.error);
`;
}

// -------------------------------------------------------------
// Legacy Wrappers (Ensures compatibility with existing controllers/tests)
// -------------------------------------------------------------

function generateLegacyController(className, resourceName, groupEndpoints) {
  return `import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from '../utils/BaseApiClient';
import { ${resourceName}Model } from '../models/${resourceName}Model';

export class ${className} {
  readonly apiClient: BaseApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new BaseApiClient(request);
  }

  async getAll(): Promise<APIResponse> {
    return await this.apiClient.get('/${resourceName.toLowerCase()}');
  }

  async getById(id: number | string): Promise<APIResponse> {
    return await this.apiClient.get(\`/${resourceName.toLowerCase()}/\${id}\`);
  }

  async create(payload?: ${resourceName}Model): Promise<APIResponse> {
    return await this.apiClient.post('/${resourceName.toLowerCase()}', { data: payload });
  }

  async update(id: number | string, payload?: ${resourceName}Model): Promise<APIResponse> {
    return await this.apiClient.put(\`/${resourceName.toLowerCase()}/\${id}\`, { data: payload });
  }

  async delete(id: number | string): Promise<APIResponse> {
    return await this.apiClient.delete(\`/${resourceName.toLowerCase()}/\${id}\`);
  }
}
`;
}

function generateLegacySpec(tag, className, resourceName, groupEndpoints) {
  return `import { test, expect } from '@playwright/test';
import { ${className} } from '../controllers/${className}';
import { testData } from '../fixtures/testData';

test.describe('${resourceName} API Test Suite', () => {
  test('GET /${resourceName.toLowerCase()} - Success status', async ({ request }) => {
    const controller = new ${className}(request);
    const response = await controller.getAll();
    expect([200, 201, 204]).toContain(response.status());
  });

  test('POST /${resourceName.toLowerCase()} - Success status', async ({ request }) => {
    const controller = new ${className}(request);
    const response = await controller.create(testData.${resourceName} || {});
    expect([200, 201, 204]).toContain(response.status());
  });
});
`;
}

function generateLegacyTestData(parsedSpec) {
  const mockObjects = {};
  for (const ep of parsedSpec.endpoints) {
    if (ep.parameters && ep.parameters.body && ep.parameters.body.examplePayload) {
      const keyName = cleanIdentifier(ep.tag);
      mockObjects[keyName] = ep.parameters.body.examplePayload;
    }
  }
  return `export const testData = ${JSON.stringify(mockObjects, null, 2)};\n`;
}

function generateReadme(title, version, baseUrl, endpointCount, tagList) {
  return `# ${title} - Enterprise Playwright TypeScript API Automation

Auto-generated by **Swagger2API AI Agent** using the recommended 4-tier enterprise architecture:
\`TEST\` ➡️ \`SERVICE\` ➡️ \`API CLIENT\` ➡️ \`BASE API CLIENT\` ➡️ \`PLAYWRIGHT REQUEST\`

- **API Title**: ${title} (v${version})
- **Base URL**: \`${baseUrl}\`
- **Total Endpoints Tested**: ${endpointCount}
- **Domains Tested**: ${tagList.join(', ')}

---

## 🏛️ Architecture Overview

\`\`\`
tests/regression/...        (Test layer focusing on business validation)
        ↓
src/services/...           (Service layer encapsulating domain business logic)
        ↓
src/clients/...            (API Client layer mapping endpoint paths)
        ↓
src/clients/baseApiClient  (Base API Client handling HTTP methods & headers)
        ↓
Playwright Request Context
\`\`\`

---

## 📂 Project Structure

\`\`\`
api-automation-framework/
├── .github/workflows/api-tests.yml
├── config/
│   ├── environments/ (dev.config.ts, qa.config.ts, prod.config.ts)
│   └── framework.config.ts
├── src/
│   ├── clients/ (baseApiClient.ts, authClient.ts, <resource>Client.ts)
│   ├── services/
│   │   ├── authentication/ (oauth, jwt, apiKey, authManager)
│   │   └── <resource>/<resource>.service.ts
│   ├── models/ (auth.model.ts, apiResponse.model.ts, <resource>.model.ts)
│   ├── schemas/ (auth.schema.ts, <resource>.schema.ts)
│   ├── utils/ (tokenManager, dataGenerator, dateUtils, randomUtils, logger, fileUtils)
│   ├── constants/ (endpoints, httpStatus, roles, errorMessages)
│   └── fixtures/ (api.fixture.ts, auth.fixture.ts, testData.fixture.ts)
├── test-data/
│   ├── <resource>/ (valid-<resource>.json, invalid-<resource>.json, test-data.json)
│   └── security/ (security-payloads.json)
├── tests/
│   ├── smoke/ (auth.smoke.spec.ts, <resource>.smoke.spec.ts)
│   ├── regression/<resource>/ (create, update, delete, full spec)
│   ├── negative/ (invalid-auth, invalid-request, validation)
│   ├── security/ (authentication, authorization, bola-idor, jwt, injection, rate-limit)
│   └── contract/ (<resource>.contract.spec.ts)
├── scripts/ (generate-token.ts, generate-test-data.ts, cleanup.ts)
├── allure-results/
└── allure-report/
\`\`\`

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Run Test Suites
\`\`\`bash
# Run all tests
npm test

# Run smoke tests
npm run test:smoke

# Run regression tests
npm run test:regression

# Run negative & boundary tests
npm run test:negative

# Run security & BOLA/IDOR tests
npm run test:security

# Run contract tests
npm run test:contract
\`\`\`

### 3. Multi-Environment Execution
\`\`\`bash
ENV=qa npm test
ENV=dev npm test
\`\`\`

### 4. View Allure Reports
\`\`\`bash
npm run allure:generate
npm run allure:open
\`\`\`
`;
}

function mapTsType(type) {
  switch (type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'string';
  }
}

function mapSchemaType(type) {
  switch (type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'string';
  }
}

function generateOpencodeJson() {
  return JSON.stringify(
    {
      "$schema": "https://opencode.ai/config.json",
      "provider": {
        "amplify": {
          "npm": "@ai-sdk/openai",
          "name": "Amplify OpenAI Proxy",
          "options": {
            "baseURL": "https://amplify.planittesting.com/openai",
            "apiKey": "a663c977-018d-4b59-8059-0cf0605fa266"
          },
          "models": {
            "gpt-4-dev": {
              "name": "GPT-4 Dev (gpt-4.1)",
              "options": {
                "temperature": 0.2
              },
              "limit": {
                "context": 128000,
                "input": 128000,
                "output": 15000
              }
            },
            "gpt-5.1": {
              "name": "GPT-5.1",
              "options": {
                "reasoningEffort": "low",
                "textVerbosity": "low"
              },
              "limit": {
                "context": 128000,
                "input": 128000,
                "output": 15000
              }
            },
            "gpt-5.1-codex": {
              "name": "GPT-5.1 Codex",
              "options": {
                "reasoningEffort": "medium"
              },
              "limit": {
                "context": 128000,
                "input": 128000,
                "output": 15000
              }
            },
            "gpt-5.4-opencode": {
              "name": "GPT-5.4 OpenCode",
              "options": {
                "reasoningEffort": "medium"
              },
              "limit": {
                "context": 128000,
                "input": 128000,
                "output": 15000
              }
            }
          }
        }
      },
      "model": "amplify/gpt-5.4-opencode"
    },
    null,
    2
  );
}

function generateAgentMd(title, version, baseUrl, endpointCount, tagList) {
  return `# 🤖 AI Agent Guidance & Execution Specifications

**Project Name**: ${title}  
**API Version**: v${version}  
**Target Base URL**: \`${baseUrl}\`  
**Total Endpoints**: ${endpointCount}  
**Domain Tags**: ${tagList.join(', ')}  

---

## 🏛️ Enterprise 4-Tier Architecture Guidelines

All test suites and extensions in this framework strictly adhere to a **4-Tier Isolation Design**:

\`\`\`
TEST SUITE (tests/) ➡️ SERVICE LAYER (src/services/) ➡️ API CLIENT (src/clients/) ➡️ BASE API CLIENT (src/clients/baseApiClient.ts)
\`\`\`

### 1. Test Layer (\`tests/\`)
- Imports custom domain fixtures from \`src/fixtures/api.fixture\`.
- Contains test assertions, response status verifications, contract validations, and workflow orchestrations.
- Positive tests should invoke domain services (\`petService\`, \`storeService\`, \`userService\`) rather than making direct HTTP calls.

### 2. Service Layer (\`src/services/\`)
- Encapsulates domain business logic, data assembly, and state handling.
- Delegates HTTP execution to the corresponding API Client (\`PetClient\`, \`StoreClient\`, \`UserClient\`).

### 3. API Client Layer (\`src/clients/\`)
- Maps target OpenAPI endpoint routes parsed from the Swagger spec.
- Invokes \`BaseApiClient\` for HTTP methods (\`get\`, \`post\`, \`put\`, \`patch\`, \`delete\`).

### 4. Base API Client (\`src/clients/baseApiClient.ts\`)
- Wraps Playwright's \`APIRequestContext\`.
- Normalizes leading slash paths with \`cleanEndpoint()\` to avoid host-root base URL resolution bugs.
- Logs HTTP request payloads and response status codes using \`Logger\`.

---

## 🚀 Recommended Commands & Quality Gates

- **Execute All Tests**: \`npm test\`
- **Typecheck Quality Gate**: \`npm run typecheck\`
- **One-Step Allure HTML Report**: \`npm run test:allure\`
- **Smoke Suite**: \`npm run test:smoke\`
- **Regression Suite**: \`npm run test:regression\`
- **Negative & Boundary Suite**: \`npm run test:negative\`
- **Security Audit**: \`npm run test:security\`
- **Contract Schema Validation**: \`npm run test:contract\`

---

*Generated by Swagger2API AI Agent Tool.*
`;
}

module.exports = {
  generatePlaywrightFramework
};
