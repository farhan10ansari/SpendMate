import db from '@/db/client';
import { ExpenseDB, ExpenseRes, expensesSchema } from '@/db/schema';
import { and, desc, eq, gte, sql, lte, lt, asc } from 'drizzle-orm';
import { getPeriodStartEnd, getAverageDayCount } from './lib/helpers';
import { getTransactionMonths } from './lib/transactionMonths';
import { StatsPeriod, PeriodExpenseStats } from '@/lib/types';
import { startOfMonth, format, addMonths, parseISO } from 'date-fns';
import { dbLog as log } from "@/lib/logger";

type CreateExpenseData = Omit<ExpenseDB, 'id' | 'isTrashed'>;
type UpdateExpenseData = Omit<ExpenseDB, 'id' | 'isTrashed'>;

// Add a new expense to the database
export const addExpense = async (expense: CreateExpenseData) => {
  try {
    log.debug("addExpense: start", { amount: expense.amount, category: expense.category, dateTime: expense.dateTime });

    // Drizzle expects a Date for timestamp columns
    const dt: Date = expense.dateTime instanceof Date
      ? expense.dateTime
      : new Date(expense.dateTime);

    const res = await db
      .insert(expensesSchema)
      .values({
        amount: expense.amount,
        dateTime: dt,
        description: expense.description ?? null,
        paymentMethod: expense.paymentMethod,
        category: expense.category,
        receipt: expense.receipt ?? null,
        currency: expense.currency || 'INR', // default to INR if not provided
      })
      .run();

    log.debug("addExpense: done");
    return res;
  } catch (err) {
    log.error("addExpense: failed", { error: String(err) });
    throw err;
  }
};

// A null cursor always resolves the latest month again when the list is refreshed.
export const getExpensesByMonthCursor = async (monthCursor: string | null, includeOlderMonths = true): Promise<{
  expenses: ExpenseRes[];
  month: string;
  nextMonthCursor: string | null;
}> => {
  let monthDate: Date;
  if (monthCursor === null) {
    const [latest] = await db
      .select({ dateTime: expensesSchema.dateTime })
      .from(expensesSchema)
      .where(eq(expensesSchema.isTrashed, false))
      .orderBy(desc(expensesSchema.dateTime), desc(expensesSchema.id))
      .limit(1);
    if (!latest) return { expenses: [], month: '', nextMonthCursor: null };
    monthDate = latest.dateTime;
  } else {
    monthDate = parseISO(`${monthCursor}-01`);
  }

  const monthStart = startOfMonth(monthDate);
  const nextMonthStart = addMonths(monthStart, 1);
  const [expenses, older] = await Promise.all([
    db.select().from(expensesSchema)
      .where(and(
        eq(expensesSchema.isTrashed, false),
        gte(expensesSchema.dateTime, monthStart),
        lt(expensesSchema.dateTime, nextMonthStart),
      ))
      .orderBy(desc(expensesSchema.dateTime), desc(expensesSchema.id)),
    includeOlderMonths ? db.select({ dateTime: expensesSchema.dateTime }).from(expensesSchema)
      .where(and(
        eq(expensesSchema.isTrashed, false),
        lt(expensesSchema.dateTime, monthStart),
      ))
      .orderBy(desc(expensesSchema.dateTime), desc(expensesSchema.id))
      .limit(1) : Promise.resolve([]),
  ]);

  return {
    expenses,
    month: format(monthStart, 'MMMM yyyy'),
    nextMonthCursor: older[0] ? format(older[0].dateTime, 'yyyy-MM') : null,
  };
};

// Get list of months having expenses
export const getAvailableExpenseMonths = async (): Promise<{
  monthKey: string;
  month: string;
  count: number;
}[]> => {
  try {
    log.debug("getAvailableExpenseMonths: start");

    const rows = await getTransactionMonths(expensesSchema);
    const months = rows.map(row => ({
      ...row,
      month: format(parseISO(`${row.monthKey}-01`), 'MMMM yyyy'),
    }));
    log.debug("getAvailableExpenseMonths: done", { months: months.length });
    return months;
  } catch (err) {
    log.error("getAvailableExpenseMonths: failed", { error: String(err) });
    throw err;
  }
};

// Get a single expense by ID
export const getExpenseById = async (id: string | number): Promise<ExpenseRes> => {
  try {
    log.debug("getExpenseById: start", { id });

    const numericId = Number(id); // Convert string to number
    if (isNaN(numericId)) {
      throw new Error('Invalid ID format. ID must be a number.');
    }

    const result = await db
      .select()
      .from(expensesSchema)
      .where(eq(expensesSchema.id, numericId))
      .limit(1)
      .execute();

    if (!result || result.length === 0) {
      throw new Error(`Expense with ID ${id} not found.`);
    }

    log.debug("getExpenseById: done");
    return result[0] as ExpenseRes;
  } catch (err) {
    log.error("getExpenseById: failed", { id, error: String(err) });
    throw err;
  }
};

// Delete an expense by ID (soft delete)
export const softDeleteExpenseById = async (id: string | number): Promise<void> => {
  try {
    log.debug("softDeleteExpenseById: start", { id });

    const numericId = Number(id); // Convert string to number
    if (isNaN(numericId)) {
      throw new Error('Invalid ID format. ID must be a number.');
    }

    // mark as trashed instead of deleting
    const result = await db
      .update(expensesSchema)
      .set({ isTrashed: true })
      .where(eq(expensesSchema.id, numericId))
      .run();

    if (result.changes === 0) {
      throw new Error(`Expense with ID ${id} not found or already deleted.`);
    }

    log.debug("softDeleteExpenseById: done", { changes: result.changes });
  } catch (err) {
    log.error("softDeleteExpenseById: failed", { id, error: String(err) });
    throw err;
  }
};

// Delete all expense for a given category (soft delete)
export const softDeleteExpensesByCategory = async (category: string): Promise<void> => {
  try {
    log.debug("softDeleteExpensesByCategory: start", { category });

    const result = await db
      .update(expensesSchema)
      .set({ isTrashed: true })
      .where(eq(expensesSchema.category, category))
      .run();

    log.debug("softDeleteExpensesByCategory: done", { changes: result.changes });
  } catch (err) {
    log.error("softDeleteExpensesByCategory: failed", { category, error: String(err) });
    throw err;
  }
};

export const updateExpenseById = async (id: string | number, expense: UpdateExpenseData): Promise<void> => {
  try {
    log.debug("updateExpenseById: start", { id, category: expense.category, amount: expense.amount });

    const numericId = Number(id); // Convert string to number
    if (isNaN(numericId)) {
      throw new Error('Invalid ID format. ID must be a number.');
    }

    const dt: Date = expense.dateTime instanceof Date
      ? expense.dateTime
      : new Date(expense.dateTime);

    const result = await db
      .update(expensesSchema)
      .set({
        amount: expense.amount,
        dateTime: dt,
        description: expense.description ?? null,
        paymentMethod: expense.paymentMethod,
        category: expense.category,
        receipt: expense.receipt ?? null,
        currency: expense.currency ?? 'INR',
      })
      .where(eq(expensesSchema.id, numericId))
      .run();

    if (result.changes === 0) {
      throw new Error(`Expense with ID ${id} not found or no changes made.`);
    }

    log.debug("updateExpenseById: done", { changes: result.changes });
  } catch (err) {
    log.error("updateExpenseById: failed", { id, error: String(err) });
    throw err;
  }
};

// Insights
export const getExpenseStatsByPeriod = async (
  period: StatsPeriod
): Promise<PeriodExpenseStats> => {
  try {
    log.debug("getExpenseStatsByPeriod: start", { period });

    // 1. Get period start & end dates, calculate days in period
    const now = new Date();
    const { start, end } = getPeriodStartEnd(period, now);
    let startDate = start;
    let endDate = end;

    if (!startDate) {
      const [earliest] = await db
        .select({ dateTime: expensesSchema.dateTime })
        .from(expensesSchema)
        .where(eq(expensesSchema.isTrashed, false))
        .orderBy(asc(expensesSchema.dateTime))
        .limit(1);
      //earliest can be undefined if no expense exist
      startDate = earliest?.dateTime;
    }

    if (!endDate) {
      const [latest] = await db
        .select({ dateTime: expensesSchema.dateTime })
        .from(expensesSchema)
        .where(eq(expensesSchema.isTrashed, false))
        .orderBy(desc(expensesSchema.dateTime))
        .limit(1);
      //latest can be undefined if no expense exist
      endDate = latest?.dateTime;
    }

    // 2. Build the where condition conditionally
    const whereConditions = [eq(expensesSchema.isTrashed, false)];
    if (startDate) whereConditions.push(gte(expensesSchema.dateTime, startDate));
    if (endDate) whereConditions.push(lte(expensesSchema.dateTime, endDate));

    const days = getAverageDayCount(period, startDate, endDate, now);


    // 2. Fetch total, count, max, min in one query using both start and end dates
    const [row] = await db
      .select({
        total: sql<number>`SUM(${expensesSchema.amount})`,
        count: sql<number>`COUNT(*)`,
        max: sql<number>`MAX(${expensesSchema.amount})`,
        min: sql<number>`MIN(${expensesSchema.amount})`,
      })
      .from(expensesSchema)
      .where(and(...whereConditions))
      .limit(1);

    const total = row.total ?? 0;
    const count = row.count ?? 0;
    const maxAmount = row.max ?? 0;
    const minAmount = row.min ?? 0;

    // 3. Fetch category breakdown (sum + count) for the specific period
    const categories = await db
      .select({
        category: expensesSchema.category,
        total: sql<number>`SUM(${expensesSchema.amount})`,
        count: sql<number>`COUNT(*)`
      })
      .from(expensesSchema)
      .where(and(...whereConditions))
      .groupBy(expensesSchema.category)
      .orderBy(desc(sql<number>`SUM(${expensesSchema.amount})`)); // sort by total descending

    // 4. Compute avg/day and round
    const rawAvg = days > 0 ? total / days : 0;
    const avgPerDay = parseFloat(rawAvg.toFixed(2));

    // 5. Get top category
    const topCategory = categories.length > 0 ? categories[0].category : null;

    const result: PeriodExpenseStats = {
      period,
      total: parseFloat(total.toFixed(2)),
      count,
      avgPerDay,
      max: maxAmount,
      min: minAmount,
      categories,
      topCategory,
    };

    log.debug("getExpenseStatsByPeriod: done", { count, total: result.total, days, topCategory });
    return result;
  } catch (err) {
    log.error("getExpenseStatsByPeriod: failed", { period, error: String(err) });
    throw err;
  }
};

// Get all categories with their occurrence counts as a key-value object for sorting the categories based on usage
export const getCategoriesWithCountsKV = async (): Promise<Record<string, number>> => {
  try {
    log.debug("getCategoriesWithCountsKV: start");

    const categories = await db
      .select({
        category: expensesSchema.category,
        count: sql<number>`COUNT(*)`
      })
      .from(expensesSchema)
      .where(eq(expensesSchema.isTrashed, false))
      .groupBy(expensesSchema.category)
      .orderBy(desc(sql<number>`COUNT(*)`)); // Most used categories first

    // Convert array to key-value object
    const result: Record<string, number> = {};
    categories.forEach(row => {
      result[row.category] = row.count;
    });

    log.debug("getCategoriesWithCountsKV: done", { categories: categories.length });
    return result;
  } catch (err) {
    log.error("getCategoriesWithCountsKV: failed", { error: String(err) });
    throw err;
  }
};
