import { memo } from 'react';
import { Income } from '@/lib/types';
import { extractDateLabel, extractTimeString } from '@/lib/functions';
import { useIncomeSourceMapping } from '@/contexts/CategoryDataProvider';
import { ThemeType } from '@/themes/theme';
import TransactionListRow from './TransactionListRow';

type IncomeCardProps = {
  income: Income;
  onPress?: (id: number) => void;
  theme: ThemeType;
  uses24HourClock: boolean;
  formatCurrency: (amount: number) => string;
};

export default memo(function IncomeCard({ income, onPress, theme, uses24HourClock, formatCurrency }: IncomeCardProps) {
  const source = useIncomeSourceMapping().get(income.source);
  return <TransactionListRow id={income.id} kind="income" label={source?.label ?? income.source}
    icon={source?.icon || 'cash-plus'} description={income.description}
    metadata={`${extractDateLabel(income.dateTime)} · ${extractTimeString(income.dateTime, uses24HourClock)}`}
    amount={formatCurrency(income.amount)} theme={theme} onPress={onPress} />;
});
