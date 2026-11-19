import assert from 'node:assert/strict';
import net from 'node:net';
import { randomUUID } from 'node:crypto';

// Run against a separate backend configured with a local SMTP sink on 127.0.0.1:2525.
// No message leaves this machine. Never point the reset test at a real SMTP provider.
const base = process.env.DAYFLOW_RESET_API_URL ?? 'http://localhost:8083/api/v1';
const messages = [];
const sockets = new Set();
const smtp = net.createServer((socket) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  socket.write('220 localhost Dayflow test SMTP\r\n');
  let buffer = '',
    data = false,
    message = '';
  socket.on('data', (chunk) => {
    buffer += chunk.toString();
    while (buffer.includes('\n')) {
      const end = buffer.indexOf('\n');
      const line = buffer.slice(0, end).replace(/\r$/, '');
      buffer = buffer.slice(end + 1);
      if (data) {
        if (line === '.') {
          messages.push(message);
          message = '';
          data = false;
          socket.write('250 Message accepted\r\n');
        } else message += `${line}\n`;
      } else if (/^(EHLO|HELO)/i.test(line)) socket.write('250 localhost\r\n');
      else if (/^DATA/i.test(line)) {
        data = true;
        socket.write('354 End with a dot\r\n');
      } else if (/^QUIT/i.test(line)) socket.end('221 Bye\r\n');
      else socket.write('250 OK\r\n');
    }
  });
});
let session;
let checks = 0;
async function request(path, { method = 'POST', body, token, status = 200 } = {}) {
  const r = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const value = r.status === 204 ? null : await r.json();
  assert.equal(r.status, status, `${path}: expected ${status}, got ${r.status}`);
  checks++;
  return value;
}
try {
  await new Promise((resolve, reject) => {
    smtp.once('error', reject);
    smtp.listen(2525, '127.0.0.1', resolve);
  });
  console.log(
    'Local SMTP sink ready. Waiting for dedicated test backend on port 8083.',
  );
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      ready = (await fetch(`${base}/health`, { signal: AbortSignal.timeout(1000) })).ok;
    } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(ready, 'Dedicated reset-test backend did not start');
  const email = `reset-${randomUUID()}@dayflow.example`;
  const oldPassword = `Old-${randomUUID()}`,
    newPassword = `New-${randomUUID()}`;
  session = await request('/auth/register', {
    status: 201,
    body: {
      name: 'Disposable reset QA',
      email,
      password: oldPassword,
      timezone: 'Asia/Bangkok',
    },
  });
  await request('/auth/forgot-password', { body: { email } });
  assert.equal(messages.length, 1, 'Reset email must reach the local SMTP sink');
  const rawToken = messages[0].match(/[?&]token=([A-Za-z0-9_-]+)/)?.[1];
  assert.ok(rawToken, 'Reset link token missing from delivered email');
  assert.ok(messages[0].includes(email));
  await request('/auth/reset-password', {
    status: 204,
    body: { token: rawToken, password: newPassword },
  });
  await request('/auth/login', { status: 401, body: { email, password: oldPassword } });
  await request('/auth/login', { body: { email, password: newPassword } });
  await request('/auth/reset-password', {
    status: 422,
    body: { token: rawToken, password: oldPassword },
  });
  await request('/auth/refresh', {
    status: 401,
    body: { refreshToken: session.refreshToken },
  });
  console.log(
    `PASS: ${checks} reset API checks plus local SMTP delivery, password replacement, single-use token, and refresh revocation.`,
  );
} finally {
  try {
    if (session) {
      await request('/users/me', {
        method: 'DELETE',
        token: session.accessToken,
        status: 204,
      });
      console.log('Disposable password-reset account removed.');
    }
  } finally {
    for (const socket of sockets) socket.destroy();
    smtp.close();
  }
}
