import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner, FAB, Icon, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from 'expo-router/react-navigation';

import { Category, CategoryFormData, CreateCategoryData, UpdateCategoryData } from '@/lib/types';
import { CategoryList } from '@/features/Category/components/CategoryList';
import { CategoryFormDialog } from './CategoryFormDialog';
import { useConfirmation } from '@/components/main/ConfirmationDialog';
import { ScreenWrapper } from '@/components/main/ScreenWrapper';
import { useHaptics } from '@/contexts/HapticsProvider';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import useAppStore from '@/stores/useAppStore';
import { getCategoryLabel, getCategoryName } from '@/lib/functions';

type DialogMode = 'create' | 'edit' | null;

interface DialogState {
  mode: DialogMode;
  category?: Category;
  alertMessage?: string | null;
}

interface CategoryManagerProps {
  // Data
  categories: Category[];

  // Store actions
  onAdd: (data: CreateCategoryData) => void;
  onUpdate: (name: string, updates: UpdateCategoryData) => void;
  onDelete: (name: string) => void;

  // Labels
  labels: {
    createTitle: string;
    editTitle: string;
    createButton: string;
    updateButton: string;
    deleteTitle: string;
    deleteMessage: (label: string) => React.ReactNode;
  };

  type?: 'expense' | 'income';
}

export function CategoryManagerScreen({
  categories,
  onAdd,
  onUpdate,
  onDelete,
  labels,
  type = 'expense',
}: CategoryManagerProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { hapticImpact, hapticNotify } = useHaptics();
  const { showConfirmationDialog } = useConfirmation();
  const showManageCategoryInfoBanner = useAppStore(state => state.uiFlags.showManageCategoryInfoBanner);
  const updateUiFlag = useAppStore(state => state.updateUIFlag);

  // Local state
  const [dialogState, setDialogState] = useState<DialogState>({
    mode: null,
    alertMessage: null
  });

  // Dialog actions
  const openCreateDialog = useCallback(() => {
    hapticImpact();
    setDialogState({ mode: 'create', alertMessage: null });
  }, []);

  const openEditDialog = useCallback((category: Category) => {
    hapticImpact();
    setDialogState({ mode: 'edit', category, alertMessage: null });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState({ mode: null, alertMessage: null });
  }, []);

  const showAlert = useCallback((message: string) => {
    hapticNotify('warning');
    setDialogState(prev => ({ ...prev, alertMessage: message }));
  }, []);

  const clearAlert = useCallback(() => {
    setDialogState(prev => ({ ...prev, alertMessage: null }));
  }, []);

  // Category actions
  const handleToggle = useCallback((name: string, enabled: boolean) => {
    hapticImpact();
    onUpdate(name, { enabled });
  }, [onUpdate, hapticImpact]);

  const handleDelete = useCallback((category: Category) => {
    hapticNotify("warning")
    showConfirmationDialog({
      title: labels.deleteTitle,
      message: labels.deleteMessage(category.label),
      type: 'error',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        hapticNotify('success');
        onDelete(category.name)
      },
      onCancel: () => { },
      showCancel: true,
    });
  }, [showConfirmationDialog, onDelete, labels]);

  // Form submission
  const handleSubmit = useCallback((data: CategoryFormData) => {
    if (!data.title?.trim() || !data.icon || !data.color) {
      showAlert('Please fill in all required fields.');
      return;
    }

    const name = getCategoryName(data.title.trim());
    const label = getCategoryLabel(data.title.trim());

    if (!name || !label) {
      showAlert('Please enter a valid category name.');
      return;
    }

    // Check duplicates
    const { mode, category } = dialogState;
    const excludeName = mode === 'edit' ? category?.name : undefined;

    const isDuplicate = categories.some(existingCategory =>
      existingCategory.name !== excludeName && (
        existingCategory.name === name ||
        existingCategory.label.toLowerCase() === label.toLowerCase()
      )
    );

    if (isDuplicate) {
      showAlert('A category with this name already exists. Please choose a different name.');
      return;
    }

    // Submit
    try {
      if (mode === 'create') {
        const newCategory: CreateCategoryData = {
          name,
          label,
          icon: data.icon,
          color: data.color,
        };
        onAdd(newCategory);
      } else if (mode === 'edit' && category) {
        const updates: UpdateCategoryData = {
          label,
          icon: data.icon,
          color: data.color,
        };
        onUpdate(category.name, updates);
      }
      hapticNotify('success');
      closeDialog();
    } catch (error) {
      showAlert('An error occurred. Please try again.');
    }
  }, [dialogState, categories, getCategoryName, getCategoryLabel, onAdd, onUpdate, showAlert, closeDialog]);

  // Dialog initial data
  const dialogInitialData = dialogState.category ? {
    title: dialogState.category.label,
    icon: dialogState.category.icon,
    color: dialogState.category.color,
    isCustom: dialogState.category.isCustom
  } : undefined;


  const getBannerContent = () => {
    const entityType = type === 'expense' ? 'expense category' : 'income source';
    const recordType = type === 'expense' ? 'expenses' : 'income records';

    return (
      <View style={bannerStyles.container}>
        <View style={bannerStyles.row}>
          <Text style={[bannerStyles.description, { color: colors.onSurface }]}>
            <Text style={[bannerStyles.action, { color: colors.primary }]}>Disabling</Text> an {entityType} will hide it from selection, but existing {recordType} will remain intact
          </Text>
        </View>
        <View style={bannerStyles.row}>
          <Text style={[bannerStyles.description, { color: colors.onSurface }]}>
            <Text style={[bannerStyles.action, { color: colors.error }]}>Deleting</Text> an {entityType} will permanently delete all corresponding {recordType}. This action cannot be undone.
          </Text>
        </View>
        <View style={bannerStyles.row}>
          <Text style={[bannerStyles.description, { color: colors.onSurface }]}>
            <Text style={[bannerStyles.action, { color: colors.tertiary }]}>Updating</Text> an {entityType} (editing label, icon, color) will apply changes to all corresponding {recordType}.
          </Text>
        </View>
      </View>
    );
  };


  return (
    <ScreenWrapper background='background'>
      <Banner
        visible={showManageCategoryInfoBanner}
        actions={[
          {
            label: 'Got it',
            onPress: () => updateUiFlag('showManageCategoryInfoBanner', false),
          },
        ]}
        icon={({ size }) => (
          <Icon source="information-outline" size={size} color={colors.primary} />
        )}
        style={bannerStyles.banner}
      >
        {getBannerContent()}
      </Banner>

      <CategoryList
        categories={categories}
        onToggleCategory={handleToggle}
        onEditCategory={openEditDialog}
        onDeleteCategory={handleDelete}
        type={type}
      />

      <CategoryFormDialog
        visible={dialogState.mode !== null}
        mode={dialogState.mode || 'create'}
        initialData={dialogInitialData}
        onSubmit={handleSubmit}
        onDismiss={closeDialog}
        onFormChange={clearAlert}
        dialogTitle={dialogState.mode === 'create' ? labels.createTitle : labels.editTitle}
        submitLabel={dialogState.mode === 'create' ? labels.createButton : labels.updateButton}
        alertMessage={dialogState.alertMessage}
        type={type}
      />

      <Portal>
        <FAB
          visible={dialogState.mode === null && isFocused}
          icon="plus"
          label={type === 'income' ? 'Add source' : 'Add category'}
          style={[
            styles.fab,
            {
              bottom: insets.bottom + 20,
              right: insets.right + 16,
            }
          ]}
          onPress={openCreateDialog}
          variant={type === 'income' ? 'tertiary' : 'primary'}
          size="medium"
        />
      </Portal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const bannerStyles = StyleSheet.create({
  banner: {
    marginBottom: 0,
  },
  container: {
    gap: 6,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  action: {
    fontWeight: '700',
    fontSize: 14,
    minWidth: 50,
  },
  description: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
