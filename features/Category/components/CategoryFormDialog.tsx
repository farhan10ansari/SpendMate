import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { Portal, Dialog, TextInput, Text, Surface } from 'react-native-paper';
import { IconSelector } from './IconSelector';
import { CategoryFormData } from '@/lib/types';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import ThemedButton from '@/components/ui/ThemedButton';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';
import { useHaptics } from '@/contexts/HapticsProvider';

interface CategoryFormDialogProps {
  visible: boolean;
  initialData?: CategoryFormData;
  mode: 'create' | 'edit';
  onSubmit: (data: CategoryFormData) => void;
  onDismiss: () => void;
  onFormChange?: () => void;
  dialogTitle?: string;
  submitLabel?: string;
  alertMessage?: string | null;
  type?: 'expense' | 'income';
}

const VALIDATION = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 24,
};

export const CategoryFormDialog = React.memo<CategoryFormDialogProps>(({
  visible,
  initialData,
  mode,
  onSubmit,
  onDismiss,
  onFormChange,
  dialogTitle = mode === 'create' ? 'Create' : 'Edit',
  submitLabel = mode === 'create' ? 'Create' : 'Update',
  alertMessage = null,
  type = 'expense',
}) => {
  const { colors } = useAppTheme();
  const { hapticImpact } = useHaptics();

  const [formData, setFormData] = useState<CategoryFormData>({
    title: '',
    icon: null,
    color: null,
    isCustom: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Reset form ONLY when dialog opens/closes or when switching between create/edit modes
  useEffect(() => {
    if (visible && !isInitialized) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          icon: initialData.icon,
          color: initialData.color,
          isCustom: initialData.isCustom
        });
      } else {
        setFormData({
          title: '',
          icon: null,
          color: null,
          isCustom: true
        })
      }
      setIsInitialized(true);
    } else if (!visible) {
      setIsInitialized(false);
    }
  }, [visible, initialData?.title, initialData?.icon, initialData?.color, isInitialized]);

  // Validation
  const validation = useMemo(() => {
    const trimmedTitle = formData.title.trim();
    const titleLength = trimmedTitle.length;

    return {
      isValid: titleLength >= VALIDATION.MIN_LENGTH &&
        titleLength <= VALIDATION.MAX_LENGTH &&
        !!formData.icon &&
        !!formData.color,
      titleError: titleLength > 0 && titleLength < VALIDATION.MIN_LENGTH
        ? `Name must be at least ${VALIDATION.MIN_LENGTH} characters`
        : titleLength > VALIDATION.MAX_LENGTH
          ? `Name must be less than ${VALIDATION.MAX_LENGTH} characters`
          : null,
    };
  }, [formData]);

  // Form handlers
  const handleTitleChange = useCallback((title: string) => {
    setFormData(prev => ({ ...prev, title }));
    onFormChange?.();
  }, [onFormChange]);

  const handleIconSelect = useCallback(({ icon, color }: { icon: IconSource, color: string }) => {
    hapticImpact();
    setFormData(prev => ({ ...prev, icon, color }));
    onFormChange?.();
  }, [onFormChange]);

  const handleSubmit = useCallback(async () => {
    if (!validation.isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const submitData: CategoryFormData = {
        title: formData.title.trim(),
        icon: formData.icon,
        color: formData.color,
        isCustom: formData.isCustom
      };
      onSubmit(submitData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validation.isValid, isSubmitting, onSubmit]);

  if (!visible) return null;

  return (
    <Portal>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
          <Dialog.Title style={styles.title}>{dialogTitle}</Dialog.Title>

          <Dialog.Content style={styles.content}>
            {/* Alert Message */}
            {alertMessage && (
              <Surface
                style={[styles.alert, {
                  backgroundColor: colors.errorContainer,
                  borderColor: colors.error
                }]}
                elevation={0}
              >
                <Text variant="bodySmall" style={{ color: colors.onErrorContainer }}>
                  {alertMessage}
                </Text>
              </Surface>
            )}

            {/* Category Name Input */}
            <TextInput
              label="Category Name"
              value={formData.title}
              onChangeText={handleTitleChange}
              mode="outlined"
              maxLength={VALIDATION.MAX_LENGTH}
              autoFocus={!alertMessage}
              dense
              error={!!validation.titleError}
              style={styles.textInput}
            />

            {/* Validation Error */}
            {validation.titleError && (
              <Text variant="bodySmall" style={[styles.errorText, { color: colors.error }]}>
                {validation.titleError}
              </Text>
            )}

            {/* Icon Selector */}
            <IconSelector
              selectedIcon={formData.icon}
              onIconSelect={handleIconSelect}
            />
          </Dialog.Content>

          <Dialog.Actions style={styles.actions}>
            <ThemedButton
              onPress={onDismiss}
              mode='text'
              compact
              colorType='secondary'
            >
              Cancel
            </ThemedButton>

            <ThemedButton
              mode="contained"
              onPress={handleSubmit}
              disabled={!validation.isValid || isSubmitting}
              loading={isSubmitting}
              compact
              colorType='primary'
              themedBorder
            >
              {submitLabel}
            </ThemedButton>
          </Dialog.Actions>
        </Dialog>
      </KeyboardAvoidingView>
    </Portal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  dialog: {
    borderRadius: 24,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 16,
    paddingBottom: 8,
  },
  content: {
    paddingBottom: 8,
    gap: 12,
  },
  textInput: {
    borderRadius: 16,
    marginBottom: 4,
  },
  alert: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 4,
    marginLeft: 12,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

CategoryFormDialog.displayName = 'CategoryFormDialog';
