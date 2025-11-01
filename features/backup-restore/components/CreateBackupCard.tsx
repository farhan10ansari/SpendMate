import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, TextInput, Button, Icon } from 'react-native-paper';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useConfirmation } from '@/components/main/ConfirmationDialog';
import { useHaptics } from '@/contexts/HapticsProvider';

interface CreateBackupCardProps {
  onCreateBackup: (name: string) => void;
  onImportBackup: () => void;
  disabled?: boolean;
  hasBackupFolder: boolean;
}

export const CreateBackupCard = React.memo<CreateBackupCardProps>(({
  onCreateBackup,
  onImportBackup,
  disabled = false,
  hasBackupFolder,
}) => {
  const { colors } = useAppTheme();
  const [customName, setCustomName] = useState('');
  const { showConfirmationDialog } = useConfirmation()
  const { hapticImpact } = useHaptics()
  const isDisabled = disabled || !hasBackupFolder;

  const handleCreateBackup = useCallback(() => {
    hapticImpact()
    showConfirmationDialog({
      title: 'Create Backup',
      message: (
        <View style={styles.dialogContent}>
          <Icon source="backup-restore" size={40} color={colors.primary} />
          <Text variant="bodyLarge" style={styles.dialogTitle}>
            Create New Backup?
          </Text>
          <Text variant="bodyMedium" style={[styles.dialogMessage, { color: colors.onSurfaceVariant }]}>
            This will create a new backup & save it to your backup folder.
          </Text>
        </View>
      ),
      onConfirm: () => {
        onCreateBackup(customName);
        setCustomName('');
      },
      confirmText: "Create",
    })
  }, [customName, onCreateBackup, hapticImpact, showConfirmationDialog, colors]);

  const handleClearName = useCallback(() => {
    setCustomName('');
  }, []);

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Title
        title="Create New Backup"
        titleVariant="titleMedium"
        subtitle="Export all your data"
        left={(props) => <Icon {...props} source="backup-restore" color={colors.onSurfaceVariant} />}
      />
      <Card.Content style={styles.content}>
        <TextInput
          mode="outlined"
          label="Backup Name (Optional)"
          placeholder="e.g., Monthly Backup"
          value={customName}
          onChangeText={setCustomName}
          left={<TextInput.Icon icon="text-box" />}
          right={
            customName ? (
              <TextInput.Icon icon="close" onPress={handleClearName} />
            ) : null
          }
          disabled={isDisabled}
        // dense
        />
        <Text
          variant="bodySmall"
          style={[styles.helperText, { color: colors.onSurfaceVariant }]}
        >
          Leave blank to auto-generate name with date
        </Text>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleCreateBackup}
          disabled={isDisabled}
          icon="plus"
          compact
          style={styles.createButton}
        >
          Create Backup
        </Button>
        <Button
          mode="outlined"
          onPress={onImportBackup}
          disabled={isDisabled}
          icon="import"
          compact
        >
          Import
        </Button>
      </Card.Actions>
    </Card>
  );
});

CreateBackupCard.displayName = 'CreateBackupCard';

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  content: {
    paddingTop: 0,
    paddingBottom: 8,
    gap: 4,
  },
  helperText: {
    marginTop: 4,
  },
  actions: {
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 8,
    gap: 8,
  },
  createButton: {
    marginRight: 0,
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
  }
});
