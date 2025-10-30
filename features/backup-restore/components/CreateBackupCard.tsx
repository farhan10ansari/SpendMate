import React, { useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button, Icon } from 'react-native-paper';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';

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
  const theme = useAppTheme();
  const [customName, setCustomName] = useState('');

  const isDisabled = disabled || !hasBackupFolder;

  const handleCreateBackup = useCallback(() => {
    onCreateBackup(customName);
    setCustomName('');
  }, [customName, onCreateBackup]);

  const handleClearName = useCallback(() => {
    setCustomName('');
  }, []);

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Title
        title="Create New Backup"
        titleVariant="titleMedium"
        subtitle="Export all your data"
        left={(props) => <Icon {...props} source="backup-restore" />}
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
          style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
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
});
