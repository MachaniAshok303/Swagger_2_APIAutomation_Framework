# System Architecture & Design Blueprint: Swagger2API Playwright AI Agent

An automated engineering agent designed to analyze Swagger / OpenAPI specifications and transform them into scalable, enterprise-grade Playwright TypeScript API automation frameworks following structured architectural design principles.

---

## 🏗️ High-Level Architectural Flow

```text
                  Swagger / OpenAPI Specification (JSON / YAML)
                                       │
                                       ▼
                       1. Contract Analysis & Ingestion
                          - Base URL & Server Resolution
                          - Path Parameters & Query Parameters
                          - Header Definitions & Auth Schemes
                          - Request/Response Schemas & Data Types
                          - Required vs Optional Property Analysis
                                       │
                                       ▼
                         2. API Design & Domain Layer
             ┌─────────────────────────┴─────────────────────────┐
             ▼                                                   ▼
     API Services Layer                                    Data & Schemas
  (Encapsulates Endpoints)                            (Models, AJV Schemas)
             │                                                   │
             └─────────────────────────┬─────────────────────────┘
                                       ▼
                       3. 4-Tier Enterprise Framework
    TEST SPECS ➡️ DOMAIN SERVICE ➡️ API CLIENT ➡️ BASE API CLIENT ➡️ PLAYWRIGHT API
                                       │
                                       ▼
                      4. Verification & Execution Engine
                          - Dynamic Correlation (ID Chaining)
                          - AJV Schema Contract Verification
                          - Multi-Environment Support (.env)
                          - Sensitive Credential Masked Logging
```

---

## 📋 20-Point Architectural Design Matrix

| # | Design Area | Implementation Strategy in Agent | Codebase Reference |
|---|---|---|---|
| **1** | **Contract Analysis** | Parses OpenAPI 3.x & Swagger 2.0 specs; extracts paths, params, headers, body schemas, required fields, and response status codes. | [`services/swaggerParser.js`](file:///c:/Swagger-to-Playwright%20AI%20Agent%20Tool/Swagger2API_Playwright_API_Agent/services/swaggerParser.js) |
| **2** | **Auth & Security** | Supports OAuth2, Bearer Token/JWT, API Key, Basic Auth; manages tokens in `.env` without hardcoding credentials. | [`TokenManager`](file:///c:/Swagger-to-Playwright%20AI%20Agent%20Tool/Swagger2API_Playwright_API_Agent/services/codeGenerator.js#L806) / [`AuthManager`](file:///c:/Swagger-to-Playwright%20AI%20Agent%20Tool/Swagger2API_Playwright_API_Agent/services/codeGenerator.js#L930) |
| **3** | **API Dependencies** | Generates independent controller suites as well as multi-step sequential E2E workflows touching APIs in business order. | `tests/e2e/e2e-workflow.spec.ts` |
| **4** | **Framework Architecture** | Enforces strict 4-tier separation: `TEST` ➡️ `SERVICE` ➡️ `API CLIENT` ➡️ `BASE API CLIENT` ➡️ `PLAYWRIGHT REQUEST`. | `src/clients/` & `src/services/` |
| **5** | **Reusable API Client** | Centralizes GET, POST, PUT, DELETE, headers, logging, and error handling in a common `BaseApiClient` class. | `src/clients/baseApiClient.ts` |
| **6** | **Request & Response Models**| Synthesizes strongly-typed TypeScript interfaces (`Create<Resource>Request`, `<Resource>Model`) from OpenAPI schemas. | `src/models/<resource>.model.ts` |
| **7** | **Test Data Management** | Separates valid/invalid static data; utilizes dynamic generators (`Date.now()`, random emails, UUIDs). | `test-data/` & `src/utils/dataGenerator.ts` |
| **8** | **Positive CRUD Testing** | Focuses on valid request payloads, smoke tests, and full CRUD happy path workflows across all detected endpoints. | `tests/regression/` & `tests/smoke/` |
| **9** | **Status & Response Checking**| Validates expected HTTP status codes (200, 201, 204), response OK flags, and returned JSON payload structures. | `tests/regression/<resource>/` |
| **10** | **AJV Schema Validation** | Compiles OpenAPI response schemas with Ajv to validate API response structure compliance. | `tests/contract/<resource>.contract.spec.ts` |
| **11** | **Dynamic Correlation** | Automatically extracts generated entity IDs from POST/GET response bodies and passes them to GET/PUT/DELETE requests. | `tests/regression/<resource>/<resource>.spec.ts` |
| **12** | **Environment Management** | Configures `dev`, `qa`, and `prod` configurations selectable at runtime via `ENV=qa npx playwright test`. | `config/environments/` |
| **13** | **Masked Logging** | Logs HTTP methods, URLs, latency, and status codes while redacting sensitive headers (`Authorization`, `API_KEY`, passwords). | `src/utils/logger.ts` |
| **14** | **Test Isolation** | Ensures test suites are independent, repeatable, and run cleanly without state leakage. | `playwright.config.ts` |
| **15** | **Teardown & Cleanup** | Includes explicit deletion verification steps and standalone cleanup routines. | `scripts/cleanup.ts` |
| **16** | **Playwright APIRequestContext** | Utilizes pure API request contexts without browser overhead for high-speed head-less API test execution. | `playwright.config.ts` & `api.fixture.ts` |
| **17** | **Reporting** | Compatible with Allure Playwright Reporter and Playwright HTML reports. | `playwright.config.ts` |
| **18** | **CI/CD Integration** | Generates GitHub Actions workflow `.github/workflows/api-tests.yml` for automated pipeline execution. | `.github/workflows/api-tests.yml` |
| **19** | **Fallback & Error Handling** | Detects declared endpoint methods dynamically to avoid executing non-existent HTTP routes. | [`codeGenerator.js`](file:///c:/Swagger-to-Playwright%20AI%20Agent%20Tool/Swagger2API_Playwright_API_Agent/services/codeGenerator.js#L1600) |
| **20** | **Pipeline Design Principle** | Step-by-step transformation: Swagger ➡️ Contract Analysis ➡️ Metadata/Schemas ➡️ Service/Client Design ➡️ Playwright Tests. | Entire Agent Architecture |

---

## 📂 Framework Directory Structure

```text
generated_playwright_framework/
├── .github/workflows/api-tests.yml   # Automated CI/CD pipeline
├── config/
│   ├── environments/                 # Multi-environment configs (dev, qa, prod)
│   └── framework.config.ts
├── src/
│   ├── clients/                      # API Client Layer (baseApiClient, <resource>Client)
│   ├── services/                     # Service Layer (<resource>.service.ts, authManager)
│   ├── models/                       # TypeScript interfaces (<resource>.model.ts)
│   ├── schemas/                      # AJV OpenAPI validation schemas
│   ├── utils/                        # Data generators, token manager, logger, date utils
│   ├── constants/                    # Endpoints, HTTP status codes, roles, error messages
│   └── fixtures/                     # Custom Playwright test fixtures (api.fixture.ts)
├── test-data/                        # Mock JSON datasets (valid and invalid)
├── tests/
│   ├── smoke/                        # Reachability & health smoke tests
│   ├── regression/                   # Full sequential CRUD suites per controller
│   ├── contract/                     # AJV schema validation tests
│   └── e2e/                          # Multi-controller business workflow
├── scripts/                          # Token generation, test data synthesis, cleanup
├── playwright.config.ts              # Playwright API configuration
├── tsconfig.json                     # TypeScript compiler configuration
├── package.json                      # Project dependencies & npm scripts
└── .env                              # Environment variables
```
