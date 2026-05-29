// アイコン生成スクリプト（SVG → PNG変換）
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

const svgSrc = readFileSync(resolve(root, 'public/favicon.svg'));

for (const { name, size } of sizes) {
  const dest = resolve(root, name === 'apple-touch-icon.png'
    ? `public/${name}`
    : `public/icons/${name}`);
  await sharp(svgSrc)
    .resize(size, size)
    .png()
    .toFile(dest);
  console.log(`✓ Generated ${name} (${size}x${size})`);
}

console.log('Done!');
