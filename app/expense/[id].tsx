import React from "react";
import { ThemedText } from "@/components/base/ThemedText";
import { ThemedView } from "@/components/base/ThemedView";
import TransactionDetails from "@/components/main/TransactionDetails";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { useLocalization } from "@/hooks/useLocalization";
import { paymentMethodsMapping } from "@/lib/constants";
import { extractDateLabel, extractTimeString } from "@/lib/functions";
import { softDeleteExpenseById, getExpenseById } from "@/repositories/ExpenseRepo";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { tryCatch } from "@/lib/try-catch";
import FormSheetHeader from "@/components/main/FormSheetHeader";
import { useHaptics } from "@/contexts/HapticsProvider";
import { useExpenseCategoryMapping } from "@/contexts/CategoryDataProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSnackbar } from "@/contexts/GlobalSnackbarProvider";
import { useConfirmation } from "@/components/main/ConfirmationDialog";

export default function ExpenseInfoScreen() {
    const { colors } = useAppTheme();
    const { formatCurrency, currencyCode } = useCurrency();
    const { uses24HourClock } = useLocalization();
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { showSnackbar } = useSnackbar()
    const { showConfirmationDialog } = useConfirmation()


    const categoryMapping = useExpenseCategoryMapping()
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { hapticImpact, hapticNotify } = useHaptics()

    const { data: expense, isPending, isError, error } = useQuery({
        queryKey: ['expense', id],
        queryFn: async () => getExpenseById(id),
        enabled: !!id,
        staleTime: 0
    });

    const styles = StyleSheet.create({
        container: {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom,
        },
        mainContainer: {
            paddingHorizontal: 20,
            paddingTop: 10,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            color: colors.primary
        },
    });

    const handleDelete = async () => {
        const { error } = await tryCatch(softDeleteExpenseById(id))
        if (error) {
            hapticNotify("error");
            showSnackbar({
                message: 'Failed to delete expense',
                duration: 2000,
                actionLabel: 'Dismiss',
                actionIcon: 'close',
                type: 'error',
                position: 'top',
                offset: 10,
            });
        }
        else {
            hapticNotify("success");
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['stats', 'expenses'] });
            queryClient.invalidateQueries({ queryKey: ["stats", "available-periods"] });
            navigation.goBack()
            showSnackbar({
                message: 'Expense deleted',
                duration: 2000,
                actionLabel: 'Dismiss',
                actionIcon: 'close',
                type: 'success',
                position: 'bottom',
                offset: 70,
            }, 300);

        }
    }

    const handleShowDeleteConfirmation = () => {
        hapticImpact()
        showConfirmationDialog({
            title: "Delete Expense?",
            message: <ThemedText>Are you sure you want to delete this expense? This action cannot be undone.</ThemedText>,
            type: 'error',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: handleDelete,
            onCancel: () => { },
            showCancel: true,
        })
    }

    const handleEdit = () => {
        hapticImpact("light");
        router.push(`/expense/${id}/edit`);
    }

    if (isError) {
        return (
            <ThemedView style={[styles.mainContainer, { minHeight: 200 }]}>
                <ThemedText type="title" style={styles.title} color={colors.error}>Error</ThemedText>
                <ThemedText>{error instanceof Error ? error.message : "An unexpected error occurred."}</ThemedText>
            </ThemedView>
        );
    }

    const timeString = expense?.dateTime ? extractTimeString(expense?.dateTime, uses24HourClock) : "";
    const dateLabel = expense?.dateTime ? extractDateLabel(expense?.dateTime) : ""
    const categoryDef = expense?.category ? categoryMapping.get(expense.category) : null;


    return (
        <ThemedView style={styles.container}>
            <FormSheetHeader title="Expense details" onClose={() => navigation.goBack()} />
            {isPending ? (
                <ThemedView style={[styles.mainContainer, { paddingVertical: 32 }]}>
                    <ActivityIndicator accessibilityLabel="Loading expense" />
                </ThemedView>
            ) : expense && !expense.isTrashed ? (
                <TransactionDetails
                    kind="expense"
                    amount={formatCurrency(expense.amount)}
                    category={categoryDef?.label ?? "Unknown category"}
                    categoryIcon={categoryDef?.icon}
                    date={dateLabel || 'Not provided'}
                    time={timeString || 'Not provided'}
                    currency={currencyCode}
                    notes={expense.description}
                    paymentMethod={expense.paymentMethod ? paymentMethodsMapping[expense.paymentMethod]?.label : undefined}
                    paymentIcon={expense.paymentMethod ? paymentMethodsMapping[expense.paymentMethod]?.icon : undefined}
                    onEdit={handleEdit}
                    onDelete={handleShowDeleteConfirmation}
                />
            ) : (
                <ThemedView style={[styles.mainContainer, { minHeight: 200, paddingTop: 40 }]}>
                    <ThemedText type="title" style={styles.title} color={colors.error}>Expense Not Found</ThemedText>
                    <ThemedText centered>This expense is no longer available.</ThemedText>
                </ThemedView>
            )}
        </ThemedView>
    );
}
