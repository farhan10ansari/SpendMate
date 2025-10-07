import { StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { getAvailableExpenseMonths } from "@/repositories/ExpenseRepo";
import MonthTab from "./MonthTab";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";

// Define the type for month data
interface MonthData {
    offsetMonth: number;
    month: string;
    count: number;
}

interface MonthTabsContainerProps {
    selectedOffsetMonth: number | null; // null means "All"
    onMonthSelect: (offsetMonth: number | null) => void;
}

export default function MonthTabsContainer({
    selectedOffsetMonth,
    onMonthSelect
}: MonthTabsContainerProps) {
    const { colors } = useAppTheme();

    const { data: availableMonths = [], isLoading } = useQuery({
        queryKey: ["expenses", "availableExpenseMonths"],
        queryFn: getAvailableExpenseMonths,
    });

    const styles = StyleSheet.create({
        container: {
            backgroundColor: colors.background,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,

        },
        contentContainer: {
            paddingHorizontal: 16,
            alignItems: 'center',
        },
    });

    if (isLoading || availableMonths.length === 0) {
        return null;
    }

    // Calculate total count for "All" tab
    const totalCount = availableMonths.reduce((sum, month) => sum + month.count, 0);

    const renderMonthTab: ListRenderItem<MonthData> = ({ item }) => (
        <MonthTab
            month={item.month}
            count={item.count}
            isSelected={selectedOffsetMonth === item.offsetMonth}
            onPress={() => onMonthSelect(item.offsetMonth)}
        />
    );

    return (
        <View style={styles.container}>
            <FlashList
                data={availableMonths}
                renderItem={renderMonthTab}
                keyExtractor={(item) => item.offsetMonth.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                ListHeaderComponent={
                    <MonthTab
                        month="All"
                        count={totalCount}
                        isSelected={selectedOffsetMonth === null}
                        onPress={() => onMonthSelect(null)}
                    />
                }
            />
        </View>
    );
}
