import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import ThemedButton from "@/components/ui/ThemedButton";
import { StyleSheet } from "react-native";

const SettingButton = ({ onPress, title }: { onPress: () => void; title: string }) => {
    const { colors } = useAppTheme();
    return (
        <ThemedButton
            mode="contained-tonal"
            style={[styles.button, { backgroundColor: colors.inverseOnSurface }]}
            contentStyle={styles.buttonContent}
            onPress={onPress}
            icon={"refresh"}
        >
            {title}
        </ThemedButton>
    );
}

export default SettingButton;

const styles = StyleSheet.create({
    button: {
        borderRadius: 16,
    },
    buttonContent: {
        minHeight: 48,
    },
});
