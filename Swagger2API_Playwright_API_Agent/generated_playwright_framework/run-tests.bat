@echo off
echo ========================================================
echo 🚀 Running Playwright API Tests (Direct Zero-Setup Execution)
echo ℹ️ Browser installation is SKIPPED for API testing
echo ========================================================
set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
call npx --yes @playwright/test test
pause
