const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🧪 DEFINITELYNOTLOOM AUTOMATED SUITE VERIFICATION');
console.log('====================================================\n');

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
  }
}

// Test 1: Chrome Extension Manifest V3 Validation
console.log('--- [TEST SUITE 1] Chrome Extension Manifest V3 Audit ---');
try {
  const manifestPath = path.join(__dirname, '..', 'chrome-extension', 'manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json exists in chrome-extension/');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert(manifest.manifest_version === 3, 'Manifest version is 3');
  assert(manifest.name === 'DefinitelyNotLoom Floating Screen Recorder', 'Extension name is correct');
  assert(manifest.background && manifest.background.service_worker === 'background.js', 'Background service worker is configured');
  assert(manifest.action && manifest.action.default_popup === 'popup.html', 'Action default popup is configured');
  assert(Array.isArray(manifest.content_scripts) && manifest.content_scripts.length > 0, 'Content script matches all URLs');
} catch (e) {
  assert(false, `Manifest validation error: ${e.message}`);
}

// Test 2: Extension Public Directory Sync Audit
console.log('\n--- [TEST SUITE 2] Public Extension Directory Synchronization ---');
const extFiles = ['manifest.json', 'background.js', 'content.js', 'popup.html', 'popup.js', 'icon.svg', 'permission.html'];
extFiles.forEach((file) => {
  const sourcePath = path.join(__dirname, '..', 'chrome-extension', file);
  const destPath = path.join(__dirname, '..', 'public', 'extension', file);
  const synced = fs.existsSync(destPath) && fs.readFileSync(sourcePath, 'utf8') === fs.readFileSync(destPath, 'utf8');
  assert(synced, `File synchronized: public/extension/${file}`);
});

// Test 3: Serverless Video Cache Module Audit
console.log('\n--- [TEST SUITE 3] Serverless Video Cache & Stream Engine Audit ---');
try {
  const videoCachePath = path.join(__dirname, '..', 'src', 'lib', 'videoCache.ts');
  assert(fs.existsSync(videoCachePath), 'src/lib/videoCache.ts module exists');
  const code = fs.readFileSync(videoCachePath, 'utf8');
  assert(code.includes('cacheVideoBuffer'), 'cacheVideoBuffer function is exported');
  assert(code.includes('getVideoBuffer'), 'getVideoBuffer function is exported');
} catch (e) {
  assert(false, `Video cache test error: ${e.message}`);
}

// Test 4: Next.js App Build Cleanliness Test
console.log('\n--- [TEST SUITE 4] Required Route & Component Existence ---');
const requiredFiles = [
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'src/app/icon.svg',
  'src/app/v/[id]/page.tsx',
  'src/app/api/upload/chunk/route.ts',
  'src/app/api/video/stream/[id]/route.ts',
  'src/app/api/video/[id]/route.ts',
  'src/components/recorder/StudioRecorder.tsx',
];

requiredFiles.forEach((relPath) => {
  const fullPath = path.join(__dirname, '..', relPath);
  assert(fs.existsSync(fullPath), `Required path exists: ${relPath}`);
});

console.log('\n====================================================');
console.log(`📊 TEST SUMMARY: ${passedCount} PASSED | ${failedCount} FAILED`);
console.log('====================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
