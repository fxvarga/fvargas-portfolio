"""Thin async wrapper around the Azure Speech SDK (sync API).

The SDK is synchronous and uses internal threads; we run blocking calls in a
worker thread so the FastAPI event loop is never blocked.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import azure.cognitiveservices.speech as speechsdk

from .config import Settings

log = logging.getLogger("voice-bridge.speech")


class SpeechError(Exception):
    pass


class AzureSpeech:
    def __init__(self, settings: Settings) -> None:
        if not settings.azure_speech_key or not settings.azure_speech_region:
            raise SpeechError("Azure Speech key/region not configured.")
        self._settings = settings

    def _config(self) -> speechsdk.SpeechConfig:
        cfg = speechsdk.SpeechConfig(
            subscription=self._settings.azure_speech_key,
            region=self._settings.azure_speech_region,
        )
        cfg.speech_recognition_language = self._settings.azure_speech_recognition_language
        cfg.speech_synthesis_voice_name = self._settings.azure_speech_voice_name
        try:
            output_format = getattr(
                speechsdk.SpeechSynthesisOutputFormat,
                self._settings.azure_speech_output_format,
            )
            cfg.set_speech_synthesis_output_format(output_format)
        except AttributeError:
            log.warning(
                "Unknown output format %s; using default",
                self._settings.azure_speech_output_format,
            )
        return cfg

    async def transcribe(self, audio_bytes: bytes) -> str:
        return await asyncio.to_thread(self._transcribe_sync, audio_bytes)

    def _transcribe_sync(self, audio_bytes: bytes) -> str:
        if not audio_bytes:
            raise SpeechError("Empty audio payload.")

        # Browser MediaRecorder produces webm/opus (or mp4/aac depending on browser).
        # Tell the SDK the input is compressed; ANY lets GStreamer auto-detect.
        # Requires gstreamer1.0-* packages on Linux (installed in the Dockerfile).
        stream_format = speechsdk.audio.AudioStreamFormat(
            compressed_stream_format=speechsdk.AudioStreamContainerFormat.ANY
        )
        push_stream = speechsdk.audio.PushAudioInputStream(stream_format=stream_format)
        # Feed in chunks; SDK is happy with one big write too.
        push_stream.write(audio_bytes)
        push_stream.close()

        audio_config = speechsdk.audio.AudioConfig(stream=push_stream)
        recognizer = speechsdk.SpeechRecognizer(
            speech_config=self._config(),
            audio_config=audio_config,
        )

        result = recognizer.recognize_once()

        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text or ""
        if result.reason == speechsdk.ResultReason.NoMatch:
            return ""
        if result.reason == speechsdk.ResultReason.Canceled:
            details = speechsdk.CancellationDetails(result)
            raise SpeechError(
                f"STT canceled: {details.reason} {details.error_details or ''}".strip()
            )
        raise SpeechError(f"STT failed: {result.reason}")

    async def synthesize(self, text: str) -> bytes:
        return await asyncio.to_thread(self._synthesize_sync, text)

    def _synthesize_sync(self, text: str) -> bytes:
        if not text or not text.strip():
            return b""

        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=self._config(),
            audio_config=None,  # pull bytes from the result instead of writing to speaker
        )
        result = synthesizer.speak_text_async(text).get()

        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return bytes(result.audio_data)
        if result.reason == speechsdk.ResultReason.Canceled:
            details = speechsdk.CancellationDetails(result)
            raise SpeechError(
                f"TTS canceled: {details.reason} {details.error_details or ''}".strip()
            )
        raise SpeechError(f"TTS failed: {result.reason}")


_singleton: Optional[AzureSpeech] = None


def get_speech(settings: Settings) -> AzureSpeech:
    global _singleton
    if _singleton is None:
        _singleton = AzureSpeech(settings)
    return _singleton
