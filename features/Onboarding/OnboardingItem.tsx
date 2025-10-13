// components/onboarding/OnboardingItem.tsx
import React from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { Text, Card, RadioButton, Icon } from 'react-native-paper';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { OnboardingStep, Settings } from './OnboardingData';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';

interface Props {
  item: OnboardingStep;
  index: number;
  x: SharedValue<number>;
  settings: Settings;
  onSettingChange: (settings: Settings) => void;
}

export default function OnboardingItem({
  item,
  index,
  x,
  settings,
  onSettingChange,
}: Props) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const theme = useAppTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [50, 0, 50],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  }, [index, x]);


  return (
    <Animated.View
      style={[
        styles.container,
        { width: SCREEN_WIDTH },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        {item.lottie ?
          <View style={{ height: Math.min(SCREEN_WIDTH, 400), width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {item.lottie}
          </View>
          :
          <View style={{ ...styles.iconContainer }}>
            {typeof item.icon === 'string' ? (
              <Icon source={item.icon} size={120} color={theme.colors.primary} />
            ) : (
              item.icon
            )}
          </View>
        }

        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          {item.title}
        </Text>

        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {item.description}
        </Text>
        {item.component}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
    maxWidth: 600,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionCard: {
    borderWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionLabel: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});
