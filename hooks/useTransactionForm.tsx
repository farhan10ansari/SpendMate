import { useNavigation } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { tryCatch } from "@/lib/try-catch";
import { addExpense, updateExpenseById } from "@/repositories/ExpenseRepo";
import { addIncome, updateIncomeById } from "@/repositories/IncomeRepo";
import { ExpenseData } from "@/features/Expense/ExpenseStoreProvider";
import { IncomeData } from "@/features/Income/IncomeStoreProvider";
import { useHaptics } from "@/contexts/HapticsProvider";
// import { sortExpenseCategoriesByUsage, sortIncomeSourcesByUsage } from "@/lib/helpers";
import { useSnackbar } from "@/contexts/GlobalSnackbarProvider";
import { validateExpenseData, validateIncomeData } from "@/lib/validations";
import { Expense, Income } from "@/lib/types";
import { CustomSnackbarProps } from "@/components/ui/CustomSnackbar";
import { useKeyboardState } from "react-native-keyboard-controller";

export function useTransactionForm() {
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const { colors } = useAppTheme();
    const { hapticNotify } = useHaptics();
    const { showSnackbar } = useSnackbar();
    const keyboard = useKeyboardState();


    const showErrorSnackbar = (message: string, position: CustomSnackbarProps["position"] = "bottom") => {
        showSnackbar({
            message,
            duration: 3000,
            type: 'error',
            position,
            offset: keyboard.height,
        });
    };

    const showSuccessAndNavigate = (message: string, position: CustomSnackbarProps["position"] = "bottom", delay = 300) => {
        hapticNotify('success');
        navigation.goBack();
        showSnackbar({
            message,
            duration: 2000,
            actionLabel: 'Dismiss',
            actionIcon: 'close',
            type: 'success',
            position,
            offset: position === 'top' ? 10 : 70,
        }, delay);
    };

    // Check if expense data has changed
    const hasExpenseChanged = (existing: Expense, updated: ExpenseData): boolean => {
        const actualAmount = parseFloat(updated.amount || '0');
        return (
            existing.amount !== actualAmount ||
            existing.category !== updated.category ||
            existing.description !== updated.description ||
            new Date(existing.dateTime).getTime() !== new Date(updated.datetime!).getTime() ||
            existing.paymentMethod !== updated.paymentMethod
        );
    };

    // Check if income data has changed
    const hasIncomeChanged = (existing: Income, updated: IncomeData): boolean => {
        const actualAmount = parseFloat(updated.amount || '0');
        return (
            existing.amount !== actualAmount ||
            existing.source !== updated.source ||
            existing.description !== updated.description ||
            new Date(existing.dateTime).getTime() !== new Date(updated.dateTime!).getTime() ||
            (existing.receipt ?? null) !== (updated.receipt ?? null) ||
            (existing.currency ?? "INR") !== (updated.currency ?? "INR")
        );
    };

    const handleAddExpense = async (expense: ExpenseData) => {
        const validation = validateExpenseData(expense);
        if (!validation.isValid) {
            hapticNotify('warning');
            showErrorSnackbar(validation.errorMessage!);
            return;
        }

        const { amount, category, description, datetime, paymentMethod } = expense;
        const actualAmount = parseFloat(amount!);

        const { data, error } = await tryCatch(addExpense({
            amount: actualAmount,
            dateTime: datetime!,
            description: description,
            paymentMethod: paymentMethod,
            category: category!,
        }));

        if (error) {
            hapticNotify('error');
            showErrorSnackbar('Failed to add expense. Please try again.');
            return;
        }

        showSuccessAndNavigate('Expense added');
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['stats', 'expenses'] });
        queryClient.invalidateQueries({ queryKey: ["stats", "available-periods"] });
        // sortExpenseCategoriesByUsage();
    };

    const handleAddIncome = async (income: IncomeData) => {
        const validation = validateIncomeData(income);
        if (!validation.isValid) {
            hapticNotify('warning');
            showErrorSnackbar(validation.errorMessage!);
            return;
        }

        const { amount, source, description, dateTime, receipt, currency } = income;
        const actualAmount = parseFloat(amount!);

        const { data, error } = await tryCatch(addIncome({
            amount: actualAmount,
            dateTime: dateTime!,
            source: source!,
            description: description ?? "",
            receipt: receipt ?? null,
            currency: currency ?? 'INR',
        }));

        if (error) {
            hapticNotify('error');
            showErrorSnackbar('Failed to add income. Please try again.');
            return;
        }

        showSuccessAndNavigate('Income added');
        queryClient.invalidateQueries({ queryKey: ['incomes'] });
        queryClient.invalidateQueries({ queryKey: ['stats', 'incomes'] });
        queryClient.invalidateQueries({ queryKey: ["stats", "available-periods"] });
        // sortIncomeSourcesByUsage();
    };

    const handleUpdateExpense = async (id: string, existingExpense: Expense, updatedExpense: ExpenseData) => {
        const validation = validateExpenseData(updatedExpense);
        if (!validation.isValid) {
            hapticNotify('warning');
            showErrorSnackbar(validation.errorMessage!);
            return;
        }

        if (!hasExpenseChanged(existingExpense, updatedExpense)) {
            hapticNotify('warning');
            showErrorSnackbar('No changes detected.');
            return;
        }

        const { amount, category, description, datetime, paymentMethod } = updatedExpense;
        const actualAmount = parseFloat(amount!);

        const { error } = await tryCatch(updateExpenseById(id, {
            amount: actualAmount,
            dateTime: datetime!,
            description,
            paymentMethod,
            category: category!,
        }));

        if (error) {
            hapticNotify('error');
            showErrorSnackbar('Failed to update expense. Please try again.');
            return;
        }

        showSuccessAndNavigate('Expense updated', 'top');
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['stats', 'expenses'] });
        queryClient.invalidateQueries({ queryKey: ["stats", "available-periods"] });
        queryClient.invalidateQueries({ queryKey: ['expense', id] })

    };

    const handleUpdateIncome = async (id: string, existingIncome: Income, updatedIncome: IncomeData) => {
        const validation = validateIncomeData(updatedIncome);
        if (!validation.isValid) {
            hapticNotify('warning');
            showErrorSnackbar(validation.errorMessage!);
            return;
        }

        if (!hasIncomeChanged(existingIncome, updatedIncome)) {
            hapticNotify('warning');
            showErrorSnackbar('No changes detected.');
            return;
        }

        const { amount, source, description, dateTime, receipt, currency } = updatedIncome;
        const actualAmount = parseFloat(amount!);

        const { error } = await tryCatch(updateIncomeById(id, {
            amount: actualAmount,
            dateTime: dateTime!,
            source: source!,
            description: description ?? null,
            receipt: receipt ?? null,
            currency: currency ?? "INR",
        }));

        if (error) {
            hapticNotify('error');
            showErrorSnackbar('Failed to update income. Please try again.');
            return;
        }

        showSuccessAndNavigate('Income updated', 'top');
        queryClient.invalidateQueries({ queryKey: ['incomes'] });
        queryClient.invalidateQueries({ queryKey: ['stats', 'incomes'] });
        queryClient.invalidateQueries({ queryKey: ["stats", "available-periods"] });
        queryClient.invalidateQueries({ queryKey: ['income', id] })
    };

    return {
        colors,
        handleAddExpense,
        handleAddIncome,
        handleUpdateExpense,
        handleUpdateIncome,
    };
}
