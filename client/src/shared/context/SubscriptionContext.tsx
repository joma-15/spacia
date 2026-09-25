import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authenticatedFetch } from "@/shared/services/authenticatedFetch";

interface SubscriptionContextValue {
  isSubscribed: boolean;
  isLoadingSubscription: boolean;
  refreshSubscription: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);
/** Reads the account entitlement from the server; local storage is never trusted. */
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  const refreshSubscription = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setIsSubscribed(false);
      setIsLoadingSubscription(false);
      return false;
    }
    setIsLoadingSubscription(true);
    try {
      const response = await authenticatedFetch("/subscriptions/me");
      const body = await response.json() as { subscription?: { isSubscribed?: boolean } };
      const subscribed = body.subscription?.isSubscribed === true;
      setIsSubscribed(subscribed);
      return subscribed;
    } catch {
      // A failed status check must not unlock a paid feature.
      setIsSubscribed(false);
      return false;
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [user]);

  useEffect(() => { void refreshSubscription(); }, [refreshSubscription]);

  const value = useMemo(() => ({ isSubscribed, isLoadingSubscription, refreshSubscription }), [isLoadingSubscription, isSubscribed, refreshSubscription]);
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within a SubscriptionProvider");
  return context;
}
