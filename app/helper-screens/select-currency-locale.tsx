import React, { useCallback } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { List, Icon } from "react-native-paper";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useRouter } from "expo-router";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { locales, LocaleValue } from "@/lib/currencies";
import { FlashList } from "@shopify/flash-list";
import { useHaptics } from "@/contexts/HapticsProvider";

// Reuse baseStyles or augment if needed
const baseStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 18,
    },
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
});

export default function AllLocalesScreen() {
    const router = useRouter();
    const { currencyLocale, updateCurrencyLocale } = useCurrency();
    const { colors } = useAppTheme();
    const { hapticImpact } = useHaptics();

    const onSelect = useCallback(
        (selectedLocale: LocaleValue) => {
            hapticImpact();
            updateCurrencyLocale(selectedLocale);
            // setTimeout(() => {
            //     router.back();
            // }, 500);
        },
        [updateCurrencyLocale, router]
    );

    const renderItem = useCallback(
        ({ item }: { item: typeof locales[number] }) => {
            const isSelected = item.locale === currencyLocale;
            return (
                <MemoizedLocaleListItem
                    item={item}
                    isSelected={isSelected}
                    colors={colors}
                    onPress={onSelect}
                />
            );
        },
        [currencyLocale, colors, onSelect]
    );

    return (
        <ScreenWrapper background="card" withScrollView>
            <View style={baseStyles.container}>
                <FlashList
                    data={locales}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.locale}
                    showsVerticalScrollIndicator={true}
                />
            </View>
        </ScreenWrapper>
    );
}

const MemoizedLocaleListItem = React.memo(
    ({
        item,
        isSelected,
        colors,
        onPress,
    }: {
        item: typeof locales[number];
        isSelected: boolean;
        colors: any;
        onPress: (locale: LocaleValue) => void;
    }) => (
        <List.Item
            title={item.name}
            description={item.locale}
            titleNumberOfLines={2}
            style={[
                baseStyles.listItem,
                { backgroundColor: colors.inverseOnSurface },
                isSelected && { backgroundColor: colors.ripplePrimary },
            ]}
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
            onPress={() => onPress(item.locale)}
            rippleColor={colors.ripplePrimary}
            background={Platform.OS === 'android' ? { color: colors.ripplePrimary, foreground: true } : undefined}
        />
    )
);

MemoizedLocaleListItem.displayName = "MemoizedLocaleListItem";
