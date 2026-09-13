import { StyleSheet, View } from "react-native";
import { Icon, TouchableRipple } from 'react-native-paper';
import { ThemedText } from "@/components/base/ThemedText";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import useSettings from "@/hooks/settings/useSettings";
import SettingSwitchListItem from "@/components/main/SettingSwitchListItem";
import SettingOptionListItem from "@/components/main/SettingOptionListItem";
import { LANGUAGE_OPTIONS } from "@/lib/constants";
import SettingSecureLoginToggle from "@/components/main/SettingSecureLoginToggle";
import SettingSection from "@/components/main/SettingSection";
import { useNavigation, useRouter } from "expo-router";
import { uiLog as log } from "@/lib/logger";
import { useEffect } from "react";
import SettingDailyReminderSection from "@/components/main/SettingDailyReminderSection";

const LanguageSection = () => {
  const { colors } = useAppTheme();

  return (
    <SettingSection
      icon="translate"
      title="Language"
      description="Select your preferred language for the app interface. More languages will be added in future updates."
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <SettingOptionListItem
          key={option.key}
          option={option}
          isSelected={"english" === option.key}
          // onPress={() => option.available && handleLanguageChange(option.key)}
          colors={colors}
        />
      ))}
    </SettingSection>
  );
};

interface HapticsSectionProps {
  haptics: any;
  handleHapticsToggle: (enabled: boolean) => void;
}

export const HapticsSection = ({
  haptics,
  handleHapticsToggle,
}: HapticsSectionProps) => {
  return (
    <SettingSection
      icon="vibrate"
      title="Haptic Feedback"
      description="Control vibration feedback when interacting with the app."
    >
      <SettingSwitchListItem
        title="Enable Haptic Feedback"
        description="Feel vibrations when using the app"
        value={haptics.enabled}
        onValueChange={handleHapticsToggle}
        leftIcon={haptics.enabled ? "vibrate" : "vibrate-off"}
      />
    </SettingSection>
  );
};

// Main Component
export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const { haptics, handleHapticsToggle } =
    useSettings();

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      width: '100%',
      maxWidth: 720,
      alignSelf: 'center',
      gap: 12,
    },
    groupHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    groupTitle: { fontSize: 12, fontWeight: '700', color: colors.muted },
    line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
    controls: { padding: 10, paddingBottom: 2, borderRadius: 22, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    actionCard: { borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    iconBadge: { padding: 10, borderRadius: 14, backgroundColor: colors.surfaceVariant },
    actionText: { flex: 1 },
    actionTitle: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
    caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  });

  useEffect(() => {
    navigation.setOptions({ headerTitle: "Settings" });
  }, [navigation]);

  return (
    <ScreenWrapper background="background" withScrollView>
      <View style={styles.container}>
        <View style={styles.groupHeading}>
          <ThemedText style={styles.groupTitle}>EVERYDAY EXPERIENCE</ThemedText><View style={styles.line} />
        </View>
        <View style={styles.controls}>
          <SettingSwitchListItem title="Haptic feedback" description="A little feedback with every tap"
            value={haptics.enabled} onValueChange={handleHapticsToggle}
            leftIcon={haptics.enabled ? 'vibrate' : 'vibrate-off'} />
        </View>
        <SettingDailyReminderSection />
        <View style={styles.groupHeading}>
          <ThemedText style={styles.groupTitle}>PRIVACY & SECURITY</ThemedText><View style={styles.line} />
        </View>
        <View style={styles.controls}><SettingSecureLoginToggle /></View>
        <View style={styles.groupHeading}>
          <ThemedText style={styles.groupTitle}>LANGUAGE & GUIDANCE</ThemedText><View style={styles.line} />
        </View>
        <LanguageSection />
        <View style={styles.actionCard}>
          <TouchableRipple accessibilityRole="button" accessibilityLabel="Revisit onboarding" onPress={() => {
              router.push("/onboarding");
              log.info("Navigating to Onboarding screens");
            }}>
            <View style={styles.action}>
              <View style={styles.iconBadge}><Icon source="compass-outline" size={22} color={colors.primary} /></View>
              <View style={styles.actionText}>
                <ThemedText style={styles.actionTitle}>Take a quick tour</ThemedText>
                <ThemedText style={styles.caption}>Revisit SpendMate’s features and setup</ThemedText>
              </View>
              <Icon source="chevron-right" size={20} color={colors.muted} />
            </View>
          </TouchableRipple>
        </View>
        <ThemedText style={styles.caption} centered>More personalization options are on the way.</ThemedText>
      </View>
    </ScreenWrapper>
  );
}
