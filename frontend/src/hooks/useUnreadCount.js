import { useState, useEffect, useCallback } from "react";
import { messagesAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export function useUnreadCount(intervalMs = 30000) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!user) { setCount(0); return; }
    try {
      const { data } = await messagesAPI.unreadCount();
      setCount(data.count);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => clearInterval(id);
  }, [fetch, intervalMs]);

  return count;
}
