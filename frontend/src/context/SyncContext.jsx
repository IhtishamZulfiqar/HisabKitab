import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { getPendingTransactions, removePendingTransaction } from "../utils/offlineStore";

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(getPendingTransactions().length);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  const refreshCount = useCallback(() => {
    setPendingCount(getPendingTransactions().length);
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    setSyncError("");
    for (const item of getPendingTransactions()) {
      try {
        await api.post(item.endpoint, item.payload);
        removePendingTransaction(item.localId);
        refreshCount();
      } catch (err) {
        setSyncError(err.message);
        break;
      }
    }
    setSyncing(false);
  }, [refreshCount]);

  useEffect(() => {
    if (isOnline) syncNow();
  }, [isOnline, syncNow]);

  return (
    <SyncContext.Provider value={{ isOnline, pendingCount, syncing, syncError, syncNow, refreshCount }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
