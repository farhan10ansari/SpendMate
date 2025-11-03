import React, { useCallback, useMemo, useState, useLayoutEffect } from "react";
import { View, StyleSheet, RefreshControl, useWindowDimensions } from "react-native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ActivityIndicator } from "react-native-paper";

import { ThemedText } from "@/components/base/ThemedText";
import ExpenseCard from "@/components/main/ExpenseCard";
import { Expense } from "@/lib/types";
import { getExpenseById, getExpensesByMonthPaginated } from "@/repositories/ExpenseRepo";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useHaptics } from "@/contexts/HapticsProvider";
import ErrorState from "@/components/main/ErrorState";
import { useLocalization } from "@/hooks/useLocalization";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { MinimumItemsToLoadForScroll } from "@/lib/constants";

type HeaderItem = {
    type: 'header';
    id: string;
    title: string;
};

export type ExpenseListItem = HeaderItem | Expense;

// Type guard function
const isHeaderItem = (item: ExpenseListItem): item is HeaderItem => {
    return 'type' in item && item.type === 'header';
};

type ExpensesListProps = {
    selectedOffsetMonth: number | null;
    onScroll?: (event: any) => void;
    scrollRef?: React.Ref<FlashListRef<ExpenseListItem>>;
}

export default function ExpensesList({
    selectedOffsetMonth,
    onScroll,
    scrollRef
}: ExpensesListProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { hapticImpact } = useHaptics();
    const theme = useAppTheme();
    const { uses24HourClock } = useLocalization()
    const { formatCurrency } = useCurrency()
    const dimensions = useWindowDimensions()
    const { colors } = theme;

    const queryKey = selectedOffsetMonth === null
        ? ["expenses", "all"]
        : ["expenses", "month", selectedOffsetMonth];

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage,
        refetch,
        isError,
        error
    } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 0 }) => {
            if (selectedOffsetMonth === null) {
                // For "All", start from current month and go backwards
                return getExpensesByMonthPaginated({ offsetMonth: pageParam });
            } else {
                // For specific month, only fetch that month
                return getExpensesByMonthPaginated({ offsetMonth: selectedOffsetMonth });
            }
        },
        initialPageParam: selectedOffsetMonth ?? 0,
        getNextPageParam: (last) => {
            if (selectedOffsetMonth !== null) {
                // For specific month, no pagination needed
                return undefined;
            }
            // For "All", continue with next month
            return last.hasMore ? last.offsetMonth + 1 : undefined;
        },
        enabled: true,
    });

    const listData = useMemo((): ExpenseListItem[] => {
        if (!data?.pages || !data?.pages.some(page => page.expenses.length > 0)) return [];
        return data.pages.filter(page => page.expenses.length > 0).flatMap((page) => [
            {
                type: 'header' as const,
                id: `header-${page.month}`,
                title: page.month
            },
            ...page.expenses
        ]);
    }, [data]);


    const handleExpensePress = useCallback(async (id: number) => {
        hapticImpact();
        await queryClient.prefetchQuery({
            queryKey: ["expense", id.toString()],
            queryFn: () => getExpenseById(id),
        });
        router.push(`/expense/${id}`);
    }, [hapticImpact, queryClient, router]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        hapticImpact();
        try {
            await refetch();
            // Also refresh available months
            await queryClient.refetchQueries({ queryKey: ["expenses", "availableExpenseMonths"] });
        } finally {
            setIsRefreshing(false);
        }
    }, [hapticImpact, refetch, queryClient]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage && selectedOffsetMonth === null) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, selectedOffsetMonth]);

    const renderItem = useCallback(({ item }: { item: ExpenseListItem }) => {
        if (isHeaderItem(item)) {
            return (
                <ThemedText
                    type="defaultSemiBold"
                    fontSize={20}
                    style={[styles.sectionHeader, { color: colors.text }]}
                >
                    {item.title}
                </ThemedText>
            );
        }

        // TypeScript now knows item is Expense
        return (
            <ExpenseCard
                expense={item}
                onPress={() => handleExpensePress(item.id!)}
                theme={theme}
                uses24HourClock={uses24HourClock}
                formatCurrency={formatCurrency}
                dimensions={dimensions}
            />
        );
    }, [colors.text, handleExpensePress, theme, uses24HourClock, formatCurrency, dimensions]);

    // Get item type for FlashList optimization
    const getItemType = useCallback((item: ExpenseListItem) => {
        return isHeaderItem(item) ? 'header' : 'expense';
    }, []);

    // Key extractor that handles both types
    const keyExtractor = useCallback((item: ExpenseListItem) => {
        if (isHeaderItem(item)) {
            return item.id; // Already a string
        }
        return `expense-${item.id!.toString()}`; // Convert number to string with prefix
    }, []);

    // Total expenses for auto-loading
    const totalExpenses = useMemo(() => (
        data?.pages.reduce((total, page) => total + page.expenses.length, 0) ?? 0
    ), [data]);

    // Auto-load more data for "All" view if needed
    useLayoutEffect(() => { //Using useLayoutEffect so that the isFetchingNextPage state is set as true to avoid rendering empty list component until atleast MinimumItemsToLoadForScroll items are loaded
        if (data?.pages && hasNextPage && totalExpenses < MinimumItemsToLoadForScroll) {
            fetchNextPage();
        }
    }, [data, totalExpenses, fetchNextPage, hasNextPage]);

    // ✅ Loading and error states
    if (isLoading) return null;

    if (isError) {
        console.error("Error fetching expenses:", error);
        return (
            <ErrorState
                title="Failed to load expenses"
                message={error instanceof Error ? error.message : "Unknown error occurred"}
                onRetry={handleRefresh}
                showRestartHint
            />
        );
    }


    return (
        <FlashList<ExpenseListItem>
            ref={scrollRef}
            data={listData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.8}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={
                <RefreshControl
                    refreshing={!!isRefreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                    progressBackgroundColor={colors.card}
                />
            }
            ListFooterComponent={
                isFetchingNextPage ? (
                    <View style={styles.loadingMore}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                ) : null
            }
            ListEmptyComponent={
                isFetchingNextPage ? null : <View style={styles.emptyContainer}>
                    <ThemedText type="subtitle">No expenses records found...</ThemedText>
                    <Button
                        onPress={() => router.push("/transaction/new")}
                        textColor={colors.primary}
                    >
                        Add Expense
                    </Button>
                </View>
            }
            ItemSeparatorComponent={() => (
                <View style={[styles.itemSeparator, { backgroundColor: colors.border }]} />
            )}
            contentContainerStyle={styles.contentContainer}
        />

    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        marginTop: 10,
        marginBottom: -10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    loadingMore: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 16,
    },
    itemSeparator: {
        height: 1,
        marginVertical: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
        gap: 12,
    },
    contentContainer: {
        paddingHorizontal: 10,
        paddingBottom: 150,
    },
    fab: {
        position: "absolute",
        height: 48,
        width: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
