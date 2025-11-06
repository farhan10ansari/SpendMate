import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ViewToken, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { OnboardingStep, useOnboardingData } from './OnboardingData';
import OnboardingItem from './OnboardingItem';
import PaginationDots from './PaginationDots';
import OnboardingButton from './OnboardingButton';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { useHaptics } from '@/contexts/HapticsProvider';
import { uiLog as log } from '@/lib/logger';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  return <OnboardingSteps />;
}

export function OnboardingSteps() {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const x = useSharedValue(0);
  const flatListIndex = useSharedValue(0);
  const flatListRef = useAnimatedRef<Animated.FlatList<OnboardingStep>>();
  const updateUIFlag = usePersistentAppStore(state => state.updateUIFlag);
  const onboardingData = useOnboardingData();
  const { hapticNotify } = useHaptics();
  const router = useRouter();

  const [settings, setSettings] = useState({
    theme: 'system',
    language: 'en',
    currency: 'USD',
    secureLogin: false,
    haptics: true,
  });

  // Responsive spacing based on screen height
  const isSmallScreen = height < 700;
  const skipButtonTopMargin = isSmallScreen ? 10 : 20;
  const skipButtonRightMargin = isSmallScreen ? 8 : 10;
  const skipButtonFontSize = isSmallScreen ? 14 : 16;
  const bottomContainerGap = isSmallScreen ? 15 : 30;
  const bottomContainerPadding = isSmallScreen ? 10 : 20;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // sometimes viewableItems can be empty when scrolling fast, so we guard against that
      if (!viewableItems[0]) return;

      if (viewableItems[0]?.index !== null) {
        flatListIndex.value = viewableItems[0].index ?? 0;
      }
    },
    []
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: OnboardingStep;
      index: number;
    }) => {
      return (
        <OnboardingItem
          item={item}
          index={index}
          x={x}
          settings={settings}
          onSettingChange={setSettings}
        />
      );
    },
    [x, settings]
  );

  const onFinish = useCallback(() => {
    // Navigate to main app
    hapticNotify('success');
    updateUIFlag('onboardingCompleted', true);
    router.replace('/(tabs)');
    log.info("Onboarding completed, navigating to main app");
  }, [updateUIFlag, hapticNotify, router]);

  const onSkip = useCallback(() => {
    hapticNotify('success');
    updateUIFlag('onboardingCompleted', true);
    router.replace('/(tabs)');
    log.info("Onboarding skipped, navigating to main app");
  }, [updateUIFlag, hapticNotify, router]);

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={{ 
          alignItems: 'flex-end', 
          marginTop: skipButtonTopMargin, 
          marginRight: skipButtonRightMargin 
        }}>
          <Button
            mode="text"
            onPress={onSkip}
            labelStyle={{ 
              color: theme.colors.primary, 
              fontSize: skipButtonFontSize 
            }}
          >
            Skip
          </Button>
        </View>
        <Animated.FlatList
          ref={flatListRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          horizontal
          pagingEnabled
          data={onboardingData}
          keyExtractor={(item) => item.id}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          renderItem={renderItem}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{
            minimumViewTime: 300,
            viewAreaCoveragePercentThreshold: 50,
          }}
        />

        <View style={[
          styles.bottomContainer, 
          { 
            gap: bottomContainerGap, 
            paddingBottom: bottomContainerPadding 
          }
        ]}>
          <PaginationDots length={onboardingData.length} x={x} />
          <OnboardingButton
            currentIndex={flatListIndex}
            length={onboardingData.length}
            flatListRef={flatListRef}
            onFinish={onFinish}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  container: {
    flex: 1,
  },
  bottomContainer: {
    alignItems: 'center',
  },
});
