import { beforeEach, expect, mock, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Native views and app services need a device; retain the real detail screen
// rendering while replacing only these environment boundaries.
const View = ({ children }) => React.createElement('div', null, children);
const Text = ({ children }) => React.createElement('span', null, children);
const Button = ({ children }) => React.createElement('button', null, children);
mock.module('react-native', () => ({ View, StyleSheet: { create: value => value, hairlineWidth: 1 }, useWindowDimensions: () => ({ width: 400, height: 800, fontScale: 1 }) }));
mock.module('react-native-paper', () => ({ Text, Button, Icon: () => null, ActivityIndicator: () => null }));
mock.module('react-native-gesture-handler', () => ({ ScrollView: View }));
mock.module('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }) }));
mock.module('@/components/base/ThemedText', () => ({ ThemedText: Text }));
mock.module('@/components/base/ThemedView', () => ({ ThemedView: View }));
mock.module('@/components/ui/CustomChip', () => ({ default: ({ label }) => React.createElement(Text, null, label) }));
mock.module('@/components/main/FormSheetHeader', () => ({ default: ({ title }) => React.createElement(Text, null, title) }));
mock.module('@/themes/providers/AppThemeProviders', () => ({ useAppTheme: () => ({ dark: false, colors: new Proxy({}, { get: () => '#334455' }) }) }));
mock.module('@/hooks/useLocalization', () => ({ useLocalization: () => ({ uses24HourClock: true }) }));
mock.module('@/contexts/CurrencyProvider', () => ({ useCurrency: () => ({
    currencyCode: 'USD', currencyLocale: 'en-US',
    formatCurrency: value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value),
}) }));
mock.module('@/contexts/HapticsProvider', () => ({ useHaptics: () => ({ hapticImpact() {}, hapticNotify() {} }) }));
mock.module('@/contexts/GlobalSnackbarProvider', () => ({ useSnackbar: () => ({ showSnackbar() {} }) }));
mock.module('@/components/main/ConfirmationDialog', () => ({ useConfirmation: () => ({ showConfirmationDialog() {} }) }));
mock.module('@/contexts/CategoryDataProvider', () => ({
    useExpenseCategoryMapping: () => new Map([['food', { label: 'Food', icon: 'food', color: 'primary' }]]),
    useIncomeSourceMapping: () => new Map([['salary', { label: 'Salary', icon: 'cash', color: 'tertiary' }]]),
}));
mock.module('@/lib/constants', () => ({ paymentMethodsMapping: { cash: { icon: 'cash', label: 'Cash' } } }));
mock.module('@/lib/functions', () => ({ extractDateLabel: () => '14 Sep 2026', extractTimeString: () => '09:30' }));
mock.module('@/repositories/ExpenseRepo', () => ({ getExpenseById() {}, softDeleteExpenseById() {} }));
mock.module('@/repositories/IncomeRepo', () => ({ getIncomeById() {}, softDeleteIncomeById() {} }));
mock.module('expo-router', () => ({ useLocalSearchParams: () => ({ id: '1' }), useNavigation: () => ({ goBack() {} }), useRouter: () => ({ push() {} }) }));
let record;
let pending;
mock.module('@tanstack/react-query', () => ({ useQuery: () => ({ data: record, isPending: pending, isError: false }), useQueryClient: () => ({ invalidateQueries() {} }) }));

const { default: ExpenseInfoScreen } = await import('../app/expense/[id].tsx');
const { default: IncomeInfoScreen } = await import('../app/income/[id].tsx');
beforeEach(() => {
    pending = false;
    record = { id: '1', amount: 0, category: 'food', source: 'salary', description: 'Test note', paymentMethod: 'cash', currency: 'INR', dateTime: new Date('2026-09-14T04:00:00Z'), isTrashed: false };
});

for (const [kind, Screen] of [['expense', ExpenseInfoScreen], ['income', IncomeInfoScreen]]) {
    test(`${kind} displays zero in the selected currency instead of treating it as missing`, () => {
        const html = renderToStaticMarkup(React.createElement(Screen));
        expect(html).toContain('$0.00');
        expect(html).toContain('Test note');
        expect(html).toContain(kind === 'expense' ? 'Food' : 'Salary');
    });
    test(`${kind} does not offer edit or delete while the record is loading`, () => {
        record = undefined;
        pending = true;
        const html = renderToStaticMarkup(React.createElement(Screen));
        expect(html).not.toContain('<button');
    });
    test(`${kind} does not offer actions for a missing record`, () => {
        record = null;
        const html = renderToStaticMarkup(React.createElement(Screen));
        expect(html).not.toContain('<button');
        expect(html.toLowerCase()).toContain('not found');
    });
}
