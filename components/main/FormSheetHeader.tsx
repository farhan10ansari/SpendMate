import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Divider, IconButton } from "react-native-paper";
import SheetGrabber from "../ui/SheetGrabber";
import { useHaptics } from "@/contexts/HapticsProvider";

type FormSheetHeaderProps = {
    title: string | React.ReactNode;
    onClose?: () => void;
    headerStyle?: StyleProp<ViewStyle>;
};

export default function FormSheetHeader({ title, onClose, headerStyle }: FormSheetHeaderProps) {
    const { colors } = useAppTheme();
    const { hapticImpact } = useHaptics();

    const styles = StyleSheet.create({
        row: {
            paddingHorizontal: 24,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        headerText: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text,
            flex: 1,
            textAlign: 'left',
        },
    });

    const renderTitle = () => {
        if (typeof title === 'string') {
            return <Text style={styles.headerText}>{title}</Text>;
        }
        return title;
    };

    return (
        <>
            <View>
                <SheetGrabber />
                <View style={[styles.row, headerStyle]}>
                    {renderTitle()}
                    {onClose && (
                        <IconButton
                            icon="close"
                            size={15}
                            accessibilityLabel="Close"
                            onPress={() => {
                                hapticImpact();
                                onClose();
                            }}
                            style={{ marginRight: -8, marginLeft: 8 }}
                            mode="contained-tonal"
                        />
                    )}
                </View>
            </View>
            <Divider />
        </>
    );
}
