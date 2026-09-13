import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import { getExpenseStatsByPeriod } from "@/repositories/ExpenseRepo";
import useStatsStore from "@/stores/useStatsStore";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import PeriodCard from "./components/PeriodCard";
import { HomeActivityStats } from "./components/HomeStats";
import { ThemedText } from "@/components/base/ThemedText";
import CategoryBreakdownChart from "./components/CategoryBreakdownChart";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import statsStyles from "./styles";
import ExpenseCategoryBreakdownCard from "./components/ExpenseCategoriesBreakdownData";

export default function ExpenseStatsScreen() {
    const { colors } = useAppTheme();
    const expensesPeriod = useStatsStore((state) => state.period);
    const insets = useSafeAreaInsets();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Expense stats query
    const { data: expenseStats, refetch, isPending } = useQuery({
        queryKey: ['stats', 'expenses', 'stats-in-a-period', expensesPeriod],
        queryFn: () => getExpenseStatsByPeriod(expensesPeriod),
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <ScreenWrapper
            background="background"
            withScrollView
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 16 }]}
        >
            <PeriodCard />
            <HomeActivityStats kind="expense" stats={expenseStats} isLoading={isPending} />
            <View style={statsStyles.section}>
                <ThemedText style={[statsStyles.sectionTitle, { color: colors.text }]}>
                    Explore your spending
                </ThemedText>
                <ExpenseCategoryBreakdownCard
                    data={expenseStats?.categories}
                    title="Expense Categories"
                />
                <CategoryBreakdownChart data={expenseStats?.categories}
                />
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
    }
});
