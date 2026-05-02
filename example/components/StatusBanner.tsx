import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface StatusBannerProps {
  isSyncing: boolean;
  subtitle: string;
}

export function StatusBanner({ isSyncing, subtitle }: StatusBannerProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          isSyncing ? styles.iconGreen : styles.iconRed,
        ]}
      >
        <View
          style={[
            styles.outerCircle,
            isSyncing ? styles.iconGreen : styles.iconRed,
          ]}
        />
        <Ionicons
          name={isSyncing ? "checkmark" : "close"}
          size={28}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {isSyncing ? "Daily Sync On" : "Sync Off"}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  outerCircle: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 60,
    opacity: 0.2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGreen: {
    backgroundColor: "#30D158",
  },
  iconRed: {
    backgroundColor: "#FF453A",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
});
