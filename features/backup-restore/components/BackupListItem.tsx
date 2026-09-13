// components/backup/BackupListItem.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Icon, IconButton, Menu, Divider } from 'react-native-paper';
import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { BackupMetadata } from '@/lib/types';
import { formatDate, formatFileSize } from '@/features/backup-restore/backup-utils';

interface BackupListItemProps {
  backup: BackupMetadata;
  menuVisible: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onRestore: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export function BackupListItem({
  backup,
  menuVisible,
  onMenuOpen,
  onMenuClose,
  onRestore,
  onShare,
  onDelete,
}: BackupListItemProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.item, { backgroundColor: theme.colors.surfaceVariant }]}>
      <List.Item
        title={backup.name}
        titleNumberOfLines={2}
        titleStyle={styles.title}
        descriptionStyle={styles.caption}
        description={formatDate(backup.date)}
        left={() => <View style={[styles.iconBadge, { backgroundColor: theme.colors.surface }]}><Icon source="file-document-outline" size={22} color={theme.colors.primary} /></View>}
        right={(props) => (
          <Menu
            visible={menuVisible}
            onDismiss={onMenuClose}
            anchor={
              <IconButton {...props} icon="dots-vertical" onPress={onMenuOpen} accessibilityLabel={`Actions for ${backup.name}`} />
            }
          >
            <Menu.Item onPress={onRestore} leadingIcon="restore" title="Restore" />
            <Menu.Item onPress={onShare} leadingIcon="share-variant" title="Share" />
            <Divider />
            <Menu.Item
              onPress={onDelete}
              leadingIcon="delete"
              title="Delete"
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        )}
      />
      <View style={styles.chipContainer}>
        <ThemedText style={styles.caption} color={theme.colors.muted}>{backup.recordCount.expenses} expenses · {backup.recordCount.incomes} incomes</ThemedText>
        <ThemedText style={styles.caption} color={theme.colors.muted}>{backup.recordCount.categories} categories & sources · {formatFileSize(backup.size)}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { borderRadius: 18 },
  title: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 11, lineHeight: 17 },
  iconBadge: { alignSelf: 'center', padding: 10, marginLeft: 12, borderRadius: 13 },
  chipContainer: {
    gap: 3,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
