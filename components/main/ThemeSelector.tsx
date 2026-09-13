import { useHaptics } from "@/contexts/HapticsProvider";
import { themeOptions } from "@/lib/constants";
import usePersistentAppStore from "@/stores/usePersistentAppStore";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

const ThemeSelector = () => {
    const theme = usePersistentAppStore(state => state.theme);
    const setTheme = usePersistentAppStore(state => state.setTheme);
    const { hapticImpact } = useHaptics()

    return (
        <View style={styles.themeButtonsContainer}>
            {themeOptions.map((option) => (
                <Button
                    key={option.key}
                    mode={theme === option.key ? "contained-tonal" : "outlined"}
                    accessibilityState={{ selected: theme === option.key }}
                    style={styles.themeButton}
                    onPress={() => {
                        hapticImpact();
                        setTheme(option.key);
                    }}
                    icon={option.icon}
                    contentStyle={{ flexDirection: "column", paddingVertical: 12 }}
                    labelStyle={{ fontSize: 14, marginTop: 4 }}
                >
                    {option.label}
                </Button>
            ))}
        </View>

    )
}

export default ThemeSelector;

const styles = StyleSheet.create({
    themeButtonsContainer: {
        flexDirection: "row",
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8,
    },
    themeButton: {
        flex: 1,
        minWidth: 100,
        borderRadius: 18,
    }
});
