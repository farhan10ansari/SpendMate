import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useRef } from "react";
import type { TextInputProps } from "react-native";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { ColorType } from "@/lib/types";
import { Icon } from "react-native-paper";
import { useCurrency } from "@/contexts/CurrencyProvider";

/**
 * Amount input field with currency formatting and validation.
 * Supports optional onFocus/onBlur callbacks compatible with TextInput.
 */
export type AmountInputProps = {
    amount: string;
    setAmount: (amount: string) => void;
    onFocus?: TextInputProps["onFocus"];
    onBlur?: TextInputProps["onBlur"];
    colorType?: ColorType;
};


export default function AmountInput({ amount, setAmount, onFocus, onBlur, colorType = "primary" }: AmountInputProps) {
    const { colors } = useAppTheme();
    const { currencyData } = useCurrency();
    const decimalPlaces = currencyData.decimalPlaces;

    const inputRef = useRef<TextInput>(null);

    // Create dynamic regex based on decimal places
    
    const amountInputRegex = new RegExp(`^\\d{0,8}(\\.\\d{0,${decimalPlaces}})?$`);


    const styles = StyleSheet.create({
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
        },
        input: {
            color: colors.text,
            backgroundColor: "transparent",
            borderRadius: 10,
            fontSize: 60,
        }
    });


    return (
        <Pressable style={styles.inputContainer} onPress={() => inputRef.current?.focus()}>
            <Icon source="currency-inr" size={24} color={colors.text} />
            <TextInput
                // autoFocus
                ref={inputRef}
                style={styles.input}
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={amount}
                onChangeText={(text) => {
                    const valid = amountInputRegex.test(text)
                    if (text.startsWith("00")) {
                        text = text.replace(/^00+/, '0'); // Replace leading zeros with a single zero
                    }
                    if (!valid) return
                    setAmount(text)
                }}
                placeholder="0"
                // maxLength={8}
                cursorColor={colors[colorType]}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </Pressable>
    )
}
