import React, { useCallback } from 'react';
import { View, ScrollView, FlatList, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { ActivityIndicator, Button, Icon } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { ThemedText } from '@/components/base/ThemedText';
import FormSheetHeader from '@/components/main/FormSheetHeader';
import useStatsStore from '@/stores/useStatsStore';
import { StatsPeriodOption } from '@/lib/types';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useRouter } from 'expo-router';
import { getAvailablePeriodsWithData } from '@/repositories/CommonRepo';
import { useHaptics } from '@/contexts/HapticsProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const quickPeriods: StatsPeriodOption[] = [
  { primaryLabel: 'Today', type: 'today' },
  { primaryLabel: 'This', secondaryLabel: 'Week', type: 'week', offset: 0 },
  { primaryLabel: 'Last', secondaryLabel: 'Week', type: 'week', offset: 1 },
  { primaryLabel: 'All Time', type: 'all-time' },
];

export default function SelectStatsPeriodScreen() {
  const { colors } = useAppTheme();
  const period = useStatsStore(state => state.period);
  const setPeriod = useStatsStore(state => state.setPeriod);
  const router = useRouter();
  const { hapticImpact } = useHaptics();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['stats', 'available-periods'],
    queryFn: getAvailablePeriodsWithData,
  });
  const handleSelect = useCallback((option: StatsPeriodOption) => {
    hapticImpact();
    setPeriod(option);
    router.back();
  }, [hapticImpact, setPeriod, router]);

  return (
    <View style={{ backgroundColor: colors.card, maxHeight: height - insets.top - 24 }}>
      <FormSheetHeader title="Select period" onClose={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.current, { backgroundColor: colors.primaryContainer }]}>
          <Icon source="calendar-check-outline" size={24} color={colors.primary} />
          <View style={styles.currentText}>
            <ThemedText color={colors.onPrimaryContainer} style={styles.caption}>CURRENTLY VIEWING</ThemedText>
            <ThemedText color={colors.onPrimaryContainer} style={styles.currentLabel}>{[period.primaryLabel, period.secondaryLabel].filter(Boolean).join(' ')}</ThemedText>
          </View>
          <Icon source="check-circle" size={22} color={colors.primary} />
        </View>
        <PeriodSection title="Quick picks" icon="lightning-bolt-outline" periods={quickPeriods} selected={period} onSelect={handleSelect} />
        {isPending && <View style={styles.status}><ActivityIndicator size="small" /><ThemedText color={colors.muted}>Loading your periods…</ThemedText></View>}
        {isError && <View style={styles.status}><ThemedText color={colors.muted}>Couldn’t load your history.</ThemedText><Button onPress={() => refetch()}>Try again</Button></View>}
        {!!data?.months.length && <PeriodSection title="By month" icon="calendar-month-outline" periods={data.months} selected={period} onSelect={handleSelect} />}
        {!!data?.years.length && <PeriodSection title="By year" icon="calendar-range" periods={data.years} selected={period} onSelect={handleSelect} />}
        {data && !data.months.length && !data.years.length && <ThemedText color={colors.muted} style={styles.hint}>Add an expense or income to explore more periods.</ThemedText>}
        <ThemedText color={colors.muted} style={styles.hint}>Choose a period to update your overview and stats.</ThemedText>
      </ScrollView>
    </View>
  );
}

function PeriodSection({ title, icon, periods, selected, onSelect }: {
  title: string;
  icon: string;
  periods: StatsPeriodOption[];
  selected: StatsPeriodOption;
  onSelect: (period: StatsPeriodOption) => void;
}) {
  const { colors } = useAppTheme();
  const renderItem = useCallback(({ item }: { item: StatsPeriodOption }) => {
    const active = selected.type === item.type && (selected.offset ?? 0) === (item.offset ?? 0);
    return (
      <View style={[styles.option, { backgroundColor: active ? colors.primaryContainer : colors.surface, borderColor: active ? colors.primary : colors.border }]}>
        <Pressable style={({ pressed }) => [styles.optionContent, pressed && styles.pressed]}
          onPress={() => onSelect(item)} accessibilityRole="radio" accessibilityState={{ checked: active }}
          accessibilityLabel={[item.primaryLabel, item.secondaryLabel].filter(Boolean).join(' ')}
          android_ripple={{ color: colors.ripplePrimary, foreground: true }}>
          <View style={styles.optionTop}>
            <Icon source={item.type === 'all-time' ? 'infinity' : icon} size={20} color={active ? colors.primary : colors.muted} />
            <Icon source={active ? 'check-circle' : 'circle-outline'} size={16} color={active ? colors.primary : colors.border} />
          </View>
          <ThemedText color={active ? colors.onPrimaryContainer : colors.text} style={styles.optionLabel}>{item.primaryLabel}</ThemedText>
          {item.secondaryLabel && <ThemedText color={active ? colors.onPrimaryContainer : colors.muted} style={styles.secondary}>{item.secondaryLabel}</ThemedText>}
        </Pressable>
      </View>
    );
  }, [selected.type, selected.offset, colors, icon, onSelect]);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Icon source={icon} size={18} color={colors.muted} />
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
      <FlatList horizontal data={periods} renderItem={renderItem} keyExtractor={item => `${item.type}-${item.offset ?? 0}`}
        extraData={selected} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  content: { paddingTop: 16, gap: 20 },
  current: { marginHorizontal: 20, padding: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  currentText: { flex: 1, gap: 3 },
  caption: { fontSize: 9, lineHeight: 14, letterSpacing: 1, fontWeight: '600' },
  currentLabel: { fontSize: 16, lineHeight: 23, fontWeight: '700' },
  section: { gap: 10 },
  sectionHeading: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 13, lineHeight: 20, fontWeight: '700' },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  options: { paddingHorizontal: 20, gap: 10, alignItems: 'stretch' },
  option: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  optionContent: { padding: 14, minWidth: 110, maxWidth: 220, minHeight: 108, gap: 3, flexGrow: 1 },
  optionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 24, marginBottom: 8 },
  optionLabel: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  secondary: { fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.85 },
  status: { alignItems: 'center', gap: 10, paddingHorizontal: 20 },
  hint: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginHorizontal: 24 },
});
