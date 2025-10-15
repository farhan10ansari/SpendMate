import { Income } from '@/lib/types';
import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { createStore, StoreApi, useStore } from 'zustand';

// This should match the fields on your IncomeForm and NewIncome interface!
export type IncomeData = {
    amount: string;
    source: string | null;
    description: string;
    dateTime: Date | undefined | null;
    receipt?: string | null;        // Optional, include if needed
    currency?: string;              // Optional, include if you allow multiple currencies
}

// Store shape
type IncomeStore = {
    income: IncomeData;
    updateIncome: (income: Partial<IncomeData>) => void;
};

const IncomeStoreContext = createContext<StoreApi<IncomeStore> | undefined>(undefined);

type IncomeStoreProviderProps = PropsWithChildren<{
    initialIncome?: Income;
}>;

export function IncomeStoreProvider({ initialIncome, children }: IncomeStoreProviderProps) {
    const [store] = useState(() =>
        createStore<IncomeStore>((set) => ({
            income: {
                amount: initialIncome ? initialIncome.amount.toString() : '',
                source: initialIncome ? initialIncome.source : null,
                description: initialIncome ? (initialIncome.description ?? "") : "",
                dateTime: initialIncome ? new Date(initialIncome.dateTime) : undefined,
                receipt: initialIncome ? initialIncome.receipt ?? null : null,
                currency: initialIncome ? initialIncome.currency : 'INR',
            },
            updateIncome: (income) =>
                set((state) => ({
                    income: {
                        ...state.income,
                        ...income,
                    },
                })),
        }))
    );

    return (
        <IncomeStoreContext.Provider value={store}>
            {children}
        </IncomeStoreContext.Provider>
    );
}

// Hook to use income state in components—identical API to useExpenseStore
export function useIncomeStore<T>(selector: (state: IncomeStore) => T) {
    const store = useContext(IncomeStoreContext);
    if (!store) {
        throw new Error('useIncomeStore must be used within an IncomeStoreProvider');
    }
    return useStore(store, selector);
}
