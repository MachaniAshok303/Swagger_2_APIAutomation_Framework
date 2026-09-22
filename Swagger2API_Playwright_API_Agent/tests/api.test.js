const assert = require('assert');
const http = require('http');

console.log('🧪 Running Server API Integration Tests...');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  const PORT = process.env.PORT || 3005;

  // Test 1: GET /api/preset
  const presetRes = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/preset',
    method: 'GET'
  });
  assert.strictEqual(presetRes.status, 200, 'GET /api/preset should return 200');
  assert.ok(presetRes.body.spec, 'Preset should have spec object');

  // Test 2: POST /api/generate
  const genData = JSON.stringify({
    specContent: JSON.stringify(presetRes.body.spec),
    options: { validatedAuthToken: 'test-token-123' }
  });
  const genRes = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(genData)
    }
  }, genData);

  assert.strictEqual(genRes.status, 200, 'POST /api/generate should return 200');
  assert.strictEqual(genRes.body.success, true, 'Generation should succeed');
  assert.ok(genRes.body.files.length >= 8, 'Generated files should be >= 8');

  // Test 3: POST /api/validate-auth with probe
  const authPayload = JSON.stringify({
    baseUrl: 'https://petstore.swagger.io/v2',
    endpoint: '/pet/findByStatus?status=available',
    authType: 'none'
  });
  const valRes = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/validate-auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(authPayload)
    }
  }, authPayload);

  assert.strictEqual(valRes.status, 200, 'POST /api/validate-auth should return 200');
  assert.ok(valRes.body.authStatus, 'Should return authStatus');
  assert.ok(typeof valRes.body.isAuthError === 'boolean', 'Should return isAuthError boolean');
  assert.ok(valRes.body.category, 'Should return diagnostic category');
  console.log(`[Integration] /api/validate-auth returned status: ${valRes.body.statusCode} (${valRes.body.authStatus} - category: ${valRes.body.category})`);

  // Test 4: POST /api/generate enforces Decision Gate on specs requiring auth
  const authRequiredSpec = {
    openapi: '3.0.0',
    info: { title: 'Protected API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/secure': {
        get: { summary: 'Protected', responses: { '200': { description: 'OK' } } }
      }
    }
  };
  const unvalidatedGenData = JSON.stringify({
    specContent: JSON.stringify(authRequiredSpec),
    options: { isAuthValidated: false, validatedAuthToken: '' }
  });
  const gateRes = await makeRequest({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(unvalidatedGenData)
    }
  }, unvalidatedGenData);
  assert.strictEqual(gateRes.status, 400, 'Unvalidated authenticated generation should be blocked with 400');
  assert.ok(gateRes.body.error.includes('MANDATORY RULE VIOLATION'), 'Error must specify mandatory decision gate violation');
  console.log('[Integration] Mandatory Decision Gate blocked unvalidated script generation as required!');

  console.log('✅ Server Integration Tests Passed!');
}

run().catch(err => {
  console.error('❌ API Integration Test Failed:', err.message);
  process.exit(1);
});
