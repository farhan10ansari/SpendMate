import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { Href } from "expo-router";
import { memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, TouchableRipple } from "react-native-paper";
import { ThemedText } from '@/components/base/ThemedText';

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
    tone?: 'primary' | 'tertiary' | 'error';
};

export default memo(function MenuItemComponent({
    item,
    isLast,
    onPress,
    tone = 'primary',
}: MenuItemComponentProps) {
    const { colors } = useAppTheme();
    const accent = colors[tone];
    const tint = tone === 'error' ? colors.errorContainer : tone === 'tertiary' ? colors.tertiaryContainer : colors.primaryContainer;

    const handlePress = useCallback(() => {
        onPress(item.route);
    }, [onPress, item.route]);

    return (
        <View>
            <TouchableRipple onPress={handlePress} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.description}`}>
                <View style={menuItemStyles.listItem}>
                    <View style={[menuItemStyles.iconBadge, { backgroundColor: tint }]}>
                        <Icon source={item.icon} size={22} color={accent} />
                    </View>
                    <View style={menuItemStyles.text}>
                        <ThemedText style={menuItemStyles.listItemTitle} color={tone === 'error' ? accent : colors.text}>{item.title}</ThemedText>
                        <ThemedText style={menuItemStyles.listItemDescription} color={colors.muted}>{item.description}</ThemedText>
                    </View>
                    <Icon source="chevron-right" size={18} color={colors.muted} />
                </View>
            </TouchableRipple>
            {!isLast && <View style={[menuItemStyles.divider, { backgroundColor: colors.border }]} />}
        </View>
    );
});


const menuItemStyles = StyleSheet.create({
    listItem: {
        paddingVertical: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'transparent',
    },
    listItemTitle: {
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '700',
    },
    listItemDescription: {
        fontSize: 11,
        lineHeight: 17,
        marginTop: 2,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 68,
        marginRight: 16,
    },
    iconBadge: { padding: 11, borderRadius: 15 },
    text: { flex: 1 },
});
