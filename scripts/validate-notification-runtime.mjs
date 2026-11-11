import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

// Isolated, disposable resources: never connects to the platform databases.
const suffix = randomUUID().slice(0, 8);
const network = `notification-validation-${suffix}`;
const postgres = `${network}-postgres`;
const api = `${network}-api`;
const image =
  process.env.NOTIFICATION_VALIDATION_IMAGE ||
  'project-manager-nx-notification-api';
const docker = (...args) =>
  execFileSync('docker', args, {
    encoding: 'utf8',
    timeout: 120000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
const logs = (container) => {
  const result = spawnSync('docker', ['logs', '--tail', '50', container], {
    encoding: 'utf8',
  });
  return result.stdout + result.stderr;
};
const token = 'notification-runtime-validation-only-token';
const containers = [];
let createdNetwork = false;

function waitHealthy() {
  docker(
    'exec',
    api,
    'node',
    '-e',
    `
    (async()=>{
      for(let attempt=0;attempt<200;attempt++){
        try{if((await fetch('http://127.0.0.1:3008/api/health')).status===200)return;}catch{}
        await new Promise(resolve=>setTimeout(resolve,200));
      }
      process.exit(1);
    })();
  `
  );
}

async function verifyNotifications() {
  const assert = require('node:assert/strict');
  const base = 'http://127.0.0.1:3008/api';
  const token = process.env.NOTIFICATION_SERVICE_TOKEN;
  const scope = {
    application: 'jira',
    projectId: 'project-1',
    recipientId: 'user-1',
  };
  const query = (scope) => new URLSearchParams(scope).toString();
  const call = async (path, method = 'GET', body, authenticated = true) => {
    const response = await fetch(`${base}/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const json = await response.json();
    return { status: response.status, body: json };
  };
  assert.equal((await call('health', 'GET', undefined, false)).status, 200);
  assert.equal(
    (await call('notifications', 'GET', undefined, false)).status,
    401
  );
  assert.equal((await call('notifications')).status, 400);
  const dto = {
    ...scope,
    title: 'Nueva mención',
    body: 'Te mencionaron',
    eventKey: 'comment-1/user-1',
    occurredAt: '2026-10-01T12:00:00.000Z',
    metadata: { ticketId: 'ticket-1' },
  };
  const created = await Promise.all(
    Array.from({ length: 5 }, () => call('notifications', 'POST', dto))
  );
  created.forEach((result) => assert.equal(result.status, 201));
  const id = created[0].body.id;
  assert.equal(new Set(created.map((result) => result.body.id)).size, 1);
  assert.equal(created[0].body.readAt, null);
  assert.equal(created[0].body.type, 'info');
  assert.equal(created[0].body.createdAt, dto.occurredAt);
  // The same event key is independent for other applications/projects/recipients.
  for (const alternative of [
    { application: 'inspection' },
    { projectId: 'project-2' },
    { recipientId: 'user-2' },
  ]) {
    const result = await call('notifications', 'POST', {
      ...dto,
      ...alternative,
    });
    assert.equal(result.status, 201);
    assert.notEqual(result.body.id, id);
    assert.equal(
      (
        await call(
          `notifications/${id}/read?${query({ ...scope, ...alternative })}`,
          'PATCH'
        )
      ).status,
      404
    );
  }
  const inbox = await call(`notifications?${query(scope)}&status=unread`);
  assert.equal(inbox.body.total, 1);
  assert.deepEqual(
    inbox.body.items.map((item) => item.id),
    [id]
  );
  assert.equal(
    (await call(`notifications/unread-count?${query(scope)}`)).body.count,
    1
  );
  const scopeAcrossProjects = {
    application: scope.application,
    recipientId: scope.recipientId,
    projectIds: [scope.projectId, 'project-2'],
  };
  const history = await call(
    'notifications/inbox',
    'POST',
    scopeAcrossProjects
  );
  assert.equal(history.status, 200);
  assert.equal(history.body.total, 2);
  assert.equal(history.body.unreadCount, 2);
  assert.ok(
    history.body.items.every(
      (item) =>
        item.recipientId === scope.recipientId &&
        item.application === scope.application
    )
  );
  const scopedHistory = await call('notifications/inbox', 'POST', {
    ...scopeAcrossProjects,
    projectIds: [scope.projectId],
  });
  assert.deepEqual(
    scopedHistory.body.items.map((item) => item.id),
    [id]
  );
  const emptyHistory = await call('notifications/inbox', 'POST', {
    ...scopeAcrossProjects,
    projectIds: [],
  });
  assert.equal(emptyHistory.body.total, 0);
  assert.equal(
    (await call('notifications/inbox', 'POST', scopeAcrossProjects, false))
      .status,
    401
  );
  const read = await call(`notifications/${id}/read?${query(scope)}`, 'PATCH');
  assert.equal(read.status, 200);
  assert.ok(read.body.readAt);
  assert.equal(
    (await call(`notifications/${id}/read?${query(scope)}`, 'PATCH')).body
      .readAt,
    read.body.readAt
  );
  assert.equal(
    (await call(`notifications/unread-count?${query(scope)}`)).body.count,
    0
  );
  assert.equal(
    (await call(`notifications?${query(scope)}&status=unread`)).body.total,
    0
  );
  assert.equal(
    (await call(`notifications?${query(scope)}&status=read`)).body.total,
    1
  );
  assert.equal(
    (await call('notifications', 'POST', { ...dto, eventKey: undefined }))
      .status,
    201
  );
  assert.equal(
    (await call('notifications', 'POST', { ...dto, eventKey: undefined }))
      .status,
    201
  );
  const page = await call(`notifications?${query(scope)}&page=2&limit=1`);
  assert.equal(page.body.total, 3);
  assert.equal(page.body.items.length, 1);
  assert.equal(
    (await call(`notifications?${query(scope)}&limit=101`)).status,
    400
  );
  assert.equal(
    (
      await call('notifications', 'POST', {
        ...dto,
        title: ' ',
        eventKey: 'bad',
      })
    ).status,
    400
  );
  console.log(
    'HTTP health, authentication, persistence, concurrent deduplication, scope isolation, pagination and read state: ok'
  );
}

try {
  docker('network', 'create', network);
  createdNetwork = true;
  docker(
    'create',
    '--name',
    postgres,
    '--network',
    network,
    '--tmpfs',
    '/var/lib/postgresql/data',
    '-e',
    'POSTGRES_USER=notification_validation',
    '-e',
    'POSTGRES_PASSWORD=runtime-validation-only',
    '-e',
    'POSTGRES_DB=validation_root',
    '-e',
    'NOTIFICATION_DB_NAME=notification_db',
    'postgres:15-alpine'
  );
  containers.push(postgres);
  // Copy rather than bind-mount: Docker Desktop may forbid executing host mounts.
  docker(
    'cp',
    resolve('docker/init-db.sh'),
    `${postgres}:/docker-entrypoint-initdb.d/init-db.sh`
  );
  docker('start', postgres);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (
      docker('inspect', '--format', '{{.State.Status}}', postgres) === 'exited'
    )
      throw new Error('PostgreSQL initialization failed');
    try {
      ready =
        docker(
          'exec',
          postgres,
          'psql',
          '-U',
          'notification_validation',
          '-d',
          'notification_db',
          '-tAc',
          'SELECT 1'
        ) === '1';
      if (ready) break;
    } catch {
      /* initialization may still be running */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(
    ready,
    'PostgreSQL must create notification_db before starting the API'
  );
  docker(
    'run',
    '-d',
    '--name',
    api,
    '--network',
    network,
    '-e',
    `NOTIFICATION_DB_HOST=${postgres}`,
    '-e',
    'NOTIFICATION_DB_NAME=notification_db',
    '-e',
    'NOTIFICATION_DB_USERNAME=notification_validation',
    '-e',
    'NOTIFICATION_DB_PASSWORD=runtime-validation-only',
    '-e',
    `NOTIFICATION_SERVICE_TOKEN=${token}`,
    '-e',
    'NOTIFICATION_MIGRATIONS_RUN=true',
    image
  );
  containers.push(api);
  waitHealthy();
  docker(
    'exec',
    api,
    'node',
    '-e',
    `(${verifyNotifications.toString()})().catch(error=>{console.error(error);process.exit(1)});`
  );
  console.log('Notification HTTP + PostgreSQL flow: ok');
  docker('restart', api);
  waitHealthy();
  const state = docker(
    'exec',
    postgres,
    'psql',
    '-U',
    'notification_validation',
    '-d',
    'notification_db',
    '-tAc',
    'SELECT (SELECT count(*) FROM migrations), (SELECT count(*) FROM notifications), (SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname=current_database())'
  );
  assert.equal(state, '2|6|notification_validation');
  const ports = JSON.parse(
    docker('inspect', '--format', '{{json .HostConfig.PortBindings}}', api)
  );
  assert.ok(!ports || Object.keys(ports).length === 0);
  console.log(
    'Database initialization/owner, migration restart, durable records and no published API ports: ok'
  );
} catch (error) {
  for (const container of containers) {
    try {
      process.stderr.write(
        docker('inspect', '--format', '{{json .State}}', container) + '\n'
      );
      process.stderr.write(logs(container) + '\n');
    } catch {
      /* diagnostics only */
    }
  }

  throw error;
} finally {
  for (const container of containers.reverse()) docker('rm', '-f', container);
  if (createdNetwork) docker('network', 'rm', network);
}
