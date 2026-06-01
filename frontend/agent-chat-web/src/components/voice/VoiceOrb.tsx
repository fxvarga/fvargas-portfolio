import { useCallback, useEffect, useRef, useState } from 'react';
import './VoiceOrb.css';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceChatResponse {
  sessionId: string;
  userTranscript: string;
  transcript: string;
  audioUrl?: string | null;
}

const SESSION_STORAGE_KEY = 'voice-bridge:sessionId';
const SILENCE_RMS_THRESHOLD = 0.02;
const SILENCE_HOLD_MS = 1500;
const MAX_ORB_SCALE = 1.35;

export function VoiceOrb() {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.sessionStorage.getItem(SESSION_STORAGE_KEY) : null,
  );

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

  const persistSessionId = (id: string) => {
    setSessionId(id);
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  const startListening = async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : undefined,
      });
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
    } catch (e) {
      cleanupCapture();
      setState('error');
      setError(e instanceof Error ? e.message : 'Microphone permission denied.');
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

  const handleOrbClick = () => {
    if (state === 'idle' || state === 'error') {
      void startListening();
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
      setState('error');
      setError(e instanceof Error ? e.message : 'Voice request failed.');
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
        setState('error');
        setError('Audio playback failed.');
        resolve();
      };
      setState('speaking');
      audio.play().catch((err) => {
        playbackAudioRef.current = null;
        setState('error');
        setError(err instanceof Error ? err.message : 'Audio blocked.');
        resolve();
      });
    });

  const statusText = (() => {
    switch (state) {
      case 'listening':
        return 'Listening — tap to send';
      case 'processing':
        return 'Thinking…';
      case 'speaking':
        return 'Speaking — tap to interrupt';
      case 'error':
        return error ?? 'Something went wrong';
      default:
        return 'Tap the orb to talk';
    }
  })();

  const orbClasses = ['voice-orb'];
  if (state === 'listening') orbClasses.push('is-listening');
  if (state === 'processing') orbClasses.push('is-processing');
  if (state === 'speaking') orbClasses.push('is-speaking');

  return (
    <div className="flex flex-col items-center gap-8 select-none">
      <div
        role="button"
        tabIndex={0}
        aria-label={statusText}
        aria-pressed={state === 'listening'}
        onClick={handleOrbClick}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleOrbClick();
          }
        }}
        className="voice-orb-stage"
      >
        <div ref={orbRef} className={orbClasses.join(' ')} aria-hidden />
      </div>
      <p
        className={
          state === 'error'
            ? 'text-sm text-red-500'
            : 'text-sm text-gray-500 tracking-wide'
        }
      >
        {statusText}
      </p>
    </div>
  );
}
