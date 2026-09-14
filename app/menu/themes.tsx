import { StyleSheet, View, Pressable } from 'react-native';
import { Icon } from 'react-native-paper';
import { ThemedText } from '@/components/base/ThemedText';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { ScreenWrapper } from '@/components/main/ScreenWrapper';
import { themeOptions } from '@/lib/constants';
import { useHaptics } from '@/contexts/HapticsProvider';
import Color from 'color';
import { getThemeCollection, themeCollections, ThemeCollectionId } from '@/themes/collections';

export default function ThemesScreen() {
  const { colors, dark } = useAppTheme();
  const theme = usePersistentAppStore(state => state.theme);
  const setTheme = usePersistentAppStore(state => state.setTheme);
  const collectionId = usePersistentAppStore(state => state.themeCollection);
  const setThemeCollection = usePersistentAppStore(state => state.setThemeCollection);
  const collection = getThemeCollection(collectionId);
  const { hapticImpact } = useHaptics();
  const selectedTheme = themeOptions.find(option => option.key === theme);

  return (
    <ScreenWrapper background="background" withScrollView contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headingRow}>
          <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
            <Icon source="palette-swatch-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.text}>
            <ThemedText style={styles.heading}>Collection</ThemedText>
            <ThemedText color={colors.muted} style={styles.description}>A different palette, the same SpendMate.</ThemedText>
          </View>
        </View>
        <View style={styles.collections}>
          {(Object.keys(themeCollections) as ThemeCollectionId[]).map(id => {
            const option = themeCollections[id];
            const selected = collection === option;
            const preview = (dark ? option.dark : option.light).colors;
            return (
              <View key={id} style={[styles.option, styles.collectionOption, {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: preview.surface,
              }]}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${option.name}. ${option.description}`}
                  onPress={() => {
                    if (selected) return;
                    hapticImpact();
                    setThemeCollection(id);
                  }}
                  android_ripple={{ color: preview.ripplePrimary, foreground: true }}
                  style={({ pressed }) => [styles.choice, pressed && { opacity: 0.85 }]}
                >
                  <View style={styles.swatches}>
                    {[preview.primary, preview.tertiary, preview.primaryContainer].map((color, index) => (
                      <View key={index} style={[styles.swatch, { backgroundColor: color }]} />
                    ))}
                  </View>
                  <ThemedText color={preview.onSurface} style={styles.label}>{option.name}</ThemedText>
                  <View style={styles.indicator}>
                    {selected && <Icon source="check" size={13} color={preview.primary} />}
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
          <ThemedText color={colors.primary} style={styles.selectionTitle}>{collection.name} · {selectedTheme?.label}</ThemedText>
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
  collections: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  collectionOption: { flex: 0, width: '31.5%' },
  option: { flex: 1, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  choice: { paddingHorizontal: 4, paddingTop: 12, paddingBottom: 6, alignItems: 'center', gap: 5 },
  label: { fontSize: 12, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
  indicator: { height: 13 },
  swatches: { flexDirection: 'row', gap: 3, height: 24, alignItems: 'center' },
  swatch: { width: 18, height: 18, borderRadius: 9 },
  selectionDetails: { gap: 4 },
  selectionTitle: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
});
