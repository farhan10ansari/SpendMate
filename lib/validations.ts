import { ExpenseData } from "@/features/Expense/ExpenseStoreProvider";
import { IncomeData } from "@/features/Income/IncomeStoreProvider";

// Validation result types
type ValidationResult = { isValid: true } | { isValid: false, errorMessage: string }

// Extracted validation functions
export const validateExpenseData = (expense: ExpenseData): ValidationResult => {
    const { amount, category, datetime } = expense;
    const missingFields = [];

    if (!amount) missingFields.push('amount');
    const actualAmount = parseFloat(amount ? amount : '0');
    if (actualAmount < 1) {
        return {
            isValid: false,
            errorMessage: 'Minimum amount should be ₹1'
        };
    }

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

export const validateIncomeData = (income: IncomeData): ValidationResult => {
    const { amount, source, dateTime } = income;
    const missingFields = [];

    if (!amount) missingFields.push('amount');
    const actualAmount = parseFloat(amount ? amount : '0');
    if (actualAmount < 1) {
        return {
            isValid: false,
            errorMessage: 'Minimum amount should be ₹1'
        };
    }

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
