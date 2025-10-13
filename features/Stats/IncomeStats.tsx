import { ThemedText } from "@/components/base/ThemedText";
import styles from "./styles";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import StatsCard from "./components/StatsCard";
import { useWindowDimensions, View } from "react-native";
import { PeriodIncomeStats } from "@/lib/types";
import { useIncomeSourceMapping } from "@/contexts/CategoryDataProvider";
import { Icon } from "react-native-paper";
import { useCurrency } from "@/contexts/CurrencyProvider";

type Props = {
    incomeStats?: PeriodIncomeStats;
    showTitle?: boolean;
    isLoading?: boolean;
}

export default function IncomeStats({ incomeStats, showTitle = false, isLoading = false }: Props) {
    const { colors } = useAppTheme();
    const { formatCurrency } = useCurrency();
    const sourceMapping = useIncomeSourceMapping();
    const dimensions = useWindowDimensions()


    const topSource = incomeStats?.topSource
        ? sourceMapping.get(incomeStats?.topSource) : null;

    return (
        <View style={styles.section}>
            {showTitle && (
                <ThemedText style={[{ fontSize: 18, fontWeight: 'bold', color: colors.text }]}>
                    Income Statistics
                </ThemedText>
            )

            }
            <View style={(dimensions.width > 400 && dimensions.fontScale <= 1) ? styles.row : styles.column}>
                <StatsCard
                    title="Total Income"
                    value={formatCurrency(incomeStats?.total ?? 0)}
                    icon={<Icon source="cash-plus" size={24} color={colors.onTertiary} />}
                    backgroundColor={colors.tertiary}
                    textColor={colors.onTertiary}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Income Count"
                    value={incomeStats?.count ?? 0}
                    icon={<Icon source="plus-circle-outline" size={20} color={colors.tertiary} />}
                    textColor={colors.tertiary}
                    isLoading={isLoading}
                />
            </View>
            <View style={dimensions.width > 400 ? styles.row : styles.column}>
                <StatsCard
                    title="Daily Avg Income"
                    titleStyle={{
                        fontSize: 12
                    }}
                    value={formatCurrency(incomeStats?.avgPerDay ?? 0)}
                    icon={<Icon source="trending-up" size={24} color={colors.tertiary} />}
                    textColor={colors.text}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Top Income Source"
                    titleStyle={{
                        fontSize: 12
                    }}
                    value={topSource?.label ?? 'No data'}
                    icon={<Icon source="source-branch" size={24} color={colors.tertiary} />}
                    textColor={colors.text}
                    isLoading={isLoading}
                />
            </View>
            <StatsCard
                title="Max/Min Income"
                value={
                    <>
                        {formatCurrency(incomeStats?.max ?? 0)}/{formatCurrency(incomeStats?.min ?? 0)}
                    </>
                }
                icon={<Icon source="chart-timeline-variant" size={24} color={colors.tertiary} />}
                textColor={colors.text}
                isLoading={isLoading}
            />
        </View>
    )
}