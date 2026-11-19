"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useSyncExternalStore } from "react";
import { pinLoginAction, type PinActionState } from "@/app/(auth)/pin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initial: PinActionState = { error: null };
const SLUG_KEY = "sanayidesk.pin.slug";

function readSavedSlug(): string {
  try {
    return localStorage.getItem(SLUG_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function useSavedSlug() {
  return useSyncExternalStore(
    () => () => {},
    readSavedSlug,
    () => "",
  );
}

export function PinForm() {
  const [state, action, pending] = useActionState(pinLoginAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const savedSlug = useSavedSlug();
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");

  const slug = slugOverride ?? savedSlug;
  const slugLocked = Boolean(savedSlug) && !unlocked && slugOverride === null;
  const canSubmit = slug.trim().length > 0 && pin.length === 4;

  function persistSlug(value: string) {
    try {
      localStorage.setItem(SLUG_KEY, value.trim().toLowerCase());
    } catch {
      /* ignore */
    }
  }

  function appendDigit(digit: string) {
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const next = `${prev}${digit}`;
      if (next.length === 4 && slug.trim()) {
        queueMicrotask(() => {
          persistSlug(slug);
          formRef.current?.requestSubmit();
        });
      }
      return next;
    });
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="slug" value={slug.trim().toLowerCase()} />
      <input type="hidden" name="pin" value={pin} />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="slug-visible">Dükkan kodu</Label>
          {slugLocked ? (
            <button
              type="button"
              className="text-xs font-medium text-neutral-600 underline-offset-4 hover:underline"
              onClick={() => {
                setUnlocked(true);
                setSlugOverride("");
                try {
                  localStorage.removeItem(SLUG_KEY);
                } catch {
                  /* ignore */
                }
              }}
            >
              Değiştir
            </button>
          ) : null}
        </div>
        <Input
          id="slug-visible"
          value={slug}
          onChange={(event) => setSlugOverride(event.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="sasmaz-oto"
          required
          readOnly={slugLocked}
          className={slugLocked ? "bg-neutral-50 text-neutral-700" : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>PIN</Label>
        <div className="flex justify-center gap-2" aria-label="4 haneli PIN">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "flex size-12 items-center justify-center rounded-xl border border-neutral-200 bg-white font-mono text-xl",
                pin.length === index &&
                  "border-neutral-950 ring-2 ring-neutral-950/10",
              )}
            >
              {pin[index] ? "•" : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map(
          (key) => (
            <Button
              key={key}
              type="button"
              size="xl"
              variant="outline"
              className={cn(
                "border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200",
                (key === "C" || key === "⌫") && "text-neutral-500",
              )}
              onClick={() => {
                if (key === "C") setPin("");
                else if (key === "⌫") setPin((prev) => prev.slice(0, -1));
                else appendDigit(key);
              }}
            >
              {key}
            </Button>
          ),
        )}
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error.includes("PIN")
            ? "PIN hatalı — 4 haneyi yeniden gir."
            : state.error}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        disabled={pending || !canSubmit}
        className={cn(!canSubmit && "opacity-40")}
        onClick={() => {
          if (slug.trim()) persistSlug(slug);
        }}
      >
        {pending ? "Giriş…" : "Giriş"}
      </Button>
      <p className="text-center text-sm text-neutral-600">
        Dükkan hesabı ile mi gireceksin?{" "}
        <Link
          href="/login"
          className="font-medium underline-offset-4 hover:underline"
        >
          E-posta ile gir
        </Link>
      </p>
    </form>
  );
}
