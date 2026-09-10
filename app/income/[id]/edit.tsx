import FormSheetHeader from "@/components/main/FormSheetHeader";
import IncomeForm from "@/features/Income/IncomeForm";
import { IncomeData, IncomeStoreProvider } from "@/features/Income/IncomeStoreProvider";
import { getIncomeById } from "@/repositories/IncomeRepo";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useTransactionForm } from "@/hooks/useTransactionForm";

export default function EditIncomeScreen() {
    const navigation = useNavigation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { handleUpdateIncome } = useTransactionForm();

    const { data: income } = useQuery({
        queryKey: ['income', id],
        queryFn: async () => getIncomeById(id),
        enabled: !!id,
        staleTime: Infinity,
    });

    const onSubmit = async (updated: IncomeData) => {
        if (!income) return;
        await handleUpdateIncome(id!, income, updated);
    };

    return (
        <IncomeStoreProvider initialIncome={income}>
            <FormSheetHeader
                title="Edit Income"
                onClose={() => navigation.goBack()}
            />
            <IncomeForm
                onSubmit={onSubmit}
                type="edit"
            />
        </IncomeStoreProvider>
    );
}
