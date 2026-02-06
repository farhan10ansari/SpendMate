import { ColorType } from "@/lib/types";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import type { TextInputProps } from "react-native";
import { StyleSheet, TextInput } from "react-native";

/**
 * Multiline notes input with optional focus/blur handlers.
 */
type NotesInputProps = {
    note: string;
    setNote: (description: string) => void;
    onFocus?: TextInputProps["onFocus"];
    onBlur?: TextInputProps["onBlur"];
    colorType?: ColorType;
};

export default function NotesInput({ note, setNote, onFocus, onBlur, colorType = "primary" }: NotesInputProps) {
    const { colors } = useAppTheme();

    const styles = StyleSheet.create({
        notesInput: {
            backgroundColor: colors.background,
            padding: 10,
            color: colors.text,
            borderRadius: 10,
            borderColor: colors[colorType],
            borderWidth: 1,
        },
    });

    return (
        <TextInput
            value={note}
            onChangeText={setNote}
            style={styles.notesInput}
            placeholder="Add a note"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
            cursorColor={colors[colorType]}
            onFocus={onFocus}
            onBlur={onBlur}
        />
    )
}