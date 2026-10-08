import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Icon, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormSheetHeader from '@/components/main/FormSheetHeader';
import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useHaptics } from '@/contexts/HapticsProvider';
import { useTransactionSelectionStore } from '@/stores/useTransactionSelectionStore';

export default function TransactionSelectionScreen() {
  const selection = useTransactionSelectionStore((state) => state.selection);
  const { colors } = useAppTheme();
  const { top, bottom, left, right } = useSafeAreaInsets();
  const { height, width, fontScale } = useWindowDimensions();
  const [sheetWidth, setSheetWidth] = useState(width);
  const { hapticImpact } = useHaptics();
  const owner = selection?.owner;
  const isGrid = selection?.layout === 'grid';
  const contentWidth = Math.max(1, sheetWidth - left - right - 32);
  // Include the inter-card gap when choosing columns: typical phone widths
  // fit three compact tiles, while wider sheets add columns naturally.
  const columns = isGrid ? Math.max(1, Math.floor((contentWidth + 10) / (96 * Math.max(1, fontScale) + 10))) : 1;
  const tileWidth = (contentWidth - (columns - 1) * 10) / columns;

  useEffect(() => () => {
    if (owner) useTransactionSelectionStore.getState().clear(owner);
  }, [owner]);

  return (
    <View onLayout={({ nativeEvent }) => setSheetWidth(nativeEvent.layout.width)}
      style={{ backgroundColor: colors.card, paddingLeft: left, paddingRight: right, maxHeight: height - top }}>
      <FormSheetHeader title={selection?.title ?? 'Select an option'} onClose={() => router.back()} />
      <FlatList
        key={`${isGrid ? 'grid' : 'list'}-${columns}`}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
        style={styles.scroll}
        data={selection?.options ?? []}
        keyExtractor={(item) => item.name}
        contentContainerStyle={[styles.list, { paddingBottom: bottom + 16 }]}
        renderItem={({ item }) => {
          const selected = selection?.selected === item.name;
          const accent = colors[selection?.accent ?? 'primary'];
          return (
            <View style={[styles.clip, isGrid && [styles.tile, { width: tileWidth, borderColor: selected ? accent : 'transparent' }],
              { backgroundColor: selected ? (isGrid ? colors[selection?.accent === 'tertiary' ? 'tertiaryContainer' : 'primaryContainer'] : colors.surfaceVariant) : colors.surface }]}>
              <TouchableRipple accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => {
                hapticImpact();
                selection?.onSelect(item.name);
                router.back();
              }}>
                {isGrid ? (
                  <View style={styles.tileContent}>
                    <View style={[styles.iconBadge, { backgroundColor: colors.surfaceVariant }]}>
                      <Icon source={item.icon} size={26} color={accent} />
                    </View>
                    <ThemedText style={styles.tileLabel} color={selected ? colors[selection?.accent === 'tertiary' ? 'onTertiaryContainer' : 'onPrimaryContainer'] : colors.text}>
                      {item.label}
                    </ThemedText>
                    {selected && <View style={styles.check}><Icon source="check-circle" size={18} color={accent} /></View>}
                  </View>
                ) : (
                <View style={styles.row}>
                  <Icon source={item.icon} size={24} color={accent} />
                  <ThemedText style={styles.label}>{item.label}</ThemedText>
                  {selected && <Icon source="check-circle" size={22} color={accent} />}
                </View>
                )}
              </TouchableRipple>
            </View>
          );
        }}
        ListEmptyComponent={<ThemedText color={colors.muted} style={styles.empty}>No options available. Add or enable them in settings.</ThemedText>}
        ListFooterComponent={selection?.manageRoute ? (
          <View style={[styles.clip, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableRipple onPress={() => {
              if (selection.manageRoute) router.replace(selection.manageRoute);
            }} accessibilityRole="button">
              <View style={styles.row}>
                <Icon source="cog-outline" size={22} color={colors.muted} />
                <ThemedText style={styles.label}>Manage {selection.title.toLowerCase()}</ThemedText>
                <Icon source="chevron-right" size={22} color={colors.muted} />
              </View>
            </TouchableRipple>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 1 },
  list: { padding: 16, gap: 8 },
  clip: { borderRadius: 16, overflow: 'hidden' },
  gridRow: { gap: 10 },
  tile: { borderWidth: 2, borderRadius: 20 },
  tileContent: { minHeight: 108, padding: 8, gap: 8, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 13, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  check: { position: 'absolute', top: 8, right: 8 },
  row: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { flex: 1, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  empty: { paddingVertical: 24, textAlign: 'center' },
});
