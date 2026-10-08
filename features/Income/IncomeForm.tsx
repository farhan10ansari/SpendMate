import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import React, { useEffect, useState } from 'react';
import Color from 'color';
import { StyleSheet, View } from 'react-native';
import { IncomeData, useIncomeStore } from './IncomeStoreProvider';
import AmountInput from '@/components/input/AmountInput';
import CategoriesInput from '@/components/input/CategoriesInput';
import ConfirmButton from '@/components/input/ConfirmButton';
import DateInput from '@/components/input/DateInput';
import NotesInput from '@/components/input/NotesInput';
import TimeInput from '@/components/input/TimeInput';
import { useEnabledIncomeSources } from '@/contexts/CategoryDataProvider';
import { useIsFocused } from 'expo-router/react-navigation';
import { useSnackbarState } from '@/contexts/GlobalSnackbarProvider';
import TransactionDropdown from '@/components/input/TransactionDropdown';
import { getIncomeFieldErrors } from '@/lib/validations';
import { useCurrency } from '@/contexts/CurrencyProvider';
import { useHaptics } from '@/contexts/HapticsProvider';

type IncomeFormProps = {
    onSubmit?: (income: IncomeData) => void;
    type?: 'create' | 'edit';
    isActive?: boolean;
}

export default function IncomeForm({ onSubmit, type = "create", isActive = true }: IncomeFormProps) {
    const { colors, dark } = useAppTheme();
    const isFocused = useIsFocused()
    const globalSnackbar = useSnackbarState()

    const income = useIncomeStore((state) => state.income);
    const updateIncome = useIncomeStore((state) => state.updateIncome);
    const sources = useEnabledIncomeSources()
    const [submitted, setSubmitted] = useState(false);
    const { currencyData, formatCurrency } = useCurrency();
    const { hapticNotify } = useHaptics();
    const errors = submitted ? getIncomeFieldErrors(income, { decimalPlaces: currencyData.decimalPlaces, formatCurrency }) : {};

    // Set default date and time
    useEffect(() => {
        if (!income.dateTime) {
            updateIncome({ dateTime: new Date() });
        }
    }, [])

    const handleSubmit = () => {
        setSubmitted(true);
        const fieldErrors = getIncomeFieldErrors(income, { decimalPlaces: currencyData.decimalPlaces, formatCurrency });
        if (Object.keys(fieldErrors).length) {
            hapticNotify('warning');
            return;
        }
        onSubmit?.(income);
    };

    return (
        <View style={styles.container}>
            <View
                style={{ flex: 1 }}
            // onTouchStart={() => Keyboard.dismiss()}
            >

                {/* Amount */}
                <View style={[styles.amountContainer, { borderColor: errors.amount ? colors.error : 'transparent', backgroundColor: dark ? colors.tertiaryContainer : Color(colors.surface).mix(Color(colors.tertiaryContainer), 0.16).hex() }]}>
                    <ThemedText type='defaultSemiBold' numberOfLines={1} accessibilityLiveRegion="polite"
                        style={[styles.sectionTitle, styles.amountTitle, { color: errors.amount ? colors.error : colors.muted }]}>
                        {errors.amount ?? <>Income amount <ThemedText color={colors.error}>*</ThemedText></>}
                    </ThemedText>
                    <AmountInput
                        amount={income.amount}
                        setAmount={(amount) => updateIncome({ amount })}
                        colorType='tertiary'
                    />
                </View>
                {/* Source */}
                {type === 'create' ? (
                <View style={styles.dropdownRow}>
                    <TransactionDropdown label="Income source" required icon="cash-plus" accent="tertiary" layout="grid"
                        error={errors.source}
                        options={sources} value={income.source}
                        onSelect={(source) => updateIncome({ source })}
                        manageRoute="/menu/(manage-categories)/income-sources" />
                </View>
                ) : (
                <View style={[styles.inputSection, { backgroundColor: colors.surface, borderRadius: 18, padding: 10 }]}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1} accessibilityLiveRegion="polite"
                        style={[styles.sectionTitle, { color: errors.source ? colors.error : colors.muted }]}>
                        {errors.source ?? <>Source <ThemedText color={colors.error}>*</ThemedText></>}
                    </ThemedText>
                    <CategoriesInput
                        categories={sources}
                        category={income.source}
                        setCategory={(category) => updateIncome({ source: category })}
                        colorType='tertiary'
                        type='income'
                    />
                </View>
                )}
                {/* Description (Notes) */}
                <View style={[styles.inputSection, { backgroundColor: colors.surface, borderRadius: 18, padding: 10 }]}>
                    <ThemedText type='defaultSemiBold' style={[styles.sectionTitle, { color: colors.muted }]}>
                        Description
                    </ThemedText>
                    <NotesInput
                        note={income.description}
                        setNote={(description => updateIncome({ description }))}
                        colorType='tertiary'
                    />
                </View>

                {/* Date & Time */}
                <View style={[styles.inputSection, { backgroundColor: colors.surface, borderRadius: 18, padding: 10 }]}>
                    <ThemedText type='defaultSemiBold' numberOfLines={1} accessibilityLiveRegion="polite"
                        style={[styles.sectionTitle, { color: errors.date ? colors.error : colors.muted }]}>
                        {errors.date ?? 'Date & Time'}
                    </ThemedText>
                    <View style={styles.datetimeMain}>
                        <DateInput
                            datetime={income.dateTime ?? undefined}
                            setDatetime={(dateTime => updateIncome({ dateTime }))}
                            style={styles.datetimeInputContainer}
                        />
                        <TimeInput
                            datetime={income.dateTime ?? undefined}
                            setDatetime={(dateTime => updateIncome({ dateTime }))}
                            style={styles.datetimeInputContainer}
                        />
                    </View>
                </View>
            </View>
            {/* Confirm Button */}
            {isActive && isFocused && !globalSnackbar && (
                <ConfirmButton
                    kind="income"
                    onPress={handleSubmit}
                    type={type}
                />
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        flex: 1,
    },
    sectionTitle: {
        width: '100%',
        textAlign: 'left',
        marginBottom: 6,
    fontSize: 12,
    lineHeight: 18
    },
    amountTitle: { textAlign: 'center' },
  amountContainer: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 20,
    marginBottom: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputSection: {
        marginTop: 10,
    },
    dropdownRow: { flexDirection: 'row', marginTop: 10 },
    datetimeMain: {
    flexWrap: 'wrap',
        flexDirection: 'row',
        gap: 10,
    },
    datetimeInputContainer: {
    minWidth: 140,
        flex: 1,
    }
});
