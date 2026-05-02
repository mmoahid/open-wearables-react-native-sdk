import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Group } from "./Group";
import {
  formatCount,
  formatLastCheck,
  presentSyncStatus,
  type SyncStatus,
} from "../utils/syncStatusPresentation";

interface SyncProgressGroupProps {
  status: SyncStatus;
  isConnected: boolean;
  onResume: () => void;
  isChecking: boolean;
  lastCheckAt: number | null;
}

export function SyncProgressGroup({
  status,
  isConnected,
  onResume,
  isChecking,
  lastCheckAt,
}: SyncProgressGroupProps) {
  const presentation = presentSyncStatus(status, isConnected, isChecking);

  return (
    <Group name="Sync Status">
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Ionicons
            name={
              presentation.needsAction
                ? "warning-outline"
                : "checkmark-circle-outline"
            }
            size={20}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{presentation.title}</Text>
          <Text style={styles.subtitle}>{presentation.subtitle}</Text>
        </View>
      </View>

      {presentation.showProgress ? (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${presentation.progress * 100}%` },
            ]}
          />
        </View>
      ) : (
        <View style={styles.steadyStateBox}>
          <Text style={styles.steadyStateText}>
            {presentation.steadyStateText}
          </Text>
        </View>
      )}

      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Current</Text>
          <Text style={styles.metricValue}>{presentation.currentType}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Sent from phone</Text>
          <Text style={styles.metricValue}>
            {formatCount(presentation.sentCount)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Sections</Text>
          <Text style={styles.metricValue}>
            {formatCount(presentation.completedTypes)} /{" "}
            {formatCount(presentation.totalTypes)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Phone queue</Text>
          <Text style={styles.metricValue}>
            {formatCount(presentation.outboxCount)}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.eta}>{formatLastCheck(lastCheckAt)}</Text>
        <Pressable
          style={[
            styles.resumeButton,
            presentation.action.disabled && styles.resumeButtonDisabled,
          ]}
          onPress={onResume}
          disabled={presentation.action.disabled}
        >
          <Ionicons
            name={presentation.action.icon as any}
            size={14}
            color="#000000"
          />
          <Text style={styles.resumeText}>{presentation.action.label}</Text>
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
  steadyStateBox: {
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  steadyStateText: {
    color: "#D1D1D6",
    fontSize: 13,
    lineHeight: 18,
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
  resumeButtonDisabled: {
    opacity: 0.5,
  },
  resumeText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "700",
  },
});
