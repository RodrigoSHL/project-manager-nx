import { execFileSync } from 'node:child_process';

const docker = (...args) =>
  execFileSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
for (const app of [
  'user-api',
  'project-api',
  'travel-planner-api',
  'files-api',
  'inspection-api',
]) {
  // TypeORM loads pg dynamically; a successful Webpack build alone cannot prove it is installed.
  const code =
    'new (require("typeorm").DataSource)({type:"postgres"}); ' +
    (app === 'user-api'
      ? 'require("bcrypt").hashSync("validation-only", 4); '
      : '') +
    'console.log("PostgreSQL runtime driver: ok");';
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
      code
    )}`
  );
}
const pdf =
  'const doc = new (require("pdfkit"))(); doc.on("data",()=>{}); doc.on("end",()=>console.log("PDF fonts: ok")); doc.text("Runtime validation").end();';
process.stdout.write(
  `bff-api: ${docker(
    'run',
    '--rm',
    '--network',
    'none',
    '--entrypoint',
    'node',
    'project-manager-nx-bff-api',
    '-e',
    pdf
  )}`
);
const mailer = `
  const {spawn} = require('node:child_process');
  const assert = require('node:assert/strict');
  const server = spawn(process.execPath, ['main.js'], {stdio:'ignore'});
  (async()=>{
    try {
      let status;
      for(let i=0;i<100;i++){
        try{status=(await fetch('http://127.0.0.1:3006/api/health')).status;if(status===200)break;}catch{}
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      assert.equal(status,200);
      assert.equal((await fetch('http://127.0.0.1:3006/api/emails',{
        method:'POST',headers:{'content-type':'application/json'},body:'{}'
      })).status,401);
      console.log('production health + token guard: ok');
    }finally{server.kill('SIGTERM');}
  })().catch(error=>{console.error(error.message);process.exitCode=1;});
`;
process.stdout.write(
  `mailer-api: ${docker(
    'run',
    '--rm',
    '--network',
    'none',
    '-e',
    'MAILER_SERVICE_TOKEN=runtime-validation-token-not-a-real-secret',
    '-e',
    'MAILER_PROVIDER=resend',
    '-e',
    'RESEND_API_KEY=runtime-validation-only',
    '-e',
    'MAILER_FROM_EMAIL=runtime@example.invalid',
    '--entrypoint',
    'node',
    'project-manager-nx-mailer-api',
    '-e',
    mailer
  )}`
);
