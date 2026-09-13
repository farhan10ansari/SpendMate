import { paymentMethods } from "@/lib/constants";
import { PaymentMethod } from "@/lib/types";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import ThemedButton from "../ui/ThemedButton";
import { useHaptics } from "@/contexts/HapticsProvider";

type PaymentMethodInputProps = {
    paymentMethod: string | undefined | null;
    setPaymentMethod: (method: PaymentMethod["name"] | undefined) => void;
}

export default function PaymentMethodInput({ paymentMethod, setPaymentMethod }: PaymentMethodInputProps) {
    const { hapticImpact } = useHaptics();
    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 5,
        },
        buttonStyle: {
            borderRadius: 20,
            paddingHorizontal: 5
        },
        buttonLabelStyle: {
            marginVertical: 8,
            marginHorizontal: 10,

        },
    });


    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.container}>
                {paymentMethods.map((method) => (
                    <ThemedButton
                        compact
                        key={method.name}
                        mode={paymentMethod === method.name ? "contained" : "elevated"}
                        accessibilityState={{ selected: paymentMethod === method.name }}
                        icon={method.icon}
                        colorType="tertiary"
                        style={styles.buttonStyle}
                        labelStyle={styles.buttonLabelStyle}
                        onPress={() => {
                            hapticImpact()
                            setPaymentMethod(method.name)
                        }}
                    >
                        {method.label}
                    </ThemedButton>
                ))}
            </View>
        </ScrollView>
    );
}
