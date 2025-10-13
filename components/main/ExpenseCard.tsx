
import { paymentMethodsMapping } from "@/lib/constants";
import { Pressable, ScaledSize, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/base/ThemedText";
import CustomChip from "@/components/ui/CustomChip";
import { memo } from "react";
import { extractDateLabel, extractTimeString } from "@/lib/functions";
import Color from "color";
import { useExpenseCategoryMapping } from "@/contexts/CategoryDataProvider";
import { Category, Expense } from "@/lib/types";
import { ThemeType } from "@/themes/theme";

type ExpenseCardProps = {
    expense: Expense;
    onPress?: (id: number) => void;
    theme: ThemeType;
    uses24HourClock: boolean;
    formatCurrency: (amount: number) => string;
    dimensions: ScaledSize;
};

function ExpenseCard({ expense, onPress, theme, uses24HourClock, formatCurrency, dimensions }: ExpenseCardProps) {
    const { dark, colors } = theme;

    // Get the category mapping from the categories store
    const categoryMapping = useExpenseCategoryMapping()


    const formattedDate = extractDateLabel(expense.dateTime)
    const formattedTime = extractTimeString(expense.dateTime, uses24HourClock)

    // Lookup the category definition (icon, label, color) by expense.category (string)
    const categoryDef = categoryMapping.get(expense.category) as Category ?? {
        name: expense.category,
        label: expense.category,
        icon: 'help',
        color: colors.error,
        deletable: false,
        enabled: true,
    };

    const styles = StyleSheet.create({
        wrapper: {
            borderRadius: 12,
            overflow: "hidden",
        },
        card: {
            height: 68,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderRadius: 12,
            borderColor: colors.border,
            backgroundColor: Color(colors.card).alpha(0.6).rgb().string(),
            justifyContent: "space-between",
        },
        topRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        amountContainer: {
            flexDirection: "row",
            alignItems: "center",
        },
        amountText: {
            fontWeight: "bold",
            fontSize: 16,
            color: colors.primary,
            lineHeight: 20,
        },
        chipsContainer: {
            flexDirection: "row",
            gap: 6,
        },
        dateText: {
            fontSize: 12,
            color: "#666",
            lineHeight: 14,
        },
    });

    const handleOnPress = () => {
        if (onPress && expense.id) onPress(expense.id)
    }

    return (
        <View style={styles.wrapper}>
            <Pressable
                onPress={handleOnPress}
                android_ripple={{ color: colors.ripplePrimary }}
                style={styles.card}
            >
                <View style={styles.topRow}>
                    <View style={styles.amountContainer}>
                        <ThemedText type="title" style={styles.amountText}>
                            {formatCurrency(expense.amount)}
                        </ThemedText>
                    </View>
                    <View style={styles.chipsContainer}>
                        <CustomChip
                            size="small"
                            variant={categoryDef.color}
                            icon={categoryDef?.icon}
                            label={categoryDef?.label}
                            showBorder={!dark}
                        />
                        {(expense.paymentMethod && dimensions.width > 400 && dimensions.fontScale <= 1) && (
                            <CustomChip
                                size="small"
                                variant="tertiary"
                                icon={paymentMethodsMapping?.[expense.paymentMethod]?.icon}
                                label={paymentMethodsMapping?.[expense.paymentMethod]?.label}
                                showBorder={!dark}
                            />
                        )}
                    </View>
                </View>
                <View>
                    <ThemedText type="default" style={styles.dateText}>
                        {formattedDate} • {formattedTime}
                    </ThemedText>
                </View>
            </Pressable>
        </View>
    );
}

export default memo(ExpenseCard)
