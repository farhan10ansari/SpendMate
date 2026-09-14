import type { ExpenseData } from "@/features/Expense/ExpenseStoreProvider";
import type { IncomeData } from "@/features/Income/IncomeStoreProvider";

// Validation result types
type ValidationResult = { isValid: true } | { isValid: false, errorMessage: string }

type AmountValidationOptions = {
    decimalPlaces: number;
    formatCurrency: (amount: number) => string;
};

const validateAmount = (amount: string, { decimalPlaces, formatCurrency }: AmountValidationOptions): ValidationResult => {
    // Match the decimal notation accepted by AmountInput, without parseFloat's
    // partial parsing (for example, "1abc" must not become 1).
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(amount) || !Number.isFinite(Number(amount))) {
        return { isValid: false, errorMessage: 'Please enter a valid amount' };
    }

    const minimumAmount = 10 ** -decimalPlaces;
    if (Number(amount) < minimumAmount) {
        return { isValid: false, errorMessage: `Minimum amount should be ${formatCurrency(minimumAmount)}` };
    }
    return { isValid: true };
};

// Extracted validation functions
export const validateExpenseData = (expense: ExpenseData, options: AmountValidationOptions): ValidationResult => {
    const { amount, category, datetime } = expense;
    const missingFields = [];

    if (!amount) missingFields.push('amount');
    const amountValidation = validateAmount(amount, options);
    if (!amountValidation.isValid) return amountValidation;

    if (!category) missingFields.push('category');
    if (!datetime) missingFields.push('datetime');

    if (!amount || !category || !datetime) {
        if(!category) {
            return {
                isValid: false,
                errorMessage: 'Please select a category'
            };
        }

        return {
            isValid: false,
            errorMessage: `Please fill the missing fields i.e. ${missingFields.join(', ')}`
        };
    }

    return { isValid: true };
};

export const validateIncomeData = (income: IncomeData, options: AmountValidationOptions): ValidationResult => {
    const { amount, source, dateTime } = income;
    const missingFields = [];

    if (!amount) missingFields.push('amount');
    const amountValidation = validateAmount(amount, options);
    if (!amountValidation.isValid) return amountValidation;

    if (!source) missingFields.push('source');
    if (!dateTime) missingFields.push('date');

    if (!amount || !source || !dateTime) {
        if(!source) {
            return {
                isValid: false,
                errorMessage: 'Please select a source'
            };
        }

        return {
            isValid: false,
            errorMessage: `Please fill the missing fields i.e. ${missingFields.join(', ')}`
        };
    }

    return { isValid: true };
};
