import { StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { getAvailableExpenseMonths } from "@/repositories/ExpenseRepo";
import MonthTab from "./MonthTab";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useEffect } from "react";

// Define the type for month data
interface MonthData {
    monthKey: string;
    month: string;
    count: number;
}

interface MonthTabsContainerProps {
    selectedMonthKey: string | null; // null means "All"
    onMonthSelect: (monthKey: string | null) => void;
}

export default function MonthTabsContainer({
    selectedMonthKey,
    onMonthSelect
}: MonthTabsContainerProps) {
    const { colors } = useAppTheme();

    const { data: availableMonths = [], isLoading, isSuccess } = useQuery({
        queryKey: ["expenses", "availableExpenseMonths", "calendar-months"],
        queryFn: getAvailableExpenseMonths,
    });

    // If edits/deletions remove the selected month, return to the complete list.
    useEffect(() => {
        if (isSuccess && selectedMonthKey !== null
            && !availableMonths.some(month => month.monthKey === selectedMonthKey)) {
            onMonthSelect(null);
        }
    }, [availableMonths, isSuccess, selectedMonthKey, onMonthSelect]);

    const styles = StyleSheet.create({
        container: {
            backgroundColor: colors.background,
            paddingVertical: 10,

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
            isSelected={selectedMonthKey === item.monthKey}
            onPress={() => onMonthSelect(item.monthKey)}
        />
    );

    return (
        <View style={styles.container}>
            <FlashList
                data={availableMonths}
                renderItem={renderMonthTab}
                keyExtractor={(item) => item.monthKey}
                extraData={selectedMonthKey}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                ListHeaderComponent={
                    <MonthTab
                        month="All"
                        count={totalCount}
                        isSelected={selectedMonthKey === null}
                        onPress={() => onMonthSelect(null)}
                    />
                }
            />
        </View>
    );
}
