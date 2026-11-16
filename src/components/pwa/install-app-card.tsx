"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

export function InstallAppCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [iosGuide, setIosGuide] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setIos(isIosDevice());

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore — install still works via manifest on many browsers */
      });
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || standalone) return null;

  async function installAndroid() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 text-white">
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Smartphone className="size-5 text-amber-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">
            Uygulamayı telefona yükle
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            Ana ekrandan aç — adres çubuğu olmadan, dükkan masası gibi.
          </p>

          {ios ? (
            <div className="mt-3 flex flex-col gap-2">
              {!iosGuide ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-white text-neutral-950 hover:bg-neutral-100"
                  onClick={() => setIosGuide(true)}
                >
                  <Share className="size-4" aria-hidden />
                  Nasıl yüklenir?
                </Button>
              ) : (
                <ol className="space-y-2 rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-neutral-200">
                  <li className="flex gap-2">
                    <span className="font-semibold text-amber-400">1.</span>
                    <span>
                      Alttaki{" "}
                      <span className="inline-flex items-center gap-1 font-medium text-white">
                        Paylaş <Share className="inline size-3.5" aria-hidden />
                      </span>{" "}
                      simgesine bas.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-amber-400">2.</span>
                    <span>
                      Listeden <strong className="font-medium text-white">Ana Ekrana Ekle</strong>
                      ’yi seç, sonra Ekle’ye dokun.
                    </span>
                  </li>
                </ol>
              )}
            </div>
          ) : (
            <div className="mt-3">
              {deferred ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-white text-neutral-950 hover:bg-neutral-100"
                  onClick={() => void installAndroid()}
                >
                  <Download className="size-4" aria-hidden />
                  Uygulamayı yükle
                </Button>
              ) : (
                <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-neutral-400">
                  Chrome menüsünden (⋮) <strong className="font-medium text-neutral-200">Uygulamayı yükle</strong> veya{" "}
                  <strong className="font-medium text-neutral-200">Ana ekrana ekle</strong>’yi seç.
                </p>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label="Kapat"
          className="rounded-lg p-1 text-neutral-500 hover:bg-white/10 hover:text-neutral-300"
          onClick={() => setHidden(true)}
        >
          <X className="size-4" />
        </button>
      </div>
    </section>
  );
}
