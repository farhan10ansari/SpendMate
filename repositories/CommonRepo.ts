import { format, parseISO } from 'date-fns';
import { expensesSchema, incomesSchema } from '@/db/schema';
import { StatsPeriodOption } from '@/lib/types';
import { getTransactionMonths } from './lib/transactionMonths';

export const getAvailablePeriodsWithData = async (): Promise<{
  months: StatsPeriodOption[];
  years: StatsPeriodOption[];
}> => {
  const [expenses, incomes] = await Promise.all([
    getTransactionMonths(expensesSchema),
    getTransactionMonths(incomesSchema),
  ]);
  const monthKeys = [...new Set([...expenses, ...incomes].map(row => row.monthKey))].sort().reverse();
  const yearKeys = [...new Set(monthKeys.map(key => key.slice(0, 4)))];

  return {
    months: monthKeys.map(calendarKey => ({
      type: 'month',
      calendarKey,
      primaryLabel: format(parseISO(`${calendarKey}-01`), 'MMMM'),
      secondaryLabel: calendarKey.slice(0, 4),
    })),
    years: yearKeys.map(calendarKey => ({ type: 'year', calendarKey, primaryLabel: calendarKey })),
  };
};
