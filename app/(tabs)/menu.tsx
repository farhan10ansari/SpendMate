import React, { useCallback, useMemo } from "react";
import { LayoutChangeEvent, StyleSheet, ScrollView, View, useWindowDimensions } from "react-native";
import { Icon } from 'react-native-paper';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { Href, useRouter } from "expo-router";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { ThemedText } from "@/components/base/ThemedText";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import usePersistentAppStore from "@/stores/usePersistentAppStore";
import MenuItemComponent from "@/components/main/ScreenMenuItem";

function MenuScreenBase() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { fontScale } = useWindowDimensions();
  const [contentWidth, setContentWidth] = React.useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => setContentWidth(event.nativeEvent.layout.width), []);
  const twoColumns = contentWidth >= 720 * Math.max(1, fontScale);
  const showDevOptions = usePersistentAppStore((state) => state.uiFlags.showDevOptions);
  const columns = useMemo(() => {
    const visibleSections = menuSections.filter(section => section.title !== 'Developer' || showDevOptions);
    if (!twoColumns) return [visibleSections];
    return [
      visibleSections.filter((_, index) => index % 2 === 0),
      visibleSections.filter((_, index) => index % 2 === 1),
    ];
  }, [showDevOptions, twoColumns]);

  const handleItemPress = useCallback((route: Href) => {
    router.push(route);
  }, [router]);


  const dynamicStyles = useMemo(() => StyleSheet.create({
    sectionContainer: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.muted,
      marginLeft: 4,
    },
  }), [colors]);

  return (
    <ScreenWrapper background="background">
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: tabBarHeight + 20 }]}
      >
        <View style={[styles.hero, { backgroundColor: colors.primaryContainer }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}><Icon source="tune-variant" size={27} color={colors.primary} /></View>
          <View style={styles.heroText}>
            <ThemedText color={colors.onPrimaryContainer} style={styles.heroTitle}>Make it yours</ThemedText>
            <ThemedText color={colors.onPrimaryContainer} style={styles.heroCaption}>Your look, your preferences, your data.</ThemedText>
          </View>
        </View>
        <View style={styles.grid} onLayout={onLayout}>
          {columns.map((sections, columnIndex) => (
            <View key={columnIndex} style={styles.column}>
              {sections.map(section => (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeading}>
              <ThemedText style={dynamicStyles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              </View>
              <View style={dynamicStyles.sectionContainer}>
                {section.items.map((item, itemIndex) => (
                  <MenuItemComponent
                    key={item.title}
                    item={item}
                    isLast={itemIndex === section.items.length - 1}
                    onPress={handleItemPress}
                    tone={section.title === 'Danger Zone' ? 'error' : section.title === 'Management' ? 'tertiary' : 'primary'}
                  />
                ))}
              </View>
            </View>
              ))}
            </View>
          ))}
        </View>
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
        description: "Choose your colors and appearance",
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
    title: "Management",
    items: [
      {
        title: "Categories & Sources",
        description: "Customize categories & sources",
        icon: "shape-outline",
        route: "/menu/(manage-categories)/expense-categories",
      },
      {
        title: "Currency & Formatting",
        description: "Change currency and formatting",
        icon: "currency-usd",
        route: "/menu/currency-settings",
      },
      {
        title: "Backup & Restore",
        description: "Backup and restore your data",
        icon: "backup-restore",
        route: "/menu/backup-restore",
      }
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
    title: "Danger Zone",
    items: [
      {
        title: "Reset App",
        description: "Clear all data and reset",
        icon: "alert-circle-outline",
        route: "/menu/reset-app",
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
  }
]

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    gap: 22,
  },
  hero: { borderRadius: 26, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: { padding: 12, borderRadius: 18 },
  heroText: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 23, lineHeight: 30, fontWeight: '800' },
  heroCaption: { fontSize: 12, lineHeight: 19 },
  grid: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  column: { flex: 1, minWidth: 0, gap: 16 },
  section: { gap: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});

export default MenuScreenBase;
