# Swagger 2 API Automation Framework

`Swagger 2 API Automation Framework` is an AI-assisted tool that converts Swagger/OpenAPI contracts into a runnable Playwright TypeScript API automation framework.

It helps teams move from API documentation to executable tests quickly, with generated clients, services, fixtures, typed models, environment configuration, and Playwright test suites.

## Why This Is Useful

- Reduces manual effort when starting API automation from a Swagger or OpenAPI file.
- Produces a structured Playwright API framework instead of a flat set of test files.
- Supports local files, raw pasted specs, and hosted Swagger URLs.
- Detects base URLs, endpoints, request bodies, response schemas, and authentication patterns.
- Generates reusable layers for long-term maintenance, not just one-off test scripts.
- Exports the generated framework as a ZIP so other teams can run it independently.

## Repository Layout

```text
.
├── Swagger2API_Playwright_API_Agent/
│   ├── docs/                          # Architecture and supporting docs
│   ├── public/                        # Web UI
│   ├── sample_specs/                  # Demo Swagger/OpenAPI specs
│   ├── scripts/                       # CLI generation helpers
│   ├── services/                      # Parser and generator logic
│   ├── tests/                         # Backend validation tests
│   ├── generated_playwright_framework/ # Example generated framework output
│   ├── package.json
│   └── server.js
├── package.json                       # Workspace convenience scripts
└── .gitignore
```

## Run This Project Locally

### Clone and start

```bash
git clone https://github.com/MachaniAshok303/Swagger_2_APIAutomation_Framework.git
cd Swagger_2_APIAutomation_Framework
npm install
npm --prefix Swagger2API_Playwright_API_Agent install
npm start
```

Open `http://localhost:3005` in the browser.

### Run project tests

```bash
npm test
```

### Generate a framework directly to disk

```bash
npm --prefix Swagger2API_Playwright_API_Agent run generate:disk
```

Generate from a specific online Swagger/OpenAPI URL:

```bash
node Swagger2API_Playwright_API_Agent/scripts/generateToDisk.js https://petstore.swagger.io/v2/swagger.json
```

Generate from a local spec file:

```bash
node Swagger2API_Playwright_API_Agent/scripts/generateToDisk.js .\Swagger2API_Playwright_API_Agent\sample_specs\petstore_v3.json
```

## How External Users Can Try The Generated Framework

If a user downloads or receives a generated framework folder, they can run it independently:

```bash
cd Swagger2API_Playwright_API_Agent/generated_playwright_framework
npm install
npm test
```

Useful commands inside a generated framework:

```bash
npm run test:smoke
npm run test:regression
npm run test:e2e
npm run test:report
npm run allure:generate
```

## Main Workflow

1. User provides a Swagger/OpenAPI contract through upload, pasted text, or URL.
2. The server resolves the source and normalizes the contract.
3. The parser extracts metadata, base URL, endpoints, parameters, schemas, tags, and auth requirements.
4. The generator builds a Playwright TypeScript project using the parsed contract.
5. The application returns the generated files for preview, ZIP download, or local execution.

## How It Works Internally

### 1. Express server layer

`Swagger2API_Playwright_API_Agent/server.js` provides the application API and static web app hosting.

Key responsibilities:

- Serves the frontend from `public/`.
- Accepts Swagger files and raw spec content.
- Fetches remote Swagger URLs.
- Calls the parser and code generator.
- Builds ZIP downloads for the generated framework.
- Can run Playwright tests in an isolated temporary workspace.
- Can generate a Postman collection from the same parsed contract.

Important endpoints include:

- `GET /api/health`
- `POST /api/fetch-url`
- `POST /api/parse`
- `POST /api/generate`
- `POST /api/download-zip`
- `POST /api/run-tests`
- `POST /api/generate-postman`

### 2. Swagger/OpenAPI parsing

`Swagger2API_Playwright_API_Agent/services/swaggerParser.js` is responsible for understanding the contract.

It performs these tasks:

- Detects whether the document is Swagger 2.0 or OpenAPI 3.x.
- Parses JSON or YAML input.
- Resolves server/base URLs, including relative and placeholder hosts.
- Reads paths, HTTP methods, request parameters, request bodies, and response schemas.
- Groups endpoints by tags so each domain can become its own generated module.
- Detects authentication patterns such as bearer token, OAuth2, API key, and basic auth.

The parser produces a normalized object that becomes the single source of truth for generation.

### 3. Framework generation

`Swagger2API_Playwright_API_Agent/services/codeGenerator.js` transforms the parsed contract into files.

The generator creates:

- `playwright.config.ts`
- `.env` and environment-specific config files
- reusable API clients
- service layer abstractions
- request/response models
- schema validation files
- fixtures and test data
- smoke, regression, contract, negative, security, and E2E test suites
- CI workflow files and utility scripts

The generated framework follows this layered design:

```text
Tests
  -> Services
  -> API Clients
  -> Base API Client
  -> Playwright APIRequestContext
```

This structure keeps generated tests easier to scale and maintain than putting request logic directly inside spec files.

### 4. Disk generation path

`Swagger2API_Playwright_API_Agent/scripts/generateToDisk.js` is the CLI entry point for local generation.

It can:

- fetch a remote Swagger/OpenAPI URL,
- read a local spec file,
- parse the contract,
- generate the framework,
- write the output into `generated_playwright_framework/`.

### 5. Generated framework behavior

The generated project is intended to be runnable on another machine with standard Node.js tooling:

1. install dependencies,
2. configure `.env` values if needed,
3. execute Playwright API tests,
4. review Playwright or Allure reports.

Because it uses Playwright's API testing capabilities, browser installation is not the primary dependency for normal API execution.

## Tech Stack

- Node.js
- Express
- Playwright
- TypeScript
- YAML parser
- JSZip
- Multer
- Dotenv

## Notes For GitHub Publishing

This repository now ignores common Node.js and generated runtime artifacts such as:

- `node_modules`
- `.env` files
- Playwright reports
- Allure results and reports
- temporary folders
- caches and editor metadata

That keeps the GitHub repository smaller and focused on source, docs, and reusable generated samples.
open public Swagger url:- https://fakerestapi.azurewebsites.net/index.html
---
Authenticated swagger Document url:- https://petstore.swagger.io/
