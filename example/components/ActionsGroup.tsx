import OpenWearablesHealthSDK from "open-wearables";
import { Alert } from "react-native";
import { Group } from "./Group";
import { ActionRow } from "./ActionRow";
import {
  ORDERED_HEALTH_TYPES,
  SLEEP_AND_WORKOUT_TYPES,
} from "../utils/healthTypes";
import { ONGOING_SYNC_DAYS_BACK } from "../utils/syncConfig";

interface ActionsGroupProps {
  isAuthorized: boolean | null;
  isSyncActive: boolean;
  onAuthChange: (authorized: boolean) => void;
  onSyncChange: (active: boolean) => void;
  onDisconnect: () => void;
  onToast: (message: string) => void;
}

export function ActionsGroup({
  isAuthorized,
  isSyncActive,
  onAuthChange,
  onSyncChange,
  onDisconnect,
  onToast,
}: ActionsGroupProps) {
  const showActionError = (title: string, error: any) => {
    const message = error?.message ?? String(error);
    Alert.alert(
      title,
      message.includes("JSON") || message.includes("<")
        ? "The server sent a web page instead of app data. The tunnel may have briefly gone bad. Reopen the app and try again."
        : message
    );
  };

  const requestAuthorization = async () => {
    try {
      const granted = await OpenWearablesHealthSDK.requestAuthorization(
        ORDERED_HEALTH_TYPES
      );
      onAuthChange(granted);
      if (granted) {
        onToast("Authorized");
      } else {
        Alert.alert(
          "Access denied",
          "Please grant health permissions to enable sync."
        );
      }
    } catch (e: any) {
      showActionError("Health authorization error", e);
    }
  };

  const toggleSync = async () => {
    try {
      if (isSyncActive) {
        await OpenWearablesHealthSDK.stopBackgroundSync();
        onSyncChange(false);
      } else {
        const started = await OpenWearablesHealthSDK.startBackgroundSync(
          ONGOING_SYNC_DAYS_BACK
        );
        onSyncChange(started ? started : true);
        onToast("Sync started");
      }
    } catch (e: any) {
      showActionError("Sync error", e);
    }
  };

  const syncNow = async () => {
    try {
      await OpenWearablesHealthSDK.startBackgroundSync(
        ONGOING_SYNC_DAYS_BACK
      );
      await OpenWearablesHealthSDK.syncNow();
      onToast("Data synced");
    } catch (e: any) {
      showActionError("Sync error", e);
    }
  };

  const fullResync = async () => {
    try {
      const granted = await OpenWearablesHealthSDK.requestAuthorization(
        ORDERED_HEALTH_TYPES
      );
      onAuthChange(granted);
      if (!granted) {
        Alert.alert(
          "Health access needed",
          "Open iPhone Settings, find Mo Health Sync, then turn on every Health permission you want synced."
        );
        return;
      }

      OpenWearablesHealthSDK.resetAnchors();
      const started = await OpenWearablesHealthSDK.startBackgroundSync(null);
      await OpenWearablesHealthSDK.syncNow();
      onSyncChange(started ? started : true);
      onToast("Full resync started");
    } catch (e: any) {
      showActionError("Full resync error", e);
    }
  };

  const syncSleepAndWorkouts = async () => {
    try {
      const granted = await OpenWearablesHealthSDK.requestAuthorization(
        SLEEP_AND_WORKOUT_TYPES
      );
      onAuthChange(granted);
      if (!granted) {
        Alert.alert(
          "Health access needed",
          "Open iPhone Settings, find Mo Health Sync, then turn on Sleep and Workouts."
        );
        return;
      }

      OpenWearablesHealthSDK.resetAnchors();
      const started = await OpenWearablesHealthSDK.startBackgroundSync(null);
      await OpenWearablesHealthSDK.syncNow();
      onSyncChange(started ? started : true);
      onToast("Sleep and workouts sync started");
    } catch (e: any) {
      showActionError("Sleep and workouts sync error", e);
    }
  };

  const signOut = async () => {
    try {
      await OpenWearablesHealthSDK.signOut();
      onDisconnect();
    } catch (e: any) {
      Alert.alert("Sign out error", e?.message ?? String(e));
    }
  };

  return (
    <Group>
      {isAuthorized !== true ? (
        <>
          <ActionRow
            title="Authorize Health"
            description="Grant access to health data"
            iconName="heart-outline"
            iconBgColor="#3A3A3C"
            onPress={requestAuthorization}
            hasBorderBottom
          />
          <ActionRow
            title="Disconnect"
            description="Sign out and stop syncing"
            iconName="exit-outline"
            iconBgColor="#5C1A1A"
            titleColor="#FF453A"
            onPress={signOut}
          />
        </>
      ) : (
        <>
          <ActionRow
            title={isSyncActive ? "Stop Sync" : "Start Sync"}
            description={
              isSyncActive
                ? "Daily background updates are active"
                : "Begin daily health updates"
            }
            iconName={isSyncActive ? "pause" : "play"}
            iconBgColor="#1A3D1A"
            onPress={toggleSync}
            hasBorderBottom
          />
          <ActionRow
            title="Sync Now"
            description="Send the latest few days now"
            iconName="sync-outline"
            iconBgColor="#0A2D5C"
            onPress={syncNow}
            hasBorderBottom
          />
          <ActionRow
            title="Full Resync"
            description="Re-read all approved Apple Health data"
            iconName="refresh-circle-outline"
            iconBgColor="#3A2A0A"
            onPress={fullResync}
            hasBorderBottom
          />
          <ActionRow
            title="Sync Sleep + Workouts"
            description="Send sleep and workout history first"
            iconName="bed-outline"
            iconBgColor="#16324A"
            onPress={syncSleepAndWorkouts}
            hasBorderBottom
          />
          <ActionRow
            title="Disconnect"
            description="Sign out and stop syncing"
            iconName="exit-outline"
            iconBgColor="#5C1A1A"
            titleColor="#FF453A"
            onPress={signOut}
          />
        </>
      )}
    </Group>
  );
}
