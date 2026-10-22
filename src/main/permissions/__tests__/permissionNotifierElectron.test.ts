// Copyright 2026 The Agent Desk Authors
// SPDX-License-Identifier: MIT

// The default notifier against a stand-in Electron Notification. macOS reports a notification it
// will not show through the "failed" event, never by throwing from show(), so the notifier logs it.

import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";

const shown: FakeNotification[] = [];
class FakeNotification extends EventEmitter {
  static isSupported = () => true;
  show() {
    shown.push(this);
  }
}
const warnings: unknown[][] = [];
mock.module("electron", { namedExports: { Notification: FakeNotification } });
mock.module("../../logging/logger", {
  namedExports: { logger: { warn: (...args: unknown[]) => warnings.push(args) } },
});
const { notifyPermissionMissing } = await import("../permissionNotifier");

test("a notification macOS refuses to show is logged", () => {
  assert.equal(notifyPermissionMissing(() => {}), true);
  assert.equal(shown.length, 1);
  shown[0]!.emit("failed", {}, "Notifications are not allowed for this application");
  assert.deepEqual(warnings, [
    ["permissions", "notification_show_failed", { error: "Notifications are not allowed for this application" }],
  ]);
});
