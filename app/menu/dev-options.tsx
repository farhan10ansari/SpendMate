import { StyleSheet, View, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from "react-native";
import { ThemedText } from "@/components/base/ThemedText";
import { tryCatch } from "@/lib/try-catch";
import { seedDummyExpenses, seedDummyIncome } from "@/repositories/DevRepo";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
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
            contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.intro}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primaryContainer }]}>
                <Icon source="flask-outline" size={24} color={colors.onPrimaryContainer} />
              </View>
              <View style={styles.headerCopy}>
                <ThemedText style={[styles.sectionTitle, { color: colors.onSurface }]}>Your testing toolkit</ThemedText>
                <ThemedText style={[styles.helperText, { color: colors.onSurfaceVariant }]}>Explore the app with sample records.</ThemedText>
              </View>
            </View>
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
                For testing only. Sample records are added to your real data and affect your totals. Back up your records first.
              </ThemedText>
            </View>

            {/* Dummy Expenses Section */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Icon source="receipt-text-outline" size={22} color={colors.onPrimaryContainer} />
                </View>
                <View style={styles.headerCopy}>
                  <ThemedText style={[styles.sectionTitle, { color: colors.onSurface }]}>Sample expenses</ThemedText>
                  <ThemedText style={[styles.helperText, { color: colors.onSurfaceVariant }]}>Test your spending lists and charts.</ThemedText>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Number of Expenses"
                  keyboardType="numeric"
                  style={{ backgroundColor: colors.surface }}
                  onChangeText={handleExpenseInputChange}
                  value={numberOfExpenses.toString()}
                  mode="outlined"
                  dense
                  outlineStyle={{ borderRadius: 14 }}
                  right={<TextInput.Icon icon="counter" />}
                  error={numberOfExpenses > 0 && !isValidInput(numberOfExpenses)}
                />
                <ThemedText style={[styles.helperText, { color: colors.onSurfaceVariant }]}>
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
                Add {numberOfExpenses || ""} sample expenses
              </Button>
            </View>

            {/* Dummy Incomes Section */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconBadge, { backgroundColor: colors.tertiaryContainer }]}>
                  <Icon source="cash-plus" size={22} color={colors.onTertiaryContainer} />
                </View>
                <View style={styles.headerCopy}>
                  <ThemedText style={[styles.sectionTitle, { color: colors.onSurface }]}>Sample income</ThemedText>
                  <ThemedText style={[styles.helperText, { color: colors.onSurfaceVariant }]}>Test your income lists and insights.</ThemedText>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Number of Incomes"
                  keyboardType="numeric"
                  style={{ backgroundColor: colors.surface }}
                  onChangeText={handleIncomeInputChange}
                  value={numberOfIncomes.toString()}
                  mode="outlined"
                  dense
                  outlineStyle={{ borderRadius: 14 }}
                  right={<TextInput.Icon icon="counter" />}
                  error={numberOfIncomes > 0 && !isValidInput(numberOfIncomes)}
                />
                <ThemedText style={[styles.helperText, { color: colors.onSurfaceVariant }]}>
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
                Add {numberOfIncomes || ""} sample incomes
              </Button>
            </View>

            {/* Finished testing? Section */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <View style={styles.sectionHeader}>
                <Icon
                  source="eye-off-outline"
                  size={20}
                  color={colors.onSurfaceVariant}
                />
                <ThemedText style={[styles.sectionTitle, { color: colors.onSurface, fontSize: 16 }]}>
                  Disable Dev Options
                </ThemedText>
              </View>

              <ThemedText style={{ color: colors.onSurfaceVariant, marginBottom: 12, fontSize: 13 }}>
                Hide these tools from the menu. To bring them back, tap the version five times on the About page.
              </ThemedText>

              <Button
                mode="outlined"
                style={styles.button}
                onPress={handleDisableDevOptions}
                icon="close"
                textColor={colors.primary}
                buttonColor="transparent"
              >
                Hide developer options
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
  },
  scrollContentContainer: {
    padding: 16,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  sectionContainer: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 4,
  },
  button: {
    marginTop: 8,
    borderRadius: 14,
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
  intro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1 },
});
