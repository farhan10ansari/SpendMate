import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { startCalendarQueryRefresh } from '@/lib/calendarQueryRefresh';

/** One root-level midnight timer; also reconcile dates after backgrounding. */
export default function useCalendarQueryRefresh() {
  const client = useQueryClient();
  useEffect(() => startCalendarQueryRefresh(client, {
    now: () => new Date(),
    timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    isActive: () => AppState.currentState === 'active',
    schedule: (callback, delay) => {
      const timer = setTimeout(callback, delay);
      return () => clearTimeout(timer);
    },
    subscribe: onChange => {
      const subscription = AppState.addEventListener('change', onChange);
      return () => subscription.remove();
    },
  }), [client]);
}

export function CalendarQueryRefresh() {
  useCalendarQueryRefresh();
  return null;
}
