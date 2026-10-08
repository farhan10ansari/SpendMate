import { useEffect, useState } from 'react';
import Color from 'color';
import { Keyboard, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon, TouchableRipple } from 'react-native-paper';
import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useHaptics } from '@/contexts/HapticsProvider';
import { useTransactionSelectionStore, type TransactionOption } from '@/stores/useTransactionSelectionStore';

type Props = {
  label: string;
  value: string | null | undefined;
  options: TransactionOption[];
  onSelect: (value: string) => void;
  icon: string;
  required?: boolean;
  accent?: 'primary' | 'tertiary';
  manageRoute?: Href;
  layout?: 'list' | 'grid';
  error?: string;
};

export default function TransactionDropdown({ label, value, options, onSelect, icon, required, accent = 'primary', manageRoute, layout = 'list', error }: Props) {
  const { colors } = useAppTheme();
  const { hapticImpact } = useHaptics();
  const [owner] = useState(() => Symbol('transaction-dropdown'));
  const selected = options.find((option) => option.name === value);
  const hasValue = Boolean(selected || value);
  const accentContainer = colors[accent === 'tertiary' ? 'tertiaryContainer' : 'primaryContainer'];
  const onAccentContainer = colors[accent === 'tertiary' ? 'onTertiaryContainer' : 'onPrimaryContainer'];
  const backgroundColor = hasValue
    ? Color(colors.surface).mix(Color(accentContainer), 0.16).hex()
    : colors.surface;
  const borderColor = hasValue
    ? Color(colors.border).mix(Color(colors[accent]), 0.35).hex()
    : colors.border;

  useEffect(() => () => useTransactionSelectionStore.getState().clear(owner), [owner]);

  const openSheet = () => {
    Keyboard.dismiss();
    hapticImpact();
    useTransactionSelectionStore.getState().open({ owner, title: label, options, selected: value, accent, onSelect, manageRoute, layout });
    router.push('/helper-screens/select-transaction-option' as Href);
  };

  return (
    <View style={styles.field}>
    <View style={[styles.clip, { backgroundColor, borderColor: error ? colors.error : borderColor }]}>
      <TouchableRipple onPress={openSheet} accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? value ?? 'Not selected'}`}
        accessibilityHint={error ?? `Opens ${label.toLowerCase()} selection`}>
        <View style={styles.content}>
          <View style={styles.heading}>
            <ThemedText color={error ? colors.error : colors.muted} style={styles.label}
              numberOfLines={1} accessibilityLabel={error ?? label} accessibilityLiveRegion="polite">
              {error ? (layout === 'grid' ? (accent === 'tertiary' ? 'Select a source' : 'Select a category') : error) : (
                <>{label}{required && <ThemedText color={colors.error}> *</ThemedText>}</>
              )}
            </ThemedText>
            <View style={[styles.chevron, { backgroundColor: colors.surfaceVariant }]}>
              <Icon source="chevron-down" size={16} color={hasValue ? colors[accent] : colors.muted} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.iconBadge, { backgroundColor: accentContainer }]}>
              <Icon source={selected?.icon ?? icon} size={20} color={onAccentContainer} />
            </View>
            <ThemedText numberOfLines={2} style={styles.value} color={hasValue ? colors.text : colors.muted}>
              {selected?.label ?? value ?? 'Select'}
            </ThemedText>
          </View>
        </View>
      </TouchableRipple>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, minWidth: 0 },
  clip: { minWidth: 0, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  content: { padding: 12, gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  chevron: { width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  value: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '700' },
});
