import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Icon, Searchbar } from 'react-native-paper';
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
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? categories.filter(category => category.label.toLocaleLowerCase().includes(query)) : categories;
  }, [categories, search]);
  const enabledCount = useMemo(() => categories.reduce((count, category) => count + Number(category.enabled), 0), [categories]);

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
        {search.trim() ? 'No matches found' : type === 'income' ? 'No income sources yet' : 'No categories yet'}
      </ThemedText>
      <ThemedText
        type="default"
        style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}
      >
        {search.trim() ? 'Try a different name.' : type === 'income' ? 'Create a source for money coming in.' : 'Create a category to organize your spending.'}
      </ThemedText>
    </View>
  ), [colors.onSurfaceVariant, type, search]);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.summary}>
          <ThemedText style={styles.title}>{type === 'income' ? 'Your income sources' : 'Your categories'}</ThemedText>
          <ThemedText color={colors.muted} style={styles.count}>{enabledCount} active · {categories.length} total</ThemedText>
        </View>
        <Searchbar value={search} onChangeText={setSearch}
          placeholder={type === 'income' ? 'Find a source' : 'Find a category'}
          accessibilityLabel={type === 'income' ? 'Search income sources' : 'Search categories'}
          style={[styles.search, { backgroundColor: colors.surface }]}
          inputStyle={styles.searchInput} iconColor={type === 'income' ? colors.tertiary : colors.primary} />
      </View>
    <FlashList
      data={filtered}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      scrollEventThrottle={16}
      ListEmptyComponent={EmptyComponent}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
    </View>
  );
});

CategoryList.displayName = 'CategoryList';

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  title: { fontSize: 15, fontWeight: '700' },
  count: { fontSize: 11, lineHeight: 18 },
  search: { borderRadius: 18 },
  searchInput: { minHeight: 48, fontSize: 13 },
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
