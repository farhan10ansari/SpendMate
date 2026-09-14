import React, { useEffect, useState } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Animated as NativeAnimated, Easing as NativeEasing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Dialog, Icon, IconButton, Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Color from 'color';
import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useCurrency } from '@/contexts/CurrencyProvider';
import { useLocalAuth } from '@/contexts/LocalAuthProvider';
import { useExpenseCategoryMapping, useIncomeSourceMapping } from '@/contexts/CategoryDataProvider';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { getFinancialSummary } from '@/lib/helpers';
import { PeriodExpenseStats, PeriodIncomeStats } from '@/lib/types';

export function HomeFinancialSummary({ expenseStats, incomeStats, isLoading, stretch = false }: {
  expenseStats?: PeriodExpenseStats;
  incomeStats?: PeriodIncomeStats;
  isLoading: boolean;
  stretch?: boolean;
}) {
  const { colors } = useAppTheme();
  const { isAuthenticated } = useLocalAuth();
  const showNegative = usePersistentAppStore(s => s.uiFlags.showNegativeStats);
  const [showInfo, setShowInfo] = useState(false);
  const summary = expenseStats && incomeStats ? getFinancialSummary(expenseStats, incomeStats) : null;
  const ready = isAuthenticated && !isLoading && summary !== null;
  const negative = ready && summary.netIncome < 0;
  const accent = negative ? colors.error : colors.primary;
  const foreground = negative ? colors.onErrorContainer : colors.onPrimaryContainer;
  const background = negative ? colors.errorContainer : colors.primaryContainer;
  const hasIncome = (incomeStats?.total ?? 0) > 0;
  const rate = summary?.savingsRate ?? 0;
  const progress = Math.max(0, Math.min(100, rate));
  const reveal = useSharedValue(0);
  const meter = useSharedValue(0);
  const targetProgress = ready && hasIncome ? progress : 0;

  useEffect(() => {
    // Stay at the start while the login overlay is covering the home screen.
    if (!ready) {
      reveal.value = 0;
      meter.value = 0;
      return;
    }
    reveal.value = withTiming(ready ? 1 : 0, { duration: 450, easing: Easing.out(Easing.cubic) });
    meter.value = withTiming(targetProgress, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [ready, targetProgress, reveal, meter]);

  const valueAnimation = useAnimatedStyle(() => ({
    opacity: 0.4 + reveal.value * 0.6,
    transform: [{ translateY: (1 - reveal.value) * 8 }],
  }));
  const meterAnimation = useAnimatedStyle(() => ({ width: `${meter.value}%` }));

  if (ready && !showNegative && summary.netIncome < 0) return null;

  return (
    <>
      <LinearGradient colors={[background, Color(background).mix(Color(colors.surface), 0.35).hex()]} style={[styles.hero, stretch && styles.stretchedHero]}>
        <View pointerEvents="none" accessible={false} style={[styles.orbit, { borderColor: Color(accent).alpha(0.1).string() }]} />
        <View style={styles.headingRow}>
          <View style={[styles.badge, { backgroundColor: Color(accent).alpha(0.12).string() }]}>
            <Icon source="wallet-outline" size={24} color={accent} />
          </View>
          <ThemedText style={[styles.eyebrow, { color: foreground }]}>YOUR MONEY AT A GLANCE</ThemedText>
          <IconButton icon="information-outline" size={20} iconColor={foreground} onPress={() => setShowInfo(true)} accessibilityLabel="About net income and savings rate" style={styles.infoButton} />
        </View>
        <ThemedText color={foreground} style={styles.heroLabel}>Net income</ThemedText>
        <Animated.View style={valueAnimation}>
          {ready ? <AnimatedNetIncome value={summary.netIncome} color={foreground} /> : <ThemedText color={foreground} style={styles.heroValue}>—</ThemedText>}
        </Animated.View>
        <ThemedText color={foreground} style={styles.caption}>
          {!ready ? 'Your summary is on its way' : negative ? 'Spending is ahead of recorded income' : (incomeStats?.count ?? 0) === 0 ? 'Your next chapter starts with an entry' : 'What’s left after your expenses'}
        </ThemedText>
        {stretch && <View style={styles.heroSpacer} />}
        <View style={[styles.savings, { backgroundColor: Color(colors.surface).alpha(0.65).string() }]}>
          <View style={styles.headingRow}>
            <Icon source="piggy-bank-outline" size={22} color={accent} />
            <ThemedText style={styles.savingsLabel}>Savings rate</ThemedText>
            <ThemedText style={[styles.savingsValue, { color: accent }]}>{ready && hasIncome ? `${rate}%` : '—'}</ThemedText>
          </View>
          <View accessible accessibilityRole="progressbar" accessibilityLabel="Savings rate, visual scale from zero to one hundred percent" accessibilityValue={ready && hasIncome ? { min: 0, max: 100, now: progress, text: `${rate}%` } : { text: 'Not available' }} style={[styles.track, { backgroundColor: Color(accent).alpha(0.12).string() }]}>
            <Animated.View style={[styles.fill, { backgroundColor: accent }, meterAnimation]} />
          </View>
          <ThemedText color={colors.muted} style={styles.small}>{ready && !hasIncome ? 'Add income to see your savings rate' : 'The share of income left after spending'}</ThemedText>
        </View>
      </LinearGradient>
      <Portal>
        <Dialog visible={showInfo} onDismiss={() => setShowInfo(false)}>
          <Dialog.Title>Your financial snapshot</Dialog.Title>
          <Dialog.Content>
            <ThemedText>Net income is recorded income minus expenses for the selected period. A negative amount means spending exceeds the income you have entered.</ThemedText>
            <ThemedText style={styles.infoText}>Savings rate is net income divided by income, expressed as a percentage. The meter displays 0–100%; the number shows your actual rate. Without recorded income, the rate is unavailable.</ThemedText>
          </Dialog.Content>
          <Dialog.Actions><Button onPress={() => setShowInfo(false)}>Got it</Button></Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

function AnimatedNetIncome({ value, color }: { value: number; color: string }) {
  const { formatCurrency } = useCurrency();
  const [animatedValue] = useState(() => new NativeAnimated.Value(0));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: nextValue }) => setDisplayValue(nextValue));
    const animation = NativeAnimated.timing(animatedValue, {
      toValue: value,
      duration: 1000,
      easing: NativeEasing.out(NativeEasing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => { if (finished) setDisplayValue(value); });
    return () => {
      animation.stop();
      animatedValue.removeListener(listener);
    };
  }, [value, animatedValue]);

  return (
    <View accessible accessibilityLabel={`Net income ${formatCurrency(value)}`}>
      <ThemedText accessible={false} color={color} style={styles.heroValue}>{formatCurrency(displayValue)}</ThemedText>
    </View>
  );
}

export function HomeActivityStats({ kind, stats, isLoading }: {
  kind: 'expense' | 'income';
  stats?: PeriodExpenseStats | PeriodIncomeStats;
  isLoading: boolean;
}) {
  const { colors } = useAppTheme();
  const { formatCurrency } = useCurrency();
  const categories = useExpenseCategoryMapping();
  const sources = useIncomeSourceMapping();
  const { width, fontScale } = useWindowDimensions();
  const expense = kind === 'expense';
  const accent = expense ? colors.primary : colors.tertiary;
  const tint = expense ? colors.primaryContainer : colors.tertiaryContainer;
  const narrow = width < 360 || fontScale > 1.2;
  const ready = !isLoading && stats !== undefined;
  const category = stats && 'topCategory' in stats ? categories.get(stats.topCategory ?? '') : null;
  const source = stats && 'topSource' in stats ? sources.get(stats.topSource ?? '') : null;
  const top = expense ? category : source;
  const money = (value: number | undefined) => ready ? formatCurrency(value ?? 0) : '—';
  const tiles = [
    { title: 'Daily average', icon: 'calendar-today', value: money(stats?.avgPerDay) },
    { title: expense ? 'Top category' : 'Top source', icon: top?.icon || 'star-outline', value: ready ? top?.label ?? 'No entries yet' : '—' },
    { title: expense ? 'Biggest expense' : 'Biggest income', icon: 'arrow-top-right', value: money(stats?.max) },
    { title: expense ? 'Smallest expense' : 'Smallest income', icon: 'arrow-bottom-right', value: money(stats?.min) },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={[styles.sectionBadge, { backgroundColor: tint }]}><Icon source={expense ? 'arrow-top-right' : 'arrow-bottom-left'} size={20} color={accent} /></View>
        <View style={styles.sectionTitleWrap}>
          <ThemedText style={styles.sectionTitle}>{expense ? 'Spending story' : 'Income story'}</ThemedText>
          <ThemedText color={colors.muted} style={styles.small}>{expense ? 'Where your money went' : 'What came your way'}</ThemedText>
        </View>
      </View>
      <View style={[styles.totalCard, { backgroundColor: tint }]}>
        <View style={styles.totalContent}>
          <ThemedText color={expense ? colors.onPrimaryContainer : colors.onTertiaryContainer} style={styles.totalLabel}>{expense ? 'Total expenses' : 'Total income'}</ThemedText>
          <ThemedText color={expense ? colors.onPrimaryContainer : colors.onTertiaryContainer} style={styles.totalValue}>{money(stats?.total)}</ThemedText>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
          <Icon source={expense ? 'receipt-text-outline' : 'cash-plus'} size={22} color={accent} />
          <ThemedText style={styles.countValue} color={accent}>{ready ? stats.count : '—'}</ThemedText>
          <ThemedText style={styles.small} color={colors.muted}>{ready && stats.count === 1 ? 'entry' : 'entries'}</ThemedText>
        </View>
      </View>
      <View style={styles.grid}>
        {tiles.map(tile => (
          <View key={tile.title} style={[styles.tile, { width: narrow ? '100%' : '48%', backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.tileBadge, { backgroundColor: tint }]}><Icon source={tile.icon} size={18} color={accent} /></View>
            <ThemedText color={colors.muted} style={styles.tileLabel}>{tile.title}</ThemedText>
            <ThemedText style={styles.tileValue}>{tile.value}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 16, borderRadius: 28, overflow: 'hidden', gap: 6 },
  stretchedHero: { flex: 1 },
  heroSpacer: { flexGrow: 1 },
  orbit: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 32, right: -100, top: -85 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { padding: 10, borderRadius: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, lineHeight: 16, fontWeight: '700', flex: 1 },
  infoButton: { margin: 0 },
  heroLabel: { marginTop: 8, fontSize: 14, fontWeight: '600' },
  heroValue: { fontSize: 32, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
  caption: { fontSize: 12, lineHeight: 19 },
  savings: { padding: 12, borderRadius: 18, marginTop: 10, gap: 8 },
  savingsLabel: { flex: 1, fontSize: 12, fontWeight: '600' },
  savingsValue: { fontSize: 18, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  small: { fontSize: 11, lineHeight: 17 },
  infoText: { marginTop: 12 },
  section: { gap: 10 },
  sectionBadge: { padding: 10, borderRadius: 14 },
  sectionTitleWrap: { flex: 1 },
  sectionTitle: { fontSize: 19, fontWeight: '700', lineHeight: 26 },
  totalCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 24 },
  totalContent: { flex: 1 },
  totalLabel: { fontSize: 12, fontWeight: '600' },
  totalValue: { fontSize: 26, lineHeight: 34, fontWeight: '800', marginTop: 4 },
  countBadge: { padding: 8, borderRadius: 18, alignItems: 'center', maxWidth: '40%' },
  countValue: { fontSize: 18, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tile: { borderWidth: StyleSheet.hairlineWidth, padding: 12, borderRadius: 22, gap: 3 },
  tileBadge: { alignSelf: 'flex-start', padding: 6, borderRadius: 12, marginBottom: 2 },
  tileLabel: { fontSize: 11, lineHeight: 18 },
  tileValue: { fontSize: 17, lineHeight: 25, fontWeight: '700' },
});
