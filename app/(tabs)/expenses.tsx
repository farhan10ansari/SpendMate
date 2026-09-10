import { StyleSheet } from "react-native";
import { FAB, Portal } from "react-native-paper";
import { useRef, useState } from "react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useIsFocused } from "expo-router/react-navigation";
import MonthTabsContainer from "@/features/Expense/components/MonthTabsContainer";
import ExpensesList, { ExpenseListItem } from "@/features/Expense/components/ExpenseList";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashListRef } from "@shopify/flash-list";
import { useSnackbarState } from "@/contexts/GlobalSnackbarProvider";


export default function ExpensesScreen() {
    const [selectedOffsetMonth, setSelectedOffsetMonth] = useState<number | null>(null);
    const scrollElementRef = useRef<FlashListRef<ExpenseListItem>>(null);
    const { handleScroll, scrollToTop, showScrollToTop } = useScrollToTop(scrollElementRef);
    const isFocused = useIsFocused();
    const globalSnackbar = useSnackbarState()
    const insets = useSafeAreaInsets();

    const handleMonthSelect = (offsetMonth: number | null) => {
        setSelectedOffsetMonth(offsetMonth);
        // Scroll to top when changing tabs
        scrollToTop();
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1
        },
        fab: {
            position: "absolute",
            right: insets.right + 16,
            bottom: insets.bottom + 60,
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
                selectedOffsetMonth={selectedOffsetMonth}
                onMonthSelect={handleMonthSelect}
            />
            <ExpensesList
                selectedOffsetMonth={selectedOffsetMonth}
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
