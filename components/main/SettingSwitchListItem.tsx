import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { List, Switch } from "react-native-paper";

interface SettingSwitchListItemProps {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    leftIcon: string;
    disabled?: boolean;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>
}

const SettingSwitchListItem = ({
    title,
    description,
    value,
    onValueChange,
    leftIcon,
    disabled = false,
    onPress,
    style
}: SettingSwitchListItemProps) => {
    const { colors } = useAppTheme();
    const styles = StyleSheet.create({
        card: {
            alignSelf: "stretch",
            backgroundColor: colors.inverseOnSurface,
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 8,
        },
        listItem: {
            paddingHorizontal: 0,
            paddingVertical: 8,
        },
        listItemTitle: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
        },
        listItemDescription: {
            fontSize: 12,
            color: colors.muted,
        },
    });

    return (
        <View style={[styles.card, style]}>
            <List.Item
                title={title}
                titleNumberOfLines={2}
                description={description}
                descriptionNumberOfLines={5}
                titleStyle={[
                    styles.listItemTitle,
                    disabled && { opacity: 0.6 }
                ]}
                descriptionStyle={styles.listItemDescription}
                style={styles.listItem}
                left={(props) => (
                    <List.Icon
                        {...props}
                        icon={leftIcon}
                        color={value && !disabled ? colors.primary : colors.muted}
                    />
                )}
                right={() => (
                    <Switch
                        value={value && !disabled}
                        onValueChange={onValueChange}
                        disabled={disabled}
                        style={{
                            transform: [{ scale: 0.9 }],
                            opacity: disabled ? 0.6 : 1
                        }}
                    />
                )}
                onPress={onPress || (() => !disabled && onValueChange(!value))}
                disabled={disabled}
            />
        </View>
    );
};

export default SettingSwitchListItem;
