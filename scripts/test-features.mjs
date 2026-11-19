import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Uses disposable accounts only; no existing user records are changed.
const base = process.env.DAYFLOW_API_URL ?? 'http://localhost:8080/api/v1';
const accounts = [];
const results = [];
let checks = 0;
async function request(path, { token, method = 'GET', body, status = 200 } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const value = response.status === 204 ? null : await response.json();
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(value)}`);
  checks++;
  return value;
}
async function test(name, run) {
  try {
    await run();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', reason: error.message });
  }
  console.log(
    `${results.at(-1).status}: ${name}${results.at(-1).reason ? ` — ${results.at(-1).reason}` : ''}`,
  );
}
try {
  for (let i = 0; i < 2; i++) {
    const email = `features-${randomUUID()}@dayflow.example`;
    const password = `Test-${randomUUID()}`;
    const session = await request('/auth/register', {
      method: 'POST',
      status: 201,
      body: {
        name: 'Disposable feature test',
        email,
        password,
        timezone: 'Asia/Bangkok',
      },
    });
    accounts.push({ ...session, email, password });
  }
  const [a, b] = accounts;
  const token = a.accessToken;
  const createTask = (title, extra = {}) =>
    request('/tasks', {
      token,
      method: 'POST',
      status: 201,
      body: { title, ...extra },
    });
  const occurrences = (from, to) =>
    request(`/recurring-occurrences?from=${from}&to=${to}`, { token });
  await test('Profile update persists; invalid timezone is rejected', async () => {
    await request('/users/me', {
      token,
      method: 'PATCH',
      body: { name: 'Feature QA', timezone: 'Asia/Jakarta' },
    });
    const saved = await request('/users/me', { token });
    assert.equal(saved.name, 'Feature QA');
    assert.equal(saved.timezone, 'Asia/Jakarta');
    await request('/users/me', {
      token,
      method: 'PATCH',
      status: 400,
      body: { timezone: 'Invalid/Timezone' },
    });
    assert.equal((await request('/users/me', { token })).timezone, 'Asia/Jakarta');
  });
  await test('Task edit, search, filters, pagination and category removal', async () => {
    const category = await request('/categories', {
      token,
      method: 'POST',
      status: 201,
      body: { name: 'Feature QA', color: '#7366F0' },
    });
    const task = await createTask('Searchable feature check', {
      categoryId: category.id,
      priority: 'HIGH',
    });
    await createTask('Unrelated low task', { priority: 'LOW' });
    await request(`/tasks/${task.id}`, {
      token,
      method: 'PATCH',
      body: {
        description: 'Updated',
        status: 'IN_PROGRESS',
        dueAt: '2026-12-01T04:00:00Z',
      },
    });
    const found = await request(
      `/tasks?search=searchable&priority=HIGH&status=IN_PROGRESS&categoryId=${category.id}&size=1`,
      { token },
    );
    assert.equal(found.content.length, 1);
    assert.equal(found.content[0].id, task.id);
    assert.equal(
      (await request(`/tasks/${task.id}`, { token })).description,
      'Updated',
    );
    await request(`/categories/${category.id}`, {
      token,
      method: 'PATCH',
      body: { name: 'Renamed QA', color: '#A99BFF' },
    });
    await request(`/categories/${category.id}`, {
      token,
      method: 'DELETE',
      status: 204,
    });
    assert.equal((await request(`/tasks/${task.id}`, { token })).categoryId, null);
    await request('/tasks', {
      token,
      method: 'POST',
      status: 422,
      body: { title: '   ' },
    });
  });
  await test('Subtask edit/delete and cross-account ownership', async () => {
    const task = await createTask('Subtask parent');
    const sub = await request(`/tasks/${task.id}/subtasks`, {
      token,
      method: 'POST',
      status: 201,
      body: { title: 'First' },
    });
    await request(`/subtasks/${sub.id}`, {
      token: b.accessToken,
      method: 'PATCH',
      status: 404,
      body: { title: 'Intrusion' },
    });
    await request(`/subtasks/${sub.id}`, {
      token,
      method: 'PATCH',
      body: { title: 'Updated', isCompleted: true },
    });
    const list = await request(`/tasks/${task.id}/subtasks`, { token });
    assert.equal(list[0].title, 'Updated');
    assert.equal(list[0].isCompleted, true);
    await request(`/subtasks/${sub.id}`, { token, method: 'DELETE', status: 204 });
    assert.equal((await request(`/tasks/${task.id}/subtasks`, { token })).length, 0);
  });
  await test('Daily recurrence interval and inclusive end date', async () => {
    const task = await createTask('Daily interval');
    const rule = await request('/recurring-rules', {
      token,
      method: 'POST',
      status: 201,
      body: {
        taskId: task.id,
        frequency: 'DAILY',
        repeatInterval: 2,
        startDate: '2027-01-01',
        endDate: '2027-01-05',
      },
    });
    const list = (await occurrences('2027-01-01', '2027-01-10')).filter(
      (o) => o.ruleId === rule.id,
    );
    assert.deepEqual(
      list.map((o) => o.occurrenceDate),
      ['2027-01-01', '2027-01-03', '2027-01-05'],
    );
  });
  await test('Weekly recurrence weekdays, edit, stop and isolation', async () => {
    const task = await createTask('Weekly weekdays');
    const rule = await request('/recurring-rules', {
      token,
      method: 'POST',
      status: 201,
      body: {
        taskId: task.id,
        frequency: 'WEEKLY',
        repeatInterval: 1,
        weekdays: [1, 3],
        startDate: '2027-01-04',
        endDate: '2027-01-17',
      },
    });
    let list = (await occurrences('2027-01-04', '2027-01-17')).filter(
      (o) => o.ruleId === rule.id,
    );
    assert.deepEqual(
      list.map((o) => o.occurrenceDate),
      ['2027-01-04', '2027-01-06', '2027-01-11', '2027-01-13'],
    );
    await request(`/recurring-occurrences/${list[0].id}`, {
      token: b.accessToken,
      method: 'PATCH',
      status: 404,
      body: { status: 'COMPLETED' },
    });
    await request(`/recurring-rules/${rule.id}`, {
      token,
      method: 'PATCH',
      body: { weekdays: [5] },
    });
    list = (await occurrences('2027-01-04', '2027-01-17')).filter(
      (o) => o.ruleId === rule.id,
    );
    assert.deepEqual(
      list.map((o) => o.occurrenceDate),
      ['2027-01-08', '2027-01-15'],
    );
    await request(`/recurring-rules/${rule.id}`, {
      token,
      method: 'DELETE',
      status: 204,
    });
    assert.equal(
      (await occurrences('2027-01-04', '2027-01-17')).filter(
        (o) => o.ruleId === rule.id,
      ).length,
      0,
    );
  });
  await test('Monthly recurrence clamps day 31 to month end', async () => {
    const task = await createTask('Monthly end');
    const rule = await request('/recurring-rules', {
      token,
      method: 'POST',
      status: 201,
      body: {
        taskId: task.id,
        frequency: 'MONTHLY',
        repeatInterval: 1,
        startDate: '2027-01-31',
        endDate: '2027-03-31',
      },
    });
    const list = (await occurrences('2027-01-01', '2027-03-31')).filter(
      (o) => o.ruleId === rule.id,
    );
    assert.deepEqual(
      list.map((o) => o.occurrenceDate),
      ['2027-01-31', '2027-02-28', '2027-03-31'],
    );
    const again = (await occurrences('2027-01-01', '2027-03-31')).filter(
      (o) => o.ruleId === rule.id,
    );
    assert.deepEqual(
      again.map((o) => o.id),
      list.map((o) => o.id),
    );
  });
  await test('Invalid recurrence ranges and weekdays rejected', async () => {
    const task = await createTask('Invalid recurrence');
    await request('/recurring-rules', {
      token,
      method: 'POST',
      status: 422,
      body: {
        taskId: task.id,
        frequency: 'WEEKLY',
        repeatInterval: 1,
        startDate: '2027-01-01',
        weekdays: [0, 8],
      },
    });
    await request('/recurring-occurrences?from=2027-01-01&to=2027-05-01', {
      token,
      status: 422,
    });
  });
  await test('Focus invalid elapsed duration is rejected', async () => {
    await request('/focus-sessions', {
      token,
      method: 'POST',
      status: 422,
      body: {
        clientId: randomUUID(),
        mode: 'FOCUS',
        startedAt: '2026-11-18T01:00:00Z',
        endedAt: '2026-11-18T01:01:00Z',
        durationSeconds: 120,
        completed: true,
      },
    });
  });
  await test('All preferences persist and invalid reminder rejected', async () => {
    const body = {
      theme: 'LIGHT',
      focusMinutes: 35,
      shortBreakMinutes: 7,
      longBreakMinutes: 20,
      defaultReminder: 30,
      notificationsEnabled: true,
    };
    await request('/users/me/preferences', { token, method: 'PATCH', body });
    const saved = await request('/users/me/preferences', { token });
    for (const [key, value] of Object.entries(body))
      assert.equal(saved[key], value, key);
    await request('/users/me/preferences', {
      token,
      method: 'PATCH',
      status: 422,
      body: { defaultReminder: 17 },
    });
  });
  await test('Password change checks old password and revokes refresh sessions', async () => {
    await request('/users/me/password', {
      token,
      method: 'POST',
      status: 401,
      body: { currentPassword: 'Incorrect123', newPassword: 'New-Feature-Password123' },
    });
    const newPassword = `New-${randomUUID()}`;
    await request('/users/me/password', {
      token,
      method: 'POST',
      status: 204,
      body: { currentPassword: a.password, newPassword },
    });
    await request('/auth/login', {
      method: 'POST',
      status: 401,
      body: { email: a.email, password: a.password },
    });
    await request('/auth/login', {
      method: 'POST',
      body: { email: a.email, password: newPassword },
    });
    await request('/auth/refresh', {
      method: 'POST',
      status: 401,
      body: { refreshToken: a.refreshToken },
    });
  });
  await test('Unknown reset email returns generic response; invalid reset token rejected', async () => {
    const value = await request('/auth/forgot-password', {
      method: 'POST',
      body: { email: `missing-${randomUUID()}@dayflow.example` },
    });
    assert.match(value.message, /If the account exists/);
    await request('/auth/reset-password', {
      method: 'POST',
      status: 422,
      body: { token: randomUUID(), password: 'New-Password123' },
    });
  });
} finally {
  const cleanupErrors = [];
  for (const account of accounts) {
    try {
      await request('/users/me', {
        token: account.accessToken,
        method: 'DELETE',
        status: 204,
      });
      await request('/users/me', { token: account.accessToken, status: 404 });
    } catch (error) {
      cleanupErrors.push(error.message);
    }
  }
  console.log(
    JSON.stringify(
      {
        checks,
        results,
        cleanup: cleanupErrors.length
          ? cleanupErrors
          : 'All disposable accounts removed',
      },
      null,
      2,
    ),
  );
  if (cleanupErrors.length || results.some((r) => r.status === 'FAIL'))
    process.exitCode = 1;
}
