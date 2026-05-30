import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Loader2, X, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import * as api from '@/api/client';
import type { AssistantType } from '@/types';

type VoiceState = 'Idle' | 'Listening' | 'Processing' | 'Speaking' | 'Error';

interface VoiceChatPanelProps {
  conversationId?: string;
  assistantType?: AssistantType;
  disabled?: boolean;
  onConversationCreated?: (conversationId: string) => void;
}

interface TranscriptLine {
  role: 'user' | 'assistant';
  content: string;
}

export function VoiceChatPanel({
  conversationId,
  assistantType,
  disabled = false,
  onConversationCreated,
}: VoiceChatPanelProps) {
  const [state, setState] = useState<VoiceState>('Idle');
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartedRef = useRef<number | null>(null);

  const canStart = !disabled && state !== 'Listening' && state !== 'Processing' && state !== 'Speaking';

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
    if (!lastBlob || disabled) return;
    await runVoiceFlow(lastBlob);
  };

  const runVoiceFlow = async (blob: Blob) => {
    setState('Processing');

    try {
      const transcribed = await api.transcribeAudio(blob);
      setTranscripts((prev) => [...prev, { role: 'user', content: transcribed.text }]);

      const response = await api.sendVoiceChat({
        conversationId,
        audioReference: transcribed.audioReference,
        assistantType,
      });

      if (!conversationId && response.conversationId) {
        onConversationCreated?.(response.conversationId);
      }

      setTranscripts((prev) => [...prev, { role: 'assistant', content: response.transcript }]);

      if (response.audioUrl) {
        setState('Speaking');
        const audio = new Audio(response.audioUrl);
        await audio.play();
        audio.onended = () => setState('Idle');
      } else {
        setState('Idle');
      }
    } catch (e) {
      setState('Error');
      setError(e instanceof Error ? e.message : 'Voice request failed.');
    }
  };

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
    };
  }, []);

  const startSilenceDetection = (stream: MediaStream) => {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
    <div className="border-t border-gray-700/50 bg-gray-800/40 px-4 md:px-6 py-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mic className={`w-4 h-4 ${statusClass}`} />
          <span className="text-sm text-gray-300">Voice: {state}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onMouseLeave={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            disabled={!canStart}
            size="sm"
            className="gap-1.5"
          >
            {state === 'Processing' || state === 'Speaking' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            Hold to Talk
          </Button>

          {state === 'Listening' && (
            <Button variant="ghost" onClick={cancelListening} size="sm" className="gap-1.5">
              <X className="w-4 h-4" />
              Cancel
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={retryLast}
            size="sm"
            disabled={!lastBlob || disabled || state === 'Listening'}
            className="gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-amber-400">{error}</p>}

      {transcripts.length > 0 && (
        <div className="max-h-28 overflow-y-auto rounded-md border border-gray-700 bg-gray-900/60 p-2 space-y-1">
          {transcripts.slice(-6).map((line, index) => (
            <div key={`${line.role}-${index}`} className="text-xs">
              <span className={`mr-1 font-medium ${line.role === 'user' ? 'text-blue-300' : 'text-green-300'}`}>
                {line.role === 'user' ? 'You' : 'Hermes'}:
              </span>
              <span className="text-gray-300">{line.content}</span>
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
