import { StyleSheet } from "react-native";


const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    column: {
        flexDirection: 'column',
        gap: 12,
    },
    section: {
        gap: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    percentageText: {
        fontSize: 14,
        fontWeight: '600',
    },
    moreStatsButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        // marginBottom: 16,
    },
})

export default styles;