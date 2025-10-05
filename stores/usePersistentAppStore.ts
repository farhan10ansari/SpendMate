import { CurrencyCode, getCurrencyLocale, LocaleValue } from '@/lib/currencies';
import { Language } from '@/lib/types';
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { getLocales } from 'expo-localization';
import createDeepMerge from '@fastify/deepmerge'
const deepMerge = createDeepMerge({ all: true })

const localeDate = getLocales()[0]
const defaultCurrency = localeDate?.currencyCode as CurrencyCode ?? "INR";
// const defaultLocale = localeDate?.languageTag as LocaleValue ?? "en-IN";r
const defaultLocale = getCurrencyLocale(defaultCurrency) as LocaleValue ?? "en-IN";

// Synchronous adapter for Zustand persist (previously saved states were lost randomly)
const sqliteSyncStorage: StateStorage = {
    getItem: (name) => {
        const v = Storage.getItemSync(name);
        return v ?? null;
    },
    setItem: (name, value) => {
        Storage.setItemSync(name, value);
    },
    removeItem: (name) => {
        Storage.removeItemSync(name);
    },
};

type AppSettings = {
    language: Language;
    currencyCode: CurrencyCode; // e.g., "USD"
    currencyLocale: LocaleValue; // e.g., "en-US". Used only for formatting amounts
    biometricLogin: boolean;
    haptics: {
        enabled: boolean;
        intensity: "light" | "medium" | "heavy";
    };
};

type PersistentAppStore = {
    // Theme management
    theme: "light" | "dark" | "system";
    setTheme: (theme: "light" | "dark" | "system") => void;

    // App settings management
    settings: AppSettings;
    updateSettings: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

    // UI flags
    uiFlags: {
        showDevOptions: boolean;
        showNegativeStats: boolean;
        onboardingCompleted: boolean;
    };
    updateUIFlag: (flag: keyof PersistentAppStore['uiFlags'], value: boolean) => void;

    // Data seeding management
    seededKeys: string[];
    markDataSeeded: (key: string) => void;
    isDataSeeded: (key: string) => boolean;
};

const defaultSettings: AppSettings = {
    language: "english",
    currencyCode: defaultCurrency,
    currencyLocale: defaultLocale,
    biometricLogin: false,
    haptics: {
        enabled: true,
        intensity: "medium",
    }
};

const usePersistentAppStore = create<PersistentAppStore>()(persist(
    (set, get) => ({
        // Theme management
        theme: "system",
        setTheme: (theme) => set({ theme }),

        // App settings management
        settings: defaultSettings,
        updateSettings: (key, value) => set((state) => ({
            settings: {
                ...state.settings,
                [key]: value,
            }
        })),

        // UI flags
        uiFlags: {
            showDevOptions: false,
            showNegativeStats: true,
            onboardingCompleted: false,
        },
        updateUIFlag: (flag, value) => set((state) => ({
            uiFlags: {
                ...state.uiFlags,
                [flag]: value,
            }
        })),

        // Data seeding management
        seededKeys: [],
        markDataSeeded: (key) => set((state) => ({
            seededKeys: state.seededKeys.includes(key)
                ? state.seededKeys
                : [...state.seededKeys, key]
        })),
        isDataSeeded: (key) => get().seededKeys.includes(key),
    }), {
    name: 'app-storage',
    storage: createJSONStorage(() => sqliteSyncStorage),
    merge: (persisted, current) => deepMerge(current, persisted) as never,
    // Need to implement versioning and migrations in future if needed
    // version: 1,
    // migrate: (persistedState, version) => {
    //     // migration logic here
    //     return persistedState;
    // }
}));

export default usePersistentAppStore;
export type { AppSettings };
