import { StyleSheet } from "react-native";
import { FAB, Portal } from "react-native-paper";
import { useCallback, useRef, useState } from "react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useIsFocused } from "expo-router/react-navigation";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import MonthTabsContainer from "@/features/Expense/components/MonthTabsContainer";
import ExpensesList, { ExpenseListItem } from "@/features/Expense/components/ExpenseList";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashListRef } from "@shopify/flash-list";
import { useSnackbarState } from "@/contexts/GlobalSnackbarProvider";


export default function ExpensesScreen() {
    const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
    const scrollElementRef = useRef<FlashListRef<ExpenseListItem>>(null);
    const { handleScroll, scrollToTop, showScrollToTop } = useScrollToTop(scrollElementRef);
    const isFocused = useIsFocused();
    const globalSnackbar = useSnackbarState()
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();

    const handleMonthSelect = useCallback((monthKey: string | null) => {
        setSelectedMonthKey(monthKey);
        // Scroll to top when changing tabs
        scrollToTop();
    }, [scrollToTop]);

    const styles = StyleSheet.create({
        container: {
            flex: 1
        },
        fab: {
            position: "absolute",
            right: insets.right + 16,
            bottom: tabBarHeight + 16,
            height: 48,
            width: 48,
            justifyContent: 'center',
            alignItems: 'center',
        },
    });

    return (
        <ScreenWrapper containerStyle={styles.container}
            background="background"
        >
            <MonthTabsContainer
                selectedMonthKey={selectedMonthKey}
                onMonthSelect={handleMonthSelect}
            />
            <ExpensesList
                selectedMonthKey={selectedMonthKey}
                onScroll={handleScroll}
                scrollRef={scrollElementRef}
            />
            <Portal>
                <FAB
                    visible={showScrollToTop && isFocused && !globalSnackbar}
                    variant="tertiary"
                    icon="arrow-up"
                    style={styles.fab}
                    onPress={scrollToTop}
                />
            </Portal>
        </ScreenWrapper>
    );
}
