/**
 * useHydration Hook
 * Check if Zustand persist store has rehydrated from storage
 * Uses official Zustand persist API - no custom state needed
 */

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';

export const useHydration = () => {
  const [hydrated, setHydrated] = useState(useUserStore.persist.hasHydrated);

  useEffect(() => {
    const unsubFinishHydration = useUserStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );

    // Check immediately if already hydrated
    setHydrated(useUserStore.persist.hasHydrated());

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};
