import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import OpenWearablesHealthSDK from "open-wearables";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ActionsGroup } from "./components/ActionsGroup";
import { ProvidersGroup } from "./components/ProvidersGroup";
import { SessionGroup } from "./components/SessionGroup";
import { StatusBanner } from "./components/StatusBanner";
import { SyncProgressGroup } from "./components/SyncProgressGroup";
import { Toast } from "./components/Toast";
import { useLogs } from "./hooks/useLogs";
import { LogsScreen } from "./screens/LogsScreen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ORDERED_HEALTH_TYPES } from "./utils/healthTypes";
import { INITIAL_HOST } from "./utils/constants";
import {
  bootstrapOwnerSession,
  canBootstrapOwnerSession,
} from "./utils/ownerBootstrap";
import { ONGOING_SYNC_DAYS_BACK } from "./utils/syncConfig";

export default function App() {
  const onAuthErrorPayload = useEvent(OpenWearablesHealthSDK, "onAuthError");
  const [credentials, setCredentials] = useState<Record<string, any>>({});
  const [showLogs, setShowLogs] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, any>>({});
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [lastCheckAt, setLastCheckAt] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(
    null
  );
  const { logs, clearLogs } = useLogs();

  const showToast = (message: string) => {
    setToast({ message, key: Date.now() });
  };

  const requestAllHealthAccess = async () => {
    const granted = await OpenWearablesHealthSDK.requestAuthorization(
      ORDERED_HEALTH_TYPES
    );
    setIsAuthorized(granted);
    return granted;
  };

  const refreshStoredCredentials = () => {
    const stored = OpenWearablesHealthSDK.getStoredCredentials();
    setCredentials(stored ?? {});
    return stored ?? {};
  };

  const runOwnerBootstrap = async (reason: string) => {
    if (!canBootstrapOwnerSession()) return false;

    setIsBootstrapping(true);
    try {
      await bootstrapOwnerSession();
      const stored = refreshStoredCredentials();
      const valid = Boolean(OpenWearablesHealthSDK.isSessionValid());
      setIsConnected(valid);
      if (valid) {
        await requestAllHealthAccess();
        setIsSyncActive(
          Boolean(
            await OpenWearablesHealthSDK.startBackgroundSync(
              ONGOING_SYNC_DAYS_BACK
            )
          )
        );
        setIsCheckingSync(true);
        await OpenWearablesHealthSDK.syncNow();
        setLastCheckAt(Date.now());
        setSyncStatus(OpenWearablesHealthSDK.getSyncStatus());
        setLastWarning(null);
        showToast(reason === "repair" ? "Connection repaired" : "Connected");
      }
      return Boolean(stored?.host && valid);
    } catch (error) {
      return false;
    } finally {
      setIsCheckingSync(false);
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const beforeConfigure = OpenWearablesHealthSDK.getStoredCredentials();

      // Configure first so iOS can clear stale Keychain credentials after reinstall.
      OpenWearablesHealthSDK.configure(INITIAL_HOST);

      let stored = refreshStoredCredentials();
      let valid = Boolean(OpenWearablesHealthSDK.isSessionValid());

      const needsOwnerBootstrap =
        !valid ||
        !beforeConfigure?.host ||
        beforeConfigure.host !== INITIAL_HOST;

      if (needsOwnerBootstrap) {
        await runOwnerBootstrap("startup");
        stored = refreshStoredCredentials();
        valid = Boolean(OpenWearablesHealthSDK.isSessionValid());
      }

      setIsConnected(valid);
      if (valid) {
        setIsSyncActive(Boolean(OpenWearablesHealthSDK.isSyncActive()));
        setSyncStatus(OpenWearablesHealthSDK.getSyncStatus());
        await requestAllHealthAccess();
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!onAuthErrorPayload) return;
    setLastWarning(onAuthErrorPayload.message);
    runOwnerBootstrap("repair").then((repaired) => {
      if (!repaired) {
        Alert.alert(
          "Sync needs attention",
          "The app could not authenticate with the server. It tried to repair the connection, but still needs attention."
        );
      }
    });
  }, [onAuthErrorPayload]);

  useEffect(() => {
    if (!isConnected) return;

    const refreshStatus = () => {
      const nextStatus = OpenWearablesHealthSDK.getSyncStatus();
      setSyncStatus(nextStatus);
      setIsSyncActive(Boolean(OpenWearablesHealthSDK.isSyncActive()));

      if (nextStatus.wasDisconnected && lastWarning !== "network") {
        setLastWarning("network");
      }

      if (nextStatus.pendingSyncAfterUnlock && lastWarning !== "locked") {
        setLastWarning("locked");
      }
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 2000);
    return () => clearInterval(interval);
  }, [isConnected, lastWarning]);

  const handleConnectSuccess = () => {
    const stored = OpenWearablesHealthSDK.getStoredCredentials();
    setCredentials(stored ?? {});
    setIsConnected(true);
    showToast("Mo Health Sync connected");
    // iOS only has 1 provider (HealthKit)
    if (Platform.OS === "ios" || stored?.provider) {
      requestAllHealthAccess();
    }
  };

  const handleDisconnect = () => {
    setIsAuthorized(null);
    setIsSyncActive(false);
    setIsConnected(false);
    setSyncStatus({});
    refreshStoredCredentials();
  };

  const handleProviderChange = () => {
    setIsAuthorized(null);
    setIsSyncActive(false);
    setSyncStatus({});
    refreshStoredCredentials();
    requestAllHealthAccess();
  };

  const handleResumeSync = async () => {
    setIsCheckingSync(true);
    try {
      const stored = OpenWearablesHealthSDK.getStoredCredentials();
      if (stored?.host) {
        OpenWearablesHealthSDK.configure(stored.host);
      }

      const resumed = await OpenWearablesHealthSDK.resumeSync();
      if (!resumed) {
        const started = await OpenWearablesHealthSDK.startBackgroundSync(
          ONGOING_SYNC_DAYS_BACK
        );
        setIsSyncActive(started ? started : true);
      } else {
        setIsSyncActive(true);
      }

      await OpenWearablesHealthSDK.syncNow();
      setLastCheckAt(Date.now());
      setSyncStatus(OpenWearablesHealthSDK.getSyncStatus());
      setLastWarning(null);
      showToast(resumed ? "Sync resumed" : "Checked for new Health data");
    } catch (e: any) {
      Alert.alert(
        "Resume failed",
        "The app could not resume by itself. Use Connect once, then future syncs should resume automatically."
      );
    } finally {
      setIsCheckingSync(false);
    }
  };

  const getProviderDisplayName = (): string | null => {
    if (!credentials.provider) return null;
    const providers = OpenWearablesHealthSDK.getAvailableProviders();
    return (
      providers.find((p) => p.id === credentials.provider)?.displayName ?? null
    );
  };

  const syncSubtitle = isConnected
    ? (() => {
        const name = getProviderDisplayName();
        return name ? `Connected via ${name}` : "Connected";
      })()
    : "Not connected";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Modal
          visible={showLogs}
          animationType="slide"
          onRequestClose={() => setShowLogs(false)}
        >
          <LogsScreen
            logs={logs}
            onClearLogs={clearLogs}
            onBack={() => setShowLogs(false)}
          />
        </Modal>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mo Health Sync</Text>
            <Pressable onPress={() => setShowLogs(true)} hitSlop={8}>
              <View style={styles.logsButton}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color="#8E8E93"
                />
                {logs.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {logs.length > 99 ? "99+" : logs.length}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            style={styles.scroll}
            keyboardShouldPersistTaps="always"
          >
            <StatusBanner isSyncing={isSyncActive} subtitle={syncSubtitle} />
            {isBootstrapping && (
              <Text style={styles.bootstrappingText}>
                Connecting to Mo Health cloud…
              </Text>
            )}
            {isConnected === false ? (
              <SessionGroup
                credentials={credentials}
                onConnectSuccess={handleConnectSuccess}
              />
            ) : (
              <>
                <SyncProgressGroup
                  status={syncStatus}
                  isConnected={isConnected}
                  onResume={handleResumeSync}
                  isChecking={isCheckingSync}
                  lastCheckAt={lastCheckAt}
                />
                <ProvidersGroup
                  savedProvider={credentials.provider}
                  onProviderChange={handleProviderChange}
                />
                <ActionsGroup
                  isAuthorized={isAuthorized}
                  isSyncActive={isSyncActive}
                  onAuthChange={setIsAuthorized}
                  onSyncChange={setIsSyncActive}
                  onDisconnect={handleDisconnect}
                  onToast={showToast}
                />
              </>
            )}
            {toast != null && (
              <Toast
                key={toast.key}
                message={toast.message}
                onHide={() => setToast(null)}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logsButton: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#FF453A",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    gap: 16,
    padding: 20,
    paddingTop: 4,
  },
  bootstrappingText: {
    color: "#8E8E93",
    fontSize: 14,
    textAlign: "center",
  },
});
