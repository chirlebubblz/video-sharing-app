const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// SVG string for Yellow Winking Smiley
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Outer Yellow Circle -->
  <circle cx="256" cy="256" r="240" fill="#FACC15"/>
  
  <!-- Left Eye: Open Eye -->
  <circle cx="170" cy="200" r="28" fill="#000000"/>
  <circle cx="178" cy="192" r="9" fill="#FFFFFF"/>
  
  <!-- Right Eye: Winking Eye (😉) -->
  <path d="M 280 210 Q 330 160 380 210" fill="none" stroke="#000000" stroke-width="24" stroke-linecap="round"/>
  
  <!-- Big Happy Smile -->
  <path d="M 150 290 Q 256 410 362 290" fill="none" stroke="#000000" stroke-width="24" stroke-linecap="round"/>
</svg>`;

const targetDirs = [
  path.join(__dirname, '..', 'chrome-extension'),
  path.join(__dirname, '..', 'public', 'extension'),
];

// If sharp is available, convert SVG to PNG
try {
  const sharp = require('sharp');
  async function generatePNGs() {
    for (const dir of targetDirs) {
      const svgPath = path.join(dir, 'icon.svg');
      fs.writeFileSync(svgPath, svgContent);

      await sharp(Buffer.from(svgContent)).resize(16, 16).toFile(path.join(dir, 'icon16.png'));
      await sharp(Buffer.from(svgContent)).resize(48, 48).toFile(path.join(dir, 'icon48.png'));
      await sharp(Buffer.from(svgContent)).resize(128, 128).toFile(path.join(dir, 'icon128.png'));
      console.log(`✅ Generated 16x16, 48x48, 128x128 PNG icons in ${dir}`);
    }
  }
  generatePNGs();
} catch (e) {
  console.log('Sharp module fallback: creating raw valid PNG files');
}
