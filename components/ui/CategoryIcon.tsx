import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import Color from 'color';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Avatar } from 'react-native-paper';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';


interface CategoryIconProps {
    icon: IconSource;
    color: string;
    size: number;
    style?: StyleProp<ViewStyle>;
    isSelected?: boolean
    onPress?: () => void
}

export const CategoryIcon = ({
    icon,
    color,
    size,
    style,
    isSelected,
    onPress
}: CategoryIconProps) => {
    const { dark, colors } = useAppTheme()

    const avatarStyle = useMemo(() => [
        styles.avatar,
        {
            // backgroundColor: dark ? Color(color).alpha(0.1).string() : Color(color).lighten(0.15).alpha(0.2).string(),
            backgroundColor: dark ? Color(color).alpha(0.1).string() : color,
            borderWidth: isSelected ? 3 : 0,
            borderColor: isSelected ? (dark ? colors.primary : colors.tertiary) : dark ? "transparent" : colors.border,
        }
    ], [color, colors.border, colors.primary, colors.tertiary, dark, isSelected]);

    return (
        <Avatar.Icon
            size={size}
            icon={icon}
            color={dark ? color : colors.onPrimary}
            style={avatarStyle}
            onTouchEnd={onPress}
        />
    );
}

const styles = StyleSheet.create({
    avatar: {
        borderRadius: 12,
    },
})
