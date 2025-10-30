import * as DocumentPicker from 'expo-document-picker';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { log } from '@/lib/logger';
import { BackupData, BackupMetadata } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';
import * as Sharing from 'expo-sharing';

function validateBackup(backup: unknown): backup is BackupData {
  if (!backup || typeof backup !== 'object') {
    log.warn('Backup validation failed: not an object');
    return false;
  }

  const data = backup as Record<string, unknown>;

  if (!data.date || typeof data.date !== 'string') {
    log.warn('Backup validation failed: invalid date');
    return false;
  }

  if (!data.name || typeof data.name !== 'string') {
    log.warn('Backup validation failed: invalid name');
    return false;
  }

  if (!data.db || typeof data.db !== 'object') {
    log.warn('Backup validation failed: invalid db structure');
    return false;
  }

  const db = data.db as Record<string, unknown>;

  if (!Array.isArray(db.expenses)) {
    log.warn('Backup validation failed: expenses not an array');
    return false;
  }

  if (!Array.isArray(db.incomes)) {
    log.warn('Backup validation failed: incomes not an array');
    return false;
  }

  if (!Array.isArray(db.categories)) {
    log.warn('Backup validation failed: categories not an array');
    return false;
  }

  log.debug('Backup validation passed');
  return true;
}

export class BackupService {
  private db: ReturnType<typeof drizzle>;

  constructor(database: ReturnType<typeof drizzle>) {
    this.db = database;
    log.debug('BackupService initialized');
  }

  async selectBackupFolder(): Promise<string | null> {
    try {
      if (Platform.OS !== 'android') {
        const errorMsg = 'Folder selection is only available on Android';
        log.error(errorMsg);
        throw new Error(errorMsg);
      }

      log.info('Requesting directory permissions');
      const initialUri = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments';

      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);

      if (!permissions.granted) {
        log.warn('Directory permissions denied by user');
        throw new Error('Permission denied');
      }

      const folderUri = permissions.directoryUri;
      log.info('Backup folder selected successfully:', folderUri);

      return folderUri;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Failed to select backup folder:', errorMsg);
      throw error;
    }
  }

  async createBackup({ fileName, backupData, folderUri }: {
    fileName: string;
    backupData: BackupData;
    folderUri: string;
  }): Promise<string> {
    if (!folderUri || Platform.OS !== 'android') {
      const errorMsg = 'Cannot create backup: No folder URI or not Android';
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      log.info('Creating backup file:', fileName);
      log.debug('Backup data summary:', {
        expenses: backupData.db.expenses.length,
        incomes: backupData.db.incomes.length,
        categories: backupData.db.categories.length,
      });

      const jsonString = JSON.stringify(backupData, null, 2);
      log.debug(`Backup JSON size: ${(jsonString.length / 1024).toFixed(2)} KB`);

      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        folderUri,
        fileName,
        'application/json'
      );

      log.debug('Backup file created at:', fileUri);

      await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, jsonString);

      log.info('Backup file written successfully:', fileName);
      return fileUri;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Backup creation failed:', errorMsg);
      throw new Error(`Failed to create backup: ${errorMsg}`);
    }
  }

  private async getBackupMetadata(fileUri: string): Promise<BackupMetadata | null> {
    try {
      log.debug('Reading backup metadata from:', fileUri);

      const content = await FileSystem.StorageAccessFramework.readAsStringAsync(fileUri);
      const backup: BackupData = JSON.parse(content);

      if (!validateBackup(backup)) {
        log.warn('Invalid backup format detected for file:', fileUri);
        throw new Error('Invalid backup format');
      }

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      const fileName = fileUri.split('/').pop() || 'unknown.json';

      const metadata: BackupMetadata = {
        name: backup.name,
        date: backup.date,
        filePath: fileUri,
        fileName: fileName,
        size: 'size' in fileInfo ? fileInfo.size : null,
        recordCount: {
          expenses: backup.db.expenses.length,
          incomes: backup.db.incomes.length,
          categories: backup.db.categories.length,
        },
      };

      log.debug('Backup metadata extracted:', {
        name: metadata.name,
        fileName: metadata.fileName,
        recordCount: metadata.recordCount,
      });

      return metadata;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.warn('Failed to read backup metadata:', errorMsg, 'File:', fileUri);
      return null;
    }
  }

  async listBackups(folderUri: string): Promise<BackupMetadata[]> {
    if (!folderUri || Platform.OS !== 'android') {
      const errorMsg = 'Cannot list backups: No folder URI or not Android';
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      log.info('Listing backups in folder:', folderUri);

      const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(folderUri);
      log.debug(`Found ${files.length} file(s) in backup folder`);

      const backups: BackupMetadata[] = [];

      for (const fileUri of files) {
        if (fileUri.endsWith('.json')) {
          const metadata = await this.getBackupMetadata(fileUri);
          if (metadata) {
            backups.push(metadata);
          }
        }
      }

      const sortedBackups = backups.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      log.info(`Successfully loaded ${sortedBackups.length} valid backup(s)`);
      return sortedBackups;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Failed to list backups:', errorMsg);
      return [];
    }
  }

  async deleteBackup(filePath: string): Promise<void> {
    try {
      log.info('Deleting backup file:', filePath);

      await FileSystem.StorageAccessFramework.deleteAsync(filePath);

      log.info('Backup deleted successfully:', filePath);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Failed to delete backup:', errorMsg, 'File:', filePath);
      throw new Error(`Unable to delete backup file: ${errorMsg}`);
    }
  }

  async shareBackup(fileUri: string, backupName: string): Promise<void> {
    try {
      log.info('Sharing backup:', backupName);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        const errorMsg = 'Sharing is not available on this device';
        log.error(errorMsg);
        throw new Error(errorMsg);
      }

      log.debug('Reading backup content for sharing');
      const content = await FileSystem.StorageAccessFramework.readAsStringAsync(fileUri);

      const fileName = `${backupName}.json`.replace(/[^a-zA-Z0-9._-]/g, '_');
      const cacheUri = `${FileSystem.cacheDirectory}${fileName}`;

      log.debug('Writing backup to cache:', cacheUri);
      await FileSystem.writeAsStringAsync(cacheUri, content);

      log.debug('Opening share dialog');
      await Sharing.shareAsync(cacheUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Backup File',
        UTI: 'public.json',
      });

      // Cleanup cache file
      try {
        await FileSystem.deleteAsync(cacheUri, { idempotent: true });
        log.debug('Cache file cleaned up successfully');
      } catch (cleanupError) {
        log.warn('Cache cleanup failed:', getErrorMessage(cleanupError));
      }

      log.info('Backup shared successfully:', backupName);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Backup sharing failed:', errorMsg);
      throw new Error(`Failed to share backup: ${errorMsg}`);
    }
  }

  async restoreBackup(filePath: string): Promise<BackupData> {
    try {
      log.info('Restoring backup from:', filePath);

      const content = await FileSystem.StorageAccessFramework.readAsStringAsync(filePath);
      log.debug(`Backup file size: ${(content.length / 1024).toFixed(2)} KB`);

      const backup: BackupData = JSON.parse(content);

      if (!validateBackup(backup)) {
        const errorMsg = 'Invalid or corrupted backup file';
        log.error(errorMsg);
        throw new Error(errorMsg);
      }

      log.info('Backup file validated successfully');
      log.debug('Backup contains:', {
        name: backup.name,
        date: backup.date,
        version: backup.version,
        expenses: backup.db.expenses.length,
        incomes: backup.db.incomes.length,
        categories: backup.db.categories.length,
      });

      return backup;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Backup restoration failed:', errorMsg);

      if (errorMsg.includes('JSON')) {
        throw new Error('Backup file is corrupted or invalid');
      }

      throw new Error(`Failed to restore backup: ${errorMsg}`);
    }
  }

  async importBackup(folderUri: string): Promise<string> {
    try {
      log.info('Starting backup import process');

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        log.debug('Backup import cancelled by user');
        throw new Error('cancelled');
      }

      const sourceUri = result.assets[0].uri;
      log.info('Backup file selected:', sourceUri);

      log.debug('Reading and validating backup file');
      const content = await FileSystem.readAsStringAsync(sourceUri);
      const backup: BackupData = JSON.parse(content);

      if (!validateBackup(backup)) {
        const errorMsg = 'Invalid backup file format';
        log.error(errorMsg);
        throw new Error(errorMsg);
      }

      log.debug('Checking for duplicate backups');
      const existingBackups = await this.listBackups(folderUri);
      const isDuplicate = existingBackups.some(
        (existing) => existing.name === backup.name && existing.date === backup.date
      );

      if (isDuplicate) {
        const errorMsg = 'This backup already exists in your backup folder';
        log.warn(errorMsg);
        throw new Error(errorMsg);
      }

      const fileName = `Imported_${Date.now()}.json`;
      log.debug('Creating imported backup file:', fileName);

      const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
        folderUri,
        fileName,
        'application/json'
      );

      await FileSystem.StorageAccessFramework.writeAsStringAsync(destinationUri, content);

      log.info('Backup imported successfully:', destinationUri);
      return destinationUri;
    } catch (error) {
      const errorMsg = getErrorMessage(error);

      if (errorMsg === 'cancelled') {
        throw error;
      }

      log.error('Failed to import backup:', errorMsg);
      throw new Error(`Failed to import backup: ${errorMsg}`);
    }
  }
}
