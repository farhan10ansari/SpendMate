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
import Color from 'color';

const CurrencySettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, dark } = useAppTheme();
  const selectionTint = Color(colors.surface).mix(Color(colors.primary), 0.12).hex();
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
    <ScreenWrapper background="background" >
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}>
        {/* Amount Formatting Preview */}
          <View style={[styles.previewContainer, { backgroundColor: dark ? colors.primaryContainer : selectionTint }]}>
            <View style={styles.previewHeader}>
              <Icon source="cash-multiple" size={22} color={colors.primary} />
              <Text style={[styles.eyebrow, { color: colors.muted }]}>AMOUNT PREVIEW</Text>
              <View style={[styles.codeBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.currencyCode, { color: colors.primary }]}>{currencyCode}</Text>
              </View>
            </View>
            <Text style={[styles.previewText, { color: colors.text }]}>
              {formatCurrency(previewAmount)}
            </Text>
            <Text style={[styles.previewCaption, { color: colors.muted }]}>Number format · {currencyLocale}</Text>
          </View>
        {/* Currency Selection Section */}
        <SettingSection
          icon="currency-sign"
          title="Currency"
          description="Choose your default currency for displaying amounts."
        >
          {currencyOptions.map((option) => (
            <View key={option.code} style={styles.rippleClip}>
            <List.Item
              title={option.code}
              description={option.name}
              titleStyle={styles.currencyTitle}
              descriptionStyle={[styles.currencyDescription, { color: colors.muted }]}
              descriptionNumberOfLines={2}
              accessibilityRole="radio"
              accessibilityState={{ checked: currencyCode === option.code }}
              titleNumberOfLines={2}
              style={[
                styles.listItem, styles.clippedItem,
                { backgroundColor: colors.surface, borderColor: colors.border },
                currencyCode === option.code && { backgroundColor: selectionTint, borderColor: colors.primary },
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
                  <View style={styles.checkIconContainer}>
                    <Icon source="check-circle" size={21} color={colors.primary} />
                  </View>
                ) : <View style={styles.checkIconContainer}><Icon source="circle-outline" size={21} color={colors.muted} /></View>
              }
              onPress={() => {
                hapticImpact();
                updateCurrency(option.code)
              }}
            />
            </View>
          ))}
          <View style={styles.rippleClip}>
          <List.Item
            title="Browse all currencies"
            right={props => <List.Icon {...props} icon="chevron-right" color={colors.primary} />}
            titleStyle={[styles.moreOptionsTitle, { color: colors.primary }]}
            style={[styles.moreOptionsListItem, styles.clippedItem, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            left={(props) => (
              <View style={styles.leftIconContainer}>
                <List.Icon {...props} icon="currency-sign" color={colors.primary} style={styles.icon} />
              </View>
            )}
            onPress={handleNavigateToAllCurrencies}
          />
          </View>
        </SettingSection>

        {/* New Currency Locale Section */}
        <SettingSection
          icon="web"
          title="Number Format"
          description="Choose how currency symbols, commas, and decimals appear."
        >
          <View style={styles.rippleClip}>
          <List.Item
            title={currencyLocale}
            titleStyle={styles.currencyTitle}
            description="Tap to change locale"
            descriptionStyle={[styles.currencyDescription, { color: colors.muted }]}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            style={[styles.listItem, styles.clippedItem, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={handleNavigateToLocaleSelection}
          />
          </View>
        </SettingSection>
      </ScrollView>

    </ScreenWrapper>
  );
};

export default CurrencySettingsScreen;

const styles = StyleSheet.create({
  rippleClip: { borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  clippedItem: { marginBottom: 0 },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  listItem: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  checkIconContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "center",
  },
  leftIconContainer: {
    width: 64,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: "600",
  },
  moreOptionsListItem: {
    paddingHorizontal: 0,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  moreOptionsTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  icon: {
    width: "100%",
  },
  previewContainer: {
    padding: 18,
    borderRadius: 24,
    marginBottom: 16,
    gap: 12,
  },
  previewText: {
    fontSize: 26,
    fontWeight: "600",
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  eyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, flex: 1 },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  currencyCode: { fontSize: 11, fontWeight: '700' },
  previewCaption: { fontSize: 12, lineHeight: 18 },
  currencyTitle: { fontSize: 14, fontWeight: '700' },
  currencyDescription: { fontSize: 12, lineHeight: 18 },
});
