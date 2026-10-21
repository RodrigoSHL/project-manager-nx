import { execFileSync } from 'node:child_process';

const docker = (...args) =>
  execFileSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
for (const app of [
  'project-web',
  'jira-web',
  'travel-planner-app',
  'atomdev-landing',
]) {
  const check = String.raw`
    const { spawn } = require('node:child_process');
    const assert = require('node:assert/strict');
    const server = spawn(process.execPath, ['server.js'], { stdio: 'ignore' });
    (async () => {
      try {
        let response;
        for (let i = 0; i < 100; i++) {
          try { response = await fetch('http://127.0.0.1:3000/'); if(response.ok) break; } catch {}
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert.equal(response?.status, 200, 'standalone server root');
        const html = await response.text();
        const asset = html.match(/src="(\/_next\/static\/[^" ]+\.js[^" ]*)"/);
        assert.ok(asset, 'Next static script must be present');
        assert.equal((await fetch('http://127.0.0.1:3000' + asset[1].replaceAll('&amp;', '&'))).status, 200, 'static asset');
        console.log('standalone root + static assets: ok');
      } finally { server.kill('SIGTERM'); }
    })().catch(error => { console.error(error.message); process.exitCode = 1; });
  `;
  process.stdout.write(
    `${app}: ${docker(
      'run',
      '--rm',
      '--network',
      'none',
      '--entrypoint',
      'node',
      `project-manager-nx-${app}`,
      '-e',
      check
    )}`
  );
}
for (const app of ['macro-fit-web', 'inspection-web']) {
  const check =
    'nginx -g "daemon off;" >/tmp/web-check.log 2>&1 & web_pid=$!; sleep 1; ' +
    'wget -q -O /dev/null http://127.0.0.1/ && wget -q -O /dev/null http://127.0.0.1/health ' +
    '&& wget -q -O /dev/null http://127.0.0.1/example/deep/path; result=$?; kill "$web_pid"; exit "$result"';
  docker(
    'run',
    '--rm',
    '--network',
    'none',
    '--entrypoint',
    'sh',
    `project-manager-nx-${app}`,
    '-c',
    check
  );
  console.log(`${app}: Nginx root + health + SPA: ok`);
}
