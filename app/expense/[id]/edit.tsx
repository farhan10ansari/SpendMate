import { useLayoutEffect } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView, useKeyboardState } from "react-native-keyboard-controller";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import FormSheetHeader from "@/components/main/FormSheetHeader";
import ExpenseForm from "@/features/Expense/ExpenseForm";
import { ExpenseData, ExpenseStoreProvider } from "@/features/Expense/ExpenseStoreProvider";
import { getExpenseById } from "@/repositories/ExpenseRepo";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useTransactionForm } from "@/hooks/useTransactionForm";

export default function EditExpenseScreen() {
    const navigation = useNavigation();
    const { colors } = useAppTheme();
    const keyboardVisible = useKeyboardState(state => state.isVisible);

    useLayoutEffect(() => {
        navigation.setOptions({
            sheetAllowedDetents: keyboardVisible ? [1] : [0.75, 1],
        });
    }, [navigation, keyboardVisible]);
    const { id } = useLocalSearchParams<{ id: string }>();
    const { handleUpdateExpense } = useTransactionForm();

    const { data: expense } = useQuery({
        queryKey: ['expense', id],
        queryFn: async () => getExpenseById(id),
        enabled: !!id,
        staleTime: Infinity,
    });

    const onSubmit = async (updated: ExpenseData) => {
        if (!expense) return;
        await handleUpdateExpense(id!, expense, updated);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.card }}>
        <ExpenseStoreProvider initialExpense={expense}>
            <FormSheetHeader
                title="Edit Expense"
                onClose={() => navigation.goBack()}
            />
            <KeyboardAwareScrollView
                bottomOffset={80}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
            <ExpenseForm
                onSubmit={onSubmit}
                type="edit"
            />
            </KeyboardAwareScrollView>
        </ExpenseStoreProvider>
        </View>
    );
}
