import React, { useCallback, useMemo, useRef, useState, useLayoutEffect } from "react";
import { View, StyleSheet, RefreshControl } from "react-native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Button, FAB, Portal } from "react-native-paper";
import { useIsFocused } from "expo-router/react-navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/base/ThemedText";
import IncomeCard from "@/components/main/IncomeCard";
import TransactionGroupHeading from '@/components/main/TransactionGroupHeading';
import { Income } from "@/lib/types";
import { getIncomeById, getIncomesByMonthPaginated } from "@/repositories/IncomeRepo";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useHaptics } from "@/contexts/HapticsProvider";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import ErrorState from "@/components/main/ErrorState";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useSnackbarState } from "@/contexts/GlobalSnackbarProvider";
import { useLocalization } from "@/hooks/useLocalization";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { MinimumItemsToLoadForScroll } from "@/lib/constants";

type HeaderItem = {
  type: 'header';
  id: string;
  title: string;
  total: number;
  count: number;
};

type ListItem = HeaderItem | Income;

// Type guard functions for better type safety
const isHeaderItem = (item: ListItem): item is HeaderItem => {
  return 'type' in item && item.type === 'header';
};

export default function IncomesScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const { hapticImpact } = useHaptics();
  const flashListRef = useRef<FlashListRef<ListItem>>(null);
  const { handleScroll, scrollToTop, showScrollToTop } = useScrollToTop(flashListRef);
  const globalSnackbar = useSnackbarState()
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { uses24HourClock } = useLocalization()
  const { formatCurrency } = useCurrency()
  const { colors } = theme;


  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch incomes by month with pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ["incomes"],
    queryFn: ({ pageParam = 0 }) => getIncomesByMonthPaginated({ offsetMonth: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.offsetMonth + 1 : undefined,
  });

  const listData = useMemo((): ListItem[] => {
    if (!data?.pages || !data?.pages.some(page => page.incomes.length > 0)) return [];
    return data.pages.filter((page) => page.incomes.length > 0).flatMap((page) => [
      {
        type: 'header' as const,
        id: `header-${page.month}`,
        title: page.month,
        total: page.incomes.reduce((sum, income) => sum + income.amount, 0),
        count: page.incomes.length,
      },
      ...page.incomes
    ]);
  }, [data]);


  const handleIncomeCardPress = useCallback(async (id: number) => {
    hapticImpact();
    await queryClient.prefetchQuery({
      queryKey: ["income", id.toString()],
      queryFn: () => getIncomeById(id),
    });
    router.push(`/income/${id}`);
  }, [hapticImpact, queryClient, router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticImpact();
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [hapticImpact, refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render item with type guards
  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (isHeaderItem(item)) {
      return (
        <TransactionGroupHeading title={item.title} total={formatCurrency(item.total)} count={item.count} />
      );
    }

    // TypeScript now knows item is Income
    return (
      <IncomeCard
        income={item}
        onPress={handleIncomeCardPress}
        theme={theme}
        uses24HourClock={uses24HourClock}
        formatCurrency={formatCurrency}
      />
    );
  }, [handleIncomeCardPress, theme, uses24HourClock, formatCurrency]);

  const renderSeparator = useCallback(({ leadingItem }: {
    leadingItem: ListItem;
    trailingItem: ListItem;
  }) => (
    <View
      style={[
        styles.itemSeparator,
        isHeaderItem(leadingItem) && styles.sectionHeaderSeparator,
        { backgroundColor: 'transparent' }
      ]}
    />
  ), []);

  // Get item type for FlashList optimization
  const getItemType = useCallback((item: ListItem) => {
    return isHeaderItem(item) ? 'header' : 'income';
  }, []);

  // Key extractor that handles both types
  const keyExtractor = useCallback((item: ListItem) => {
    if (typeof item.id === 'number') return item.id.toString();
    return item.id!;
  }, []);

  // Total incomes for auto-loading
  const totalIncomes = useMemo(() => (
    data?.pages.reduce((total, page) => total + page.incomes.length, 0) ?? 0
  ), [data]);

  // Auto-load more data if needed
  useLayoutEffect(() => { //Using useLayoutEffect so that the isFetchingNextPage state is set as true to avoid rendering empty list component until atleast MinimumItemsToLoadForScroll items are loaded
    if (data?.pages && hasNextPage && totalIncomes < MinimumItemsToLoadForScroll) {
      fetchNextPage();
    }
  }, [data, hasNextPage, totalIncomes, fetchNextPage]);

  if (isLoading) return null;

  if (isError) {
    return (
      <ErrorState
        title="Failed to load incomes"
        message={error instanceof Error ? error.message : "Unknown error occurred"}
        onRetry={handleRefresh}
        showRestartHint
      />
    );
  }


  return (
    <ScreenWrapper background="background" containerStyle={styles.container}>
      <FlashList<ListItem>
        ref={flashListRef}
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={!!isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.tertiary]}
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
            <ThemedText type="subtitle">Make room for good things</ThemedText>
            <ThemedText color={colors.muted}>Your income entries will appear here.</ThemedText>
            <Button
              onPress={() => router.navigate({
                pathname: '/transaction/new',
                params: { defaultTab: 'income' }
              })}
              textColor={colors.tertiary}
              mode="contained-tonal"
              icon="plus"
            >
              Add Income
            </Button>
          </View>
        }
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={styles.contentContainer}
      />

      <Portal>
        <FAB
          visible={showScrollToTop && isFocused && !globalSnackbar}
          icon="arrow-up"
          style={[
            styles.fab,
            {
              bottom: insets.bottom + 60,
              right: insets.right + 16,
            }
          ]}
          onPress={scrollToTop}
          variant="tertiary"
        />
      </Portal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
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
  sectionHeaderSeparator: {
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
