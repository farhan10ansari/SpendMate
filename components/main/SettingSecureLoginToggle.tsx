import { useLocalAuth } from "@/contexts/LocalAuthProvider";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { useCallback } from "react";
import { Platform, StyleSheet } from "react-native";
import { List, Switch } from "react-native-paper";

const SettingSecureLoginToggle = ({ showSuccessSnackbar = true }: { showSuccessSnackbar?: boolean }) => {
    const { colors } = useAppTheme();
    const {
        biometricLogin,
        isAuthenticationSupported,
        handleBiometricLoginToggle,
    } = useLocalAuth();

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
    })

    const onToggle = useCallback((value: boolean) => {
        if (isAuthenticationSupported) {
            handleBiometricLoginToggle(value, showSuccessSnackbar);
        }
    }, [handleBiometricLoginToggle, isAuthenticationSupported, showSuccessSnackbar]);

    return (
        <List.Item
            title="Enable Secure Login"
            description={
                !isAuthenticationSupported
                    ? "Secure Login not supported on this device. Please set up device security (PIN, Pattern, Password, or Biometrics) to enable."
                    : "Use biometrics or device lock to unlock the app"
            }
            titleStyle={[
                styles.listItemTitle,
                !isAuthenticationSupported && { opacity: 0.6 }
            ]}
            descriptionStyle={styles.listItemDescription}
            style={styles.listItem}
            descriptionNumberOfLines={6}
            left={(props) => (
                <List.Icon
                    {...props}
                    icon={
                        isAuthenticationSupported
                            ? (biometricLogin ? "fingerprint" : "fingerprint-off")
                            : "fingerprint-off"
                    }
                    color={
                        (isAuthenticationSupported && biometricLogin)
                            ? colors.primary
                            : colors.muted
                    }
                />
            )}
            right={() => (
                <Switch
                    value={biometricLogin}
                    onValueChange={onToggle}
                    disabled={!isAuthenticationSupported}
                    style={{
                        transform: [{ scale: 0.9 }],
                        opacity: (!isAuthenticationSupported) ? 0.6 : 1
                    }}
                />
            )}
            onPress={onToggle.bind(null, !biometricLogin)}
            disabled={!isAuthenticationSupported}
            rippleColor={colors.ripplePrimary}
            background={Platform.OS === 'android' ? { color: colors.ripplePrimary, foreground: true } : undefined}
        />
    )
};

export default SettingSecureLoginToggle;