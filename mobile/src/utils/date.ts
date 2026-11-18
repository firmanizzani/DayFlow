export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDays(date: Date, count: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function weekDates(date: Date) {
  const start = addDays(startOfDay(date), -((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function timeLabel(value: string | Date) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function shortDate(value: string | Date) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function timeRange(from: Date, to: Date) {
  return { from: from.toISOString(), to: to.toISOString() };
}

export function remainingSeconds(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
