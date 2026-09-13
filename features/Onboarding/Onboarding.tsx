import React, { useCallback, useRef, useState } from 'react';
import { FlatList, View, StyleSheet, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, Text } from 'react-native-paper';
import { OnboardingStep, useOnboardingData } from './OnboardingData';
import OnboardingItem from './OnboardingItem';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { useHaptics } from '@/contexts/HapticsProvider';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';

export default function OnboardingScreen() {
  return <OnboardingSteps />;
}

export function OnboardingSteps() {
  const { colors } = useAppTheme();
  const data = useOnboardingData();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingStep>>(null);
  const updateUIFlag = usePersistentAppStore(state => state.updateUIFlag);
  const { hapticNotify, hapticImpact } = useHaptics();
  const router = useRouter();
  const lastStep = index === data.length - 1;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visibleIndex = viewableItems[0]?.index;
    if (visibleIndex != null) setIndex(visibleIndex);
  }, []);
  const finish = () => {
    hapticNotify('success');
    updateUIFlag('onboardingCompleted', true);
    router.replace('/(tabs)');
  };
  const goTo = (next: number) => {
    hapticImpact();
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primaryContainer }]}>
            <Icon source="wallet-outline" size={20} color={colors.onPrimaryContainer} />
          </View>
          <Text style={styles.brandName}>SpendMate</Text>
        </View>
        <Button onPress={finish} compact>{lastStep ? 'Done' : 'Skip tour'}</Button>
      </View>
      <View style={styles.progressArea}>
        <View style={styles.progressLabels}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR QUICK TOUR</Text>
          <Text accessibilityLiveRegion="polite" style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
            {index + 1} of {data.length}
          </Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: data.length, now: index + 1 }} style={styles.progress}>
          {data.map((step, i) => <View key={step.id} style={[styles.segment, { backgroundColor: i <= index ? colors.primary : colors.surfaceVariant }]} />)}
        </View>
      </View>
      <View style={styles.pager} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && <FlatList
          key={width}
          ref={listRef}
          data={data}
          extraData={index}
          horizontal
          pagingEnabled
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={item => item.id}
          renderItem={({ item, index: itemIndex }) => <OnboardingItem item={item} width={width} isActive={index === itemIndex} />}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
        />}
      </View>
      <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
        <View style={styles.actions}>
          <Button mode="text" onPress={() => goTo(index - 1)} disabled={index === 0} icon="arrow-left">Back</Button>
          <Button mode="contained" onPress={() => lastStep ? finish() : goTo(index + 1)}
            icon={lastStep ? 'check' : 'arrow-right'} contentStyle={styles.nextContent} style={styles.next}>
            {lastStep ? 'Get started' : 'Continue'}
          </Button>
        </View>
        <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
          {data[index].type === 'setting' ? 'Make it yours. You can change these settings anytime.' : 'Swipe to explore · Your records stay on your device'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 16, fontWeight: '700' },
  progressArea: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 12, gap: 10 },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  progress: { flexDirection: 'row', gap: 5 },
  segment: { height: 4, borderRadius: 4, flex: 1 },
  pager: { flex: 1 },
  footer: { width: '100%', maxWidth: 880, alignSelf: 'center', padding: 16, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  next: { borderRadius: 16 },
  nextContent: { flexDirection: 'row-reverse', minHeight: 48, paddingHorizontal: 8 },
  footerText: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
