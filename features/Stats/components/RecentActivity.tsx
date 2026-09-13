import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, TouchableRipple } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useCurrency } from '@/contexts/CurrencyProvider';
import { useExpenseCategoryMapping, useIncomeSourceMapping } from '@/contexts/CategoryDataProvider';
import { RecentActivity as Activity } from '@/repositories/RecentActivityRepo';

export default function RecentActivity({ items, isLoading, isError, onRetry }: {
  items: Activity[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { colors } = useAppTheme();
  const { formatCurrency } = useCurrency();
  const categories = useExpenseCategoryMapping();
  const sources = useIncomeSourceMapping();
  const router = useRouter();

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
          <Icon source="history" size={20} color={colors.primary} />
        </View>
        <View>
          <ThemedText style={styles.title}>Recent activity</ThemedText>
          <ThemedText color={colors.muted} style={styles.caption}>Latest entries in this period</ThemedText>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {isError ? <View style={styles.empty}>
          <ThemedText color={colors.muted}>Couldn’t load recent activity.</ThemedText>
          <Button onPress={onRetry}>Try again</Button>
        </View> : isLoading || items.length === 0 ? <View style={styles.empty}>
          <ThemedText color={colors.muted}>{isLoading ? 'Loading recent activity…' : 'No entries in this period yet'}</ThemedText>
        </View> : items.map((item, index) => {
          const expense = item.kind === 'expense';
          const category = (expense ? categories : sources).get(item.category);
          const accent = expense ? colors.primary : colors.tertiary;
          const label = category?.label ?? (expense ? 'Expense' : 'Income');
          const amount = `${expense ? '−' : '+'}${formatCurrency(item.amount)}`;
          return (
            <React.Fragment key={`${item.kind}-${item.id}`}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableRipple onPress={() => router.push(expense ? `/expense/${item.id}` : `/income/${item.id}`)} accessibilityRole="button" accessibilityLabel={`${label}, ${amount}, ${format(item.dateTime, 'd MMM yyyy, h:mm a')}`}>
                <View style={styles.row}>
                  <View style={[styles.badge, { backgroundColor: expense ? colors.primaryContainer : colors.tertiaryContainer }]}>
                    <Icon source={category?.icon || (expense ? 'receipt-text-outline' : 'cash-plus')} size={20} color={accent} />
                  </View>
                  <View style={styles.details}>
                    <ThemedText numberOfLines={1} style={styles.label}>{item.description?.trim() || label}</ThemedText>
                    <ThemedText numberOfLines={1} color={colors.muted} style={styles.caption}>{label} · {format(item.dateTime, 'd MMM, h:mm a')}</ThemedText>
                  </View>
                  <ThemedText color={accent} style={styles.amount}>{amount}</ThemedText>
                </View>
              </TouchableRipple>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 19, fontWeight: '700', lineHeight: 26 },
  caption: { fontSize: 11, lineHeight: 17 },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  badge: { padding: 10, borderRadius: 14 },
  details: { flex: 1, minWidth: 120 },
  label: { fontSize: 14, fontWeight: '600', lineHeight: 22 },
  amount: { fontSize: 14, fontWeight: '700', marginLeft: 'auto' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  empty: { padding: 20, alignItems: 'center' },
});
