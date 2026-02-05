import { LanguageOption } from "@/lib/types";
import { Platform, StyleSheet, View } from "react-native";
import { Icon, List } from "react-native-paper";
import { ThemedText } from "@/components/base/ThemedText";

interface SettingOptionListItemProps {
  option: LanguageOption;
  isSelected: boolean;
  onPress?: () => void;
  colors: any;
  leftIcon?: string;
}

const SettingOptionListItem = ({ option, isSelected, onPress, colors, leftIcon }: SettingOptionListItemProps) => {
  const styles = StyleSheet.create({
    listItem: {
      paddingHorizontal: 0,
      paddingVertical: 8,
      backgroundColor: colors.inverseOnSurface,
      borderRadius: 8,
      marginBottom: 8,
    },
    listItemTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    listItemDescription: {
      fontSize: 14,
      color: colors.muted,
    },
    comingSoonBadge: {
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
    },
    checkIconContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
    },
    comingSoonText: {
      color: colors.onPrimaryContainer,
      fontSize: 12,
      fontWeight: "600",
    },
  });

  return (
    <List.Item
      key={option.key}
      title={option.label}
      description={option.description}
      titleStyle={[
        styles.listItemTitle,
        !option.available && { opacity: 0.6 }
      ]}
      descriptionStyle={styles.listItemDescription}
      style={styles.listItem}
      left={(props) => (
        <List.Icon
          {...props}
          icon={leftIcon || (option.available ? "check-circle" : "clock-outline")}
          color={option.available ? colors.primary : colors.muted}
        />
      )}
      right={() => (
        <>
          {isSelected && option.available && (
            <View style={styles.checkIconContainer}>
              <Icon
                source="check"
                size={20}
                color={colors.primary}
              />
            </View>
          )}
          {!option.available && (
            <View style={styles.comingSoonBadge}>
              <ThemedText style={styles.comingSoonText}>
                Soon
              </ThemedText>
            </View>
          )}
        </>
      )}
      onPress={onPress}
      disabled={!option.available}
      rippleColor={colors.ripplePrimary}
      background={Platform.OS === 'android' ? { color: colors.ripplePrimary, foreground: true } : undefined}
    />
  );
};

export default SettingOptionListItem;