import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';

export default memo(function TransactionGroupHeading({ title, total, count }: { title: string; total: string; count: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.heading}>
      <ThemedText color={colors.muted} style={styles.title}>{title}</ThemedText>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <View style={styles.summary}>
        <ThemedText style={styles.total}>{total}</ThemedText>
        <ThemedText color={colors.muted} style={styles.count}>{count} {count === 1 ? 'entry' : 'entries'}</ThemedText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 18, paddingBottom: 4 },
  title: { fontSize: 13, lineHeight: 20, fontWeight: '700', flexShrink: 1 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, minWidth: 12 },
  summary: { alignItems: 'flex-end', flexShrink: 1 },
  total: { fontSize: 11, fontWeight: '600', lineHeight: 16 },
  count: { fontSize: 10, lineHeight: 15 },
});
