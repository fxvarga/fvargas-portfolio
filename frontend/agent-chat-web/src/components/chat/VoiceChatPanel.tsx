import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Loader2, X, RotateCcw, Volume2, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type VoiceState = 'Idle' | 'Listening' | 'Processing' | 'Speaking' | 'Error';

interface TranscriptLine {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceChatResponse {
  sessionId: string;
  userTranscript: string;
  assistantText: string;
  audioUrl?: string;
}

const SESSION_STORAGE_KEY = 'voice-bridge:sessionId';

export function VoiceChatPanel() {
  const [state, setState] = useState<VoiceState>('Idle');
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.sessionStorage.getItem(SESSION_STORAGE_KEY) : null,
  );

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartedRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const canStart = state !== 'Listening' && state !== 'Processing' && state !== 'Speaking';

  const statusClass = useMemo(() => {
    switch (state) {
      case 'Listening':
        return 'text-red-400';
      case 'Processing':
        return 'text-blue-400';
      case 'Speaking':
        return 'text-green-400';
      case 'Error':
        return 'text-amber-400';
      default:
        return 'text-gray-400';
    }
  }, [state]);

  const persistSessionId = (id: string) => {
    setSessionId(id);
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    } catch {
      // Ignore quota/availability errors
    }
  };

  const resetSession = () => {
    setSessionId(null);
    setTranscripts([]);
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const startListening = async () => {
    if (!canStart) return;

    try {
      setError(null);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : undefined,
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stopMedia();

        if (blob.size === 0) {
          setState('Idle');
          return;
        }

        setLastBlob(blob);
        await runVoiceFlow(blob);
      };

      recorder.start();
      setState('Listening');
      startSilenceDetection(stream);
    } catch {
      setState('Error');
      setError('Unable to access microphone. Check browser permissions.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelListening = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      chunksRef.current = [];
    }
    stopMedia();
    setState('Idle');
  };

  const retryLast = async () => {
    if (!lastBlob) return;
    await runVoiceFlow(lastBlob);
  };

  const runVoiceFlow = async (blob: Blob) => {
    setState('Processing');

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

      if (data.sessionId && data.sessionId !== sessionId) {
        persistSessionId(data.sessionId);
      }

      setTranscripts((prev) => [
        ...prev,
        { role: 'user', content: data.userTranscript },
        { role: 'assistant', content: data.assistantText },
      ]);

      if (data.audioUrl) {
        await playAudio(data.audioUrl);
      } else {
        setState('Idle');
      }
    } catch (e) {
      setState('Error');
      setError(e instanceof Error ? e.message : 'Voice request failed.');
    }
  };

  const playAudio = (url: string) =>
    new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audioElementRef.current = audio;

      audio.onended = () => {
        setState('Idle');
        resolve();
      };
      audio.onerror = () => {
        setState('Error');
        setError('Failed to play assistant audio.');
        resolve();
      };

      setState('Speaking');
      audio.play().catch((err) => {
        setState('Error');
        setError(err instanceof Error ? err.message : 'Audio playback blocked.');
        resolve();
      });
    });

  const stopMedia = () => {
    if (silenceIntervalRef.current !== null) {
      window.clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }

    analyserRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    audioContextRef.current?.close();
    analyserRef.current = null;
    sourceNodeRef.current = null;
    audioContextRef.current = null;
    silenceStartedRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopMedia();
      audioElementRef.current?.pause();
      audioElementRef.current = null;
    };
  }, []);

  const startSilenceDetection = (stream: MediaStream) => {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);

    audioContextRef.current = context;
    sourceNodeRef.current = source;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.fftSize);

    silenceIntervalRef.current = window.setInterval(() => {
      if (mediaRecorderRef.current?.state !== 'recording') return;

      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i += 1) {
        const value = (dataArray[i] - 128) / 128;
        sum += value * value;
      }

      const rms = Math.sqrt(sum / dataArray.length);
      const now = Date.now();

      if (rms < 0.02) {
        if (silenceStartedRef.current === null) {
          silenceStartedRef.current = now;
        }

        if (now - silenceStartedRef.current > 1500) {
          stopListening();
        }
      } else {
        silenceStartedRef.current = null;
      }
    }, 200);
  };

  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-800/40 p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mic className={`w-5 h-5 ${statusClass}`} />
          <span className="text-sm text-gray-300">Voice: {state}</span>
        </div>

        <div className="flex items-center gap-2">
          {state === 'Listening' ? (
            <>
              <Button
                onClick={stopListening}
                size="sm"
                className="gap-1.5 bg-red-600 hover:bg-red-700"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
              <Button variant="ghost" onClick={cancelListening} size="sm" className="gap-1.5">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={startListening}
              disabled={!canStart}
              size="sm"
              className="gap-1.5"
            >
              {state === 'Processing' || state === 'Speaking' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {state === 'Processing'
                ? 'Processing'
                : state === 'Speaking'
                  ? 'Speaking'
                  : 'Record'}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={retryLast}
            size="sm"
            disabled={!lastBlob || state === 'Listening'}
            className="gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </Button>

          <Button
            variant="ghost"
            onClick={resetSession}
            size="sm"
            disabled={!sessionId && transcripts.length === 0}
            className="gap-1.5"
          >
            New Session
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-amber-400">{error}</p>}

      {transcripts.length > 0 && (
        <div className="max-h-60 overflow-y-auto rounded-md border border-gray-700 bg-gray-900/60 p-3 space-y-2">
          {transcripts.map((line, index) => (
            <div key={`${line.role}-${index}`} className="text-sm">
              <span
                className={`mr-2 font-medium ${
                  line.role === 'user' ? 'text-blue-300' : 'text-green-300'
                }`}
              >
                {line.role === 'user' ? 'You' : 'Hermes'}:
              </span>
              <span className="text-gray-200">{line.content}</span>
            </div>
          ))}
        </div>
      )}

      {state === 'Speaking' && (
        <div className="flex items-center gap-2 text-xs text-green-300">
          <Volume2 className="w-3.5 h-3.5" />
          Playing assistant audio response
        </div>
      )}
    </div>
  );
}
