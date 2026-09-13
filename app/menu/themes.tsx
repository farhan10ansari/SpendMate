import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/base/ThemedText";
import usePersistentAppStore from "@/stores/usePersistentAppStore";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import ThemeSelector from "@/components/main/ThemeSelector";
import { themeOptions } from "@/lib/constants";
import { Icon } from "react-native-paper";

export default function ThemesScreen() {
  const { colors } = useAppTheme();
  const theme = usePersistentAppStore(state => state.theme);

  const dynamicStyles = StyleSheet.create({
    sectionContainer: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 16,
      marginBottom: 16,
      elevation: 0,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0,
      shadowRadius: 2,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.primary,
    },
    descriptionText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 20,
      marginBottom: 16,
    },
  });

  return (
    <ScreenWrapper
      background="background"
      withScrollView
    >
      <View
        style={styles.container}
      >
        {/* Theme Selection Section */}
        <View style={dynamicStyles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Icon
              source="palette"
              size={24}
              color={colors.primary}
            />
            <ThemedText style={dynamicStyles.sectionTitle}>
              App Appearance
            </ThemedText>
          </View>

          <ThemedText style={dynamicStyles.descriptionText}>
            Choose your preferred theme for the app. System theme will automatically switch between light and dark based on your device settings.
          </ThemedText>
          <ThemeSelector />

        </View>

        {/* Current Selection Info */}
        <View style={dynamicStyles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Icon
              source="information-outline"
              size={20}
              color={colors.secondary}
            />
            <ThemedText style={[dynamicStyles.sectionTitle, { fontSize: 16 }]}>
              Current Selection
            </ThemedText>
          </View>

          <ThemedText style={{ color: colors.text, fontSize: 15 }}>
            <ThemedText style={{ fontWeight: "600", color: colors.primary }}>
              {themeOptions.find(opt => opt.key === theme)?.label} Theme
            </ThemedText>
            {"\n"}
            <ThemedText style={dynamicStyles.descriptionText}>
              {themeOptions.find(opt => opt.key === theme)?.description}
            </ThemedText>
          </ThemedText>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
})
