import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * CLAYBA P2, section 27 — real connectivity state via
 * `@react-native-community/netinfo` (no fake/simulated offline state).
 * `isConnected === false` means the device genuinely has no network path;
 * screens performing critical ride-state transitions (accept/decline,
 * arrive, start, complete) must check this and refuse to show a fake local
 * success when it's false — the backend call is the only source of truth.
 */
export function useNetworkStatus(): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false);
    });
  }, []);

  return { isConnected };
}
