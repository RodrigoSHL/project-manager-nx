import { execFileSync } from 'node:child_process';

// Exercises built production images without publishing ports or contacting Gemini.
const suffix = `${process.pid}-${Date.now()}`;
const api = `codex-macrofit-api-check-${suffix}`;
const bff = `codex-macrofit-bff-check-${suffix}`;
const docker = (...args) =>
  execFileSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
try {
  docker(
    'run',
    '--rm',
    '-d',
    '--network',
    'none',
    '--name',
    api,
    '-e',
    'GEMINI_API_KEY=',
    'project-manager-nx-macro-fit-api'
  );
  docker(
    'run',
    '--rm',
    '-d',
    '--network',
    `container:${api}`,
    '--name',
    bff,
    '-e',
    'JWT_SECRET=runtime-validation-only',
    '-e',
    'MACROFIT_API_URL=http://127.0.0.1:3007/api',
    'project-manager-nx-bff-api'
  );
  const check = `
    const assert = require('node:assert/strict');
    const sharp = require('sharp');
    (async () => {
      const origin = 'http://127.0.0.1:3000';
      let ready = false;
      for (let i = 0; i < 100; i++) {
        try { if ((await fetch(origin + '/api/macrofit/health')).status === 200) { ready = true; break; } } catch {}
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert.equal(ready, true, 'BFF -> API did not become available');
      assert.equal((await fetch(origin + '/api/macrofit/ready')).status, 503);
      const image = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#ffffff' } }).png().toBuffer();
      const form = (bytes, mime, extra) => {
        const body = new FormData();
        body.append('image', new Blob([new Uint8Array(bytes)], { type: mime }), 'plate');
        body.append('hints', 'test');
        body.append('plateTypeHint', extra || 'bowl');
        return body;
      };
      for (const path of ['/api/macrofit/analyze-plate', '/api/analyze-plate']) {
        const response = await fetch(origin + path, { method: 'POST', body: form(image, 'image/png') });
        assert.equal(response.status, 503, path + ' must expose missing provider configuration');
        assert.equal((await response.json()).items, undefined, 'No synthetic analysis may be returned');
      }
      const send = body => fetch(origin + '/api/macrofit/analyze-plate', { method: 'POST', body });
      assert.equal((await send(form(Buffer.from('text'), 'text/plain'))).status, 415);
      assert.equal((await send(form(Buffer.from('text'), 'image/jpeg'))).status, 400);
      assert.equal((await send(form(image, 'image/png', 'invalid'))).status, 400);
      assert.equal((await send(form(Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png'))).status, 413);
      assert.equal(require('fs').existsSync('/app/node_modules/next'), false, 'API image includes unrelated Next runtime');
      console.log('MACROFIT_DOCKER_RUNTIME=ok (BFF, legacy URL, 503 without simulation, validation, reduced dependencies)');
    })().catch(error => { console.error(error.message); process.exitCode = 1; });
  `;
  process.stdout.write(docker('exec', api, 'node', '-e', check));
} finally {
  for (const container of [bff, api]) {
    try {
      docker('stop', container);
    } catch {
      /* Container may already have exited with --rm. */
    }
  }
}
