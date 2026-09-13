import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { ThemedText } from "../base/ThemedText";

interface SettingSectionProps {
    icon: string;
    title: string;
    description: string;
    children: React.ReactNode;
}

const SettingSection = ({ icon, title, description, children }: SettingSectionProps) => {
    const { colors } = useAppTheme();
    const styles = StyleSheet.create({
        sectionContainer: {
            backgroundColor: colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: 24,
            padding: 16,
            marginBottom: 16,
            elevation: 0,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0,
            shadowRadius: 2,
        },
        sectionHeader: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            gap: 12,
        },
        sectionTitle: {
            flex: 1,
            fontSize: 17,
            fontWeight: "600",
            color: colors.primary,
        },
        descriptionText: {
            color: colors.muted,
            fontSize: 12,
            lineHeight: 20,
            marginBottom: 16,
        },
    });

    return (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <View style={{ padding: 10, borderRadius: 14, backgroundColor: colors.primaryContainer }}>
                <Icon
                    source={icon}
                    size={22}
                    color={colors.primary}
                />
                </View>
                <ThemedText style={styles.sectionTitle}>
                    {title}
                </ThemedText>
            </View>
            <ThemedText style={styles.descriptionText}>
                {description}
            </ThemedText>
            {children}
        </View>
    );
};

export default SettingSection;
