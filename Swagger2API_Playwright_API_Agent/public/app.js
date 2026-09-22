document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // DOM Elements
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const specTextArea = document.getElementById('specTextArea');
  const loadPresetBtn = document.getElementById('loadPresetBtn');
  const swaggerUrlInput = document.getElementById('swaggerUrlInput');
  const fetchUrlBtn = document.getElementById('fetchUrlBtn');
  const generateBtn = document.getElementById('generateBtn');
  const specStatus = document.getElementById('specStatus');

  const metricsSection = document.getElementById('metricsSection');
  const metricTitle = document.getElementById('metricTitle');
  const metricEndpoints = document.getElementById('metricEndpoints');
  const metricTags = document.getElementById('metricTags');
  const metricBaseUrl = document.getElementById('metricBaseUrl');

  const workbenchSection = document.getElementById('workbenchSection');
  const fileTree = document.getElementById('fileTree');
  const activeFilePath = document.getElementById('activeFilePath');
  const codeViewer = document.getElementById('codeViewer');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  const downloadPostmanBtn = document.getElementById('downloadPostmanBtn');

  // Document Access Elements
  const accessCheckBanner = document.getElementById('accessCheckBanner');
  const accessTitle = document.getElementById('accessTitle');
  const accessMeta = document.getElementById('accessMeta');

  // Allure Report Elements
  const viewAllureReportBtn = document.getElementById('viewAllureReportBtn');
  const allureSection = document.getElementById('allureSection');
  const closeAllureBtn = document.getElementById('closeAllureBtn');
  const allurePassed = document.getElementById('allurePassed');
  const allureTotal = document.getElementById('allureTotal');
  const allureDuration = document.getElementById('allureDuration');
  const allureSuites = document.getElementById('allureSuites');
  const allureSuitesList = document.getElementById('allureSuitesList');

  const runSimulatedTestsBtn = document.getElementById('runSimulatedTestsBtn');
  const runnerPanel = document.getElementById('runnerPanel');
  const terminalOutput = document.getElementById('terminalOutput');
  const passCount = document.getElementById('passCount');
  const failCount = document.getElementById('failCount');
  const skipCount = document.getElementById('skipCount');
  const totalCount = document.getElementById('totalCount');

  // Authentication Detection & Try-Out Gate Elements
  const authGatePanel = document.getElementById('authGatePanel');
  const authStatusBadge = document.getElementById('authStatusBadge');
  const authStatusIcon = document.getElementById('authStatusIcon');
  const authStatusText = document.getElementById('authStatusText');
  const authGateMeta = document.getElementById('authGateMeta');
  const authPublicNotice = document.getElementById('authPublicNotice');
  const authRequiredControls = document.getElementById('authRequiredControls');
  const authRequiredTitle = document.getElementById('authRequiredTitle');
  const authRequiredDesc = document.getElementById('authRequiredDesc');
  const authTokenLabel = document.getElementById('authTokenLabel');
  const authTokenInput = document.getElementById('authTokenInput');
  const toggleTokenVisibility = document.getElementById('toggleTokenVisibility');
  const validateAuthBtn = document.getElementById('validateAuthBtn');
  const probeEndpointDisplay = document.getElementById('probeEndpointDisplay');
  const probeEndpointSelect = document.getElementById('probeEndpointSelect');
  const apiKeyHeaderWrapper = document.getElementById('apiKeyHeaderWrapper');
  const apiKeyHeaderInput = document.getElementById('apiKeyHeaderInput');
  const authProbeLatency = document.getElementById('authProbeLatency');
  const tryoutFeedbackBox = document.getElementById('tryoutFeedbackBox');
  const tryoutFeedbackIcon = document.getElementById('tryoutFeedbackIcon');
  const tryoutFeedbackTitle = document.getElementById('tryoutFeedbackTitle');
  const tryoutFeedbackMsg = document.getElementById('tryoutFeedbackMsg');
  const tryoutDiagnosticDetails = document.getElementById('tryoutDiagnosticDetails');

  // App State
  let currentSpecContent = '';
  let parsedSpecData = null;
  let generatedFilesList = [];
  let activeFile = null;
  let validatedAuthToken = null;
  let isAuthValidated = false;
  let currentSourceUrl = '';
  let lastExecutionResult = null;

  // 1. Drag & Drop Event Listeners
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  specTextArea.addEventListener('input', () => {
    const val = specTextArea.value.trim();
    if (val) {
      currentSourceUrl = '';
      currentSpecContent = val;
      fileInfo.textContent = 'Pasted Raw Spec';
      parseAndShowMetrics(currentSpecContent);
    } else {
      resetSpecState();
    }
  });

  // 2. Load Preset Petstore Sample
  loadPresetBtn.addEventListener('click', async () => {
    try {
      currentSourceUrl = '';
      specStatus.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Loading Petstore preset...`;
      if (window.lucide) lucide.createIcons();

      const res = await fetch('/api/preset');
      const data = await res.json();

      currentSpecContent = JSON.stringify(data.spec, null, 2);
      specTextArea.value = currentSpecContent;
      fileInfo.textContent = 'Preset: Swagger Petstore 3.0';

      await parseAndShowMetrics(currentSpecContent);
    } catch (err) {
      showStatusError(`Failed to load preset: ${err.message}`);
    }
  });

  // 2b. Fetch Swagger from URL with Initial Document Access Check
  async function handleUrlFetch() {
    const url = swaggerUrlInput.value.trim();
    if (!url) {
      showStatusError('Please enter a valid Swagger URL');
      return;
    }

    try {
      fetchUrlBtn.disabled = true;
      fetchUrlBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Checking...`;
      specStatus.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Checking document access for ${url}...`;
      if (window.lucide) lucide.createIcons();

      // Step 1: Health & Access Verification
      accessCheckBanner.style.display = 'flex';
      accessCheckBanner.classList.remove('error');
      accessTitle.textContent = `Verifying Document Reachability...`;
      accessMeta.textContent = `Pinging target URL...`;

      const checkRes = await fetch('/api/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const checkData = await checkRes.json();

      if (!checkData.accessible) {
        accessCheckBanner.classList.add('error');
        accessTitle.textContent = `Document Inaccessible (${checkData.statusCode || 'Connection Failed'})`;
        accessMeta.textContent = `Error: ${checkData.error || checkData.statusText} | Latency: ${checkData.latencyMs}ms`;
        throw new Error(`Swagger document at ${url} is not accessible (Status: ${checkData.statusCode || 'Unreachable'})`);
      }

      // Access Verified
      accessTitle.textContent = `✓ Document Access Verified (${checkData.statusCode} ${checkData.statusText || 'OK'})`;
      accessMeta.textContent = `Latency: ${checkData.latencyMs}ms | Content-Type: ${checkData.contentType}`;

      // Step 2: Ingest and Parse Specification
      fetchUrlBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Fetching...`;
      specStatus.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Ingesting spec from ${url}...`;
      if (window.lucide) lucide.createIcons();

      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      currentSpecContent = data.rawContent;
      currentSourceUrl = data.resolvedUrl || url;
      specTextArea.value = currentSpecContent;
      fileInfo.textContent = `URL: ${data.resolvedUrl || url}`;

      parsedSpecData = data.spec;

      // Update Dashboard Metrics
      metricTitle.textContent = `${parsedSpecData.title} (v${parsedSpecData.version})`;
      metricEndpoints.textContent = parsedSpecData.totalEndpoints;
      metricTags.textContent = Object.keys(parsedSpecData.tagGroups).length;
      metricBaseUrl.textContent = parsedSpecData.baseUrl;

      // Update dynamic strategy selector badges and descriptions based on parsed spec
      updateStrategyDescriptions(parsedSpecData);

      metricsSection.style.display = 'grid';

      // Enforce Authentication Detection & Validation Gate before enabling script generation
      await handleAuthGate(parsedSpecData);

    } catch (err) {
      showStatusError(`Access / Fetch Error: ${err.message}`);
    } finally {
      fetchUrlBtn.disabled = false;
      fetchUrlBtn.innerHTML = `<i data-lucide="cloud-download"></i> Fetch & Load`;
      if (window.lucide) lucide.createIcons();
    }
  }

  fetchUrlBtn.addEventListener('click', handleUrlFetch);
  swaggerUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleUrlFetch();
    }
  });

  // 3. Handle File Upload
  function handleFileUpload(file) {
    currentSourceUrl = '';
    fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentSpecContent = e.target.result;
      specTextArea.value = currentSpecContent;
      parseAndShowMetrics(currentSpecContent);
    };
    reader.readAsText(file);
  }

  // 4. Parse Spec & Show Metrics
  async function parseAndShowMetrics(specContent) {
    try {
      specStatus.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Parsing Swagger specification...`;
      if (window.lucide) lucide.createIcons();

      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specContent, sourceUrl: currentSourceUrl })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      parsedSpecData = data.spec;

      // Update Dashboard Metrics
      metricTitle.textContent = `${parsedSpecData.title} (v${parsedSpecData.version})`;
      metricEndpoints.textContent = parsedSpecData.totalEndpoints;
      metricTags.textContent = Object.keys(parsedSpecData.tagGroups).length;
      metricBaseUrl.textContent = parsedSpecData.baseUrl;

      // Update dynamic strategy selector badges and descriptions based on parsed spec
      updateStrategyDescriptions(parsedSpecData);

      metricsSection.style.display = 'grid';

      // Enforce Authentication Detection & Validation Gate before enabling script generation
      await handleAuthGate(parsedSpecData);

    } catch (err) {
      showStatusError(`Parse Error: ${err.message}`);
      generateBtn.disabled = true;
    }
  }

  function updateStrategyDescriptions(parsed) {
    const badgeE2E = document.getElementById('badgeE2E');
    const descE2E = document.getElementById('descE2E');
    const badgePositive = document.getElementById('badgePositive');
    const descPositive = document.getElementById('descPositive');
    const badgeNegative = document.getElementById('badgeNegative');
    const descNegative = document.getElementById('descNegative');
    const badgeSecurity = document.getElementById('badgeSecurity');
    const descSecurity = document.getElementById('descSecurity');

    if (!parsed) {
      if (badgeE2E) badgeE2E.textContent = 'All APIs';
      if (descE2E) descE2E.textContent = 'Complete business journey touching all detected endpoints in logical dependency sequence with shared ID passing';
      if (badgePositive) badgePositive.textContent = 'Happy Path';
      if (descPositive) descPositive.textContent = 'CRUD happy paths, valid mock schemas, and status 200/201/204 verification across all endpoints';
      if (badgeNegative) badgeNegative.textContent = 'Boundary';
      if (descNegative) descNegative.textContent = 'Missing mandatory fields, invalid data types, non-existent IDs, and 400/404 error boundaries';
      if (badgeSecurity) badgeSecurity.textContent = 'Security';
      if (descSecurity) descSecurity.textContent = "BOLA / IDOR checks, JWT 'none' algorithm bypass, SQL injection sanitization, and rate limiting";
      return;
    }

    const total = parsed.totalEndpoints || 0;
    const controllers = Object.keys(parsed.tagGroups || {});
    const controllerCount = controllers.length;
    const sampleControllers = controllers.slice(0, 3).join(', ') + (controllerCount > 3 ? ` + ${controllerCount - 3} more` : '');
    const secKeys = Object.keys(parsed.securitySchemes || {});
    const secBadge = secKeys.length > 0 ? secKeys.join(', ') : 'OWASP Top 10';
    const authNote = secKeys.length > 0 ? `${secKeys.join(', ')} token validation` : 'Standard Auth';

    if (badgeE2E) badgeE2E.textContent = `${total} Endpoints`;
    if (descE2E) {
      descE2E.innerHTML = `Complete business journey linking all <strong>${total} endpoints</strong> across <strong>${controllerCount} controllers</strong> (${sampleControllers}) in logical dependency order with shared ID state passing`;
    }

    if (badgePositive) badgePositive.textContent = `Happy Path (${total} Routes)`;
    if (descPositive) {
      descPositive.innerHTML = `CRUD happy paths, valid mock schemas, and status 200/201/204 verification across all <strong>${total} endpoints</strong> in ${parsed.title}`;
    }

    if (badgeNegative) badgeNegative.textContent = `Boundary Matrix`;
    if (descNegative) {
      descNegative.innerHTML = `Missing mandatory fields, invalid data types, non-existent IDs, and 400/404/422 status assertions across all <strong>${total} routes</strong>`;
    }

    if (badgeSecurity) badgeSecurity.textContent = secBadge;
    if (descSecurity) {
      descSecurity.innerHTML = `BOLA / IDOR checks, ${authNote}, JWT 'none' bypass, SQL injection sanitization, and rate limiting across <strong>${total} routes</strong>`;
    }
  }

  function resetSpecState() {
    currentSpecContent = '';
    currentSourceUrl = '';
    parsedSpecData = null;
    generatedFilesList = [];
    lastExecutionResult = null;
    validatedAuthToken = null;
    isAuthValidated = false;
    if (authGatePanel) authGatePanel.style.display = 'none';
    if (authTokenInput) authTokenInput.value = '';
    if (tryoutFeedbackBox) tryoutFeedbackBox.style.display = 'none';
    if (allureSection) allureSection.style.display = 'none';
    if (runnerPanel) runnerPanel.style.display = 'none';
    updateStrategyDescriptions(null);
    metricsSection.style.display = 'none';
    workbenchSection.style.display = 'none';
    generateBtn.disabled = true;
    generateBtn.innerHTML = `<i data-lucide="wand-2"></i> Proceed with Generating Scripts`;
    fileInfo.textContent = 'No file selected';
    specStatus.innerHTML = `<i data-lucide="info"></i> Ready for spec input`;
    if (window.lucide) lucide.createIcons();
  }

  function showStatusError(msg) {
    specStatus.innerHTML = `<span style="color: var(--accent-rose)"><i data-lucide="alert-triangle"></i> ${msg}</span>`;
    if (window.lucide) lucide.createIcons();
  }

  // Strategy Checkbox Elements
  const stratE2E = document.getElementById('stratE2E');
  const stratPositive = document.getElementById('stratPositive');
  const stratNegative = document.getElementById('stratNegative');
  const stratSecurity = document.getElementById('stratSecurity');

  [stratE2E, stratPositive, stratNegative, stratSecurity].forEach(cb => {
    if (!cb) return;
    cb.addEventListener('change', () => {
      const card = cb.closest('.strategy-card');
      if (card) {
        if (cb.checked) card.classList.add('active');
        else card.classList.remove('active');
      }
    });
  });

  // Toggle Token Input Visibility
  if (toggleTokenVisibility && authTokenInput) {
    toggleTokenVisibility.addEventListener('click', () => {
      const isPassword = authTokenInput.getAttribute('type') === 'password';
      authTokenInput.setAttribute('type', isPassword ? 'text' : 'password');
      const icon = toggleTokenVisibility.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        if (window.lucide) lucide.createIcons();
      }
    });
  }  // Probe Endpoint Select Change Handler
  if (probeEndpointSelect) {
    probeEndpointSelect.addEventListener('change', () => {
      if (parsedSpecData && parsedSpecData.authRequirement) {
        parsedSpecData.authRequirement.probeEndpoint = probeEndpointSelect.value;
        if (probeEndpointDisplay) probeEndpointDisplay.textContent = probeEndpointSelect.value;
      }
    });
  }

  // Phase 2, 3 & 4: Authentication Gate Handler
  async function handleAuthGate(parsedSpec) {
    if (!parsedSpec) return;
    authGatePanel.style.display = 'block';

    const authReq = parsedSpec.authRequirement || {
      requiresAuth: false,
      authType: 'none',
      probeEndpoint: '/',
      candidateEndpoints: ['/'],
      schemes: []
    };

    const schemeDisplayNames = {
      bearer: 'Bearer Token / JWT',
      jwt: 'JWT Token',
      jwk: 'JWK Token',
      apiKey: 'API Key',
      basic: 'Basic Authentication',
      oauth2: 'OAuth 2.0 Token',
      uuid: 'UUID / Auth Token',
      none: 'No Authentication (Public API)'
    };

    const schemeName = schemeDisplayNames[authReq.authType] || 'Authentication Token';
    validatedAuthToken = null;
    isAuthValidated = false;
    if (authTokenInput) authTokenInput.value = '';
    if (tryoutFeedbackBox) tryoutFeedbackBox.style.display = 'none';
    if (tryoutDiagnosticDetails) tryoutDiagnosticDetails.style.display = 'none';

    // Populate candidate probe endpoints dropdown
    if (probeEndpointSelect) {
      probeEndpointSelect.innerHTML = '';
      const candidates = (authReq.candidateEndpoints && authReq.candidateEndpoints.length > 0)
        ? authReq.candidateEndpoints
        : [authReq.probeEndpoint || '/'];

      candidates.forEach(cand => {
        const opt = document.createElement('option');
        opt.value = cand;
        opt.textContent = cand;
        if (cand === authReq.probeEndpoint) opt.selected = true;
        probeEndpointSelect.appendChild(opt);
      });
      probeEndpointSelect.style.display = candidates.length > 1 ? 'inline-block' : 'none';
    }

    if (probeEndpointDisplay) {
      probeEndpointDisplay.textContent = authReq.probeEndpoint || '/';
    }
    if (authProbeLatency) authProbeLatency.textContent = '';

    if (!authReq.requiresAuth) {
      // Scenario 1: Public APIs
      authStatusBadge.className = 'auth-gate-status-badge status-public';
      authStatusText.textContent = 'API Classification: PUBLIC APIs';
      if (authStatusIcon) authStatusIcon.setAttribute('data-lucide', 'shield-check');
      authGateMeta.textContent = 'Public Accessibility Verification';

      authPublicNotice.style.display = 'flex';
      authPublicNotice.innerHTML = `
        <div class="notice-icon"><i data-lucide="check-circle" style="color: var(--accent-emerald);"></i></div>
        <div class="notice-content">
          <strong style="color: var(--accent-emerald);">✓ Swagger document validated successfully.</strong>
          <p style="margin: 4px 0;">Authentication is not required for the detected APIs.</p>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin: 6px 0;">
            <strong>API Classification:</strong> PUBLIC APIs<br>
            The APIs are accessible without a Bearer Token, JWT, JWK, API Key, or other authentication credentials.
          </div>
          <p style="margin-top: 6px; color: var(--accent-emerald); font-weight: 500;">
            Ready to generate the Playwright TypeScript API automation scripts.
          </p>
        </div>
      `;
      authRequiredControls.style.display = 'none';

      // Lock generation until probe verifies accessibility
      generateBtn.disabled = true;
      generateBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Verifying Public APIs...`;

      // Execute Try-Out Accessibility Probe against Swagger-defined endpoint
      const targetProbePath = authReq.probeEndpoint || '/';
      const probeUrl = (parsedSpec.baseUrl || '') + targetProbePath;
      specStatus.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Executing API Try-Out probe on ${probeUrl}...`;
      if (window.lucide) lucide.createIcons();

      try {
        const probeRes = await fetch('/api/validate-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: parsedSpec.baseUrl,
            endpoint: targetProbePath,
            authType: 'none'
          })
        });
        const probeData = await probeRes.json();

        // If API probe unexpectedly returned 401/403, dynamically switch to Authenticated APIs
        if (probeData.statusCode === 401 || probeData.statusCode === 403) {
          console.warn('[AUTH GATE] Probe returned 401/403 for presumed public API. Switching to Authenticated APIs...');
          authReq.requiresAuth = true;
          authReq.authType = 'bearer';
          return handleAuthGate(parsedSpec);
        }

        authProbeLatency.textContent = `${probeData.latencyMs || 0}ms latency`;
        isAuthValidated = true;
        generateBtn.disabled = false;
        generateBtn.innerHTML = `<i data-lucide="wand-2"></i> Proceed with Generating Scripts`;
        specStatus.innerHTML = `<span style="color: var(--accent-emerald)"><i data-lucide="check-circle-2"></i> Public APIs verified (${probeData.statusCode || 200} ${probeData.statusText || 'OK'} - ${probeData.latencyMs || 0}ms). Ready for script generation.</span>`;
      } catch (e) {
        // Network or offline fallback
        isAuthValidated = true;
        generateBtn.disabled = false;
        generateBtn.innerHTML = `<i data-lucide="wand-2"></i> Proceed with Generating Scripts`;
        specStatus.innerHTML = `<span style="color: var(--accent-emerald)"><i data-lucide="check-circle-2"></i> Public APIs detected. Ready for script generation.</span>`;
      }

      if (window.lucide) lucide.createIcons();

    } else {
      // Scenario 2: Authenticated APIs
      isAuthValidated = false;
      generateBtn.disabled = true;
      generateBtn.innerHTML = `<i data-lucide="lock"></i> Authentication Required`;

      authStatusBadge.className = 'auth-gate-status-badge status-auth-required';
      authStatusText.textContent = `Authentication Required: ${schemeName}`;
      if (authStatusIcon) authStatusIcon.setAttribute('data-lucide', 'shield-alert');
      authGateMeta.textContent = 'Mandatory Validation Gate';

      authPublicNotice.style.display = 'none';
      authRequiredControls.style.display = 'block';

      authRequiredTitle.textContent = `Authentication Required`;
      authRequiredDesc.innerHTML = `Detected Authentication: <strong>${schemeName}</strong>.<br>Please provide the required authentication token to validate the APIs.`;

      // Adapt Input Fields for Detected Scheme
      if (authReq.authType === 'apiKey') {
        if (apiKeyHeaderWrapper) apiKeyHeaderWrapper.style.display = 'flex';
        if (apiKeyHeaderInput) apiKeyHeaderInput.value = authReq.headerName || 'X-API-Key';
        authTokenLabel.textContent = `Enter API Key:`;
        authTokenInput.placeholder = 'e.g. your-api-key-here';
      } else if (authReq.authType === 'basic') {
        if (apiKeyHeaderWrapper) apiKeyHeaderWrapper.style.display = 'none';
        authTokenLabel.textContent = `Enter HTTP Basic Credentials:`;
        authTokenInput.placeholder = 'username:password or Basic base64';
      } else if (authReq.authType === 'oauth2') {
        if (apiKeyHeaderWrapper) apiKeyHeaderWrapper.style.display = 'none';
        authTokenLabel.textContent = `Enter OAuth 2.0 Access Token:`;
        authTokenInput.placeholder = 'e.g. ya29.a0AfH6SMB... or access token';
      } else if (authReq.authType === 'uuid') {
        if (apiKeyHeaderWrapper) apiKeyHeaderWrapper.style.display = 'none';
        authTokenLabel.textContent = `Enter UUID / Auth Token:`;
        authTokenInput.placeholder = 'e.g. 123e4567-e89b-12d3-a456-426614174000';
      } else {
        // Bearer / JWT / JWK
        if (apiKeyHeaderWrapper) apiKeyHeaderWrapper.style.display = 'none';
        authTokenLabel.textContent = `Enter ${schemeName}:`;
        authTokenInput.placeholder = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... or Bearer token';
      }

      specStatus.innerHTML = `<span style="color: var(--accent-amber)"><i data-lucide="shield-alert"></i> Authentication Required (${schemeName}). Provide credentials and validate.</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }

  // Phase 4, 5 & 6: Live API Try-Out & Validation Button Handler
  validateAuthBtn.addEventListener('click', async () => {
    if (!parsedSpecData) return;
    const authReq = parsedSpecData.authRequirement || { authType: 'bearer', probeEndpoint: '/' };
    const token = authTokenInput.value.trim();
    const currentProbe = (probeEndpointSelect && probeEndpointSelect.value) || authReq.probeEndpoint || '/';
    const apiKeyHeader = (apiKeyHeaderInput && apiKeyHeaderInput.value.trim()) || authReq.headerName || 'X-API-Key';

    const schemeDisplayNames = {
      bearer: 'Bearer Token / JWT',
      jwt: 'JWT Token',
      jwk: 'JWK Token',
      apiKey: 'API Key',
      basic: 'Basic Authentication',
      oauth2: 'OAuth 2.0 Token',
      uuid: 'UUID / Auth Token'
    };
    const schemeName = schemeDisplayNames[authReq.authType] || 'Authentication Token';

    if (!token) {
      tryoutFeedbackBox.style.display = 'flex';
      tryoutFeedbackBox.className = 'tryout-feedback-box error';
      tryoutFeedbackIcon.innerHTML = `<i data-lucide="alert-circle" style="color: var(--accent-rose);"></i>`;
      tryoutFeedbackTitle.textContent = 'Credentials Required';
      tryoutFeedbackMsg.innerHTML = `<p>Please enter a valid ${schemeName} before validating API accessibility.</p>`;
      if (tryoutDiagnosticDetails) tryoutDiagnosticDetails.style.display = 'none';
      if (window.lucide) lucide.createIcons();
      authTokenInput.focus();
      return;
    }

    try {
      validateAuthBtn.disabled = true;
      validateAuthBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Validating Authentication...`;
      tryoutFeedbackBox.style.display = 'none';
      if (window.lucide) lucide.createIcons();

      const res = await fetch('/api/validate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: parsedSpecData.baseUrl,
          endpoint: currentProbe,
          authType: authReq.authType,
          token: token,
          apiKeyHeader: apiKeyHeader
        })
      });

      const result = await res.json();
      authProbeLatency.textContent = `${result.latencyMs}ms latency`;

      if (result.success && result.statusCode >= 200 && result.statusCode < 300) {
        // Phase 4: Successful Authentication
        isAuthValidated = true;
        validatedAuthToken = token;

        authStatusBadge.className = 'auth-gate-status-badge status-auth-valid';
        authStatusText.textContent = `Authentication Status: VALID (${result.statusCode} ${result.statusText || 'OK'})`;
        if (authStatusIcon) authStatusIcon.setAttribute('data-lucide', 'shield-check');

        tryoutFeedbackBox.style.display = 'flex';
        tryoutFeedbackBox.className = 'tryout-feedback-box success';
        tryoutFeedbackIcon.innerHTML = `<i data-lucide="check-circle-2" style="color: var(--accent-emerald);"></i>`;
        tryoutFeedbackTitle.textContent = '✓ Authentication validated successfully.';
        tryoutFeedbackMsg.innerHTML = `
          <p style="margin: 4px 0;">The provided ${schemeName} is valid.</p>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin: 6px 0;">
            <strong>API Response:</strong> ${result.statusCode} ${result.statusText || 'OK'} (${result.latencyMs}ms)<br>
            <strong>Authentication Status:</strong> VALID<br><br>
            The Swagger APIs are authenticated APIs and the provided credentials successfully access the API.
          </div>
          <p style="margin-top: 6px; color: var(--accent-emerald); font-weight: 500;">
            Ready to generate the Playwright TypeScript API automation scripts.
          </p>
        `;

        if (tryoutDiagnosticDetails) tryoutDiagnosticDetails.style.display = 'none';

        generateBtn.disabled = false;
        generateBtn.innerHTML = `<i data-lucide="wand-2"></i> Proceed with Generating Scripts`;
        validateAuthBtn.innerHTML = `<i data-lucide="check"></i> Re-validate`;
        specStatus.innerHTML = `<span style="color: var(--accent-emerald)"><i data-lucide="check-circle-2"></i> Authentication VALID! Ready to generate scripts.</span>`;

      } else if (result.statusCode === 401 || result.statusCode === 403) {
        // Phase 5: Invalid Authentication
        isAuthValidated = false;
        validatedAuthToken = null;

        authStatusBadge.className = 'auth-gate-status-badge status-auth-invalid';
        authStatusText.textContent = `Authentication Status: INVALID (${result.statusCode} ${result.statusText || 'Unauthorized'})`;
        if (authStatusIcon) authStatusIcon.setAttribute('data-lucide', 'shield-x');

        tryoutFeedbackBox.style.display = 'flex';
        tryoutFeedbackBox.className = 'tryout-feedback-box error';
        tryoutFeedbackIcon.innerHTML = `<i data-lucide="x-circle" style="color: var(--accent-rose);"></i>`;
        tryoutFeedbackTitle.textContent = '✗ Authentication validation failed.';
        tryoutFeedbackMsg.innerHTML = `
          <p style="margin: 4px 0;">The provided authentication token could not successfully authenticate against the API.</p>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin: 6px 0;">
            <strong>HTTP Status:</strong> ${result.statusCode} ${result.statusText || 'Unauthorized'} (${result.latencyMs}ms)
          </div>
          <p style="margin-top: 6px; color: var(--text-main);">
            Please provide a valid Bearer/JWT/Auth token and validate again.
          </p>
        `;

        if (tryoutDiagnosticDetails) {
          tryoutDiagnosticDetails.style.display = 'block';
          tryoutDiagnosticDetails.innerHTML = `<strong>Diagnostic Recommendation:</strong> ${result.recommendation || 'Verify your credential token and permissions.'}`;
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = `<i data-lucide="lock"></i> Validate Authentication First`;
        validateAuthBtn.innerHTML = `<i data-lucide="shield-check"></i> Validate Authentication`;
        specStatus.innerHTML = `<span style="color: var(--accent-rose)"><i data-lucide="shield-x"></i> ${result.statusCode} ${result.statusText || 'Unauthorized'}: Authentication failed. Generation stopped.</span>`;

      } else {
        // Phase 6: API Try-Out Failure (400, 404, 405, 408, 429, 500, Network)
        isAuthValidated = false;
        validatedAuthToken = null;

        authStatusBadge.className = 'auth-gate-status-badge status-auth-invalid';
        authStatusText.textContent = `API Diagnostic: ${result.statusCode || 'Failed'} (${result.category || result.authStatus || 'ERROR'})`;
        if (authStatusIcon) authStatusIcon.setAttribute('data-lucide', 'alert-triangle');

        tryoutFeedbackBox.style.display = 'flex';
        tryoutFeedbackBox.className = 'tryout-feedback-box warning';
        tryoutFeedbackIcon.innerHTML = `<i data-lucide="alert-triangle" style="color: var(--accent-amber);"></i>`;
        tryoutFeedbackTitle.textContent = `API Try-Out Diagnostic: ${result.category || 'HTTP Error'}`;
        tryoutFeedbackMsg.innerHTML = `
          <div style="font-size: 0.88rem; margin: 4px 0;">
            <strong>HTTP Status:</strong> ${result.statusCode || '0'} ${result.statusText || 'Request Failed'} (${result.latencyMs}ms)<br>
            <strong>Root Cause Analysis:</strong> ${result.message || 'API probe could not complete.'}
          </div>
        `;

        if (tryoutDiagnosticDetails) {
          tryoutDiagnosticDetails.style.display = 'block';
          tryoutDiagnosticDetails.innerHTML = `
            <strong>Actionable Recommendation:</strong> ${result.recommendation || 'Inspect probe endpoint.'}<br>
            <span style="font-size: 0.78rem; color: var(--text-dim);">Probe URL: <code>${result.targetUrl || currentProbe}</code></span>
          `;
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = `<i data-lucide="lock"></i> Validate Authentication First`;
        validateAuthBtn.innerHTML = `<i data-lucide="shield-check"></i> Validate Authentication`;
      }

    } catch (err) {
      tryoutFeedbackBox.style.display = 'flex';
      tryoutFeedbackBox.className = 'tryout-feedback-box error';
      tryoutFeedbackIcon.innerHTML = `<i data-lucide="alert-triangle" style="color: var(--accent-rose);"></i>`;
      tryoutFeedbackTitle.textContent = 'Connection / Target Host Failure';
      tryoutFeedbackMsg.innerHTML = `<p>Could not reach target API server: ${err.message}. Please verify the Base URL and network connection.</p>`;
      if (tryoutDiagnosticDetails) tryoutDiagnosticDetails.style.display = 'none';
      generateBtn.disabled = true;
      generateBtn.innerHTML = `<i data-lucide="lock"></i> Validate Authentication First`;
    } finally {
      validateAuthBtn.disabled = false;
      if (window.lucide) lucide.createIcons();
    }
  });

  // Phase 7: Final Decision Gate Enforced on Generate
  generateBtn.addEventListener('click', async () => {
    if (!currentSpecContent) return;

    // MANDATORY RULE: Never generate automation scripts before validating authentication
    const authReq = (parsedSpecData && parsedSpecData.authRequirement) || { requiresAuth: false };
    if (authReq.requiresAuth && !isAuthValidated) {
      showStatusError('MANDATORY RULE: You must validate authentication credentials before generating scripts!');
      if (authTokenInput) authTokenInput.focus();
      return;
    }

    try {
      generateBtn.disabled = true;
      generateBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Generating Framework...`;
      if (window.lucide) lucide.createIcons();

      const options = {
        includeSequentialE2E: stratE2E ? stratE2E.checked : true,
        includePositive: stratPositive ? stratPositive.checked : true,
        includeNegative: stratNegative ? stratNegative.checked : true,
        includeSecurity: stratSecurity ? stratSecurity.checked : true,
        validatedAuthToken: validatedAuthToken || '',
        isAuthValidated: isAuthValidated
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specContent: currentSpecContent,
          options,
          sourceUrl: currentSourceUrl,
          baseUrl: parsedSpecData ? parsedSpecData.baseUrl : ''
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      generatedFilesList = data.files;
      lastExecutionResult = null;
      allureSection.style.display = 'none';
      renderFileTree(generatedFilesList);

      const defaultFile = generatedFilesList.find(f => f.path === 'tests/e2e/e2e-workflow.spec.ts') ||
                          generatedFilesList.find(f => f.path.startsWith('tests/')) ||
                          generatedFilesList[0];
      selectFile(defaultFile);

      workbenchSection.style.display = 'grid';
      generateBtn.innerHTML = `<i data-lucide="check-circle"></i> Framework Generated!`;
      setTimeout(() => {
        generateBtn.innerHTML = `<i data-lucide="wand-2"></i> Proceed with Generating Scripts`;
        generateBtn.disabled = false;
        if (window.lucide) lucide.createIcons();
      }, 2000);

    } catch (err) {
      showStatusError(`Generation failed: ${err.message}`);
      generateBtn.disabled = false;
      generateBtn.innerHTML = `<i data-lucide="wand-2"></i> Proceed with Generating Scripts`;
      if (window.lucide) lucide.createIcons();
    }
  });

  // 6. Render File Tree
  function renderFileTree(files) {
    fileTree.innerHTML = '';

    files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'tree-item';
      
      let iconName = 'file-text';
      if (file.path.endsWith('.ts')) iconName = 'file-code';
      if (file.path.endsWith('.json')) iconName = 'file-json';
      if (file.path.endsWith('.md')) iconName = 'book-open';
      if (file.path.startsWith('tests/')) iconName = 'check-square';
      if (file.path.startsWith('controllers/')) iconName = 'cpu';

      item.innerHTML = `<i data-lucide="${iconName}"></i> <span>${file.path}</span>`;
      item.addEventListener('click', () => selectFile(file));

      fileTree.appendChild(item);
    });

    if (window.lucide) lucide.createIcons();
  }

  // 7. Select & Preview File
  function selectFile(file) {
    activeFile = file;
    activeFilePath.textContent = file.path;
    codeViewer.textContent = file.content;

    // Highlight active tree element
    const items = fileTree.querySelectorAll('.tree-item');
    items.forEach(el => {
      if (el.textContent.trim() === file.path) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  // 8. Copy Code Button
  copyCodeBtn.addEventListener('click', () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    copyCodeBtn.innerHTML = `<i data-lucide="check"></i> Copied!`;
    setTimeout(() => {
      copyCodeBtn.innerHTML = `<i data-lucide="copy"></i> Copy Code`;
      if (window.lucide) lucide.createIcons();
    }, 1500);
  });

  // 9. Download Framework ZIP
  downloadZipBtn.addEventListener('click', async () => {
    if (generatedFilesList.length === 0) return;

    try {
      downloadZipBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Zipping...`;
      if (window.lucide) lucide.createIcons();

      const projectName = parsedSpecData ? parsedSpecData.title : 'playwright-api-automation';
      const res = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: generatedFilesList, projectName })
      });

      if (!res.ok) throw new Error('ZIP download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-playwright.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      downloadZipBtn.innerHTML = `<i data-lucide="download"></i> Download ZIP`;
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      alert(`ZIP Download Error: ${err.message}`);
      downloadZipBtn.innerHTML = `<i data-lucide="download"></i> Download ZIP`;
      if (window.lucide) lucide.createIcons();
    }
  });

  // 9b. Download Sequenced Postman Collection
  downloadPostmanBtn.addEventListener('click', async () => {
    if (!currentSpecContent) return;

    try {
      downloadPostmanBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Generating Postman...`;
      if (window.lucide) lucide.createIcons();

      const genRes = await fetch('/api/generate-postman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specContent: currentSpecContent,
          sourceUrl: currentSourceUrl,
          baseUrl: parsedSpecData ? parsedSpecData.baseUrl : ''
        })
      });

      const genData = await genRes.json();
      if (!genData.success) throw new Error(genData.error || 'Failed to generate Postman collection');

      const col = genData.collection;
      const blob = new Blob([JSON.stringify(col, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (parsedSpecData ? parsedSpecData.title : 'api-suite').toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.download = `${safeTitle}.postman_collection.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      downloadPostmanBtn.innerHTML = `<i data-lucide="check"></i> Postman Downloaded!`;
      setTimeout(() => {
        downloadPostmanBtn.innerHTML = `<i data-lucide="send"></i> Postman JSON`;
        if (window.lucide) lucide.createIcons();
      }, 2000);
    } catch (err) {
      alert(`Postman Export Error: ${err.message}`);
      downloadPostmanBtn.innerHTML = `<i data-lucide="send"></i> Postman JSON`;
      if (window.lucide) lucide.createIcons();
    }
  });

  // 9c. View Real Execution Summary
  viewAllureReportBtn.addEventListener('click', () => {
    if (!lastExecutionResult) {
      showStatusError('Run the generated Playwright suite first to view real execution results.');
      return;
    }

    persistExecutionReport(lastExecutionResult);
    window.open('/allure-report.html', '_blank');
    renderAllureReport(lastExecutionResult);
    allureSection.style.display = 'block';
    allureSection.scrollIntoView({ behavior: 'smooth' });
  });

  closeAllureBtn.addEventListener('click', () => {
    allureSection.style.display = 'none';
  });

  function formatDurationMs(durationMs) {
    return `${((durationMs || 0) / 1000).toFixed(2)}s`;
  }

  function persistExecutionReport(executionResult) {
    try {
      localStorage.setItem('playwright_execution_report', JSON.stringify({
        title: parsedSpecData ? parsedSpecData.title : 'Generated Playwright API framework',
        version: parsedSpecData ? parsedSpecData.version : '',
        baseUrl: parsedSpecData ? parsedSpecData.baseUrl : '',
        executedAt: new Date().toISOString(),
        execution: executionResult
      }));
    } catch (error) {
      console.warn('Could not persist execution report data to localStorage', error);
    }
  }

  function renderAllureReport(executionResult) {
    const summary = executionResult.summary || { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 };
    const tests = executionResult.tests || [];
    const suiteCount = new Set(tests.map(test => test.file || test.suite || test.title)).size || 0;
    const passedRatio = summary.total ? Math.round((summary.passed / summary.total) * 100) : 0;

    allureTotal.textContent = `${summary.total} Tests`;
    allureSuites.textContent = `${suiteCount} Suites`;
    allurePassed.textContent = `${passedRatio}%`;
    allureDuration.textContent = formatDurationMs(summary.durationMs);

    allureSuitesList.innerHTML = '';

    tests.forEach(test => {
      const row = document.createElement('div');
      const normalizedStatus = test.status === 'passed' ? 'pass' : (test.status === 'skipped' ? 'skip' : 'fail');
      const severityLabel = normalizedStatus === 'fail' ? 'High' : (normalizedStatus === 'skip' ? 'Skipped' : 'Normal');
      const suiteLabel = test.suite ? `${test.suite} > ${test.title}` : test.title;

      row.className = 'table-row';
      row.innerHTML = `
        <div><strong>${test.file || 'generated-suite'}</strong>: ${suiteLabel}</div>
        <div><span class="tag-badge tag-${normalizedStatus}">${test.status.toUpperCase()}</span></div>
        <div>${test.durationMs || 0}ms</div>
        <div><span class="tag-badge tag-normal">${severityLabel}</span></div>
      `;
      allureSuitesList.appendChild(row);

      const displayFailureReason = test.failureReason || test.error;

      if (displayFailureReason) {
        const errorRow = document.createElement('div');
        errorRow.className = 'table-row';
        errorRow.innerHTML = `
          <div style="grid-column: 1 / span 4; color: #fca5a5; font-size: 0.82rem;">${escapeHtml(displayFailureReason)}</div>
        `;
        allureSuitesList.appendChild(errorRow);
      }
    });

    if (window.lucide) lucide.createIcons();
  }

  function resetRunnerPanel() {
    terminalOutput.innerHTML = '';
    passCount.innerHTML = `<i data-lucide="check-circle-2"></i> 0 Passed`;
    failCount.innerHTML = `<i data-lucide="x-circle"></i> 0 Failed`;
    skipCount.innerHTML = `<i data-lucide="alert-circle"></i> 0 Skipped`;
    totalCount.textContent = '0 Total';
  }

  function appendRunnerLog(text, type = 'info') {
    const line = document.createElement('div');
    line.className = `log-line log-${type}`;
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  async function readJsonResponse(response, fallbackMessage) {
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    const firstMeaningfulLine = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(Boolean);

    let detail = firstMeaningfulLine || fallbackMessage;
    if (detail.startsWith('<!DOCTYPE') || detail.startsWith('<html')) {
      detail = 'Server returned an HTML error page instead of JSON. Restart the app so the latest server code is running.';
    }

    throw new Error(detail);
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 10. Run Real Playwright Test Execution
  runSimulatedTestsBtn.addEventListener('click', async () => {
    if (generatedFilesList.length === 0) {
      showStatusError('Generate the Playwright framework first.');
      return;
    }

    runnerPanel.style.display = 'block';
    runnerPanel.scrollIntoView({ behavior: 'smooth' });
    resetRunnerPanel();
    appendRunnerLog('Submitting generated framework for real Playwright execution...', 'info');
    appendRunnerLog(`Base URL: ${parsedSpecData ? parsedSpecData.baseUrl : 'Unknown'}`, 'muted');
    runSimulatedTestsBtn.disabled = true;
    runSimulatedTestsBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Running...`;
    if (window.lucide) lucide.createIcons();

    try {
      const res = await fetch('/api/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: generatedFilesList })
      });

      const data = await readJsonResponse(res, 'Playwright execution failed.');
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Playwright execution failed.');
      }

      lastExecutionResult = data;

      passCount.innerHTML = `<i data-lucide="check-circle-2"></i> ${data.summary.passed} Passed`;
      failCount.innerHTML = `<i data-lucide="x-circle"></i> ${data.summary.failed} Failed`;
      skipCount.innerHTML = `<i data-lucide="alert-circle"></i> ${data.summary.skipped} Skipped`;
      totalCount.textContent = `${data.summary.total} Total`;

      terminalOutput.innerHTML = '';
      (data.logs || []).forEach(log => appendRunnerLog(log.text, log.type));

      if (data.rawOutput && !data.logs?.length) {
        data.rawOutput.split(/\r?\n/).filter(Boolean).forEach(line => appendRunnerLog(line, 'muted'));
      }

      persistExecutionReport(data);
      renderAllureReport(data);

    } catch (err) {
      appendRunnerLog(err.message, 'fail');
      lastExecutionResult = null;
    } finally {
      runSimulatedTestsBtn.disabled = false;
      runSimulatedTestsBtn.innerHTML = `<i data-lucide="play-circle"></i> Run Test Suite`;
      if (window.lucide) lucide.createIcons();
    }
  });

  // 11. Interactive Metric Tabs Implementation
  const tabApiInfo = document.getElementById('tabApiInfo');
  const tabEndpoints = document.getElementById('tabEndpoints');
  const tabControllers = document.getElementById('tabControllers');
  const tabBaseUrl = document.getElementById('tabBaseUrl');
  const metricDetailsPanel = document.getElementById('metricDetailsPanel');
  const detailTabTitle = document.getElementById('detailTabTitle');
  const detailTabIcon = document.getElementById('detailTabIcon');
  const detailsSearchInput = document.getElementById('detailsSearchInput');
  const closeDetailsBtn = document.getElementById('closeDetailsBtn');
  const detailPanelContent = document.getElementById('detailPanelContent');

  let currentActiveTab = null;

  function setupMetricTabs() {
    [tabApiInfo, tabEndpoints, tabControllers, tabBaseUrl].forEach(tab => {
      if (!tab) return;
      tab.addEventListener('click', () => {
        const tabType = tab.getAttribute('data-tab');
        if (currentActiveTab === tabType) {
          closeMetricDetails();
        } else {
          openMetricTab(tabType);
        }
      });
    });

    closeDetailsBtn.addEventListener('click', closeMetricDetails);

    detailsSearchInput.addEventListener('input', (e) => {
      if (currentActiveTab === 'endpoints') {
        renderEndpointsDetail(e.target.value.toLowerCase().trim());
      }
    });
  }

  function closeMetricDetails() {
    metricDetailsPanel.style.display = 'none';
    currentActiveTab = null;
    [tabApiInfo, tabEndpoints, tabControllers, tabBaseUrl].forEach(t => t.classList.remove('active'));
  }

  function openMetricTab(tabType) {
    if (!parsedSpecData) return;

    currentActiveTab = tabType;
    [tabApiInfo, tabEndpoints, tabControllers, tabBaseUrl].forEach(t => {
      if (t.getAttribute('data-tab') === tabType) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    metricDetailsPanel.style.display = 'block';
    detailsSearchInput.style.display = tabType === 'endpoints' ? 'inline-block' : 'none';
    detailsSearchInput.value = '';

    if (tabType === 'endpoints') {
      detailTabTitle.textContent = `Endpoints Breakdown (${parsedSpecData.totalEndpoints} Total)`;
      detailTabIcon.setAttribute('data-lucide', 'network');
      renderEndpointsDetail('');
    } else if (tabType === 'controllers') {
      const groupCount = Object.keys(parsedSpecData.tagGroups).length;
      detailTabTitle.textContent = `Resource Controllers & Service Layer (${groupCount} Controllers)`;
      detailTabIcon.setAttribute('data-lucide', 'folder-tree');
      renderControllersDetail();
    } else if (tabType === 'server') {
      detailTabTitle.textContent = `Server & Environment Configuration`;
      detailTabIcon.setAttribute('data-lucide', 'globe');
      renderServerDetail();
    } else if (tabType === 'info') {
      detailTabTitle.textContent = `API Specification Details`;
      detailTabIcon.setAttribute('data-lucide', 'layers');
      renderInfoDetail();
    }

    if (window.lucide) lucide.createIcons();
    metricDetailsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderEndpointsDetail(filter) {
    if (!parsedSpecData || !parsedSpecData.endpoints) return;

    const filtered = parsedSpecData.endpoints.filter(ep => {
      if (!filter) return true;
      return ep.path.toLowerCase().includes(filter) ||
             ep.method.toLowerCase().includes(filter) ||
             (ep.summary && ep.summary.toLowerCase().includes(filter)) ||
             (ep.tag && ep.tag.toLowerCase().includes(filter));
    });

    if (filtered.length === 0) {
      detailPanelContent.innerHTML = `<div class="text-muted" style="padding: 24px; text-align: center;">No endpoints match the filter "${filter}"</div>`;
      return;
    }

    let rowsHtml = '';
    filtered.forEach(ep => {
      const methodClass = `badge-${ep.method.toLowerCase()}`;
      const pathParams = (ep.parameters && ep.parameters.path) ? ep.parameters.path.length : 0;
      const queryParams = (ep.parameters && ep.parameters.query) ? ep.parameters.query.length : 0;
      const hasBody = (ep.parameters && ep.parameters.body) ? 'Body' : '';
      const paramsSummary = [
        pathParams ? `${pathParams} path` : '',
        queryParams ? `${queryParams} query` : '',
        hasBody
      ].filter(Boolean).join(', ') || 'No params';

      rowsHtml += `
        <div class="endpoint-row">
          <div><span class="badge-method ${methodClass}">${ep.method}</span></div>
          <div class="endpoint-path" title="${ep.summary || ep.path}">
            <strong>${ep.path}</strong>
            <div style="font-size: 0.72rem; color: var(--text-dim);">${ep.summary || ep.operationId}</div>
          </div>
          <div class="endpoint-tag"><span class="tag-badge tag-normal">${ep.tag}</span></div>
          <div class="endpoint-params">${paramsSummary}</div>
        </div>
      `;
    });

    detailPanelContent.innerHTML = `<div class="endpoints-list">${rowsHtml}</div>`;
  }

  function renderControllersDetail() {
    if (!parsedSpecData || !parsedSpecData.tagGroups) return;

    let cardsHtml = '';
    for (const [tag, groupEndpoints] of Object.entries(parsedSpecData.tagGroups)) {
      const methods = [...new Set(groupEndpoints.map(e => e.method))];
      const badgesHtml = methods.map(m => `<span class="badge-method badge-${m.toLowerCase()}">${m}</span>`).join(' ');

      cardsHtml += `
        <div class="controller-card">
          <div class="controller-header">
            <span class="controller-name">${tag}Api</span>
            <span class="controller-count">${groupEndpoints.length} endpoints</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            Generated Controller: <code>controllers/${tag}Api.ts</code>
          </div>
          <div class="controller-methods">${badgesHtml}</div>
        </div>
      `;
    }

    detailPanelContent.innerHTML = `<div class="controllers-grid">${cardsHtml}</div>`;
  }

  function renderServerDetail() {
    if (!parsedSpecData) return;

    const authSchemes = Object.keys(parsedSpecData.securitySchemes || {});
    const authText = authSchemes.length > 0 ? authSchemes.join(', ') : 'Standard / No Auth Specified';

    detailPanelContent.innerHTML = `
      <div class="server-details-view">
        <div class="detail-section-card">
          <h4>Resolved Base URL</h4>
          <div class="detail-val-large">${parsedSpecData.baseUrl}</div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;">
            Injected automatically into <code>playwright.config.ts</code> as <code>baseURL</code>. Can be overridden using <code>process.env.BASE_URL</code>.
          </p>
        </div>

        <div class="detail-section-card">
          <h4>Authentication & Security Schemes</h4>
          <div style="color: var(--accent-cyan); font-weight: 600;">${authText}</div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;">
            Supports Bearer token authorization headers via <code>process.env.AUTH_TOKEN</code> or custom API client headers.
          </p>
        </div>

        <div class="detail-section-card">
          <h4>Global Request Headers Configured</h4>
          <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; font-size: 0.8rem; font-family: var(--font-mono); color: #e2e8f0;">
Accept: application/json
Content-Type: application/json
Authorization: Bearer \${process.env.AUTH_TOKEN || ''}</pre>
        </div>
      </div>
    `;
  }

  function renderInfoDetail() {
    if (!parsedSpecData) return;

    detailPanelContent.innerHTML = `
      <div class="info-details-view">
        <div class="detail-section-card">
          <h4>API Title & Version</h4>
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-main);">${parsedSpecData.title}</div>
          <div style="color: var(--accent-cyan); font-size: 0.85rem; margin-top: 4px;">Specification Version: ${parsedSpecData.version}</div>
        </div>

        <div class="detail-section-card">
          <h4>API Description</h4>
          <p style="color: var(--text-muted); line-height: 1.6;">${parsedSpecData.description || 'No description provided in Swagger document.'}</p>
        </div>

        <div class="detail-section-card">
          <h4>Automation Framework Compatibility</h4>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <span class="tag-badge tag-pass">Playwright v1.44+</span>
            <span class="tag-badge tag-pass">TypeScript ES2022</span>
            <span class="tag-badge tag-pass">Allure Reporter 3.0</span>
            <span class="tag-badge tag-pass">Postman v2.1 Collection</span>
          </div>
        </div>
      </div>
    `;
  }

  setupMetricTabs();

});
