#!/usr/bin/env bash
echo "========================================================"
echo "🚀 Running Playwright API Tests (Direct Zero-Setup Execution)"
echo "ℹ️ Browser installation is SKIPPED for API testing"
echo "========================================================"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
npx --yes @playwright/test test
