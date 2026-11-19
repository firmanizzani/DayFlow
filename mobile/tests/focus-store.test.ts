import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const source = fs.readFileSync(
  new URL('../src/store/focus.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadTimer(storage = new Map<string, string>()) {
  let now = Date.parse('2026-11-19T00:00:00Z');
  class Clock extends Date {
    constructor(value?: string | number) {
      super(value ?? now);
    }
    static now() {
      return now;
    }
  }
  const module = { exports: {} as any };
  new Function('require', 'module', 'exports', 'Date', compiled)(
    (id: string) => {
      if (id === 'expo-crypto') return { randomUUID };
      if (id === '@/services/storage')
        return {
          secureStorage: {
            get: async (key: string) => storage.get(key) ?? null,
            set: async (key: string, value: string) => {
              storage.set(key, value);
            },
            remove: async (key: string) => {
              storage.delete(key);
            },
          },
        };
      return require(id);
    },
    module,
    module.exports,
    Clock,
  );
  return {
    state: () => module.exports.useFocus.getState(),
    advance: (seconds: number) => {
      now += seconds * 1000;
    },
    storage,
  };
}

test('Focus pause/resume excludes paused time and preserves idempotency key', () => {
  const timer = loadTimer();
  timer.state().start('1', '2', 'FOCUS', 2);
  const clientId = timer.state().timer.clientId;
  timer.advance(30);
  timer.state().pause();
  assert.equal(timer.state().timer.remaining, 90);
  timer.advance(60);
  timer.state().resume();
  timer.advance(20);
  timer.state().finish(false);
  assert.equal(timer.state().timer.remaining, 70);
  assert.equal(timer.state().timer.clientId, clientId);
  assert.equal(timer.state().timer.completed, false);
});

test('Focus recovery restores saved deadline after a simulated process restart', async () => {
  const first = loadTimer();
  first.state().start('1', '2', 'FOCUS', 1);
  const recovered = loadTimer(first.storage);
  recovered.advance(75);
  await recovered.state().hydrate();
  assert.equal(recovered.state().timer.clientId, first.state().timer.clientId);
  assert.equal(recovered.state().timer.deadline, first.state().timer.deadline);
  recovered.state().finish(true);
  assert.equal(recovered.state().timer.remaining, 0);
  assert.equal(recovered.state().timer.endedAt, '2026-11-19T00:01:00.000Z');
});

test('Finishing twice preserves the original duration and completion state', () => {
  const timer = loadTimer();
  timer.state().start('1', null, 'FOCUS', 1);
  timer.advance(15);
  timer.state().finish(false);
  const finished = { ...timer.state().timer };
  timer.advance(30);
  timer.state().finish(true);
  assert.deepEqual(timer.state().timer, finished);
});

test('Break modes persist and clearing removes recoverable timer state', async () => {
  for (const mode of ['SHORT_BREAK', 'LONG_BREAK']) {
    const timer = loadTimer();
    timer.state().start('1', null, mode, 5);
    const recovered = loadTimer(timer.storage);
    await recovered.state().hydrate();
    assert.equal(recovered.state().timer.mode, mode);
    recovered.state().clear();
    assert.equal(recovered.storage.has('dayflow.focus'), false);
    assert.equal(recovered.state().timer, null);
  }
});
