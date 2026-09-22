# 🤖 Swagger2API | AI Agent for Playwright TypeScript API Automation

> **AI Challenge 2026 - Agents for Testing**  
> Generate scalable, production-grade Playwright TypeScript API Test Automation Frameworks from Swagger / OpenAPI documentation in seconds.

---

## 🌟 Key Features

- **Multi-Format Input**: Upload OpenAPI / Swagger specifications (`.json` or `.yaml`), paste raw content, or provide a Swagger URL.
- **Smart URL Auto-Discovery**: Input Swagger UI links (e.g. `https://fakerestapi.azurewebsites.net/index.html`); the agent inspects the HTML and auto-resolves the underlying JSON schema.
- **Scalable Framework Architecture**:
  - `playwright.config.ts` configured for parallel test execution, HTML/JSON reports, and base URLs.
  - `utils/apiClient.ts` reusable request context wrapper with auto-logging and status assertions.
  - `controllers/<Resource>Api.ts` API Object Model (AOM) service classes.
  - `tests/<resource>.spec.ts` positive (200/201), negative (400/404), and schema validation test suites.
  - `fixtures/testData.ts` mock payloads derived directly from OpenAPI schemas.
- **Interactive Code Workbench**: Multi-file tree explorer, syntax highlighting, copy-to-clipboard, and live Playwright execution simulator.
- **1-Click ZIP Export**: Download complete test suite ready to run `npx playwright test`.

---

## 📂 Project Structure

```
Swagger2API_Playwright_API_Agent/
├── docs/                    # System architecture & enterprise solution guides
│   ├── ARCHITECTURE.md      # Detailed system design & component interaction
│   └── SOLUTION_GUIDE.md    # Comprehensive enterprise solution walkthrough
├── public/                  # Modern glassmorphism web dashboard
│   ├── index.html           # UI layout
│   ├── style.css            # Dark mode styles & responsive design
│   └── app.js               # Reactive client-side logic
├── sample_specs/            # Offline Swagger specs for zero-delay demoing
│   └── petstore_v3.json     # Standard Petstore OpenAPI 3.0 spec
├── services/                # Core Agent Logic
│   ├── swaggerParser.js     # OpenAPI / Swagger spec ingestion engine
│   └── codeGenerator.js     # Playwright TypeScript code synthesizer
├── tests/                   # Automated regression test suites
│   ├── parser.test.js       # Parser unit tests
│   ├── generator.test.js    # Framework synthesizer tests
│   └── api.test.js          # Server integration tests
├── .env.example             # Environment variable template
├── .gitignore               # Ignored runtime artifacts
├── package.json             # Project dependencies & scripts
├── server.js                # Express API backend
└── README.md                # Project documentation
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Run Automated Tests
```bash
npm test
```

---

## 🧪 Testing with Real-World URLs
Try inputting:
```
https://fakerestapi.azurewebsites.net/index.html
```
The agent will discover `/swagger/v1/swagger.json`, analyze all 27 endpoints, and generate 16 Playwright TypeScript framework files!
