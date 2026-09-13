import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Icon } from 'react-native-paper';
import { ThemedText } from '@/components/base/ThemedText';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { CategoryItem } from './CategoryItem';
import { Category } from '@/lib/types';


interface CategoryListProps {
  categories: Category[];
  onToggleCategory: (name: string, enabled: boolean) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  loading?: boolean;
  type?: 'expense' | 'income';
}

export const CategoryList = React.memo<CategoryListProps>(({
  categories,
  onToggleCategory,
  onEditCategory,
  onDeleteCategory,
  loading = false,
  type = 'expense',
}) => {
  const { colors } = useAppTheme();

  const renderItem = useCallback(({ item }: { item: Category }) => (
    <CategoryItem
      key={item.name}
      category={item}
      onToggle={onToggleCategory}
      onEdit={onEditCategory}
      onDelete={onDeleteCategory}
      type={type}
    />
  ), [onToggleCategory, onEditCategory, onDeleteCategory, type]);

  const keyExtractor = useCallback((item: Category) => `category-${item.name}`, []);

  const ItemSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  const EmptyComponent = useMemo(() => (
    <View style={styles.empty}>
      <Icon
        source="folder-open-outline"
        size={64}
        color={colors.onSurfaceVariant}
      />
      <ThemedText
        type="subtitle"
        style={[styles.emptyText, { color: colors.onSurfaceVariant }]}
      >
        {type === 'income' ? 'No income sources yet' : 'No categories yet'}
      </ThemedText>
      <ThemedText
        type="default"
        style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}
      >
        {type === 'income' ? 'Create a source for money coming in.' : 'Create a category to organize your spending.'}
      </ThemedText>
    </View>
  ), [colors.onSurfaceVariant, type]);

  return (
    <FlashList
      data={categories}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      scrollEventThrottle={16}
      ListEmptyComponent={EmptyComponent}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    />
  );
});

CategoryList.displayName = 'CategoryList';

const styles = StyleSheet.create({
  separator: {
    height: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 120,
    paddingTop: 16,
  },
});
