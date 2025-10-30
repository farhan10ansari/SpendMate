import React, { useMemo } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    ViewStyle,
    StyleProp,
    RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";

type ScreenWrapperProps = {
    children: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    background?: "card" | "background";
    withScrollView?: boolean;
    isRefreshing?: boolean;
    onRefresh?: () => void;
};

export function ScreenWrapper({
    children,
    containerStyle,
    contentContainerStyle,
    background = "card",
    withScrollView = false,
    isRefreshing = false,
    onRefresh,
}: ScreenWrapperProps) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            borderTopWidth: 1,
            backgroundColor:
                background === "background" ? colors.background : colors.card,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            borderTopColor: colors.border,
        },
        content: {
            flex: 1,
        },
        scrollContent: {
            flexGrow: 1,
            paddingBottom: insets.bottom,
        },
        nonScroll: {
            flex: 1,
            // paddingBottom: insets.bottom,
        },
    }), [colors, insets, background]);


    return (
        <View style={[styles.container, containerStyle]}>
            {withScrollView ? (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={[
                        styles.scrollContent,
                        contentContainerStyle,
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        onRefresh
                            ? (
                                <RefreshControl
                                    refreshing={!!isRefreshing}
                                    onRefresh={onRefresh}
                                    colors={[colors.primary]}
                                    tintColor={colors.primary}
                                    progressBackgroundColor={
                                        background === "background" ? colors.card : colors.background
                                    }
                                />
                            )
                            : undefined
                    }
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.nonScroll, contentContainerStyle]}>
                    {children}
                </View>
            )}
        </View>
    );
}
