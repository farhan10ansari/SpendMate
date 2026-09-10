import React from "react";
import { ThemedText } from "@/components/base/ThemedText";
import { ThemedView } from "@/components/base/ThemedView";
import CustomChip from "@/components/ui/CustomChip";
import { useLocalization } from "@/hooks/useLocalization";
import { paymentMethodsMapping } from "@/lib/constants";
import { extractDateLabel, extractTimeString } from "@/lib/functions";
import { softDeleteExpenseById, getExpenseById } from "@/repositories/ExpenseRepo";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Icon } from "react-native-paper";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { tryCatch } from "@/lib/try-catch";
import FormSheetHeader from "@/components/main/FormSheetHeader";
import { useHaptics } from "@/contexts/HapticsProvider";
import { useExpenseCategoryMapping } from "@/contexts/CategoryDataProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSnackbar } from "@/contexts/GlobalSnackbarProvider";
import { useConfirmation } from "@/components/main/ConfirmationDialog";

export default function ExpenseInfoScreen() {
    const { colors } = useAppTheme();
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

    const { data: expense, isError, error } = useQuery({
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
        amountContentContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0,
        },
        buttonContainer: {
            paddingVertical: 30,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
        },
        button: {
            width: '45%',
            maxWidth: 200,
        },
        editButton: {
        },
        editBUttonText: {
        },
        deleteButton: {
            backgroundColor: colors.error,
        },
        deleteButtonText: {
            color: colors.onError,
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
    const formattedDateTime = expense?.dateTime ? `${dateLabel} at ${timeString}` : "Not Provided";
    const categoryDef = expense?.category ? categoryMapping.get(expense.category) : null;


    return (
        <ThemedView style={styles.container}>
            <FormSheetHeader
                title="Expense Info"
                onClose={() => navigation.goBack()}
            />
            {
                !expense?.isTrashed ? (
                    <View style={styles.mainContainer}>
                        <View>
                            {/* Amount */}
                            <InfoRow
                                label="Amount"
                                content={
                                    <View style={styles.amountContentContainer}>
                                        <Icon source="currency-inr" size={24} color={colors.primary} />
                                        <ThemedText type="defaultSemiBold" color={colors.primary} fontSize={24}>
                                            {expense?.amount ? expense.amount.toLocaleString() : "Not Provided"}
                                        </ThemedText>
                                    </View>
                                }
                            />
                            {/* Category */}
                            <InfoRow
                                label="Category"
                                content={expense?.category ?
                                    <CustomChip
                                        size="default"
                                        variant={categoryDef?.color}
                                        icon={categoryDef?.icon ?? undefined}
                                        label={categoryDef?.label ?? "Unknown Category"}
                                    /> : "Not Provided"}
                            />
                            {/* Notes */}
                            <InfoRow
                                label="Notes"
                                content={expense?.description ? <ThemedText>
                                    {expense?.description}
                                </ThemedText> : "Not Provided"}
                                layout={expense?.description ? "vertical" : "horizontal"}
                                scrollable
                                height={100}
                            />

                            {/* Payment Method */}
                            <InfoRow label="Payment Method" content={expense?.paymentMethod ?
                                <CustomChip
                                    size="default"
                                    variant="tertiary"
                                    icon={paymentMethodsMapping?.[expense.paymentMethod]?.icon}
                                    label={paymentMethodsMapping?.[expense.paymentMethod]?.label}
                                /> : "Not Provided"
                            } />
                            {/* Date & Time */}
                            <InfoRow label="Date & Time" content={formattedDateTime} />
                            {/* Action */}
                            <View style={styles.buttonContainer}>
                                <Button
                                    mode="elevated"
                                    style={[styles.button, styles.editButton]}
                                    labelStyle={styles.editBUttonText}
                                    rippleColor={colors.ripplePrimary}
                                    onPress={handleEdit}
                                >
                                    Edit
                                </Button>
                                <Button
                                    mode="elevated"
                                    style={[styles.button, styles.deleteButton]}
                                    labelStyle={styles.deleteButtonText}
                                    onPress={handleShowDeleteConfirmation}
                                >
                                    Delete
                                </Button>
                            </View>
                        </View>
                    </View>
                ) : (
                    <ThemedView style={[styles.mainContainer, { minHeight: 200, paddingTop: 40 }]}>
                        <ThemedText type="title" style={styles.title} color={colors.error}>Expense Not Found</ThemedText>
                        <ThemedText centered>This expense has been deleted.</ThemedText>
                    </ThemedView>
                )
            }
        </ThemedView>
    );
}


const InfoRow = ({ label, content, layout = "horizontal", scrollable = false, height }: {
    label: string,
    content: React.ReactNode | string,
    layout?: "horizontal" | "vertical",
    scrollable?: boolean,
    height?: number
}) => {
    const { colors } = useAppTheme();
    const styles = StyleSheet.create({
        infoRow: {
            flexDirection: layout === "vertical" ? "column" : 'row',
            justifyContent: 'space-between',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: colors.border,
        },
        label: {
            fontSize: 16,
            fontWeight: '600',
            width: layout === "vertical" ? "100%" : '50%', // Adjust width as needed
        },
        textContent: {
            color: colors.text,
            width: layout === "vertical" ? "100%" : '50%',
            textAlign: layout === "vertical" ? "left" : "right",
        },
        contentContainer: {
            flexDirection: "row",
            width: layout === "vertical" ? "100%" : '50%',
            justifyContent: layout === "vertical" ? 'flex-start' : 'flex-end',
        },
        scrollableContentContainer: {
            maxHeight: height
        },


    });

    const isStringContent = typeof content === 'string';

    return (
        <View style={styles.infoRow}>
            <ThemedText style={styles.label} color={colors.text}>{label}:</ThemedText>
            {
                isStringContent ? (
                    <ThemedText style={styles.textContent}>
                        {content}
                    </ThemedText>
                ) : scrollable ? (
                    // Using React Native Gesture handler ScrollView to fix formsheet close on scroll
                    <GestureScrollView
                        keyboardShouldPersistTaps="handled"
                        style={styles.scrollableContentContainer}
                    >
                        {content}
                    </GestureScrollView>
                )
                    : (
                        <View style={styles.contentContainer}>
                            {content}
                        </View>
                    )
            }
        </View>
    )
};
