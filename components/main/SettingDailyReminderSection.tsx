import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ToastAndroid,
} from "react-native";
import * as Notifications from "expo-notifications";
import usePersistentAppStore from "@/stores/usePersistentAppStore";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useCallback, useEffect, useRef, useState } from "react";
import SettingSection from "@/components/main/SettingSection";
import { ThemedText } from "@/components/base/ThemedText";
import { useLocalization } from "@/hooks/useLocalization";
import { useHaptics } from "@/contexts/HapticsProvider";
import { TimePickerModal } from "react-native-paper-dates";
import SettingSwitchListItem from "@/components/main/SettingSwitchListItem";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ANDROID_CHANNEL_ID = "daily-reminder-channel";

async function createAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Daily Reminder",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
    });
  }
}

function showToast(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

function DailyReminderSection() {
  const { colors } = useAppTheme();
  const dailyReminderNotificationId = usePersistentAppStore(
    (state) => state.settings.dailyReminderNotificationId,
  );
  const dailyReminderTime = usePersistentAppStore(
    (state) => state.settings.dailyReminderTime,
  );
  const updateSettings = usePersistentAppStore((state) => state.updateSettings);
  const { uses24HourClock } = useLocalization();
  const { hapticImpact } = useHaptics();

  const [showPicker, setShowPicker] = useState(false);
  const [time, setTime] = useState<Date>(() => {
    if (dailyReminderTime) {
      const date = new Date();
      date.setHours(dailyReminderTime.hour, dailyReminderTime.minute, 0, 0);
      return date;
    }
    return new Date();
  });

  const schedulingRef = useRef(false);

  useEffect(() => {
    createAndroidChannel();
  }, []);

  // Sync time if dailyReminderTime changes externally
  useEffect(() => {
    if (dailyReminderTime) {
      const newDate = new Date();
      newDate.setHours(dailyReminderTime.hour, dailyReminderTime.minute, 0, 0);
      setTime(newDate);
    }
  }, [dailyReminderTime]);

  async function ensurePermissions(): Promise<boolean> {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: requestStatus } =
        await Notifications.requestPermissionsAsync();
      status = requestStatus;
    }
    if (status !== "granted") {
      showToast("Notification permission is required for daily reminders.");
      return false;
    }
    return true;
  }

  const scheduleNotificationAt = useCallback(
    async function scheduleNotificationAt(date: Date) {
      // Cancel any previous notification
      if (dailyReminderNotificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(
            dailyReminderNotificationId,
          );
        } catch (error) {
          console.warn("Error cancelling existing notification:", error);
        }
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "This is your daily reminder! 📬",
          body: "Don't forget to log your expenses!",
          priority: Notifications.AndroidNotificationPriority.MAX,
          interruptionLevel: "timeSensitive",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: ANDROID_CHANNEL_ID,
          hour: date.getHours(),
          minute: date.getMinutes(),
        },
      });

      return notificationId;
    },
    [dailyReminderNotificationId],
  );

  const cancelDailyReminder = useCallback(async () => {
    if (!dailyReminderNotificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(
        dailyReminderNotificationId,
      );
      await Notifications.cancelAllScheduledNotificationsAsync();
      updateSettings("dailyReminderNotificationId", null);
      // updateSettings('dailyReminderTime', null);
      showToast("Daily reminder cancelled.");
    } catch (error) {
      console.error("Failed to cancel notification:", error);
      showToast("Failed to cancel daily reminder.");
    }
  }, [dailyReminderNotificationId, updateSettings]);

  const setDailyReminder = useCallback(
    async (selectedTime: Date) => {
      if (schedulingRef.current) return;
      schedulingRef.current = true;

      try {
        const permissionGranted = await ensurePermissions();
        if (!permissionGranted) return;

        const notificationId = await scheduleNotificationAt(selectedTime);
        updateSettings("dailyReminderNotificationId", notificationId);
        updateSettings("dailyReminderTime", {
          hour: selectedTime.getHours(),
          minute: selectedTime.getMinutes(),
        });

        setTime(selectedTime);
        showToast("Daily reminder set!");
      } catch (error) {
        console.error("Error scheduling notification:", error);
        showToast("Failed to schedule daily reminder.");
      } finally {
        schedulingRef.current = false;
      }
    },
    [updateSettings, scheduleNotificationAt],
  );

  const onConfirmTime = useCallback(
    async (params: { hours: number; minutes: number }) => {
      const newDate = new Date();
      newDate.setHours(params.hours, params.minutes, 0, 0);
      setShowPicker(false);
      hapticImpact();

      await cancelDailyReminder();
      await setDailyReminder(newDate);
    },
    [hapticImpact, setDailyReminder, cancelDailyReminder],
  );

  const onDismissTime = useCallback(() => setShowPicker(false), []);

  const handleDailyReminderToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        await setDailyReminder(time);
      } else {
        await cancelDailyReminder();
      }
    },
    [setDailyReminder, cancelDailyReminder, time],
  );

  // Time display respects localization and 24-hour clock preferences
  const formattedTime = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !uses24HourClock,
  });

  return (
    <SettingSection
      icon="bell-outline"
      title="Daily Reminder"
      description="Choose a time to receive daily reminders to add your expenses."
    >
      <View style={styles.timeButtonRow}>
        <View>
          <ThemedText style={[styles.timeLabel, { color: colors.primary }]}>
            Reminder time
          </ThemedText>
          <ThemedText style={[styles.timeDisplay, { color: colors.primary }]}>
            {formattedTime}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityLabel="Change reminder time"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="clock-outline"
            size={24}
            color={colors.background}
          />
        </Pressable>
      </View>

      <TimePickerModal
        locale="en"
        visible={showPicker}
        onConfirm={onConfirmTime}
        onDismiss={onDismissTime}
        hours={time.getHours()}
        minutes={time.getMinutes()}
        animationType="slide"
        use24HourClock={uses24HourClock}
        label="Select time"
      />

      <View style={styles.switchRow}>
        <SettingSwitchListItem
          title="Enable Daily Reminder"
          description="Receive daily reminders to add your expenses"
          value={dailyReminderNotificationId !== null}
          onValueChange={handleDailyReminderToggle}
          leftIcon={dailyReminderNotificationId !== null ? "bell" : "bell-off"}
        />
      </View>
    </SettingSection>
  );
}

export default DailyReminderSection;

const styles = StyleSheet.create({
  timeButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
    marginBottom: 2,
  },
  timeDisplay: {
    fontSize: 18,
    fontWeight: "700",
  },
  iconButton: {
    padding: 10,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
    minHeight: 44,
    elevation: 2,
  },
  switchRow: {
    marginTop: 16,
    alignItems: "center",
  },
});
