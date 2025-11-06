import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
    Text,
    Button,
    Portal,
    Dialog,
    List,
    Surface,
    IconButton,
    ProgressBar,
    Icon
} from 'react-native-paper';
import RNRestart from "react-native-restart-newarch";
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { removeAllNotificationSchedules, resetDatabase } from '@/lib/reset';
import { useSnackbar } from '@/contexts/GlobalSnackbarProvider';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { useQueryClient } from '@tanstack/react-query';
import { useHaptics } from '@/contexts/HapticsProvider';
import { ThemeType } from '@/themes/theme';
import { ScreenWrapper } from '@/components/main/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function ResetAppScreen() {
    const queryClient = useQueryClient()
    const { colors } = useAppTheme();
    const { hapticNotify } = useHaptics();
    const [dialogVisible, setDialogVisible] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isResetting, setIsResetting] = useState(false);
    const { showSnackbar } = useSnackbar();
    const resetPersistentStore = usePersistentAppStore((state) => state.resetPersistentStore);
    const styles = createStyles(colors);
    const insets = useSafeAreaInsets();


    useEffect(() => {
        let timer: number;


        if (dialogVisible && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000) as unknown as number;
        }


        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [dialogVisible, countdown]);


    const showDialog = () => {
        hapticNotify('warning');
        setCountdown(10);
        setDialogVisible(true);
    };


    const hideDialog = () => {
        setDialogVisible(false);
        setCountdown(10);
    };


    const handleReset = async () => {
        setIsResetting(true);


        try {
            // Reset database (delete all rows)
            await resetDatabase();


            // Reset Zustand store to default values
            resetPersistentStore();


            // Remove all scheduled notifications
            await removeAllNotificationSchedules()


            // Invalidate all React Query caches
            queryClient.invalidateQueries();


            // Haptic feedback for success
            hapticNotify('success');


            // Restart the app to apply changes
            RNRestart.restart();
        } catch (error) {
            console.error('Reset error:', error);
            showSnackbar({
                message: 'Failed to reset app data. Please try clearing the app data.',
                duration: 5000,
                type: 'error',
            });
        } finally {
            setIsResetting(false);
        }
    };


    const progressValue = (10 - countdown) / 10;


    return (
        <ScreenWrapper
            background="background"
            withScrollView
            contentContainerStyle={[styles.scrollContent,{ paddingBottom: insets.bottom + 16 }]}
        >
            {/* Header Section */}
            <Surface style={styles.headerSurface} elevation={2}>
                <View style={styles.iconContainer}>
                    <IconButton
                        icon="alert-circle-outline"
                        size={64}
                        iconColor={colors.error}
                    />
                </View>
                <Text variant="headlineMedium" style={styles.title}>
                    Reset App Data
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    This action will permanently delete all your data
                </Text>
            </Surface>


            {/* Warning Section */}
            <Surface style={styles.warningSurface} elevation={0}>
                <View style={styles.warningHeader}>
                    <View style={styles.warningIconCircle}>
                        <Icon size={24} source="alert" color={colors.error} />
                    </View>
                    <View style={styles.warningHeaderText}>
                        <Text variant="titleMedium" style={styles.warningTitle}>
                            What will be deleted
                        </Text>
                        <Text variant="bodySmall" style={styles.warningSubtitle}>
                            This action cannot be undone
                        </Text>
                    </View>
                </View>

                <View style={styles.warningList}>
                    <View style={styles.warningItem}>
                        <View style={styles.warningItemIcon}>
                            <Icon size={18} source="database-remove" color={colors.error} />
                        </View>
                        <View style={styles.warningItemContent}>
                            <Text variant="bodyMedium" style={styles.warningItemTitle}>
                                All expense records
                            </Text>
                            <Text variant="bodySmall" style={styles.warningItemDescription}>
                                Your complete transaction history
                            </Text>
                        </View>
                    </View>

                    <View style={styles.warningItem}>
                        <View style={styles.warningItemIcon}>
                            <Icon size={18} source="cash-remove" color={colors.error} />
                        </View>
                        <View style={styles.warningItemContent}>
                            <Text variant="bodyMedium" style={styles.warningItemTitle}>
                                All income records
                            </Text>
                            <Text variant="bodySmall" style={styles.warningItemDescription}>
                                Your complete income history
                            </Text>
                        </View>
                    </View>

                    <View style={styles.warningItem}>
                        <View style={styles.warningItemIcon}>
                            <Icon size={18} source="tag-remove" color={colors.error} />
                        </View>
                        <View style={styles.warningItemContent}>
                            <Text variant="bodyMedium" style={styles.warningItemTitle}>
                                All categories
                            </Text>
                            <Text variant="bodySmall" style={styles.warningItemDescription}>
                                Custom and default categories
                            </Text>
                        </View>
                    </View>

                    <View style={styles.warningItem}>
                        <View style={styles.warningItemIcon}>
                            <Icon size={18} source="cog-off" color={colors.error} />
                        </View>
                        <View style={styles.warningItemContent}>
                            <Text variant="bodyMedium" style={styles.warningItemTitle}>
                                App settings
                            </Text>
                            <Text variant="bodySmall" style={styles.warningItemDescription}>
                                All preferences and configurations
                            </Text>
                        </View>
                    </View>
                </View>
            </Surface>


            {/* Info Section */}
            <Surface style={styles.infoSurface} elevation={1}>
                <List.Item
                    title="Cannot be undone"
                    description="This action is permanent and cannot be reversed"
                    titleStyle={styles.infoTitle}
                    descriptionStyle={styles.infoDescription}
                    left={props => <List.Icon {...props} icon="information" color={colors.primary} />}
                />
            </Surface>


            {/* Reset Button */}
            <Button
                mode="contained"
                onPress={showDialog}
                style={styles.resetButton}
                buttonColor={colors.error}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                icon="restart"
            >
                Reset All Data
            </Button>


            <Text variant="bodySmall" style={styles.footerText}>
                Make sure you have backed up any important data before proceeding
            </Text>
            {/* </ScrollView> */}


            {/* Confirmation Dialog */}
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={hideDialog} style={styles.dialog}>
                    <Dialog.Icon icon="alert-circle" color={colors.error} size={48} />


                    <Dialog.Title style={styles.dialogTitle}>
                        Confirm Reset
                    </Dialog.Title>


                    <Dialog.Content>
                        <Text variant="bodyMedium" style={styles.dialogText}>
                            Are you absolutely sure you want to reset all app data?
                        </Text>


                        <Text variant="bodyMedium" style={[styles.dialogText, { marginTop: 12 }]}>
                            This action is <Text style={styles.boldText}>permanent</Text> and{' '}
                            <Text style={styles.boldText}>cannot be undone</Text>.
                        </Text>


                        {countdown > 0 && (
                            <View style={styles.countdownContainer}>
                                <Text variant="titleLarge" style={styles.countdownText}>
                                    {countdown}
                                </Text>
                                <ProgressBar
                                    progress={progressValue}
                                    color={colors.error}
                                    style={styles.progressBar}
                                />
                                <Text variant="bodySmall" style={styles.countdownLabel}>
                                    Please wait {countdown} second{countdown !== 1 ? 's' : ''} to continue
                                </Text>
                            </View>
                        )}
                    </Dialog.Content>


                    <Dialog.Actions>
                        <Button
                            onPress={hideDialog}
                            textColor={colors.onSurface}
                            disabled={isResetting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onPress={handleReset}
                            textColor={colors.error}
                            disabled={countdown > 0 || isResetting}
                            loading={isResetting}
                        >
                            {isResetting ? 'Resetting...' : 'Confirm Reset'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScreenWrapper>
    );
}


const createStyles = (colors: ThemeType["colors"]) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: 16,
    },
    headerSurface: {
        padding: 24,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: colors.surface,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 8,
    },
    title: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: colors.onSurface,
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        color: colors.onSurfaceVariant,
    },
    warningSurface: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.error + '20',
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    warningIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.errorContainer,
        alignItems: 'center',
        justifyContent: 'center',
    },
    warningHeaderText: {
        flex: 1,
    },
    warningTitle: {
        fontWeight: '600',
        color: colors.onSurface,
        marginBottom: 4,
    },
    warningSubtitle: {
        color: colors.error,
        fontWeight: '500',
    },
    warningList: {
        gap: 20,
    },
    warningItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    warningItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: colors.errorContainer,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    warningItemContent: {
        flex: 1,
    },
    warningItemTitle: {
        color: colors.onSurface,
        fontWeight: '500',
        marginBottom: 4,
    },
    warningItemDescription: {
        color: colors.onSurfaceVariant,
        lineHeight: 18,
    },
    infoSurface: {
        borderRadius: 12,
        marginBottom: 24,
        backgroundColor: colors.primaryContainer,
    },
    infoTitle: {
        fontWeight: '600',
        color: colors.onPrimaryContainer,
    },
    infoDescription: {
        color: colors.onPrimaryContainer,
    },
    resetButton: {
        marginBottom: 16,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        textAlign: 'center',
        color: colors.onSurfaceVariant,
        fontStyle: 'italic',
    },
    dialog: {
        backgroundColor: colors.surface,
    },
    dialogTitle: {
        textAlign: 'center',
        color: colors.error,
    },
    dialogText: {
        textAlign: 'center',
        color: colors.onSurface,
    },
    boldText: {
        fontWeight: 'bold',
        color: colors.error,
    },
    countdownContainer: {
        marginTop: 24,
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.errorContainer,
        borderRadius: 12,
    },
    countdownText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: colors.error,
        padding: 8
    },
    progressBar: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    countdownLabel: {
        color: colors.onErrorContainer,
        textAlign: 'center',
    },
});
