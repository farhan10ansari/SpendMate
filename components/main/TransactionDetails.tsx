import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import { ScrollView } from 'react-native-gesture-handler';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Color from 'color';

type Props = {
    kind: 'expense' | 'income';
    amount: string;
    category: string;
    categoryIcon?: React.ComponentProps<typeof Icon>['source'] | null;
    date: string;
    time: string;
    currency: string;
    paymentMethod?: string;
    paymentIcon?: React.ComponentProps<typeof Icon>['source'];
    notes?: string | null;
    onEdit: () => void;
    onDelete: () => void;
};

export default function TransactionDetails({
    kind, amount, category, categoryIcon, date, time, currency,
    paymentMethod, paymentIcon, notes, onEdit, onDelete,
}: Props) {
    const { colors, dark } = useAppTheme();
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const accent = kind === 'income' ? colors.tertiary : colors.primary;
    const tint = Color(colors.surface).mix(Color(accent), dark ? 0.18 : 0.10).hex();

    return (
        <ScrollView
            style={{ maxHeight: Math.max(160, height - insets.top - insets.bottom - 100) }}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <View style={[styles.summary, { backgroundColor: tint }]}>
                <View style={styles.summaryHeader}>
                    <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                        <Icon source={categoryIcon || (kind === 'income' ? 'cash-plus' : 'receipt-text-outline')} size={25} color={accent} />
                    </View>
                    <View style={styles.summaryLabels}>
                        <Text style={[styles.eyebrow, { color: accent }]}>{kind === 'income' ? 'INCOME RECEIVED' : 'EXPENSE DETAILS'}</Text>
                        <Text style={[styles.category, { color: colors.onSurface }]}>{category}</Text>
                    </View>
                </View>
                <Text selectable style={[styles.amount, { color: accent }]}>{amount}</Text>
            </View>

            <View style={styles.grid}>
                <DetailField icon="calendar-outline" label="Date" value={date} />
                <DetailField icon="clock-outline" label="Time" value={time} />
                {kind === 'expense' && <DetailField icon={paymentIcon || 'wallet-outline'} label="Payment method" value={paymentMethod || 'Not provided'} />}
                <DetailField icon="currency-sign" label="Currency" value={currency} />
            </View>

            <View style={[styles.notes, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                <View style={styles.notesHeading}>
                    <Icon source="text-box-outline" size={18} color={colors.onSurfaceVariant} />
                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>{kind === 'income' ? 'Description' : 'Notes'}</Text>
                </View>
                <Text selectable style={[styles.notesText, { color: notes ? colors.onSurface : colors.onSurfaceVariant }]}>
                    {notes || 'No notes added'}
                </Text>
            </View>

            <View style={styles.actions}>
                <Button mode="contained" icon="pencil-outline" onPress={onEdit}
                    buttonColor={accent} textColor={kind === 'income' ? colors.onTertiary : colors.onPrimary}
                    style={styles.action} contentStyle={styles.actionContent}>Edit</Button>
                <Button mode="outlined" icon="trash-can-outline" onPress={onDelete}
                    textColor={colors.error} style={[styles.action, { borderColor: colors.outlineVariant }]}
                    contentStyle={styles.actionContent}>Delete</Button>
            </View>
        </ScrollView>
    );
}

function DetailField({ icon, label, value }: { icon: React.ComponentProps<typeof Icon>['source']; label: string; value: string }) {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <View style={styles.notesHeading}>
                <Icon source={icon} size={17} color={colors.onSurfaceVariant} />
                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            </View>
            <Text selectable style={[styles.fieldValue, { color: colors.onSurface }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { padding: 16, gap: 12, width: '100%', maxWidth: 720, alignSelf: 'center' },
    summary: { padding: 18, borderRadius: 24, gap: 14 },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    badge: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    summaryLabels: { flex: 1, gap: 4 },
    eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    category: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
    amount: { fontSize: 32, lineHeight: 42, fontWeight: '700' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    field: { flexGrow: 1, flexBasis: '45%', minWidth: 130, padding: 13, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
    fieldLabel: { fontSize: 12, lineHeight: 18, flexShrink: 1 },
    fieldValue: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
    notes: { padding: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 10 },
    notesHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    notesText: { fontSize: 14, lineHeight: 21 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
    action: { flex: 1, minWidth: 120, borderRadius: 16 },
    actionContent: { minHeight: 46 },
});
