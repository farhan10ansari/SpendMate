 import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/base/ThemedText";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import useSettings from "@/hooks/settings/useSettings";
import SettingSwitchListItem from "@/components/main/SettingSwitchListItem";
import SettingOptionListItem from "@/components/main/SettingOptionListItem";
import { LANGUAGE_OPTIONS } from "@/lib/constants";
import SettingButton from "@/components/main/SettingButton";
import SettingSecureLoginToggle from "@/components/main/SettingSecureLoginToggle";
import SettingSection from "@/components/main/SettingSection";
import { useNavigation, useRouter } from "expo-router";
import { uiLog as log } from "@/lib/logger";
import { useEffect } from "react";
import SettingDailyReminderSection from "@/components/main/SettingDailyReminderSection";

function SecureLoginSection() {
  return (
    <SettingSection icon="fingerprint" title="Secure Login"
      description="Use fingerprint, face recognition, or device passcode to secure your app login.">
      <SettingSecureLoginToggle />
    </SettingSection>
  );
}

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

const ComingSoonSection = () => {
  const { colors } = useAppTheme();

  const styles = StyleSheet.create({
    comingSoonBadge: {
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 24,
      alignSelf: "center",
      marginTop: 8,
    },
    comingSoonText: {
      color: colors.onPrimaryContainer,
      fontSize: 12,
      fontWeight: "600",
    },
  });

  return (
    <SettingSection
      icon="cog-outline"
      title="More Settings"
      description="Additional settings and customization options are being developed and will be available in future updates."
    >
      <View style={styles.comingSoonBadge}>
        <ThemedText style={styles.comingSoonText}>
          More options coming soon!
        </ThemedText>
      </View>
    </SettingSection>
  );
};

// Main Component
export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { haptics, handleHapticsToggle } =
    useSettings();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
  });

  useEffect(() => {
    navigation.setOptions({ headerTitle: "Settings" });
  }, [navigation]);

  return (
    <ScreenWrapper background="background" withScrollView>
      <View style={styles.container}>
        <HapticsSection
          haptics={haptics}
          handleHapticsToggle={handleHapticsToggle}
        />
        <SettingDailyReminderSection />
        <SecureLoginSection />
        <SettingSection
          icon="account-cog-outline"
          title="Show Onboarding"
          description="Revisit the onboarding screens to learn about the app features and setup."
        >
          <SettingButton
            title="Revisit Onboarding"
            onPress={() => {
              router.push("/onboarding");
              log.info("Navigating to Onboarding screens");
            }}
          />
        </SettingSection>
        <LanguageSection />
        <ComingSoonSection />
      </View>
    </ScreenWrapper>
  );
}
