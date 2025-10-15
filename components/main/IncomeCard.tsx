import { Income, Category } from "@/lib/types";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/base/ThemedText";
import CustomChip from "@/components/ui/CustomChip";
import { memo } from "react";
import { extractDateLabel, extractTimeString } from "@/lib/functions";
import Color from 'color';
import { useIncomeSourceMapping } from "@/contexts/CategoryDataProvider";
import { ThemeType } from "@/themes/theme";

type IncomeCardProps = {
    income: Income;
    onPress?: (id: number) => void;
    theme: ThemeType;
    uses24HourClock: boolean;
    formatCurrency: (amount: number) => string;
};


function IncomeCard({ income, onPress, theme, uses24HourClock, formatCurrency }: IncomeCardProps) {
    const { dark, colors } = theme;

    // Get the source mapping
    const sourceMapping = useIncomeSourceMapping()

    const formattedDate = extractDateLabel(income.dateTime);
    const formattedTime = extractTimeString(income.dateTime, uses24HourClock);

    // Lookup the source definition (icon, label, color) by income.source (string)
    const sourceDef = sourceMapping.get(income.source) as Category ?? {
        name: income.source,
        label: income.source,
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
            color: colors.tertiary,
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
        if (onPress && income.id) onPress(income.id)
    }

    return (
        <View style={styles.wrapper}>
            <Pressable
                onPress={handleOnPress}
                android_ripple={{ color: colors.rippleTertiary }}
                style={styles.card}
            >
                <View style={styles.topRow}>
                    <View style={styles.amountContainer}>
                        <ThemedText type="title" style={styles.amountText}>
                            {formatCurrency(income.amount)}
                        </ThemedText>
                    </View>
                    <View style={styles.chipsContainer}>
                        <CustomChip
                            size="small"
                            variant={sourceDef.color}
                            icon={sourceDef.icon}
                            label={sourceDef.label}
                            showBorder={!dark}
                        />
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

export default memo(IncomeCard)
