import test from 'node:test';
import assert from 'node:assert/strict';
import { authSchema } from '../src/features/auth/schema.ts';

const valid = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'SecureExample123',
  confirm: 'SecureExample123',
};

test('Registration validates identity and password confirmation', () => {
  const schema = authSchema(true);
  assert.equal(schema.safeParse(valid).success, true);
  assert.equal(schema.safeParse({ ...valid, name: '  ' }).success, false);
  assert.equal(schema.safeParse({ ...valid, confirm: 'different' }).success, false);
});

test('Authentication rejects invalid email and short passwords', () => {
  const schema = authSchema(false);
  assert.equal(schema.safeParse({ ...valid, email: 'invalid' }).success, false);
  assert.equal(schema.safeParse({ ...valid, password: 'short' }).success, false);
  assert.equal(schema.safeParse({ ...valid, name: '', confirm: '' }).success, true);
});

test('Password validation respects bcrypt UTF-8 byte limit', () => {
  const password = '漢'.repeat(25);
  assert.equal(
    authSchema(true).safeParse({ ...valid, password, confirm: password }).success,
    false,
  );
});
