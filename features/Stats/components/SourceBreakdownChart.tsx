import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { Card, Switch } from 'react-native-paper';
import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { IncomeSourceStat } from '@/lib/types';
import { useIncomeSourceMapping } from "@/contexts/CategoryDataProvider";
import { useCurrency } from '@/contexts/CurrencyProvider';

type IncomeBreakdownData = { data?: IncomeSourceStat[] };

export default function IncomeSourceBreakdownChart({ data }: IncomeBreakdownData) {
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const chartSize = windowWidth - 54;
  // Get the source mapping
  const sourceMapping = useIncomeSourceMapping()
  const { formatCurrency, currencyData } = useCurrency()


  const [showAbsolute, setShowAbsolute] = useState(true);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const totalSum = useMemo(
    () => data?.reduce((sum, src) => sum + src.total, 0) ?? 0,
    [data]
  );

  const chartData = useMemo(
    () =>
      data?.map((src) => {
        const cfg = sourceMapping.get(src.source) ?? {
          name: src.source,
          label: src.source,
          icon: 'help',
          color: colors.error,
          deletable: false,
          enabled: true,
        };
        const absVal = parseFloat(src.total.toFixed(2));
        const pctVal = totalSum > 0 ? parseFloat(((src.total / totalSum) * 100).toFixed(1)) : 0;
        return {
          value: showAbsolute ? absVal : pctVal,
          color: cfg.color ?? colors.primary,
          text: showAbsolute ? formatCurrency(absVal) : `${pctVal}%`,
          label: cfg.label ?? src.source,
          frontColor: cfg.color ?? colors.primary // for bar chart
        };
      }) || [],
    [data, sourceMapping, totalSum, showAbsolute, colors, formatCurrency]
  );

  if (!chartData.length) return null;

  const styles = StyleSheet.create({
    container: { alignItems: 'center', width: '100%' },
    card: { borderRadius: 24, width: '100%', elevation: 0, overflow: 'hidden', backgroundColor: colors.surface },
    title: { fontSize: 17, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16 },
    header: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 16 },
    toggleGroup: { flexDirection: 'row', borderRadius: 14, backgroundColor: colors.surfaceVariant, overflow: 'hidden' },
    toggleBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, overflow: 'hidden' },
    switchContainer: { flexDirection: 'row', alignItems: 'center' },
    switchLabel: { marginRight: 8, fontSize: 14 },
    chartWrapper: { alignItems: 'center', paddingVertical: 10 },
    legendContainer: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', margin: 4, maxWidth: '100%', padding: 6, borderRadius: 12, backgroundColor: colors.surfaceVariant },
    legendColorBox: { width: 10, height: 10, marginRight: 6, borderRadius: 5 },
    legendText: { fontSize: 12, flexShrink: 1 },
    tooltip: { padding: 8, borderRadius: 4, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, backgroundColor: colors.surface }
  });

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <ThemedText style={styles.title}>The big picture</ThemedText>
        {/* Header controls */}
        <View style={styles.header}>
          <View style={styles.toggleGroup}>
            <Pressable
              android_ripple={{ color: colors.backdrop }}
              onPress={() => setChartType('pie')}
              accessibilityRole="button"
              accessibilityState={{ selected: chartType === 'pie' }}
              style={[styles.toggleBtn, chartType === 'pie' && { backgroundColor: colors.tertiaryContainer }]}
            >
              <ThemedText color={chartType === 'pie' ? colors.tertiary : colors.text}>Pie</ThemedText>
            </Pressable>
            <Pressable
              android_ripple={{ color: colors.backdrop }}
              onPress={() => setChartType('bar')}
              accessibilityRole="button"
              accessibilityState={{ selected: chartType === 'bar' }}
              style={[styles.toggleBtn, chartType === 'bar' && { backgroundColor: colors.tertiaryContainer }]}
            >
              <ThemedText color={chartType === 'bar' ? colors.tertiary : colors.text}>Bar</ThemedText>
            </Pressable>
          </View>
          <View style={styles.switchContainer}>
            <ThemedText style={[styles.switchLabel, { color: colors.muted }]}>Amounts</ThemedText>
            <Switch
              value={showAbsolute}
              accessibilityLabel="Show amounts instead of percentages"
              onValueChange={setShowAbsolute}
              color={colors.tertiary}
            />
          </View>
        </View>
        {/* Chart area */}
        <View style={[styles.chartWrapper, { width: chartSize }]}>
          {chartType === 'pie' ? (
            <>
              <PieChart
                data={chartData}
                donut
                innerCircleColor={colors.surface}
                radius={chartSize * 0.25}
                innerRadius={chartSize * 0.18}
                showValuesAsLabels
                labelsPosition="outward"
                labelLineConfig={{ length: 12, tailLength: 6, color: colors.text, thickness: 1 }}
                textColor={colors.onSecondary}
                textSize={12}
                showTooltip
                tooltipComponent={(idx: number) => {
                  const item = chartData[idx];
                  return (
                    <View style={styles.tooltip}>
                      <Text style={{ color: colors.text, fontSize: 12 }}>{item.label}</Text>
                    </View>
                  )
                }}
                centerLabelComponent={() => (
                  <ThemedText numberOfLines={2} adjustsFontSizeToFit style={{ color: colors.text, fontWeight: '700', textAlign: 'center', maxWidth: chartSize * 0.32 }}>
                    {formatCurrency(totalSum)}
                  </ThemedText>
                )}
              />
              <View style={styles.legendContainer}>
                {chartData.map((item, idx) => (
                  <View key={idx} style={styles.legendItem}>
                    <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>
                      {item.label}: {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <BarChart
              data={chartData}
              width={chartSize - 60}
              height={chartSize * 0.6}
              barWidth={Math.max(12, Math.min(42, chartSize / (chartData.length * 1.7)))}
              spacing={chartSize / (chartData.length * 5)}
              noOfSections={4}
              isAnimated
              xAxisLabelsHeight={60}
              xAxisTextNumberOfLines={2}
              xAxisLabelTextStyle={[{ color: colors.text, fontSize: 10 }, { transform: [{ rotate: '-90deg' }] }]}
              xAxisLabelsVerticalShift={40}
              yAxisTextStyle={{ color: colors.text, fontSize: 10 }}
              yAxisLabelSuffix={showAbsolute ? currencyData.symbol : '%'}
              yAxisLabelWidth={60}
            />
          )}
        </View>
      </Card>
    </View>
  );
}
