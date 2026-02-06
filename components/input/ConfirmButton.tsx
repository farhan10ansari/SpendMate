import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { FAB, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ConfirmButtonProps = {
    onPress?: () => void;
    type: 'create' | 'edit';
};

/**
 * FAB confirm button shown when keyboard is visible; supports create/edit modes.
 */
export default function ConfirmButton({ onPress, type }: ConfirmButtonProps) {
    const [show, setShow] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const keyboard = useKeyboardState();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Add a timeout to delay the showing of the FAB
        timeout.current = setTimeout(() => {
            setShow(true);
        }, 200);

        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
                timeout.current = null;
                setShow(false);
            }
        };
    }, []);

    const styles = StyleSheet.create({
        fab: {
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: Math.max(keyboard.height, insets.bottom), // When keyboard is open, use its height; otherwise, use safe area inset
        },
    })

    return (
        <Portal>
            {show && (
                <FAB
                    icon="check"
                    onPress={onPress}
                    style={styles.fab}
                    label={type === "edit" ? "Update" : undefined}
                />
            )}
        </Portal>
    )
}