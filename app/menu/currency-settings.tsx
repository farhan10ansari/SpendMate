import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import SettingSection from "@/components/main/SettingSection";
import { useCurrency } from "@/contexts/CurrencyProvider";
import { useHaptics } from "@/contexts/HapticsProvider";
import { getCurrencyData } from "@/lib/currencies";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { Banner, Icon, List } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CurrencySettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [bannerVisible, setBannerVisible] = useState(true);
  const { hapticImpact } = useHaptics();


  const {
    currencyCode,
    formatCurrency,
    updateCurrency,
    currencyLocale,
  } = useCurrency();

  const currencyOptions = useMemo(() => {
    const options = [
      // Popular hardcoded + current to match your existing code logic
      ...["INR", "USD", "EUR"].map((code) => getCurrencyData(code)),
    ];
    if (!options.find((c) => c.code === currencyCode)) {
      options.push(getCurrencyData(currencyCode));
    }
    return options;
  }, [currencyCode]);

  const handleNavigateToAllCurrencies = () => {
    router.push("/helper-screens/select-currency");
  };

  const handleNavigateToLocaleSelection = () => {
    router.push("/helper-screens/select-currency-locale");
  };

  const previewAmount = 9732576.58;

  return (
    <ScreenWrapper background="card" >
      <Banner
        visible={bannerVisible}
        actions={[
          {
            label: "Got it",
            onPress: () => setBannerVisible(false),
          },
        ]}
        icon={({ size }) => (
          <Icon source="information-outline" size={size} color={colors.primary} />
        )}
      >
        Changing the currency only updates the formatting style. The actual amount remains unchanged.
      </Banner>
      <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 12 }]}>
        {/* Amount Formatting Preview */}
        <SettingSection
          icon="cash"
          title="Amount Formatting Preview"
          description="Preview how amounts will be displayed with your selected currency and locale."
        >
          <View style={styles.previewContainer}>
            <Text style={[styles.previewText, { color: colors.onSurface }]}>
              {formatCurrency(previewAmount)}
            </Text>
          </View>
        </SettingSection>
        {/* Currency Selection Section */}
        <SettingSection
          icon="currency-sign"
          title="Currency"
          description="Choose your default currency for displaying amounts."
        >
          {currencyOptions.map((option) => (
            <List.Item
              key={option.code}
              title={`${option.name} - ${option.code}`}
              titleNumberOfLines={2}
              style={[
                styles.listItem,
                { backgroundColor: colors.inverseOnSurface },
                currencyCode === option.code && { backgroundColor: colors.ripplePrimary },
              ]}
              left={(props) => (
                <View style={styles.leftIconContainer}>
                  {option?.icon ? (
                    <List.Icon {...props} icon={option.icon} color={colors.primary} style={styles.icon} />
                  ) : (
                    <Text style={[styles.symbolText, { color: colors.primary }]}>{option.symbol}</Text>
                  )}
                </View>
              )}
              right={() =>
                currencyCode === option.code ? (
                  <View style={[styles.checkIconContainer, { backgroundColor: colors.ripplePrimary }]}>
                    <Icon source="check" size={20} color={colors.primary} />
                  </View>
                ) : null
              }
              onPress={() => {
                hapticImpact();
                updateCurrency(option.code)
              }}
            />
          ))}
          <List.Item
            title="More Options"
            titleStyle={[styles.moreOptionsTitle, { color: colors.primary }]}
            style={[styles.moreOptionsListItem, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            left={(props) => (
              <View style={styles.leftIconContainer}>
                <List.Icon {...props} icon="currency-sign" color={colors.primary} style={styles.icon} />
              </View>
            )}
            onPress={handleNavigateToAllCurrencies}
          />
        </SettingSection>

        {/* New Currency Locale Section */}
        <SettingSection
          icon="web"
          title="Currency Locale"
          description="Select your preferred locale for currency formatting."
        >
          <List.Item
            title={currencyLocale}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            style={[styles.listItem, { backgroundColor: colors.inverseOnSurface }]}
            onPress={handleNavigateToLocaleSelection}
          />
        </SettingSection>
      </ScrollView>

    </ScreenWrapper>
  );
};

export default CurrencySettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
  leftIconContainer: {
    width: 64,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: "600",
  },
  moreOptionsListItem: {
    paddingHorizontal: 0,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  moreOptionsTitle: {
    fontStyle: "italic",
    fontWeight: "600",
  },
  icon: {
    width: "100%",
  },
  previewContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  previewText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
