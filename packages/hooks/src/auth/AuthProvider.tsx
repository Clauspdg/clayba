"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { AuthAdapter, AuthContextValue, AuthStatus, SessionUser } from "./auth.types";

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  /** A real backend adapter — see `createFirebaseAuthAdapter` in `@the-ride/firebase/client`. */
  adapter: AuthAdapter;
}

function notSupported(method: string): never {
  throw new Error(`This app's auth adapter does not support ${method}().`);
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

  const value = useMemo<AuthContextValue>(() => {
    async function runWithError<T>(action: () => Promise<T>): Promise<T> {
      setError(null);
      try {
        return await action();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        throw err;
      }
    }

    return {
      session,
      status,
      error,
      signIn: (email, password) => runWithError(() => adapter.signIn(email, password)),
      signOut: () => adapter.signOut(),
      signUp: (email, password, displayName) =>
        runWithError(
          () => adapter.signUp?.(email, password, displayName) ?? notSupported("signUp"),
        ),
      sendPasswordReset: (email) =>
        runWithError(() => adapter.sendPasswordReset?.(email) ?? notSupported("sendPasswordReset")),
      confirmPasswordReset: (code, newPassword) =>
        runWithError(
          () =>
            adapter.confirmPasswordReset?.(code, newPassword) ??
            notSupported("confirmPasswordReset"),
        ),
      sendEmailVerification: () =>
        runWithError(
          () => adapter.sendEmailVerification?.() ?? notSupported("sendEmailVerification"),
        ),
      applyActionCode: (code) =>
        runWithError(() => adapter.applyActionCode?.(code) ?? notSupported("applyActionCode")),
      reloadUser: () => runWithError(() => adapter.reloadUser?.() ?? notSupported("reloadUser")),
      updateDisplayName: (displayName) =>
        runWithError(
          () => adapter.updateDisplayName?.(displayName) ?? notSupported("updateDisplayName"),
        ),
      updatePhotoURL: (photoURL) =>
        runWithError(() => adapter.updatePhotoURL?.(photoURL) ?? notSupported("updatePhotoURL")),
    };
  }, [session, status, error, adapter]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
