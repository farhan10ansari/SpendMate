import React from "react";
import { ThemedText } from "@/components/base/ThemedText";
import { ThemedView } from "@/components/base/ThemedView";
import TransactionDetails from "@/components/main/TransactionDetails";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { useLocalization } from "@/hooks/useLocalization";
import { extractDateLabel, extractTimeString } from "@/lib/functions";
import { softDeleteIncomeById, getIncomeById } from "@/repositories/IncomeRepo";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { tryCatch } from "@/lib/try-catch";
import FormSheetHeader from "@/components/main/FormSheetHeader";
import { useHaptics } from "@/contexts/HapticsProvider";
import { useIncomeSourceMapping } from "@/contexts/CategoryDataProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSnackbar } from "@/contexts/GlobalSnackbarProvider";
import { useConfirmation } from "@/components/main/ConfirmationDialog";


export default function IncomeInfoScreen() {
    const { colors } = useAppTheme();
    const { formatCurrency, currencyCode } = useCurrency();
    const { uses24HourClock } = useLocalization();
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { showSnackbar } = useSnackbar()
    const { showConfirmationDialog } = useConfirmation()

    const sourceMapping = useIncomeSourceMapping()
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { hapticImpact, hapticNotify } = useHaptics()

    const { data: income, isPending, isError, error } = useQuery({
        queryKey: ['income', id],
        queryFn: async () => getIncomeById(id),
        enabled: !!id,
        staleTime: Infinity,
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
            color: colors.tertiary
        },
    });

    const handleDelete = async () => {
        const { error } = await tryCatch(softDeleteIncomeById(id));
        if (error) {
            hapticNotify("error");
            showSnackbar({
                message: "Failed to delete income",
                duration: 2000,
                actionLabel: 'Dismiss',
                actionIcon: 'close',
                type: 'error',
                position: 'top',
                offset: 10,
            });
        } else {
            hapticNotify("success");
            queryClient.invalidateQueries({ queryKey: ['incomes'] });
            queryClient.invalidateQueries({ queryKey: ['stats', 'incomes'] });
            queryClient.invalidateQueries({ queryKey: ["stats", "available-periods"] });
            navigation.goBack();

            showSnackbar({
                message: 'Income deleted',
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
            title: "Delete Income?",
            message: <ThemedText>Are you sure you want to delete this income? This action cannot be undone.</ThemedText>,
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
        router.push(`/income/${id}/edit`);
    }

    if (isError) {
        return (
            <ThemedView style={[styles.mainContainer, { minHeight: 200 }]}>
                <ThemedText type="title" style={styles.title} color={colors.error}>Error</ThemedText>
                <ThemedText>{error instanceof Error ? error.message : "An unexpected error occurred."}</ThemedText>
            </ThemedView>
        );
    }

    const timeString = income?.dateTime ? extractTimeString(income?.dateTime, uses24HourClock) : "";
    const dateLabel = income?.dateTime ? extractDateLabel(income?.dateTime) : "";
    const sourceDef = income?.source ? sourceMapping.get(income.source) : null;

    return (
        <ThemedView style={styles.container}>
            <FormSheetHeader title="Income details" onClose={() => navigation.goBack()} />
            {isPending ? (
                <ThemedView style={[styles.mainContainer, { paddingVertical: 32 }]}>
                    <ActivityIndicator accessibilityLabel="Loading income" />
                </ThemedView>
            ) : income && !income.isTrashed ? (
                <TransactionDetails
                    kind="income"
                    amount={formatCurrency(income.amount)}
                    category={sourceDef?.label ?? "Unknown source"}
                    categoryIcon={sourceDef?.icon}
                    date={dateLabel || 'Not provided'}
                    time={timeString || 'Not provided'}
                    currency={currencyCode}
                    notes={income.description}
                    onEdit={handleEdit}
                    onDelete={handleShowDeleteConfirmation}
                />
            ) : (
                <ThemedView style={[styles.mainContainer, { minHeight: 200, paddingTop: 40 }]}>
                    <ThemedText type="title" style={styles.title} color={colors.error}>Income Not Found</ThemedText>
                    <ThemedText centered>This income is no longer available.</ThemedText>
                </ThemedView>
            )}
        </ThemedView>
    );
}
