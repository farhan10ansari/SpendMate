import { StyleSheet, View, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from "react-native";
import { ThemedText } from "@/components/base/ThemedText";
import { tryCatch } from "@/lib/try-catch";
import { seedDummyExpenses, seedDummyIncome } from "@/repositories/DevRepo";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Icon, TextInput } from "react-native-paper";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import usePersistentAppStore from "@/stores/usePersistentAppStore";
import { useRouter } from "expo-router";
import { useHaptics } from "@/contexts/HapticsProvider";
import { useSnackbar } from "@/contexts/GlobalSnackbarProvider";
import { useExpenseCategories, useIncomeSources } from "@/contexts/CategoryDataProvider";


export default function DevOptionsScreen() {
  const queryClient = useQueryClient();
  const { colors } = useAppTheme();
  const router = useRouter();
  const [numberOfExpenses, setNumberOfExpenses] = useState(0);
  const [numberOfIncomes, setNumberOfIncomes] = useState(0);
  const updateUIFlag = usePersistentAppStore((state) => state.updateUIFlag);
  const { hapticNotify } = useHaptics();
  const { showSnackbar } = useSnackbar();
  const categories = useExpenseCategories()
  const sources = useIncomeSources()

  // Helper function to validate and clamp input values
  const validateInput = (value: string): number => {
    const num = Number(value) || 0;
    return Math.max(0, Math.min(1000, num));
  };

  // Check if input is valid (between 1-1000)
  const isValidInput = (value: number): boolean => {
    return value >= 1 && value <= 1000;
  };

  const handleExpenseInputChange = (text: string) => {
    const validatedValue = validateInput(text);
    setNumberOfExpenses(validatedValue);
  };

  const handleIncomeInputChange = (text: string) => {
    const validatedValue = validateInput(text);
    setNumberOfIncomes(validatedValue);
  };

  const handleInsertDummyExpenses = async () => {
    if (!isValidInput(numberOfExpenses)) return;

    const { error } = await tryCatch(seedDummyExpenses(categories, numberOfExpenses));
    if (!error) {
      hapticNotify("success");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });

      showSnackbar({
        message: `Added ${numberOfExpenses} dummy expenses!`,
        duration: 3000,
        type: "success",
      });
      setNumberOfExpenses(0);
    } else {
      hapticNotify("error");
      showSnackbar({
        message: "Failed to add dummy expenses. Please try again.",
        duration: 3000,
        type: "error"
      });
    }
    Keyboard.dismiss();
  };

  const handleInsertDummyIncomes = async () => {
    if (!isValidInput(numberOfIncomes)) return;

    const { error } = await tryCatch(seedDummyIncome(sources, numberOfIncomes));
    if (!error) {
      hapticNotify("success");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      showSnackbar({
        message: `Added ${numberOfIncomes} dummy incomes!`,
        duration: 3000,
        type: "success"
      });
      setNumberOfIncomes(0);
      Keyboard.dismiss();
    } else {
      hapticNotify("error");
      showSnackbar({
        message: "Failed to add dummy incomes. Please try again.",
        duration: 3000,
        type: "error"
      });
    }
    Keyboard.dismiss();
  };

  const handleDisableDevOptions = () => {
    updateUIFlag("showDevOptions", false);
    showSnackbar({
      message: "Developer options disabled",
      duration: 3000,
      type: "success",
      position: "bottom",
      offset: 1,
    });
    // Delay navigation to allow snackbar to show
    setTimeout(() => {
      router.back();
    }, 1000);
  };

  return (
    <ScreenWrapper
      background="background"
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Warning Section */}
            <View style={[styles.warningContainer, { backgroundColor: colors.errorContainer }]}>
              <View style={styles.warningIconWrapper}>
                <Icon
                  source="alert-circle"
                  size={20}
                  color={colors.onErrorContainer}
                />
              </View>
              <ThemedText style={[styles.warningText, { color: colors.onErrorContainer }]}>
                This section is for development purposes only. Use dummy data to test the app functionality.
              </ThemedText>
            </View>

            {/* Dummy Expenses Section */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <View style={styles.sectionHeader}>
                <Icon
                  source="receipt"
                  size={24}
                  color={colors.primary}
                />
                <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>
                  Add Dummy Expenses
                </ThemedText>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Number of Expenses"
                  keyboardType="numeric"
                  style={{ backgroundColor: colors.surface }}
                  onChangeText={handleExpenseInputChange}
                  value={numberOfExpenses.toString()}
                  mode="outlined"
                  right={<TextInput.Icon icon="counter" />}
                  error={numberOfExpenses > 0 && !isValidInput(numberOfExpenses)}
                />
                <ThemedText style={[styles.helperText, { color: colors.muted }]}>
                  Enter a number between 1 and 1000
                </ThemedText>
              </View>

              <Button
                mode="contained"
                style={styles.button}
                onPress={handleInsertDummyExpenses}
                disabled={!isValidInput(numberOfExpenses)}
                icon="plus-circle"
              >
                Insert {numberOfExpenses} Dummy Expenses
              </Button>
            </View>

            {/* Dummy Incomes Section */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <View style={styles.sectionHeader}>
                <Icon
                  source="cash-plus"
                  size={24}
                  color={colors.primary}
                />
                <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>
                  Add Dummy Incomes
                </ThemedText>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Number of Incomes"
                  keyboardType="numeric"
                  style={{ backgroundColor: colors.surface }}
                  onChangeText={handleIncomeInputChange}
                  value={numberOfIncomes.toString()}
                  mode="outlined"
                  right={<TextInput.Icon icon="counter" />}
                  error={numberOfIncomes > 0 && !isValidInput(numberOfIncomes)}
                />
                <ThemedText style={[styles.helperText, { color: colors.muted }]}>
                  Enter a number between 1 and 1000
                </ThemedText>
              </View>

              <Button
                mode="contained"
                style={styles.button}
                onPress={handleInsertDummyIncomes}
                disabled={!isValidInput(numberOfIncomes)}
                icon="plus-circle"
              >
                Insert {numberOfIncomes} Dummy Incomes
              </Button>
            </View>

            {/* Disable Dev Options Section */}
            <View style={[styles.sectionContainer, styles.disableSection, { backgroundColor: colors.surface, shadowColor: colors.shadow, borderColor: colors.error }]}>
              <View style={styles.sectionHeader}>
                <Icon
                  source="close-circle"
                  size={20}
                  color={colors.error}
                />
                <ThemedText style={[styles.sectionTitle, { color: colors.error, fontSize: 16 }]}>
                  Disable Dev Options
                </ThemedText>
              </View>

              <ThemedText style={{ color: colors.muted, marginBottom: 12, fontSize: 13 }}>
                Hide dev options from menu (re-enable by tapping version 5x from About screen)
              </ThemedText>

              <Button
                mode="outlined"
                style={styles.button}
                onPress={handleDisableDevOptions}
                icon="close"
                textColor={colors.error}
                buttonColor="transparent"
              >
                Disable
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContentContainer: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  sectionContainer: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    elevation: 0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  warningContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  warningIconWrapper: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  disableSection: {
    borderWidth: 1,
  },
});
