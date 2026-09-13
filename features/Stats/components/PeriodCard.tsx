import React, { useCallback } from "react";
import { ThemedText } from "@/components/base/ThemedText";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useRouter } from "expo-router";
import useStatsStore from "@/stores/useStatsStore";
import { useQueryClient } from "@tanstack/react-query";
import { getAvailablePeriodsWithData } from "@/repositories/CommonRepo";


const PeriodCard = () => {
    const { colors } = useAppTheme()
    const router = useRouter();
    const period = useStatsStore((state) => state.period);
    const queryClient = useQueryClient();

    const label = [period.primaryLabel, period.secondaryLabel].filter(Boolean).join(' ');

    const handlePress = useCallback(async () => {
        // Prefetch available periods data so it is ready when screen opens
        await queryClient.prefetchQuery({
            queryKey: ["stats", 'available-periods'],
            queryFn: getAvailablePeriodsWithData,
        });
        router.push("/helper-screens/select-stats-period");
    }, [queryClient, router]);

    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
                onPress={handlePress}
                accessibilityRole="button"
                accessibilityLabel={`Select period, currently ${label}`}
                android_ripple={{ color: colors.ripplePrimary, foreground: true }}
                style={({ pressed }) => [styles.cardContent, pressed && styles.pressed]}
            >
                <View style={[styles.iconBadge, { backgroundColor: colors.primaryContainer }]}>
                    <Icon source="calendar-range" size={22} color={colors.primary} />
                </View>
                <View style={styles.labelContainer}>
                    <ThemedText color={colors.muted} style={styles.caption}>Viewing period</ThemedText>
                    <ThemedText style={styles.label}>{label}</ThemedText>
                </View>
                <View style={[styles.chevron, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon source="chevron-down" size={20} color={colors.primary} />
                </View>
            </Pressable>
        </View>
    )
};

const styles = StyleSheet.create({
    card: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
    pressed: { opacity: 0.85 },
    iconBadge: { padding: 10, borderRadius: 14 },
    labelContainer: { flex: 1, gap: 2 },
    caption: { fontSize: 10, lineHeight: 15, fontWeight: '500' },
    label: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
    chevron: { padding: 6, borderRadius: 12 },
});

export default PeriodCard;
