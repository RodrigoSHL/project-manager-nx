import { readFile } from 'node:fs/promises';

// Explicit functional smoke: submits one real photo and may incur provider usage.
const [origin, imagePath] = process.argv.slice(2);
if (!origin || !imagePath)
  throw new Error(
    'Usage: node scripts/smoke-macrofit.mjs <origin> <food-image>'
  );
const bytes = await readFile(imagePath);
if (!bytes.length || bytes.length > 5 * 1024 * 1024)
  throw new Error('Photo must be between 1 byte and 5 MB');
const mime = /\.png$/i.test(imagePath)
  ? 'image/png'
  : /\.webp$/i.test(imagePath)
  ? 'image/webp'
  : 'image/jpeg';
const form = new FormData();
form.append('image', new Blob([bytes], { type: mime }), 'smoke-image');
const response = await fetch(
  `${origin.replace(/\/$/, '')}/api/macrofit/analyze-plate`,
  {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(45000),
  }
);
if (!response.ok)
  throw new Error(`MacroFit functional smoke failed: HTTP ${response.status}`);
const result = await response.json();
if (
  !Array.isArray(result.items) ||
  !result.items.length ||
  !Number.isFinite(result.total_estimated_kcal)
) {
  throw new Error('MacroFit functional smoke returned an invalid analysis');
}
console.log('MACROFIT_PROVIDER_ANALYSIS=ok');
