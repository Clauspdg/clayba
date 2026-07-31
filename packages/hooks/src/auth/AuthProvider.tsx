"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { AuthAdapter, AuthContextValue, AuthStatus, SessionUser } from "./auth.types";

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  /** A real backend adapter — see `createFirebaseAuthAdapter` in `@the-ride/firebase/client`. */
  adapter: AuthAdapter;
}

export function AuthProvider({ children, adapter }: AuthProviderProps) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = adapter.observeSession((next) => {
      setSession(next);
      setStatus(next ? "authenticated" : "unauthenticated");
    });
    return unsubscribe;
  }, [adapter]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      error,
      async signIn(email: string, password: string) {
        setError(null);
        try {
          await adapter.signIn(email, password);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Sign-in failed.";
          setError(message);
          throw err;
        }
      },
      async signOut() {
        await adapter.signOut();
      },
    }),
    [session, status, error, adapter],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
