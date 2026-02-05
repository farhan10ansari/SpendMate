import React, { useCallback } from "react";
import { Platform, View, StyleSheet, Text } from "react-native";
import { List, Icon } from "react-native-paper";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { currenciesData, CurrencyData } from "@/lib/currencies";
import { FlashList } from "@shopify/flash-list";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { useHaptics } from "@/contexts/HapticsProvider";

const baseStyles = StyleSheet.create({
    container: { flex: 1 },
    listItem: {
        paddingHorizontal: 0,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    checkIconContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    leftIconContainer: {
        width: 64, // fixed width for alignment
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 8,
    },
    symbolText: {
        fontSize: 16,
        fontWeight: "600",
    },
});

export default function AllCurrenciesScreen() {
    const { colors } = useAppTheme();
    const { currencyCode, updateCurrency } = useCurrency();
    const { hapticImpact } = useHaptics();

    const handleUpdateCurrency = useCallback(
        (code: string) => {
            hapticImpact();
            updateCurrency(code);
        },
        [hapticImpact, updateCurrency]
    );


    const renderItem = useCallback(
        ({ item }: { item: CurrencyData }) => {
            const isSelected = currencyCode === item.code;
            return (
                <MemoizedListItem
                    item={item}
                    isSelected={isSelected}
                    colors={colors}
                    onPress={handleUpdateCurrency}
                />
            );
        },
        [currencyCode, colors, handleUpdateCurrency]
    );

    return (
        <ScreenWrapper background="card">
            <View style={baseStyles.container}>
                <FlashList
                    data={currenciesData}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.code}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ padding: 16 }}
                />
            </View>
        </ScreenWrapper>
    );
}

const MemoizedListItem = React.memo(
    ({
        item,
        isSelected,
        colors,
        onPress,
    }: {
        item: CurrencyData;
        isSelected: boolean;
        colors: any;
        onPress: (code: string) => void;
    }) => (
        <List.Item
            title={`${item.name} - ${item.code}`}
            titleNumberOfLines={2}
            style={[
                baseStyles.listItem,
                { backgroundColor: colors.inverseOnSurface },
                isSelected && { backgroundColor: colors.ripplePrimary },
            ]}
            left={(props) => (
                <View style={baseStyles.leftIconContainer}>
                    {item?.icon ? (
                        <List.Icon
                            {...props}
                            icon={item.icon}
                            color={colors.primary}
                            style={{ width: "100%" }}
                        />
                    ) : (
                        <Text style={[baseStyles.symbolText, { color: colors.primary }]}>
                            {item.symbol}
                        </Text>
                    )}
                </View>
            )}
            right={() =>
                isSelected ? (
                    <View
                        style={[
                            baseStyles.checkIconContainer,
                            { backgroundColor: colors.ripplePrimary },
                        ]}
                    >
                        <Icon source="check" size={20} color={colors.primary} />
                    </View>
                ) : null
            }
            onPress={() => onPress(item.code)}
            rippleColor={colors.ripplePrimary}
            background={Platform.OS === 'android' ? { color: colors.ripplePrimary, foreground: true } : undefined}
        />
    )
);

MemoizedListItem.displayName = "MemoizedListItem";
