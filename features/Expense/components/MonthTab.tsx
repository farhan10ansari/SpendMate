import { StyleSheet, Pressable, View } from "react-native";
import { ThemedText } from "@/components/base/ThemedText";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";

interface MonthTabProps {
    month: string;
    count?: number;
    isSelected: boolean;
    onPress: () => void;
}

export default function MonthTab({ month, count, isSelected, onPress }: MonthTabProps) {
    const { colors } = useAppTheme();

    const styles = StyleSheet.create({
        tabWrapper: {
            borderRadius: 16,
            overflow: 'hidden',
            marginRight: 8,
        },
        tabContainer: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16, // Add borderRadius here too
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: isSelected ? colors.primary : colors.outline,
            minWidth: 75,
            alignItems: 'center',
            elevation: isSelected ? 3 : 1,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: isSelected ? 2 : 1 },
            shadowOpacity: isSelected ? 0.25 : 0.1,
            shadowRadius: isSelected ? 3 : 2,
        },
        tabText: {
            fontSize: 12,
            fontWeight: isSelected ? '600' : '500',
            color: isSelected ? colors.onPrimary : colors.onSurface,
            lineHeight: 14,
        },
        countText: {
            fontSize: 10,
            color: isSelected ? colors.onPrimary : colors.onSurfaceVariant,
            marginTop: 2,
            lineHeight: 12,
            opacity: isSelected ? 0.9 : 0.7,
        },
    });

    return (
        <View style={styles.tabWrapper}>
            <Pressable
                style={styles.tabContainer}
                onPress={onPress}
                android_ripple={{
                    color: colors.ripplePrimary,
                    borderless: false,
                }}
            >
                <ThemedText style={styles.tabText}>
                    {month}
                </ThemedText>
                {count !== undefined && (
                    <ThemedText style={styles.countText}>
                        {count} items
                    </ThemedText>
                )}
            </Pressable>
        </View>
    );
}
