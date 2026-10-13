// Run with: node scripts/generate-travel-planner-icons.mjs
// The SVG is the single source for the browser and Apple home-screen icons.
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const publicDir = new URL(
  '../apps/travel-planner-app/public/',
  import.meta.url
);
const logo = await readFile(new URL('travel-planner-icon.svg', publicDir));

for (const filename of ['icon-light-32x32.png', 'icon-dark-32x32.png']) {
  await sharp(logo)
    .resize(32, 32)
    .png()
    .toFile(new URL(filename, publicDir).pathname);
}
// Apple supplies the rounded mask; use a solid square background underneath it.
await sharp(Buffer.from(logo.toString().replace(' rx="104"', '')))
  .resize(180, 180)
  .png()
  .toFile(new URL('apple-icon.png', publicDir).pathname);
console.log('Travel Planner browser and Apple icons generated.');
