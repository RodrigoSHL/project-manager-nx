// Internal API smoke test. Creates one temporary project and removes it in finally.
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const base = (process.env.PROJECT_API_URL || 'http://127.0.0.1:3002/api').replace(/\/$/, '');
const key = `V${randomBytes(4).toString('hex').toUpperCase()}`;
let projectId;

async function request(path, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, {
    method, signal: AbortSignal.timeout(15000),
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`${method} ${path}: HTTP ${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : undefined;
}

(async () => {
  try {
    const project = await request('/projects', 'POST', {
      name: 'Validación temporal de contador de tickets', key,
      businessUnit: 'Validación técnica', description: 'Fixture temporal; se elimina al terminar la prueba.',
    });
    projectId = project.id;
    const path = `/projects/${projectId}/tickets`;
    const first = await request(path, 'POST', { title: 'Primero' });
    assert.equal(first.key, `${key}-1`);
    await request(`${path}/${first.id}`, 'DELETE');
    const concurrent = await Promise.allSettled(Array.from({ length: 4 }, (_, i) =>
      request(path, 'POST', { title: `Simultáneo ${i}` }),
    ));
    const failures = concurrent.filter(result => result.status === 'rejected');
    assert.equal(failures.length, 0, 'All concurrent requests must succeed');
    const tickets = concurrent.map(result => result.value);
    assert.deepEqual(tickets.map(ticket => Number(ticket.key.split('-').pop())).sort((a, b) => a - b), [2, 3, 4, 5]);
    const edited = await request(`${path}/${tickets[0].id}`, 'PATCH', {
      description: 'Descripción actualizada', acceptanceCriteria: 'Criterios guardados',
    });
    assert.equal(edited.description, 'Descripción actualizada');
    assert.equal(edited.acceptanceCriteria, 'Criterios guardados');
    const support = await request(path, 'POST', { title: 'Soporte', type: 'support' });
    assert.equal(support.key, `${key}-6`);
    const visible = await request(`/projects/${projectId}`);
    assert.equal(Object.hasOwn(visible, 'lastTicketNumber'), false);
    console.log('TICKET_COUNTER_API=ok (creation, deletion, concurrency, editing, support)');
  } finally {
    if (projectId) {
      await request(`/projects/${projectId}`, 'DELETE');
      console.log('TEMPORARY_PROJECT_CLEANUP=ok');
    }
  }
})().catch(error => {
  console.error(error.message);
  if (projectId) console.error(`Validation project ID (check cleanup if needed): ${projectId}`);
  process.exitCode = 1;
});
