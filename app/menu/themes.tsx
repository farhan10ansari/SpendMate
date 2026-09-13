import { StyleSheet, View, Pressable } from 'react-native';
import { Icon } from 'react-native-paper';
import { ThemedText } from '@/components/base/ThemedText';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { ScreenWrapper } from '@/components/main/ScreenWrapper';
import { themeOptions } from '@/lib/constants';
import { useHaptics } from '@/contexts/HapticsProvider';
import Color from 'color';

export default function ThemesScreen() {
  const { colors, dark } = useAppTheme();
  const theme = usePersistentAppStore(state => state.theme);
  const setTheme = usePersistentAppStore(state => state.setTheme);
  const { hapticImpact } = useHaptics();
  const selectedTheme = themeOptions.find(option => option.key === theme);

  return (
    <ScreenWrapper background="background" withScrollView contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headingRow}>
          <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
            <Icon source="palette-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.text}>
            <ThemedText style={styles.heading}>Appearance</ThemedText>
            <ThemedText color={colors.muted} style={styles.description}>Choose the look that suits you.</ThemedText>
          </View>
        </View>
        <View style={styles.options}>
          {themeOptions.map(option => {
            const selected = theme === option.key;
            return (
              <View key={option.key} style={[styles.option, {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? Color(colors.surface).mix(Color(colors.primary), 0.12).hex() : colors.surface,
              }]}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${option.label}. ${option.description}`}
                  onPress={() => {
                    if (selected) return;
                    hapticImpact();
                    setTheme(option.key);
                  }}
                  android_ripple={{ color: colors.ripplePrimary, foreground: true }}
                  style={({ pressed }) => [styles.choice, pressed && { opacity: 0.85 }]}
                >
                  <Icon source={option.icon} size={24} color={selected ? colors.primary : colors.muted} />
                  <ThemedText color={selected ? colors.primary : colors.text} style={styles.label}>{option.label}</ThemedText>
                  <View style={styles.indicator}>
                    {selected && <Icon source="check" size={13} color={colors.primary} />}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headingRow}>
          <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
            <Icon source="check-circle-outline" size={21} color={colors.primary} />
          </View>
          <ThemedText style={[styles.heading, styles.text]}>Current Selection</ThemedText>
        </View>
        <View style={styles.selectionDetails}>
          <ThemedText color={colors.primary} style={styles.selectionTitle}>{selectedTheme?.label} Theme</ThemedText>
          <ThemedText color={colors.muted} style={styles.description}>{selectedTheme?.description}</ThemedText>
          <ThemedText color={colors.muted} style={styles.description}>Currently using {dark ? 'dark' : 'light'} mode.</ThemedText>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  card: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 16, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, gap: 16 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { padding: 10, borderRadius: 14 },
  text: { flex: 1 },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  description: { fontSize: 12, lineHeight: 18 },
  options: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  choice: { paddingHorizontal: 4, paddingTop: 12, paddingBottom: 6, alignItems: 'center', gap: 5 },
  label: { fontSize: 12, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
  indicator: { height: 13 },
  selectionDetails: { gap: 4 },
  selectionTitle: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
});
