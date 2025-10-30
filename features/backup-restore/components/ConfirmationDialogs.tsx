// components/backup/ConfirmationDialogs.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Paragraph, Button, Text } from 'react-native-paper';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { BackupMetadata } from '@/lib/types';
import { formatDate } from '@/features/backup-restore/backup-utils';

type DialogType = 'restore' | 'delete' | 'changeFolder' | null;

interface ConfirmationDialogsProps {
  visible: boolean;
  type: DialogType;
  selectedBackup: BackupMetadata | null;
  onDismiss: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onChangeFolder: () => void;
}

export function ConfirmationDialogs({
  visible,
  type,
  selectedBackup,
  onDismiss,
  onRestore,
  onDelete,
  onChangeFolder,
}: ConfirmationDialogsProps) {
  const theme = useAppTheme();

  return (
    <>
      {/* Restore Dialog */}
      <Portal>
        <Dialog visible={visible && type === 'restore'} onDismiss={onDismiss}>
          <Dialog.Title>Restore Backup?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              ⚠️ This will permanently delete all your current data and replace it
              with:
            </Paragraph>
            {selectedBackup && (
              <View style={styles.dialogInfo}>
                <Text variant="bodyMedium">• {selectedBackup.name}</Text>
                <Text variant="bodySmall">
                  • {selectedBackup.recordCount.expenses} expenses
                </Text>
                <Text variant="bodySmall">
                  • {selectedBackup.recordCount.incomes} incomes
                </Text>
                <Text variant="bodySmall">
                  • {selectedBackup.recordCount.categories} categories
                </Text>
                <Text variant="bodySmall" style={{ marginTop: 8 }}>
                  Created: {formatDate(selectedBackup.date)}
                </Text>
              </View>
            )}
            <Paragraph style={{ marginTop: 12 }}>
              This action cannot be undone. Continue?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button
              mode="contained"
              onPress={onRestore}
              buttonColor={theme.colors.error}
            >
              Restore
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Dialog */}
      <Portal>
        <Dialog visible={visible && type === 'delete'} onDismiss={onDismiss}>
          <Dialog.Title>Delete Backup?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to delete this backup?</Paragraph>
            {selectedBackup && (
              <View style={styles.dialogInfo}>
                <Text variant="bodyMedium">{selectedBackup.name}</Text>
                <Text variant="bodySmall">{formatDate(selectedBackup.date)}</Text>
              </View>
            )}
            <Paragraph style={{ marginTop: 12 }}>
              This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button
              mode="contained"
              onPress={onDelete}
              buttonColor={theme.colors.error}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Change Folder Dialog */}
      <Portal>
        <Dialog visible={visible && type === 'changeFolder'} onDismiss={onDismiss}>
          <Dialog.Title>Change Backup Folder?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Changing the backup folder will show backups from the new location.
            </Paragraph>
            <Paragraph style={{ marginTop: 12 }}>
              Your existing backups will remain in the current folder and won't be
              automatically moved.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={onChangeFolder}>
              Select New Folder
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  dialogInfo: {
    marginTop: 12,
    paddingLeft: 8,
  },
});
