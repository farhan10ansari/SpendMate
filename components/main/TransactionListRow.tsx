import { ComponentProps, memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { ThemedText } from '@/components/base/ThemedText';
import { ThemeType } from '@/themes/theme';

type Props = {
  id?: number;
  kind: 'expense' | 'income';
  label: string;
  icon: ComponentProps<typeof Icon>['source'];
  description?: string | null;
  metadata: string;
  amount: string;
  theme: ThemeType;
  onPress?: (id: number) => void;
};

export default memo(function TransactionListRow({ id, kind, label, icon, description, metadata, amount, theme, onPress }: Props) {
  const { colors } = theme;
  const expense = kind === 'expense';
  const accent = expense ? colors.primary : colors.tertiary;
  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={() => { if (id !== undefined) onPress?.(id); }}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${expense ? 'expense' : 'income'}, ${amount}, ${metadata}${description ? `, ${description}` : ''}`}
        android_ripple={{ color: expense ? colors.ripplePrimary : colors.rippleTertiary, foreground: true }}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={[styles.icon, { backgroundColor: expense ? colors.primaryContainer : colors.tertiaryContainer }]}>
          <Icon source={icon} size={23} color={accent} />
        </View>
        <View style={styles.details}>
          <ThemedText numberOfLines={1} style={styles.label}>{label}</ThemedText>
          {description?.trim() ? <ThemedText numberOfLines={1} color={colors.muted} style={styles.note}>{description}</ThemedText> : null}
          <ThemedText color={colors.muted} style={styles.metadata}>{metadata}</ThemedText>
        </View>
        <View style={styles.amountWrap}>
          <ThemedText color={accent} style={styles.amount}>{expense ? '−' : '+'}{amount}</ThemedText>
          <Icon source="chevron-right" size={16} color={colors.muted} />
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { borderRadius: 22, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  row: { padding: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, minHeight: 80 },
  pressed: { opacity: 0.85 },
  icon: { padding: 12, borderRadius: 16 },
  details: { flex: 1, minWidth: 110, gap: 2 },
  label: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  note: { fontSize: 12, lineHeight: 18 },
  metadata: { fontSize: 11, lineHeight: 17 },
  amountWrap: { marginLeft: 'auto', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 4 },
  amount: { fontSize: 17, lineHeight: 25, fontWeight: '800', flexShrink: 1 },
});
