import { expect, test } from 'bun:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { hasCalendarQueryChanged, millisecondsUntilNextDay, refreshCalendarQueries, startCalendarQueryRefresh } from '../lib/calendarQueryRefresh';

const statsKey = period => ['stats', 'expenses', 'stats-in-a-period', period];
const activityKey = period => ['incomes', 'recent-activity', period];

test('midnight only changes current averages; fixed historical/future and all-time caches stay valid', () => {
  const before = new Date(2030, 9, 7, 23);
  const after = new Date(2030, 9, 8, 0);
  for (const period of [
    { type: 'month', calendarKey: '2030-09' },
    { type: 'month', calendarKey: '2030-11' },
    { type: 'year', calendarKey: '2029' },
    { type: 'all-time' },
    { type: 'week', offset: 1 },
  ]) {
    expect(hasCalendarQueryChanged(statsKey(period), before, after)).toBe(false);
    expect(hasCalendarQueryChanged(activityKey(period), before, after)).toBe(false);
  }
  for (const period of [{ type: 'week' }, { type: 'month' }, { type: 'year' }, { type: 'month', calendarKey: '2030-10' }]) {
    expect(hasCalendarQueryChanged(statsKey(period), before, after)).toBe(true);
    expect(hasCalendarQueryChanged(activityKey(period), before, after)).toBe(false);
  }
  expect(hasCalendarQueryChanged(['expenses', 'availableExpenseMonths', 'calendar-months'], before, after)).toBe(false);
});

test('future fixed periods refresh their averages as they become current, and current ones as they finish', () => {
  const key = statsKey({ type: 'month', calendarKey: '2030-11' });
  expect(hasCalendarQueryChanged(key, new Date(2030, 9, 31), new Date(2030, 10, 1))).toBe(true);
  expect(hasCalendarQueryChanged(key, new Date(2030, 10, 29), new Date(2030, 11, 1))).toBe(true);
});

test('timezone changes refresh local calendar averages and ranges, not unbounded activity or unrelated caches', () => {
  const now = new Date(2030, 9, 7);
  expect(hasCalendarQueryChanged(statsKey({ type: 'month', calendarKey: '2029-03' }), now, now, true)).toBe(true);
  expect(hasCalendarQueryChanged(activityKey({ type: 'today' }), now, now, true)).toBe(true);
  expect(hasCalendarQueryChanged(statsKey({ type: 'all-time' }), now, now, true)).toBe(true);
  expect(hasCalendarQueryChanged(activityKey({ type: 'all-time' }), now, now, true)).toBe(false);
  expect(hasCalendarQueryChanged(['security', 'supportedAuthTypes'], now, now, true)).toBe(false);
});

test('active changed queries refetch once and unchanged cached queries execute no extra fetch', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  let currentCalls = 0;
  let historicalCalls = 0;
  const observer = new QueryObserver(client, { queryKey: statsKey({ type: 'month' }), queryFn: async () => ++currentCalls });
  const unsubscribe = observer.subscribe(() => {});
  const historical = { queryKey: statsKey({ type: 'month', calendarKey: '2029-01' }), queryFn: async () => ++historicalCalls };
  try {
    await observer.refetch();
    await client.fetchQuery(historical);
    await refreshCalendarQueries(client, new Date(2030, 9, 7), new Date(2030, 9, 8));
    expect(currentCalls).toBe(2);
    await client.fetchQuery(historical);
    expect(historicalCalls).toBe(1);
    await refreshCalendarQueries(client, new Date(2030, 9, 8, 9), new Date(2030, 9, 8, 10));
    expect(currentCalls).toBe(2);
  } finally {
    unsubscribe();
    client.clear();
  }
});

test('one midnight timer, background cancellation, resume reconciliation and complete cleanup', () => {
  const client = new QueryClient();
  const key = statsKey({ type: 'today' });
  client.setQueryData(key, 10);
  let now = new Date(2030, 9, 7, 23, 59);
  let active = true;
  let timezone = 'original';
  let onChange;
  let timer;
  let subscribed = false;
  const stop = startCalendarQueryRefresh(client, {
    now: () => now,
    timezone: () => timezone,
    isActive: () => active,
    schedule: (callback, delay) => {
      expect(timer).toBeUndefined();
      timer = { callback, delay };
      return () => { timer = undefined; };
    },
    subscribe: callback => {
      onChange = callback;
      subscribed = true;
      return () => { subscribed = false; };
    },
  });
  try {
    expect(timer.delay).toBe(60050);
    now = new Date(2030, 9, 8);
    timer.callback();
    expect(client.getQueryState(key).isInvalidated).toBe(true);
    client.setQueryData(key, 20);
    active = false;
    onChange();
    expect(timer).toBeUndefined();
    now = new Date(2030, 9, 10);
    active = true;
    onChange();
    expect(client.getQueryState(key).isInvalidated).toBe(true);
    client.setQueryData(key, 30);
    timezone = 'changed';
    onChange();
    expect(client.getQueryState(key).isInvalidated).toBe(true);
  } finally {
    stop();
    expect(timer).toBeUndefined();
    expect(subscribed).toBe(false);
    client.clear();
  }
});

test('timer targets local midnight on ordinary and daylight-saving days', () => {
  for (const now of [new Date(2026, 2, 8), new Date(2026, 10, 1), new Date(2026, 9, 7, 23, 30)]) {
    const next = new Date(now.getTime() + millisecondsUntilNextDay(now));
    expect(next.getDate()).toBe(now.getDate() + 1);
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
  }
});
