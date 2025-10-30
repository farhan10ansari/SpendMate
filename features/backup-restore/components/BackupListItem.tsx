// components/backup/BackupListItem.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Chip, IconButton, Menu, Divider } from 'react-native-paper';
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
    <View>
      <List.Item
        title={backup.name}
        description={formatDate(backup.date)}
        left={(props) => <List.Icon {...props} icon="file-document-outline" />}
        right={(props) => (
          <Menu
            visible={menuVisible}
            onDismiss={onMenuClose}
            anchor={
              <IconButton {...props} icon="dots-vertical" onPress={onMenuOpen} />
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
        <Chip icon="chart-bar" compact>
          {backup.recordCount.expenses} expenses
        </Chip>
        <Chip icon="cash-plus" compact>
          {backup.recordCount.incomes} incomes
        </Chip>
        <Chip icon="tag" compact>
          {backup.recordCount.categories} categories
        </Chip>
        <Chip icon="file" compact>
          {formatFileSize(backup.size)}
        </Chip>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
