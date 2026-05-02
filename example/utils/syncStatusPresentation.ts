export type SyncStatus = Record<string, unknown>;

export interface SyncStatusAction {
  label: string;
  icon: string;
  disabled: boolean;
}

export interface SyncStatusPresentation {
  title: string;
  subtitle: string;
  steadyStateText: string;
  currentType: string;
  sentCount: number;
  outboxCount: number;
  completedTypes: number;
  totalTypes: number;
  progress: number;
  showProgress: boolean;
  needsAction: boolean;
  action: SyncStatusAction;
}

function numberFromStatus(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function formatCount(value: unknown) {
  return Math.round(numberFromStatus(value)).toLocaleString();
}

export function formatLastCheck(lastCheckAt: number | null) {
  if (!lastCheckAt) return "Not checked in this app session";

  const seconds = Math.max(Math.round((Date.now() - lastCheckAt) / 1000), 0);
  if (seconds < 60) return "Checked just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Checked ${minutes} min ago`;

  return `Checked at ${new Date(lastCheckAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function labelForHealthType(value: unknown) {
  if (!value) return "No active sync";

  const raw = String(value);
  const labels: Record<string, string> = {
    Workout: "workouts",
    SleepAnalysis: "sleep",
    DistanceWalkingRunning: "walking/running distance",
    HeartRate: "heart rate",
    RestingHeartRate: "resting heart rate",
    HeartRateVariabilitySDNN: "heart-rate variability",
    ActiveEnergyBurned: "active energy",
    BasalEnergyBurned: "basal energy",
    StepCount: "steps",
    BodyMass: "weight",
    VO2Max: "VO2 max",
  };

  return labels[raw] ?? raw.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function statusTitle(status: SyncStatus, isConnected: boolean, isChecking: boolean) {
  if (!isConnected) return "Needs connection";
  if (status.wasDisconnected) return "Network disconnected";
  if (status.pendingSyncAfterUnlock) return "Paused until phone unlocks";
  if (status.isSyncing || isChecking) return "Checking Apple Health";
  if (status.hasResumableSession) return "Ready to resume";
  if (numberFromStatus(status.outboxCount) > 0) return "Sending from phone";
  if (status.isSyncActive) return "Daily sync is on";
  return "Sync is off";
}

function statusSubtitle(status: SyncStatus, isChecking: boolean) {
  if (status.wasDisconnected) return "The app will retry when the network is back.";
  if (status.pendingSyncAfterUnlock) return "Unlock the phone so Apple Health can share data.";
  if (status.isSyncing) return "Reading recent Apple Health changes.";
  if (isChecking) return "Looking for new Health data now.";
  if (status.hasResumableSession) return "A previous check can continue.";
  if (numberFromStatus(status.outboxCount) > 0) return "Uploads are waiting on this phone.";
  if (status.isSyncActive) return "Opening this app helps send the latest data.";
  return "Turn sync on when you want Apple Health updates sent.";
}

function steadyStateText(status: SyncStatus, isChecking: boolean) {
  if (isChecking || status.isSyncing) {
    return "Checking now. If Apple Health has new data, this will switch to sending.";
  }
  if (numberFromStatus(status.outboxCount) > 0) {
    return "The phone has data waiting to upload. Keep the app open while it sends.";
  }
  if (status.hasResumableSession) {
    return "A previous check can continue. Tap Resume.";
  }
  return "No active upload right now. This is normal after the phone finishes checking Apple Health.";
}

function actionForStatus(status: SyncStatus, isConnected: boolean, isChecking: boolean): SyncStatusAction {
  if (isChecking || status.isSyncing) {
    return { label: "Checking", icon: "refresh", disabled: true };
  }
  if (!isConnected) {
    return { label: "Connect", icon: "link", disabled: true };
  }
  if (status.wasDisconnected) {
    return { label: "Waiting", icon: "wifi", disabled: true };
  }
  if (status.pendingSyncAfterUnlock) {
    return { label: "Unlock Phone", icon: "lock-closed", disabled: true };
  }
  if (status.hasResumableSession) {
    return { label: "Resume", icon: "play", disabled: false };
  }
  return { label: "Check Now", icon: "refresh", disabled: false };
}

export function presentSyncStatus(
  status: SyncStatus,
  isConnected: boolean,
  isChecking: boolean
): SyncStatusPresentation {
  const totalTypes = numberFromStatus(status.totalTypes);
  const completedTypes = numberFromStatus(status.completedTypes);
  const progress =
    totalTypes > 0 ? Math.min(Math.max(completedTypes / totalTypes, 0), 1) : 0;
  const sentCount = numberFromStatus(status.sentCount);
  const outboxCount = numberFromStatus(status.outboxCount);
  const needsAction =
    !isConnected ||
    Boolean(status.wasDisconnected) ||
    Boolean(status.pendingSyncAfterUnlock) ||
    Boolean(status.hasResumableSession);

  return {
    title: statusTitle(status, isConnected, isChecking),
    subtitle: statusSubtitle(status, isChecking),
    steadyStateText: steadyStateText(status, isChecking),
    currentType: isChecking ? "checking now" : labelForHealthType(status.currentType),
    sentCount,
    outboxCount,
    completedTypes,
    totalTypes,
    progress,
    showProgress:
      totalTypes > 0 &&
      (Boolean(status.isSyncing) ||
        Boolean(status.hasResumableSession) ||
        Boolean(isChecking)),
    needsAction,
    action: actionForStatus(status, isConnected, isChecking),
  };
}
