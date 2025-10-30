import { IconSource } from "react-native-paper/lib/typescript/components/Icon";
import { ExpenseRes, IncomeRes, CategoryRes } from '@/db/schema';


export type Category = {
  isCustom: boolean;
  enabled: boolean;
  name: string;
  label: string;
  icon: IconSource;
  color: string;
}

export type CategoryFormData = {
  title: string;
  icon?: IconSource | null;
  color?: string | null;
  isCustom: Category["isCustom"]
}

export type CreateCategoryData = Omit<Category, "enabled" | "isCustom">;
export type UpdateCategoryData = Partial<Omit<Category, "name" | "isCustom">>;


export type IconWithColor = {
  icon: IconSource;
  color: string;
}

export type PaymentMethod = {
  name: "upi" | "cash" | "bank-transfer" | "credit-card" | "other";
  label: string;
  icon: IconSource;
}

export type RootStackParamList = {
  ExpenseInfoScreen: { id: string };
}


/**
 * Supported period keys for filtering stats.
 */
export type PeriodType = "today" | "week" | "month" | "year" | "all-time";

export type StatsPeriod = {
  type: PeriodType;
  offset?: number; // offset from current period, 0 = current, 1 = previous, etc.
};

export type StatsPeriodOption = {
  primaryLabel: string;
  secondaryLabel?: string;
  type: PeriodType;
  offset?: number;
};

export interface ExpenseCategoryStat {
  category: string;
  total: number;
  count: number;
}

export interface PeriodExpenseStats {
  period: StatsPeriod;
  total: number;        // total spend in the period
  avgPerDay: number;    // average spend per calendar day (2 d.p.)
  count: number;        // total number of transactions in the period
  max: number;          // largest single transaction
  min: number;          // smallest single transaction
  categories: ExpenseCategoryStat[]; // breakdown by category (sum + count)
  topCategory: string | null; // category with the highest total spend
}

export interface IncomeSourceStat {
  source: string;
  total: number;
  count: number;
}

export interface PeriodIncomeStats {
  period: StatsPeriod;
  total: number;
  count: number;
  avgPerDay: number;
  max: number;
  min: number;
  sources: IncomeSourceStat[];
  topSource: string | null;
}

export type ColorType = "primary" | "secondary" | "tertiary";

//Expense
export type Expense = {
  id: number;
  amount: number;
  dateTime: Date;
  description: string | null;
  paymentMethod: string | null;
  category: string;
  receipt: string | null;
  currency: string;
  isTrashed: boolean;
}
//Income
export type Income = {
  id: number;
  amount: number;
  dateTime: Date;
  description: string | null;
  receipt: string | null;
  currency: string;
  isTrashed: boolean;
  source: string;
}

// Settings types
export type Language = "english" | "hindi" | "spanish";
// export type Currency = "INR" | "USD" | "EUR";

export interface SettingOption {
  label: string;
  description: string;
  available: boolean;
}
export interface LanguageOption extends SettingOption {
  key: Language;
}


export interface BackupData {
  date: string;
  name: string;
  version: string;
  db: {
    expenses: ExpenseRes[];
    incomes: IncomeRes[];
    categories: CategoryRes[];
  };
  // data: {
  //   settings: Record<string, string>;
  // };
}

export interface BackupMetadata {
  name: string;
  date: string;
  filePath: string;
  fileName: string;
  size: number | null; // Changed to allow null
  recordCount: {
    expenses: number;
    incomes: number;
    categories: number;
  };
}