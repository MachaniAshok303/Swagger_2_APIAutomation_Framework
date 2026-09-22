const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const JSZip = require('jszip');
require('dotenv').config();

const { parseSwaggerSpec, fetchAndResolveSpecUrl } = require('./services/swaggerParser');
const { generatePlaywrightFramework } = require('./services/codeGenerator');
const { generatePostmanCollection } = require('./services/postmanGenerator');

const app = express();
const PORT = process.env.PORT || 3005;
const TEMP_RUN_ROOT = path.join(os.tmpdir(), 'swagger2api-playwright-runs');
const SERVER_STARTED_AT = new Date().toISOString();

function sanitizeRelativeFilePath(filePath) {
  const normalized = path.posix.normalize(String(filePath || '').replace(/\\/g, '/'));
  if (!normalized || normalized.startsWith('../') || normalized.includes('/../') || path.posix.isAbsolute(normalized)) {
    throw new Error(`Unsafe generated file path: ${filePath}`);
  }
  return normalized;
}

async function writeFrameworkFiles(runDir, files) {
  for (const file of files) {
    const relativePath = sanitizeRelativeFilePath(file.path);
    const absolutePath = path.join(runDir, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.content || '', 'utf8');
  }
}

function runProcess(command, args, options = {}) {
  const { cwd, env, timeoutMs = 240000 } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: process.platform === 'win32',
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
  });
}

function extractJsonPayload(output) {
  const startIndex = output.indexOf('{');
  const endIndex = output.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  try {
    return JSON.parse(output.slice(startIndex, endIndex + 1));
  } catch (error) {
    return null;
  }
}

function readStdIoText(entries = []) {
  return (entries || []).map((entry) => {
    if (typeof entry === 'string') return entry;
    if (entry && typeof entry.text === 'string') return entry.text;
    return '';
  }).join('');
}

function parseInlineJson(rawValue) {
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return rawValue;
  }
}

function normalizeEndpointValue(endpoint) {
  const value = String(endpoint || '');
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith('/') ? value : `/${value}`;
}

function normalizeApiExecution(execution = {}) {
  const parsedStatusCode = Number(execution.statusCode);
  const parsedResponseTimeMs = Number(execution.responseTimeMs);

  return {
    method: String(execution.method || 'TEST').toUpperCase(),
    endpoint: normalizeEndpointValue(execution.endpoint || execution.fullUrl || ''),
    urlType: execution.urlType === 'absolute' ? 'absolute' : 'relative',
    fullUrl: execution.fullUrl || execution.endpoint || '',
    payloadSent: execution.payloadSent ?? null,
    responseTimeMs: Number.isFinite(parsedResponseTimeMs) ? parsedResponseTimeMs : null,
    tokenConsumed: execution.tokenConsumed || 'Not used',
    statusCode: Number.isFinite(parsedStatusCode) ? parsedStatusCode : null
  };
}

function parseApiExecutions(stdoutEntries = []) {
  const output = readStdIoText(stdoutEntries);
  if (!output) return [];

  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const structuredExecutions = [];
  const fallbackExecutions = [];
  const pendingExecutions = [];

  for (const line of lines) {
    if (line.startsWith('[API_TRACE] ')) {
      try {
        structuredExecutions.push(normalizeApiExecution(JSON.parse(line.slice('[API_TRACE] '.length))));
      } catch (error) {}
      continue;
    }

    const requestMatch = line.match(/^\[REQ\] -> (\w+) (\S+)(?:\s+(.*))?$/);
    if (requestMatch) {
      const [, method, url, payloadText] = requestMatch;
      const fallbackExecution = normalizeApiExecution({
        method,
        endpoint: url,
        fullUrl: url,
        urlType: /^https?:\/\//i.test(url) ? 'absolute' : 'relative',
        payloadSent: parseInlineJson(payloadText),
        tokenConsumed: 'Not captured'
      });
      fallbackExecutions.push(fallbackExecution);
      pendingExecutions.push(fallbackExecution);
      continue;
    }

    const responseMatch = line.match(/^\[RES\] <- (\d+) (\w+) (\S+)$/);
    if (responseMatch) {
      const [, statusCode, method, url] = responseMatch;
      const normalizedUrl = normalizeEndpointValue(url);
      const target = [...pendingExecutions].reverse().find((execution) =>
        execution.method === String(method).toUpperCase() &&
        execution.statusCode == null &&
        (execution.fullUrl === url || execution.endpoint === normalizedUrl)
      );
      if (target) target.statusCode = Number(statusCode);
    }
  }

  return structuredExecutions.length ? structuredExecutions : fallbackExecutions;
}

function simplifyFailureMessage(errorMessage = '') {
  const normalizedMessage = String(errorMessage || '').replace(/\r/g, '').trim();
  if (!normalizedMessage) return '';

  const lowerMessage = normalizedMessage.toLowerCase();
  if (lowerMessage.includes('cannot read "clipboard"') || lowerMessage.includes('cannot read clipboard')) {
    if (lowerMessage.includes('does not support image input')) {
      return 'The test failed because the agent tried to read an image from the clipboard, but the current model does not support image input. Provide the image as a file instead of using the clipboard.';
    }

    return 'The test failed because the agent tried to read clipboard content, but clipboard input is not available in this run.';
  }

  const meaningfulLine = normalizedMessage
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !/^at\s+/i.test(line));

  if (!meaningfulLine) return normalizedMessage;
  return meaningfulLine.replace(/^Error:\s*/i, '').trim();
}

function collectPlaywrightTests(suites, parentTitles = [], tests = []) {
  for (const suite of suites || []) {
    const currentTitles = suite.title ? [...parentTitles, suite.title] : parentTitles;

    for (const spec of suite.specs || []) {
      const suiteLabel = currentTitles.join(' > ');
      for (const test of spec.tests || []) {
        const latestResult = (test.results || []).slice().reverse().find((result) => result.status) || {};
        const errorMessage = latestResult.error?.message || (latestResult.errors || []).map((err) => err.message).filter(Boolean).join('\n');
        const failureReason = simplifyFailureMessage(errorMessage);
        const apiExecutions = parseApiExecutions(latestResult.stdout || []);

        tests.push({
          title: test.title || spec.title || 'Unnamed test',
          suite: suiteLabel,
          file: spec.file || suite.file || '',
          status: latestResult.status || 'unknown',
          durationMs: latestResult.duration || 0,
          error: errorMessage || '',
          failureReason,
          apiExecutions
        });
      }
    }

    collectPlaywrightTests(suite.suites, currentTitles, tests);
  }

  return tests;
}

function summarizePlaywrightTests(testEntries, stats = {}) {
  const summary = {
    total: testEntries.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
    interrupted: 0,
    durationMs: stats.duration || testEntries.reduce((sum, entry) => sum + (entry.durationMs || 0), 0)
  };

  for (const entry of testEntries) {
    if (entry.status === 'passed') summary.passed += 1;
    else if (entry.status === 'skipped') summary.skipped += 1;
    else if (entry.status === 'timedOut') summary.timedOut += 1;
    else if (entry.status === 'interrupted') summary.interrupted += 1;
    else summary.failed += 1;
  }

  return summary;
}

function buildExecutionLogs(testEntries, summary, exitCode) {
  const logs = [
    { text: 'Installing framework dependencies in an isolated temp workspace...', type: 'info' },
    { text: 'Running Playwright API tests for real against the generated framework...', type: 'info' }
  ];

  for (const entry of testEntries) {
    const label = entry.suite ? `${entry.suite} > ${entry.title}` : entry.title;
    if (entry.status === 'passed') {
      logs.push({ text: `PASS ${label} (${entry.durationMs}ms)`, type: 'pass' });
    } else if (entry.status === 'skipped') {
      logs.push({ text: `SKIP ${label}`, type: 'skip' });
    } else {
      const reasonText = entry.failureReason || simplifyFailureMessage(entry.error);
      const reason = reasonText ? ` - ${reasonText}` : '';
      logs.push({ text: `FAIL ${label}${reason}`, type: 'fail' });
    }
  }

  logs.push({
    text: `Execution finished with exit code ${exitCode}. ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped out of ${summary.total}.`,
    type: summary.failed > 0 ? 'fail' : 'info'
  });

  return logs;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  return res.json({
    success: true,
    server: 'swagger2api-playwright-ai-agent',
    startedAt: SERVER_STARTED_AT,
    pid: process.pid,
    hasRunTestsEndpoint: true
  });
});

// Multer in-memory storage for uploaded Swagger files
const upload = multer({ storage: multer.memoryStorage() });

// Sample Offline API Presets
const SAMPLE_PETSTORE_SPEC = {
  openapi: "3.0.2",
  info: {
    title: "Swagger Petstore - OpenAPI 3.0",
    description: "Sample Petstore Server for API Automation Testing",
    version: "1.0.11"
  },
  servers: [
    { url: "https://petstore.swagger.io/v2" }
  ],
  paths: {
    "/pet": {
      post: {
        tags: ["pet"],
        summary: "Add a new pet to the store",
        operationId: "addPet",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 10 },
                  name: { type: "string", example: "doggie" },
                  status: { type: "string", example: "available" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Successful operation" },
          "405": { description: "Invalid input" }
        }
      },
      put: {
        tags: ["pet"],
        summary: "Update an existing pet",
        operationId: "updatePet",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 10 },
                  name: { type: "string", example: "updated_doggie" },
                  status: { type: "string", example: "sold" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Successful operation" },
          "400": { description: "Invalid ID supplied" },
          "404": { description: "Pet not found" }
        }
      }
    },
    "/pet/{petId}": {
      get: {
        tags: ["pet"],
        summary: "Find pet by ID",
        operationId: "getPetById",
        parameters: [
          { name: "petId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          "200": { description: "successful operation" },
          "400": { description: "Invalid ID supplied" },
          "404": { description: "Pet not found" }
        }
      },
      delete: {
        tags: ["pet"],
        summary: "Deletes a pet",
        operationId: "deletePet",
        parameters: [
          { name: "petId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          "200": { description: "Pet deleted successfully" },
          "400": { description: "Invalid ID supplied" }
        }
      }
    },
    "/store/order": {
      post: {
        tags: ["store"],
        summary: "Place an order for a pet",
        operationId: "placeOrder",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 1 },
                  petId: { type: "integer", example: 10 },
                  quantity: { type: "integer", example: 2 },
                  status: { type: "string", example: "placed" },
                  complete: { type: "boolean", example: true }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "successful operation" },
          "400": { description: "Invalid Order" }
        }
      }
    },
    "/store/order/{orderId}": {
      get: {
        tags: ["store"],
        summary: "Find purchase order by ID",
        operationId: "getOrderById",
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          "200": { description: "successful operation" },
          "404": { description: "Order not found" }
        }
      }
    },
    "/user": {
      post: {
        tags: ["user"],
        summary: "Create user",
        operationId: "createUser",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 100 },
                  username: { type: "string", example: "john_doe" },
                  email: { type: "string", example: "john@example.com" },
                  password: { type: "string", example: "secret123" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "successful operation" }
        }
      }
    }
  }
};

// API Routes

// 1. Get Preset Sample Specs
app.get('/api/preset', (req, res) => {
  return res.json({
    name: "Petstore OpenAPI 3.0",
    spec: SAMPLE_PETSTORE_SPEC
  });
});

// 1b. Check Swagger Document Access & Health
app.post('/api/check-access', async (req, res) => {
  const startTime = Date.now();
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const targetUrl = url.trim();
    console.log(`[ACCESS CHECK] Checking accessibility of: ${targetUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Swagger2API-Agent/1.0',
        'Accept': 'application/json, text/html, */*'
      }
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    const isAccessible = response.ok || response.status === 200 || response.status === 304;
    const contentType = response.headers.get('content-type') || 'unknown';

    return res.json({
      success: true,
      accessible: isAccessible,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      contentType,
      url: targetUrl
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.error(`[ACCESS CHECK FAILED]: ${err.message}`);
    return res.status(200).json({
      success: false,
      accessible: false,
      error: err.message,
      latencyMs
    });
  }
});

// 1b. Live API Try-Out & Authentication Validation Gate
app.post('/api/validate-auth', async (req, res) => {
  const startTime = Date.now();
  try {
    const { baseUrl, endpoint, authType, token, apiKeyHeader, basicAuth, customHeaders } = req.body;
    if (!baseUrl) {
      return res.status(400).json({ success: false, error: 'baseUrl is required' });
    }

    const cleanBase = baseUrl.replace(/\/+$/, '');
    const cleanPath = (endpoint || '/').startsWith('/') ? endpoint : `/${endpoint}`;
    const targetUrl = `${cleanBase}${cleanPath}`;

    console.log(`[AUTH VALIDATION] Probing endpoint: ${targetUrl} with authType: ${authType || 'none'}`);

    const headers = {
      'User-Agent': 'Swagger2API-Agent/1.0',
      'Accept': 'application/json, text/plain, */*',
      ...(customHeaders || {})
    };

    if (token) {
      if (authType === 'basic') {
        const basicVal = token.includes(':') ? Buffer.from(token).toString('base64') : token;
        headers['Authorization'] = `Basic ${basicVal}`;
      } else if (authType === 'apiKey') {
        const headerKey = apiKeyHeader || 'X-API-Key';
        headers[headerKey] = token;
      } else if (authType === 'uuid') {
        const headerKey = apiKeyHeader || 'Authorization';
        headers[headerKey] = token.startsWith('Bearer ') ? token : token;
      } else {
        // Default Bearer / JWT / JWK / OAuth2
        const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    let apiResponse;
    try {
      apiResponse = await fetch(targetUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const latencyMs = Date.now() - startTime;
    const status = apiResponse.status;
    const statusText = apiResponse.statusText;

    let responseBodyText = '';
    try {
      responseBodyText = (await apiResponse.text()).slice(0, 1500);
    } catch (e) {}

    // Deep Root-Cause Diagnostic Categorization (Phase 5 & Phase 6)
    let authStatus = 'UNKNOWN';
    let isSuccess = false;
    let isAuthError = false;
    let category = 'UNKNOWN';
    let message = '';
    let recommendation = '';

    if (status >= 200 && status <= 299) {
      authStatus = 'VALID';
      isSuccess = true;
      isAuthError = false;
      category = 'SUCCESS';
      message = token 
        ? `Authentication validated successfully. Credentials verified against ${cleanPath}.` 
        : `Public API access verified successfully. No credentials needed for ${cleanPath}.`;
      recommendation = 'API accessibility verified. Ready to proceed with generating Playwright automation scripts.';
    } else if (status === 401) {
      authStatus = 'INVALID_CREDENTIALS';
      isSuccess = false;
      isAuthError = true;
      category = 'AUTHENTICATION_ERROR';
      message = `401 Unauthorized: The provided authentication token could not successfully authenticate against ${cleanPath}.`;
      recommendation = 'Please verify your Bearer/JWT/API Key token is valid, unexpired, and correctly formatted, then validate again.';
    } else if (status === 403) {
      authStatus = 'FORBIDDEN';
      isSuccess = false;
      isAuthError = true;
      category = 'AUTHENTICATION_ERROR';
      message = `403 Forbidden: The provided credentials do not have permission or necessary roles to access ${cleanPath}.`;
      recommendation = 'Check token scopes, user role permissions, or try a different endpoint candidate with lower privilege requirements.';
    } else if (status === 400) {
      authStatus = 'BAD_REQUEST';
      isSuccess = false;
      isAuthError = false;
      category = 'PARAMETER_OR_PAYLOAD_ERROR';
      message = `400 Bad Request: Target endpoint ${cleanPath} rejected the request format. Root cause: Missing required query parameters, headers, or request payload.`;
      recommendation = 'This is a parameter/schema issue, not necessarily an invalid token. Select an alternate probe endpoint or provide required query params.';
    } else if (status === 404) {
      authStatus = 'ENDPOINT_NOT_FOUND';
      isSuccess = false;
      isAuthError = false;
      category = 'ENDPOINT_ERROR';
      message = `404 Not Found: Probe endpoint ${cleanPath} does not exist on ${cleanBase}. Root cause: Invalid path or incorrect Swagger Base URL.`;
      recommendation = 'Verify the server Base URL or select a different detected endpoint from the probe dropdown.';
    } else if (status === 405) {
      authStatus = 'METHOD_NOT_ALLOWED';
      isSuccess = false;
      isAuthError = false;
      category = 'ENDPOINT_ERROR';
      message = `405 Method Not Allowed: GET is not permitted on ${cleanPath}. Root cause: Endpoint may only accept POST or PUT.`;
      recommendation = 'Select an alternate GET probe endpoint from the candidates list.';
    } else if (status === 408) {
      authStatus = 'REQUEST_TIMEOUT';
      isSuccess = false;
      isAuthError = false;
      category = 'TIMEOUT_ERROR';
      message = `408 Request Timeout: Remote server timed out processing ${cleanPath}.`;
      recommendation = 'Check remote server load or network responsiveness.';
    } else if (status === 429) {
      authStatus = 'RATE_LIMITED';
      isSuccess = false;
      isAuthError = false;
      category = 'RATE_LIMIT_ERROR';
      message = `429 Too Many Requests: Rate limiting triggered while probing ${cleanPath}.`;
      recommendation = 'Wait a moment before retrying, or configure an API key with higher quota.';
    } else if (status >= 500) {
      authStatus = 'SERVER_ERROR';
      isSuccess = false;
      isAuthError = false;
      category = 'SERVER_ERROR';
      message = `${status} ${statusText}: Remote server encountered an internal error while executing ${cleanPath}. Root cause: Server-side application bug or offline backend dependency.`;
      recommendation = 'This is an upstream server error, not a client token problem. Verify backend health or try an alternate endpoint.';
    } else {
      authStatus = 'HTTP_ERROR';
      isSuccess = false;
      isAuthError = false;
      category = 'CLIENT_ERROR';
      message = `${status} ${statusText}: Unexpected response code while testing ${cleanPath}.`;
      recommendation = 'Inspect the sample response body below for specific API error diagnostics.';
    }

    return res.json({
      success: isSuccess,
      authStatus,
      isAuthError,
      category,
      statusCode: status,
      statusText,
      latencyMs,
      message,
      recommendation,
      targetUrl,
      sampleResponse: responseBodyText
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.error(`[AUTH VALIDATION ERROR]: ${err.message}`);
    const isTimeout = err.name === 'AbortError';
    return res.status(200).json({
      success: false,
      authStatus: isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
      isAuthError: false,
      category: isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
      statusCode: 0,
      statusText: isTimeout ? 'Connection Timed Out' : 'Network / Connection Failed',
      latencyMs,
      message: isTimeout 
        ? `Target server timed out after 9 seconds without responding.` 
        : `Network Error: ${err.message}. Could not connect to target host.`,
      recommendation: 'Verify the Base URL is reachable, DNS resolves, and no firewall/proxy is blocking outgoing requests.'
    });
  }
});

// 2. Fetch Swagger from URL (Smart resolver for Swagger UI or direct JSON/YAML)
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const { specContent, resolvedUrl } = await fetchAndResolveSpecUrl(url);
    const parsed = parseSwaggerSpec(specContent, resolvedUrl);

    return res.json({
      success: true,
      spec: parsed,
      rawContent: specContent,
      resolvedUrl
    });
  } catch (err) {
    console.error('[URL FETCH ERROR]:', err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Parse Swagger Spec (from Upload or Content)
app.post('/api/parse', upload.single('specFile'), async (req, res) => {
  try {
    let content;
    const sourceUrl = req.body.sourceUrl || req.body.url || '';

    if (req.file) {
      content = req.file.buffer.toString('utf-8');
    } else if (req.body && req.body.specContent) {
      content = req.body.specContent;
    } else {
      return res.status(400).json({ error: 'Please upload a Swagger file or provide specContent.' });
    }

    const parsed = parseSwaggerSpec(content, sourceUrl);
    if (req.body.baseUrl) {
      parsed.baseUrl = req.body.baseUrl;
    } else if (!parsed.baseUrl && sourceUrl && sourceUrl.startsWith('http')) {
      try { parsed.baseUrl = new URL(sourceUrl).origin; } catch (e) {}
    }
    return res.json({ success: true, spec: parsed, rawContent: content });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Generate Playwright Framework
app.post('/api/generate', async (req, res) => {
  try {
    const { specContent, options, sourceUrl, baseUrl } = req.body;
    if (!specContent) {
      return res.status(400).json({ error: 'specContent is required.' });
    }

    const clientOptions = options || {};
    const effectiveSourceUrl = sourceUrl || clientOptions.sourceUrl || '';
    const parsedSpec = parseSwaggerSpec(specContent, effectiveSourceUrl);

    // Priority: explicit baseUrl override > parsedSpec baseUrl from spec > sourceUrl origin
    if (baseUrl) {
      parsedSpec.baseUrl = baseUrl;
      clientOptions.overrideBaseUrl = baseUrl;
    } else if (clientOptions.baseUrl) {
      parsedSpec.baseUrl = clientOptions.baseUrl;
      clientOptions.overrideBaseUrl = clientOptions.baseUrl;
    } else if (!parsedSpec.baseUrl && effectiveSourceUrl && effectiveSourceUrl.startsWith('http')) {
      // Spec had no server URL — use the host from the URL the user submitted
      try {
        const resolvedBase = new URL(effectiveSourceUrl).origin;
        parsedSpec.baseUrl = resolvedBase;
        clientOptions.overrideBaseUrl = resolvedBase;
      } catch (e) {}
    } else if (parsedSpec.baseUrl) {
      // Use whatever the parser resolved — pass it through as override so config is correct
      clientOptions.overrideBaseUrl = parsedSpec.baseUrl;
    }

    // Phase 7: Mandatory Decision Gate - Enforce Authentication Validation
    const authReq = parsedSpec.authRequirement || { requiresAuth: false };
    if (authReq.requiresAuth && !clientOptions.isAuthValidated && !clientOptions.validatedAuthToken) {
      return res.status(400).json({
        success: false,
        error: `MANDATORY RULE VIOLATION: Cannot generate automation scripts before validating authentication. Detected required authentication: ${authReq.authDescription}. Please validate your credentials against the API first.`
      });
    }

    const framework = generatePlaywrightFramework(parsedSpec, clientOptions);

    return res.json({
      success: true,
      summary: {
        title: parsedSpec.title,
        version: parsedSpec.version,
        baseUrl: parsedSpec.baseUrl,
        totalEndpoints: parsedSpec.totalEndpoints,
        totalFiles: framework.totalFiles
      },
      files: framework.files
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Download Framework as ZIP
app.post('/api/download-zip', async (req, res) => {
  try {
    const { files, projectName } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files provided for ZIP.' });
    }

    const zip = new JSZip();
    const folderName = (projectName || 'playwright-api-suite').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const rootFolder = zip.folder(folderName);

    for (const f of files) {
      rootFolder.file(f.path, f.content);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);
    return res.send(zipBuffer);
  } catch (err) {
    return res.status(500).json({ error: `ZIP generation failed: ${err.message}` });
  }
});

// 4b. Execute Generated Framework for Real in an Isolated Temp Workspace
app.post('/api/run-tests', async (req, res) => {
  let runDir = '';

  try {
    const { files } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Generated framework files are required to run tests.' });
    }

    await fs.mkdir(TEMP_RUN_ROOT, { recursive: true });
    runDir = await fs.mkdtemp(path.join(TEMP_RUN_ROOT, 'run-'));
    await writeFrameworkFiles(runDir, files);

    const baseEnv = {
      ...process.env,
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
      CI: '1'
    };

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const installResult = await runProcess(npmCommand, ['install', '--no-fund', '--no-audit'], {
      cwd: runDir,
      env: baseEnv,
      timeoutMs: 240000
    });

    if (installResult.timedOut) {
      return res.status(500).json({
        success: false,
        error: 'Dependency installation timed out before Playwright tests could start.',
        logs: [
          { text: 'Installing framework dependencies in an isolated temp workspace...', type: 'info' },
          { text: 'Dependency installation timed out.', type: 'fail' }
        ],
        rawOutput: `${installResult.stdout}\n${installResult.stderr}`.trim()
      });
    }

    if (installResult.code !== 0) {
      return res.status(500).json({
        success: false,
        error: 'Dependency installation failed for the generated framework.',
        logs: [
          { text: 'Installing framework dependencies in an isolated temp workspace...', type: 'info' },
          { text: `npm install failed with exit code ${installResult.code}.`, type: 'fail' }
        ],
        rawOutput: `${installResult.stdout}\n${installResult.stderr}`.trim()
      });
    }

    const playwrightBinary = process.platform === 'win32'
      ? path.join(runDir, 'node_modules', '.bin', 'playwright.cmd')
      : path.join(runDir, 'node_modules', '.bin', 'playwright');

    const testResult = await runProcess(playwrightBinary, ['test', '--reporter=json', '--workers=1'], {
      cwd: runDir,
      env: baseEnv,
      timeoutMs: 240000
    });

    if (testResult.timedOut) {
      return res.status(500).json({
        success: false,
        error: 'Playwright execution timed out.',
        logs: [
          { text: 'Running Playwright API tests for real against the generated framework...', type: 'info' },
          { text: 'Playwright execution timed out.', type: 'fail' }
        ],
        rawOutput: `${testResult.stdout}\n${testResult.stderr}`.trim()
      });
    }

    const playwrightJson = extractJsonPayload(testResult.stdout);
    if (!playwrightJson) {
      return res.status(500).json({
        success: false,
        error: 'Playwright finished, but the JSON reporter output could not be parsed.',
        logs: [
          { text: 'Running Playwright API tests for real against the generated framework...', type: 'info' },
          { text: 'Could not parse Playwright JSON reporter output.', type: 'fail' }
        ],
        rawOutput: `${testResult.stdout}\n${testResult.stderr}`.trim()
      });
    }

    const tests = collectPlaywrightTests(playwrightJson.suites || []);
    const summary = summarizePlaywrightTests(tests, playwrightJson.stats || {});
    const logs = buildExecutionLogs(tests, summary, testResult.code);

    return res.json({
      success: true,
      executionSucceeded: testResult.code === 0 && summary.failed === 0,
      summary,
      tests,
      logs,
      exitCode: testResult.code,
      rawOutput: `${testResult.stdout}\n${testResult.stderr}`.trim()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (runDir) {
      await fs.rm(runDir, { recursive: true, force: true }).catch(() => {});
    }
  }
});

// 5. Generate Postman Collection
app.post('/api/generate-postman', async (req, res) => {
  try {
    const { specContent, sourceUrl, baseUrl } = req.body;
    if (!specContent) {
      return res.status(400).json({ error: 'specContent is required.' });
    }

    const effectiveSrcUrl = sourceUrl || '';
    const parsedSpec = parseSwaggerSpec(specContent, effectiveSrcUrl);
    if (baseUrl) {
      parsedSpec.baseUrl = baseUrl;
    } else if (!parsedSpec.baseUrl && effectiveSrcUrl.startsWith('http')) {
      try { parsedSpec.baseUrl = new URL(effectiveSrcUrl).origin; } catch (e) {}
    }
    const postmanCollection = generatePostmanCollection(parsedSpec);

    return res.json({
      success: true,
      collection: postmanCollection
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Download Postman Collection JSON
app.post('/api/download-postman', async (req, res) => {
  try {
    const { collection } = req.body;
    if (!collection) {
      return res.status(400).json({ error: 'collection object is required.' });
    }

    const jsonStr = JSON.stringify(collection, null, 2);
    const filename = `${(collection.info && collection.info.name || 'api-collection').toLowerCase().replace(/[^a-z0-9]/g, '-')}.postman_collection.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(jsonStr);
  } catch (err) {
    return res.status(500).json({ error: `Postman export failed: ${err.message}` });
  }
});

app.use('/api', (req, res) => {
  return res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return next(err);
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON request body.'
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error.'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Swagger2API Playwright AI Agent Server Running`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
