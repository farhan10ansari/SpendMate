import db from '@/db/client';
import { ExpenseDB, ExpenseRes, expensesSchema } from '@/db/schema';
import { and, desc, eq, gte, sql, lte, lt, asc } from 'drizzle-orm';
import { getPeriodStartEnd } from './lib/helpers';
import { StatsPeriod, PeriodExpenseStats } from '@/lib/types';
import { startOfMonth, endOfMonth, subMonths, format, differenceInMonths } from 'date-fns';
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

// Get paginated expenses
export const getExpensesByMonthPaginated = async ({
  offsetMonth = 0,
}: {
  offsetMonth: number;
}): Promise<{
  expenses: ExpenseRes[];
  hasMore: boolean;
  offsetMonth: number;
  month: string;
}> => {
  try {
    const now = new Date();
    // 1) Compute the requested month’s start/end
    const requestedTarget = subMonths(now, offsetMonth);
    const requestedStart = startOfMonth(requestedTarget);
    const requestedEnd = endOfMonth(requestedTarget);
    const label = format(requestedStart, 'MMMM yyyy');

    log.debug("getExpensesByMonthPaginated: start", { offsetMonth, month: label });

    // 2) Fetch that month's expenses
    const expenses = await db
      .select()
      .from(expensesSchema)
      .where(
        and(
          eq(expensesSchema.isTrashed, false),
          gte(expensesSchema.dateTime, requestedStart),
          lte(expensesSchema.dateTime, requestedEnd),
        )
      )
      .orderBy(desc(expensesSchema.dateTime));

    // 3) Compute hasMore: do we have any records older than this month's start?
    const olderAny = await db
      .select({ id: expensesSchema.id })
      .from(expensesSchema)
      .where(
        and(
          eq(expensesSchema.isTrashed, false),
          lt(expensesSchema.dateTime, requestedStart),
        )
      )
      .limit(1);

    const result = {
      expenses,
      hasMore: olderAny.length > 0,
      offsetMonth,
      month: label,
    };

    log.debug("getExpensesByMonthPaginated: done", { count: expenses.length, hasMore: result.hasMore });
    return result;
  } catch (err) {
    log.error("getExpensesByMonthPaginated: failed", { error: String(err), offsetMonth });
    throw err;
  }
};

// Get list of months having expenses
export const getAvailableExpenseMonths = async (): Promise<{
  offsetMonth: number;
  month: string;
  count: number;
}[]> => {
  try {
    log.debug("getAvailableExpenseMonths: start");

    const now = new Date();
    const availableMonths: { offsetMonth: number; month: string; count: number }[] = [];
    let currentOffset = 0;

    // Walk back in time month-by-month based on data availability
    while (true) {
      // 1) Compute the current month's start/end
      const requestedTarget = subMonths(now, currentOffset);
      const requestedStart = startOfMonth(requestedTarget);
      const requestedEnd = endOfMonth(requestedTarget);
      // 2) Check if this month has expenses
      const monthExpenses = await db
        .select({ id: expensesSchema.id })
        .from(expensesSchema)
        .where(
          and(
            eq(expensesSchema.isTrashed, false),
            gte(expensesSchema.dateTime, requestedStart),
            lte(expensesSchema.dateTime, requestedEnd),
          )
        );

      // 3) If month has expenses, add it to available months
      if (monthExpenses.length > 0) {
        availableMonths.push({
          offsetMonth: currentOffset,
          month: format(requestedStart, 'MMMM yyyy'),
          count: monthExpenses.length,
        });
      }

      // 4) Check if there are more months with data
      const olderAny = await db
        .select({ dt: expensesSchema.dateTime })
        .from(expensesSchema)
        .where(
          and(
            eq(expensesSchema.isTrashed, false),
            lt(expensesSchema.dateTime, requestedStart),
          )
        )
        .orderBy(desc(expensesSchema.dateTime))
        .limit(1);

      // 5) If no more data, break
      if (olderAny.length === 0) {
        break;
      }

      // 6) Update offset to the month of the next older expense
      const nextOlderDate = olderAny[0].dt;
      currentOffset = differenceInMonths(now, startOfMonth(nextOlderDate));
    }

    // Sort by offset (newest first)
    const sorted = availableMonths.sort((a, b) => a.offsetMonth - b.offsetMonth);
    log.debug("getAvailableExpenseMonths: done", { months: sorted.length });
    return sorted;
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
    const { start, end } = getPeriodStartEnd(period);
    const msPerDay = 1000 * 60 * 60 * 24;
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

    // Calculate the total days in the period (inclusive)
    let days: number;
    if (startDate && endDate) {
      days = Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
    } else {
      days = 0;
    }


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
