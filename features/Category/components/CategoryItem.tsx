import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Switch, IconButton } from 'react-native-paper';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useHaptics } from '@/contexts/HapticsProvider';
import { Category } from '@/lib/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface CategoryItemProps {
    category: Category;
    onToggle: (name: string, enabled: boolean) => void;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    type?: 'expense' | 'income';
}

export const CategoryItem = React.memo<CategoryItemProps>(({
    category,
    onToggle,
    onEdit,
    onDelete,
    type = 'expense',
}) => {
    const { colors } = useAppTheme();
    const { hapticImpact } = useHaptics();

    const handleToggle = useCallback(() => {
        onToggle(category.name, !category.enabled);
    }, [category.name, category.enabled, onToggle, hapticImpact]);

    const handleEdit = useCallback(() => {
        onEdit(category);
    }, [category, onEdit, hapticImpact]);

    const handleDelete = useCallback(() => {
        onDelete(category);
    }, [category, onDelete, hapticImpact]);

    const itemStyle = useMemo(() => [
        styles.item,
        {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        }
    ], [colors.surface, colors.border, category.enabled]);

    const labelStyle = useMemo(() => [
        styles.label,
        {
            color: colors.onSurface,
            opacity: category.enabled ? 1 : 0.7,
        }
    ], [colors.onSurface, category.enabled]);

    return (
        <Surface style={itemStyle} elevation={0}>
            <CategoryIcon
                size={40}
                icon={category.icon}
                color={category.color}
            />
            <View style={styles.labelContainer}>
                <Text variant="bodyLarge" style={labelStyle}>
                    {category.label}
                </Text>
                <Text style={[styles.status, { color: colors.muted }]}>
                    {category.isCustom ? 'Custom' : 'Built-in'} · {category.enabled ? 'Active' : 'Hidden'}
                </Text>
            </View>

            <View style={styles.actions}>
                {category.isCustom && (
                    <IconButton
                        icon="delete-outline"
                        size={20}
                        iconColor={colors.error}
                        onPress={handleDelete}
                        accessibilityLabel={`Delete ${category.label}`}
                        style={styles.actionButton}
                    />
                )}
                <Switch
                    value={category.enabled}
                    accessibilityLabel={`Enable ${category.label}`}
                    onValueChange={handleToggle}
                    color={type === "income" ? colors.tertiary : colors.primary}
                />
                <IconButton
                    icon="square-edit-outline"
                    size={20}
                    iconColor={colors.onSurfaceVariant}
                    onPress={handleEdit}
                    accessibilityLabel={`Edit ${category.label}`}
                    style={styles.actionButton}
                />
            </View>
        </Surface>
    );
});

CategoryItem.displayName = 'CategoryItem';

const styles = StyleSheet.create({
    item: {
        borderRadius: 22,
        borderWidth: StyleSheet.hairlineWidth,
        marginHorizontal: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        minHeight: 76,
    },
    labelContainer: {
        flex: 1,
        minWidth: 80,
        justifyContent: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 22,
    },
    status: { fontSize: 10, lineHeight: 16, marginTop: 2 },
    actions: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    actionButton: {
        margin: 0,
        width: 36,
        height: 36,
    },
});
