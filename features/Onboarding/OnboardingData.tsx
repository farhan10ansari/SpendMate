import LottieView from 'lottie-react-native';
import { Icon } from 'react-native-paper';
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useMemo } from "react";
import ThemeSelector from '@/components/main/ThemeSelector';
import useSettings from '@/hooks/settings/useSettings';
import SettingSwitchListItem from '@/components/main/SettingSwitchListItem';
import SettingSecureLoginToggle from '@/components/main/SettingSecureLoginToggle';
import OnboardingCurrencyStep from './OnboardingCurrencyStep';

export interface OnboardingStep {
  id: string;
  type: 'intro' | 'setting';
  title: string;
  description: string;
  settingKey?: keyof Settings;
  options?: { label: string; value: string | boolean }[];
  icon?: React.ReactNode | string;
  lottie?: React.ReactNode;
  component?: React.ReactNode;
}

export interface Settings {
  theme: string;
  language: string;
  currency: string;
  secureLogin: boolean;
  haptics: boolean;
}

export const useOnboardingData = () => {
  const { colors } = useAppTheme();
  const {
    haptics,
    handleHapticsToggle,
  } = useSettings();

  const iconSize = 52;

  return useMemo<OnboardingStep[]>(() => ([
    {
      id: '1',
      type: 'intro',
      title: `Welcome to SpendMate`,
      description: 'A little clarity for your everyday money. Track what comes in, what goes out, and what stays with you.',
      lottie: <LottieView source={require('../../assets/lottie/onboarding.json')} autoPlay loop style={{ height: "100%", width: "100%" }} />
    },
    {
      id: '2',
      type: 'intro',
      title: 'Track Every Transaction',
      description: 'From your morning coffee to payday, keep your expenses and income together in one simple place.',
      icon: <Icon source="chart-bar" size={iconSize} color={colors.primary} />
    },
    {
      id: '3',
      type: 'intro',
      title: 'Smart Insights',
      description: 'Turn everyday entries into a clearer picture of your money. Choose a period and explore your progress.',
      icon: <Icon source="lightbulb-on-outline" size={iconSize} color={colors.primary} />
    },
    {
      id: '4',
      type: 'setting',
      title: 'Choose Your Theme',
      description: 'Light, dark, or in sync with your device. Choose the look that feels right.',
      settingKey: 'theme',
      component: <ThemeSelector />,
      icon: <Icon source="palette-outline" size={iconSize} color={colors.primary} />
    },
    {
      id: '5',
      type: 'setting',
      title: 'Default Currency',
      description: 'Choose how amounts appear, with your currency and preferred number format.',
      settingKey: 'currency',
      component: <OnboardingCurrencyStep />,
      icon: 'cash',
    },
    // {
    //   id: '6',
    //   type: 'setting',
    //   title: 'Language Preference',
    //   description: 'Select your preferred language for the app interface.',
    //   settingKey: 'language',
    //   options: [
    //     { label: 'English', value: 'en' },
    //     { label: 'Spanish', value: 'es' },
    //     { label: 'French', value: 'fr' },
    //     { label: 'German', value: 'de' },
    //     { label: 'Chinese', value: 'zh' },
    //   ],
    //   icon: 'translate',
    // },
    {
      id: '7',
      type: 'setting',
      title: 'Haptic Feedback',
      description: 'Add a subtle touch of feedback to everyday actions. Keep it on, or enjoy a quieter feel.',
      settingKey: 'haptics',
      component: <SettingSwitchListItem
        title="Enable Haptic Feedback"
        description="Feel vibrations when using the app"
        value={haptics.enabled}
        onValueChange={handleHapticsToggle}
        leftIcon={haptics.enabled ? "vibrate" : "vibrate-off"}
        style={{
          backgroundColor: colors.elevation.level3
        }}
      />,
      icon: <Icon source="vibrate" size={iconSize} color={colors.primary} />,
    },
    {
      id: '8',
      type: 'setting',
      title: 'Secure Login',
      description: 'Add an extra layer of privacy with your fingerprint, face, or device passcode when supported.',
      settingKey: 'secureLogin',
      component: <SettingSecureLoginToggle showSuccessSnackbar={false} />,
      icon: <Icon source="fingerprint" size={iconSize} color={colors.primary} />,
    },
    {
      id: '9',
      type: 'intro',
      title: 'All Set!',
      description: 'Your next chapter starts with an entry. You can revisit this tour and adjust your preferences anytime.',
      lottie: <LottieView source={require('../../assets/lottie/success.json')} autoPlay loop style={{ height: "100%", width: "100%" }} />
    }
  ]), [colors, haptics, handleHapticsToggle, iconSize])
}
