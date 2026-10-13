// Run with: node scripts/generate-gridassets-icons.mjs
// Keep browser and installed-app icons aligned with the GridAssets SVG sources.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const publicDir = new URL('../apps/inspection-web/public/', import.meta.url);
const logo = await readFile(new URL('gridassets-icon.svg', publicDir));
const maskableLogo = await readFile(new URL('gridassets-maskable.svg', publicDir));

for (const size of [192, 512]) {
  await sharp(logo)
    .resize(size, size)
    .png()
    .toFile(new URL(`pwa-${size}x${size}.png`, publicDir).pathname);
}
await sharp(maskableLogo)
  .resize(512, 512)
  .png()
  .toFile(new URL('pwa-maskable-512x512.png', publicDir).pathname);

// ICO supports PNG entries; include multiple sizes for browser compatibility.
const sizes = [16, 32, 48, 64];
const images = await Promise.all(
  sizes.map((size) => sharp(logo).resize(size, size).png().toBuffer())
);
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(
  new URL('favicon.ico', publicDir),
  Buffer.concat([header, ...images])
);
console.log('GridAssets favicon and PWA icons generated.');
