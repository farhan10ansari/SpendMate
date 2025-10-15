import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';


/**
 * Drizzle ORM schema for the "expenses" table in SQLite.
 * Tracks user expenses with details like amount, timestamp, description, etc.
 */
export const expensesSchema = sqliteTable('expenses', {
  // Primary key
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }).notNull(),
  // Expense amount
  amount: real('amount').notNull(),
  // Date and time of the transaction
  dateTime: integer('date_time', { mode: 'timestamp' }).notNull(),
  // Optional description or notes
  description: text('description').$type<string | null>(),
  // Payment method (e.g., Cash, Credit Card, UPI, etc.)
  paymentMethod: text('payment_method').$type<string | null>(),
  // Category of the expense (e.g., Food, Travel, etc.)
  category: text('category').notNull(),
  // Optional receipt or invoice path/URL
  receipt: text('receipt').$type<string | null>(),
  // Currency code (e.g., INR, USD)
  currency: text('currency').notNull().default('INR'),
  // Trash flag to mark expenses as deleted without removing them
  isTrashed: integer('is_trashed', { mode: 'boolean' }).notNull().default(false),
  // Timestamps for record creation
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  //  Timestamp for last update
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`)
    .$onUpdate(() => new Date()),
});

export type ExpenseDB = InferInsertModel<typeof expensesSchema>;
export type ExpenseRes = InferSelectModel<typeof expensesSchema>;


/**
* Drizzle ORM schema for the "incomes" table in SQLite.
* Tracks user incomes with details like amount, timestamp, description, etc.
*/
export const incomesSchema = sqliteTable('incomes', {
  // Primary key
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }).notNull(),
  // Income amount
  amount: real('amount').notNull(),
  // Date and time of the transaction
  dateTime: integer('date_time', { mode: 'timestamp' }).notNull(),
  // Optional description or notes
  description: text('description').$type<string | null>(),
  // Source of income (e.g., Salary, Business, etc.)
  source: text('source').notNull(),
  // Receipt or invoice path/URL
  receipt: text('receipt').$type<string | null>(),
  // Currency code (e.g., INR, USD)
  currency: text('currency').notNull().default('INR'),
  // Trash flag to mark incomes as deleted without removing them
  isTrashed: integer('is_trashed', { mode: 'boolean' }).notNull().default(false),
  // Timestamps for record creation
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  //  Timestamp for last update
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`)
    .$onUpdate(() => new Date()),
});

export type IncomeDB = InferInsertModel<typeof incomesSchema>;
export type IncomeRes = InferSelectModel<typeof incomesSchema>;


/**
 * Schema for all categories
 */
export const categoriesSchema = sqliteTable('categories', {
  name: text('name').notNull(),
  label: text('label').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  isCustom: integer('isCustom', { mode: 'boolean' }).notNull().default(true),
  type: text('type').$type<'expense-category' | 'income-source'>().notNull(),
  // Timestamps for record creation
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  //  Timestamp for last update
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`)
    .$onUpdate(() => new Date()),
}, (table) => ([
  primaryKey({ columns: [table.name, table.type] })
]))

export type CategoryDB = InferInsertModel<typeof categoriesSchema>;
export type CategoryRes = InferSelectModel<typeof categoriesSchema>;
