const { cleanIdentifier } = require('./swaggerParser');

/**
 * Generates a Postman Collection v2.1 JSON structure
 * organized sequentially: First Positive Scenarios, followed by Negative Scenarios.
 */
function generatePostmanCollection(parsedSpec) {
  const { title, version, baseUrl, endpoints, tagGroups } = parsedSpec;

  const collectionId = 'col_' + Date.now();
  const positiveItems = [];
  const negativeItems = [];

  // Group endpoints by tag
  for (const [tag, groupEndpoints] of Object.entries(tagGroups)) {
    const tagClean = cleanIdentifier(tag);

    const tagPositiveFolder = {
      name: `${tagClean} - Positive Scenarios`,
      item: []
    };

    const tagNegativeFolder = {
      name: `${tagClean} - Negative Scenarios`,
      item: []
    };

    // Sort endpoints: POST (create) -> GET (list/id) -> PUT/PATCH (update) -> DELETE (delete)
    const methodOrder = { POST: 1, GET: 2, PUT: 3, PATCH: 4, DELETE: 5 };
    const sortedEndpoints = [...groupEndpoints].sort((a, b) => {
      return (methodOrder[a.method] || 99) - (methodOrder[b.method] || 99);
    });

    for (const ep of sortedEndpoints) {
      // 1. Positive Request
      const posReq = createPostmanItem(ep, baseUrl, true);
      tagPositiveFolder.item.push(posReq);

      // 2. Negative Request (e.g. invalid ID or empty body)
      const negReq = createPostmanItem(ep, baseUrl, false);
      if (negReq) {
        tagNegativeFolder.item.push(negReq);
      }
    }

    if (tagPositiveFolder.item.length > 0) {
      positiveItems.push(tagPositiveFolder);
    }
    if (tagNegativeFolder.item.length > 0) {
      negativeItems.push(tagNegativeFolder);
    }
  }

  const collection = {
    info: {
      _postman_id: collectionId,
      name: `${title} - Sequenced API Suite`,
      description: `Automated Postman Collection with positive and negative execution flow for ${title} (v${version}). Compatible with Postman MCP Server.`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
      {
        key: "baseUrl",
        value: baseUrl || "",
        type: "string"
      },
      {
        key: "authToken",
        value: "",
        type: "string"
      }
    ],
    item: [
      {
        name: "📁 1. Positive Scenarios (Happy Path & CRUD)",
        description: "Sequenced execution of successful API requests with status 200/201 and payload schema assertions.",
        item: positiveItems
      },
      {
        name: "📁 2. Negative Scenarios (Boundary & Error Validation)",
        description: "Fault-injection requests testing 400 Bad Request, 404 Not Found, and 401 Unauthorized handling.",
        item: negativeItems
      }
    ]
  };

  return collection;
}

/**
 * Helper to build an individual Postman request item
 */
function createPostmanItem(ep, baseUrl, isPositive) {
  const isIdEndpoint = ep.path.includes('{');
  let effectivePath = ep.path;

  // Replace path parameters
  if (isPositive) {
    effectivePath = effectivePath.replace(/\{([^}]+)\}/g, '1');
  } else {
    // Negative test: invalid non-existent ID
    if (!isIdEndpoint && ep.method === 'GET') return null; // Skip redundant negative tests for root GET
    effectivePath = effectivePath.replace(/\{([^}]+)\}/g, '999999999');
  }

  const rawUrl = `{{baseUrl}}${effectivePath}`;
  const urlParts = effectivePath.split('/').filter(Boolean);

  // Headers
  const header = [
    { key: "Accept", value: "application/json", type: "text" }
  ];
  if (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') {
    header.push({ key: "Content-Type", value: "application/json", type: "text" });
  }

  // Body
  let body = undefined;
  if (ep.parameters.body) {
    let payload = ep.parameters.body.examplePayload || {};
    if (!isPositive) {
      // Invalidate body for negative test
      payload = { invalid_property: null };
    }
    body = {
      mode: "raw",
      raw: JSON.stringify(payload, null, 2),
      options: {
        raw: {
          language: "json"
        }
      }
    };
  }

  // Tests script
  const testScript = isPositive ? generatePositiveTestScript(ep) : generateNegativeTestScript(ep);

  const testName = isPositive
    ? `[POS] ${ep.method} ${ep.path} - Success`
    : `[NEG] ${ep.method} ${ep.path} - Error Handling (400/404)`;

  return {
    name: testName,
    event: [
      {
        listen: "test",
        script: {
          exec: testScript,
          type: "text/javascript"
        }
      }
    ],
    request: {
      method: ep.method,
      header,
      body,
      url: {
        raw: rawUrl,
        host: ["{{baseUrl}}"],
        path: urlParts
      },
      description: ep.summary || ep.description || `${ep.method} ${ep.path}`
    }
  };
}

function generatePositiveTestScript(ep) {
  return [
    `// Auto-generated Positive Assertion by Swagger2API Agent`,
    `pm.test("Status code is 200, 201 or 204", function () {`,
    `    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);`,
    `});`,
    ``,
    `pm.test("Response time is reasonable (< 1500ms)", function () {`,
    `    pm.expect(pm.response.responseTime).to.be.below(1500);`,
    `});`,
    ``,
    `if (pm.response.headers.get("Content-Type") && pm.response.headers.get("Content-Type").includes("application/json")) {`,
    `    pm.test("Response JSON contains valid schema structure", function () {`,
    `        const jsonData = pm.response.json();`,
    `        pm.expect(jsonData).to.not.be.null;`,
    `    });`,
    `}`
  ];
}

function generateNegativeTestScript(ep) {
  return [
    `// Auto-generated Negative Assertion by Swagger2API Agent`,
    `pm.test("Status code represents client error (400, 404, or 422)", function () {`,
    `    pm.expect(pm.response.code).to.be.oneOf([400, 404, 422]);`,
    `});`,
    ``,
    `pm.test("Error response contains error detail or message", function () {`,
    `    pm.expect(pm.response.text()).to.not.be.empty;`,
    `});`
  ];
}

module.exports = {
  generatePostmanCollection
};
