import React, { useCallback, useMemo, useState, useLayoutEffect } from "react";
import { View, StyleSheet, RefreshControl, useWindowDimensions } from "react-native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ActivityIndicator } from "react-native-paper";

import { ThemedText } from "@/components/base/ThemedText";
import ExpenseCard from "@/components/main/ExpenseCard";
import TransactionGroupHeading from '@/components/main/TransactionGroupHeading';
import { Expense } from "@/lib/types";
import { getExpenseById, getExpensesByMonthPaginated } from "@/repositories/ExpenseRepo";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useHaptics } from "@/contexts/HapticsProvider";
import ErrorState from "@/components/main/ErrorState";
import { useLocalization } from "@/hooks/useLocalization";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { MinimumItemsToLoadForScroll } from "@/lib/constants";
import { extractDateLabel } from "@/lib/functions";

type HeaderItem = {
    type: 'header';
    id: string;
    title: string;
    total: number;
    count: number;
};

export type ExpenseListItem = HeaderItem | Expense;

// Type guard function
const isHeaderItem = (item: ExpenseListItem): item is HeaderItem => {
    return 'type' in item && item.type === 'header';
};

const getDayHeaderTitle = (date: Date) => {
    const relativeLabel = extractDateLabel(date);
    const fullDate = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return relativeLabel === 'Today' || relativeLabel === 'Yesterday'
        ? `${relativeLabel} · ${fullDate}`
        : fullDate;
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
        if (!data?.pages) return [];

        const items: ExpenseListItem[] = [];
        let previousDayKey: number | null = null;
        let currentHeader: HeaderItem | undefined;

        for (const page of data.pages) {
            for (const expense of page.expenses) {
                const date = expense.dateTime;
                const dayKey = date.getFullYear() * 10_000
                    + (date.getMonth() + 1) * 100
                    + date.getDate();

                if (dayKey !== previousDayKey) {
                    currentHeader = {
                        type: 'header',
                        id: `day-${dayKey}`,
                        title: getDayHeaderTitle(date),
                        total: 0,
                        count: 0,
                    };
                    items.push(currentHeader);
                    previousDayKey = dayKey;
                }

                currentHeader!.total += expense.amount;
                currentHeader!.count++;
                items.push(expense);
            }
        }

        return items;
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
                <TransactionGroupHeading title={item.title} total={formatCurrency(item.total)} count={item.count} />
            );
        }

        // TypeScript now knows item is Expense
        return (
            <ExpenseCard
                expense={item}
                onPress={handleExpensePress}
                theme={theme}
                uses24HourClock={uses24HourClock}
                formatCurrency={formatCurrency}
                dimensions={dimensions}
            />
        );
    }, [handleExpensePress, theme, uses24HourClock, formatCurrency, dimensions]);

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

    const renderSeparator = useCallback(({ leadingItem }: {
        leadingItem: ExpenseListItem;
        trailingItem: ExpenseListItem;
    }) => (
        <View
            style={[
                styles.itemSeparator,
                isHeaderItem(leadingItem) && styles.dayHeaderSeparator,
                { backgroundColor: 'transparent' }
            ]}
        />
    ), []);

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
                    <ThemedText type="subtitle">A fresh start</ThemedText>
                    <ThemedText color={colors.muted}>Your expenses for this period will appear here.</ThemedText>
                    <Button
                        onPress={() => router.push("/transaction/new")}
                        textColor={colors.primary}
                        mode="contained-tonal"
                        icon="plus"
                    >
                        Add Expense
                    </Button>
                </View>
            }
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={styles.contentContainer}
        />

    );
}

const styles = StyleSheet.create({
    loadingMore: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 16,
    },
    itemSeparator: {
        height: 1,
        marginVertical: 4,
    },
    dayHeaderSeparator: {
        marginVertical: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
        gap: 12,
    },
    contentContainer: {
        paddingHorizontal: 16,
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
