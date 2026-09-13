import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import { BackupListCard } from "@/features/backup-restore/components/BackupListCard";
import { BackupLocationCard } from "@/features/backup-restore/components/BackupLocationCard";
import { CreateBackupCard } from "@/features/backup-restore/components/CreateBackupCard";
import { InfoCard } from "@/features/backup-restore/components/InfoCard";
import { useBackupManager } from "@/features/backup-restore/useBackupManager";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Banner, Icon } from "react-native-paper";
import { ThemedText } from '@/components/base/ThemedText';
import Color from 'color';
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
        showsVerticalScrollIndicator={false}
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
        <View style={[styles.overview, { backgroundColor: Color(colors.surface).mix(Color(colors.primary), 0.12).hex() }]}>
          <View style={[styles.overviewIcon, { backgroundColor: colors.surface }]}><Icon source="backup-restore" size={24} color={colors.primary} /></View>
          <View style={styles.overviewText}>
            <ThemedText style={styles.title}>Your data, backed up</ThemedText>
            <ThemedText style={styles.caption} color={colors.muted}>Create a copy today. Restore it when you need it.</ThemedText>
          </View>
        </View>
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
    padding: 16,
    gap: 14,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  overview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24 },
  overviewIcon: { padding: 11, borderRadius: 16 },
  overviewText: { flex: 1 },
  title: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 18, marginTop: 3 },
});
