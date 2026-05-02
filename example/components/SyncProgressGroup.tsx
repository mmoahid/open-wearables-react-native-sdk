import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Group } from "./Group";

type SyncStatus = Record<string, any>;

interface SyncProgressGroupProps {
  status: SyncStatus;
  isConnected: boolean;
  onResume: () => void;
}

function formatCount(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString();
}

function formatEta(status: SyncStatus) {
  const sent = Number(status.sentCount ?? 0);
  const createdAt = status.createdAt ? Date.parse(String(status.createdAt)) : NaN;
  if (!Number.isFinite(sent) || sent < 100 || !Number.isFinite(createdAt)) {
    return "Estimating once more data moves";
  }

  const minutes = Math.max((Date.now() - createdAt) / 60000, 0.1);
  const perMinute = sent / minutes;
  if (perMinute < 1) return "Waiting for Apple Health";

  const completed = Number(status.completedTypes ?? 0);
  const total = Number(status.totalTypes ?? 0);
  if (total > 0 && completed < total) {
    const remainingTypes = total - completed;
    const estimatedMinutes = Math.max(remainingTypes * 2, 1);
    return estimatedMinutes < 60
      ? `Roughly ${Math.ceil(estimatedMinutes)} min left`
      : "This may take over an hour";
  }

  return "Almost done";
}

function statusText(status: SyncStatus, isConnected: boolean) {
  if (!isConnected) return "Needs connection";
  if (status.wasDisconnected) return "Network disconnected";
  if (status.pendingSyncAfterUnlock) return "Paused until phone unlocks";
  if (status.isSyncing) return "Syncing now";
  if (status.isSyncActive) return "Watching for new data";
  if (status.hasResumableSession) return "Ready to resume";
  return "Idle";
}

export function SyncProgressGroup({
  status,
  isConnected,
  onResume,
}: SyncProgressGroupProps) {
  const totalTypes = Number(status.totalTypes ?? 0);
  const completedTypes = Number(status.completedTypes ?? 0);
  const progress =
    totalTypes > 0 ? Math.min(Math.max(completedTypes / totalTypes, 0), 1) : 0;
  const currentType = status.currentType ? String(status.currentType) : "Waiting";
  const needsAction =
    !isConnected || status.wasDisconnected || status.pendingSyncAfterUnlock || status.hasResumableSession;

  return (
    <Group name="Live Sync Progress">
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Ionicons
            name={needsAction ? "warning-outline" : "pulse-outline"}
            size={20}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{statusText(status, isConnected)}</Text>
          <Text style={styles.subtitle}>
            {status.isFullExport ? "Full history sync" : "Recent changes sync"}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Current</Text>
          <Text style={styles.metricValue}>{currentType}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Sent</Text>
          <Text style={styles.metricValue}>{formatCount(status.sentCount)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Sections</Text>
          <Text style={styles.metricValue}>
            {formatCount(completedTypes)} / {formatCount(totalTypes)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Waiting</Text>
          <Text style={styles.metricValue}>{formatCount(status.outboxCount)}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.eta}>{formatEta(status)}</Text>
        <Pressable style={styles.resumeButton} onPress={onResume}>
          <Ionicons name="play" size={14} color="#000000" />
          <Text style={styles.resumeText}>Resume</Text>
        </Pressable>
      </View>
    </Group>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2C2C2E",
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#30D158",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    rowGap: 8,
  },
  metric: {
    width: "50%",
    paddingHorizontal: 4,
  },
  metricLabel: {
    color: "#8E8E93",
    fontSize: 12,
    marginBottom: 2,
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  eta: {
    color: "#8E8E93",
    fontSize: 13,
    flex: 1,
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resumeText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "700",
  },
});
