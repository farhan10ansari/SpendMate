import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import ThemedButton from "@/components/ui/ThemedButton";
import { Platform, StyleSheet } from "react-native";

/**
 * A styled button for settings screens with foreground ripple effect.
 */
const SettingButton = ({ onPress, title }: { onPress: () => void; title: string }) => {
    const { colors } = useAppTheme();
    return (
        <ThemedButton
            mode="contained-tonal"
            style={[styles.button, { backgroundColor: colors.inverseOnSurface }]}
            contentStyle={styles.buttonContent}
            onPress={onPress}
            icon={"refresh"}
            rippleColor={colors.ripplePrimary}
            background={Platform.OS === 'android' ? { color: colors.ripplePrimary, foreground: true } : undefined}
        >
            {title}
        </ThemedButton>
    );
}

export default SettingButton;

const styles = StyleSheet.create({
    button: {
        borderRadius: 5,
    },
    buttonContent: {
        height: 50,
    },
});