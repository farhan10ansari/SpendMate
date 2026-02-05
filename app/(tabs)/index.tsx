import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, IconButton, Menu } from 'react-native-paper';
import { Href, useNavigation, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ScreenWrapper } from '@/components/main/ScreenWrapper';
import PeriodCard from '@/features/Stats/components/PeriodCard';
import FinancialSummaryStats from '@/features/Stats/FinancialOverviewStats';
import ExpenseStats from '@/features/Stats/ExpenseStats';
import IncomeStats from '@/features/Stats/IncomeStats';

import { getExpenseStatsByPeriod } from '@/repositories/ExpenseRepo';
import { getIncomeStatsByPeriod } from '@/repositories/IncomeRepo';

import useStatsStore from '@/stores/useStatsStore';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { useHaptics } from '@/contexts/HapticsProvider';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';


export default function HomeScreen() {
  const { colors } = useAppTheme();
  const expensesPeriod = useStatsStore((state) => state.period);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { hapticImpact } = useHaptics();

  const { data: expenseStats, isLoading: isExpenseStatsLoading, refetch: refetchExpenseStats } = useQuery({
    queryKey: ['stats', 'expenses', 'stats-in-a-period', expensesPeriod],
    queryFn: () => getExpenseStatsByPeriod(expensesPeriod),
  });

  const { data: incomeStats, isLoading: isIncomeStatsLoading, refetch: refetchIncomeStats } = useQuery({
    queryKey: ['stats', 'incomes', 'stats-in-a-period', expensesPeriod],
    queryFn: () => getIncomeStatsByPeriod(expensesPeriod),
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticImpact();
    try {
      await Promise.all([
        refetchExpenseStats(),
        refetchIncomeStats(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [hapticImpact]);

  // Setup screen menu with options
  useScreenMenu({ onRefresh: handleRefresh });

  return (
    <ScreenWrapper
      background="background"
      withScrollView
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.scrollContainer}
    >
      <PeriodCard />
      <FinancialSummaryStats expenseStats={expenseStats} incomeStats={incomeStats} />
      <View style={styles.section}>
        <ExpenseStats expenseStats={expenseStats} showTitle />
        <MoreStatsButton routeName="/stats/expenses" color={colors.primary} />
      </View>
      <View style={styles.section}>
        <IncomeStats incomeStats={incomeStats} showTitle />
        <MoreStatsButton routeName="/stats/incomes" color={colors.primary} />
      </View>
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
              rippleColor={colors.ripplePrimary}
              background={Platform.OS === 'android' ? { color: colors.ripplePrimary, foreground: true } : undefined}
            />
            <Menu.Item
              leadingIcon="refresh"
              title="Refresh Data"
              onPress={triggerRefresh}
              rippleColor={colors.ripplePrimary}
              background={Platform.OS === 'android' ? { color: colors.ripplePrimary, foreground: true } : undefined}
            />
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
    paddingBottom: 100,
    flexGrow: 1,
    gap: 20,
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
});
