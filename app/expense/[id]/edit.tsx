import FormSheetHeader from "@/components/main/FormSheetHeader";
import ExpenseForm from "@/features/Expense/ExpenseForm";
import { ExpenseData, ExpenseStoreProvider } from "@/features/Expense/ExpenseStoreProvider";
import { getExpenseById } from "@/repositories/ExpenseRepo";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useTransactionForm } from "@/hooks/useTransactionForm";

export default function EditExpenseScreen() {
    const navigation = useNavigation();
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
        <ExpenseStoreProvider initialExpense={expense}>
            <FormSheetHeader
                title="Edit Expense"
                onClose={() => navigation.goBack()}
            />
            <ExpenseForm
                onSubmit={onSubmit}
                type="edit"
            />
        </ExpenseStoreProvider>
    );
}
