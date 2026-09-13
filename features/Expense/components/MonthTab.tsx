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
            borderRadius: 18,
            overflow: 'hidden',
            marginRight: 8,
        },
        tabContainer: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 18,
            backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: isSelected ? colors.primary : colors.border,
            minWidth: 75,
            alignItems: 'center',
        },
        tabText: {
            fontSize: 12,
            fontWeight: isSelected ? '700' : '500',
            color: isSelected ? colors.onPrimaryContainer : colors.onSurface,
            lineHeight: 18,
            width: '100%',
            textAlign: 'center',
        },
        countText: {
            fontSize: 10,
            color: isSelected ? colors.onPrimaryContainer : colors.muted,
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
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
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
                        {count} {count === 1 ? 'entry' : 'entries'}
                    </ThemedText>
                )}
            </Pressable>
        </View>
    );
}
