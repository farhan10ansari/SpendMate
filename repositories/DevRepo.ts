import db from '@/db/client';
import { expensesSchema, incomesSchema } from '@/db/schema';
import { paymentMethods } from '@/lib/constants';
import { Category } from '@/lib/types';
// import { useExpenseCategories, useExpenseCategoriesStore } from '@/stores/useExpenseCategoriesStore';
import { dbLog as log } from '@/lib/logger';

/**
 * Seeds the `expenses` table with random dummy data for testing.
 * @param count - Number of dummy expense records to insert
 */
export const seedDummyExpenses = async (categories: Category[], count: number): Promise<void> => {
  try {
    log.debug("seedDummyExpenses: start", { categories: categories.length, count });

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const categoryNames = categories.map(({ name }) => name);
    const paymentMethodNames = paymentMethods.map(({ name }) => name);
    const currencies = ['INR', 'USD', 'EUR'];

    const msSpan = now.getTime() - startOfYear.getTime();
    const expenses = Array.from({ length: count }).map(() => {
      // Random date between start of year and now
      const randomTs = startOfYear.getTime() + Math.random() * msSpan;
      const date = new Date(randomTs);

      return {
        amount: parseFloat((Math.random() * 99 + 1).toFixed(2)),
        dateTime: date,
        description: `Test expense ${Math.random().toString(36).substring(2, 8)}`,
        // Use the exact `name` string for category and paymentMethod
        category: categoryNames[Math.floor(Math.random() * categoryNames.length)],
        paymentMethod: paymentMethodNames[Math.floor(Math.random() * paymentMethodNames.length)],
        receipt: null,
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        isTrashed: false,
      };
    });

    // Bulk insert all generated expenses
    await db.insert(expensesSchema).values(expenses).run();

    log.debug("seedDummyExpenses: done", { inserted: expenses.length });
  } catch (error) {
    log.error("seedDummyExpenses: failed", { error: String(error) });
    throw error;
  }
};

/**
 * Seeds the `incomes` table with random dummy data for testing.
 * Currency is always INR. Source and amount are random.
 * @param count Number of dummy income records to insert
 */
export const seedDummyIncome = async (sources: Category[], count: number): Promise<void> => {
  try {
    log.debug("seedDummyIncome: start", { sources: sources.length, count });

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const sourceNames = sources.map(({ name }) => name);

    // Generate
    const msSpan = now.getTime() - startOfYear.getTime();

    const incomes = Array.from({ length: count }).map(() => {
      // Random date between start of year and now
      const randomTs = startOfYear.getTime() + Math.random() * msSpan;
      const date = new Date(randomTs);

      return {
        amount: parseFloat((Math.random() * 10000 + 100).toFixed(2)), // 100 to 10,100 INR
        dateTime: date,
        description: null,
        receipt: null,
        currency: "INR",
        isTrashed: false,
        source: sourceNames[Math.floor(Math.random() * sourceNames.length)],
      };
    });

    // Bulk insert
    await db.insert(incomesSchema).values(incomes).run();

    log.debug("seedDummyIncome: done", { inserted: incomes.length });
  } catch (error) {
    log.error("seedDummyIncome: failed", { error: String(error) });
    throw error;
  }
};
