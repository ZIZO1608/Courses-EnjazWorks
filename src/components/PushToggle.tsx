"use client";

import { useEffect, useState, useTransition } from "react";
import { removePushSubscription, savePushSubscription, sendTestNotification } from "@/app/actions/push";
import { isIOS, isStandalone, pushSupported, urlBase64ToUint8Array } from "./device";

type Labels = {
  notifOn: string;
  notifOff: string;
  notifBlocked: string;
  notifIosNeedsInstall: string;
  notifUnsupported: string;
  notifTest: string;
};

type Mode = "loading" | "unsupported" | "ios-install" | "blocked" | "off" | "on";

export function PushToggle({ vapidKey, labels }: { vapidKey: string; labels: Labels }) {
  const [mode, setMode] = useState<Mode>("loading");
  const [pending, start] = useTransition();
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    (async () => {
      if (isIOS() && !isStandalone()) return setMode("ios-install");
      if (!pushSupported() || !vapidKey) return setMode("unsupported");
      if (Notification.permission === "denied") return setMode("blocked");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Re-save in case it was created before login or by another account on this device.
        await savePushSubscription(sub.toJSON());
        setMode("on");
      } else {
        setMode("off");
      }
    })().catch(() => setMode("unsupported"));
  }, [vapidKey]);

  const enable = () =>
    start(async () => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMode(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }));
      const res = await savePushSubscription(sub.toJSON());
      setMode(res.ok ? "on" : "off");
    });

  const disable = () =>
    start(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setMode("off");
    });

  const test = () =>
    start(async () => {
      await sendTestNotification();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    });

  if (mode === "loading") return <div className="h-11" />;
  if (mode === "unsupported") return <p className="text-sm text-muted">{labels.notifUnsupported}</p>;
  if (mode === "ios-install") return <p className="text-sm text-muted">{labels.notifIosNeedsInstall}</p>;
  if (mode === "blocked") return <p className="text-sm text-bad">{labels.notifBlocked}</p>;

  if (mode === "off") {
    return (
      <button type="button" className="btn btn-primary" onClick={enable} disabled={pending}>
        <BellIcon />
        {labels.notifOff}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 text-ok font-bold">
        <span className="size-2.5 rounded-full bg-ok" aria-hidden="true" />
        {labels.notifOn}
      </span>
      <button type="button" className="btn btn-outline btn-sm" onClick={test} disabled={pending}>
        {testSent ? "✓" : labels.notifTest}
      </button>
      <button type="button" className="btn btn-ghost btn-sm text-muted" onClick={disable} disabled={pending}>
        ✕
      </button>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9zm4.3 13a1.94 1.94 0 003.4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
