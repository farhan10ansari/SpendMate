import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Icon, Text } from 'react-native-paper';
import { useAppTheme } from '@/themes/providers/AppThemeProviders';

interface InfoItemProps {
    icon: string;
    text: string;
    color?: string;
}

const InfoItem = React.memo<InfoItemProps>(({ icon, text, color }) => (
    <View style={styles.infoItem}>
        <Icon source={icon} size={20} color={color} />
        <Text variant="bodyMedium" style={styles.infoText}>
            {text}
        </Text>
    </View>
));

InfoItem.displayName = 'InfoItem';

export const InfoCard = React.memo(() => {
    const { colors } = useAppTheme();

    const infoItems = useMemo(() => {
        const items: InfoItemProps[] = [
            {
                icon: 'folder-cog',
                text: 'Backups are saved to your selected folder',
                color: colors.primary,
            },
            {
                icon: 'shield-check',
                text: 'All backups are stored locally on your device',
                color: colors.primary,
            },
            {
                icon: 'alert-circle',
                text: 'Restoring will replace all current data',
                color: colors.error,
            },
            {
                icon: 'cloud-upload',
                text: 'Use "Share" to save backups to cloud storage',
                color: colors.primary,
            },
        ];

        return items;
    }, [colors]);

    return (
        <Card mode="outlined" style={styles.card}>
            <Card.Title
                title="Important Information"
                titleVariant="titleMedium"
                left={(props) => <Icon {...props} source="information" color={colors.onSurfaceVariant} />}
            />
            <Card.Content style={styles.content}>
                {infoItems.map((item, index) => (
                    <React.Fragment key={item.icon}>
                        {index > 0 && <Divider style={styles.divider} />}
                        <InfoItem icon={item.icon} text={item.text} color={item.color} />
                    </React.Fragment>
                ))}
            </Card.Content>
        </Card>
    );
});

InfoCard.displayName = 'InfoCard';

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
    content: {
        paddingTop: 0,
        paddingBottom: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        gap: 12,
    },
    infoText: {
        flex: 1,
    },
    divider: {
        marginVertical: 8,
    },
});
