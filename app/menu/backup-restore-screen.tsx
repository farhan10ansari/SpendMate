import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import { BackupListCard } from "@/features/backup-restore/components/BackupListCard";
import { BackupLocationCard } from "@/features/backup-restore/components/BackupLocationCard";
import { CreateBackupCard } from "@/features/backup-restore/components/CreateBackupCard";
import { InfoCard } from "@/features/backup-restore/components/InfoCard";
import { useBackupManager } from "@/features/backup-restore/useBackupManager";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Banner } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BackupRestoreScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const {
    backupFolderUri,
    hasBackupFolder,
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
    backups
  } = useBackupManager();

  const [showFolderBanner, setShowFolderBanner] = useState(true);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  return (
    <ScreenWrapper
      background="background"
    >
      <Banner
        visible={showFolderBanner && !backupFolderUri}
        actions={[
          { label: 'Dismiss', onPress: () => setShowFolderBanner(false) },
          { label: 'Select Folder', onPress: handleSelectBackupFolder },
        ]}
        icon="folder-alert"
      >
        Select a backup folder to get started. This allows you to choose where your
        backups are stored.
      </Banner>

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 12 }
        ]}
        refreshControl={
          hasBackupFolder ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressBackgroundColor={
                colors.background
              }
            />
          ) : undefined
        }
      >

        {/* Backup Location */}
        <BackupLocationCard
          backupFolderUri={backupFolderUri}
          onSelectFolder={handleSelectBackupFolder}
          disabled={processing}
        />

        {/* Create Backup */}
        <CreateBackupCard
          onCreateBackup={handleCreateBackup}
          onImportBackup={handleImportBackup}
          disabled={processing}
          hasBackupFolder={hasBackupFolder}
        />

        {/* Backup List */}
        <BackupListCard
          backups={backups}
          hasBackupFolder={hasBackupFolder}
          menuVisible={menuVisible}
          onMenuToggle={setMenuVisible}
          onRefresh={handleRefreshBackups}
          onSelectFolder={handleSelectBackupFolder}
          onRestore={handleRestoreBackup}
          onShare={handleShareBackup}
          onDelete={handleDeleteBackup}
          refreshing={refreshingBackups}
        />

        {/* Info Card */}
        <InfoCard />
      </ScrollView>
    </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
  contentContainer: {
    padding: 12,
    gap: 12
  }
});