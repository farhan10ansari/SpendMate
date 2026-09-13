import { Category, ColorType } from '@/lib/types';
import { ScrollView, StyleSheet, View } from 'react-native';
import ThemedButton from '@/components/ui/ThemedButton';
import { useHaptics } from '@/contexts/HapticsProvider';
import { useRouter } from 'expo-router';
import { getCategoryRows } from '@/lib/helpers';
import { useMemo } from 'react';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';

type CategoryInputProps = {
    categories: Category[];
    category: string | null;
    setCategory: (category: string) => void;
    colorType?: ColorType;
    type: "expense" | "income"
};

export default function CategoriesInput({ categories, category, setCategory, colorType = "primary", type }: CategoryInputProps) {
    const { colors } = useAppTheme()
    const { hapticImpact } = useHaptics()
    const router = useRouter();

    const styles = StyleSheet.create({
        categoriesMain: {
            flexDirection: 'column',
            gap: 10,
            paddingVertical: 3,
            paddingRight: 5,
        },
        categoryRow: {
            flexDirection: 'row',
            gap: 10,
        },
        categoryButtonStyle: {
            borderRadius: 16,
        },
        categoryButtonLabelStyle: {
            marginVertical: 8,
            marginHorizontal: 10,
        }
    });

    const { rows: categoryRows, noOfRows } = useMemo(() => getCategoryRows(categories), [categories])

    const handleNavigateToManage = () => {
        router.back()
        setTimeout(() => {
            router.push(type === 'expense' ? '/menu/(manage-categories)/expense-categories' : '/menu/(manage-categories)/income-sources');
        }, 300);
    }

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesMain}>
                {categoryRows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.categoryRow}>
                        {row.length > 0 && row.map((c) => (
                            <ThemedButton
                                compact
                                key={c.name}
                                icon={c.icon}
                                mode={c.name === category ? 'contained-tonal' : 'outlined'}
                                accessibilityState={{ selected: c.name === category }}
                                colorType={colorType}
                                style={styles.categoryButtonStyle}
                                labelStyle={styles.categoryButtonLabelStyle}
                                themedBorder
                                onPress={() => {
                                    hapticImpact();
                                    setCategory(c.name);
                                }}
                            >
                                {c.label}
                            </ThemedButton>
                        ))}

                        {/* Show manage button in the first row, after all categories */}
                        {((noOfRows === 1 && rowIndex === 0) || (noOfRows === 2 && rowIndex === 1)) && (
                            <>
                                {
                                    row.length === 0 && (
                                        <ThemedButton
                                            compact
                                            mode={"text"}
                                            style={styles.categoryButtonStyle}
                                            labelStyle={[styles.categoryButtonLabelStyle, { color: colors.muted }]}
                                            themedBorder
                                        >
                                            No {type === 'expense' ? "Categories" : "Sources"} Available
                                        </ThemedButton>
                                    )
                                }
                                <ThemedButton
                                    compact
                                    icon="cog-outline"
                                    mode='elevated'
                                    style={styles.categoryButtonStyle}
                                    colorType={type === "expense" ? "primary" : "tertiary"}
                                    labelStyle={styles.categoryButtonLabelStyle}
                                    onPress={handleNavigateToManage}
                                >
                                    {type === 'expense' ? "Manage Category" : "Manage Source"}
                                </ThemedButton>
                            </>
                        )}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
