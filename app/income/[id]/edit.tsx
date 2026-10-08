import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TRANSACTION_FORM_BOTTOM_CLEARANCE } from "@/components/input/ConfirmButton";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import FormSheetHeader from "@/components/main/FormSheetHeader";
import IncomeForm from "@/features/Income/IncomeForm";
import { IncomeData, IncomeStoreProvider } from "@/features/Income/IncomeStoreProvider";
import { getIncomeById } from "@/repositories/IncomeRepo";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useTransactionForm } from "@/hooks/useTransactionForm";

export default function EditIncomeScreen() {
    const navigation = useNavigation();
    const { colors } = useAppTheme();
    const { bottom } = useSafeAreaInsets();
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
        <View style={{ flex: 1, backgroundColor: colors.card }}>
        <IncomeStoreProvider initialIncome={income}>
            <FormSheetHeader
                title="Edit Income"
                onClose={() => navigation.goBack()}
            />
            <KeyboardAwareScrollView
                bottomOffset={80}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: bottom + TRANSACTION_FORM_BOTTOM_CLEARANCE }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
            <IncomeForm
                onSubmit={onSubmit}
                type="edit"
            />
            </KeyboardAwareScrollView>
        </IncomeStoreProvider>
        </View>
    );
}
