import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, addDays, weekDates, remainingSeconds } from '../src/utils/date.ts';

test('Date keys use the local calendar date', () => {
  assert.equal(dateKey(new Date(2026, 10, 18, 1)), '2026-11-18');
});

test('Week starts Monday and crosses month/year boundaries', () => {
  const week = weekDates(new Date(2027, 0, 1));
  assert.equal(dateKey(week[0]), '2026-12-28');
  assert.equal(dateKey(week[6]), '2027-01-03');
  assert.equal(dateKey(addDays(week[0], 7)), '2027-01-04');
});

test('Focus remaining time uses timestamps after background time', () => {
  assert.equal(remainingSeconds(100000, 40000), 60);
  assert.equal(remainingSeconds(100000, 100500), 0);
});
