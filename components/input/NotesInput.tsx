import { ColorType } from "@/lib/types";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import type { TextInputProps } from "react-native";
import { StyleSheet, TextInput } from "react-native";

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
            backgroundColor: colors.surfaceVariant,
            padding: 10,
            minHeight: 64,
            textAlignVertical: 'top',
            fontSize: 14,
            color: colors.text,
            borderRadius: 16,
            borderColor: colors.border,
            borderWidth: StyleSheet.hairlineWidth,
        },
    });

    return (
        <TextInput
            value={note}
            accessibilityLabel="Notes"
            onChangeText={setNote}
            style={styles.notesInput}
            placeholder="Add a note"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={2}
            cursorColor={colors[colorType]}
            onFocus={onFocus}
            onBlur={onBlur}
        />
    )
}
