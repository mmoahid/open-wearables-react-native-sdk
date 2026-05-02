import { presentSyncStatus } from "./syncStatusPresentation";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function run() {
  const idle = presentSyncStatus({ isSyncActive: true }, true, false);
  assertEqual(idle.title, "Daily sync is on", "idle title");
  assertEqual(idle.action.label, "Check Now", "idle action");
  assertEqual(idle.showProgress, false, "idle hides progress");

  const checking = presentSyncStatus({ isSyncActive: true }, true, true);
  assertEqual(checking.title, "Checking Apple Health", "checking title");
  assertEqual(checking.action.label, "Checking", "checking action");
  assertEqual(checking.action.disabled, true, "checking action disabled");

  const resumable = presentSyncStatus(
    { hasResumableSession: true, totalTypes: 4 },
    true,
    false
  );
  assertEqual(resumable.title, "Ready to resume", "resumable title");
  assertEqual(resumable.action.label, "Resume", "resumable action");
  assertEqual(resumable.action.disabled, false, "resumable action enabled");
  assertEqual(resumable.showProgress, true, "resumable can show progress");

  const disconnected = presentSyncStatus({ wasDisconnected: true }, true, false);
  assertEqual(disconnected.title, "Network disconnected", "network title");
  assertEqual(disconnected.action.label, "Waiting", "network action");
  assertEqual(disconnected.action.disabled, true, "network action disabled");

  const locked = presentSyncStatus({ pendingSyncAfterUnlock: true }, true, false);
  assertEqual(locked.title, "Paused until phone unlocks", "locked title");
  assertEqual(locked.action.label, "Unlock Phone", "locked action");
  assertEqual(locked.action.disabled, true, "locked action disabled");

  const sentButIdle = presentSyncStatus(
    { isSyncActive: true, sentCount: 10, completedTypes: 2, totalTypes: 0 },
    true,
    false
  );
  assertEqual(sentButIdle.title, "Daily sync is on", "sent-but-idle title");
  assertEqual(sentButIdle.showProgress, false, "sent-but-idle hides progress");
}

run();
