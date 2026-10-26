import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import { Mic } from "lucide-react";

type SpeechResult = ArrayLike<{ 0: { transcript: string } }>;

type SpeechEngine = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: SpeechResult }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechEngineCtor = new () => SpeechEngine;

const SKIP_TYPES = new Set([
  "password",
  "hidden",
  "file",
  "checkbox",
  "radio",
  "date",
  "datetime-local",
  "time",
  "month",
  "week",
  "color",
  "range",
  "button",
  "submit",
  "reset",
  "image",
]);

let activeEngine: SpeechEngine | null = null;
let micUnlock: Promise<boolean> | null = null;

function getSpeechCtor(): SpeechEngineCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechEngineCtor;
    webkitSpeechRecognition?: SpeechEngineCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function isSecurePage() {
  return typeof window !== "undefined" && window.isSecureContext;
}

function isAppleTouchDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function speechLang() {
  const lang = document.documentElement.lang?.trim() || "en-US";
  return lang === "en" ? "en-US" : lang;
}

function unlockMicrophone() {
  if (micUnlock) return micUnlock;
  if (!navigator.mediaDevices?.getUserMedia) {
    micUnlock = Promise.resolve(true);
    return micUnlock;
  }
  micUnlock = navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      stream.getTracks().forEach((track) => track.stop());
      return true;
    })
    .catch(() => {
      micUnlock = null;
      return false;
    });
  return micUnlock;
}

export function isSpeechSupported() {
  return isSecurePage() && getSpeechCtor() != null;
}

export function canUseVoice(opts: {
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  voice?: boolean;
}) {
  if (opts.voice === false) return false;
  if (opts.disabled || opts.readOnly) return false;
  const type = (opts.type ?? "text").toLowerCase();
  return !SKIP_TYPES.has(type);
}

function joinSpeech(existing: string, spoken: string) {
  const text = spoken.replace(/\s+/g, " ").trim();
  if (!text) return existing;
  if (!existing.trim()) return text;
  return /\s$/.test(existing) ? existing + text : `${existing} ${text}`;
}

function applySpokenValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const limit = el.maxLength;
  const next = limit > 0 ? value.slice(0, limit) : value;
  const previous = el.value;
  if (previous === next) return;

  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, next);

  const tracker = (el as { _valueTracker?: { setValue: (value: string) => void } })._valueTracker;
  tracker?.setValue(previous);

  el.dispatchEvent(new Event("input", { bubbles: true }));
  try {
    el.setSelectionRange(next.length, next.length);
  } catch {
    /* some input types do not support a caret */
  }
}

function insecureMessage() {
  return "Voice typing needs a secure page (https). This http address blocked the microphone.";
}

function unsupportedBrowserMessage() {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/firefox/i.test(ua) && !/seamonkey/i.test(ua)) {
    return "Voice typing is not available in Firefox. Please use Chrome, Edge, or Safari.";
  }
  return "Voice typing works in Chrome, Edge, or Safari.";
}

function errorMessage(code: string) {
  if (code === "not-allowed") return "Allow microphone access to type with your voice.";
  if (code === "service-not-allowed") {
    return isSecurePage()
      ? "This browser blocked voice typing. Try Chrome, Edge, or Safari."
      : insecureMessage();
  }
  if (code === "no-speech") return "Nothing was heard. Tap the microphone to try again.";
  if (code === "network") return "Voice typing needs an internet connection.";
  if (code === "audio-capture") return "No microphone was found.";
  if (code === "aborted") return "";
  return "Voice typing stopped. Tap the microphone to try again.";
}

type FieldEl = HTMLInputElement | HTMLTextAreaElement;
type FieldRef = Ref<FieldEl> | Ref<HTMLInputElement> | Ref<HTMLTextAreaElement>;

function assignRef(ref: FieldRef | undefined, value: FieldEl | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    (ref as (node: FieldEl | null) => void)(value);
    return;
  }
  (ref as { current: FieldEl | null }).current = value;
}

export function VoiceChrome({
  align = "center",
  fieldRef,
  children,
}: {
  align?: "center" | "top";
  fieldRef?: FieldRef;
  children: (bind: {
    ref: (node: HTMLInputElement | HTMLTextAreaElement | null) => void;
    describedBy?: string;
  }) => ReactNode;
}) {
  const nodeRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  function setFieldRef(node: HTMLInputElement | HTMLTextAreaElement | null) {
    nodeRef.current = node;
    assignRef(fieldRef, node);
  }
  const engineRef = useRef<SpeechEngine | null>(null);
  const keepAliveRef = useRef(false);
  const baseRef = useRef("");
  const restartsRef = useRef(0);
  const networkErrorsRef = useRef(0);
  const appleMobileRef = useRef(false);
  const statusId = useId();
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      keepAliveRef.current = false;
      engineRef.current?.abort();
      if (activeEngine === engineRef.current) activeEngine = null;
    };
  }, []);

  function stopListening() {
    keepAliveRef.current = false;
    setListening(false);
    setMessage((current) => (current.startsWith("Listening") ? "" : current));
    engineRef.current?.abort();
  }

  function bindEngine(engine: SpeechEngine, el: FieldEl) {
    engine.lang = speechLang();
    engine.continuous = !appleMobileRef.current;
    engine.interimResults = true;
    engine.maxAlternatives = 1;

    engine.onresult = (event) => {
      restartsRef.current = 0;
      networkErrorsRef.current = 0;
      let spoken = "";
      for (let i = 0; i < event.results.length; i += 1) {
        spoken += event.results[i][0].transcript;
      }
      applySpokenValue(el, joinSpeech(baseRef.current, spoken));
    };

    engine.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      if (event.error === "network" && networkErrorsRef.current < 2) {
        networkErrorsRef.current += 1;
        return;
      }
      keepAliveRef.current = false;
      setMessage(errorMessage(event.error));
      setListening(false);
    };

    engine.onend = () => {
      if (keepAliveRef.current && engineRef.current === engine) {
        restartsRef.current += 1;
        if (restartsRef.current > 30) {
          keepAliveRef.current = false;
          setListening(false);
          setMessage("Voice typing stopped. Tap the microphone to try again.");
          return;
        }
        window.setTimeout(() => {
          if (!keepAliveRef.current || engineRef.current !== engine) return;
          try {
            baseRef.current = nodeRef.current?.value ?? baseRef.current;
            engine.start();
          } catch {
            keepAliveRef.current = false;
            setListening(false);
            setMessage("Voice typing could not start. Tap the microphone to try again.");
          }
        }, appleMobileRef.current ? 300 : 40);
        return;
      }
      if (engineRef.current === engine) engineRef.current = null;
      if (activeEngine === engine) activeEngine = null;
      setListening(false);
      setMessage((current) => (current.startsWith("Listening") ? "" : current));
    };
  }

  function beginRecognition(Ctor: SpeechEngineCtor, el: FieldEl) {
    if (activeEngine && activeEngine !== engineRef.current) {
      activeEngine.abort();
      activeEngine = null;
    }

    let engine = engineRef.current;
    if (!engine) {
      engine = new Ctor();
      engineRef.current = engine;
    }
    activeEngine = engine;
    bindEngine(engine, el);
    baseRef.current = el.value;
    keepAliveRef.current = true;
    restartsRef.current = 0;
    networkErrorsRef.current = 0;
    setListening(true);
    setMessage("Listening… tap the microphone when you are done.");
    el.focus();

    try {
      engine.start();
    } catch (err) {
      const alreadyStarted = err instanceof Error && err.name === "InvalidStateError";
      if (alreadyStarted) return;
      keepAliveRef.current = false;
      setListening(false);
      setMessage("Voice typing could not start. Tap the microphone to try again.");
    }
  }

  async function startListening() {
    const el = nodeRef.current;
    if (!el) return;
    if (!isSecurePage()) {
      setMessage(insecureMessage());
      return;
    }
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      setMessage(unsupportedBrowserMessage());
      return;
    }

    appleMobileRef.current = isAppleTouchDevice();
    if (appleMobileRef.current) {
      setMessage("Allow the microphone if your browser asks.");
      const allowed = await unlockMicrophone();
      if (!allowed) {
        setMessage("Allow microphone access to type with your voice.");
        return;
      }
      if (nodeRef.current !== el) return;
    }

    beginRecognition(Ctor, el);
  }

  return (
    <div className="w-full min-w-0">
      <div className="relative">
        {children({
          ref: setFieldRef,
          describedBy: message ? statusId : undefined,
        })}
        <button
          type="button"
          className={`absolute right-1 z-10 grid size-11 place-items-center rounded-lg ${
            align === "top" ? "top-2" : "top-1/2 -translate-y-1/2"
          } ${
            listening
              ? "bg-teal-soft text-teal-dark"
              : "text-muted hover:bg-teal-soft hover:text-teal-dark"
          }`}
          aria-pressed={listening}
          aria-label={listening ? "Stop voice typing" : "Type with your voice"}
          title={listening ? "Stop voice typing" : "Type with your voice"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (listening) stopListening();
            else void startListening();
          }}
        >
          <Mic
            className={`size-5 ${listening ? "animate-pulse" : ""}`}
            strokeWidth={listening ? 2.5 : 2}
            aria-hidden="true"
          />
        </button>
      </div>
      {message ? (
        <p
          id={statusId}
          className={`mt-1.5 text-sm leading-snug ${listening ? "text-muted" : "text-terracotta"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
