import usePersistentAppStore from "@/stores/usePersistentAppStore";
import { ThemeProvider } from "@react-navigation/native";
import { createContext, useContext, useEffect, useMemo } from "react";
import { Platform, useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { customDarkTheme, customLightTheme } from "../theme";
import * as NavigationBar from 'expo-navigation-bar';

const ThemeContext = createContext(customLightTheme);

function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const colorScheme = useColorScheme();
    const appliedTheme = usePersistentAppStore((state) => state.theme);

    const theme = useMemo(() => {
        if (appliedTheme === "system") {
            return colorScheme === 'dark' ? customDarkTheme : customLightTheme;
        }
        return appliedTheme === "dark" ? customDarkTheme : customLightTheme;
    }, [appliedTheme, colorScheme]);

    // ✅ Memoize context value to prevent provider re-renders
    const contextValue = useMemo(() => theme, [theme]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            // Set navigation bar style based on your app theme
            if (appliedTheme === 'dark') {
                NavigationBar.setStyle('dark'); // Dark bar with light icons
            } else if (appliedTheme === 'light') {
                NavigationBar.setStyle('light'); // Light bar with dark icons
            } else {
                if (colorScheme === 'dark') {
                    NavigationBar.setStyle('dark');
                } else {
                    NavigationBar.setStyle('light');
                }
            }
        }
    }, [appliedTheme, colorScheme]);


    return (
        <ThemeContext.Provider value={contextValue}>
            <ThemeProvider value={theme}>
                <PaperProvider theme={theme}>
                    {children}
                </PaperProvider>
            </ThemeProvider>
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
