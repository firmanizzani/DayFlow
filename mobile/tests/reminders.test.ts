import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const compiled = ts.transpileModule(
  fs.readFileSync(
    new URL('../src/services/notifications.tsx', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText;

async function reconcile({
  plans = [],
  tasks = [],
  existing = [],
  enabled = true,
  granted = true,
  platform = 'ios',
}: any = {}) {
  const effects: Function[] = [];
  const scheduled: any[] = [];
  const cancelled: string[] = [];
  let cleared = false;
  const notifications = {
    setNotificationHandler() {},
    getPermissionsAsync: async () => ({ granted }),
    requestPermissionsAsync: async () => ({ granted }),
    cancelAllScheduledNotificationsAsync: async () => {
      cleared = true;
    },
    addNotificationResponseReceivedListener: () => ({ remove() {} }),
    getAllScheduledNotificationsAsync: async () => existing,
    cancelScheduledNotificationAsync: async (id: string) => {
      cancelled.push(id);
    },
    scheduleNotificationAsync: async (value: unknown) => {
      scheduled.push(value);
    },
    SchedulableTriggerInputTypes: { DATE: 'date' },
  };
  const module = { exports: {} as any };
  new Function('require', 'module', 'exports', compiled)(
    (id: string) => {
      if (id === 'react')
        return {
          useEffect: (fn: Function) => {
            effects.push(fn);
          },
        };
      if (id === 'react-native')
        return {
          Platform: { OS: platform },
          AppState: { addEventListener: () => ({ remove() {} }) },
        };
      if (id === 'expo-router') return { router: { push() {} } };
      if (id === 'expo-notifications') return notifications;
      if (id === '@tanstack/react-query')
        return { useQuery: () => ({ data: { plans, tasks }, refetch() {} }) };
      if (id === '@/theme')
        return { usePreferences: () => ({ data: { notificationsEnabled: enabled } }) };
      if (id === './api') return {};
      if (id === '@/utils/date') return {};
      throw new Error(`Unexpected reminder dependency: ${id}`);
    },
    module,
    module.exports,
  );
  module.exports.NotificationReconciler();
  effects.forEach((effect) => effect());
  // The real reconciler intentionally runs asynchronously from the React effect.
  await new Promise((resolve) => setImmediate(resolve));
  return { scheduled, cancelled, cleared };
}

const future = (minutes: number) =>
  new Date(Date.now() + minutes * 60000).toISOString();
const plan = (id: string, minutes: number, extra = {}) => ({
  id,
  taskId: 'task',
  startAt: future(minutes),
  status: 'PLANNED',
  reminderMinutesBefore: 5,
  ...extra,
});

test('Reminders select the nearest 60 eligible sessions in chronological order', async () => {
  const plans = Array.from({ length: 65 }, (_, i) =>
    plan(String(i + 1), 10 + i),
  ).reverse();
  plans.push(
    plan('missed', -10),
    plan('cancelled', 20, { status: 'CANCELLED' }),
    plan('disabled', 20, { reminderMinutesBefore: null }),
    plan('complete', 20, { taskId: 'done' }),
  );
  const result = await reconcile({
    plans,
    tasks: [
      { id: 'task', status: 'TODO', title: 'Task' },
      { id: 'done', status: 'COMPLETED' },
    ],
  });
  assert.equal(result.scheduled.length, 60);
  assert.equal(result.scheduled[0].identifier, 'plan-1');
  assert.equal(result.scheduled[59].identifier, 'plan-60');
  assert.equal(result.scheduled[0].content.data.taskId, 'task');
});

test('Reminder permission denial and disabled preferences clear scheduled notifications', async () => {
  for (const options of [{ granted: false }, { enabled: false }]) {
    const result = await reconcile(options);
    assert.equal(result.cleared, true);
    assert.equal(result.scheduled.length, 0);
  }
});

test('Reconciliation cancels stale reminders and avoids scheduling unchanged ones twice', async () => {
  const upcoming = plan('same', 30);
  const at = new Date(upcoming.startAt).getTime() - 5 * 60000;
  const result = await reconcile({
    plans: [upcoming],
    tasks: [{ id: 'task', status: 'TODO' }],
    existing: [
      { identifier: 'plan-same', content: { data: { at } } },
      { identifier: 'plan-deleted', content: { data: { at } } },
    ],
  });
  assert.deepEqual(result.cancelled, ['plan-deleted']);
  assert.equal(result.scheduled.length, 0);
});

test('Web preview does not schedule or cancel native reminders', async () => {
  const result = await reconcile({
    platform: 'web',
    plans: [plan('web', 30)],
    tasks: [{ id: 'task', status: 'TODO' }],
  });
  assert.equal(result.scheduled.length, 0);
  assert.equal(result.cancelled.length, 0);
  assert.equal(result.cleared, false);
});
