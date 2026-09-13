import { useLocalAuth } from "@/contexts/LocalAuthProvider";
import { useCallback } from "react";
import SettingSwitchListItem from './SettingSwitchListItem';

const SettingSecureLoginToggle = ({ showSuccessSnackbar = true }: { showSuccessSnackbar?: boolean }) => {
    const { biometricLogin, isAuthenticationSupported, handleBiometricLoginToggle } = useLocalAuth();
    const onToggle = useCallback((value: boolean) => {
        if (isAuthenticationSupported) {
            handleBiometricLoginToggle(value, showSuccessSnackbar);
        }
    }, [handleBiometricLoginToggle, isAuthenticationSupported, showSuccessSnackbar]);

    return (
        <SettingSwitchListItem
            title="Secure login"
            description={isAuthenticationSupported
                ? "Unlock SpendMate with biometrics or your device lock"
                : "Set up a device PIN, password, or biometrics to enable secure login."}
            value={biometricLogin}
            disabled={!isAuthenticationSupported}
            onValueChange={onToggle}
            leftIcon={isAuthenticationSupported && biometricLogin ? 'fingerprint' : 'fingerprint-off'}
        />
    );
};

export default SettingSecureLoginToggle;
