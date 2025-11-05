import React, { useState } from "react";
import { View, StyleProp, StyleSheet, TextStyle } from "react-native";
import { Card, IconButton, Portal, Dialog } from "react-native-paper";
import { ThemedText } from "@/components/base/ThemedText";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useHaptics } from "@/contexts/HapticsProvider";

type StatsCardProps = {
    title: string;
    value: React.ReactNode | string | number;
    icon?: React.ReactNode;
    /** Prefix to display before the value (can be text or icon) */
    prefix?: React.ReactNode;
    /** Suffix to display after the value (can be text or icon) */
    suffix?: React.ReactNode;
    /** Background color of the card */
    backgroundColor?: string;
    /** Color for all text inside the card */
    textColor?: string;
    titleStyle?: StyleProp<TextStyle>;
    /** Description for the card, shown in info dialog (can be string or ReactNode) */
    description?: string | React.ReactNode;
    /** Optional: Custom info icon (node). Overwrites default IconButton */
    infoIcon?: React.ReactElement<React.ComponentProps<typeof IconButton>>;
    /** Optional: Color for the info icon */
    infoIconColor?: string;
    /** Loading state to show skeleton */
    isLoading?: boolean;
};

const StatsCard = ({
    title,
    value,
    icon,
    prefix,
    suffix,
    backgroundColor,
    textColor,
    titleStyle,
    description,
    infoIcon,
    infoIconColor,
    isLoading = false
}: StatsCardProps) => {
    const { colors } = useAppTheme();
    const [showDesc, setShowDesc] = useState(false);
    const resolvedTextColor = textColor ?? colors.text;
    const { hapticImpact } = useHaptics();

    // Helper function to render prefix/suffix
    const renderTextOrNode = (item: React.ReactNode) => {
        if (typeof item === "string") {
            return (
                <ThemedText style={[styles.cardValue, { color: resolvedTextColor }]}>
                    {item}
                </ThemedText>
            );
        }
        return item;
    };

    // Skeleton loading bars
    const renderSkeleton = () => (
        <View style={styles.cardValueContainer}>
            <View style={[styles.skeletonBar, styles.skeletonShort, { backgroundColor: colors.outline }]} />
            <View style={[styles.skeletonBar, styles.skeletonMedium, { backgroundColor: colors.outline }]} />
            <View style={[styles.skeletonBar, styles.skeletonShort, { backgroundColor: colors.outline }]} />
        </View>
    );

    return (
        <Card style={[styles.card, backgroundColor && { backgroundColor }]}>
            <View style={styles.cardHeader}>
                {icon}
                <ThemedText
                    type="defaultSemiBold"
                    style={[styles.cardTitle, { color: resolvedTextColor }, titleStyle]}
                >
                    {title}
                </ThemedText>
            </View>

            {/* Show skeleton when loading, otherwise show actual content */}
            {isLoading ? renderSkeleton() : (
                <View style={styles.cardValueContainer}>
                    {prefix && renderTextOrNode(prefix)}
                    <ThemedText style={[styles.cardValue, { color: resolvedTextColor }]}>
                        {value}
                    </ThemedText>
                    {suffix && renderTextOrNode(suffix)}
                </View>
            )}


            {/* Info Icon (top right, only if description is provided) */}
            {description && (
                <View style={styles.infoIconContainer}>
                    {infoIcon ? (
                        // Custom icon provided as prop
                        React.cloneElement(infoIcon, {
                            onPress: () => {
                                hapticImpact()
                                setShowDesc(true)
                            },
                        })
                    ) : (
                        <IconButton
                            icon="information-outline"
                            size={20}
                            onPress={() => {
                                hapticImpact()
                                setShowDesc(true)
                            }}
                            accessibilityLabel="Info"
                            rippleColor={colors.backdrop}
                            iconColor={infoIconColor ?? colors.inverseOnSurface}
                            style={{ margin: 0 }}
                        />
                    )}
                </View>
            )}

            {/* Info dialog */}
            {!!description && (
                <Portal>
                    <Dialog visible={showDesc} onDismiss={() => setShowDesc(false)}>
                        <Dialog.Title>Info</Dialog.Title>
                        <Dialog.Content>
                            {typeof description === "string" ? (
                                <ThemedText>{description}</ThemedText>
                            ) : (
                                description
                            )}
                        </Dialog.Content>
                        <Dialog.Actions>
                            <IconButton
                                icon="close"
                                size={20}
                                onPress={() => setShowDesc(false)}
                                accessibilityLabel="Close"
                            />
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        overflow: "hidden",
        padding: 10,
        position: "relative",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
        gap: 6,
        paddingHorizontal: 2,
    },
    cardTitle: {
        fontSize: 14,
    },
    cardValueContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        height: 24,
    },
    cardValue: {
        fontSize: 16,
        fontWeight: "700",
    },
    infoIconContainer: {
        position: "absolute",
        top: -8,
        right: -8,
    },
    // Skeleton styles
    skeletonBar: {
        height: 12,
        borderRadius: 6,
        opacity: 0.3,
    },
    skeletonShort: {
        width: 20,
    },
    skeletonMedium: {
        width: 60,
    },
});

export default StatsCard;
