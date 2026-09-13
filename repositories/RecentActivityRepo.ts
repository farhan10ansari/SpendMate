import { and, desc, eq, gte, lte } from 'drizzle-orm';
import db from '@/db/client';
import { expensesSchema, incomesSchema } from '@/db/schema';
import { StatsPeriod } from '@/lib/types';
import { getPeriodStartEnd } from './lib/helpers';

export const RECENT_ACTIVITY_LIMIT = 5;

export type RecentActivity = {
  id: number;
  kind: 'expense' | 'income';
  amount: number;
  dateTime: Date;
  category: string;
  description: string | null;
};

export async function getRecentActivity(kind: RecentActivity['kind'], period: StatsPeriod): Promise<RecentActivity[]> {
  const table = kind === 'expense' ? expensesSchema : incomesSchema;
  const { start, end } = getPeriodStartEnd(period);
  const conditions = [eq(table.isTrashed, false)];
  if (start) conditions.push(gte(table.dateTime, start));
  if (end) conditions.push(lte(table.dateTime, end));
  const rows = await db.select({
    id: table.id,
    amount: table.amount,
    dateTime: table.dateTime,
    category: kind === 'expense' ? expensesSchema.category : incomesSchema.source,
    description: table.description,
  }).from(table).where(and(...conditions))
    .orderBy(desc(table.dateTime), desc(table.id)).limit(RECENT_ACTIVITY_LIMIT);
  return rows.map(row => ({ ...row, kind }));
}

// Each input is already ordered by SQLite. Merge only the visible entries.
export function mergeRecentActivity(expenses: RecentActivity[], incomes: RecentActivity[]): RecentActivity[] {
  const result: RecentActivity[] = [];
  let expenseIndex = 0;
  let incomeIndex = 0;
  while (result.length < RECENT_ACTIVITY_LIMIT && (expenseIndex < expenses.length || incomeIndex < incomes.length)) {
    const expense = expenses[expenseIndex];
    const income = incomes[incomeIndex];
    if (!income || (expense && expense.dateTime.getTime() >= income.dateTime.getTime())) {
      result.push(expense);
      expenseIndex++;
    } else {
      result.push(income);
      incomeIndex++;
    }
  }
  return result;
}
