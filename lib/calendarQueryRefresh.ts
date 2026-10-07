import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { StatsPeriod } from './types';
import { getAverageDayCount, getPeriodStartEnd } from '@/repositories/lib/helpers';

/** Only invalidate queries whose date range or average denominator changed. */
export function hasCalendarQueryChanged(key: QueryKey, before: Date, after: Date, timezoneChanged = false): boolean {
  const isStats = key[0] === 'stats' && key[2] === 'stats-in-a-period';
  const isActivity = (key[0] === 'expenses' || key[0] === 'incomes') && key[1] === 'recent-activity';
  if (!isStats && !isActivity) return false;
  const period = key[isStats ? 3 : 2] as StatsPeriod | undefined;
  if (!period) return false;
  // All Time has no range filter, but its inclusive calendar-day average can
  // change when transaction timestamps map to different local dates.
  if (period.type === 'all-time') return timezoneChanged && isStats;
  if (timezoneChanged) return true;
  const oldRange = getPeriodStartEnd(period, before);
  const newRange = getPeriodStartEnd(period, after);
  return oldRange.start?.getTime() !== newRange.start?.getTime()
    || oldRange.end?.getTime() !== newRange.end?.getTime()
    || (isStats && getAverageDayCount(period, oldRange.start, oldRange.end, before)
      !== getAverageDayCount(period, newRange.start, newRange.end, after));
}

export function refreshCalendarQueries(client: QueryClient, before: Date, after: Date, timezoneChanged = false) {
  return client.invalidateQueries({ predicate: query => hasCalendarQueryChanged(query.queryKey, before, after, timezoneChanged) });
}

export function millisecondsUntilNextDay(now: Date): number {
  // Construct local midnight, rather than adding 24 hours (DST days vary).
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
}

type CalendarRefreshEnvironment = {
  now: () => Date;
  timezone: () => string;
  isActive: () => boolean;
  schedule: (callback: () => void, delay: number) => () => void;
  subscribe: (onChange: () => void) => () => void;
};

/** Adapter-based lifecycle so foreground/resume/timer behavior can be tested. */
export function startCalendarQueryRefresh(client: QueryClient, environment: CalendarRefreshEnvironment) {
  let previous = environment.now();
  let previousTimezone = environment.timezone();
  let cancelTimer: (() => void) | undefined;
  const checkAndSchedule = () => {
    cancelTimer?.();
    cancelTimer = undefined;
    if (!environment.isActive()) return;
    const now = environment.now();
    const timezone = environment.timezone();
    void refreshCalendarQueries(client, previous, now, timezone !== previousTimezone);
    previous = now;
    previousTimezone = timezone;
    cancelTimer = environment.schedule(checkAndSchedule, millisecondsUntilNextDay(now) + 50);
  };
  checkAndSchedule();
  const unsubscribe = environment.subscribe(checkAndSchedule);
  return () => {
    cancelTimer?.();
    unsubscribe();
  };
}
