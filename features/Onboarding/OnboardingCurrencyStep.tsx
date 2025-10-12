import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, List } from "react-native-paper";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/base/ThemedText";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";

const OnboardingCurrencyStep = () => {
    const { colors } = useAppTheme()
    const { currencyCode, currencyData, currencyLocale, formatCurrency } = useCurrency();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Card style={[styles.card, { backgroundColor: colors.elevation.level3 }]}>
                <List.Section>
                    <List.Subheader>Current Selection</List.Subheader>
                    <List.Item
                        title="Selected Currency"
                        description={`${currencyData.name} (${currencyCode})`}
                        left={(props) => <List.Icon {...props} icon="currency-sign" />}
                        right={(props) => <ThemedText {...props}>{formatCurrency(1)}</ThemedText>}
                    />
                    <List.Item
                        title="Selected Locale"
                        description={currencyLocale}
                        left={(props) => <List.Icon {...props} icon="web" />}
                        right={(props) => <ThemedText {...props}>{currencyLocale}</ThemedText>}
                    />
                </List.Section>
            </Card>
            <Button
                mode="contained"
                style={styles.button}
                onPress={() => router.push("/menu/currency-settings")}
                icon="cog"
            >
                Manage Currency
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    card: {
        marginVertical: 16,
    },
    button: {
        marginTop: 24,
    },
});

export default OnboardingCurrencyStep;
