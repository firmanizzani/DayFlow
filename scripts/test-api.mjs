import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = process.env.DAYFLOW_API_URL ?? 'http://localhost:8080/api/v1';
const accounts = [];
let checks = 0;

async function request(path, { token, method = 'GET', body, expected = 200 } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = response.status === 204 ? null : await response.json();
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${JSON.stringify(result)}`,
  );
  checks++;
  return result;
}

try {
  await request('/health');
  await request('/tasks', { expected: 401 });
  for (const name of ['Integration A', 'Integration B']) {
    const email = `test-${randomUUID()}@dayflow.example`;
    const password = `Test-${randomUUID()}`;
    const session = await request('/auth/register', {
      method: 'POST',
      expected: 201,
      body: { name, email, password, timezone: 'Asia/Bangkok' },
    });
    accounts.push({ ...session, email, password });
    assert.equal(session.user.passwordHash, undefined);
  }
  const [a, b] = accounts;
  const token = a.accessToken;
  const category = await request('/categories', {
    token,
    method: 'POST',
    expected: 201,
    body: { name: 'Learning', color: '#7366F0' },
  });
  await request('/categories', {
    token,
    method: 'POST',
    expected: 409,
    body: { name: 'learning', color: '#7366F0' },
  });
  await request('/tasks', {
    token: b.accessToken,
    method: 'POST',
    expected: 404,
    body: { title: 'Invalid ownership', categoryId: category.id },
  });
  const task = await request('/tasks', {
    token,
    method: 'POST',
    expected: 201,
    body: { title: 'End-to-end task', categoryId: category.id, priority: 'HIGH' },
  });
  assert.equal(task.dueAt, null);
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    await request(`/tasks/${task.id}`, {
      token: b.accessToken,
      method,
      expected: 404,
      ...(method === 'PATCH' ? { body: { title: 'Unauthorized edit' } } : {}),
    });
  }
  const sub = await request(`/tasks/${task.id}/subtasks`, {
    token,
    method: 'POST',
    expected: 201,
    body: { title: 'Small step' },
  });
  await request(`/subtasks/${sub.id}`, {
    token,
    method: 'PATCH',
    body: { isCompleted: true },
  });
  const unchanged = await request(`/tasks/${task.id}`, { token });
  assert.equal(unchanged.status, 'TODO', 'Subtasks must not complete the parent task');
  const withProgress = await request('/tasks', { token });
  assert.equal(
    withProgress.content.find((item) => item.id === task.id).totalSubtasks,
    1,
  );
  assert.equal(
    withProgress.content.find((item) => item.id === task.id).completedSubtasks,
    1,
  );
  const start = new Date(Date.now() + 86400000);
  const end = new Date(start.getTime() + 3600000);
  const body = {
    taskId: task.id,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    reminderMinutesBefore: 15,
  };
  const plan = await request('/planning-sessions', {
    token,
    method: 'POST',
    expected: 201,
    body,
  });
  const conflict = await request('/planning-sessions', {
    token,
    method: 'POST',
    expected: 409,
    body,
  });
  assert.equal(conflict.code, 'SCHEDULE_CONFLICT');
  assert.equal(conflict.details[0].id, plan.id);
  const overlapping = await request('/planning-sessions', {
    token,
    method: 'POST',
    expected: 201,
    body: { ...body, allowConflict: true },
  });
  await request(`/planning-sessions/${overlapping.id}`, {
    token,
    method: 'DELETE',
    expected: 204,
  });
  await request('/planning-sessions', {
    token,
    method: 'POST',
    expected: 422,
    body: { ...body, endAt: start.toISOString() },
  });
  const moved = await request(`/planning-sessions/${plan.id}/reschedule`, {
    token,
    method: 'POST',
    body: {
      startAt: new Date(end.getTime() + 3600000).toISOString(),
      endAt: new Date(end.getTime() + 7200000).toISOString(),
      reminderMinutesBefore: 5,
    },
  });
  assert.equal(moved.previousSessionId, plan.id);
  const from = new Date(Date.now() - 86400000).toISOString();
  const to = new Date(Date.now() + 4 * 86400000).toISOString();
  const range = new URLSearchParams({ from, to });
  const agenda = await request(`/planning-sessions?${range}`, { token });
  assert.equal(agenda.find((item) => item.id === plan.id).status, 'RESCHEDULED');
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(
    new Date(),
  );
  const dashboard = await request(`/dashboard/today?date=${date}`, { token });
  assert.ok(dashboard.unscheduledTasks.some((item) => item.id === task.id));
  await request(`/tasks/${task.id}/status`, {
    token,
    method: 'PATCH',
    body: { status: 'COMPLETED' },
  });
  const overview = await request(`/insights/overview?${range}`, { token });
  assert.equal(overview.completedTasks, 1);
  assert.equal(
    overview.plannedTasks,
    1,
    'Multiple sessions must not double-count tasks',
  );
  const routine = await request('/tasks', {
    token,
    method: 'POST',
    expected: 201,
    body: { title: 'Daily routine' },
  });
  const rule = await request('/recurring-rules', {
    token,
    method: 'POST',
    expected: 201,
    body: {
      taskId: routine.id,
      frequency: 'DAILY',
      repeatInterval: 1,
      startDate: date,
    },
  });
  const occurrenceQuery = `/recurring-occurrences?from=${date}&to=${date}`;
  const occurrences = await request(occurrenceQuery, { token });
  assert.equal(occurrences.length, 1);
  await request(`/recurring-occurrences/${occurrences[0].id}`, {
    token,
    method: 'PATCH',
    body: { status: 'COMPLETED', title: 'Only today' },
  });
  const same = await request(occurrenceQuery, { token });
  assert.equal(same[0].id, occurrences[0].id);
  assert.equal(same[0].status, 'COMPLETED');
  assert.equal((await request(`/tasks/${routine.id}`, { token })).status, 'TODO');
  await request(`/recurring-rules/${rule.id}`, {
    token: b.accessToken,
    method: 'DELETE',
    expected: 404,
  });
  const focusBody = {
    clientId: randomUUID(),
    taskId: task.id,
    mode: 'FOCUS',
    startedAt: new Date(Date.now() - 120000).toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds: 120,
    completed: true,
  };
  const focus = await request('/focus-sessions', {
    token,
    method: 'POST',
    expected: 201,
    body: focusBody,
  });
  const duplicate = await request('/focus-sessions', {
    token,
    method: 'POST',
    expected: 201,
    body: focusBody,
  });
  assert.equal(duplicate.id, focus.id);
  const summary = await request(`/focus-sessions/summary?${range}`, { token });
  assert.equal(summary.totalSeconds, 120);
  await request('/users/me/preferences', {
    token,
    method: 'PATCH',
    body: { theme: 'DARK', focusMinutes: 30 },
  });
  assert.equal((await request('/users/me/preferences', { token })).theme, 'DARK');
  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: a.email, password: a.password },
  });
  const rotated = await request('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: login.refreshToken },
  });
  await request('/auth/refresh', {
    method: 'POST',
    expected: 401,
    body: { refreshToken: login.refreshToken },
  });
  await request('/auth/logout', {
    method: 'POST',
    expected: 204,
    body: { refreshToken: rotated.refreshToken },
  });
  await request('/auth/refresh', {
    method: 'POST',
    expected: 401,
    body: { refreshToken: rotated.refreshToken },
  });
  await request(`/tasks/${task.id}`, { token, method: 'DELETE', expected: 204 });
  assert.equal((await request(`/planning-sessions?${range}`, { token })).length, 0);
  console.log(
    `PASS: ${checks} API checks against PostgreSQL. Test accounts will now be deleted.`,
  );
} finally {
  for (const account of accounts) {
    await request('/users/me', {
      token: account.accessToken,
      method: 'DELETE',
      expected: 204,
    });
  }
  console.log('Test accounts and related data removed.');
}
