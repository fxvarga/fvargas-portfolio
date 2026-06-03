import { useCallback, useEffect, useRef, useState } from 'react';
import './VoiceOrb.css';

// Baked at build time by Vite (see vite.config.ts -> define).
declare const __BUILD_ID__: string;

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
    case 'AudioBlocked':
      return 'Response is ready. Tap "Play response" to hear it.';
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
  const [permissionState, setPermissionState] = useState<string>('unknown');
  const [diagnostics, setDiagnostics] = useState<string>('');
  const [hasMicStream, setHasMicStream] = useState(false);
  const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);

  const orbRef = useRef<HTMLElement | null>(null);
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

  const cleanupCapture = useCallback((stopStream = true) => {
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
    if (stopStream) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setHasMicStream(false);
    } else {
      setHasMicStream(Boolean(streamRef.current?.getAudioTracks().some((t) => t.readyState === 'live')));
    }
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

  // Pre-flight permission probe for diagnostics only. iOS Safari has proven
  // unreliable here: it can report "denied" even after getUserMedia succeeds.
  // Therefore this state must NEVER drive UI or control flow.
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
    lines.push(`build: ${__BUILD_ID__}`);
    lines.push(`isSecureContext: ${String(window.isSecureContext)}`);
    lines.push(`protocol: ${window.location.protocol}`);
    lines.push(`host: ${window.location.host}`);
    lines.push(`mediaDevices: ${typeof navigator.mediaDevices}`);
    lines.push(`getUserMedia: ${typeof navigator.mediaDevices?.getUserMedia}`);
    lines.push(`hasMicStream: ${String(hasMicStream)}`);
    lines.push(`streamLive: ${String(streamRef.current?.getAudioTracks().some((t) => t.readyState === 'live') ?? false)}`);
    lines.push(`pendingAudio: ${String(Boolean(pendingAudioUrl))}`);
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
  }, [state, error, permissionState, hasMicStream, pendingAudioUrl]);

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
   *
   * Kept as a thin wrapper purely for documentation; callers MUST invoke it
   * inline as the first statement of their click handler.
   */
  const acquireMicStream = (): Promise<MediaStream> =>
    navigator.mediaDevices.getUserMedia({ audio: true });

  const beginListening = (stream: MediaStream) => {
    streamRef.current = stream;
    chunksRef.current = [];

    // eslint-disable-next-line no-console
    console.log('[voice-orb] beginListening: stream tracks', stream.getAudioTracks().length);

    let recorder: MediaRecorder;
    try {
      const webmOpus = MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
      const mp4 = MediaRecorder.isTypeSupported('audio/mp4');
      // eslint-disable-next-line no-console
      console.log('[voice-orb] mimeType support', { webmOpus, mp4 });
      // Prefer webm/opus where supported (Chromium, Firefox); fall back to
      // browser default (iOS Safari emits audio/mp4 with AAC). The voice-bridge
      // backend feeds both through GStreamer via AudioStreamContainerFormat.ANY.
      recorder = new MediaRecorder(stream, {
        mimeType: webmOpus ? 'audio/webm;codecs=opus' : undefined,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[voice-orb] MediaRecorder ctor failed', e);
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
      // Keep the granted MediaStream alive after a recording finishes. iOS
      // Safari can grant getUserMedia once and then reject subsequent
      // re-requests in the same page session; reusing the live stream avoids
      // the permission path after the first successful grant.
      cleanupCapture(false);
      if (blob.size === 0) {
        setState('idle');
        return;
      }
      await runVoiceFlow(blob);
    };
    recorder.onerror = (ev) => {
      // eslint-disable-next-line no-console
      console.error('[voice-orb] MediaRecorder error event', ev);
    };

    try {
      recorder.start();
      // eslint-disable-next-line no-console
      console.log('[voice-orb] recorder.start OK');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[voice-orb] recorder.start threw', e);
      cleanupCapture();
      const err = e instanceof Error ? e : new Error('MediaRecorder.start failed');
      setError({ name: err.name || 'Error', message: err.message });
      setState('error');
      return;
    }
    setState('listening');
    try {
      startAudioMeter(stream);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[voice-orb] audio meter setup failed (non-fatal)', e);
    }
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
   * Start recording from the primary native button.
   *
   * This is intentionally structured like handleRawMicTest: the FIRST
   * executable line is the getUserMedia call, with no state branch, logging,
   * helper call, or feature check before it. iOS Safari is extremely sensitive
   * to what happens before media capture inside a tap handler.
   */
  const handleRequestMicAndStart = () => {
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
    setPendingAudioUrl(null);
    micPromise
      .then((stream) => {
        streamRef.current = stream;
        setHasMicStream(true);
        beginListening(stream);
      })
      .catch((e: unknown) => {
        cleanupCapture();
        const err =
          e instanceof Error
            ? { name: e.name || 'Error', message: e.message }
            : { name: 'Error', message: 'Microphone unavailable.' };
        setError(err);
        setState('error');
      });
  };

  const handleStartWithExistingStream = () => {
    const stream = streamRef.current;
    const hasLiveAudio = stream?.getAudioTracks().some((track) => track.readyState === 'live');
    if (!stream || !hasLiveAudio) {
      setHasMicStream(false);
      setError({
        name: 'MicStreamExpired',
        message: 'The previous microphone stream expired. Tap again to re-enable the microphone.',
      });
      setState('error');
      return;
    }
    setError(null);
    setPendingAudioUrl(null);
    beginListening(stream);
  };

  const handleInterruptSpeaking = () => {
    playbackAudioRef.current?.pause();
    playbackAudioRef.current = null;
    setState('idle');
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
        setState('idle');
      })
      .catch((e: unknown) => {
        const err =
          e instanceof Error
            ? { name: e.name || 'Error', message: e.message }
            : { name: 'Error', message: 'Microphone unavailable.' };
        setError(err);
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
        const played = await playAudio(data.audioUrl);
        if (!played) {
          setPendingAudioUrl(data.audioUrl);
        }
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
    new Promise<boolean>((resolve) => {
      const audio = new Audio(url);
      playbackAudioRef.current = audio;
      setPendingAudioUrl(null);
      audio.onended = () => {
        playbackAudioRef.current = null;
        setState('idle');
        resolve(true);
      };
      audio.onerror = () => {
        playbackAudioRef.current = null;
        setError({ name: 'AudioError', message: 'Audio playback failed.' });
        setState('error');
        resolve(false);
      };
      setState('speaking');
      audio.play().catch((err: unknown) => {
        playbackAudioRef.current = null;
        const e = err instanceof Error ? err : new Error('Audio blocked.');
        // iOS Safari can block async audio.play() because the playback happens
        // after a network round trip, outside the original stop/send gesture.
        // That's not a fatal voice error: keep the audio URL and ask the user
        // for a fresh gesture via the Play response button.
        setError({ name: 'AudioBlocked', message: e.message });
        setState('idle');
        resolve(false);
      });
    });

  const handlePlayPendingAudio = () => {
    if (pendingAudioUrl) void playAudio(pendingAudioUrl);
  };

  const showEnableMicButton =
    (state === 'error' && error?.name === 'NotAllowedError') ||
    (state === 'error' && error?.name === 'SecurityError');

  const statusText = (() => {
    // Active states win over any permission flag: if we're actually recording,
    // thinking, or speaking, the mic is clearly not blocked even if iOS
    // Safari's permissions.query keeps stale-reporting 'denied'.
    switch (state) {
      case 'listening':
        return 'Listening — tap to send';
      case 'processing':
        return 'Thinking…';
      case 'speaking':
        return 'Speaking — tap to interrupt';
    }
    if (pendingAudioUrl) return 'Response is ready — tap Play response';
    if (state === 'error' && error) return describeError(error);
    return 'Tap the orb to talk';
  })();

  const orbClasses = ['voice-orb'];
  if (state === 'listening') orbClasses.push('is-listening');
  if (state === 'processing') orbClasses.push('is-processing');
  if (state === 'speaking') orbClasses.push('is-speaking');

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/*
        Decorative/audio-reactive orb only. iOS Safari proved unreliable when
        the animated/transformed orb itself was the getUserMedia trigger, while
        a plain native button on the same page succeeds. Keep the visual, but
        use a simple native button below as the actual mic control.
      */}
      <div ref={orbRef as React.RefObject<HTMLDivElement>} className={`voice-orb-button ${orbClasses.join(' ')}`} aria-hidden />
      <p
        className={
          state === 'error'
            ? 'text-sm text-red-500 text-center max-w-xs'
            : 'text-sm text-gray-500 tracking-wide'
        }
      >
        {statusText}
      </p>
      {pendingAudioUrl ? (
        <button
          type="button"
          onClick={handlePlayPendingAudio}
          className="px-6 py-3 text-base rounded-full border border-sky-300 bg-sky-50 text-sky-700 active:bg-sky-100"
        >
          Play response
        </button>
      ) : null}
      {state === 'listening' ? (
        <button
          type="button"
          onClick={stopListening}
          className="px-6 py-3 text-base rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 active:bg-emerald-100"
        >
          Stop and send
        </button>
      ) : state === 'processing' ? (
        <button
          type="button"
          disabled
          className="px-6 py-3 text-base rounded-full border border-gray-300 bg-white text-gray-500 shadow-sm opacity-60"
        >
          Thinking...
        </button>
      ) : state === 'speaking' ? (
        <button
          type="button"
          onClick={handleInterruptSpeaking}
          className="px-6 py-3 text-base rounded-full border border-sky-300 bg-sky-50 text-sky-700 active:bg-sky-100"
        >
          Stop playback
        </button>
      ) : (
        <button
          type="button"
          onClick={hasMicStream ? handleStartWithExistingStream : handleRequestMicAndStart}
          className="px-6 py-3 text-base rounded-full border border-gray-300 bg-white text-gray-800 shadow-sm active:bg-gray-100"
        >
          {hasMicStream ? 'Talk again' : 'Tap to talk'}
        </button>
      )}
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
