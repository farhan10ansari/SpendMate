import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useIncomeSourceMapping } from "@/contexts/CategoryDataProvider";
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useCurrency } from '@/contexts/CurrencyProvider';

interface IncomeSourceStat {
  source: string;
  total: number;
  count: number;
}

interface Props {
  data?: IncomeSourceStat[];
  title?: string;
}

export default function IncomeSourcesBreakdownCard({
  data,
  title = 'Income Sources',
}: Props) {
  const { colors } = useAppTheme();
  // Get the source mapping
  const sourceMapping = useIncomeSourceMapping()
  const { formatCurrency } = useCurrency()


  if (!data || data.length === 0) {
    return (
      <Card style={[styles.container, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
          <ThemedText style={[styles.noData, { color: colors.text }]}>
            No income data available
          </ThemedText>
        </Card.Content>
      </Card>
    );
  }

  const grandTotal = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card style={[styles.container, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
        {data.map((item) => {
          const cfg = sourceMapping.get(item.source) ?? {
            name: item.source,
            label: item.source,
            icon: 'help',
            color: colors.error,
            deletable: false,
            enabled: true,
          };
          const label = cfg.label || item.source;
          const percentage = grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(1) : '0.0';

          return (
            <View key={item.source} style={styles.item}>
              <View style={styles.itemHeader}>
              <View style={styles.leftContainer}>
                <CategoryIcon
                  size={36}
                  icon={cfg.icon}
                  color={cfg.color}
                />
                <ThemedText style={[styles.sourceText, { color: colors.text, marginLeft: 8 }]}>
                  {label}
                </ThemedText>
              </View>
              <View style={styles.rightContainer}>
                <ThemedText style={[styles.amountText, { color: colors.text }]}>{formatCurrency(item.total)}</ThemedText>
                <ThemedText style={[styles.percentageText, { color: colors.text }]}>
                  {percentage}% <ThemedText style={{ color: colors.muted }}>({item.count} txns)</ThemedText>
                </ThemedText>
              </View>
              </View>
              <View style={[styles.track, { backgroundColor: colors.surfaceVariant }]}>
                <View style={[styles.fill, { backgroundColor: cfg.color, width: `${Math.max(0, Math.min(100, Number(percentage)))}%` }]} />
              </View>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 6, borderRadius: 24, elevation: 0 },
  title: { fontSize: 17, fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.5 },
  item: { paddingVertical: 8, gap: 8 },
  itemHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  leftContainer: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1, minWidth: 120 },
  sourceText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  amountText: { fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  percentageText: { fontSize: 13, opacity: 0.7, marginTop: 2, textAlign: 'right' },
  noData: { textAlign: 'center', fontStyle: 'italic', paddingVertical: 20, fontSize: 15, opacity: 0.6 },
  rightContainer: { alignItems: 'flex-end', minWidth: 90 },
});
