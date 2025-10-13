import { ThemedText } from '@/components/base/ThemedText';
import GlobalLevelComponents from '@/components/main/GlobalLevelComponents';
import db, { expoClient } from '@/db/client';
import migrations from '@/drizzle/migrations/migrations';
import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { AppThemeProvider } from '@/themes/providers/AppThemeProviders';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HapticsProvider } from '@/contexts/HapticsProvider';
import MainLayout from '@/components/main/MainLayout';
import { ConfirmationProvider } from '@/components/main/ConfirmationDialog';
import { ThemedView } from '@/components/base/ThemedView';
import { GlobalSnackbarProvider } from '@/contexts/GlobalSnackbarProvider';
import useSeedData from '@/hooks/useSeedData';
import { CategoryDataProvider } from '@/contexts/CategoryDataProvider';
import { LocalAuthProvider } from '@/contexts/LocalAuthProvider';
import { uiLog as log } from '@/lib/logger';
import { CurrencyProvider } from '@/contexts/CurrencyProvider';
import { KeyboardProvider } from 'react-native-keyboard-controller';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Queries will only be refetched when invalidated or app is restarted
      retry: 1, // Retry failed queries once
      refetchOnWindowFocus: false,
    }
  }
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // drizzle studio for debugging during development
  useDrizzleStudio(expoClient);
  const theme = usePersistentAppStore(state => state.theme);
  // drizzle migrations for schema changes
  const { success, error } = useMigrations(db, migrations);

  const { success: seedSuccess, error: seedError } = useSeedData(success)

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // hide splash when everything is ready
  useEffect(() => {
    if (loaded && success) {
      log.debug("RootLayout: assets loaded and migrations successful, hiding splash");
      SplashScreen.hideAsync();
    }
  }, [loaded, success]);


  // hide splash on error for showing the error message
  useEffect(() => {
    if (error && success && seedSuccess) {
      log.warn("RootLayout: hiding splash to show error UI");
      SplashScreen.hideAsync();
    }
  }, [error, success, seedSuccess]);

  if (!loaded) {
    return null;
  }

  if (error || seedError) {
    log.error("RootLayout: rendering error UI", { migrationError: error?.message, seedError: seedError?.message });
    return (
      <AppThemeProvider>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ThemedText>Migration/Seed data error: {error?.message}</ThemedText>
        </ThemedView>
      </AppThemeProvider>
    );
  }

  if (!success) {
    log.info("RootLayout: rendering migrations/seeding progress UI");
    return (
      <AppThemeProvider>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} >
          <ThemedText>Running migrations/seeding data…</ThemedText>
        </ThemedView>
      </AppThemeProvider>
    );
  }


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <HapticsProvider>
              <CurrencyProvider>
                <GlobalSnackbarProvider>
                  <ConfirmationProvider>
                    <LocalAuthProvider>
                      <CategoryDataProvider>
                        <MainLayout />
                        <GlobalLevelComponents />
                        <StatusBar style={theme === "system" ? "auto" : (theme === "light" ? "dark" : "light")} />
                      </CategoryDataProvider>
                    </LocalAuthProvider>
                  </ConfirmationProvider>
                </GlobalSnackbarProvider>
              </CurrencyProvider>
            </HapticsProvider>
          </AppThemeProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
