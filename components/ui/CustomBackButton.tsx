import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useHaptics } from "@/contexts/HapticsProvider";
import { Icon } from "react-native-paper";

const CustomBackButton = (({ onPress }: { onPress: () => void }) => {
    const { colors } = useAppTheme();
    const { hapticImpact } = useHaptics();

    const styles = StyleSheet.create({
        container: {
            borderRadius: 50,
            overflow: "hidden",
        },
        backButton: {
            width: 36,
            height: 36,
            borderRadius: 50,
            backgroundColor: colors.surfaceVariant + '30',
            justifyContent: "center",
            alignItems: "center",
            elevation: 1,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
    });

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.backButton}
                onPress={() => {
                    hapticImpact();
                    onPress();
                }}
                android_ripple={{
                    color: colors.ripplePrimary,
                    borderless: false,
                    foreground: true,
                }}
                hitSlop={8}
            >
                <Icon
                    source="chevron-left"
                    size={24}
                    color={colors.onSurfaceVariant}
                />
            </Pressable>
        </View>
    );
})

export default memo(CustomBackButton);