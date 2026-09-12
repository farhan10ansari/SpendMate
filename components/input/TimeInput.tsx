import { useLocalization } from '@/hooks/useLocalization';
import { extractTimeString } from '@/lib/functions';
import React, { useCallback, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useHaptics } from '@/contexts/HapticsProvider';

type TimeInputProps = {
    datetime: Date | undefined;
    setDatetime: (datetime: Date | undefined) => void;
    style?: StyleProp<ViewStyle>;
};

export default function TimeInput({ datetime, setDatetime, style }: TimeInputProps) {
    const { uses24HourClock } = useLocalization()
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
    const { hapticImpact } = useHaptics();

    const styles = StyleSheet.create({
        button: {
            borderRadius: 20,
        },
        timeModalContainer: {
            justifyContent: 'center',
            flex: 1,
            alignItems: 'center'
        }
    });

    const onConfirmTime = useCallback((params: {
        hours: number;
        minutes: number;
    }) => {
        const date = new Date(datetime ?? new Date());
        date.setHours(params.hours);
        date.setMinutes(params.minutes);
        date.setSeconds(0);
        setTimePickerVisibility(false);
        hapticImpact()
        setDatetime(date);
    }, [datetime, hapticImpact, setDatetime]);

    const onDismissTime = useCallback(() => {
        setTimePickerVisibility(false);
    }, [setTimePickerVisibility]);

    const timeString = extractTimeString(datetime ?? new Date(), uses24HourClock);

    return (
        <View style={style}>
            <Button
                icon="clock"
                mode="elevated"
                onPress={() => setTimePickerVisibility(true)}
                style={styles.button}
            >
                {datetime ? timeString : "Set time"}
            </Button>
            <SafeAreaProvider>
                <View style={styles.timeModalContainer}>
                    <TimePickerModal
                        locale="en"
                        visible={isTimePickerVisible}
                        onConfirm={onConfirmTime}
                        onDismiss={onDismissTime}
                        hours={datetime?.getHours()}
                        minutes={datetime?.getMinutes()}
                        animationType='slide'
                        use24HourClock={uses24HourClock}
                        label="Select time"
                    />
                </View>
            </SafeAreaProvider>
        </View>
    );
}
