import { useCallback, useMemo } from 'react';
import db from "@/db/client";
import { categoriesSchema, expensesSchema, incomesSchema } from '@/db/schema';
import { BackupData } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { log } from "@/lib/logger";
import { useQueryClient } from '@tanstack/react-query';
import { EMBAK_EXTENSION } from '@/features/backup-restore/constants';

export function useBackupData() {
    const queryClient = useQueryClient();

    const getBackupData = useCallback(async (customName: string): Promise<{ fileName: string; backupData: BackupData }> => {
        try {
            log.debug('Fetching backup data from database');

            const [expenses, incomes, categories] = await Promise.all([
                (await db.select().from(expensesSchema)).filter(expense => !expense.isTrashed),
                (await db.select().from(incomesSchema)).filter(income => !income.isTrashed),
                db.select().from(categoriesSchema),
            ]);

            log.debug('Data fetched from database:', {
                expenses: expenses.length,
                incomes: incomes.length,
                categories: categories.length,
            });

            const timestamp = new Date();
            const defaultName = customName?.trim() || `Backup_${timestamp.toISOString().split('T')[0]}`;
            const sanitizedName = defaultName.replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `${sanitizedName}_${timestamp.getTime()}${EMBAK_EXTENSION}`;

            const backupData: BackupData = {
                date: timestamp.toISOString(),
                name: sanitizedName,
                version: '1',
                db: {
                    expenses,
                    incomes,
                    categories,
                },
            };

            log.info('Backup data prepared successfully:', fileName);

            return {
                fileName,
                backupData
            };
        } catch (error) {
            const errorMsg = getErrorMessage(error);
            log.error('Failed to prepare backup data:', errorMsg);
            throw new Error(`Failed to prepare backup data: ${errorMsg}`);
        }
    }, []);

    const restoreBackupData = useCallback(async (backupData: BackupData): Promise<void> => {
        try {
            log.info('Starting backup restoration');
            log.debug('Backup data to restore:', {
                name: backupData.name,
                date: backupData.date,
                version: backupData.version,
                expenses: backupData.db.expenses.length,
                incomes: backupData.db.incomes.length,
                categories: backupData.db.categories.length,
            });

            await db.transaction(async (tx) => {
                log.debug('Clearing existing database tables');

                await tx.delete(expensesSchema);
                await tx.delete(incomesSchema);
                await tx.delete(categoriesSchema);

                log.debug('Existing data cleared successfully');

                // Restore expenses
                if (backupData.db.expenses.length > 0) {
                    log.debug(`Restoring ${backupData.db.expenses.length} expense(s)`);

                    const expensesToInsert = backupData.db.expenses.map(({ id, ...expense }) => ({
                        ...expense,
                        dateTime: new Date(expense.dateTime),
                        createdAt: new Date(expense.createdAt),
                        updatedAt: new Date(expense.updatedAt),
                    }));

                    const batchSize = 100;
                    const totalBatches = Math.ceil(expensesToInsert.length / batchSize);

                    for (let i = 0; i < expensesToInsert.length; i += batchSize) {
                        const batch = expensesToInsert.slice(i, i + batchSize);
                        await tx.insert(expensesSchema).values(batch);
                        log.debug(`Inserted expense batch ${Math.floor(i / batchSize) + 1}/${totalBatches}`);
                    }

                    log.debug('Expenses restored successfully');
                }

                // Restore incomes
                if (backupData.db.incomes.length > 0) {
                    log.debug(`Restoring ${backupData.db.incomes.length} income(s)`);

                    const incomesToInsert = backupData.db.incomes.map(({ id, ...income }) => ({
                        ...income,
                        dateTime: new Date(income.dateTime),
                        createdAt: new Date(income.createdAt),
                        updatedAt: new Date(income.updatedAt),
                    }));

                    const batchSize = 100;
                    const totalBatches = Math.ceil(incomesToInsert.length / batchSize);

                    for (let i = 0; i < incomesToInsert.length; i += batchSize) {
                        const batch = incomesToInsert.slice(i, i + batchSize);
                        await tx.insert(incomesSchema).values(batch);
                        log.debug(`Inserted income batch ${Math.floor(i / batchSize) + 1}/${totalBatches}`);
                    }

                    log.debug('Incomes restored successfully');
                }

                // Restore categories
                if (backupData.db.categories.length > 0) {
                    log.debug(`Restoring ${backupData.db.categories.length} categor(ies)`);

                    const categoriesToInsert = backupData.db.categories.map((category) => ({
                        ...category,
                        createdAt: new Date(category.createdAt),
                        updatedAt: new Date(category.updatedAt),
                    }));

                    const batchSize = 100;
                    const totalBatches = Math.ceil(categoriesToInsert.length / batchSize);

                    for (let i = 0; i < categoriesToInsert.length; i += batchSize) {
                        const batch = categoriesToInsert.slice(i, i + batchSize);
                        await tx.insert(categoriesSchema).values(batch);
                        log.debug(`Inserted category batch ${Math.floor(i / batchSize) + 1}/${totalBatches}`);
                    }

                    log.debug('Categories restored successfully');
                }
            });

            log.info('Backup restoration completed successfully');

        } catch (error) {
            const errorMsg = getErrorMessage(error);
            log.error('Backup restoration failed:', errorMsg);

            if (errorMsg.includes('JSON')) {
                throw new Error('Backup file is corrupted or invalid');
            }

            throw new Error(`Failed to restore backup: ${errorMsg}`);
        } finally {
            queryClient.invalidateQueries();
        }
    }, [queryClient]);

    // Memoize the return object to prevent unnecessary re-renders
    return useMemo(() => ({
        getBackupData,
        restoreBackupData
    }), [getBackupData, restoreBackupData]);
}
