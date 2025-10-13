import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import Color from 'color';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from "react-native-paper";
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';

const PADDING = {
    default: {
        vertical: 2,
        horizontal: 10,
        iconMarginRight: 6,
        textOnlyHorizontal: 14,
    },
    small: {
        vertical: 1,
        horizontal: 6,
        iconMarginRight: 4,
        textOnlyHorizontal: 10,
    },
};

const SIZES = {
    default: {
        height: 32,
        iconSize: 18,
        fontSize: 14,
        borderRadius: 14,
    },
    small: {
        height: 24,
        iconSize: 12,
        fontSize: 10,
        borderRadius: 10,
    },
};

export interface CustomChipProps {
    /**
     * The text label to display inside the chip.
     */
    label: string;
    /**
     * Icon source for the chip. Uses react-native-paper's IconSource type.
     */
    icon?: IconSource;
    /**
     * The color variant of the chip or a custom color hash.
     * @default 'primary'
     */
    variant?: 'primary' | 'secondary' | 'tertiary' | string;
    /**
     * The size of the chip.
     * @default 'default'
     */
    size?: 'default' | 'small';
    /**
     * Whether to show a border around the chip.
     * @default true
     */
    showBorder?: boolean;
}

const CustomChip: React.FC<CustomChipProps> = ({
    label,
    icon,
    variant = 'primary',
    size = 'default',
    showBorder = true,
}) => {
    const { colors, dark } = useAppTheme();

    // Memoize size and padding configurations
    const currentSizeConfig = useMemo(() => SIZES[size] || SIZES.default, [size]);
    const currentPaddingConfig = useMemo(() => PADDING[size] || PADDING.default, [size]);

    // Memoize VARIANT_COLORS to avoid recreation on every render
    const VARIANT_COLORS = useMemo(() => ({
        primary: {
            backgroundColor: colors.onPrimary,
            textColor: colors.text,
            iconColor: colors.primary,
            borderColor: colors.primary,
        },
        secondary: {
            backgroundColor: colors.onSecondary,
            textColor: colors.text,
            iconColor: colors.secondary,
            borderColor: colors.secondary,
        },
        tertiary: {
            backgroundColor: colors.onTertiary,
            textColor: colors.text,
            iconColor: colors.tertiary,
            borderColor: colors.tertiary // No border in dark mode for making it similar to expense categories in dark mode
        },
    }), [colors]);

    // Memoize color calculations
    const chipColors = useMemo(() => {
        const isCustomColor = !(variant in VARIANT_COLORS);

        if (isCustomColor) {
            return {
                backgroundColor: dark
                    ? Color(variant).alpha(0.1).string()
                    : Color(variant).alpha(0.05).string(),
                textColor: variant,
                iconColor: variant,
                borderColor: variant,
                borderWidth: showBorder ? 1 : 0,
            };
        } else {
            const baseVariantColors = VARIANT_COLORS[variant as keyof typeof VARIANT_COLORS];
            return {
                backgroundColor: baseVariantColors.backgroundColor,
                textColor: baseVariantColors.textColor,
                iconColor: baseVariantColors.iconColor,
                borderColor: baseVariantColors.borderColor,
                borderWidth: showBorder ? 1 : 0,
            };
        }
    }, [variant, dark, VARIANT_COLORS]);

    // Memoize chip style
    const chipStyle = useMemo(() => [
        styles.chipBase,
        {
            backgroundColor: chipColors.backgroundColor,
            borderColor: chipColors.borderColor,
            borderWidth: chipColors.borderWidth,
            height: currentSizeConfig.height,
            borderRadius: currentSizeConfig.borderRadius,
            paddingVertical: currentPaddingConfig.vertical,
            paddingHorizontal: icon ? currentPaddingConfig.horizontal : currentPaddingConfig.textOnlyHorizontal,
        },
    ], [chipColors, currentSizeConfig, currentPaddingConfig, icon]);

    // Memoize label style
    const labelStyle = useMemo(() => [
        styles.labelBase,
        {
            color: chipColors.textColor,
            fontSize: currentSizeConfig.fontSize,
            marginLeft: icon ? currentPaddingConfig.iconMarginRight : 0,
        },
    ], [chipColors.textColor, currentSizeConfig.fontSize, currentPaddingConfig.iconMarginRight, icon]);

    return (
        <View style={chipStyle}>
            {icon && (
                <Icon
                    source={icon}
                    color={chipColors.iconColor}
                    size={currentSizeConfig.iconSize}
                />
            )}
            <Text style={labelStyle} numberOfLines={1} ellipsizeMode="tail">
                {label}
            </Text>
        </View>
    );
}

// Add display name for better debugging
CustomChip.displayName = 'CustomChip';

const styles = StyleSheet.create({
    chipBase: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    labelBase: {
        fontWeight: '500',
    },
});

export default CustomChip;
