import { Category, PeriodExpenseStats, PeriodIncomeStats } from "./types";

export interface FinancialSummary {
    netIncome: number;
    savingsRate: number; // percentage
    // incomeExpenseRatio: number;
}

export const getFinancialSummary = (
    expenseStats: PeriodExpenseStats,
    incomeStats: PeriodIncomeStats
): FinancialSummary => {
    const netIncome = parseFloat((incomeStats.total - expenseStats.total).toFixed(2));
    const savingsRate = incomeStats.total > 0
        ? parseFloat(((netIncome / incomeStats.total) * 100).toFixed(2))
        : 0;
    // const incomeExpenseRatio = expenseStats.total > 0
    //     ? parseFloat((incomeStats.total / expenseStats.total).toFixed(2))
    //     : incomeStats.total > 0 ? Infinity : 1;

    return {
        netIncome,
        savingsRate,
        // incomeExpenseRatio,
    };
};

export const getCategoryRows = (categories: Category[]): { rows: Category[][], noOfRows: number } => {
    const rows: Category[][] = [[], []];

    if (categories.length < 5) {
        categories.forEach((category) => {
            rows[0].push(category);
        });
        return { rows, noOfRows: 1 }
    }

    categories.forEach((category, index) => {
        rows[index % 2].push(category);
    });

    return { rows, noOfRows: 2 }
};


// export const sortExpenseCategoriesByUsage = async (): Promise<void> => {
//     const { categories, setCategories } = useExpenseCategoriesStore.getState();

//     // Keep a deep copy of original categories using lodash
//     const originalCategories = lodash.cloneDeep(categories);

//     try {
//         // Get the category occurrence counts as key-value object
//         const categoryCounts = await getCategoriesWithCountsKV();

//         // Sort categories by their usage counts (descending order)
//         const sortedCategories = [...categories].sort((a, b) => {
//             const countA = categoryCounts[a.name] ?? 0;
//             const countB = categoryCounts[b.name] ?? 0;
//             return countB - countA;
//         });

//         // Update the store with sorted categories
//         setCategories(sortedCategories);
//     } catch (error) {
//         console.error('Error sorting categories by usage:', error);

//         // Reset to original categories on any error
//         setCategories(originalCategories);

//         // Re-throw the error so calling code can handle it
//         throw error;
//     }
// };


// export const sortIncomeSourcesByUsage = async (): Promise<void> => {
//   const { sources, setSources } = useIncomeSourcesStore.getState();
  
//   // Keep a deep copy of original sources using lodash
//   const originalSources = lodash.cloneDeep(sources);

//   try {
//     // Get the income source occurrence counts as key-value object
//     const sourceCounts = await getIncomeSourcesWithCountsKV();

//     // Sort sources by their usage counts (descending order)
//     const sortedSources = [...sources].sort((a, b) => {
//       const countA = sourceCounts[a.name] ?? 0;
//       const countB = sourceCounts[b.name] ?? 0;
//       return countB - countA;
//     });

//     // Update the store with sorted sources
//     setSources(sortedSources);
//   } catch (error) {
//     console.error('Error sorting income sources by usage:', error);
    
//     // Reset to original sources on any error
//     setSources(originalSources);
    
//     // Re-throw the error so calling code can handle it
//     throw error;
//   }
// };
