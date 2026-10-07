import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { useNavigationContainerRef } from 'expo-router';
import CustomSnackbar, { CustomSnackbarProps } from '@/components/ui/CustomSnackbar';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';

type GlobalSnackbarProps = {
    message: string;
    duration: number;
    actionLabel?: string;
    actionIcon?: IconSource;
    type?: CustomSnackbarProps["type"];
    position?: CustomSnackbarProps["position"];
    offset?: number;
}

// Actions context - stable, won't cause re-renders
interface GlobalSnackbarActionsContextValue {
    showSnackbar: (snackbarConfig: GlobalSnackbarProps, delay?: number) => void;
    dismissSnackbar: () => void;
}

// State context - only for components that need current snackbar state
type GlobalSnackbarStateContextValue = GlobalSnackbarProps | null;


interface GlobalSnackbarProviderProps {
    children: ReactNode;
}

// Create separate contexts
const GlobalSnackbarActionsContext = createContext<GlobalSnackbarActionsContextValue | null>(null);
const GlobalSnackbarStateContext = createContext<GlobalSnackbarStateContextValue | null>(null);

export const GlobalSnackbarProvider: React.FC<GlobalSnackbarProviderProps> = ({ children }) => {
    const [globalSnackbar, setGlobalSnackbar] = useState<GlobalSnackbarProps | null>(null);
    const navigation = useNavigationContainerRef();

    const onDismiss = useCallback(() => {
        setGlobalSnackbar(null);
    }, []);

    useEffect(() => navigation.addListener('state', onDismiss), [navigation, onDismiss]);

    const showSnackbar = useCallback((snackbarConfig: GlobalSnackbarProps, delay?: number) => {
        if (!delay) {
            setGlobalSnackbar(snackbarConfig);
            return;
        }

        // Show snackbar after a delay (e.g., to avoid overlap with other UI elements and prevent clearing snackbar immediately because of segment(screen) change)
        setTimeout(() => {
            setGlobalSnackbar(snackbarConfig);
        }, delay);
    }, []);

    // Memoize actions context value (stable - won't cause re-renders)
    const actionsValue = useMemo<GlobalSnackbarActionsContextValue>(() => ({
        showSnackbar,
        dismissSnackbar: onDismiss,
    }), [showSnackbar, onDismiss]);

    return (
        <GlobalSnackbarStateContext.Provider value={globalSnackbar}>
            <GlobalSnackbarActionsContext.Provider value={actionsValue}>
                {children}
                <CustomSnackbar
                    usePortal
                    visible={!!globalSnackbar}
                    onDismiss={onDismiss}
                    duration={globalSnackbar?.duration}
                    action={{
                        label: globalSnackbar?.actionLabel || '',
                        icon: globalSnackbar?.actionIcon,
                    }}
                    type={globalSnackbar?.type}
                    position={globalSnackbar?.position ?? "bottom"}
                    offset={globalSnackbar?.offset}
                >
                    {globalSnackbar?.message}
                </CustomSnackbar>
            </GlobalSnackbarActionsContext.Provider>
        </GlobalSnackbarStateContext.Provider>
    );
};

// Hook for accessing snackbar actions (won't cause re-renders when snackbar state changes)
export const useSnackbar = (): GlobalSnackbarActionsContextValue => {
    const context = useContext(GlobalSnackbarActionsContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a GlobalSnackbarProvider');
    }
    return context;
};

// Hook for accessing snackbar state
export const useSnackbarState = (): GlobalSnackbarStateContextValue => {
    const context = useContext(GlobalSnackbarStateContext);
    if (context === undefined) { // Can be null (no snackbar) or GlobalSnackbarProps (active snackbar)
        throw new Error('useSnackbarState must be used within a GlobalSnackbarProvider');
    }
    return context; // This can be null (no active snackbar) or GlobalSnackbarProps (active snackbar)
};
