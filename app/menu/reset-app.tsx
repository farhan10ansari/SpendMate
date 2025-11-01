import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
    Text,
    Button,
    Portal,
    Dialog,
    Divider,
    List,
    Surface,
    IconButton,
    ProgressBar
} from 'react-native-paper';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import * as Updates from 'expo-updates';
import { removeAllNotificationSchedules, resetDatabase } from '@/lib/reset';
import { useSnackbar } from '@/contexts/GlobalSnackbarProvider';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

export default function ResetScreen() {
    const queryClient = useQueryClient()
    const { colors } = useAppTheme();
    const [dialogVisible, setDialogVisible] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isResetting, setIsResetting] = useState(false);
    const { showSnackbar } = useSnackbar();
    const resetPersistentStore = usePersistentAppStore((state) => state.resetPersistentStore);
    const router = useRouter();
    const styles = createStyles(colors);

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
            // Step 1: Reset database (delete all rows)
            await resetDatabase();

            // Step 2: Reset Zustand store to default values
            resetPersistentStore()

            // Step 3: Remove all scheduled notifications
            await removeAllNotificationSchedules()

            // Step 4: Invalidate all React Query caches
            queryClient.invalidateQueries();
            queryClient.clear();

            hideDialog();

            // showSnackbar({
            //     message: 'App data has been reset successfully.',
            //     duration: 5000,
            //     type: 'success',
            // });
            // Full app reload
            await Updates.reloadAsync();
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
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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
                <Surface style={styles.warningSurface} elevation={1}>
                    <Text variant="titleMedium" style={styles.warningTitle}>
                        ⚠️ Warning
                    </Text>
                    <Text variant="bodyMedium" style={styles.warningText}>
                        This will permanently delete:
                    </Text>

                    <List.Item
                        title="All expense records"
                        titleStyle={styles.listItemTitle}
                        left={props => <List.Icon {...props} icon="delete-forever" color={colors.error} />}
                        style={styles.listItem}
                    />
                    <Divider />
                    <List.Item
                        title="All income records"
                        titleStyle={styles.listItemTitle}
                        left={props => <List.Icon {...props} icon="delete-forever" color={colors.error} />}
                        style={styles.listItem}
                    />
                    <Divider />
                    <List.Item
                        title="All categories"
                        titleStyle={styles.listItemTitle}
                        left={props => <List.Icon {...props} icon="delete-forever" color={colors.error} />}
                        style={styles.listItem}
                    />
                    <Divider />
                    <List.Item
                        title="App settings and preferences"
                        titleStyle={styles.listItemTitle}
                        left={props => <List.Icon {...props} icon="delete-forever" color={colors.error} />}
                        style={styles.listItem}
                    />
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
            </ScrollView>

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
                            loading={isResetting}
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
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
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
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: colors.errorContainer,
    },
    warningTitle: {
        fontWeight: 'bold',
        color: colors.onErrorContainer,
        marginBottom: 8,
    },
    warningText: {
        color: colors.onErrorContainer,
        marginBottom: 12,
    },
    listItem: {
        paddingVertical: 4,
    },
    listItemTitle: {
        color: colors.onErrorContainer,
        fontSize: 14,
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
