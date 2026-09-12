import React from "react";
import { View, ScrollView, FlatList } from "react-native";
import { Card, Divider } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/base/ThemedText";
import { ThemedView } from "@/components/base/ThemedView";
import FormSheetHeader from "@/components/main/FormSheetHeader";
import PressableCard from "@/components/ui/PressableCard";
import useStatsStore from "@/stores/useStatsStore";
import { StatsPeriodOption } from "@/lib/types";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useRouter } from "expo-router";
import { getAvailablePeriodsWithData } from "@/repositories/CommonRepo";
import { useHaptics } from "@/contexts/HapticsProvider";

export default function SelectStatsPeriodScreen() {
  const { colors } = useAppTheme();
  const period = useStatsStore((state) => state.period);
  const setPeriod = useStatsStore((state) => state.setPeriod);
  const router = useRouter();
  const { hapticImpact } = useHaptics();

  const { data: periodsData } = useQuery({
    queryKey: ["stats", "available-periods"],
    queryFn: getAvailablePeriodsWithData,
  });

  const quickPeriodOptions: StatsPeriodOption[] = [
    { primaryLabel: "Today", type: "today" },
    { primaryLabel: "This", secondaryLabel: "Week", type: "week", offset: 0 },
    { primaryLabel: "Last", secondaryLabel: "Week", type: "week", offset: 1 },
    { primaryLabel: "All Time", type: "all-time" },
  ];

  const handleSelectPeriod = (selectedPeriod: StatsPeriodOption) => {
    hapticImpact();
    setPeriod(selectedPeriod);
    setTimeout(() => router.back(), 150);
  };

  return (
    <ThemedView style={{ backgroundColor: colors.card, paddingBottom: 40 }}>
      <FormSheetHeader title="Select Period" onClose={() => router.back()} />
      <View style={{ paddingHorizontal: 12, gap: 4, marginTop: 14 }}>
        <View style={{ marginBottom: 8, gap: 8, position: "relative" }}>
          <SectionHeader title="Quick Access" color={colors.onSurface} />
          <PeriodList
            periods={quickPeriodOptions}
            selectedPeriod={period}
            onSelect={handleSelectPeriod}
            variant="tertiary"
          />
        </View>

        <Divider />

        {periodsData?.months && periodsData.months.length > 0 && (
          <View style={{ marginBottom: 8, gap: 8, position: "relative" }}>
            <SectionHeader title="Months" color={colors.onSurface} />
            <PeriodList
              periods={periodsData.months}
              selectedPeriod={period}
              onSelect={handleSelectPeriod}
              variant="primary"
              useFlatList={true}
            />
          </View>
        )}

        <Divider />

        {periodsData?.years && periodsData.years.length > 0 && (
          <View style={{ marginBottom: 8, gap: 8, position: "relative" }}>
            <SectionHeader title="Years" color={colors.onSurface} />
            <PeriodList
              periods={periodsData.years}
              selectedPeriod={period}
              onSelect={handleSelectPeriod}
              variant="tertiary"
            />
          </View>
        )}

        {periodsData &&
          periodsData.months?.length === 0 &&
          periodsData.years?.length === 0 &&
          <EmptyState />}
      </View>
    </ThemedView>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <ThemedText type="subtitle" style={{ color, fontSize: 12, marginBottom: 4, position: "absolute", top: 5, left: 5, zIndex: 999 }}>
      {title}
    </ThemedText>
  );
}


function PeriodList({
  periods,
  selectedPeriod,
  onSelect,
  variant = "primary",
  useFlatList = false,
}: {
  periods: StatsPeriodOption[];
  selectedPeriod: StatsPeriodOption;
  onSelect: (period: StatsPeriodOption) => void;
  variant?: "primary" | "secondary" | "tertiary";
  useFlatList?: boolean;
}) {
  const isSelected = (option: StatsPeriodOption) =>
    selectedPeriod.type === option.type && selectedPeriod.offset === option.offset;

  const renderCard = (item: StatsPeriodOption, index?: number) => (
    <PressableCard
      key={`${item.type}-${item.offset ?? ""}`}
      primaryLabel={item.primaryLabel}
      secondaryLabel={item.secondaryLabel}
      isSelected={isSelected(item)}
      onPress={() => onSelect(item)}
      variant={variant}
    />
  );

  if (useFlatList) {
    return (
      <FlatList
        data={periods}
        keyExtractor={(item, index) => `${item.type}-${item.offset}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingTop: 32, paddingBottom: 10 }}
        renderItem={({ item }) => renderCard(item)}
      />
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 32, paddingBottom: 10 }}>
      {periods.map((item, index) => renderCard(item, index))}
    </ScrollView>
  );
}

function EmptyState() {
  const { colors } = useAppTheme();
  return (
    <Card style={{ margin: 8, backgroundColor: colors.surface }}>
      <Card.Content style={{ padding: 16 }}>
        <ThemedText style={{ color: colors.onSurface, textAlign: "center", fontSize: 12, opacity: 0.8, lineHeight: 18 }}>
          No historical data available.
          {"\n"}Start adding expenses or incomes to see more periods.
        </ThemedText>
      </Card.Content>
    </Card>
  );
}
