import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import FormSheetHeader from "@/components/main/FormSheetHeader";
import FormSheetTabs from "@/components/main/FormSheetTabs";
import ExpenseForm from "@/features/Expense/ExpenseForm";
import { ExpenseStoreProvider } from "@/features/Expense/ExpenseStoreProvider";
import IncomeForm from "@/features/Income/IncomeForm";
import { IncomeStoreProvider } from "@/features/Income/IncomeStoreProvider";
import { useTransactionForm } from "@/hooks/useTransactionForm";
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { TabView } from 'react-native-tab-view';


type TransactionType = 'expense' | 'income';


const TABS = [
    { key: 'expense', label: 'Expense' },
    { key: 'income', label: 'Income' },
];


export default function NewTransactionScreen() {
    const { defaultTab } = useLocalSearchParams<{ defaultTab?: TransactionType }>();
    const [activeTab, setActiveTab] = useState<TransactionType>(defaultTab ?? 'expense');
    const { width } = useWindowDimensions();


    const {
        handleAddExpense,
        handleAddIncome,
    } = useTransactionForm();


    const handleTabChange = (tabKey: string) => {
        Keyboard.dismiss();
        setActiveTab(tabKey as TransactionType);
    };


    const renderForm = (tabKey: string) => {
        if (tabKey === 'expense') {
            return (
                <ExpenseStoreProvider>
                    <ExpenseForm
                        onSubmit={handleAddExpense}
                        isActive={activeTab === 'expense'}
                    />
                </ExpenseStoreProvider>
            );
        }


        return (
            <IncomeStoreProvider>
                <IncomeForm
                    onSubmit={handleAddIncome}
                    isActive={activeTab === 'income'}
                />
            </IncomeStoreProvider>
        );
    };


    return (
        <View style={styles.container}>
            <FormSheetHeader
                title={(
                    <FormSheetTabs
                        tabs={TABS}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />
                )}
                onClose={() => router.back()}
                headerStyle={{
                    paddingTop: 4,
                    paddingLeft: 12,
                }}
            />
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <TabView
                    navigationState={{ index: activeTab === 'income' ? 1 : 0, routes: TABS }}
                    onIndexChange={index => handleTabChange(TABS[index].key)}
                    initialLayout={{ width }}
                    renderTabBar={() => null}
                    keyboardDismissMode="on-drag"
                    renderScene={({ route }) => (
                    <ScrollView
                        style={styles.container}
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {renderForm(route.key)}
                    </ScrollView>
                    )}
                />
            </KeyboardAvoidingView>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 120,
        flexGrow: 1,
    },
});
