import { useEffect, useState } from 'react';
import Color from 'color';
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
  const accent = colors[selection?.accent ?? 'primary'];
  const accentContainer = colors[selection?.accent === 'tertiary' ? 'tertiaryContainer' : 'primaryContainer'];
  const onAccentContainer = colors[selection?.accent === 'tertiary' ? 'onTertiaryContainer' : 'onPrimaryContainer'];
  const onAccent = colors[selection?.accent === 'tertiary' ? 'onTertiary' : 'onPrimary'];
  const selectedBackground = Color(colors.surface).mix(Color(accentContainer), 0.55).hex();
  const idleBorder = Color(colors.surface).mix(Color(colors.border), 0.5).hex();
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
      <FormSheetHeader title={
        <View style={styles.heading}>
          <ThemedText style={styles.title}>{selection ? `Choose ${selection.title.toLowerCase()}` : 'Select an option'}</ThemedText>
          <ThemedText color={colors.muted} style={styles.subtitle}>Tap an option to use it for this transaction</ThemedText>
        </View>
      } onClose={() => router.back()} />
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
          return (
            <View style={[styles.clip, isGrid && [styles.tile, { width: tileWidth }],
              { borderColor: selected ? accent : idleBorder, backgroundColor: selected ? selectedBackground : colors.surface }]}>
              <TouchableRipple accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: selected }} onPress={() => {
                hapticImpact();
                selection?.onSelect(item.name);
                router.back();
              }}>
                {isGrid ? (
                  <View style={styles.tileContent}>
                    <View style={[styles.iconBadge, { backgroundColor: accentContainer }]}>
                      <Icon source={item.icon} size={26} color={onAccentContainer} />
                    </View>
                    <ThemedText style={styles.tileLabel} color={selected ? accent : colors.text}>
                      {item.label}
                    </ThemedText>
                    {selected && <View style={[styles.check, { backgroundColor: accent }]}><Icon source="check" size={12} color={onAccent} /></View>}
                  </View>
                ) : (
                <View style={styles.row}>
                  <View style={[styles.rowBadge, { backgroundColor: accentContainer }]}>
                    <Icon source={item.icon} size={22} color={onAccentContainer} />
                  </View>
                  <ThemedText style={styles.label} color={selected ? accent : colors.text}>{item.label}</ThemedText>
                  <Icon source={selected ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={selected ? accent : colors.muted} />
                </View>
                )}
              </TouchableRipple>
            </View>
          );
        }}
        ListEmptyComponent={<ThemedText color={colors.muted} style={styles.empty}>No options available. Add or enable them in settings.</ThemedText>}
        ListFooterComponent={selection?.manageRoute ? (
          <View style={[styles.clip, styles.manage, { backgroundColor: colors.surface, borderColor: idleBorder }]}>
            <TouchableRipple onPress={() => {
              if (selection.manageRoute) router.replace(selection.manageRoute);
            }} accessibilityRole="button">
              <View style={styles.row}>
                <View style={[styles.rowBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Icon source="tune-variant" size={22} color={colors.muted} />
                </View>
                <View style={styles.heading}>
                  <ThemedText style={styles.label}>Manage {selection.title.toLowerCase()}</ThemedText>
                  <ThemedText color={colors.muted} style={styles.subtitle}>Customize your options</ThemedText>
                </View>
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
  heading: { flex: 1, gap: 3 },
  title: { fontSize: 21, lineHeight: 28, fontWeight: '700' },
  subtitle: { fontSize: 12, lineHeight: 17 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  list: { padding: 16, gap: 10 },
  clip: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  gridRow: { gap: 10 },
  tile: { borderRadius: 20 },
  tileContent: { minHeight: 114, paddingHorizontal: 8, paddingVertical: 14, gap: 10, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 13, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  check: { position: 'absolute', top: 7, right: 7, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  row: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBadge: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { flexShrink: 1, flexGrow: 1, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  manage: { marginTop: 6 },
  empty: { paddingVertical: 24, textAlign: 'center' },
});
