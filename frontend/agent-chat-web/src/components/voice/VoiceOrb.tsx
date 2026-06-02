import { useCallback, useEffect, useRef, useState } from 'react';
import './VoiceOrb.css';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceChatResponse {
  sessionId: string;
  userTranscript: string;
  transcript: string;
  audioUrl?: string | null;
}

interface VoiceError {
  name: string;
  message: string;
}

const SESSION_STORAGE_KEY = 'voice-bridge:sessionId';
const SILENCE_RMS_THRESHOLD = 0.02;
const SILENCE_HOLD_MS = 1500;
const MAX_ORB_SCALE = 1.35;

/**
 * Map a DOMException-style error.name into a user-facing instruction.
 * iOS Safari reports NotAllowedError both for system-denied mic AND for
 * iOS-specific permission glitches where re-requesting from a fresh user
 * gesture is the only recovery path.
 */
function describeError(err: VoiceError): string {
  switch (err.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Microphone blocked. Tap "Enable microphone" below, or open Safari Settings → Microphone for this site → Ask.';
    case 'NotFoundError':
      return 'No microphone detected on this device.';
    case 'NotReadableError':
      return 'Mic is in use by another app. Close other recording apps and try again.';
    case 'OverconstrainedError':
      return 'Mic does not satisfy the required constraints.';
    case 'AbortError':
      return 'Mic capture was aborted. Try again.';
    default:
      return err.message || 'Microphone unavailable.';
  }
}

export function VoiceOrb() {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<VoiceError | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.sessionStorage.getItem(SESSION_STORAGE_KEY) : null,
  );
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionState, setPermissionState] = useState<string>('unknown');
  const [diagnostics, setDiagnostics] = useState<string>('');

  const orbRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  const setOrbScale = (scale: number) => {
    if (orbRef.current) {
      orbRef.current.style.setProperty('--orb-scale', scale.toFixed(3));
    }
  };

  const cleanupCapture = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioCtxRef.current?.close().catch(() => undefined);
    analyserRef.current = null;
    sourceRef.current = null;
    audioCtxRef.current = null;
    silenceStartRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setOrbScale(1);
  }, []);

  useEffect(() => {
    return () => {
      cleanupCapture();
      playbackAudioRef.current?.pause();
      playbackAudioRef.current = null;
    };
  }, [cleanupCapture]);

  // Pre-flight permission probe. Where supported, this lets us tell the user
  // up front that the mic is blocked, instead of waiting for them to tap the
  // orb and see a generic error.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
      setPermissionState('permissions-api-unsupported');
      return;
    }
    let cancelled = false;
    navigator.permissions
      // PermissionName doesn't include 'microphone' in lib.dom.d.ts; cast is intentional.
      .query({ name: 'microphone' as PermissionName })
      .then((status) => {
        if (cancelled) return;
        const apply = () => {
          setPermissionState(status.state);
          setPermissionDenied(status.state === 'denied');
        };
        apply();
        status.onchange = apply;
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? `${e.name}:${e.message}` : 'error';
        setPermissionState(`query-failed(${msg})`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Collect environment info we care about for diagnosing iOS Safari mic
  // failures. Updated whenever the error state changes so the user can
  // screenshot it.
  useEffect(() => {
    const lines: string[] = [];
    lines.push(`isSecureContext: ${String(window.isSecureContext)}`);
    lines.push(`protocol: ${window.location.protocol}`);
    lines.push(`host: ${window.location.host}`);
    lines.push(`mediaDevices: ${typeof navigator.mediaDevices}`);
    lines.push(`getUserMedia: ${typeof navigator.mediaDevices?.getUserMedia}`);
    lines.push(`MediaRecorder: ${typeof MediaRecorder}`);
    lines.push(`webmOpus: ${MediaRecorder?.isTypeSupported?.('audio/webm;codecs=opus') ?? 'n/a'}`);
    lines.push(`mp4: ${MediaRecorder?.isTypeSupported?.('audio/mp4') ?? 'n/a'}`);
    lines.push(`permissions.query: ${typeof navigator.permissions?.query}`);
    lines.push(`permState: ${permissionState}`);
    lines.push(`UA: ${navigator.userAgent}`);
    if (error) {
      lines.push(`errName: ${error.name}`);
      lines.push(`errMsg: ${error.message}`);
    }
    setDiagnostics(lines.join('\n'));
  }, [state, error, permissionState]);

  const persistSessionId = (id: string) => {
    setSessionId(id);
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  /**
   * Acquire the mic stream. MUST be called synchronously from a user-gesture
   * handler on iOS Safari -- any prior `await` or React state-setter chain in
   * the same handler can consume the activation token and cause the prompt to
   * be silently rejected with NotAllowedError. Callers pass an already-resolved
   * MediaStream into the rest of the listening flow.
   */
  const acquireMicStream = (): Promise<MediaStream> =>
    navigator.mediaDevices.getUserMedia({ audio: true });

  const beginListening = (stream: MediaStream) => {
    streamRef.current = stream;
    chunksRef.current = [];

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : undefined,
      });
    } catch (e) {
      cleanupCapture();
      const err = e instanceof Error ? e : new Error('MediaRecorder unavailable');
      setError({ name: err.name || 'Error', message: err.message });
      setState('error');
      return;
    }

    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      cleanupCapture();
      if (blob.size === 0) {
        setState('idle');
        return;
      }
      await runVoiceFlow(blob);
    };

    recorder.start();
    setState('listening');
    startAudioMeter(stream);
  };

  const stopListening = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop(); // triggers onstop -> runVoiceFlow
    } else {
      cleanupCapture();
      setState('idle');
    }
  };

  /**
   * Orb tap handler. The synchronous-first-line getUserMedia call is load-
   * bearing: iOS Safari requires getUserMedia to be invoked inside the same
   * task as the user gesture, before any awaits or state-setter side-effects.
   */
  const handleOrbClick = () => {
    if (state === 'idle' || state === 'error') {
      // Synchronous invocation -- preserves the user-activation token.
      const micPromise = acquireMicStream();
      // Now that the permission request is in-flight, it's safe to do React
      // state updates and other async work.
      setError(null);
      micPromise
        .then((stream) => {
          setPermissionDenied(false);
          beginListening(stream);
        })
        .catch((e: unknown) => {
          cleanupCapture();
          const err =
            e instanceof Error
              ? { name: e.name || 'Error', message: e.message }
              : { name: 'Error', message: 'Microphone unavailable.' };
          if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
            setPermissionDenied(true);
          }
          setError(err);
          setState('error');
        });
      return;
    }
    if (state === 'listening') {
      stopListening();
      return;
    }
    if (state === 'speaking') {
      playbackAudioRef.current?.pause();
      playbackAudioRef.current = null;
      setState('idle');
    }
    // Processing: ignore clicks; request is in-flight.
  };

  /**
   * Dedicated "Enable microphone" button -- mirrors the pattern mictests.com
   * uses to recover from cached iOS permission state. Acquires a stream, then
   * immediately releases it, just to force the OS prompt from a clean gesture.
   */
  const handleEnableMic = () => {
    const micPromise = acquireMicStream();
    setError(null);
    micPromise
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setPermissionDenied(false);
        setState('idle');
      })
      .catch((e: unknown) => {
        const err =
          e instanceof Error
            ? { name: e.name || 'Error', message: e.message }
            : { name: 'Error', message: 'Microphone unavailable.' };
        setError(err);
        setPermissionDenied(err.name === 'NotAllowedError' || err.name === 'SecurityError');
        setState('error');
      });
  };

  /**
   * Diagnostic-only path. Bypasses MediaRecorder, AnalyserNode, AudioContext,
   * and the orb state machine entirely. Just calls getUserMedia synchronously
   * from a clean tap, then immediately stops. Surfaces the raw outcome so we
   * can tell whether the failure is permission-level (NotAllowedError) or
   * something inside our recorder/analyser setup.
   */
  const handleRawMicTest = () => {
    const micPromise = navigator.mediaDevices?.getUserMedia?.({ audio: true });
    if (!micPromise) {
      setError({
        name: 'NoMediaDevices',
        message: 'navigator.mediaDevices.getUserMedia is undefined.',
      });
      setState('error');
      return;
    }
    setError(null);
    micPromise
      .then((stream) => {
        const trackInfo = stream
          .getAudioTracks()
          .map((t) => `${t.label || '(no label)'}|enabled=${t.enabled}|state=${t.readyState}`)
          .join(' / ');
        stream.getTracks().forEach((t) => t.stop());
        setError({
          name: 'RawTestSuccess',
          message: `Got ${stream.getAudioTracks().length} track(s): ${trackInfo}`,
        });
        setState('error'); // 'error' state just so the diagnostic panel shows
        setPermissionDenied(false);
      })
      .catch((e: unknown) => {
        const err =
          e instanceof Error
            ? { name: e.name || 'Error', message: e.message }
            : { name: 'Error', message: 'Raw mic test failed.' };
        setError(err);
        setState('error');
      });
  };

  const startAudioMeter = (stream: MediaStream) => {
    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);

    audioCtxRef.current = ctx;
    sourceRef.current = source;
    analyserRef.current = analyser;

    const buffer = new Uint8Array(analyser.fftSize);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(buffer);

      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const v = (buffer[i] - 128) / 128;
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / buffer.length);

      const scale = 1 + Math.min(MAX_ORB_SCALE - 1, rms * 3.5);
      setOrbScale(scale);

      const now = performance.now();
      if (rms < SILENCE_RMS_THRESHOLD) {
        if (silenceStartRef.current === null) silenceStartRef.current = now;
        if (
          now - silenceStartRef.current > SILENCE_HOLD_MS &&
          recorderRef.current?.state === 'recording'
        ) {
          recorderRef.current.stop();
          return;
        }
      } else {
        silenceStartRef.current = null;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const runVoiceFlow = async (blob: Blob) => {
    setState('processing');
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'voice-input.webm');
      if (sessionId) formData.append('sessionId', sessionId);

      const response = await fetch('/api/voice/chat', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Voice request failed (${response.status})`);
      }

      const data = (await response.json()) as VoiceChatResponse;
      if (data.sessionId && data.sessionId !== sessionId) persistSessionId(data.sessionId);

      if (data.audioUrl) {
        await playAudio(data.audioUrl);
      } else {
        setState('idle');
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Voice request failed.');
      setError({ name: err.name || 'Error', message: err.message });
      setState('error');
    }
  };

  const playAudio = (url: string) =>
    new Promise<void>((resolve) => {
      const audio = new Audio(url);
      playbackAudioRef.current = audio;
      audio.onended = () => {
        playbackAudioRef.current = null;
        setState('idle');
        resolve();
      };
      audio.onerror = () => {
        playbackAudioRef.current = null;
        setError({ name: 'AudioError', message: 'Audio playback failed.' });
        setState('error');
        resolve();
      };
      setState('speaking');
      audio.play().catch((err: unknown) => {
        playbackAudioRef.current = null;
        const e = err instanceof Error ? err : new Error('Audio blocked.');
        setError({ name: e.name || 'AudioError', message: e.message });
        setState('error');
        resolve();
      });
    });

  const showEnableMicButton =
    permissionDenied ||
    (state === 'error' && error?.name === 'NotAllowedError') ||
    (state === 'error' && error?.name === 'SecurityError');

  const statusText = (() => {
    if (state === 'error' && error) return describeError(error);
    if (permissionDenied) return 'Microphone is blocked. Tap "Enable microphone" below.';
    switch (state) {
      case 'listening':
        return 'Listening — tap to send';
      case 'processing':
        return 'Thinking…';
      case 'speaking':
        return 'Speaking — tap to interrupt';
      default:
        return 'Tap the orb to talk';
    }
  })();

  const orbClasses = ['voice-orb'];
  if (state === 'listening') orbClasses.push('is-listening');
  if (state === 'processing') orbClasses.push('is-processing');
  if (state === 'speaking') orbClasses.push('is-speaking');

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/*
        Must be a real <button>, not a styled <div role="button">. iOS Safari
        treats the activation token from a <div onClick> tap as weaker and
        silently rejects getUserMedia in some versions, even when an identical
        call from a real <button onClick> succeeds. The raw-mic-test button
        below is what surfaced this difference.
      */}
      <button
        type="button"
        aria-label={statusText}
        aria-pressed={state === 'listening'}
        onClick={handleOrbClick}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleOrbClick();
          }
        }}
        className="voice-orb-stage appearance-none bg-transparent border-0 p-0 cursor-pointer"
      >
        <div ref={orbRef} className={orbClasses.join(' ')} aria-hidden />
      </button>
      <p
        className={
          state === 'error' || permissionDenied
            ? 'text-sm text-red-500 text-center max-w-xs'
            : 'text-sm text-gray-500 tracking-wide'
        }
      >
        {statusText}
      </p>
      {showEnableMicButton ? (
        <button
          type="button"
          onClick={handleEnableMic}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
        >
          Enable microphone
        </button>
      ) : null}
      <button
        type="button"
        onClick={handleRawMicTest}
        className="px-3 py-1 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100"
      >
        Raw mic test (diagnostic)
      </button>
      {state === 'error' && error ? (
        <p className="text-xs text-gray-400 font-mono">{error.name}</p>
      ) : null}
      {/* Always-visible diagnostics panel. Tiny and dim when no error, more
          visible when something failed. Useful for triaging iOS Safari mic
          problems where the failure mode varies subtly across iOS versions. */}
      <pre
        className={
          state === 'error'
            ? 'text-[10px] leading-tight font-mono text-gray-600 bg-gray-100 p-2 rounded max-w-[90vw] overflow-x-auto whitespace-pre-wrap break-all'
            : 'text-[9px] leading-tight font-mono text-gray-300 max-w-[90vw] overflow-x-auto whitespace-pre-wrap break-all'
        }
      >
        {diagnostics}
      </pre>
    </div>
  );
}
