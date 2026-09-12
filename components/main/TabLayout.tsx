import { useCurrency } from '@/contexts/CurrencyProvider';
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
  const { currencyData } = useCurrency();

  // Pre-fetch data for different tabs
  usePreFetchData();

  const handleNavigateToNewTransaction = useCallback(() => {
    hapticSelect();
    router.push('/transaction/new');
  }, [hapticSelect, router]);

  const screenOptions = useMemo(() => ({
    tabBarStyle: styles.tabBar,
    tabBarItemStyle: styles.tabBarItem,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerShadowVisible: false,
  }), [colors.background]);

  const customTabButtonProps = useMemo(() => ({
    onPress: handleNavigateToNewTransaction,
    borderColor: colors.border,
  }), [handleNavigateToNewTransaction, colors]);

  const renderCustomTabButton = useCallback(() => (
    <CustomTabButton {...customTabButtonProps} />
  ), [customTabButtonProps]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon size={28} source="home" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <Icon size={28} source={currencyData.icon ? currencyData.icon : "currency-usd"} color={String(color)} />,
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
          tabBarIcon: ({ color }) => <Icon size={28} source="cash" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <Icon size={28} source="menu" color={String(color)} />,
        }}
      />
    </Tabs>
  );
}

export default TabLayout;



const styles = StyleSheet.create({
  tabBar: {
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
    position: 'absolute',
  },
  tabBarItem: {
    backgroundColor: 'transparent',
  },
  customTabButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTabButtonIcon: {
    borderWidth: 1,
    elevation: 5,
    top: -12,
  },
});

const CustomTabButton = React.memo(({ onPress, borderColor }: { onPress: () => void, borderColor: string }) => (
  <View style={styles.customTabButtonContainer}>
    <IconButton
      icon="plus"
      mode='contained'
      size={48}
      style={[styles.customTabButtonIcon, { borderColor }]}
      onPress={onPress}
    />
  </View>
));

CustomTabButton.displayName = 'CustomTabButton';
