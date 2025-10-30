import React, { useCallback, useMemo } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Href, useRouter } from "expo-router";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { ThemedText } from "@/components/base/ThemedText";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import usePersistentAppStore from "@/stores/usePersistentAppStore";
import MenuItemComponent from "@/components/main/ScreenMenuItem";

function MenuScreenBase() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const showDevOptions = usePersistentAppStore((state) => state.uiFlags.showDevOptions);

  const handleItemPress = useCallback((route: Href) => {
    router.push(route);
  }, [router]);


  const dynamicStyles = useMemo(() => StyleSheet.create({
    sectionContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.secondary,
      marginBottom: 8,
      marginTop: 16,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  }), [colors]);

  return (
    <ScreenWrapper background="background">
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {menuSections.map((section) => {
          // Skip Developer section if dev options are hidden
          if (section.title === "Developer" && !showDevOptions) return null;

          return (
            <View key={section.title}>
              <ThemedText style={dynamicStyles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={dynamicStyles.sectionContainer}>
                {section.items.map((item, itemIndex) => (
                  <MenuItemComponent
                    key={item.title}
                    item={item}
                    isLast={itemIndex === section.items.length - 1}
                    onPress={handleItemPress}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
}



type MenuSection = {
  title: string;
  items: {
    title: string;
    description: string;
    icon: string;
    route: Href;
  }[];
}

const menuSections: MenuSection[] = [
  {
    title: "Preferences",
    items: [
      {
        title: "Themes",
        description: "Switch light/dark/system",
        icon: "theme-light-dark",
        route: "/menu/themes",
      },
      {
        title: "Settings",
        description: "Configure app preferences",
        icon: "cog",
        route: "/menu/settings",
      },
    ]
  },
  {
    title: "Information",
    items: [
      {
        title: "About",
        description: "App info and version details",
        icon: "information-outline",
        route: "/menu/about",
      },
    ]
  },
  {
    title: "Developer",
    items: [
      {
        title: "Dev Options",
        description: "Seed data and debug tools",
        icon: "tools",
        route: "/menu/dev-options",
      },
    ]
  },
  {
    title: "Management",
    items: [
      {
        title: "Manage Categories & Sources",
        description: "Customize categories & sources",
        icon: "shape-outline",
        route: "/menu/(manage-categories)/expense-categories",
      },
      {
        title: "Manage Currency Settings",
        description: "Change currency and formatting",
        icon: "currency-usd",
        route: "/menu/currency-settings",
      },
      {
        title: "Manage Backup & Restore",
        description: "Backup and restore your data",
        icon: "backup-restore",
        route: "/menu/backup-restore-screen",
      }
    ]
  }
]

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollContentContainer: {
    paddingBottom: 150,
  },
});

export default MenuScreenBase;
