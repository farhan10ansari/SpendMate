import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { FAB, Portal } from "react-native-paper";

type ConfirmButtonProps = {
    onPress?: () => void;
    type: 'create' | 'edit';
}

export default function ConfirmButton({ onPress, type }: ConfirmButtonProps) {
    const [show, setShow] = useState(false);
    const timeout = useRef<number | null>(null);
    const keyboard = useKeyboardState();

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
            bottom: keyboard.height
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