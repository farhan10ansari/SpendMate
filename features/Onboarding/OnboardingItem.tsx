import React from 'react';
import { View, useWindowDimensions, StyleSheet, ScrollView } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { OnboardingStep } from './OnboardingData';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';

interface Props {
  item: OnboardingStep;
  width: number;
  isActive: boolean;
}

const highlights: Record<string, { icon: string; title: string; detail: string }[]> = {
  '1': [
    { icon: 'plus-circle-outline', title: 'Capture the everyday', detail: 'Add expenses and income in a few taps.' },
    { icon: 'shield-lock-outline', title: 'Keep it personal', detail: 'Local storage, with you in control.' },
  ],
  '2': [
    { icon: 'tag-outline', title: 'Organized your way', detail: 'Custom categories, sources and payment methods.' },
    { icon: 'calendar-outline', title: 'An easy-to-follow timeline', detail: 'Browse your records by date and period.' },
  ],
  '3': [
    { icon: 'chart-donut', title: 'See the bigger picture', detail: 'Explore categories, totals and spending patterns.' },
    { icon: 'piggy-bank-outline', title: 'Know what’s left', detail: 'Check net income and your savings rate.' },
  ],
  '9': [
    { icon: 'plus', title: 'Start with one entry', detail: 'Tap + on Home to add an expense or income.' },
    { icon: 'database-export-outline', title: 'Keep a safe copy', detail: 'Create a backup from the menu when you need it.' },
  ],
};

export default function OnboardingItem({ item, width, isActive }: Props) {
  const { height, fontScale } = useWindowDimensions();
  const { colors } = useAppTheme();
  const wide = width >= 760 * Math.max(1, fontScale);
  const artworkHeight = height < 650 ? 130 : 190;
  return (
    <View style={{ width, flex: 1 }} accessibilityElementsHidden={!isActive} importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}>
        <View style={[styles.content, wide && styles.wide]}>
          <View style={[styles.story, wide && styles.column]}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
              style={[styles.artwork, { height: artworkHeight, backgroundColor: colors.primaryContainer }]}>
              <View style={[styles.orbit, { borderColor: colors.primary }]} />
              <View style={[styles.smallOrbit, { borderColor: colors.primary }]} />
              {item.lottie
                ? (isActive ? <View style={styles.animation}>{item.lottie}</View> : null)
                : <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
                    {typeof item.icon === 'string' ? <Icon source={item.icon} size={52} color={colors.primary} /> : item.icon}
                  </View>}
            </View>
            <Text style={[styles.tag, { color: colors.primary }]}>{item.type === 'setting' ? 'MAKE IT YOURS' : item.id === '9' ? 'READY WHEN YOU ARE' : 'MEET SPENDMATE'}</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.onSurface }]}>{item.title}</Text>
            <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>{item.description}</Text>
          </View>
          <View style={[styles.details, wide && styles.column]}>
            {item.component ? <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>{item.component}</View> : highlights[item.id]?.map(row => (
              <View key={row.title} style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.secondaryContainer }]}>
                  <Icon source={row.icon} size={22} color={colors.onSecondaryContainer} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={[styles.featureTitle, { color: colors.onSurface }]}>{row.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.onSurfaceVariant }]}>{row.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 20 },
  wide: { maxWidth: 840, flexDirection: 'row', alignItems: 'center', gap: 28 },
  column: { flex: 1 },
  story: { gap: 10 },
  artwork: { borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  orbit: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 28, opacity: 0.08, right: -80, top: -100 },
  smallOrbit: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 20, opacity: 0.08, left: -35, bottom: -65 },
  animation: { width: '100%', height: '100%', maxWidth: 240 },
  iconTile: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  tag: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  title: { fontSize: 27, lineHeight: 33, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 21 },
  details: { gap: 10 },
  settingCard: { padding: 12, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  featureIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  featureCopy: { flex: 1, gap: 4 },
  featureTitle: { fontSize: 14, fontWeight: '600' },
  featureDescription: { fontSize: 12, lineHeight: 18 },
});
