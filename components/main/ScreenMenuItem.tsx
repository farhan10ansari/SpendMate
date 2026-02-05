import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { Href } from "expo-router";
import { useCallback, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { List } from "react-native-paper";

type MenuItem = {
    title: string;
    description: string;
    icon: string;
    route: Href;
};

type MenuItemComponentProps = {
    item: MenuItem;
    isLast: boolean;
    onPress: (route: Href) => void;
};

/**
 * A menu item component that displays a title, description, and icon.
 * Uses List.Item from react-native-paper with foreground ripple effect for Android.
 */
export default function MenuItemComponent({
    item,
    isLast,
    onPress
}: MenuItemComponentProps) {
    const { colors } = useAppTheme();

    const handlePress = useCallback(() => {
        onPress(item.route);
    }, [onPress, item.route]);

    // Use foreground ripple for Android to fix RN 0.80+ ripple bug
    const rippleBackground = useMemo(() => 
        Platform.OS === 'android' 
            ? { color: colors.ripplePrimary, foreground: true } 
            : undefined
    , [colors.ripplePrimary]);

    return (
        <View>
            <List.Item
                title={item.title}
                titleNumberOfLines={2}
                description={item.description}
                titleStyle={[menuItemStyles.listItemTitle, { color: colors.text }]}
                descriptionStyle={[menuItemStyles.listItemDescription, { color: colors.muted }]}
                style={menuItemStyles.listItem}
                left={(props) => (
                    <List.Icon
                        {...props}
                        icon={item.icon}
                        color={colors.primary}
                    />
                )}
                right={(props) => (
                    <List.Icon
                        {...props}
                        icon="chevron-right"
                        color={colors.muted}
                    />
                )}
                onPress={handlePress}
                rippleColor={colors.ripplePrimary}
                background={rippleBackground}
            />
            {!isLast && <View style={[menuItemStyles.divider, { backgroundColor: colors.border }]} />}
        </View>
    );
}


const menuItemStyles = StyleSheet.create({
    listItem: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    listItemDescription: {
        fontSize: 14,
        marginTop: 2,
    },
    divider: {
        height: 0.5,
        marginLeft: 56,
    },
});

