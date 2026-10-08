import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Button, Portal } from "react-native-paper";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BUTTON_HEIGHT = 40;
const BUTTON_BOTTOM_GAP = 16;
// Reserve the button and a gap above/below it when scrolling form fields.
export const TRANSACTION_FORM_BOTTOM_CLEARANCE = BUTTON_HEIGHT + BUTTON_BOTTOM_GAP + 16;

type ConfirmButtonProps = {
    onPress?: () => void;
    type: 'create' | 'edit';
    kind?: 'expense' | 'income';
}

export default function ConfirmButton({ onPress, type, kind = 'expense' }: ConfirmButtonProps) {
    const [show, setShow] = useState(false);
    const { height } = useReanimatedKeyboardAnimation();
    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const bottomInset = insets.bottom;
    const keyboardStyle = useAnimatedStyle(() => ({
        // Keyboard height is negative while open. Keep the existing safe-area
        // clearance at rest and follow native keyboard frames on the UI thread.
        transform: [{ translateY: Math.min(0, height.value + bottomInset) }],
    }), [bottomInset]);

    useEffect(() => {
        // Add a timeout to delay the showing of the FAB
        const timeout = setTimeout(() => {
            setShow(true);
        }, 200);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    return (
        <Portal>
            {show && (
                <Animated.View style={[styles.anchor, { bottom: bottomInset + BUTTON_BOTTOM_GAP }, keyboardStyle]}>
                    <Button
                        mode="contained"
                        compact
                        icon="check"
                        onPress={onPress}
                        buttonColor={kind === 'income' ? colors.tertiaryContainer : colors.primaryContainer}
                        textColor={kind === 'income' ? colors.onTertiaryContainer : colors.onPrimaryContainer}
                        style={styles.compactFab}
                        contentStyle={styles.compactContent}
                        labelStyle={styles.compactLabel}
                    >
                        {type === 'edit' ? 'Save changes' : kind === 'income' ? 'Add income' : 'Add expense'}
                    </Button>
                </Animated.View>
            )}
        </Portal>
    )
}

const styles = StyleSheet.create({
    compactFab: {
        borderRadius: 12,
    },
    compactContent: { height: BUTTON_HEIGHT, paddingHorizontal: 2 },
    compactLabel: { marginHorizontal: 8, marginVertical: 0 },
    anchor: {
        position: 'absolute',
        right: 16,
    },
});
