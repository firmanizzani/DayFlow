import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const base = 'http://localhost:8080/api/v1';
const file = new URL('../.local/qa-account.json', import.meta.url);
fs.mkdirSync(new URL('../.local/', import.meta.url), { recursive: true });

if (process.argv[2] === 'clean') {
  if (!fs.existsSync(file)) process.exit(0);
  const session = JSON.parse(fs.readFileSync(file, 'utf8'));
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: session.email, password: session.password }),
  });
  if (!login.ok) throw new Error(`QA reauthentication failed: ${login.status}`);
  const activeSession = await login.json();
  const response = await fetch(`${base}/users/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${activeSession.accessToken}` },
  });
  if (response.status !== 204) throw new Error(`Cleanup failed: ${response.status}`);
  fs.unlinkSync(file);
  console.log('QA account and its data removed.');
  process.exit(0);
}

const email = `ui-${randomUUID().slice(0, 8)}@dayflow.example`;
const password = `Review-${randomUUID()}`;
const response = await fetch(`${base}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Alex Review',
    email,
    password,
    timezone: 'Asia/Bangkok',
  }),
});
if (response.status !== 201) throw new Error(`Setup failed: ${response.status}`);
const session = await response.json();
fs.writeFileSync(file, JSON.stringify({ ...session, email, password }));
console.log(JSON.stringify({ email, password }));
