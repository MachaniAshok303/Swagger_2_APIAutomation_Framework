import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific configuration
const ENV = process.env.ENV || 'qa';
dotenv.config({ path: path.resolve(__dirname, `.env.${ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Enterprise Playwright API Automation Configuration for Swagger Petstore - OpenAPI 3.0
 * Features:
 * - Multi-Environment support (qa, dev, prod)
 * - Allure & HTML Dual Reporting
 * - Automatic retry on network flakiness
 * - Authentication Scheme: Public APIs (No authentication credentials required)
 */
export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: true,
        environmentInfo: {
          'API_Title': 'Swagger Petstore - OpenAPI 3.0',
          'Framework': 'Playwright + TypeScript',
          'Base_URL': 'https://petstore.swagger.io/v2/',
          'Node_ENV': process.env.ENV || 'qa'
        }
      }
    ]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://petstore.swagger.io/v2/',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure'
  }
});
