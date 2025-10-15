import usePersistentAppStore from '@/stores/usePersistentAppStore';
import { useQuery } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getEnrolledLevelAsync, SecurityLevel, authenticateAsync } from 'expo-local-authentication';
import { AppState, BackHandler, ToastAndroid } from 'react-native';
import AuthOverlay from '@/components/main/AuthOverlay';
import { useSnackbar } from './GlobalSnackbarProvider';
import { authLog as log } from '@/lib/logger';
import { useHaptics } from './HapticsProvider';

interface LocalAuthContextType {
  biometricLogin: boolean;
  isAuthenticated: boolean;
  isAuthenticationSupported: boolean;
  handleBiometricLoginToggle: (enabled: boolean, showSuccessSnackbar?: boolean) => Promise<void>;
  refresh: () => void;
}

const LocalAuthContext = createContext<LocalAuthContextType | undefined>(undefined);

const isSupportedAuthType = (level: SecurityLevel | undefined) => {
  if (!level) return false;
  return [SecurityLevel.BIOMETRIC_STRONG, SecurityLevel.BIOMETRIC_WEAK, SecurityLevel.SECRET].includes(level);
}

const lockAfterMs = 5 * 60 * 1000; // 5 minutes

export const LocalAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const biometricLogin = usePersistentAppStore(state => state.settings.biometricLogin);
  const updateSettings = usePersistentAppStore(state => state.updateSettings);
  const [isAuthenticated, setIsAuthenticated] = useState(biometricLogin ? false : true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { showSnackbar } = useSnackbar()
  const { hapticImpact, hapticNotify } = useHaptics()

  const appState = useRef(AppState.currentState);
  const lastBackgroundAtRef = useRef<number | null>(null);
  const tempAuthRef = useRef(false);

  const {
    data: securityLevel,
    isLoading,
    error,
    isError,
    refetch
  } = useQuery({
    queryKey: ['security', 'supportedAuthTypes'],
    queryFn: async () => {
      const types = await getEnrolledLevelAsync();
      log.debug("LocalAuth: fetched security level", { level: types });
      return types;
    },
    retry: 2,
  });

  const handleShowSnackbar = useCallback((message: string, type: 'error' | 'success' | 'info') => {
    showSnackbar({
      message,
      duration: 2000,
      type: type,
      position: 'bottom',
    });
  }, [showSnackbar]);

  const handleAuthentication = useCallback(async () => {
    try {
      log.debug("LocalAuth: authentication start");
      tempAuthRef.current = true;
      setIsAuthenticating(true);
      const authResult = await authenticateAsync({
        promptMessage: 'Authenticate to access your expense manager',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });
      if (authResult.success) {
        setIsAuthenticated(true);
        log.info("LocalAuth: authentication success");
      } else {
        // Handle authentication failure
        if (authResult.error === 'user_cancel' || authResult.error === 'app_cancel') {
          log.warn("LocalAuth: authentication cancelled", { error: authResult.error });
          // BackHandler.exitApp();
          // User cancelled, try again
          // setTimeout(() => handleAuthentication(), 500);
        } else if (authResult.error === 'lockout') {
          log.error("LocalAuth: biometric lockout");
          ToastAndroid.show(
            'Too Many Attempts: Biometric authentication locked. Try again later.',
            ToastAndroid.LONG
          );
          BackHandler.exitApp();
        } else {
          log.warn("LocalAuth: authentication failed", { error: authResult.error });
          ToastAndroid.show(
            'Authentication Failed: Please try again',
            ToastAndroid.SHORT
          );
          BackHandler.exitApp();
        }
      }
    } catch (error) {
      log.error('LocalAuth: authentication error', { error: String(error) });
      ToastAndroid.show(
        'Authentication Error: Unable to authenticate. Closing app.',
        ToastAndroid.SHORT
      );
      BackHandler.exitApp();
    } finally {
      setIsAuthenticating(false);
      // Give AppState a moment to settle after biometric overlay closes
      setTimeout(() => { tempAuthRef.current = false; }, 1000);
      log.debug("LocalAuth: authentication finished");
    }
  }, []);

  const handleBiometricLoginToggle = useCallback(async (enabled: boolean, showSuccessSnackbar: boolean = true) => {
    if (enabled) {
      try {
        log.debug("LocalAuth: enable secure login - start");
        const authResult = await authenticateAsync({
          promptMessage: 'Authenticate to enable Secure login',
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use Passcode',
          disableDeviceFallback: false,
        });

        if (authResult.success) {
          updateSettings('biometricLogin', true);
          if (showSuccessSnackbar) {
            handleShowSnackbar('Secure login enabled', 'success');
          }
          log.info("LocalAuth: enable secure login - success");
        } else {
          refetch()
          handleShowSnackbar('Failed to enable secure login. Try again.', 'error');
          log.warn("LocalAuth: enable secure login - failed", { error: authResult.error });
        }
      } catch (error) {
        refetch()
        log.error('LocalAuth: enable secure login - error', { error: String(error) });
        handleShowSnackbar('Failed to enable secure login. Try again.', 'error');
      }
    } else {
      // Disable secure login
      updateSettings('biometricLogin', false);
      hapticImpact()
      if (showSuccessSnackbar) {
        handleShowSnackbar('Secure login disabled', 'info');
      }
      log.info("LocalAuth: secure login disabled");
    }
  }, [updateSettings, refetch, handleShowSnackbar]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;
      appState.current = next;

      // When moving to background, record time unless we are showing biometric sheet
      if (next === 'background' && !tempAuthRef.current) {
        lastBackgroundAtRef.current = Date.now();
        log.debug("LocalAuth: app moved to background");
      }

      // When coming back to active from background, decide re-lock
      if (next === 'active' && prev === 'background') {
        // Refetch security level on app focus to ensure up-to-date status
        refetch();

        const last = lastBackgroundAtRef.current ?? 0;
        const elapsed = Date.now() - last;
        const shouldLockApp = elapsed >= lockAfterMs;
        log.debug("LocalAuth: app active after background", { elapsed, shouldLockApp });

        if (biometricLogin && shouldLockApp) {
          // Time exceeded, re-lock
          setIsAuthenticated(false);
          log.info("LocalAuth: relocking due to inactivity");
        }
      }
    });

    return () => sub.remove();
  }, [biometricLogin, refetch]);

  useEffect(() => {
    if (isAuthenticated) return;
    if (!biometricLogin) {
      setIsAuthenticated(true);
      return;
    }
    if (isLoading) return;
    if (isError) return;
    if (securityLevel === undefined) return;
    if (securityLevel === SecurityLevel.NONE) {
      setIsAuthenticated(true)
      ToastAndroid.show(
        'Device security removed. Disabling biometric login.',
        ToastAndroid.LONG
      );
      updateSettings('biometricLogin', false);
      log.warn("LocalAuth: device security removed, disabling biometric login");
    } else if (isSupportedAuthType(securityLevel)) {
      log.debug("LocalAuth: triggering authentication");
      handleAuthentication();
    }
  }, [isAuthenticated, securityLevel, isLoading, isError, error, biometricLogin, handleAuthentication, updateSettings]);

  const authContextValue: LocalAuthContextType = useMemo(() => ({
    biometricLogin,
    isAuthenticated,
    isAuthenticationSupported: isSupportedAuthType(securityLevel),
    handleBiometricLoginToggle,
    refresh: refetch,
  }), [biometricLogin, isAuthenticated, securityLevel, handleBiometricLoginToggle, refetch]);

  return (
    <LocalAuthContext.Provider value={authContextValue}>
      {children}
      {!isAuthenticated && (
        <AuthOverlay
          isAuthenticating={isAuthenticating}
          onAuthenticate={handleAuthentication}
        />
      )}
    </LocalAuthContext.Provider>
  );
};

// useAuth hook
export const useLocalAuth = () => {
  const context = useContext(LocalAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
