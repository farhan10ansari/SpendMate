import db from "@/db/client";
import { categoriesSchema, expensesSchema, incomesSchema } from "@/db/schema";
import * as Notifications from "expo-notifications";


/**
 * Deletes all rows from all tables in the database
 * @returns Promise<void>
 */
export async function resetDatabase(): Promise<void> {
    try {
        // Delete all rows from each table
        // Order matters if you have foreign key constraints
        await db.delete(expensesSchema);
        await db.delete(incomesSchema);
        await db.delete(categoriesSchema);

        console.log('✅ Database reset successfully - all rows deleted');
    } catch (error) {
        console.error('❌ Database reset failed:', error);
        throw new Error('Failed to reset database');
    }
}


export async function removeAllNotificationSchedules(): Promise<void> {
    try {
        // Assuming you have a Notifications module to handle this
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('✅ All notification schedules removed successfully');
    } catch (error) {
        console.error('❌ Failed to remove notification schedules:', error);
        throw new Error('Failed to remove notification schedules');
    }
}