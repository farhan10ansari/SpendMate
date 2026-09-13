import { memo } from 'react';
import { ScaledSize } from 'react-native';
import { paymentMethodsMapping } from '@/lib/constants';
import { extractTimeString } from '@/lib/functions';
import { useExpenseCategoryMapping } from '@/contexts/CategoryDataProvider';
import { Expense } from '@/lib/types';
import { ThemeType } from '@/themes/theme';
import TransactionListRow from './TransactionListRow';

type ExpenseCardProps = {
  expense: Expense;
  onPress?: (id: number) => void;
  theme: ThemeType;
  uses24HourClock: boolean;
  formatCurrency: (amount: number) => string;
  dimensions: ScaledSize;
};

export default memo(function ExpenseCard({ expense, onPress, theme, uses24HourClock, formatCurrency, dimensions }: ExpenseCardProps) {
  const category = useExpenseCategoryMapping().get(expense.category);
  const payment = expense.paymentMethod && dimensions.width > 400 && dimensions.fontScale <= 1.2
    ? paymentMethodsMapping[expense.paymentMethod]?.label : null;
  const time = extractTimeString(expense.dateTime, uses24HourClock);
  return <TransactionListRow id={expense.id} kind="expense" label={category?.label ?? expense.category}
    icon={category?.icon || 'receipt-text-outline'} description={expense.description}
    metadata={payment ? `${time} · ${payment}` : time} amount={formatCurrency(expense.amount)}
    theme={theme} onPress={onPress} />;
});
