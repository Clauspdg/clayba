import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

// Type-only imports: erased at compile time, never trigger a real
// `require()` at runtime, so these do NOT reintroduce the static-import
// risk this file's restructuring exists to avoid — only the actual
// value imports inside the dynamic `import()` calls below do that.
import type AsyncStorageType from "@react-native-async-storage/async-storage";
import type { ClientAuthAdapter } from "@the-ride/firebase/client";
import type { AuthProvider, I18nProvider, ThemeProvider } from "@the-ride/hooks";
import type { Stack } from "expo-router";
import type { Appearance as AppearanceType } from "react-native";

import type { OfflineBanner } from "@/components/OfflineBanner";

/**
 * Same restructuring CLAYBA Driver's boot sequence went through after two
 * real-device white-screen incidents (unguarded Firebase init throwing at
 * module-eval time; a static import chain reaching a DOM-only Firebase
 * Auth export that also throws at module-eval time). This file used to
 * statically `import { passengerAuthAdapter, ... } from "@/lib/firebase-client"`
 * at the top of the module — and that module statically imports
 * `@the-ride/firebase/client/native-persistence`, which itself statically
 * imports `getReactNativePersistence` from `@firebase/auth` behind that
 * package's "react-native" export condition. If any module in that static
 * chain throws during evaluation, the failure happens before React ever
 * renders a single frame — no error boundary can catch a crash in a
 * static `import`, only in code that actually runs.
 *
 * Fix: nothing risky is imported statically anymore. This file's own
 * first render uses only React Native core primitives (no `@the-ride/*`
 * package, no AsyncStorage, no Firebase) so it is guaranteed to mount.
 * Every subsequent step (hooks providers, Firebase, auth) is loaded via
 * dynamic `import()` inside a `try/catch`'d effect, so a failure anywhere
 * in that chain surfaces as a real, visible, branded error screen instead
 * of silence.
 */

// First-party Expo module (not a risky third-party dependency), called at
// module scope exactly as the package's own docs prescribe. This is the
// ONLY thing standing between the native splash and this file's first
// React commit, so it must run before anything else in this module.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden (e.g. Fast Refresh) — not a real failure.
});

type BootPhase = "booting" | "ready" | "error";

interface BootModules {
  ThemeProvider: typeof ThemeProvider;
  I18nProvider: typeof I18nProvider;
  AuthProvider: typeof AuthProvider;
  passengerAuthAdapter: ClientAuthAdapter;
  passengerFirebaseInitError: string | null;
  Stack: typeof Stack;
  OfflineBanner: typeof OfflineBanner;
  AsyncStorage: typeof AsyncStorageType;
  Appearance: typeof AppearanceType;
}

const BOOT_STAGES = ["mounted", "configuration", "firebase", "auth"] as const;
type BootStage = (typeof BOOT_STAGES)[number];

function BootStageList({ completed }: { completed: BootStage[] }) {
  const labels: Record<BootStage, string> = {
    mounted: "React mounted",
    configuration: "Configuration loaded",
    firebase: "Firebase",
    auth: "Authentication",
  };
  return (
    <View style={styles.stageList}>
      {BOOT_STAGES.map((stage) => (
        <Text key={stage} style={styles.stageText}>
          {completed.includes(stage) ? "✓" : "○"} {labels[stage]}
        </Text>
      ))}
    </View>
  );
}

function BootingView({ completed }: { completed: BootStage[] }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>CLAYBA</Text>
      <ActivityIndicator size="small" color="#CB562C" style={styles.spinner} />
      <Text style={styles.subtitle}>Starting application...</Text>
      <BootStageList completed={completed} />
    </View>
  );
}

function BootErrorView({
  stage,
  message,
  onRetry,
}: {
  stage: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>CLAYBA</Text>
      <Text style={styles.errorTitle}>couldn&apos;t start</Text>
      <Text style={styles.stageText}>Stage: {stage}</Text>
      <Text style={styles.errorCode}>{message}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryLabel}>Retry</Text>
      </Pressable>
    </View>
  );
}

/** Never shown Firebase keys/tokens/stack traces — only a short, safe, human label. */
function safeErrorCode(err: unknown, stage: string): string {
  if (err instanceof Error) {
    const short = err.message.split("\n")[0]!.slice(0, 120);
    return `${err.name}: ${short}`;
  }
  return `Unknown error during ${stage}`;
}

export default function RootLayout() {
  const [phase, setPhase] = useState<BootPhase>("booting");
  const [completedStages, setCompletedStages] = useState<BootStage[]>(["mounted"]);
  const [errorInfo, setErrorInfo] = useState<{ stage: string; message: string } | null>(null);
  const [modules, setModules] = useState<BootModules | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Runs after this component's first real commit — the earliest safe
  // point to release the native splash, since something (BootingView) is
  // now guaranteed to be rendered behind it.
  useEffect(() => {
    SplashScreen.hideAsync()
      .catch((err) => console.warn("[boot] SplashScreen.hideAsync failed (non-fatal):", err))
      .finally(() => console.warn("[boot] Native splash released, BootingView visible"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    console.warn("[boot] React mounted, loading configuration...");

    async function boot() {
      let stage = "configuration";
      try {
        const [hooksMod, rnMod, storageMod, routerMod, bannerMod, firebaseClientMod] =
          await Promise.all([
            import("@the-ride/hooks"),
            import("react-native"),
            import("@react-native-async-storage/async-storage"),
            import("expo-router"),
            import("@/components/OfflineBanner"),
            import("@/lib/firebase-client"),
          ]);
        if (cancelled) return;
        console.warn("[boot] Configuration loaded");
        setCompletedStages((s) => [...s, "configuration"]);

        stage = "firebase";
        // firebase-client.ts runs its own guarded init at import time; by
        // the time the dynamic import above resolves, it has already
        // succeeded or recorded a real error — nothing further to call here.
        console.warn("[boot] Firebase init error:", firebaseClientMod.passengerFirebaseInitError);
        setCompletedStages((s) => [...s, "firebase"]);

        stage = "auth";
        if (firebaseClientMod.passengerFirebaseInitError) {
          throw new Error(firebaseClientMod.passengerFirebaseInitError);
        }
        setCompletedStages((s) => [...s, "auth"]);

        if (cancelled) return;
        setModules({
          ThemeProvider: hooksMod.ThemeProvider,
          I18nProvider: hooksMod.I18nProvider,
          AuthProvider: hooksMod.AuthProvider,
          passengerAuthAdapter: firebaseClientMod.passengerAuthAdapter,
          passengerFirebaseInitError: firebaseClientMod.passengerFirebaseInitError,
          Stack: routerMod.Stack,
          OfflineBanner: bannerMod.OfflineBanner,
          AsyncStorage: storageMod.default,
          Appearance: rnMod.Appearance,
        });
        setPhase("ready");
      } catch (err) {
        console.error(`[boot] Failed at stage "${stage}":`, err);
        if (!cancelled) {
          setErrorInfo({ stage, message: safeErrorCode(err, stage) });
          setPhase("error");
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function handleRetry() {
    setPhase("booting");
    setErrorInfo(null);
    setCompletedStages(["mounted"]);
    setModules(null);
    setAttempt((n) => n + 1);
  }

  if (phase === "error" && errorInfo) {
    return (
      <BootErrorView stage={errorInfo.stage} message={errorInfo.message} onRetry={handleRetry} />
    );
  }

  if (phase !== "ready" || !modules) {
    return <BootingView completed={completedStages} />;
  }

  const {
    ThemeProvider,
    I18nProvider,
    AuthProvider,
    passengerAuthAdapter,
    Stack,
    OfflineBanner,
    AsyncStorage,
    Appearance,
  } = modules;

  const storage = {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  };
  const getSystemTheme = () =>
    Appearance.getColorScheme() === "dark" ? ("dark" as const) : ("light" as const);

  return (
    <ThemeProvider storage={storage} getSystemTheme={getSystemTheme}>
      <I18nProvider storage={storage}>
        <AuthProvider adapter={passengerAuthAdapter}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#0B1A2D",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  subtitle: { fontSize: 14, color: "#D3CCC2" },
  spinner: { marginTop: 4 },
  stageList: { marginTop: 16, alignItems: "flex-start", gap: 4 },
  stageText: { fontSize: 13, color: "#A69C8E" },
  errorTitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  errorCode: { fontSize: 12, color: "#D3CCC2", textAlign: "center", marginTop: 4 },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#CB562C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryLabel: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
});
