const YAML = require('yaml');

function isPlaceholderHost(hostname = '') {
  return /(^|\.)example\.(com|org|net)$/i.test(hostname);
}

function isPlaceholderUrl(candidate = '') {
  if (!candidate || typeof candidate !== 'string') return false;
  try {
    return isPlaceholderHost(new URL(candidate, 'https://placeholder.local').hostname);
  } catch (err) {
    return false;
  }
}

function replacePlaceholderOrigin(baseUrl, sourceUrl) {
  try {
    const parsedBaseUrl = new URL(baseUrl, sourceUrl);
    const parsedSourceUrl = new URL(sourceUrl);
    if (!isPlaceholderHost(parsedBaseUrl.hostname)) {
      return parsedBaseUrl.href;
    }
    return `${parsedSourceUrl.origin}${parsedBaseUrl.pathname}${parsedBaseUrl.search}`;
  } catch (err) {
    return baseUrl;
  }
}

/**
 * Parses raw JSON or YAML OpenAPI/Swagger text into a normalized structure
 * for code generation and AI analysis.
 */
function parseSwaggerSpec(rawContent, sourceUrl = '') {
  let specObj;

  if (typeof rawContent === 'object' && rawContent !== null) {
    specObj = rawContent;
  } else if (typeof rawContent === 'string') {
    const trimmed = rawContent.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        specObj = JSON.parse(trimmed);
      } catch (err) {
        throw new Error(`Failed to parse JSON Swagger spec: ${err.message}`);
      }
    } else {
      try {
        specObj = YAML.parse(trimmed);
      } catch (err) {
        throw new Error(`Failed to parse YAML Swagger spec: ${err.message}`);
      }
    }
  } else {
    throw new Error('Invalid input for Swagger spec. Expected string or object.');
  }

  if (!specObj) {
    throw new Error('Parsed Swagger spec is empty or invalid.');
  }

  // Identify spec version
  const isOpenApi3 = Boolean(specObj.openapi);
  const isSwagger2 = Boolean(specObj.swagger);

  if (!isOpenApi3 && !isSwagger2) {
    throw new Error('Document is missing "openapi" or "swagger" version declaration.');
  }

  // Metadata
  const info = specObj.info || {};
  const title = info.title || 'API Test Suite';
  const version = info.version || '1.0.0';
  const description = info.description || '';

  // Base URL resolution
  let baseUrl = '';
  if (isOpenApi3 && Array.isArray(specObj.servers) && specObj.servers.length > 0) {
    baseUrl = specObj.servers[0].url || '';
  } else if (isSwagger2) {
    const scheme = (specObj.schemes && specObj.schemes[0]) || 'https';
    const host = specObj.host || '';
    const basePath = specObj.basePath || '';
    if (host && !isPlaceholderHost(host)) {
      baseUrl = `${scheme}://${host}${basePath}`;
    } else if (basePath) {
      baseUrl = basePath;
    }
  }

  // Resolve relative base URL or missing host against sourceUrl if provided
  if (sourceUrl && typeof sourceUrl === 'string' && sourceUrl.startsWith('http')) {
    try {
      const parsedOrigin = new URL(sourceUrl).origin;
      if (!baseUrl) {
        baseUrl = parsedOrigin;
      } else if (isPlaceholderUrl(baseUrl)) {
        baseUrl = replacePlaceholderOrigin(baseUrl, sourceUrl);
      } else if (baseUrl.startsWith('/')) {
        baseUrl = `${parsedOrigin}${baseUrl}`;
      }
    } catch (e) {}
  }

  if (!baseUrl || isPlaceholderUrl(baseUrl)) {
    // Use the actual sourceUrl origin as the base - this is the URL the user provided
    if (sourceUrl && typeof sourceUrl === 'string' && sourceUrl.startsWith('http')) {
      try {
        baseUrl = new URL(sourceUrl).origin;
      } catch (e) {
        // sourceUrl is not a valid URL, leave baseUrl as empty
      }
    }
    // Only apply known API hardcodes as a fallback when we have strong signals
    if (!baseUrl || isPlaceholderUrl(baseUrl)) {
      if (/fakerest/i.test(title) || /fakerestapi/i.test(sourceUrl)) {
        baseUrl = 'https://fakerestapi.azurewebsites.net';
      } else if (/petstore/i.test(title) || /petstore/i.test(sourceUrl)) {
        baseUrl = 'https://petstore.swagger.io/v2';
      } else {
        // Keep as empty string - will be caught by downstream and user must provide it
        baseUrl = '';
      }
    }
  }

  if (baseUrl && !baseUrl.endsWith('/')) {
    baseUrl = `${baseUrl}/`;
  }

  // Security Schemes
  const securitySchemes = {};
  if (isOpenApi3 && specObj.components && specObj.components.securitySchemes) {
    Object.assign(securitySchemes, specObj.components.securitySchemes);
  } else if (isSwagger2 && specObj.securityDefinitions) {
    Object.assign(securitySchemes, specObj.securityDefinitions);
  }

  // Global Security
  const globalSecurity = specObj.security || [];

  // Parse Endpoints
  const paths = specObj.paths || {};
  const endpoints = [];
  const tagGroups = new Map();

  for (const [pathUrl, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
    for (const method of httpMethods) {
      if (!pathItem[method]) continue;

      const op = pathItem[method];
      const tags = Array.isArray(op.tags) && op.tags.length > 0 ? op.tags : ['Default'];
      const mainTag = cleanIdentifier(tags[0]);

      // Normalize parameters
      const rawParams = [
        ...(pathItem.parameters || []),
        ...(op.parameters || [])
      ];

      const parameters = {
        path: [],
        query: [],
        header: [],
        body: null
      };

      for (const param of rawParams) {
        if (!param) continue;
        const pIn = param.in;
        const pName = param.name;
        const pRequired = Boolean(param.required);
        const pType = param.type || (param.schema ? param.schema.type : 'string');

        if (pIn === 'path') {
          parameters.path.push({ name: pName, required: pRequired, type: pType, example: getExampleForType(pName, pType) });
        } else if (pIn === 'query') {
          parameters.query.push({ name: pName, required: pRequired, type: pType, example: getExampleForType(pName, pType) });
        } else if (pIn === 'header') {
          parameters.header.push({ name: pName, required: pRequired, type: pType, example: 'test-header-val' });
        } else if (pIn === 'body' && param.schema) {
          parameters.body = extractSchemaDetails(param.schema, specObj);
        }
      }

      // OpenAPI 3 requestBody
      if (isOpenApi3 && op.requestBody && op.requestBody.content) {
        const jsonContent = op.requestBody.content['application/json'] || Object.values(op.requestBody.content)[0];
        if (jsonContent && jsonContent.schema) {
          parameters.body = extractSchemaDetails(jsonContent.schema, specObj);
        }
      }

      // Responses
      const responses = {};
      if (op.responses) {
        for (const [statusCode, respObj] of Object.entries(op.responses)) {
          let respSchema = null;
          if (respObj.schema) {
            respSchema = extractSchemaDetails(respObj.schema, specObj);
          } else if (respObj.content && respObj.content['application/json']) {
            respSchema = extractSchemaDetails(respObj.content['application/json'].schema, specObj);
          }
          responses[statusCode] = {
            description: respObj.description || '',
            schema: respSchema
          };
        }
      }

      const operationId = op.operationId || `${method}_${pathUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const endpoint = {
        path: pathUrl,
        method: method.toUpperCase(),
        operationId,
        summary: op.summary || `${method.toUpperCase()} ${pathUrl}`,
        description: op.description || '',
        tag: mainTag,
        parameters,
        responses,
        security: op.security || globalSecurity
      };

      endpoints.push(endpoint);

      if (!tagGroups.has(mainTag)) {
        tagGroups.set(mainTag, []);
      }
      tagGroups.get(mainTag).push(endpoint);
    }
  }

  // Determine Authentication Requirements & Security Classification
  const detectedSchemes = [];
  for (const [schemeKey, scheme] of Object.entries(securitySchemes)) {
    const sType = (scheme.type || '').toLowerCase();
    const sScheme = (scheme.scheme || '').toLowerCase();
    const sFormat = (scheme.bearerFormat || '').toLowerCase();
    const sName = scheme.name || 'Authorization';
    const sIn = scheme.in || 'header';
    const sDesc = scheme.description || '';

    let classifiedType = 'bearer';
    let label = 'Bearer Token / JWT';

    if (sType === 'http' && sScheme === 'bearer') {
      classifiedType = 'bearer';
      if (sFormat.includes('jwk')) {
        label = 'JWK / Bearer Token';
      } else if (sFormat.includes('jwt')) {
        label = 'Bearer Token / JWT';
      } else {
        label = 'Bearer Token / JWT';
      }
    } else if (sType === 'oauth2' || sType === 'openidconnect') {
      classifiedType = 'oauth2';
      label = 'OAuth 2.0 Token';
    } else if (sType === 'basic' || (sType === 'http' && sScheme === 'basic')) {
      classifiedType = 'basic';
      label = 'HTTP Basic Authentication';
    } else if (sType === 'apikey') {
      classifiedType = 'apiKey';
      label = `API Key (${sIn}: ${sName})`;
    } else if (/uuid/i.test(sName) || /uuid/i.test(sDesc)) {
      classifiedType = 'uuid';
      label = 'UUID / Auth Token';
    } else {
      classifiedType = 'bearer';
      label = scheme.description || 'Bearer Token / Auth Token';
    }

    detectedSchemes.push({
      key: schemeKey,
      type: classifiedType,
      label,
      headerName: sIn === 'header' ? sName : 'Authorization',
      paramIn: sIn,
      raw: scheme
    });
  }

  // Check endpoint-level security definitions
  const endpointsWithSecurity = endpoints.filter(e => Array.isArray(e.security) && e.security.length > 0);
  const hasEndpointSecurity = endpointsWithSecurity.length > 0;
  const hasGlobalSecurity = Array.isArray(globalSecurity) && globalSecurity.length > 0;
  const hasSecuritySchemes = detectedSchemes.length > 0;

  // Check custom header auth params across all endpoints
  const authHeaderParams = [];
  for (const ep of endpoints) {
    if (ep.parameters && Array.isArray(ep.parameters.header)) {
      for (const h of ep.parameters.header) {
        if (/auth|token|jwt|jwk|api[-_]?key|uuid/i.test(h.name)) {
          authHeaderParams.push({ endpoint: ep.path, name: h.name, required: h.required });
        }
      }
    }
  }

  const requiresAuth = Boolean(hasSecuritySchemes || hasGlobalSecurity || hasEndpointSecurity || authHeaderParams.length > 0);

  let primaryAuthType = 'none';
  let primaryAuthDescription = 'Public APIs (No authentication credentials required)';
  let primaryHeaderName = 'Authorization';

  if (requiresAuth) {
    if (detectedSchemes.length > 0) {
      const first = detectedSchemes[0];
      primaryAuthType = first.type;
      primaryAuthDescription = first.label;
      primaryHeaderName = first.headerName;
    } else if (authHeaderParams.length > 0) {
      const firstParam = authHeaderParams[0];
      if (/api[-_]?key/i.test(firstParam.name)) {
        primaryAuthType = 'apiKey';
        primaryHeaderName = firstParam.name;
        primaryAuthDescription = `API Key (${firstParam.name})`;
      } else if (/uuid/i.test(firstParam.name)) {
        primaryAuthType = 'uuid';
        primaryHeaderName = firstParam.name;
        primaryAuthDescription = `UUID / Auth Token (${firstParam.name})`;
      } else {
        primaryAuthType = 'bearer';
        primaryHeaderName = firstParam.name;
        primaryAuthDescription = `Authorization Header (${firstParam.name})`;
      }
    } else {
      primaryAuthType = 'bearer';
      primaryAuthDescription = 'Bearer Token / JWT';
      primaryHeaderName = 'Authorization';
    }
  }

  // Probe Endpoint Candidate Resolution (Favor safe GET with minimal/no path params)
  const candidateEndpoints = [];
  const getEndpoints = endpoints.filter(e => e.method === 'GET');

  // 1. Static GET endpoints without curly brace params
  for (const ep of getEndpoints) {
    if (!ep.path.includes('{') && !candidateEndpoints.includes(ep.path)) {
      candidateEndpoints.push(ep.path);
    }
  }

  // 2. Other GET endpoints with simple param replacement fallback
  for (const ep of getEndpoints) {
    if (ep.path.includes('{')) {
      const resolvedPath = ep.path.replace(/\{([^}]+)\}/g, (match, paramName) => {
        if (/id/i.test(paramName)) return '1';
        if (/username|user/i.test(paramName)) return 'user1';
        if (/status/i.test(paramName)) return 'available';
        return '1';
      });
      if (!candidateEndpoints.includes(resolvedPath)) {
        candidateEndpoints.push(resolvedPath);
      }
    }
  }

  // 3. Fallback to any endpoint
  for (const ep of endpoints) {
    const cleanP = ep.path.replace(/\{([^}]+)\}/g, '1');
    if (!candidateEndpoints.includes(cleanP)) {
      candidateEndpoints.push(cleanP);
    }
  }

  const probeEndpoint = candidateEndpoints.length > 0 ? candidateEndpoints[0] : '/';

  return {
    title,
    version,
    description,
    baseUrl,
    securitySchemes,
    authRequirement: {
      requiresAuth,
      authType: primaryAuthType,
      authDescription: primaryAuthDescription,
      headerName: primaryHeaderName,
      probeEndpoint,
      candidateEndpoints: candidateEndpoints.slice(0, 10),
      detectedSchemes,
      endpointsWithSecurityCount: endpointsWithSecurity.length,
      totalEndpointsCount: endpoints.length
    },
    totalEndpoints: endpoints.length,
    tagGroups: Object.fromEntries(tagGroups),
    endpoints
  };
}

/**
 * Clean up tag names into valid JS variable/class friendly names
 */
function cleanIdentifier(str) {
  if (!str) return 'Default';
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Resolve $ref pointers recursively in schema if available locally
 */
function extractSchemaDetails(schema, fullSpec) {
  if (!schema) return { type: 'object', example: {} };

  if (schema.$ref) {
    const refPath = schema.$ref.replace(/^#\//, '').split('/');
    let target = fullSpec;
    for (const segment of refPath) {
      if (target && target[segment]) {
        target = target[segment];
      } else {
        target = null;
        break;
      }
    }
    if (target) {
      return extractSchemaDetails(target, fullSpec);
    }
  }

  const type = schema.type || (schema.properties ? 'object' : 'any');
  const properties = {};
  const requiredFields = Array.isArray(schema.required) ? schema.required : [];

  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      properties[propName] = {
        type: propSchema.type || 'string',
        example: propSchema.example !== undefined ? propSchema.example : getExampleForType(propName, propSchema.type),
        required: requiredFields.includes(propName)
      };
    }
  }

  // Array item schema
  let itemSchema = null;
  if (type === 'array' && schema.items) {
    itemSchema = extractSchemaDetails(schema.items, fullSpec);
  }

  // Generate a mock sample data payload
  const examplePayload = generateMockPayload(type, properties, itemSchema, schema.example);
  const invalidPayloads = generateInvalidPayloads(type, properties, requiredFields, examplePayload);

  return {
    type,
    properties,
    requiredFields,
    itemSchema,
    examplePayload,
    invalidPayloads
  };
}

/**
 * Smart mock payload builder
 */
function generateMockPayload(type, properties, itemSchema, explicitExample) {
  if (explicitExample !== undefined) return explicitExample;

  if (type === 'array') {
    if (itemSchema) {
      return [generateMockPayload(itemSchema.type, itemSchema.properties, itemSchema.itemSchema, null)];
    }
    return ['sample_item'];
  }

  if (type === 'object' || Object.keys(properties).length > 0) {
    const obj = {};
    for (const [pName, pMeta] of Object.entries(properties)) {
      obj[pName] = pMeta.example;
    }
    return obj;
  }

  return 'sample_value';
}

/**
 * Smart invalid payload builder for negative testing
 */
function generateInvalidPayloads(type, properties, requiredFields = [], validPayload = {}) {
  const propKeys = Object.keys(properties);
  const targetReqProp = requiredFields[0] || propKeys.find(k => k.toLowerCase() !== 'id') || propKeys[0];
  
  // 1. Missing Required/Key Property
  const missingPropPayload = { ...validPayload };
  if (targetReqProp && missingPropPayload[targetReqProp] !== undefined) {
    delete missingPropPayload[targetReqProp];
  } else if (propKeys.length > 0) {
    delete missingPropPayload[propKeys[0]];
  }

  // 2. Invalid Data Types
  const invalidTypePayload = { ...validPayload };
  if (propKeys.length > 0) {
    for (const key of propKeys) {
      const pType = properties[key].type;
      if (pType === 'integer' || pType === 'number') {
        invalidTypePayload[key] = "not_a_valid_number_string";
        break;
      } else if (pType === 'boolean') {
        invalidTypePayload[key] = "not_a_boolean";
        break;
      } else if (pType === 'string') {
        invalidTypePayload[key] = 99999999;
        break;
      }
    }
  } else {
    invalidTypePayload.invalidPropertyType = "not_a_valid_format";
  }

  // 3. Null Values for Non-nullable fields
  const nullValuePayload = { ...validPayload };
  if (targetReqProp) {
    nullValuePayload[targetReqProp] = null;
  }

  return {
    missingRequired: missingPropPayload,
    invalidTypes: invalidTypePayload,
    emptyPayload: {},
    nullValuePayload
  };
}

/**
 * Helper to provide realistic mock data based on field name or type
 */
function getExampleForType(fieldName, type) {
  const nameLower = (fieldName || '').toLowerCase();
  
  if (nameLower.includes('id')) return 1;
  if (nameLower.includes('name')) return 'Test_' + fieldName;
  if (nameLower.includes('email')) return 'test.user@example.com';
  if (nameLower.includes('phone')) return '+1234567890';
  if (nameLower.includes('status')) return 'active';
  if (nameLower.includes('price') || nameLower.includes('amount')) return 99.99;
  if (nameLower.includes('category')) return 'General';
  if (nameLower.includes('date') || nameLower.includes('time')) return new Date().toISOString();

  switch (type) {
    case 'integer':
    case 'number':
      return 100;
    case 'boolean':
      return true;
    case 'array':
      return ['item1', 'item2'];
    case 'object':
      return { key: 'value' };
    default:
      return `${fieldName || 'sample'}_val`;
  }
}

/**
 * Smart URL Spec Fetcher and Resolver
 * Fetches raw spec from URL, or if it's a Swagger UI HTML page,
 * automatically discovers the underlying JSON/YAML OpenAPI specification.
 */
async function fetchAndResolveSpecUrl(url) {
  let targetUrl = (url || '').trim();
  if (!targetUrl) {
    throw new Error('URL is required');
  }

  console.log(`[URL RESOLVER] Fetching target URL: ${targetUrl}`);
  const response = await fetch(targetUrl, {
    headers: {
      'Accept': 'application/json, application/yaml, text/yaml, text/html, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Swagger2PlaywrightAgent/2.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status} ${response.statusText})`);
  }

  const text = await response.text();
  const trimmed = text.trim();

  // Check if it's already JSON or YAML OpenAPI/Swagger
  const isDirectSpec = (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('swagger:') || trimmed.startsWith('openapi:')) &&
                       (text.includes('"swagger"') || text.includes('"openapi"') || text.includes('swagger:') || text.includes('openapi:'));

  if (isDirectSpec) {
    return { specContent: text, resolvedUrl: targetUrl };
  }

  // Check if the URL returned HTML (Swagger UI, Redoc, etc.)
  const isHtml = trimmed.toLowerCase().startsWith('<!doctype') ||
                 text.toLowerCase().includes('<html') ||
                 text.toLowerCase().includes('swagger-ui') ||
                 text.toLowerCase().includes('swagger-initializer.js');

  if (isHtml) {
    console.log(`[URL RESOLVER] Detected Swagger UI HTML portal. Autodiscovering specification...`);
    const parsedUrl = new URL(targetUrl);
    const candidateUrls = [];

    // 1. Inspect swagger-initializer.js
    const initScriptMatch = text.match(/<script[^>]+src=["']([^"']*swagger-initializer\.js[^"']*)["']/i);
    if (initScriptMatch && initScriptMatch[1]) {
      try {
        const initJsUrl = new URL(initScriptMatch[1], targetUrl).href;
        const initResp = await fetch(initJsUrl);
        if (initResp.ok) {
          const initText = await initResp.text();
          const initUrlMatches = [
            ...initText.matchAll(/https?:\/\/[^\s"'\s,=]+\.(?:json|yaml|yml)/gi),
            ...initText.matchAll(/["']([^"'\s,=]+\.(?:json|yaml|yml))["']/gi),
            ...initText.matchAll(/["'](https?:\/\/[^"'\s,]+)["']/gi)
          ];
          for (const m of initUrlMatches) {
            const raw = (m[1] || m[0]).trim();
            if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) {
              try {
                candidateUrls.push(new URL(raw, initJsUrl).href);
                candidateUrls.push(new URL(raw, parsedUrl.origin).href);
              } catch (e) {}
            }
          }
        }
      } catch (e) {}
    }

    // 2. Search direct HTML for url definitions
    const htmlMatches = [
      ...text.matchAll(/"urls"\s*:\s*\[\s*\{\s*"url"\s*:\s*"([^"]+)"/gi),
      ...text.matchAll(/"url"\s*:\s*"([^"]+)"/gi),
      ...text.matchAll(/url\s*:\s*['"]([^'"]+)['"]/gi),
      ...text.matchAll(/href\s*=\s*['"]([^'"]+\.(?:json|yaml|yml))['"]/gi),
      ...text.matchAll(/src\s*=\s*['"]([^'"]+\.(?:json|yaml|yml))['"]/gi)
    ];

    for (const m of htmlMatches) {
      const raw = m[1];
      if (raw && !raw.includes('swagger-ui') && !raw.endsWith('.js') && !raw.endsWith('.css')) {
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) {
          try {
            candidateUrls.push(new URL(raw, targetUrl).href);
            candidateUrls.push(new URL(raw, parsedUrl.origin).href);
          } catch (e) {}
        }
      }
    }

    // 3. Fallback candidates across ASP.NET Core, Spring Boot, FastAPI, Express, NestJS
    const standardPaths = [
      '/swagger/v1/swagger.json',
      '/swagger/v2/swagger.json',
      '/swagger/v3/swagger.json',
      '/v3/api-docs',
      '/v3/api-docs/swagger-config',
      '/v2/api-docs',
      '/openapi.json',
      '/swagger.json',
      '/api-docs',
      '/api-docs.json',
      '/api/swagger.json',
      '/api/openapi.json',
      '/swagger/doc.json'
    ];

    const currentDir = targetUrl.endsWith('/') ? targetUrl : `${targetUrl}/`;
    for (const p of standardPaths) {
      try {
        candidateUrls.push(new URL(p, parsedUrl.origin).href);
        candidateUrls.push(new URL(p.replace(/^\//, ''), currentDir).href);
      } catch (e) {}
    }

    const uniqueCandidates = [...new Set(candidateUrls)];
    for (const candUrl of uniqueCandidates) {
      try {
        console.log(`[URL RESOLVER] Probing candidate: ${candUrl}`);
        const candResp = await fetch(candUrl, {
          headers: { 'Accept': 'application/json, application/yaml, text/yaml, */*' }
        });
        if (candResp.ok) {
          const candText = await candResp.text();
          const candTrimmed = candText.trim();
          if (
            (candTrimmed.startsWith('{') || candTrimmed.startsWith('[') || candTrimmed.startsWith('swagger:') || candTrimmed.startsWith('openapi:')) &&
            (candText.includes('"swagger"') || candText.includes('"openapi"') || candText.includes('swagger:') || candText.includes('openapi:'))
          ) {
            console.log(`[URL RESOLVER] Successfully discovered specification at: ${candUrl}`);
            return { specContent: candText, resolvedUrl: candUrl };
          }
        }
      } catch (candErr) {}
    }

    throw new Error(
      `Detected Swagger UI page, but the underlying JSON/YAML specification could not be automatically resolved. ` +
      `Please provide the direct URL to the specification (such as /swagger.json, /openapi.json, or /v3/api-docs) or paste the JSON/YAML content.`
    );
  }

  return { specContent: text, resolvedUrl: targetUrl };
}

module.exports = {
  parseSwaggerSpec,
  cleanIdentifier,
  fetchAndResolveSpecUrl
};
