# 📊 Allure Test Report Specification & Diagnostics Guide

This document defines the architecture, metrics, and detailed diagnostic reporting implemented for the **Allure Test Execution Report** within the **Swagger2API AI Agent** solution.

---

## 🎯 1. Multi-Tab User Experience

When a user clicks **"View Allure Report"** on the dashboard ([`http://localhost:3000`](http://localhost:3000)):
* The report automatically opens in a **new browser tab** (`/allure-report.html`).
* Active test execution data (API title, version, base URL, resource controllers, and endpoint counts) is dynamically persisted via `localStorage` and loaded into the report tab.
* Allows engineers to view comprehensive test execution diagnostics side-by-side with their Swagger specifications and code workbench.

---

## 📈 2. Executive KPI & Consumption Metrics

The report header and executive dashboard display high-level consumption and health indicators:

| Metric | Description | Example Value |
| :--- | :--- | :--- |
| **Passed Scenarios** | Number and percentage of successful test assertions | `28 / 28 (100% Passed)` |
| **Failed Scenarios** | Test failures or regression defects detected | `0` |
| **Broken / Flaky** | Network disconnects, DNS timeouts, or unhandled errors | `0` |
| **Total Response Time Consumed** | Cumulative duration consumed across all test requests | `2.42s` (Avg: `86ms/req`) |
| **Total Resources Consumed** | Total test suites, endpoints, and resource controllers executed | `28 Tests across 5 Controllers` |
| **Target Environment** | Base URL and testing profile | `https://fakerestapi.azurewebsites.net` (`ENV=qa`) |

---

## 🔬 3. Deep Scenario Diagnostics & Payload Inspection

Each test scenario in the report is expandable, revealing full HTTP transaction forensics:

### A. Request Details & Sent Payload ("What is Payload It Paid")
* **HTTP Method & Target URL**: e.g., `POST https://fakerestapi.azurewebsites.net/api/v1/Books`
* **Request Headers**:
  ```json
  {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": "Bearer test-jwt-token-cached-99482"
  }
  ```
* **Request Body Payload**: Exact data payload constructed and transmitted by the service layer:
  ```json
  {
    "id": 105,
    "title": "Automated QA Books Sample",
    "description": "Verified payload execution for Books",
    "status": "active",
    "createdAt": "2026-09-04T09:15:00.000Z"
  }
  ```

---

### B. Response Details & HTTP Status Message
* **HTTP Status Message**: Explicit status code and text description:
  * `200 OK` (Fetch collection, resource retrieval)
  * `201 Created` (Record creation)
  * `204 No Content` (Resource deletion)
  * `400 Bad Request` (Validation error boundary)
  * `401 Unauthorized` (Security token enforcement)
  * `404 Not Found` (Non-existent identifier query)
* **Response Time / Consumed Latency**: Exact latency recorded for the call (e.g. `118ms`, `57ms`).
* **Response Headers**: Server type, content type, cache controls, and locations.
* **Response Body**: Full JSON payload returned by the target host.

---

### C. Step-by-Step Assertion Verification
Every scenario lists the individual assertion checkpoints executed:
* `✓ expect(response.status()).toBe(201) [Passed]`
* `✓ expect(response.statusText()).toBe("Created") [Passed]`
* `✓ expect(response.time()).toBeLessThan(1000ms) [Passed: 118ms consumed]`
* `✓ expect(response.body).toMatchSchema(BooksSchema) [Passed]`

---

## 🔍 4. Filtering & Search Capabilities

The report includes real-time filtering:
* **By Classification**:
  * `All Scenarios` (Complete regression test suite)
  * `Positive / CRUD` (Happy path creation, retrieval, updates, and deletes)
  * `Negative / Boundary` (Non-existent IDs, malformed JSON, out-of-range types)
  * `Security & IDOR` (BOLA/IDOR protection, JWT "none" alg bypass, SQL injection sanitization, rate-limit stability)
* **By Live Search**:
  * Real-time query matching against scenario names, HTTP verbs, paths, HTTP status messages, or payload properties.

---

## 🛠️ 5. Standalone Playwright Allure CLI Commands

Inside the generated framework project ([`generated_playwright_framework/`](file:///c:/Swagger-to-Playwright%20AI%20Agent%20Tool/Swagger2API_Playwright_API_Agent/generated_playwright_framework)), engineers can run native Allure CLI commands:

```bash
# 1. Execute Playwright tests and emit Allure results
npm test

# 2. Generate static Allure HTML report from raw results
npm run allure:generate

# 3. Open Allure report server in default browser
npm run allure:open
```
