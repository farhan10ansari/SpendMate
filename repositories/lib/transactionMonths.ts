import { addMonths, format, parseISO } from 'date-fns';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import db from '@/db/client';
import { expensesSchema, incomesSchema } from '@/db/schema';

/** One grouped query per table in the normal path, using the active-date index. */
export async function getTransactionMonths(table: typeof expensesSchema | typeof incomesSchema) {
  const monthKey = sql<string>`strftime('%Y-%m', ${table.dateTime}, 'unixepoch', 'localtime')`;
  const rows = await db.select({
    monthKey,
    count: sql<number>`COUNT(*)`.mapWith(Number),
    firstTimestamp: sql<number>`MIN(${table.dateTime})`.mapWith(Number),
    lastTimestamp: sql<number>`MAX(${table.dateTime})`.mapWith(Number),
  }).from(table).where(eq(table.isTrashed, false)).groupBy(monthKey).orderBy(desc(monthKey));

  const counts = new Map(rows.map(row => [row.monthKey, row.count]));
  const corrections = new Set<string>();
  for (const row of rows) {
    // SQLite's remapped distant-year DST rules can differ from JavaScript's.
    for (const timestamp of [row.firstTimestamp, row.lastTimestamp]) {
      const actualMonth = format(new Date(timestamp * 1000), 'yyyy-MM');
      if (actualMonth !== row.monthKey) {
        corrections.add(row.monthKey);
        corrections.add(actualMonth);
      }
    }
  }
  // Exceptional local-month mismatches require indexed recounts, not row loading.
  await Promise.all([...corrections].map(async key => {
    const start = parseISO(`${key}-01`);
    const [row] = await db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(table).where(and(
        eq(table.isTrashed, false),
        gte(table.dateTime, start),
        lt(table.dateTime, addMonths(start, 1)),
      ));
    if (row.count > 0) counts.set(key, row.count);
    else counts.delete(key);
  }));

  return [...counts].sort(([a], [b]) => b.localeCompare(a)).map(([monthKey, count]) => ({ monthKey, count }));
}
