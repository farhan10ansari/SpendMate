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
  const { colors, dark } = useAppTheme();
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
    [data, sourceMapping, totalSum, showAbsolute, colors]
  );

  if (!chartData.length) return null;

  const styles = StyleSheet.create({
    container: { alignItems: 'center', width: '100%' },
    card: { borderRadius: 8, width: '100%', elevation: 2, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 16 },
    toggleGroup: { flexDirection: 'row', borderWidth: 1, borderRadius: 4, borderColor: colors.muted, overflow: 'hidden' },
    toggleBtn: { paddingVertical: 6, paddingHorizontal: 14, borderColor: 'transparent' },
    switchContainer: { flexDirection: 'row', alignItems: 'center' },
    switchLabel: { marginRight: 8, fontSize: 14 },
    chartWrapper: { alignItems: 'center', paddingVertical: 16 },
    legendContainer: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', margin: 4 },
    legendColorBox: { width: 10, height: 10, marginRight: 6, borderRadius: 2 },
    legendText: { fontSize: 12 },
    tooltip: { padding: 8, borderRadius: 4, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, backgroundColor: colors.surface }
  });

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        {/* Header controls */}
        <View style={styles.header}>
          <View style={styles.toggleGroup}>
            <Pressable
              android_ripple={{ color: colors.backdrop, foreground: true }}
              onPress={() => setChartType('pie')}
              style={styles.toggleBtn}
            >
              <ThemedText color={chartType === 'pie' ? colors.tertiary : colors.text}>Pie</ThemedText>
            </Pressable>
            <Pressable
              android_ripple={{ color: colors.backdrop, foreground: true }}
              onPress={() => setChartType('bar')}
              style={styles.toggleBtn}
            >
              <ThemedText color={chartType === 'bar' ? colors.tertiary : colors.text}>Bar</ThemedText>
            </Pressable>
          </View>
          <View style={styles.switchContainer}>
            <ThemedText style={[styles.switchLabel, { color: colors.text }]}>Show absolute</ThemedText>
            <Switch
              value={showAbsolute}
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
                  <ThemedText style={{ color: colors.tertiary, fontWeight: '600' }}>
                    ₹{totalSum.toFixed(2)}
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
              barWidth={chartSize / (chartData.length * 1.7)}
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
