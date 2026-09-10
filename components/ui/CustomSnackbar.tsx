import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { memo } from "react";
import { Portal, Snackbar, SnackbarProps } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface CustomSnackbarProps extends SnackbarProps {
    type?: "error" | "success" | "info" | "warning";
    usePortal?: boolean;
    position?: "top" | "bottom";
    offset?: number;
}

function CustomSnackbar(props: CustomSnackbarProps) {
    const {
        type = "info",
        usePortal = false,
        position,
        offset = 0,
        children,
        style,
        wrapperStyle,
        ...rest
    } = props;

    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    
    // Get theme colors based on snackbar type
    const getThemeColors = () => {
        switch (type) {
            case "error":
                return {
                    inverseSurface: colors.error,
                    inverseOnSurface: colors.onError,
                };
            case "success":
                return {
                    inverseSurface: colors.secondary,
                    inverseOnSurface: colors.onSecondary,
                };
            case "info":
                return {
                    inverseSurface: colors.secondary,
                    inverseOnSurface: colors.onSecondary,
                };
            case "warning":
                return {
                    inverseSurface: colors.tertiary,
                    inverseOnSurface: colors.onTertiary,
                };
            default:
                return {
                    inverseSurface: colors.inverseSurface,
                    inverseOnSurface: colors.inverseOnSurface,
                };
        }
    };

    const snackbar = (
        <Snackbar
            {...rest}
            style={[style]}
            wrapperStyle={[
                position === "top" && { top: offset + insets.top },
                position === "bottom" && { bottom: offset },
                wrapperStyle,
            ]}
            theme={{ colors: getThemeColors() }}
        >
            {children}
        </Snackbar>
    );

    return usePortal ? (
        <Portal>
            {snackbar}
        </Portal>
    ) : (
        snackbar
    );
}

export default memo(CustomSnackbar, (prevProps, nextProps) => {
    return (
        prevProps.visible === nextProps.visible &&
        prevProps.type === nextProps.type // Also compare type to handle color changes
    );
});
