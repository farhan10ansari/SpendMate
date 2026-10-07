import { StatsPeriod } from "@/lib/types";
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subWeeks,
    subMonths,
    subYears,
    differenceInCalendarDays,
    parseISO
} from 'date-fns';

/**
 * Get the starting and ending dates for a given period with offset support.
 * Returns both start and end dates for the specified period.
 */
export function getPeriodStartEnd(period: StatsPeriod, now = new Date()): { start: Date | null; end: Date | null } {
    const offset = period.offset || 0;

    switch (period.type) {
        case "today": {
            // Today ignores offset - always current day
            const start = startOfDay(now);
            const end = endOfDay(now);
            return { start, end };
        }

        case "week": {
            // Calculate the target week by subtracting offset weeks
            const targetDate = subWeeks(now, offset);
            const start = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday start
            const end = endOfWeek(targetDate, { weekStartsOn: 1 });
            return { start, end };
        }

        case "month": {
            // Calculate the target month by subtracting offset months
            const targetDate = period.calendarKey ? parseISO(`${period.calendarKey}-01`) : subMonths(now, offset);
            const start = startOfMonth(targetDate);
            const end = endOfMonth(targetDate);
            return { start, end };
        }

        case "year": {
            // Calculate the target year by subtracting offset years
            const targetDate = period.calendarKey ? parseISO(`${period.calendarKey}-01-01`) : subYears(now, offset);
            const start = startOfYear(targetDate);
            const end = endOfYear(targetDate);
            return { start, end };
        }

        case "all-time": {
            // Return null dates to indicate no date filtering needed
            return { start: null, end: null };
        }

        default:
            throw new Error(`Unsupported period type: ${period.type}`);
    }
}

/** Match fixed calendar selections with equivalent legacy/relative options. */
export function areStatsPeriodsEqual(a: StatsPeriod, b: StatsPeriod, now = new Date()): boolean {
    if (a.type !== b.type) return false;
    const rangeA = getPeriodStartEnd(a, now);
    const rangeB = getPeriodStartEnd(b, now);
    return rangeA.start?.getTime() === rangeB.start?.getTime()
        && rangeA.end?.getTime() === rangeB.end?.getTime();
}

/** Count inclusive local calendar days, independent of times and DST changes. */
export function getAverageDayCount(
    period: StatsPeriod,
    start: Date | null | undefined,
    end: Date | null | undefined,
    now = new Date(),
): number {
    if (!start || !end) return 0;
    const isCurrentPeriod =
        (period.type === 'week' || period.type === 'month' || period.type === 'year')
        && start.getTime() <= now.getTime()
        && end.getTime() >= now.getTime();
    const averageEnd = isCurrentPeriod ? now : end;
    return Math.max(0, differenceInCalendarDays(averageEnd, start) + 1);
}
