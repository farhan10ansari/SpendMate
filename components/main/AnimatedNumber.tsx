import { useIsFocused } from "expo-router/react-navigation";
import { useSegments } from "expo-router";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import AnimatedNumbers from 'react-native-animated-numbers';


type Props = {
    value: number;
    fontStyle?: StyleProp<TextStyle>
    containerStyle?: StyleProp<ViewStyle>
}

export default function AnimatedNumber({ value, fontStyle, containerStyle }: Props) {
    const segments = useSegments();
    const isFocused = useIsFocused();
    const displayValue = !isFocused && (segments as string[]).includes("(tabs)") ? 0 : value;

    return (
        <AnimatedNumbers
            includeComma
            animateToNumber={displayValue} // Use displayValue instead
            animationDuration={2000}
            fontStyle={fontStyle}
            containerStyle={containerStyle}
        />
    );
}
