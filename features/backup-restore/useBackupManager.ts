import { useCallback, useEffect, useMemo, useState } from 'react';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import db from '@/db/client';
import { BackupService } from './backup-restore';
import { Platform } from 'react-native';
import { useBackupData } from './useBackupData';
import { useSnackbar } from '@/contexts/GlobalSnackbarProvider';
import { getErrorMessage } from '@/lib/utils';
import { BackupMetadata } from '@/lib/types';
import { log } from '@/lib/logger';

export function useBackupManager() {
  const { showSnackbar } = useSnackbar();
  const { getBackupData, restoreBackupData } = useBackupData();
  const updatesettings = usePersistentAppStore((state) => state.updateSettings);
  const backupFolderUri = usePersistentAppStore((state) => state.settings.backupFolderUri);

  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingBackups, setRefreshingBackups] = useState(false);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);

  // Memoize backupService to prevent recreation on every render
  const backupService = useMemo(() => new BackupService(db), []);

  const handleRefreshBackups = useCallback(async () => {
    if (!backupFolderUri || Platform.OS !== 'android') {
      log.debug('Clearing backups list - no folder URI or not Android');
      setBackups([]);
      return;
    }

    try {
      log.info('Loading backups from folder:', backupFolderUri);
      setRefreshingBackups(true);
      const backupList = await backupService.listBackups(backupFolderUri);
      setBackups(backupList);
      log.info(`Successfully loaded ${backupList.length} backup(s)`);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Failed to load backups:', errorMsg);
      showSnackbar({
        message: 'Failed to load backups. Please try again.',
        duration: 2000,
        type: 'error',
      });
      setBackups([]);
    } finally {
      setRefreshingBackups(false);
    }
  }, [backupFolderUri, backupService, showSnackbar]);

  const handleSelectBackupFolder = useCallback(async () => {
    if (Platform.OS !== 'android') {
      log.warn('Folder selection attempted on non-Android platform');
      showSnackbar({
        message: 'Folder selection is only available on Android',
        duration: 2000,
        type: 'error',
      });
      return null;
    }

    try {
      log.info('Requesting backup folder selection');
      const folderUri = await backupService.selectBackupFolder();

      if (folderUri) {
        updatesettings("backupFolderUri", folderUri);
        log.info('Backup folder selected and saved:', folderUri);
        await handleRefreshBackups();
        showSnackbar({
          message: 'Backup folder selected successfully',
          duration: 2000,
          type: 'success',
        });
      } else {
        log.warn('Backup folder selection returned null');
      }

      return folderUri;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Failed to select backup folder:', errorMsg);

      if (errorMsg !== 'Permission denied') {
        showSnackbar({
          message: 'Failed to select backup folder',
          duration: 2000,
          type: 'error',
        });
      }

      return null;
    }
  }, [backupService, handleRefreshBackups, showSnackbar, updatesettings]);

  const handleCreateBackup = useCallback(async (customName: string) => {
    if (!backupFolderUri || Platform.OS !== 'android') {
      log.error('Cannot create backup: No folder URI or not Android');
      showSnackbar({
        message: 'Please select a backup folder first',
        duration: 2000,
        type: 'error',
      });
      return;
    }

    try {
      setProcessing(true);
      log.info('Creating backup with custom name:', customName || 'auto-generated');

      const { fileName, backupData } = await getBackupData(customName);
      log.debug('Backup data prepared:', {
        fileName,
        expenses: backupData.db.expenses.length,
        incomes: backupData.db.incomes.length,
        categories: backupData.db.categories.length,
      });

      await backupService.createBackup({
        fileName,
        backupData,
        folderUri: backupFolderUri
      });

      await handleRefreshBackups();
      log.info('Backup created successfully:', fileName);

      showSnackbar({
        message: 'Backup created successfully!',
        duration: 2000,
        type: 'success',
      });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Failed to create backup:', errorMsg);

      showSnackbar({
        message: 'Failed to create backup. Please try again.',
        duration: 2000,
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  }, [backupFolderUri, backupService, getBackupData, handleRefreshBackups, showSnackbar]);

  const handleDeleteBackup = useCallback(async (backup: BackupMetadata) => {
    try {
      setProcessing(true);
      log.info('Deleting backup:', backup.fileName);

      await backupService.deleteBackup(backup.filePath);
      await handleRefreshBackups();

      log.info('Backup deleted successfully:', backup.fileName);
      showSnackbar({
        message: 'Backup deleted successfully',
        duration: 2000,
        type: 'success',
      });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Failed to delete backup:', errorMsg);

      showSnackbar({
        message: 'Failed to delete backup. Please try again.',
        duration: 2000,
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  }, [backupService, handleRefreshBackups, showSnackbar]);

  const handleShareBackup = useCallback(async (backup: BackupMetadata) => {
    try {
      setProcessing(true);
      log.info('Sharing backup:', backup.fileName);

      await backupService.shareBackup(backup.filePath, backup.fileName);

      log.info('Backup shared successfully:', backup.fileName);
      // showSnackbar({
      //   message: 'Backup shared successfully',
      //   duration: 2000,
      //   type: 'success',
      // });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Failed to share backup:', errorMsg);

      showSnackbar({
        message: 'Failed to share backup. Please try again.',
        duration: 2000,
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  }, [backupService, showSnackbar]);

  const handleRestoreBackup = useCallback(async (backup: BackupMetadata) => {
    try {
      setProcessing(true);
      log.info('Restoring backup:', backup.fileName);

      const backupData = await backupService.restoreBackup(backup.filePath);
      log.debug('Backup data loaded, starting restoration');

      await restoreBackupData(backupData);

      log.info('Backup restored successfully:', backup.fileName);
      showSnackbar({
        message: 'Backup restored successfully!',
        duration: 2000,
        type: 'success',
      });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      log.error('Failed to restore backup:', errorMsg);

      showSnackbar({
        message: errorMsg.includes('corrupted')
          ? 'Backup file is corrupted or invalid'
          : 'Failed to restore backup. Please try again.',
        duration: 3000,
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  }, [backupService, restoreBackupData, showSnackbar]);

  const handleImportBackup = useCallback(async () => {
    if (!backupFolderUri || Platform.OS !== 'android') {
      log.error('Cannot import backup: No folder URI or not Android');
      showSnackbar({
        message: 'Please select a backup folder first',
        duration: 2000,
        type: 'error',
      });
      return;
    }

    try {
      setProcessing(true);
      log.info('Importing backup from external source');

      await backupService.importBackup(backupFolderUri);
      await handleRefreshBackups();

      log.info('Backup imported successfully');
      showSnackbar({
        message: 'Backup imported successfully!',
        duration: 2000,
        type: 'success',
      });
    } catch (error) {
      const errorMsg = getErrorMessage(error);

      if (errorMsg === 'cancelled') {
        log.debug('Backup import cancelled by user');
        return;
      }

      log.error('Failed to import backup:', errorMsg);
      showSnackbar({
        message: errorMsg.includes('already exists')
          ? 'This backup already exists in your backup folder'
          : 'Failed to import backup. Please try again.',
        duration: 3000,
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  }, [backupFolderUri, backupService, handleRefreshBackups, showSnackbar]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      log.debug('Refreshing backup list');
      await handleRefreshBackups();
    } catch (error) {
      log.error('Failed to refresh backups:', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, [handleRefreshBackups]);

  useEffect(() => {
    handleRefreshBackups();
  }, [backupFolderUri, handleRefreshBackups]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    backupFolderUri,
    hasBackupFolder: Boolean(backupFolderUri),
    backups,
    processing,
    refreshing,
    refreshingBackups,
    handleRefresh,
    handleRefreshBackups,
    handleSelectBackupFolder,
    handleCreateBackup,
    handleDeleteBackup,
    handleShareBackup,
    handleRestoreBackup,
    handleImportBackup,
  }), [
    backupFolderUri,
    backups,
    processing,
    refreshing,
    refreshingBackups,
    handleRefresh,
    handleRefreshBackups,
    handleSelectBackupFolder,
    handleCreateBackup,
    handleDeleteBackup,
    handleShareBackup,
    handleRestoreBackup,
    handleImportBackup,
  ]);
}
