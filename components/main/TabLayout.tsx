import { useHaptics } from '@/contexts/HapticsProvider';
import usePreFetchData from '@/hooks/usePreFetchData';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { Tabs, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon, IconButton } from 'react-native-paper';

function TabLayout() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { hapticSelect } = useHaptics();

  // Pre-fetch data for different tabs
  usePreFetchData();

  const handleNavigateToNewTransaction = useCallback(() => {
    hapticSelect();
    router.push('/transaction/new');
  }, [hapticSelect, router]);

  const screenOptions = useMemo(() => ({
    tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.outlineVariant, shadowColor: colors.shadow }],
    tabBarItemStyle: styles.tabBarItem,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.onSurfaceVariant,
    tabBarLabelPosition: 'below-icon' as const,
    tabBarLabelStyle: styles.tabLabel,
    tabBarHideOnKeyboard: true,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerShadowVisible: false,
  }), [colors]);

  const customTabButtonProps = useMemo(() => ({
    onPress: handleNavigateToNewTransaction,
  }), [handleNavigateToNewTransaction]);

  const renderCustomTabButton = useCallback(() => (
    <CustomTabButton {...customTabButtonProps} />
  ), [customTabButtonProps]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={focused ? 'home' : 'home-outline'} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={focused ? 'receipt-text' : 'receipt-text-outline'} />,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Transaction',
          tabBarIcon: ({ color }) => <Icon size={28} source="add" color={String(color)} />,
          tabBarButton: renderCustomTabButton,
        }}
      />
      <Tabs.Screen
        name="incomes"
        options={{
          title: 'Incomes',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={focused ? 'wallet' : 'wallet-outline'} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={focused ? 'view-grid' : 'view-grid-outline'} />,
        }}
      />
    </Tabs>
  );
}

export default TabLayout;



const styles = StyleSheet.create({
  tabBar: {
    borderTopEndRadius: 28,
    borderTopStartRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    position: 'absolute',
    paddingTop: 7,
    elevation: 8,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabBarItem: {
    backgroundColor: 'transparent',
  },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  iconPill: { width: 48, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  customTabButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTabButtonIcon: {
    borderWidth: 4,
    borderRadius: 20,
    width: 56,
    height: 56,
    margin: 0,
    elevation: 0,
    top: -10,
  },
});

function TabIcon({ focused, icon }: { focused: boolean; icon: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.iconPill, { backgroundColor: focused ? colors.primaryContainer : 'transparent' }]}>
      <Icon source={icon} size={22} color={focused ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
    </View>
  );
}

const CustomTabButton = React.memo(({ onPress }: { onPress: () => void }) => {
  const { colors } = useAppTheme();
  return (
  <View style={styles.customTabButtonContainer}>
    <IconButton
      icon="plus"
      mode='contained'
      size={30}
      containerColor={colors.primary}
      iconColor={colors.onPrimary}
      accessibilityLabel="Add expense or income"
      style={[styles.customTabButtonIcon, { borderColor: colors.surface }]}
      onPress={onPress}
    />
  </View>
  );
});

CustomTabButton.displayName = 'CustomTabButton';
