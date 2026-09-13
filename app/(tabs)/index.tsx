import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Icon, IconButton, Menu } from 'react-native-paper';
import { Href, useNavigation, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';

import { ScreenWrapper } from '@/components/main/ScreenWrapper';
import PeriodCard from '@/features/Stats/components/PeriodCard';
import { HomeFinancialSummary, HomeActivityStats } from '@/features/Stats/components/HomeStats';

import { getExpenseStatsByPeriod } from '@/repositories/ExpenseRepo';
import { getIncomeStatsByPeriod } from '@/repositories/IncomeRepo';
import { getRecentActivity, mergeRecentActivity } from '@/repositories/RecentActivityRepo';
import RecentActivity from '@/features/Stats/components/RecentActivity';

import useStatsStore from '@/stores/useStatsStore';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { useHaptics } from '@/contexts/HapticsProvider';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';


export default function HomeScreen() {
  const { colors } = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { fontScale } = useWindowDimensions();
  const [statsWidth, setStatsWidth] = useState(0);
  const columns = Math.min(3, Math.max(1, Math.floor((statsWidth + 16) / (360 * Math.max(1, fontScale) + 16))));
  const columnWidth = columns === 1 ? '100%' : (statsWidth - (columns - 1) * 16) / columns;
  const handleStatsLayout = useCallback((event: LayoutChangeEvent) => {
    setStatsWidth(event.nativeEvent.layout.width);
  }, []);
  const expensesPeriod = useStatsStore((state) => state.period);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { hapticImpact } = useHaptics();

  const { data: expenseStats, refetch: refetchExpenseStats, isPending: expensesPending } = useQuery({
    queryKey: ['stats', 'expenses', 'stats-in-a-period', expensesPeriod],
    queryFn: () => getExpenseStatsByPeriod(expensesPeriod),
  });

  const { data: incomeStats, refetch: refetchIncomeStats, isPending: incomesPending } = useQuery({
    queryKey: ['stats', 'incomes', 'stats-in-a-period', expensesPeriod],
    queryFn: () => getIncomeStatsByPeriod(expensesPeriod),
  });

  const recentExpenses = useQuery({
    queryKey: ['expenses', 'recent-activity', expensesPeriod],
    queryFn: () => getRecentActivity('expense', expensesPeriod),
  });
  const recentIncomes = useQuery({
    queryKey: ['incomes', 'recent-activity', expensesPeriod],
    queryFn: () => getRecentActivity('income', expensesPeriod),
  });
  const { refetch: refetchRecentExpenses } = recentExpenses;
  const { refetch: refetchRecentIncomes } = recentIncomes;
  const recentActivity = useMemo(() => mergeRecentActivity(recentExpenses.data ?? [], recentIncomes.data ?? []), [recentExpenses.data, recentIncomes.data]);
  const retryRecentActivity = useCallback(() => {
    void refetchRecentExpenses();
    void refetchRecentIncomes();
  }, [refetchRecentExpenses, refetchRecentIncomes]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticImpact();
    try {
      await Promise.all([
        refetchExpenseStats(),
        refetchIncomeStats(),
        refetchRecentExpenses(),
        refetchRecentIncomes(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [hapticImpact, refetchExpenseStats, refetchIncomeStats, refetchRecentExpenses, refetchRecentIncomes]);

  // Setup screen menu with options
  useScreenMenu({ onRefresh: handleRefresh });

  return (
    <ScreenWrapper
      background="background"
      withScrollView
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={[styles.scrollContainer, { paddingBottom: tabBarHeight + 16 }]}
    >
      <PeriodCard />
      <View style={styles.statsGrid} onLayout={handleStatsLayout}>
        <View style={{ width: columns === 3 ? columnWidth : '100%' }}>
          <HomeFinancialSummary expenseStats={expenseStats} incomeStats={incomeStats} isLoading={expensesPending || incomesPending} stretch={columns === 3} />
        </View>
        <View style={[styles.section, { width: columnWidth }]}>
          <HomeActivityStats kind="expense" stats={expenseStats} isLoading={expensesPending} />
          <MoreStatsButton routeName="/stats/expenses" color={colors.primary} />
        </View>
        <View style={[styles.section, { width: columnWidth }]}>
          <HomeActivityStats kind="income" stats={incomeStats} isLoading={incomesPending} />
          <MoreStatsButton routeName="/stats/incomes" color={colors.tertiary} />
        </View>
      </View>
      <RecentActivity items={recentActivity} isLoading={recentExpenses.isPending || recentIncomes.isPending} isError={recentExpenses.isError || recentIncomes.isError} onRetry={retryRecentActivity} />
    </ScreenWrapper>
  );
}

function useScreenMenu({ onRefresh }: { onRefresh: () => void }) {
  const navigation = useNavigation();
  const { colors } = useAppTheme();

  const showNegativeStats = usePersistentAppStore((s) => s.uiFlags.showNegativeStats);
  const updateUiFlag = usePersistentAppStore((s) => s.updateUIFlag);

  const [showMenu, setShowMenu] = useState(false);

  const openMenu = useCallback(() => setShowMenu(true), []);
  const closeMenu = useCallback(() => setShowMenu(false), []);

  const toggleNegativeStats = useCallback(() => {
    updateUiFlag('showNegativeStats', !showNegativeStats);
    closeMenu();
  }, [updateUiFlag, showNegativeStats, closeMenu]);

  const triggerRefresh = useCallback(() => {
    onRefresh();
    closeMenu();
  }, [onRefresh, closeMenu]);

  // Header right component memoized to avoid remounting
  const HeaderMenu = useMemo(
    () =>
      function HeaderMenu() {
        return (
          <Menu
            visible={showMenu}
            onDismiss={closeMenu}
            anchor={<IconButton icon="dots-vertical" onPress={openMenu} />}
            anchorPosition="bottom"
            contentStyle={{ backgroundColor: colors.surface }}
          >
            <Menu.Item
              leadingIcon={showNegativeStats ? 'eye-off' : 'eye'}
              title={showNegativeStats ? 'Hide Negative Stats' : 'Show Negative Stats'}
              onPress={toggleNegativeStats}
            />
            <Menu.Item leadingIcon="refresh" title="Refresh Data" onPress={triggerRefresh} />
          </Menu>
        );
      },
    [showMenu, closeMenu, openMenu, colors.surface, showNegativeStats, toggleNegativeStats, triggerRefresh]
  );

  // Set once per dependency change; avoids inline object churn
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: HeaderMenu,
    });
  }, [navigation, HeaderMenu]);
}

// Extracted and memoized child to avoid recreation per render
const MoreStatsButton = React.memo(function MoreStatsButton({
  routeName,
  color,
}: {
  routeName: Href;
  color: string;
}) {
  const router = useRouter();
  const onPress = useCallback(() => router.push(routeName), [router, routeName]);

  return (
    <View style={styles.moreStatsButtonContainer}>
      <Button
        mode="text"
        compact
        icon={() => <Icon source="chevron-right" size={20} color={color} />}
        contentStyle={styles.moreStatsButtonContent}
        labelStyle={styles.moreStatsButtonLabel}
        textColor={color}
        onPress={onPress}
      >
        More Stats
      </Button>
    </View>
  );
});

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    flexGrow: 1,
    gap: 16,
  },
  moreStatsButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  moreStatsButtonContent: {
    flexDirection: 'row-reverse',
  },
  moreStatsButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: 16,
  },
});
