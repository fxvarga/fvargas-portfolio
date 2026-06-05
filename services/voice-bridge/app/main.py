"""FastAPI entry point for the voice-bridge.

Flow:
  Browser mic --(multipart audio)--> POST /api/voice/chat
    -> Azure STT
    -> Hermes /v1/chat/completions (full session history)
    -> Azure TTS
    -> store MP3, sign a single-use token
  Response: { sessionId, userTranscript, transcript, audioUrl }
  Browser <audio src={audioUrl}> -> GET /api/voice/audio/{token}
"""

from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import Cookie, FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import JSONResponse

from .audio_store import AudioStore
from .config import Settings, get_settings
from .hermes_client import HermesClient, HermesError
from .sessions import SessionStore
from .speech import AzureSpeech, SpeechError, get_speech
from .tokens import issue_token, verify_token

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("voice-bridge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    if not settings.audio_token_secret:
        log.error("AUDIO_TOKEN_SECRET is not set. Refusing to start.")
        raise RuntimeError("AUDIO_TOKEN_SECRET must be configured.")

    app.state.settings = settings
    app.state.audio_store = AudioStore(ttl_seconds=settings.audio_token_ttl_seconds)
    app.state.sessions = SessionStore(
        max_messages=settings.session_max_messages,
        idle_seconds=settings.session_idle_seconds,
    )

    # Eagerly construct so misconfigurations surface at boot.
    app.state.speech = get_speech(settings)
    app.state.hermes = HermesClient(settings)

    log.info(
        "voice-bridge ready: speech=%s, hermes=%s, model=%s",
        settings.azure_speech_region,
        settings.hermes_base_url,
        settings.hermes_model,
    )

    try:
        yield
    finally:
        await app.state.hermes.aclose()


app = FastAPI(title="voice-bridge", lifespan=lifespan)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/api/voice/chat")
async def voice_chat(
    response: Response,
    audio: UploadFile = File(...),
    session_id_form: str | None = Form(default=None, alias="sessionId"),
    session_id_cookie: str | None = Cookie(default=None, alias="voiceSessionId"),
) -> JSONResponse:
    settings: Settings = app.state.settings
    speech: AzureSpeech = app.state.speech
    sessions: SessionStore = app.state.sessions
    audio_store: AudioStore = app.state.audio_store
    hermes: HermesClient = app.state.hermes

    session_id = session_id_form or session_id_cookie or uuid.uuid4().hex
    correlation = uuid.uuid4().hex[:8]
    log_ctx = f"[{correlation} sess={session_id[:8]}]"

    raw = await audio.read()
    if not raw:
        raise HTTPException(400, "audio is required")
    if len(raw) > settings.audio_max_bytes:
        raise HTTPException(413, "audio too large")

    log.info("%s received %d bytes (content-type=%s)", log_ctx, len(raw), audio.content_type)

    t0 = time.perf_counter()
    try:
        transcript = await speech.transcribe(raw)
    except SpeechError as exc:
        log.warning("%s STT error: %s", log_ctx, exc)
        raise HTTPException(502, "transcription failed")
    stt_ms = int((time.perf_counter() - t0) * 1000)
    log.info("%s STT %dms text=%r", log_ctx, stt_ms, transcript)

    if not transcript.strip():
        raise HTTPException(400, "no speech detected")

    messages = [{"role": "system", "content": settings.hermes_system_prompt}]
    messages.extend(sessions.append_and_get(session_id, transcript))

    t1 = time.perf_counter()
    try:
        reply = await hermes.chat(messages)
    except HermesError as exc:
        log.warning("%s Hermes error: %s", log_ctx, exc)
        raise HTTPException(502, "assistant unavailable")
    hermes_ms = int((time.perf_counter() - t1) * 1000)
    log.info("%s Hermes %dms reply_len=%d", log_ctx, hermes_ms, len(reply))

    if reply:
        sessions.record_assistant(session_id, reply)

    audio_url = None
    if reply:
        t2 = time.perf_counter()
        try:
            audio_bytes = await speech.synthesize(reply)
        except SpeechError as exc:
            log.warning("%s TTS error (continuing without audio): %s", log_ctx, exc)
            audio_bytes = b""
        tts_ms = int((time.perf_counter() - t2) * 1000)
        log.info("%s TTS %dms bytes=%d", log_ctx, tts_ms, len(audio_bytes))

        if audio_bytes:
            audio_id = audio_store.put(audio_bytes, "audio/mpeg")
            token = issue_token(
                settings.audio_token_secret,
                audio_id,
                settings.audio_token_ttl_seconds,
            )
            audio_url = f"/api/voice/audio/{token}"

    # Bind session to a cookie so the browser doesn't have to manage it explicitly.
    # SameSite=Lax + HttpOnly: the cookie is not the auth boundary (Twingate is),
    # we just want session continuity.
    response.set_cookie(
        key="voiceSessionId",
        value=session_id,
        max_age=settings.session_idle_seconds,
        httponly=True,
        samesite="lax",
        path="/api/voice",
    )

    payload = {
        "sessionId": session_id,
        "userTranscript": transcript,
        "transcript": reply,
        "audioUrl": audio_url,
        "timings": {"sttMs": stt_ms, "hermesMs": hermes_ms},
    }

    json_response = JSONResponse(payload)
    # Re-apply the cookie on the returned response (set_cookie on the Response
    # param works because FastAPI merges headers, but be explicit for clarity).
    for header, value in response.headers.items():
        if header.lower() == "set-cookie":
            json_response.headers.append("set-cookie", value)
    return json_response


@app.get("/api/voice/audio/{token}")
async def get_audio(token: str) -> Response:
    settings: Settings = app.state.settings
    audio_store: AudioStore = app.state.audio_store

    audio_id = verify_token(settings.audio_token_secret, token)
    if audio_id is None:
        raise HTTPException(404, "audio not found")

    item = audio_store.pop(audio_id)
    if item is None:
        # Either already consumed or expired.
        raise HTTPException(404, "audio not found")

    return Response(
        content=item.content,
        media_type=item.content_type,
        headers={
            "Cache-Control": "no-store",
            "Content-Length": str(len(item.content)),
        },
    )
