import { afterEach, beforeEach, expect, mock, setSystemTime, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import { expensesSchema, incomesSchema } from '../db/schema';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { refreshCalendarQueries } from '../lib/calendarQueryRefresh';

// Set TZ when launching Bun so JavaScript and SQLite use the same local calendar.
// Example: TZ=Asia/Kolkata bun test tests/expense-month-pagination.test.js

const sqlite = new Database(':memory:');
sqlite.exec(`
  CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    date_time INTEGER NOT NULL,
    description TEXT,
    payment_method TEXT,
    category TEXT NOT NULL,
    receipt TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    is_trashed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
  CREATE INDEX expenses_recent_activity_idx ON expenses(is_trashed, date_time, id);
  CREATE TABLE incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    date_time INTEGER NOT NULL,
    description TEXT,
    source TEXT NOT NULL,
    receipt TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    is_trashed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
  CREATE INDEX incomes_recent_activity_idx ON incomes(is_trashed, date_time, id);
`);
const queries = [];
let lastQueryParams = [];
const db = drizzle(sqlite, { logger: { logQuery(query, params) { queries.push(query); lastQueryParams = params; } } });
mock.module('@/db/client', () => ({ default: db }));
mock.module('@/lib/logger', () => ({ dbLog: { debug() {}, error() {} } }));
const { addExpense, updateExpenseById, softDeleteExpenseById, getExpenseById, getExpensesByMonthCursor, getAvailableExpenseMonths, getExpenseStatsByPeriod } = await import('../repositories/ExpenseRepo');
const { addIncome, updateIncomeById, softDeleteIncomeById, getIncomeById, getIncomesByMonthCursor, getIncomeStatsByPeriod } = await import('../repositories/IncomeRepo');
const { getPeriodStartEnd, getAverageDayCount, areStatsPeriodsEqual } = await import('../repositories/lib/helpers');
const { getAvailablePeriodsWithData } = await import('../repositories/CommonRepo');
const { getFinancialSummary } = await import('../lib/helpers');
const { getRecentActivity, mergeRecentActivity, RECENT_ACTIVITY_LIMIT } = await import('../repositories/RecentActivityRepo');

afterEach(() => setSystemTime());

beforeEach(() => {
  sqlite.exec('DELETE FROM expenses');
  sqlite.exec('DELETE FROM incomes');
  queries.length = 0;
});

function insert(dateTime, isTrashed = false) {
  return db.insert(expensesSchema).values({
    dateTime, amount: 10, category: 'Food', isTrashed,
  }).returning().get();
}

test('empty and trashed-only databases have no pages', async () => {
  expect((await getExpensesByMonthCursor(null)).expenses).toEqual([]);
  insert(new Date(2090, 0, 1), true);
  expect(await getExpensesByMonthCursor(null)).toEqual({
    expenses: [], month: '', nextMonthCursor: null,
  });
});

test('starts in the future, skips empty months, and visits every active row once', async () => {
  const latest = insert(new Date(2090, 5, 12));
  const middle = insert(new Date(2089, 1, 3));
  const oldest = insert(new Date(2020, 0, 1));
  insert(new Date(2091, 0, 1), true);
  let cursor = null;
  const ids = [];
  const labels = [];
  do {
    const page = await getExpensesByMonthCursor(cursor);
    ids.push(...page.expenses.map(row => row.id));
    labels.push(page.month);
    cursor = page.nextMonthCursor;
  } while (cursor !== null);
  expect(ids).toEqual([latest.id, middle.id, oldest.id]);
  expect(labels).toEqual(['June 2090', 'February 2089', 'January 2020']);
});

test('uses local month boundaries and deterministic ordering for equal timestamps', async () => {
  const first = insert(new Date(2090, 0, 31, 23, 59, 59));
  const second = insert(new Date(2090, 0, 31, 23, 59, 59));
  const nextMonth = insert(new Date(2090, 1, 1));
  const january = await getExpensesByMonthCursor('2090-01');
  expect(january.expenses.map(row => row.id)).toEqual([second.id, first.id]);
  expect(january.nextMonthCursor).toBeNull();
  expect((await getExpensesByMonthCursor(null)).expenses.map(row => row.id)).toEqual([nextMonth.id]);
});

test('refresh re-resolves the latest month after insert, edit, and deletion', async () => {
  const original = insert(new Date(2090, 0, 1));
  expect((await getExpensesByMonthCursor(null)).month).toBe('January 2090');
  const newer = insert(new Date(2090, 5, 1));
  expect((await getExpensesByMonthCursor(null)).expenses[0].id).toBe(newer.id);
  db.update(expensesSchema).set({ dateTime: new Date(2091, 0, 1) })
    .where(eq(expensesSchema.id, original.id)).run();
  expect((await getExpensesByMonthCursor(null)).month).toBe('January 2091');
  db.update(expensesSchema).set({ isTrashed: true })
    .where(eq(expensesSchema.id, original.id)).run();
  expect((await getExpensesByMonthCursor(null)).month).toBe('June 2090');
});

test('latest, month range, and older-month queries use the existing index without sorting', () => {
  for (const query of [
    'SELECT date_time FROM expenses WHERE is_trashed = 0 ORDER BY date_time DESC, id DESC LIMIT 1',
    'SELECT * FROM expenses WHERE is_trashed = 0 AND date_time >= 0 AND date_time < 1 ORDER BY date_time DESC, id DESC',
    'SELECT date_time FROM expenses WHERE is_trashed = 0 AND date_time < 1 ORDER BY date_time DESC, id DESC LIMIT 1',
  ]) {
    const details = sqlite.query(`EXPLAIN QUERY PLAN ${query}`).all()
      .map(row => row.detail).join(' ');
    expect(details).toContain('expenses_recent_activity_idx');
    expect(details).not.toContain('TEMP B-TREE');
  }
});

test('month discovery includes future months, counts active rows, and runs one SQL query', async () => {
  insert(new Date(2030, 10, 1));
  insert(new Date(2030, 10, 15));
  insert(new Date(2030, 9, 1));
  insert(new Date(2020, 0, 1));
  insert(new Date(2091, 0, 1), true);
  queries.length = 0;
  const months = await getAvailableExpenseMonths();
  expect(months).toEqual([
    { monthKey: '2030-11', month: 'November 2030', count: 2 },
    { monthKey: '2030-10', month: 'October 2030', count: 1 },
    { monthKey: '2020-01', month: 'January 2020', count: 1 },
  ]);
  expect(months.reduce((sum, month) => sum + month.count, 0)).toBe(4);
  expect(queries).toHaveLength(1);
  const details = sqlite.query(`EXPLAIN QUERY PLAN ${queries[0]}`).all(0)
    .map(row => row.detail).join(' ');
  expect(details).toContain('COVERING INDEX expenses_recent_activity_idx');
});

test('grouped local month counts match the expenses fetched for each tab', async () => {
  insert(new Date(2090, 0, 31, 23, 59, 59));
  insert(new Date(2090, 1, 1, 0, 0, 0));
  insert(new Date(2090, 1, 28, 23, 59, 59));
  for (const month of await getAvailableExpenseMonths()) {
    const page = await getExpensesByMonthCursor(month.monthKey, false);
    expect(page.expenses).toHaveLength(month.count);
    expect(page.month).toBe(month.month);
    expect(page.nextMonthCursor).toBeNull();
  }
});

test('selected months use one range query and calendar keys stay stable as time changes', async () => {
  const row = insert(new Date(2090, 10, 3));
  const RealDate = globalThis.Date;
  try {
    for (const now of [new RealDate(2090, 9, 1), new RealDate(2091, 0, 1)]) {
      globalThis.Date = class extends RealDate {
        constructor(...args) {
          super(...(args.length ? args : [now.getTime()]));
        }
      };
      queries.length = 0;
      const page = await getExpensesByMonthCursor('2090-11', false);
      expect(page.expenses.map(expense => expense.id)).toEqual([row.id]);
      expect(queries).toHaveLength(1);
    }
  } finally {
    globalThis.Date = RealDate;
  }
});

test('month counts update when entries move or the last entry is deleted', async () => {
  const row = insert(new Date(2090, 0, 1));
  db.update(expensesSchema).set({ dateTime: new Date(2090, 1, 1) })
    .where(eq(expensesSchema.id, row.id)).run();
  expect((await getAvailableExpenseMonths()).map(month => month.monthKey)).toEqual(['2090-02']);
  db.update(expensesSchema).set({ isTrashed: true })
    .where(eq(expensesSchema.id, row.id)).run();
  expect(await getAvailableExpenseMonths()).toEqual([]);
  expect((await getExpensesByMonthCursor('2090-02', false)).expenses).toEqual([]);
});

test('distant-future DST month boundaries agree with JavaScript date ranges', async () => {
  insert(new Date(2090, 9, 15));
  insert(new Date(2090, 10, 1));
  insert(new Date(2090, 10, 15));
  expect(await getAvailableExpenseMonths()).toEqual([
    { monthKey: '2090-11', month: 'November 2090', count: 2 },
    { monthKey: '2090-10', month: 'October 2090', count: 1 },
  ]);
  for (const month of await getAvailableExpenseMonths()) {
    expect((await getExpensesByMonthCursor(month.monthKey, false)).expenses).toHaveLength(month.count);
  }
});

function insertIncome(dateTime, amount = 10, isTrashed = false) {
  return db.insert(incomesSchema).values({
    dateTime, amount, source: 'Salary', isTrashed,
  }).returning().get();
}

test('income: empty and trashed-only data have no pages', async () => {
  expect(await getIncomesByMonthCursor(null)).toEqual({ incomes: [], month: '', nextMonthCursor: null });
  insertIncome(new Date(2090, 0, 1), 10, true);
  expect((await getIncomesByMonthCursor(null)).incomes).toEqual([]);
});

test('income: visits future and sparse months once with correct totals and counts', async () => {
  const newest = insertIncome(new Date(2090, 5, 12), 25);
  const sameMonth = insertIncome(new Date(2090, 5, 1), 15);
  const older = insertIncome(new Date(2089, 1, 3), 8);
  const oldest = insertIncome(new Date(2020, 0, 1), 2);
  insertIncome(new Date(2091, 0, 1), 100, true);
  const pages = [];
  let cursor = null;
  do {
    const page = await getIncomesByMonthCursor(cursor);
    pages.push(page);
    cursor = page.nextMonthCursor;
  } while (cursor !== null);
  expect(pages.map(page => page.month)).toEqual(['June 2090', 'February 2089', 'January 2020']);
  expect(pages.flatMap(page => page.incomes.map(row => row.id)))
    .toEqual([newest.id, sameMonth.id, older.id, oldest.id]);
  expect(pages.map(page => page.incomes.length)).toEqual([2, 1, 1]);
  expect(pages.map(page => page.incomes.reduce((sum, row) => sum + row.amount, 0))).toEqual([40, 8, 2]);
});

test('income: local month boundaries, equal timestamps, and stable calendar cursors', async () => {
  const first = insertIncome(new Date(2090, 0, 31, 23, 59, 59));
  const second = insertIncome(new Date(2090, 0, 31, 23, 59, 59));
  const february = insertIncome(new Date(2090, 1, 1));
  const latest = await getIncomesByMonthCursor(null);
  expect(latest.incomes.map(row => row.id)).toEqual([february.id]);
  expect(latest.nextMonthCursor).toBe('2090-01');
  const january = await getIncomesByMonthCursor(latest.nextMonthCursor);
  expect(january.incomes.map(row => row.id)).toEqual([second.id, first.id]);
  expect(january.nextMonthCursor).toBeNull();
});

test('income: refresh re-discovers the latest month after inserts, edits, and deletions', async () => {
  const original = insertIncome(new Date(2090, 0, 1));
  await getIncomesByMonthCursor(null);
  const added = insertIncome(new Date(2090, 5, 1));
  expect((await getIncomesByMonthCursor(null)).incomes[0].id).toBe(added.id);
  db.update(incomesSchema).set({ dateTime: new Date(2091, 0, 1) })
    .where(eq(incomesSchema.id, original.id)).run();
  expect((await getIncomesByMonthCursor(null)).month).toBe('January 2091');
  db.update(incomesSchema).set({ isTrashed: true })
    .where(eq(incomesSchema.id, original.id)).run();
  expect((await getIncomesByMonthCursor(null)).month).toBe('June 2090');
  db.update(incomesSchema).set({ dateTime: new Date(2020, 0, 1) })
    .where(eq(incomesSchema.id, added.id)).run();
  expect((await getIncomesByMonthCursor(null)).month).toBe('January 2020');
});

test('income: pagination uses indexed lookups without temporary sorting', async () => {
  insertIncome(new Date(2090, 0, 1));
  queries.length = 0;
  await getIncomesByMonthCursor(null);
  expect(queries).toHaveLength(3);
  queries.length = 0;
  await getIncomesByMonthCursor('2090-01');
  expect(queries).toHaveLength(2);
  for (const query of [
    'SELECT date_time FROM incomes WHERE is_trashed = 0 ORDER BY date_time DESC, id DESC LIMIT 1',
    'SELECT * FROM incomes WHERE is_trashed = 0 AND date_time >= 0 AND date_time < 1 ORDER BY date_time DESC, id DESC',
    'SELECT date_time FROM incomes WHERE is_trashed = 0 AND date_time < 1 ORDER BY date_time DESC, id DESC LIMIT 1',
  ]) {
    const details = sqlite.query(`EXPLAIN QUERY PLAN ${query}`).all()
      .map(row => row.detail).join(' ');
    expect(details).toContain('incomes_recent_activity_idx');
    expect(details).not.toContain('TEMP B-TREE');
  }
});

test('average: current periods stop at today, other periods use all calendar days', () => {
  const now = new Date(2024, 2, 13, 12);
  for (const [type, offset, expected] of [
    ['today', 0, 1], ['week', 0, 3], ['month', 0, 13], ['year', 0, 73],
    ['week', 1, 7], ['month', 1, 29], ['year', 1, 365],
    ['week', -1, 7], ['month', -1, 30], ['year', -1, 365],
  ]) {
    const period = { type, offset };
    const { start, end } = getPeriodStartEnd(period, now);
    expect(getAverageDayCount(period, start, end, now)).toBe(expected);
  }
});

test('average: All Time includes empty days and counts calendar dates across DST', () => {
  const period = { type: 'all-time' };
  expect(getAverageDayCount(period, new Date(2024, 2, 9, 23), new Date(2024, 2, 11, 1))).toBe(3);
  expect(getAverageDayCount(period, new Date(2023, 0, 1, 23), new Date(2025, 0, 1, 1))).toBe(732);
  expect(getAverageDayCount(period, new Date(2024, 2, 9, 1), new Date(2024, 2, 9, 23))).toBe(1);
  expect(getAverageDayCount(period, undefined, undefined)).toBe(0);
});

test('average: both repositories include future amounts but use elapsed days in the current month', async () => {
  setSystemTime(new Date(2024, 2, 13, 12));
  for (const date of [new Date(2024, 2, 1), new Date(2024, 2, 25)]) {
    db.insert(expensesSchema).values({ dateTime: date, amount: 13, category: 'Food' }).run();
    insertIncome(date, 13);
  }
  for (const getStats of [getExpenseStatsByPeriod, getIncomeStatsByPeriod]) {
    queries.length = 0;
    const stats = await getStats({ type: 'month' });
    expect(stats.total).toBe(26);
    expect(stats.avgPerDay).toBe(2);
    expect(queries).toHaveLength(2);
  }
});

test('average: both repositories use the entire All Time date span and handle empty data', async () => {
  setSystemTime(new Date(2024, 2, 10, 12));
  for (const getStats of [getExpenseStatsByPeriod, getIncomeStatsByPeriod]) {
    expect((await getStats({ type: 'all-time' })).avgPerDay).toBe(0);
  }
  for (const date of [new Date(2024, 2, 9, 23), new Date(2024, 2, 11, 1)]) {
    db.insert(expensesSchema).values({ dateTime: date, amount: 15, category: 'Food' }).run();
    insertIncome(date, 15);
  }
  for (const getStats of [getExpenseStatsByPeriod, getIncomeStatsByPeriod]) {
    queries.length = 0;
    const stats = await getStats({ type: 'all-time' });
    expect(stats.total).toBe(30);
    expect(stats.avgPerDay).toBe(10);
    expect(queries).toHaveLength(4);
  }
});

test('period discovery: merges expense/income months, includes the future, and derives unique years', async () => {
  insert(new Date(2030, 10, 1));
  insertIncome(new Date(2030, 10, 15));
  insertIncome(new Date(2031, 1, 3));
  insert(new Date(2020, 0, 1));
  insert(new Date(2032, 0, 1), true);
  insertIncome(new Date(2033, 0, 1), 10, true);
  queries.length = 0;
  const periods = await getAvailablePeriodsWithData();
  expect(periods.months.map(row => row.calendarKey)).toEqual(['2031-02', '2030-11', '2020-01']);
  expect(periods.years.map(row => row.calendarKey)).toEqual(['2031', '2030', '2020']);
  expect(periods.months[0]).toEqual({
    type: 'month', calendarKey: '2031-02', primaryLabel: 'February', secondaryLabel: '2031',
  });
  expect(queries).toHaveLength(2);
});

test('period discovery: handles empty, trashed-only, expense-only, and income-only data', async () => {
  expect(await getAvailablePeriodsWithData()).toEqual({ months: [], years: [] });
  insert(new Date(2030, 0, 1), true);
  insertIncome(new Date(2030, 0, 1), 10, true);
  expect(await getAvailablePeriodsWithData()).toEqual({ months: [], years: [] });
  const expense = insert(new Date(2030, 2, 1));
  expect((await getAvailablePeriodsWithData()).months.map(row => row.calendarKey)).toEqual(['2030-03']);
  db.update(expensesSchema).set({ isTrashed: true }).where(eq(expensesSchema.id, expense.id)).run();
  insertIncome(new Date(2031, 3, 1));
  expect((await getAvailablePeriodsWithData()).months.map(row => row.calendarKey)).toEqual(['2031-04']);
});

test('period discovery: local boundary periods and distant future dates remain consistent', async () => {
  insert(new Date(2030, 11, 31, 23, 59, 59));
  insertIncome(new Date(2031, 0, 1));
  insertIncome(new Date(2090, 10, 1));
  const periods = await getAvailablePeriodsWithData();
  expect(periods.months.map(row => row.calendarKey)).toEqual(['2090-11', '2031-01', '2030-12']);
  expect(periods.years.map(row => row.calendarKey)).toEqual(['2090', '2031', '2030']);
});

test('period selection: fixed month/year keys survive rollover and legacy offsets still work', () => {
  for (const now of [new Date(2030, 9, 7), new Date(2031, 0, 7)]) {
    const month = getPeriodStartEnd({ type: 'month', calendarKey: '2030-11' }, now);
    expect(month.start.getTime()).toBe(new Date(2030, 10, 1).getTime());
    expect(month.end.getTime()).toBe(new Date(2030, 11, 1).getTime() - 1);
    const year = getPeriodStartEnd({ type: 'year', calendarKey: '2030' }, now);
    expect(year.start.getTime()).toBe(new Date(2030, 0, 1).getTime());
    expect(year.end.getTime()).toBe(new Date(2031, 0, 1).getTime() - 1);
  }
  const now = new Date(2030, 10, 7);
  expect(areStatsPeriodsEqual({ type: 'month' }, { type: 'month', calendarKey: '2030-11' }, now)).toBe(true);
  expect(areStatsPeriodsEqual({ type: 'month', offset: 1 }, { type: 'month', calendarKey: '2030-10' }, now)).toBe(true);
  expect(areStatsPeriodsEqual({ type: 'month' }, { type: 'month', calendarKey: '2030-12' }, now)).toBe(false);
  expect(areStatsPeriodsEqual({ type: 'all-time' }, { type: 'all-time' }, now)).toBe(true);
});

test('period selection: future calendar keys filter both repositories and use full-period averages', async () => {
  setSystemTime(new Date(2030, 9, 7));
  db.insert(expensesSchema).values({ dateTime: new Date(2030, 10, 5), amount: 30, category: 'Food' }).run();
  insertIncome(new Date(2030, 10, 5), 30);
  insert(new Date(2030, 9, 5));
  insertIncome(new Date(2030, 9, 5));
  for (const getStats of [getExpenseStatsByPeriod, getIncomeStatsByPeriod]) {
    const month = await getStats({ type: 'month', calendarKey: '2030-11' });
    expect(month.total).toBe(30);
    expect(month.count).toBe(1);
    expect(month.avgPerDay).toBe(1);
    const year = await getStats({ type: 'year', calendarKey: '2030' });
    expect(year.total).toBe(40);
    expect(year.count).toBe(2);
  }
});

test('Home: future-month cards agree on totals, counts, averages, top groups and extrema', async () => {
  setSystemTime(new Date(2030, 9, 7, 12));
  for (const [dateTime, amount, category, isTrashed] of [
    [new Date(2030, 10, 5), 1200, 'Food', false],
    [new Date(2030, 10, 15), 800, 'Travel', false],
    [new Date(2030, 9, 7), 9999, 'Outside', false],
    [new Date(2030, 10, 20), 9999, 'Deleted', true],
  ]) db.insert(expensesSchema).values({ dateTime, amount, category, isTrashed }).run();
  for (const [dateTime, amount, source, isTrashed] of [
    [new Date(2030, 10, 5), 7000, 'Salary', false],
    [new Date(2030, 10, 15), 3000, 'Refund', false],
    [new Date(2030, 11, 1), 9999, 'Outside', false],
    [new Date(2030, 10, 20), 9999, 'Deleted', true],
  ]) db.insert(incomesSchema).values({ dateTime, amount, source, isTrashed }).run();
  const period = { type: 'month', calendarKey: '2030-11' };
  queries.length = 0;
  const [expense, income] = await Promise.all([getExpenseStatsByPeriod(period), getIncomeStatsByPeriod(period)]);
  expect(expense).toMatchObject({ total: 2000, count: 2, avgPerDay: 66.67, max: 1200, min: 800, topCategory: 'Food' });
  expect(income).toMatchObject({ total: 10000, count: 2, avgPerDay: 333.33, max: 7000, min: 3000, topSource: 'Salary' });
  expect(getFinancialSummary(expense, income)).toEqual({ netIncome: 8000, savingsRate: 80 });
  expect(queries).toHaveLength(4);
});

test('Home: past, current and future-year selections use the right totals and averaging days', async () => {
  setSystemTime(new Date(2030, 9, 7, 12));
  for (const [dateTime, expenseAmount, incomeAmount] of [
    [new Date(2030, 8, 1), 900, 1800],
    [new Date(2030, 9, 7), 70, 350],
    [new Date(2030, 9, 20), 70, 350],
    [new Date(2031, 5, 1), 730, 3650],
  ]) {
    db.insert(expensesSchema).values({ dateTime, amount: expenseAmount, category: 'Food' }).run();
    insertIncome(dateTime, incomeAmount);
  }
  for (const [period, expenseTotal, incomeTotal, expenseAverage, incomeAverage] of [
    [{ type: 'month', calendarKey: '2030-09' }, 900, 1800, 30, 60],
    [{ type: 'month' }, 140, 700, 20, 100],
    [{ type: 'year', calendarKey: '2031' }, 730, 3650, 2, 10],
    [{ type: 'today' }, 70, 350, 70, 350],
  ]) {
    const expense = await getExpenseStatsByPeriod(period);
    const income = await getIncomeStatsByPeriod(period);
    expect([expense.total, income.total]).toEqual([expenseTotal, incomeTotal]);
    expect([expense.avgPerDay, income.avgPerDay]).toEqual([expenseAverage, incomeAverage]);
  }
  const expense = await getExpenseStatsByPeriod({ type: 'all-time' });
  const income = await getIncomeStatsByPeriod({ type: 'all-time' });
  expect([expense.total, income.total]).toEqual([1770, 6150]);
  expect(getFinancialSummary(expense, income)).toEqual({ netIncome: 4380, savingsRate: 71.22 });
});

test('Home: empty, income-only, expense-only and overspending summaries are finite and meaningful', async () => {
  const period = { type: 'month', calendarKey: '2030-11' };
  const read = async () => {
    const expense = await getExpenseStatsByPeriod(period);
    const income = await getIncomeStatsByPeriod(period);
    return { expense, income, summary: getFinancialSummary(expense, income) };
  };
  const empty = await read();
  expect(empty.expense).toMatchObject({ total: 0, count: 0, min: 0, max: 0, topCategory: null, avgPerDay: 0 });
  expect(empty.income).toMatchObject({ total: 0, count: 0, min: 0, max: 0, topSource: null, avgPerDay: 0 });
  expect(empty.summary).toEqual({ netIncome: 0, savingsRate: 0 });
  const expense = insert(new Date(2030, 10, 5));
  expect((await read()).summary).toEqual({ netIncome: -10, savingsRate: 0 });
  insertIncome(new Date(2030, 10, 5), 5);
  expect((await read()).summary).toEqual({ netIncome: -5, savingsRate: -100 });
  db.update(expensesSchema).set({ isTrashed: true }).where(eq(expensesSchema.id, expense.id)).run();
  expect((await read()).summary).toEqual({ netIncome: 5, savingsRate: 100 });
});

test('Home: switching periods isolates cached data and mutations refresh active statistics', async () => {
  setSystemTime(new Date(2030, 9, 7, 12));
  insert(new Date(2030, 9, 7));
  insertIncome(new Date(2030, 9, 7), 50);
  const futureExpense = insert(new Date(2030, 10, 5));
  insertIncome(new Date(2030, 10, 5), 100);
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false, gcTime: Infinity } } });
  const options = (kind, period) => ({
    queryKey: ['stats', kind, 'stats-in-a-period', period],
    queryFn: () => kind === 'expenses' ? getExpenseStatsByPeriod(period) : getIncomeStatsByPeriod(period),
  });
  const future = { type: 'month', calendarKey: '2030-11' };
  const observers = ['expenses', 'incomes'].map(kind => new QueryObserver(client, options(kind, future)));
  const unsubscribe = observers.map(observer => observer.subscribe(() => {}));
  try {
    const load = async period => Promise.all(['expenses', 'incomes'].map((kind, index) => {
      const config = options(kind, period);
      observers[index].setOptions(config);
      return client.fetchQuery(config);
    }));
    const initial = await load(future);
    expect(initial.map(stats => stats.total)).toEqual([10, 100]);
    expect((await load({ type: 'month' })).map(stats => stats.total)).toEqual([10, 50]);
    expect((await load({ type: 'all-time' })).map(stats => stats.total)).toEqual([20, 150]);
    queries.length = 0;
    expect((await load(future)).map(stats => stats.total)).toEqual([10, 100]);
    expect(queries).toHaveLength(0);

    const addedExpense = insert(new Date(2030, 10, 20));
    const addedIncome = insertIncome(new Date(2030, 10, 20), 25);
    await Promise.all(['expenses', 'incomes'].map(kind => client.invalidateQueries({ queryKey: ['stats', kind] })));
    expect(observers.map(observer => observer.getCurrentResult().data.total)).toEqual([20, 125]);

    db.update(expensesSchema).set({ dateTime: new Date(2030, 11, 1) }).where(eq(expensesSchema.id, futureExpense.id)).run();
    db.update(incomesSchema).set({ dateTime: new Date(2030, 11, 1) }).where(eq(incomesSchema.id, addedIncome.id)).run();
    await Promise.all(['expenses', 'incomes'].map(kind => client.invalidateQueries({ queryKey: ['stats', kind] })));
    expect(observers.map(observer => observer.getCurrentResult().data.total)).toEqual([10, 100]);

    db.update(expensesSchema).set({ isTrashed: true }).where(eq(expensesSchema.id, addedExpense.id)).run();
    await client.invalidateQueries({ queryKey: ['stats', 'expenses'] });
    expect(observers[0].getCurrentResult().data.total).toBe(0);
  } finally {
    unsubscribe.forEach(stop => stop());
    client.clear();
  }
});

test('expense More Stats: future-month breakdown reconciles with the summary and chart input', async () => {
  setSystemTime(new Date(2030, 9, 7));
  for (const [day, amount, category] of [
    [5, 2000, 'Food'], [6, 500, 'Food'], [7, 1250, 'Travel'], [8, 1250, 'Bills'],
  ]) db.insert(expensesSchema).values({ dateTime: new Date(2031, 10, day), amount, category }).run();
  insert(new Date(2031, 9, 31));
  insert(new Date(2031, 11, 1));
  db.insert(expensesSchema).values({ dateTime: new Date(2031, 10, 10), amount: 9999, category: 'Deleted', isTrashed: true }).run();
  const stats = await getExpenseStatsByPeriod({ type: 'month', calendarKey: '2031-11' });
  expect(stats).toMatchObject({ total: 5000, count: 4, avgPerDay: 166.67, min: 500, max: 2000, topCategory: 'Food' });
  expect(stats.categories).toHaveLength(3);
  expect(stats.categories[0]).toEqual({ category: 'Food', total: 2500, count: 2 });
  expect(stats.categories.find(row => row.category === 'Travel')).toEqual({ category: 'Travel', total: 1250, count: 1 });
  expect(stats.categories.find(row => row.category === 'Bills')).toEqual({ category: 'Bills', total: 1250, count: 1 });
  expect(stats.categories.reduce((sum, row) => sum + row.total, 0)).toBe(stats.total);
  expect(stats.categories.reduce((sum, row) => sum + row.count, 0)).toBe(stats.count);
});

test('expense More Stats: future year and All Time retain every matching category and date', async () => {
  setSystemTime(new Date(2030, 9, 7));
  for (const [dateTime, amount, category] of [
    [new Date(2031, 0, 1), 100, 'Food'],
    [new Date(2031, 11, 31, 23, 59, 59), 265, 'Travel'],
    [new Date(2032, 0, 1), 20, 'Bills'],
    [new Date(2020, 0, 1), 15, 'Food'],
  ]) db.insert(expensesSchema).values({ dateTime, amount, category }).run();
  const year = await getExpenseStatsByPeriod({ type: 'year', calendarKey: '2031' });
  expect(year).toMatchObject({ total: 365, count: 2, avgPerDay: 1, topCategory: 'Travel', max: 265, min: 100 });
  expect(year.categories).toEqual([
    { category: 'Travel', total: 265, count: 1 },
    { category: 'Food', total: 100, count: 1 },
  ]);
  const all = await getExpenseStatsByPeriod({ type: 'all-time' });
  expect(all).toMatchObject({ total: 400, count: 4 });
  expect(all.categories.find(row => row.category === 'Food')).toEqual({ category: 'Food', total: 115, count: 2 });
  expect(all.categories.reduce((sum, row) => sum + row.total, 0)).toBe(400);
});

test('expense More Stats: empty periods and deleting a category’s last entry leave no chart data', async () => {
  const period = { type: 'month', calendarKey: '2031-11' };
  insert(new Date(2031, 9, 1));
  insert(new Date(2031, 10, 1), true);
  expect(await getExpenseStatsByPeriod(period)).toMatchObject({ total: 0, count: 0, categories: [], topCategory: null });
  const entry = insert(new Date(2031, 10, 1));
  expect((await getExpenseStatsByPeriod(period)).categories).toEqual([{ category: 'Food', total: 10, count: 1 }]);
  db.update(expensesSchema).set({ isTrashed: true }).where(eq(expensesSchema.id, entry.id)).run();
  expect(await getExpenseStatsByPeriod(period)).toMatchObject({ total: 0, count: 0, categories: [], topCategory: null });
});

test('expense More Stats: shares Home cache and both observers update after add/edit/delete', async () => {
  const period = { type: 'month', calendarKey: '2031-11' };
  const config = {
    queryKey: ['stats', 'expenses', 'stats-in-a-period', period],
    queryFn: () => getExpenseStatsByPeriod(period),
  };
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false, gcTime: Infinity } } });
  const home = new QueryObserver(client, config);
  const details = new QueryObserver(client, config);
  const stopHome = home.subscribe(() => {});
  const stopDetails = details.subscribe(() => {});
  try {
    await client.fetchQuery(config);
    queries.length = 0;
    await client.fetchQuery(config);
    expect(queries).toHaveLength(0);
    const entry = insert(new Date(2031, 10, 1));
    const verifyBoth = () => {
      const homeData = home.getCurrentResult().data;
      const detailsData = details.getCurrentResult().data;
      expect(detailsData).toBe(homeData);
      return detailsData;
    };
    await client.invalidateQueries({ queryKey: ['stats', 'expenses'] });
    expect(verifyBoth().categories).toEqual([{ category: 'Food', total: 10, count: 1 }]);
    db.update(expensesSchema).set({ amount: 30, category: 'Travel' }).where(eq(expensesSchema.id, entry.id)).run();
    await client.invalidateQueries({ queryKey: ['stats', 'expenses'] });
    expect(verifyBoth().categories).toEqual([{ category: 'Travel', total: 30, count: 1 }]);
    db.update(expensesSchema).set({ dateTime: new Date(2031, 11, 1) }).where(eq(expensesSchema.id, entry.id)).run();
    await client.invalidateQueries({ queryKey: ['stats', 'expenses'] });
    expect(verifyBoth()).toMatchObject({ total: 0, count: 0, categories: [] });
    db.update(expensesSchema).set({ dateTime: new Date(2031, 10, 1) }).where(eq(expensesSchema.id, entry.id)).run();
    await client.invalidateQueries({ queryKey: ['stats', 'expenses'] });
    db.update(expensesSchema).set({ isTrashed: true }).where(eq(expensesSchema.id, entry.id)).run();
    await client.invalidateQueries({ queryKey: ['stats', 'expenses'] });
    expect(verifyBoth()).toMatchObject({ total: 0, count: 0, categories: [] });
  } finally {
    stopHome();
    stopDetails();
    client.clear();
  }
});

test('recent activity: future local-month boundaries, year and All Time include only active entries', async () => {
  setSystemTime(new Date(2030, 9, 7));
  const before = insert(new Date(2031, 9, 31, 23, 59, 59));
  const first = insert(new Date(2031, 10, 1));
  const last = insertIncome(new Date(2031, 10, 30, 23, 59, 59));
  const after = insertIncome(new Date(2031, 11, 1));
  insert(new Date(2031, 10, 15), true);
  insertIncome(new Date(2031, 10, 15), 10, true);
  const load = async period => mergeRecentActivity(
    await getRecentActivity('expense', period), await getRecentActivity('income', period),
  ).map(row => `${row.kind}-${row.id}`);
  expect(await load({ type: 'month', calendarKey: '2031-11' })).toEqual([`income-${last.id}`, `expense-${first.id}`]);
  const allIds = [`income-${after.id}`, `income-${last.id}`, `expense-${first.id}`, `expense-${before.id}`];
  expect(await load({ type: 'year', calendarKey: '2031' })).toEqual(allIds);
  expect(await load({ type: 'all-time' })).toEqual(allIds);
  expect(await load({ type: 'month', calendarKey: '2032-01' })).toEqual([]);
});

test('recent activity: current periods include future entries inside the period, not outside it', async () => {
  setSystemTime(new Date(2030, 9, 9, 12)); // Wednesday
  const today = insert(new Date(2030, 9, 9, 23));
  const week = insertIncome(new Date(2030, 9, 13, 23));
  const month = insert(new Date(2030, 9, 31, 23));
  const year = insertIncome(new Date(2030, 11, 31, 23));
  insert(new Date(2031, 0, 1));
  const load = async type => mergeRecentActivity(
    await getRecentActivity('expense', { type }), await getRecentActivity('income', { type }),
  ).map(row => `${row.kind}-${row.id}`);
  expect(await load('today')).toEqual([`expense-${today.id}`]);
  expect(await load('week')).toEqual([`income-${week.id}`, `expense-${today.id}`]);
  expect(await load('month')).toEqual([`expense-${month.id}`, `income-${week.id}`, `expense-${today.id}`]);
  expect(await load('year')).toEqual([`income-${year.id}`, `expense-${month.id}`, `income-${week.id}`, `expense-${today.id}`]);
});

test('recent activity: five-row indexed queries and bounded merge preserve deterministic tie ordering', async () => {
  const expenses = [];
  const incomes = [];
  for (let day = 1; day <= 8; day++) {
    expenses.push(insert(new Date(2031, 10, day)));
    incomes.push(insertIncome(new Date(2031, 10, day)));
  }
  const tiedExpense = insert(new Date(2031, 10, 8));
  const tiedIncome = insertIncome(new Date(2031, 10, 8));
  queries.length = 0;
  const expenseRows = await getRecentActivity('expense', { type: 'all-time' });
  const incomeRows = await getRecentActivity('income', { type: 'all-time' });
  expect(queries).toHaveLength(2);
  expect(expenseRows).toHaveLength(RECENT_ACTIVITY_LIMIT);
  expect(incomeRows).toHaveLength(RECENT_ACTIVITY_LIMIT);
  expect(mergeRecentActivity(expenseRows, incomeRows).map(row => `${row.kind}-${row.id}`)).toEqual([
    `expense-${tiedExpense.id}`, `expense-${expenses[7].id}`,
    `income-${tiedIncome.id}`, `income-${incomes[7].id}`, `expense-${expenses[6].id}`,
  ]);
  expect(mergeRecentActivity([], incomeRows)).toEqual(incomeRows);
  expect(mergeRecentActivity(expenseRows, [])).toEqual(expenseRows);
  expect(mergeRecentActivity([], [])).toEqual([]);
  for (const kind of ['expense', 'income']) {
    for (const period of [{ type: 'all-time' }, { type: 'month', calendarKey: '2031-11' }]) {
      await getRecentActivity(kind, period);
      const sql = queries.at(-1);
      expect(sql).toContain('limit ?');
      expect(lastQueryParams.at(-1)).toBe(RECENT_ACTIVITY_LIMIT);
      const plan = sqlite.query(`EXPLAIN QUERY PLAN ${sql}`).all(...lastQueryParams).map(row => row.detail).join(' ');
      expect(plan).toContain(`${kind === 'expense' ? 'expenses' : 'incomes'}_recent_activity_idx`);
      expect(plan).not.toContain('TEMP B-TREE');
    }
  }
});

test('recent activity: period switching reuses cache and each mutation refreshes only its transaction kind', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false, gcTime: Infinity } } });
  const period = { type: 'month', calendarKey: '2031-11' };
  const config = kind => ({
    queryKey: [kind === 'expense' ? 'expenses' : 'incomes', 'recent-activity', period],
    queryFn: () => getRecentActivity(kind, period),
  });
  const expenses = new QueryObserver(client, config('expense'));
  const incomes = new QueryObserver(client, config('income'));
  const stopExpenses = expenses.subscribe(() => {});
  const stopIncomes = incomes.subscribe(() => {});
  try {
    await Promise.all([client.fetchQuery(config('expense')), client.fetchQuery(config('income'))]);
    const currentRows = () => mergeRecentActivity(expenses.getCurrentResult().data, incomes.getCurrentResult().data);
    const expense = insert(new Date(2031, 10, 1));
    queries.length = 0;
    await client.invalidateQueries({ queryKey: ['expenses'] });
    expect(queries).toHaveLength(1);
    expect(currentRows()).toMatchObject([{ kind: 'expense', id: expense.id }]);
    const income = insertIncome(new Date(2031, 10, 2));
    queries.length = 0;
    await client.invalidateQueries({ queryKey: ['incomes'] });
    expect(queries).toHaveLength(1);
    expect(currentRows().map(row => row.kind)).toEqual(['income', 'expense']);
    for (const [kind, table, entry, prefix] of [
      ['expense', expensesSchema, expense, 'expenses'], ['income', incomesSchema, income, 'incomes'],
    ]) {
      db.update(table).set({ amount: 50, description: 'Updated', dateTime: new Date(2031, 10, 30) }).where(eq(table.id, entry.id)).run();
      await client.invalidateQueries({ queryKey: [prefix] });
      expect(currentRows()[0]).toMatchObject({ kind, id: entry.id, amount: 50, description: 'Updated' });
      db.update(table).set({ dateTime: new Date(2031, 11, 1) }).where(eq(table.id, entry.id)).run();
      await client.invalidateQueries({ queryKey: [prefix] });
      expect(currentRows().some(row => row.kind === kind)).toBe(false);
      db.update(table).set({ dateTime: new Date(2031, 10, 30) }).where(eq(table.id, entry.id)).run();
      await client.invalidateQueries({ queryKey: [prefix] });
      expect(currentRows().some(row => row.kind === kind)).toBe(true);
      db.update(table).set({ isTrashed: true }).where(eq(table.id, entry.id)).run();
      await client.invalidateQueries({ queryKey: [prefix] });
      expect(currentRows().some(row => row.kind === kind)).toBe(false);
    }
    const nextPeriod = { type: 'month', calendarKey: '2031-12' };
    const nextConfig = { queryKey: ['expenses', 'recent-activity', nextPeriod], queryFn: () => getRecentActivity('expense', nextPeriod) };
    await client.fetchQuery(nextConfig);
    queries.length = 0;
    await client.fetchQuery(config('expense'));
    expect(queries).toHaveLength(0);
    expect(currentRows()).toEqual([]);
  } finally {
    stopExpenses();
    stopIncomes();
    client.clear();
  }
});

test('integration: real expense and income saves, future-date edits and deletions reconcile all views', async () => {
  setSystemTime(new Date(2030, 9, 7));
  const futurePeriod = { type: 'month', calendarKey: '2031-11' };
  await addExpense({ dateTime: new Date(2031, 10, 19), amount: 25, category: 'Food', description: 'Integration expense' });
  await addIncome({ dateTime: new Date(2031, 10, 19), amount: 100, source: 'Salary', description: 'Integration income' });
  const expense = (await getExpensesByMonthCursor(null)).expenses[0];
  const income = (await getIncomesByMonthCursor(null)).incomes[0];
  expect((await getExpenseById(expense.id)).amount).toBe(25);
  expect((await getIncomeById(income.id)).amount).toBe(100);
  expect(await getAvailableExpenseMonths()).toEqual([{ monthKey: '2031-11', month: 'November 2031', count: 1 }]);
  expect((await getAvailablePeriodsWithData()).months.map(row => row.calendarKey)).toEqual(['2031-11']);
  expect(getFinancialSummary(await getExpenseStatsByPeriod(futurePeriod), await getIncomeStatsByPeriod(futurePeriod))).toMatchObject({ netIncome: 75, savingsRate: 75 });
  expect(mergeRecentActivity(await getRecentActivity('expense', futurePeriod), await getRecentActivity('income', futurePeriod))).toHaveLength(2);
  await updateExpenseById(expense.id, { ...expense, amount: 50, dateTime: new Date(2032, 1, 29) });
  await updateIncomeById(income.id, { ...income, amount: 200, dateTime: new Date(2032, 1, 29) });
  expect((await getAvailablePeriodsWithData()).months.map(row => row.calendarKey)).toEqual(['2032-02']);
  expect((await getExpensesByMonthCursor(null)).month).toBe('February 2032');
  expect((await getIncomesByMonthCursor(null)).month).toBe('February 2032');
  expect(await getExpenseStatsByPeriod(futurePeriod)).toMatchObject({ total: 0, count: 0, categories: [] });
  expect(await getIncomeStatsByPeriod(futurePeriod)).toMatchObject({ total: 0, count: 0, sources: [] });
  expect(await getRecentActivity('expense', futurePeriod)).toEqual([]);
  expect(await getRecentActivity('income', futurePeriod)).toEqual([]);
  const newPeriod = { type: 'month', calendarKey: '2032-02' };
  expect(await getExpenseStatsByPeriod(newPeriod)).toMatchObject({ total: 50, count: 1, avgPerDay: 1.72 });
  expect(await getIncomeStatsByPeriod(newPeriod)).toMatchObject({ total: 200, count: 1, avgPerDay: 6.9 });
  await softDeleteExpenseById(expense.id);
  await softDeleteIncomeById(income.id);
  expect((await getExpensesByMonthCursor(null)).expenses).toEqual([]);
  expect((await getIncomesByMonthCursor(null)).incomes).toEqual([]);
  expect(await getAvailableExpenseMonths()).toEqual([]);
  expect(await getAvailablePeriodsWithData()).toEqual({ months: [], years: [] });
  expect(await getExpenseStatsByPeriod({ type: 'all-time' })).toMatchObject({ total: 0, count: 0, categories: [] });
  expect(await getIncomeStatsByPeriod({ type: 'all-time' })).toMatchObject({ total: 0, count: 0, sources: [] });
  expect(await getRecentActivity('expense', { type: 'all-time' })).toEqual([]);
  expect(await getRecentActivity('income', { type: 'all-time' })).toEqual([]);
});

test('calendar refresh: relative totals and activity follow day/week/month/year rollover', async () => {
  for (const [type, before, after] of [
    ['today', new Date(2030, 9, 7, 12), new Date(2030, 9, 8, 12)],
    ['week', new Date(2026, 9, 11, 12), new Date(2026, 9, 12, 12)],
    ['month', new Date(2030, 9, 31, 12), new Date(2030, 10, 1, 12)],
    ['year', new Date(2030, 11, 31, 12), new Date(2031, 0, 1, 12)],
  ]) {
    sqlite.exec('DELETE FROM expenses');
    sqlite.exec('DELETE FROM incomes');
    insert(before);
    insertIncome(before, 20);
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, refetchOnWindowFocus: false, retry: false } } });
    const period = { type, offset: 0 };
    const statsConfig = { queryKey: ['stats', 'expenses', 'stats-in-a-period', period], queryFn: () => getExpenseStatsByPeriod(period) };
    const activityConfig = { queryKey: ['incomes', 'recent-activity', period], queryFn: () => getRecentActivity('income', period) };
    try {
      setSystemTime(before);
      await client.fetchQuery(statsConfig);
      await client.fetchQuery(activityConfig);
      setSystemTime(after);
      await refreshCalendarQueries(client, before, after);
      expect((await client.fetchQuery(statsConfig)).total).toBe(0);
      expect(await client.fetchQuery(activityConfig)).toEqual([]);
      expect(client.getQueryData(statsConfig.queryKey).total).toBe(0);
      expect(client.getQueryData(activityConfig.queryKey)).toEqual([]);
    } finally {
      client.clear();
    }
  }
});

test('integration: deleted ID records are marked trashed and excluded from active views', async () => {
  const expense = insert(new Date(2031, 10, 1));
  const income = insertIncome(new Date(2031, 10, 1));
  await softDeleteExpenseById(expense.id);
  await softDeleteIncomeById(income.id);
  expect((await getExpenseById(expense.id)).isTrashed).toBe(true);
  expect((await getIncomeById(income.id)).isTrashed).toBe(true);
  expect(await getRecentActivity('expense', { type: 'all-time' })).toEqual([]);
  expect(await getRecentActivity('income', { type: 'all-time' })).toEqual([]);
});

test('calendar refresh: fixed current-month average updates when its day count advances', async () => {
  const before = new Date(2030, 9, 7, 12);
  const after = new Date(2030, 9, 8, 12);
  setSystemTime(before);
  db.insert(expensesSchema).values({ dateTime: new Date(2030, 9, 1), amount: 70, category: 'Food' }).run();
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  const period = { type: 'month', calendarKey: '2030-10' };
  const config = { queryKey: ['stats', 'expenses', 'stats-in-a-period', period], queryFn: () => getExpenseStatsByPeriod(period) };
  try {
    expect((await client.fetchQuery(config)).avgPerDay).toBe(10);
    setSystemTime(after);
    await refreshCalendarQueries(client, before, after);
    expect((await client.fetchQuery(config)).avgPerDay).toBe(8.75);
  } finally {
    client.clear();
  }
});

test('income More Stats: future-month source totals and counts reconcile with every summary metric', async () => {
  setSystemTime(new Date(2030, 9, 7));
  for (const [day, amount, source] of [
    [5, 7000, 'Salary'], [6, 1000, 'Salary'], [7, 1500, 'Refund'], [8, 500, 'Gift'],
  ]) db.insert(incomesSchema).values({ dateTime: new Date(2031, 10, day), amount, source }).run();
  insertIncome(new Date(2031, 9, 31), 9999);
  insertIncome(new Date(2031, 11, 1), 9999);
  insertIncome(new Date(2031, 10, 10), 9999, true);
  const stats = await getIncomeStatsByPeriod({ type: 'month', calendarKey: '2031-11' });
  expect(stats).toMatchObject({ total: 10000, count: 4, avgPerDay: 333.33, min: 500, max: 7000, topSource: 'Salary' });
  expect(stats.sources).toEqual([
    { source: 'Salary', total: 8000, count: 2 },
    { source: 'Refund', total: 1500, count: 1 },
    { source: 'Gift', total: 500, count: 1 },
  ]);
  expect(stats.sources.reduce((sum, row) => sum + row.total, 0)).toBe(stats.total);
  expect(stats.sources.reduce((sum, row) => sum + row.count, 0)).toBe(stats.count);
});

test('income More Stats: future leap year and All Time include the correct source/date boundaries', async () => {
  setSystemTime(new Date(2030, 9, 7));
  for (const [dateTime, amount, source] of [
    [new Date(2032, 0, 1), 100, 'Salary'],
    [new Date(2032, 11, 31, 23, 59, 59), 266, 'Refund'],
    [new Date(2033, 0, 1), 20, 'Gift'],
    [new Date(2020, 0, 1), 14, 'Salary'],
  ]) db.insert(incomesSchema).values({ dateTime, amount, source }).run();
  const year = await getIncomeStatsByPeriod({ type: 'year', calendarKey: '2032' });
  expect(year).toMatchObject({ total: 366, count: 2, avgPerDay: 1, topSource: 'Refund', max: 266, min: 100 });
  expect(year.sources).toEqual([
    { source: 'Refund', total: 266, count: 1 },
    { source: 'Salary', total: 100, count: 1 },
  ]);
  const all = await getIncomeStatsByPeriod({ type: 'all-time' });
  expect(all).toMatchObject({ total: 400, count: 4 });
  expect(all.sources.find(row => row.source === 'Salary')).toEqual({ source: 'Salary', total: 114, count: 2 });
  expect(all.sources.reduce((sum, row) => sum + row.total, 0)).toBe(400);
});

test('income More Stats: empty and deleted-only periods have no source/chart data', async () => {
  const period = { type: 'month', calendarKey: '2031-11' };
  insertIncome(new Date(2031, 9, 1));
  insertIncome(new Date(2031, 10, 1), 10, true);
  expect(await getIncomeStatsByPeriod(period)).toMatchObject({ total: 0, count: 0, sources: [], topSource: null });
  const entry = insertIncome(new Date(2031, 10, 1));
  expect((await getIncomeStatsByPeriod(period)).sources).toEqual([{ source: 'Salary', total: 10, count: 1 }]);
  db.update(incomesSchema).set({ isTrashed: true }).where(eq(incomesSchema.id, entry.id)).run();
  expect(await getIncomeStatsByPeriod(period)).toMatchObject({ total: 0, count: 0, sources: [], topSource: null });
});

test('income More Stats: reuses Home cache and both observers refresh after income mutations', async () => {
  const period = { type: 'month', calendarKey: '2031-11' };
  const config = {
    queryKey: ['stats', 'incomes', 'stats-in-a-period', period],
    queryFn: () => getIncomeStatsByPeriod(period),
  };
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false, gcTime: Infinity } } });
  const home = new QueryObserver(client, config);
  const details = new QueryObserver(client, config);
  const stopHome = home.subscribe(() => {});
  const stopDetails = details.subscribe(() => {});
  try {
    await client.fetchQuery(config);
    queries.length = 0;
    await client.fetchQuery(config);
    expect(queries).toHaveLength(0);
    const entry = insertIncome(new Date(2031, 10, 1));
    const verifyBoth = () => {
      const homeData = home.getCurrentResult().data;
      const detailsData = details.getCurrentResult().data;
      expect(detailsData).toBe(homeData);
      return detailsData;
    };
    await client.invalidateQueries({ queryKey: ['stats', 'incomes'] });
    expect(verifyBoth().sources).toEqual([{ source: 'Salary', total: 10, count: 1 }]);
    db.update(incomesSchema).set({ amount: 60, source: 'Refund' }).where(eq(incomesSchema.id, entry.id)).run();
    await client.invalidateQueries({ queryKey: ['stats', 'incomes'] });
    expect(verifyBoth().sources).toEqual([{ source: 'Refund', total: 60, count: 1 }]);
    db.update(incomesSchema).set({ dateTime: new Date(2031, 11, 1) }).where(eq(incomesSchema.id, entry.id)).run();
    await client.invalidateQueries({ queryKey: ['stats', 'incomes'] });
    expect(verifyBoth()).toMatchObject({ total: 0, count: 0, sources: [] });
    db.update(incomesSchema).set({ dateTime: new Date(2031, 10, 1) }).where(eq(incomesSchema.id, entry.id)).run();
    await client.invalidateQueries({ queryKey: ['stats', 'incomes'] });
    db.update(incomesSchema).set({ isTrashed: true }).where(eq(incomesSchema.id, entry.id)).run();
    await client.invalidateQueries({ queryKey: ['stats', 'incomes'] });
    expect(verifyBoth()).toMatchObject({ total: 0, count: 0, sources: [] });
  } finally {
    stopHome();
    stopDetails();
    client.clear();
  }
});
