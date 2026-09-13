import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import React, { useEffect } from 'react';
import Color from 'color';
import { StyleSheet, View } from 'react-native';
import AmountInput from '@/components/input/AmountInput';
import CategoriesInput from '@/components/input/CategoriesInput';
import ConfirmButton from '@/components/input/ConfirmButton';
import DateInput from '@/components/input/DateInput';
import NotesInput from '@/components/input/NotesInput';
import PaymentMethodInput from '@/components/input/PaymentMethodInput';
import TimeInput from '@/components/input/TimeInput';
import { ExpenseData, useExpenseStore } from './ExpenseStoreProvider';
import { useEnabledExpenseCategories } from '@/contexts/CategoryDataProvider';
import { useIsFocused } from 'expo-router/react-navigation';
import { useSnackbarState } from '@/contexts/GlobalSnackbarProvider';

type ExpenseFormProps = {
  onSubmit?: (expense: ExpenseData) => void;
  type?: 'create' | 'edit';
  isActive?: boolean;
}

export default function ExpenseForm({ onSubmit, type = "create", isActive = true }: ExpenseFormProps) {
  const { colors, dark } = useAppTheme();
  const isFocused = useIsFocused()
  const globalSnackbar = useSnackbarState()

  const expense = useExpenseStore((state) => state.expense);
  const updateExpense = useExpenseStore((state) => state.updateExpense);
  const categories = useEnabledExpenseCategories()




  // Set default date and time
  useEffect(() => {
    if (!expense.datetime) {
      updateExpense({ datetime: new Date() });
    }
  }, [])

  const handleSubmit = () => onSubmit?.(expense);

  return (
    <View style={styles.container}>
      <View
        style={{ flex: 1 }}
      // onTouchStart={() => Keyboard.dismiss()}
      >
        {/* Amount */}
        <View style={[styles.amountContainer, { backgroundColor: dark ? colors.primaryContainer : Color(colors.surface).mix(Color(colors.primaryContainer), 0.16).hex() }]}>
          <ThemedText type='defaultSemiBold' style={[styles.sectionTitle, styles.amountTitle, { color: colors.muted }]}>
            Expense amount <ThemedText color={colors.error}>*</ThemedText>
          </ThemedText>
          <AmountInput
            amount={expense.amount}
            setAmount={(amount) => updateExpense({ amount })}
          />
        </View>
        {/* Categories */}
        <View style={[styles.categoriesContainer, { backgroundColor: colors.surface, borderRadius: 18, padding: 10 }]}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.muted }]}>
            Categories <ThemedText color={colors.error}>*</ThemedText>
          </ThemedText>
          <CategoriesInput
            categories={categories}
            category={expense.category}
            setCategory={(category) => updateExpense({ category })}
            type='expense'
          />
        </View>
        {/* Notes */}
        <View style={[styles.notesContainer, { backgroundColor: colors.surface, borderRadius: 18, padding: 10 }]}>
          <ThemedText type='defaultSemiBold' style={[styles.sectionTitle, { color: colors.muted }]}>
            Notes
          </ThemedText>
          <NotesInput
            note={expense.description}
            setNote={(description => updateExpense({ description }))}
          />
        </View>
        {/* Payment Method */}
        <View style={[styles.notesContainer, { backgroundColor: colors.surface, borderRadius: 18, padding: 10 }]}>
          <ThemedText type='defaultSemiBold' style={[styles.sectionTitle, { color: colors.muted }]}>
            Payment Method
          </ThemedText>
          <PaymentMethodInput paymentMethod={expense.paymentMethod} setPaymentMethod={(paymentMethod => updateExpense({ paymentMethod }))} />
        </View>
        {/* Date & Time */}
        <View style={[styles.datetimeContainer, { backgroundColor: colors.surface, borderRadius: 18, padding: 10 }]}>
          <ThemedText type='defaultSemiBold' style={[styles.sectionTitle, { color: colors.muted }]}>
            Date & Time
          </ThemedText>
          <View style={styles.datetimeMain}>
            <DateInput datetime={expense.datetime ?? undefined} setDatetime={(datetime => updateExpense({ datetime }))} style={styles.datetimeInputContainer} />
            <TimeInput datetime={expense.datetime ?? undefined} setDatetime={(datetime => updateExpense({ datetime }))} style={styles.datetimeInputContainer} />
          </View>
        </View>
      </View>


      {/* Confirm Button */}
      {isActive && isFocused && !globalSnackbar && (
        <ConfirmButton
          onPress={handleSubmit}
          type={type}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    position: 'relative',
  },
  sectionTitle: {
    width: '100%',
    textAlign: 'left',
    marginBottom: 6,
    fontSize: 12,
    lineHeight: 18
  },
  amountTitle: { textAlign: 'center' },
  amountContainer: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginTop: 10,
    gap: 2,
  },
  notesContainer: {
    marginTop: 10,
  },
  datetimeContainer: {
    marginTop: 10,
  },
  datetimeMain: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 10,
  },
  datetimeInputContainer: {
    minWidth: 140,
    flex: 1,
  }
});
