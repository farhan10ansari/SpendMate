import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { IncomeData, useIncomeStore } from './IncomeStoreProvider';
import AmountInput from '@/components/input/AmountInput';
import CategoriesInput from '@/components/input/CategoriesInput';
import ConfirmButton from '@/components/input/ConfirmButton';
import DateInput from '@/components/input/DateInput';
import NotesInput from '@/components/input/NotesInput';
import TimeInput from '@/components/input/TimeInput';
import { useEnabledIncomeSources } from '@/contexts/CategoryDataProvider';
import { useIsFocused } from '@react-navigation/native';
import { useSnackbarState } from '@/contexts/GlobalSnackbarProvider';

type IncomeFormProps = {
    onSubmit?: (income: IncomeData) => void;
    type?: 'create' | 'edit';
}

export default function IncomeForm({ onSubmit, type = "create" }: IncomeFormProps) {
    const { colors } = useAppTheme();
    const isFocused = useIsFocused()
    const globalSnackbar = useSnackbarState()

    const income = useIncomeStore((state) => state.income);
    const updateIncome = useIncomeStore((state) => state.updateIncome);
    const sources = useEnabledIncomeSources()

    // Set default date and time
    useEffect(() => {
        if (!income.dateTime) {
            updateIncome({ dateTime: new Date() });
        }
    }, [])

    const handleSubmit = () => onSubmit?.(income);

    return (
        <View style={styles.container}>
            <View
                style={{ flex: 1 }}
            // onTouchStart={() => Keyboard.dismiss()}
            >

                {/* Amount */}
                <View style={styles.amountContainer}>
                    <ThemedText type='defaultSemiBold' style={[styles.sectionTitle, { color: colors.muted }]}>
                        Amount <ThemedText color='red'>*</ThemedText>
                    </ThemedText>
                    <AmountInput
                        amount={income.amount}
                        setAmount={(amount) => updateIncome({ amount })}
                        colorType='tertiary'
                    />
                </View>
                {/* Source */}
                <View style={styles.inputSection}>
                    <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.muted }]}>
                        Source <ThemedText color='red'>*</ThemedText>
                    </ThemedText>
                    <CategoriesInput
                        categories={sources}
                        category={income.source}
                        setCategory={(category) => updateIncome({ source: category })}
                        colorType='tertiary'
                        type='income'
                    />
                </View>
                {/* Description (Notes) */}
                <View style={styles.inputSection}>
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
                <View style={styles.inputSection}>
                    <ThemedText type='defaultSemiBold' style={[styles.sectionTitle, { color: colors.muted }]}>
                        Date & Time
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
            {isFocused && !globalSnackbar && (
                <ConfirmButton
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
        paddingHorizontal: 20,
        flex: 1,
    },
    sectionTitle: {
        width: '100%',
        textAlign: 'center',
        marginBottom: 10
    },
    amountContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputSection: {
        marginTop: 20,
    },
    datetimeMain: {
        flexDirection: 'row',
        gap: 10,
    },
    datetimeInputContainer: {
        flex: 1,
    }
});
