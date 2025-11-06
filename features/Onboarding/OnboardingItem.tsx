import React from 'react';
import { View, useWindowDimensions, StyleSheet, ScrollView } from 'react-native';
import { Text, Icon } from 'react-native-paper';
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
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const theme = useAppTheme();

  // Responsive sizing based on screen dimensions
  const isSmallScreen = SCREEN_HEIGHT < 700;
  const isTinyScreen = SCREEN_HEIGHT < 600;
  
  // Icon size responsive scaling
  const iconSize = isTinyScreen ? 80 : isSmallScreen ? 100 : 120;
  
  // Lottie animation container size
  const lottieContainerHeight = Math.min(SCREEN_WIDTH * 0.8, isTinyScreen ? 250 : isSmallScreen ? 300 : 400);
  
  // Font sizes with responsive scaling
  const titleFontSize = isTinyScreen ? 20 : isSmallScreen ? 24 : 28;
  const titleLineHeight = isTinyScreen ? 26 : isSmallScreen ? 30 : 34;
  const descriptionFontSize = isTinyScreen ? 13 : isSmallScreen ? 14 : 16;
  const descriptionLineHeight = isTinyScreen ? 18 : isSmallScreen ? 20 : 24;
  
  // Spacing adjustments
  const iconBottomMargin = isTinyScreen ? 16 : isSmallScreen ? 24 : 32;
  const titleBottomMargin = isTinyScreen ? 8 : isSmallScreen ? 12 : 16;
  const descriptionBottomMargin = isTinyScreen ? 16 : isSmallScreen ? 24 : 32;
  const horizontalPadding = isTinyScreen ? 16 : 24;
  const contentBottomPadding = isTinyScreen ? 10 : isSmallScreen ? 15 : 20;

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
        { width: SCREEN_WIDTH, paddingHorizontal: horizontalPadding },
        animatedStyle,
      ]}
    >
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {item.lottie ? (
          <View 
            style={{ 
              height: lottieContainerHeight, 
              width: SCREEN_WIDTH - (horizontalPadding * 2), 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingVertical: isTinyScreen ? 10 : 20 
            }}
          >
            {item.lottie}
          </View>
        ) : (
          <View style={{ 
            ...styles.iconContainer, 
            width: iconSize, 
            height: iconSize, 
            borderRadius: iconSize / 2,
            marginBottom: iconBottomMargin 
          }}>
            {typeof item.icon === 'string' ? (
              <Icon source={item.icon} size={iconSize} color={theme.colors.primary} />
            ) : (
              item.icon
            )}
          </View>
        )}

        <Text 
          style={[
            styles.title, 
            { 
              color: theme.colors.onBackground,
              fontSize: titleFontSize,
              lineHeight: titleLineHeight,
              marginBottom: titleBottomMargin
            }
          ]}
        >
          {item.title}
        </Text>

        <Text 
          style={[
            styles.description, 
            { 
              color: theme.colors.onSurfaceVariant,
              fontSize: descriptionFontSize,
              lineHeight: descriptionLineHeight,
              marginBottom: descriptionBottomMargin
            }
          ]}
        >
          {item.description}
        </Text>
        
        {item.component && (
          <View style={{ width: '100%', maxWidth: 600 }}>
            {item.component}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
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
