import usePersistentAppStore from "@/stores/usePersistentAppStore";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { createContext, useContext, useEffect, useMemo } from "react";
import { Platform, View, useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { customLightTheme } from "../theme";
import { getThemeCollection } from '../collections';
import { NavigationBar } from 'expo-navigation-bar';

const ThemeContext = createContext(customLightTheme);

function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const colorScheme = useColorScheme();
    const appliedTheme = usePersistentAppStore((state) => state.theme);
    const collectionId = usePersistentAppStore((state) => state.themeCollection);

    const theme = useMemo(() => {
        const collection = getThemeCollection(collectionId);
        if (appliedTheme === "system") {
            return colorScheme === 'dark' ? collection.dark : collection.light;
        }
        return appliedTheme === "dark" ? collection.dark : collection.light;
    }, [appliedTheme, colorScheme, collectionId]);

    // ✅ Memoize context value to prevent provider re-renders
    const contextValue = useMemo(() => theme, [theme]);
    const navigationTheme = useMemo(() => {
        const baseTheme = theme.dark ? DarkTheme : DefaultTheme;
        return {
            ...baseTheme,
            colors: {
                ...baseTheme.colors,
                primary: theme.colors.primary,
                background: theme.colors.background,
                card: theme.colors.card,
                text: theme.colors.text,
                border: theme.colors.border,
                notification: theme.colors.error,
            },
        };
    }, [theme]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            // Style describes the buttons, not the background. The transparent
            // system bar shows the app's themed surface underneath it.
            NavigationBar.setStyle(theme.dark ? 'light' : 'dark');
        }
    }, [theme.dark]);


    return (
        <ThemeContext.Provider value={contextValue}>
            <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
                <ThemeProvider value={navigationTheme}>
                    <PaperProvider theme={theme}>
                        {children}
                    </PaperProvider>
                </ThemeProvider>
            </View>
        </ThemeContext.Provider>
    );
}

function useAppTheme() {
    const theme = useContext(ThemeContext);

    if (theme == null) {
        throw new Error(
            "Couldn't find a theme. Is your component inside AppThemeProvider or does it have a theme?"
        );
    }

    return theme;
}

export { AppThemeProvider, useAppTheme };
