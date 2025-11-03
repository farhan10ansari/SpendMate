import { useHaptics } from "@/contexts/HapticsProvider";
import usePersistentAppStore from "@/stores/usePersistentAppStore";
import { useCallback } from "react";

const useSettings = () => {
    const haptics = usePersistentAppStore(state => state.settings.haptics);

    const updateSettings = usePersistentAppStore(state => state.updateSettings);

    const { hapticImpact } = useHaptics();

    const handleHapticsToggle = useCallback((enabled: boolean) => {
        const newHaptics = { ...haptics, enabled };
        updateSettings('haptics', newHaptics);
        if (enabled) {
            hapticImpact(undefined, true);
        }
    }, [haptics, updateSettings, hapticImpact]);

    return {
        haptics: haptics,
        handleHapticsToggle,
    };
};

export default useSettings;
