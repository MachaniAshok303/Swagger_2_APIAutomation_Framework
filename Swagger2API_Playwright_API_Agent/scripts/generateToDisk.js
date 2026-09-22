const fs = require('fs');
const path = require('path');
const { parseSwaggerSpec, fetchAndResolveSpecUrl } = require('../services/swaggerParser');
const { generatePlaywrightFramework } = require('../services/codeGenerator');

async function main() {
  let specContent;
  const inputArg = process.argv[2];
  let targetUrl = inputArg || 'https://fakerestapi.azurewebsites.net/swagger/v1/swagger.json';

  if (inputArg && (inputArg.startsWith('http://') || inputArg.startsWith('https://'))) {
    console.log(`🌐 Fetching & resolving Swagger spec from URL: ${inputArg}...`);
    try {
      const resolved = await fetchAndResolveSpecUrl(inputArg);
      specContent = resolved.specContent;
      targetUrl = resolved.resolvedUrl;
    } catch (err) {
      console.error(`Failed to fetch/resolve URL ${inputArg}: ${err.message}`);
      process.exit(1);
    }
  } else if (inputArg && fs.existsSync(path.resolve(inputArg))) {
    console.log(`📄 Reading local Swagger spec file: ${inputArg}...`);
    specContent = fs.readFileSync(path.resolve(inputArg), 'utf-8');
  } else {
    console.log(`🌐 Fetching & resolving default Swagger spec from: ${targetUrl}...`);
    try {
      const resolved = await fetchAndResolveSpecUrl(targetUrl);
      specContent = resolved.specContent;
      targetUrl = resolved.resolvedUrl;
    } catch (err) {
      console.warn(`Could not fetch from network, falling back to local petstore sample: ${err.message}`);
      specContent = fs.readFileSync(path.join(__dirname, '../sample_specs/petstore_v3.json'), 'utf-8');
    }
  }

  const parsed = parseSwaggerSpec(specContent, targetUrl);
  const framework = generatePlaywrightFramework(parsed);

  const outputDir = path.join(__dirname, '../generated_playwright_framework');
  if (fs.existsSync(outputDir)) {
    const subFolders = ['tests', 'src', 'config', 'test-data'];
    for (const sub of subFolders) {
      const subPath = path.join(outputDir, sub);
      if (fs.existsSync(subPath)) {
        fs.rmSync(subPath, { recursive: true, force: true });
      }
    }
  } else {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Writing ${framework.files.length} TypeScript framework files into: ${outputDir}`);

  for (const file of framework.files) {
    const fullPath = path.join(outputDir, file.path);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, file.content, 'utf-8');
    console.log(`  ✓ Generated: ${file.path}`);
  }

  console.log(`\n🎉 All Playwright TypeScript files generated successfully!`);
}

main().catch(console.error);
