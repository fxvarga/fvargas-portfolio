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
const MAX_ORB_SCALE = 1.35;
const MIN_RECORDING_BYTES = 2048;

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
    case 'RecordingTooShort':
      return 'I did not catch enough audio. Tap Talk again, speak, then tap Stop and send.';
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
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingObjectUrlRef = useRef<string | null>(null);

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
      if (pendingObjectUrlRef.current) {
        URL.revokeObjectURL(pendingObjectUrlRef.current);
        pendingObjectUrlRef.current = null;
      }
    };
  }, [cleanupCapture]);

  const persistSessionId = (id: string) => {
    setSessionId(id);
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  const beginListening = (stream: MediaStream) => {
    streamRef.current = stream;
    chunksRef.current = [];

    let recorder: MediaRecorder;
    try {
      const webmOpus = MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
      // Prefer webm/opus where supported (Chromium, Firefox); fall back to
      // browser default (iOS Safari emits audio/mp4 with AAC). The voice-bridge
      // backend feeds both through GStreamer via AudioStreamContainerFormat.ANY.
      recorder = new MediaRecorder(stream, {
        mimeType: webmOpus ? 'audio/webm;codecs=opus' : undefined,
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
      // Keep the granted MediaStream alive after a recording finishes. iOS
      // Safari can grant getUserMedia once and then reject subsequent
      // re-requests in the same page session; reusing the live stream avoids
      // the permission path after the first successful grant.
      cleanupCapture(false);
      if (blob.size < MIN_RECORDING_BYTES) {
        // iOS Safari can occasionally fire stop before MediaRecorder has
        // emitted a usable chunk (we observed 5-byte blobs reaching the
        // backend, which Azure STT rejects with a timeout). Keep this local
        // and ask the user to try again instead of sending guaranteed-bad
        // audio to voice-bridge.
        setError({
          name: 'RecordingTooShort',
          message: `Recording too short (${blob.size} bytes).`,
        });
        setState('error');
        return;
      }
      await runVoiceFlow(blob);
    };
    recorder.onerror = () => {
      setError({ name: 'RecorderError', message: 'Recording failed. Please try again.' });
      setState('error');
    };

    try {
      // Timeslice makes Safari emit data chunks while recording instead of
      // waiting until stop. This avoids the observed 5-byte second-turn blobs
      // where stop fires before a real encoded chunk is available.
      recorder.start(250);
    } catch (e) {
      cleanupCapture();
      const err = e instanceof Error ? e : new Error('MediaRecorder.start failed');
      setError({ name: err.name || 'Error', message: err.message });
      setState('error');
      return;
    }
    setState('listening');
    try {
      startAudioMeter(stream);
    } catch {
      // Audio metering is visual-only; recording can continue without it.
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

  const handleEnableMic = () => {
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
        const audioResponse = await fetch(data.audioUrl, {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!audioResponse.ok) {
          throw new Error(`Audio download failed (${audioResponse.status})`);
        }

        const audioBlob = await audioResponse.blob();
        if (pendingObjectUrlRef.current) {
          URL.revokeObjectURL(pendingObjectUrlRef.current);
        }
        const objectUrl = URL.createObjectURL(audioBlob);
        pendingObjectUrlRef.current = objectUrl;

        const played = await playAudio(objectUrl);
        if (!played) {
          setPendingAudioUrl(objectUrl);
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
        if (pendingObjectUrlRef.current === url) {
          URL.revokeObjectURL(url);
          pendingObjectUrlRef.current = null;
        }
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
    if (!pendingAudioUrl) return;
    const src = pendingAudioUrl;
    void playAudio(src).then((played) => {
      if (!played && pendingObjectUrlRef.current === src) {
        setPendingAudioUrl(src);
      }
    });
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
      {state === 'error' && error ? (
        <p className="text-xs text-gray-400 font-mono">{error.name}</p>
      ) : null}
    </div>
  );
}
