"use client";

import { useEffect, useState } from "react";
import { isIOS, isStandalone } from "./device";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Labels = { install: string; iosTitle: string; iosSteps: string[]; close: string };

export function InstallButton({
  labels,
  compact = false,
  className = "",
}: {
  labels: Labels;
  compact?: boolean;
  className?: string;
}) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(true); // hidden until we know
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    setIos(isIOS());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPrompt(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || (!prompt && !ios)) return null;

  const onClick = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={`btn btn-rose ${compact ? "btn-sm" : ""} ${className}`}
        aria-label={labels.install}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={compact ? "hidden sm:inline" : ""}>{labels.install}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-guide-title"
          onClick={() => setShowGuide(false)}
        >
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 id="ios-guide-title" className="text-xl font-extrabold text-brand mb-4">
              {labels.iosTitle}
            </h2>
            <ol className="space-y-3">
              {labels.iosSteps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 size-7 rounded-full bg-tint text-brand font-bold grid place-items-center text-sm">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn-primary w-full mt-6" onClick={() => setShowGuide(false)}>
              {labels.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
