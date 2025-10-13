import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Icon, IconButton } from "react-native-paper";
import { ThemedText } from "@/components/base/ThemedText";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import StatsCard from "./components/StatsCard";
import { getFinancialSummary } from "@/lib/helpers";
import { PeriodExpenseStats, PeriodIncomeStats } from "@/lib/types";
import usePersistentAppStore from "@/stores/usePersistentAppStore";
import { useCurrency } from "@/contexts/CurrencyProvider";

type Props = {
    expenseStats?: PeriodExpenseStats,
    incomeStats?: PeriodIncomeStats,
    isLoading?: boolean,
}

function FinancialSummaryStatsBase({ expenseStats, incomeStats, isLoading }: Props) {
    const { colors } = useAppTheme();
    const showNegativeStats = usePersistentAppStore((state) => state.uiFlags.showNegativeStats);
    const { formatCurrency } = useCurrency()
    const dimensions = useWindowDimensions()
    console.log('Dimensions:', dimensions);

    const financialSummary = useMemo(() => {
        if (!expenseStats || !incomeStats) return {
            netIncome: 0,
            savingsRate: 0,
        };
        return getFinancialSummary(expenseStats, incomeStats);
    }, [expenseStats, incomeStats]);

    if (!financialSummary || (showNegativeStats === false && financialSummary.netIncome < 0)) {
        return null;
    }

    const netIncomeColor = financialSummary.netIncome >= 0 ? colors.primary : colors.error;

    return (
        <View style={styles.section}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
                Financial Overview
            </ThemedText>
            <View style={((dimensions.width > 400 && dimensions.fontScale <= 1) || (dimensions.width > 600 && dimensions.fontScale <= 1.5)) ? styles.row : styles.column}>
                <StatsCard
                    title="Net Income"
                    value={formatCurrency(financialSummary.netIncome)}
                    icon={<Icon source="wallet" size={24} color={colors.onPrimary} />}
                    backgroundColor={netIncomeColor}
                    textColor={colors.onPrimary}
                    description={<NetIncomeDescription />}
                    infoIcon={
                        financialSummary.netIncome < 0 ? (
                            <IconButton
                                icon="alert"
                                size={20}
                                iconColor={colors.onError}
                                style={styles.infoIcon}
                            />
                        ) : undefined
                    }
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Savings Rate"
                    value={financialSummary.savingsRate}
                    suffix="%"
                    icon={<Icon source="piggy-bank" size={24} color={colors.tertiary} />}
                    textColor={colors.tertiary}
                    description={<SavingsRateDescription />}
                    infoIconColor={colors.onSurface}
                    isLoading={isLoading}
                />
            </View>
        </View>
    );
}

const NetIncomeDescription = React.memo(function NetIncomeDescription() {
    const { colors } = useAppTheme();
    return (
        <View>
            <ThemedText style={styles.descriptionTitle}>
                What is Net Income?
            </ThemedText>
            <ThemedText style={styles.descriptionBody}>
                Net income is the difference between <ThemedText style={styles.boldText}>total income</ThemedText> and <ThemedText style={styles.boldText}>total expenses</ThemedText> for the selected period.
            </ThemedText>
            <ThemedText style={styles.boldText}>
                • <ThemedText style={styles.normalText}>A <ThemedText style={{ color: colors.primary }}>positive</ThemedText> value means you earned more than you spent.</ThemedText>
            </ThemedText>
            <ThemedText style={styles.boldText}>
                • <ThemedText style={styles.normalText}>A <ThemedText style={{ color: colors.error }}>negative</ThemedText> value means your expenses exceeded your income.</ThemedText>
            </ThemedText>
            <ThemedText style={styles.descriptionWarning}>
                {"It may also indicate that you haven't added your income yet."}
            </ThemedText>
            <ThemedText style={styles.descriptionSubtle}>
                Net income helps you quickly assess whether you are effectively managing your money or may need to adjust your spending or track your income more carefully.
            </ThemedText>
        </View>
    );
});

const SavingsRateDescription = React.memo(function SavingsRateDescription() {
    return (
        <View>
            <ThemedText style={styles.descriptionTitle}>
                What is Savings Rate?
            </ThemedText>
            <ThemedText style={styles.descriptionBody}>
                Savings rate shows what percentage of your <ThemedText style={styles.boldText}>total income</ThemedText> remains after your expenses.
            </ThemedText>
            <ThemedText style={styles.boldText}>
                • <ThemedText style={styles.normalText}>A higher rate means you keep more of your money.</ThemedText>
            </ThemedText>
            <ThemedText style={styles.boldText}>
                • <ThemedText style={styles.normalText}>Track this to see your financial health improve over time.</ThemedText>
            </ThemedText>
            <ThemedText style={styles.descriptionSubtle}>
                {`Example: A savings rate of 20% means you save ₹20 for every ₹100 of income.`}
            </ThemedText>
        </View>
    );
});



const styles = StyleSheet.create({
    section: {
        gap: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    column: {
        flexDirection: 'column',
        gap: 16,
    },
    infoIcon: {
        margin: 0,
    },
    descriptionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
    },
    descriptionBody: {
        marginBottom: 8,
        lineHeight: 20,
    },
    descriptionWarning: {
        marginTop: 8,
        opacity: 0.8,
        fontStyle: 'italic',
    },
    descriptionSubtle: {
        marginTop: 8,
        opacity: 0.8,
        lineHeight: 20,
    },
    boldText: {
        fontWeight: 'bold',
    },
    normalText: {
        fontWeight: 'normal',
    },
});

export default FinancialSummaryStatsBase;
