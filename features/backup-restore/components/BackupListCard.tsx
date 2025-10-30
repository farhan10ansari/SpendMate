import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Card, Text, IconButton, Button, Divider, Icon } from 'react-native-paper';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { BackupMetadata } from '@/lib/types';
import { BackupListItem } from './BackupListItem';
import { useConfirmation } from '@/components/main/ConfirmationDialog';
import { useHaptics } from '@/contexts/HapticsProvider';

interface BackupListCardProps {
  backups: BackupMetadata[];
  hasBackupFolder: boolean;
  menuVisible: string | null;
  onMenuToggle: (backupPath: string | null) => void;
  onRefresh: () => void;
  onSelectFolder: () => void;
  onRestore: (backup: BackupMetadata) => void;
  onShare: (backup: BackupMetadata) => void;
  onDelete: (backup: BackupMetadata) => void;
  refreshing: boolean;
}

export const BackupListCard = React.memo<BackupListCardProps>(({
  backups,
  hasBackupFolder,
  menuVisible,
  onMenuToggle,
  onRefresh,
  onSelectFolder,
  onRestore,
  onShare,
  onDelete,
  refreshing,
}) => {
  const theme = useAppTheme();
  const { showConfirmationDialog } = useConfirmation();
  const { hapticImpact, hapticNotify } = useHaptics();


  const subtitle = useMemo(
    () => `${backups.length} backup${backups.length !== 1 ? 's' : ''} available`,
    [backups.length]
  );

  const handleDelete = useCallback((backup: BackupMetadata) => {
    onMenuToggle(null);
    hapticNotify('warning');
    showConfirmationDialog({
      title: 'Delete Backup',
      message: (
        <View style={styles.dialogContent}>
          <Icon source="delete-alert" size={40} color={theme.colors.error} />
          <Text variant="bodyLarge" style={styles.dialogTitle}>
            Delete this backup?
          </Text>
          <Text variant="bodyMedium" style={[styles.dialogMessage, { color: theme.colors.onSurfaceVariant }]}>
            This will permanently delete the backup{' '}
            <Text style={styles.boldText}>{backup.name}</Text>
          </Text>
        </View>
      ),
      onConfirm: () => onDelete(backup),
      type: "warning"
    });
  }, [onMenuToggle, showConfirmationDialog, theme.colors.error, theme.colors.onSurfaceVariant, onDelete]);

  const handleRestore = useCallback((backup: BackupMetadata) => {
    onMenuToggle(null);
    hapticNotify('warning');
    showConfirmationDialog({
      title: 'Restore Backup',
      message: (
        <View style={styles.dialogContent}>
          <Icon source="restore-alert" size={40} color={theme.colors.primary} />
          <Text variant="bodyLarge" style={styles.dialogTitle}>
            Restore this backup?
          </Text>
          <Text variant="bodyMedium" style={[styles.dialogMessage, { color: theme.colors.onSurfaceVariant }]}>
            This will overwrite your current data with the backup from{' '}
            <Text style={styles.boldText}>{backup.name}</Text>
          </Text>
        </View>
      ),
      onConfirm: () => onRestore(backup),
      type: "warning"
    });
  }, [onMenuToggle, showConfirmationDialog, theme.colors.primary, theme.colors.onSurfaceVariant, onRestore]);

  const handleShare = useCallback((backup: BackupMetadata) => {
    onMenuToggle(null);
    onShare(backup);
  }, [onMenuToggle, onShare]);

  const handleMenuClose = useCallback(() => {
    onMenuToggle(null);
  }, [onMenuToggle]);

  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  const renderEmptyState = useCallback(() => {
    if (!hasBackupFolder && Platform.OS === 'android') {
      return (
        <View style={styles.emptyContainer}>
          <Icon source="folder-alert" size={48} color={theme.colors.onSurfaceVariant} />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No backup folder selected
          </Text>
          <Text variant="bodySmall" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Please select a folder to view and manage your backups
          </Text>
          <Button
            mode="contained"
            onPress={onSelectFolder}
            icon="folder-plus"
            style={styles.emptyButton}
            compact
          >
            Select Folder
          </Button>
        </View>
      );
    }

    if (backups.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon source="folder-open" size={48} color={theme.colors.onSurfaceVariant} />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No backups yet
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Create your first backup above
          </Text>
        </View>
      );
    }

    return null;
  }, [hasBackupFolder, backups.length, theme.colors.onSurfaceVariant, onSelectFolder]);

  const emptyState = renderEmptyState();

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Title
        title="Saved Backups"
        titleVariant="titleMedium"
        subtitle={subtitle}
        left={(props) => <Icon {...props} source="folder-multiple" />}
        right={(props) => (
          <IconButton
            {...props}
            icon="refresh"
            onPress={handleRefresh}
            disabled={refreshing}
            loading={refreshing}
          />
        )}
      />
      <Card.Content style={styles.content}>
        {emptyState || backups.map((backup, index) => (
          <View key={backup.filePath}>
            {index > 0 && <Divider style={styles.divider} />}
            <BackupListItem
              backup={backup}
              menuVisible={menuVisible === backup.filePath}
              onMenuOpen={() => onMenuToggle(backup.filePath)}
              onMenuClose={handleMenuClose}
              onRestore={() => handleRestore(backup)}
              onShare={() => handleShare(backup)}
              onDelete={() => handleDelete(backup)}
            />
          </View>
        ))}
      </Card.Content>
    </Card>
  );
});

BackupListCard.displayName = 'BackupListCard';

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  content: {
    paddingTop: 0,
    paddingBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyTitle: {
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  emptyButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  dialogContent: {
    alignItems: 'center',
    gap: 12,
  },
  dialogTitle: {
    textAlign: 'center',
  },
  dialogMessage: {
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
});
