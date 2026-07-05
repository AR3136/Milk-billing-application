import sharp from 'sharp';
import { copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC  = 'C:\\Users\\Admin\\Downloads\\ChatGPT Image Jul 5, 2026, 02_08_50 PM.png';

// Ensure directories exist
mkdirSync(join(ROOT, 'public', 'icons'), { recursive: true });
mkdirSync(join(ROOT, 'src',  'app'),    { recursive: true });

// ── 1. Copy source logo as public/logo.png ──────────────────────────────────
copyFileSync(SRC, join(ROOT, 'public', 'logo.png'));
console.log('✓ Copied logo.png');

// ── 2. Standard PWA icon sizes ───────────────────────────────────────────────
const pwaIcons = [
  { size: 48,  name: 'icon-48x48.png'   },
  { size: 72,  name: 'icon-72x72.png'   },
  { size: 96,  name: 'icon-96x96.png'   },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 180, name: 'icon-180x180.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

for (const { size, name } of pwaIcons) {
  await sharp(SRC)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(join(ROOT, 'public', 'icons', name));
  console.log(`✓ ${name}`);
}

// ── 3. Maskable icons (logo fills full safe zone with white bg) ──────────────
for (const size of [192, 512]) {
  await sharp(SRC)
    .resize(size, size, { fit: 'cover', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(ROOT, 'public', 'icons', `maskable-icon-${size}.png`));
  console.log(`✓ maskable-icon-${size}.png`);
}

// ── 4. Apple touch icon (180×180) ────────────────────────────────────────────
await sharp(SRC)
  .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(join(ROOT, 'public', 'icons', 'apple-touch-icon.png'));
console.log('✓ apple-touch-icon.png');

// ── 5. Browser favicons ───────────────────────────────────────────────────────
await sharp(SRC)
  .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(join(ROOT, 'public', 'icons', 'favicon-32x32.png'));
console.log('✓ favicon-32x32.png');

await sharp(SRC)
  .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(join(ROOT, 'public', 'icons', 'favicon-16x16.png'));
console.log('✓ favicon-16x16.png');

// ── 6. favicon.ico (32×32 embedded in ICO via raw PNG rename) ────────────────
//    Next.js App Router reads /app/favicon.ico automatically.
//    We write a 32×32 PNG and also copy it as the ICO source.
await sharp(SRC)
  .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(join(ROOT, 'src', 'app', 'favicon.ico'));
console.log('✓ src/app/favicon.ico');

console.log('\n🎉 All icons generated successfully!');
