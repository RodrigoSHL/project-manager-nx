// Run with: node scripts/generate-project-brand-icons.mjs
// Product SVGs are the source for browser and Apple icons.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

function encodeIco(images, sizes) {
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
  return Buffer.concat([header, ...images]);
}

for (const [app, source] of [
  ['project-web', 'projecthub-icon.svg'],
  ['jira-web', 'flowboard-icon.svg'],
]) {
  const appDir = new URL(`../apps/${app}/`, import.meta.url);
  const publicDir = new URL('public/', appDir);
  const logo = await readFile(new URL(source, publicDir));
  for (const filename of ['icon-light-32x32.png', 'icon-dark-32x32.png']) {
    await sharp(logo)
      .resize(32, 32)
      .png()
      .toFile(new URL(filename, publicDir).pathname);
  }
  // Apple applies its own corner mask; keep the background solid underneath it.
  await sharp(Buffer.from(logo.toString().replace(' rx="104"', '')))
    .resize(180, 180)
    .png()
    .toFile(new URL('apple-icon.png', publicDir).pathname);
  if (app === 'project-web') {
    const sizes = [16, 32, 48, 64];
    const images = await Promise.all(
      sizes.map((size) => sharp(logo).resize(size, size).png().toBuffer())
    );
    await writeFile(
      new URL('app/favicon.ico', appDir),
      encodeIco(images, sizes)
    );
  } else {
    // Update the legacy URL as well so it no longer serves the v0 template logo.
    await writeFile(new URL('icon.svg', publicDir), logo);
  }
  console.log(`${app}: browser and Apple icons generated.`);
}
