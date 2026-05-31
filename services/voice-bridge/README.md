# voice-bridge

Small FastAPI service that bridges browser microphone input to the
[Hermes Agent](https://hermes-agent.nousresearch.com) and speaks the reply back.

```
Browser mic
   │ multipart audio
   ▼
POST /api/voice/chat ──► Azure Speech STT
                          │ transcript
                          ▼
                       Hermes /v1/chat/completions  (OpenAI-compatible API server)
                          │ reply text
                          ▼
                       Azure Speech TTS  →  MP3 bytes
                          │
                          ▼
                       audio_store.put → HMAC-signed single-use token
                          │
                          ▼
   Browser ◄── JSON { sessionId, userTranscript, transcript, audioUrl }
   <audio src=audioUrl> → GET /api/voice/audio/{token} → MP3
```

## Endpoints

| Method | Path                       | Notes                                                |
| ------ | -------------------------- | ---------------------------------------------------- |
| POST   | `/api/voice/chat`          | multipart `audio`; optional `sessionId` form field   |
| GET    | `/api/voice/audio/{token}` | single-use, HMAC-signed; no auth header required     |
| GET    | `/health`                  | liveness                                             |

The audio token is a capability over a single in-memory blob — not an auth
credential. The real access boundary in production is **Twingate** (port 9118
on the host is not in any cloud firewall rule).

## Configuration

All via environment variables; see `app/config.py`. Required:

- `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`
- `HERMES_API_KEY` (matches `API_SERVER_KEY` on the hermes container)
- `AUDIO_TOKEN_SECRET` (any high-entropy string)

Optional knobs include `AZURE_SPEECH_VOICE_NAME`, `HERMES_BASE_URL`,
`HERMES_SYSTEM_PROMPT`, `SESSION_MAX_MESSAGES`, etc.

## Local dev

```
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Or with Docker:

```
docker build -t voice-bridge .
docker run --rm -p 8080:8080 \
  -e AZURE_SPEECH_KEY=... -e AZURE_SPEECH_REGION=... \
  -e HERMES_API_KEY=... -e HERMES_BASE_URL=http://host.docker.internal:8642/v1 \
  -e AUDIO_TOKEN_SECRET=$(openssl rand -hex 32) \
  voice-bridge
```

## Constraints

- **Single replica.** Sessions and audio blobs live in memory.
- Conversation history is a rolling window (`SESSION_MAX_MESSAGES`, default 20).
- Audio blobs evict after `AUDIO_TOKEN_TTL_SECONDS` (default 300s) or first GET.
