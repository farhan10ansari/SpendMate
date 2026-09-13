import React, { useRef } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/components/base/ThemedText";
import { useAppTheme } from "@/themes/providers/AppThemeProviders";
import * as Linking from "expo-linking";
import { ScreenWrapper } from "@/components/main/ScreenWrapper";
import usePersistentAppStore from "@/stores/usePersistentAppStore";
import { useHaptics } from "@/contexts/HapticsProvider";
import { useSnackbar } from "@/contexts/GlobalSnackbarProvider";
import { Icon } from "react-native-paper";


const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION;
const APP_AUTHOR = process.env.EXPO_PUBLIC_APP_AUTHOR;
const TELEGRAM_URL = process.env.EXPO_PUBLIC_TELEGRAM_URL;
const CONTACT_EMAIL = process.env.EXPO_PUBLIC_CONTACT_EMAIL;
const FEEDBACK_FORM = process.env.EXPO_PUBLIC_FEEDBACK_FORM;
const PRIVACY_POLICY = process.env.EXPO_PUBLIC_PRIVACY_POLICY;


export default function AboutScreen() {
    const { colors } = useAppTheme();
    const showDevOptions = usePersistentAppStore((state) => state.uiFlags.showDevOptions);
    const updateUiFlag = usePersistentAppStore((state) => state.updateUIFlag);
    const { hapticNotify } = useHaptics();
    const { showSnackbar } = useSnackbar();


    const tapCountRef = useRef(0);
    const lastTapTimeRef = useRef(0);


    const handleRepoPress = () => {
        Linking.openURL("https://github.com/farhan10ansari/SpendMate");
    };


    const handleTelegramPress = () => {
        if (TELEGRAM_URL) {
            Linking.openURL(TELEGRAM_URL);
        }
    };


    const handleEmailPress = () => {
        if (CONTACT_EMAIL) {
            Linking.openURL(`mailto:${CONTACT_EMAIL}`);
        }
    };


    const handleFeedbackPress = () => {
        if (FEEDBACK_FORM) {
            Linking.openURL(FEEDBACK_FORM);
        }
    };

    const handlePrivacyPolicyPress = () => {
        if (PRIVACY_POLICY) {
            Linking.openURL(PRIVACY_POLICY);
        }
    }


    const handleVersionTap = () => {
        const now = Date.now();
        if (now - lastTapTimeRef.current > 2000) tapCountRef.current = 0;
        tapCountRef.current += 1;
        lastTapTimeRef.current = now;


        if (showDevOptions) {
            showSnackbar({
                message: "Dev options already enabled",
                duration: 2000,
                type: "success",
            });
            hapticNotify("warning");
            tapCountRef.current = 0;
            return;
        }


        if (tapCountRef.current >= 5) {
            updateUiFlag("showDevOptions", true);
            showSnackbar({
                message: "Dev options enabled",
                duration: 2000,
                actionLabel: 'Dismiss',
                actionIcon: 'close',
                type: "success",
            });
            hapticNotify("success");
            tapCountRef.current = 0;
        }
    };


    return (
        <ScreenWrapper background="background" withScrollView contentContainerStyle={pageStyles.content}>
            <View style={[pageStyles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[pageStyles.logo, { backgroundColor: colors.primaryContainer }]}>
                    <Icon source="wallet-outline" size={32} color={colors.primary} />
                </View>
                <ThemedText style={pageStyles.appName}>SpendMate</ThemedText>
                <ThemedText color={colors.muted} style={pageStyles.tagline}>A little clarity for your everyday money.</ThemedText>
                {APP_AUTHOR && <ThemedText color={colors.muted} style={pageStyles.author}>Made by {APP_AUTHOR}</ThemedText>}
                <Pressable onPress={handleVersionTap} accessibilityRole="button"
                    accessibilityLabel={`Version ${APP_VERSION ?? 'Unknown'}`}
                    accessibilityHint="Tap five times quickly to enable developer options"
                    style={({ pressed }) => [pageStyles.version, { backgroundColor: colors.surfaceVariant, opacity: pressed ? 0.7 : 1 }]}>
                    <Icon source="tag-outline" size={15} color={colors.primary} />
                    <ThemedText color={colors.primary} style={pageStyles.versionText}>Version {APP_VERSION ?? 'Unknown'}</ThemedText>
                </Pressable>
            </View>

            <AboutGroup title="Community">
                <AboutItem icon="github" title="GitHub" description="Explore the code or report an issue" onPress={handleRepoPress} />
                {TELEGRAM_URL && <AboutItem icon="send" title="Telegram" description="Updates and conversations with the community" onPress={handleTelegramPress} />}
            </AboutGroup>
            {(CONTACT_EMAIL || FEEDBACK_FORM) && (
                <AboutGroup title="Support & feedback">
                    {CONTACT_EMAIL && <AboutItem icon="email-outline" title="Get in touch" description="Questions or need a hand? Send us an email" onPress={handleEmailPress} />}
                    {FEEDBACK_FORM && <AboutItem icon="message-outline" title="Share feedback" description="Help shape what comes next" onPress={handleFeedbackPress} />}
                </AboutGroup>
            )}
            {PRIVACY_POLICY && (
                <AboutGroup title="Privacy">
                    <AboutItem icon="shield-check-outline" title="Privacy policy" description="Learn how your data is handled" onPress={handlePrivacyPolicyPress} />
                </AboutGroup>
            )}
            <ThemedText color={colors.muted} style={pageStyles.footer}>Tap the version five times quickly to enable developer options.</ThemedText>
        </ScreenWrapper>
    );
}

function AboutGroup({ title, children }: { title: string; children: React.ReactNode }) {
    const { colors } = useAppTheme();
    return (
        <View style={pageStyles.group}>
            <View style={pageStyles.groupHeading}>
                <ThemedText color={colors.muted} style={pageStyles.groupTitle}>{title}</ThemedText>
                <View style={[pageStyles.line, { backgroundColor: colors.border }]} />
            </View>
            {children}
        </View>
    );
}

const pageStyles = StyleSheet.create({
    content: { padding: 16, paddingBottom: 32, gap: 18, width: '100%', maxWidth: 720, alignSelf: 'center' },
    hero: { padding: 22, borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', gap: 8 },
    logo: { padding: 14, borderRadius: 22, marginBottom: 4 },
    appName: { fontSize: 28, lineHeight: 36, fontWeight: '800' },
    tagline: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
    author: { fontSize: 11, lineHeight: 17 },
    version: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    versionText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
    group: { gap: 8 },
    groupHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
    groupTitle: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
    line: { flex: 1, height: StyleSheet.hairlineWidth },
    footer: { fontSize: 10, lineHeight: 16, textAlign: 'center', paddingHorizontal: 16 },
});

// AboutItem component with consistent styling
interface AboutItemProps {
    icon: string;
    title: string;
    description: string;
    onPress?: () => void;
    children?: React.ReactNode;
}


function AboutItem({ icon, title, description, onPress, children }: AboutItemProps) {
    const { colors } = useAppTheme();


    const styles = StyleSheet.create({
        itemContainer: {
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        itemPressable: {
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            gap: 12,
        },
        iconWrapper: {
            marginTop: 2,
            padding: 10,
            borderRadius: 14,
            backgroundColor: colors.primaryContainer,
        },
        itemContent: {
            flex: 1,
        },
        itemTitle: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 2,
        },
        itemDescription: {
            fontSize: 12,
            color: colors.muted,
            lineHeight: 18,
            marginBottom: children ? 4 : 0,
        },
    });


    return (
        <View style={styles.itemContainer}>
            <Pressable
                onPress={onPress}
                accessibilityRole="link"
                accessibilityLabel={`${title}. ${description}`}
                android_ripple={{
                    color: colors.ripplePrimary,
                    borderless: false,
                }}
            >
                <View style={styles.itemPressable}>
                    <View style={styles.iconWrapper}>
                        <Icon
                            source={icon}
                            size={20}
                            color={colors.primary}
                        />
                    </View>
                    <View style={styles.itemContent}>
                        <ThemedText style={styles.itemTitle}>
                            {title}
                        </ThemedText>
                        <ThemedText style={styles.itemDescription}>
                            {description}
                        </ThemedText>
                        {children}
                    </View>
                    <Icon source="arrow-top-right" size={17} color={colors.muted} />
                </View>
            </Pressable>
        </View>
    );
}
