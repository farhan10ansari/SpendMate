import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { FAB, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ConfirmButtonProps = {
    onPress?: () => void;
    type: 'create' | 'edit';
    kind?: 'expense' | 'income';
}

export default function ConfirmButton({ onPress, type, kind = 'expense' }: ConfirmButtonProps) {
    const [show, setShow] = useState(false);
    const { height } = useReanimatedKeyboardAnimation();
    const insets = useSafeAreaInsets();
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
                <Animated.View style={[styles.anchor, { bottom: bottomInset + 16 }, keyboardStyle]}>
                    <FAB
                        icon="check"
                        variant={kind === 'income' ? 'tertiary' : 'primary'}
                        onPress={onPress}
                        label={type === "edit" ? "Save changes" : kind === 'income' ? 'Add income' : 'Add expense'}
                    />
                </Animated.View>
            )}
        </Portal>
    )
}

const styles = StyleSheet.create({
    anchor: {
        position: 'absolute',
        right: 16,
    },
});
