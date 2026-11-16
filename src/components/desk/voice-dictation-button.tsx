"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Appends spoken text into a textarea/input by id. Hidden when unsupported. */
export function VoiceDictationButton({ targetId }: { targetId: string }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700"
      aria-label={listening ? "Dinlemeyi durdur" : "Sesle yaz"}
      onClick={() => {
        const Ctor = getSpeechRecognition();
        if (!Ctor) return;
        if (listening && recognitionRef.current) {
          recognitionRef.current.stop();
          setListening(false);
          return;
        }
        const recognition = new Ctor();
        recognition.lang = "tr-TR";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0]?.transcript ?? "")
            .join(" ")
            .trim();
          const el = document.getElementById(targetId) as
            | HTMLTextAreaElement
            | HTMLInputElement
            | null;
          if (el && transcript) {
            const sep = el.value && !el.value.endsWith(" ") ? " " : "";
            el.value = `${el.value}${sep}${transcript}`;
            el.dispatchEvent(new Event("input", { bubbles: true }));
          }
        };
        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);
        recognitionRef.current = recognition;
        recognition.start();
        setListening(true);
      }}
    >
      {listening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
      {listening ? "Durdur" : "Ses"}
    </button>
  );
}
