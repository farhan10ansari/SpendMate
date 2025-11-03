import { extractDateLabel } from '@/lib/functions';
import React, { useCallback, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { SingleChange } from 'react-native-paper-dates/lib/typescript/Date/Calendar';
import { useHaptics } from '@/contexts/HapticsProvider';

type DateInputProps = {
    datetime: Date | undefined;
    setDatetime: (datetime: Date | undefined) => void;
    style?: StyleProp<ViewStyle>;
};

export default function DateInput({ datetime, setDatetime, style }: DateInputProps) {
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const { hapticImpact } = useHaptics();

    const styles = StyleSheet.create({
        button: {
            borderRadius: 20,
        },
        dateModalContainer: {
            justifyContent: 'center',
            flex: 1,
            alignItems: 'center'
        }
    });

    const onConfirmDate: SingleChange = useCallback(
        (params) => {
            if (!params.date) {
                setDatePickerVisibility(false);
                return;
            }
            const date = new Date(datetime ?? new Date());
            date.setFullYear(params.date.getFullYear());
            date.setMonth(params.date.getMonth());
            date.setDate(params.date.getDate());
            setDatePickerVisibility(false);
            hapticImpact()
            setDatetime(date);
        }, [datetime, setDatetime, hapticImpact]);

    const onDismissDate = useCallback(() => {
        setDatePickerVisibility(false);
    }, [setDatePickerVisibility]);

    const dateLabel = extractDateLabel(datetime ?? new Date());

    return (
        <View style={style}>
            <Button
                icon="calendar"
                mode="elevated"
                onPress={() => setDatePickerVisibility(true)}
                style={styles.button}
            >
                {datetime ? dateLabel : "Set date"}
            </Button>
            <DatePickerModal
                locale="en"
                mode="single"
                visible={isDatePickerVisible}
                onConfirm={onConfirmDate}
                onDismiss={onDismissDate}
                date={datetime}
                animationType='slide'
                saveLabel="Select"
                placeholder='Select date'
                label="Select date"
                disableStatusBar
            />
        </View>
    );
}