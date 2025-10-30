import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Icon } from 'react-native-paper';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useConfirmation } from '@/components/main/ConfirmationDialog';

interface BackupLocationCardProps {
  backupFolderUri: string | null;
  onSelectFolder: () => void;
  disabled?: boolean;
}

function parseBackupFolderPath(uri: string | null): {
  shortName: string;
  fullPath: string;
} {
  if (!uri) {
    return { shortName: 'Not selected', fullPath: 'No folder selected' };
  }

  try {
    const decodedUri = decodeURIComponent(uri);

    if (decodedUri.includes('primary:')) {
      const parts = decodedUri.split('primary:');
      if (parts.length > 1) {
        const path = parts[1];
        return {
          shortName: 'Internal Storage',
          fullPath: `Internal Storage/${path}`,
        };
      }
    }

    if (decodedUri.includes(':')) {
      const parts = decodedUri.split(':');
      if (parts.length > 1) {
        const storagePart = parts[0].split('/').pop() || '';
        const path = parts[1];

        const isSDCard =
          storagePart.toLowerCase().includes('sd') ||
          storagePart.match(/[0-9A-F]{4}-[0-9A-F]{4}/i);

        return {
          shortName: isSDCard ? 'SD Card' : 'External Storage',
          fullPath: `${isSDCard ? 'SD Card' : 'External Storage'}/${path}`,
        };
      }
    }

    const segments = decodedUri.split('/');
    const lastSegment =
      segments[segments.length - 1] || segments[segments.length - 2] || 'Selected folder';

    return { shortName: lastSegment, fullPath: lastSegment };
  } catch (error) {
    console.error('Failed to parse URI:', error);
    return { shortName: 'Selected folder', fullPath: 'Selected folder' };
  }
}

export const BackupLocationCard = React.memo<BackupLocationCardProps>(({
  backupFolderUri,
  onSelectFolder,
  disabled = false,
}) => {
  const theme = useAppTheme();
  const { showConfirmationDialog } = useConfirmation();

  const { shortName, fullPath } = useMemo(
    () => parseBackupFolderPath(backupFolderUri),
    [backupFolderUri]
  );

  const hasFolder = !!backupFolderUri;

  const handleChangeFolder = useCallback(() => {
    showConfirmationDialog({
      title: "Change Backup Folder?",
      message: (
        <>
          <Text variant='bodyMedium'>
            Changing the backup folder will show backups from the new location.
          </Text>
          <Text variant='bodyMedium' style={styles.messageSpacing}>
            {`Your existing backups will remain in the current folder and won't be automatically moved.`}
          </Text>
        </>
      ),
      onConfirm: onSelectFolder
    });
  }, [showConfirmationDialog, onSelectFolder]);

  const backgroundColor = hasFolder
    ? theme.colors.surfaceVariant
    : theme.colors.errorContainer;

  const iconColor = hasFolder ? theme.colors.primary : theme.colors.error;
  const iconName = hasFolder ? 'folder-open' : 'folder-alert';

  const textColor = hasFolder
    ? theme.colors.onSurfaceVariant
    : theme.colors.onErrorContainer;

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Title
        title="Backup Location"
        titleVariant="titleMedium"
        left={(props) => <Icon {...props} source="folder-cog" />}
      />
      <Card.Content style={styles.content}>
        <View style={[styles.locationContainer, { backgroundColor }]}>
          <Icon source={iconName} size={26} color={iconColor} />
          <View style={styles.textContainer}>
            <Text
              variant="labelLarge"
              style={[styles.shortName, { color: iconColor }]}
            >
              {shortName}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: textColor }}
              numberOfLines={2}
            >
              {fullPath}
            </Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode={hasFolder ? 'outlined' : 'contained'}
          onPress={hasFolder ? handleChangeFolder : onSelectFolder}
          icon={hasFolder ? 'folder-edit' : 'folder-plus'}
          disabled={disabled}
          compact
        >
          {hasFolder ? 'Change Folder' : 'Select Folder'}
        </Button>
      </Card.Actions>
    </Card>
  );
});

BackupLocationCard.displayName = 'BackupLocationCard';

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  content: {
    paddingTop: 0,
    paddingBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  shortName: {
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 8,
  },
  messageSpacing: {
    marginTop: 12,
  },
});
