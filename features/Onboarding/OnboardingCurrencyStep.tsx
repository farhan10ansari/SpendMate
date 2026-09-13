import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";

export default function OnboardingCurrencyStep() {
    const { colors } = useAppTheme();
    const { currencyCode, currencyData, currencyLocale, formatCurrency } = useCurrency();
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={[styles.preview, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>YOUR AMOUNTS WILL LOOK LIKE</Text>
                <Text style={[styles.amount, { color: colors.onSurface }]}>{formatCurrency(1234.56)}</Text>
                <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>{currencyData.name} · {currencyCode}</Text>
                <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>Number format: {currencyLocale}</Text>
            </View>
            <Button mode="contained-tonal" style={styles.button}
                onPress={() => router.push("/menu/currency-settings")} icon="tune-variant">
                Change currency & format
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: "100%", gap: 12 },
    preview: { padding: 16, borderRadius: 16, gap: 7 },
    label: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
    amount: { fontSize: 27, fontWeight: "700" },
    detail: { fontSize: 12, lineHeight: 18 },
    button: { borderRadius: 14 },
});
