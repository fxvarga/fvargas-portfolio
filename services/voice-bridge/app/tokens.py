"""Short-lived HMAC capability tokens for /api/voice/audio/{token}.

The token is *not* an auth credential; it is a one-time, single-blob capability
so the browser's <audio> tag can fetch the response audio without sending any
custom headers. Tokens are HMAC-signed, embed the audio id + expiry, and are
single-use (consumed via the in-memory store on first GET).
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Optional


def _b64u_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64u_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def issue_token(secret: str, audio_id: str, ttl_seconds: int) -> str:
    payload = {"id": audio_id, "exp": int(time.time()) + int(ttl_seconds)}
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_b64 = _b64u_encode(payload_bytes)
    sig = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).digest()
    sig_b64 = _b64u_encode(sig)
    return f"{payload_b64}.{sig_b64}"


def verify_token(secret: str, token: str) -> Optional[str]:
    """Return the audio id if the token is valid and unexpired, else None."""
    if not token or "." not in token:
        return None
    payload_b64, sig_b64 = token.split(".", 1)

    expected = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).digest()
    try:
        provided = _b64u_decode(sig_b64)
    except Exception:
        return None
    if not hmac.compare_digest(expected, provided):
        return None

    try:
        payload = json.loads(_b64u_decode(payload_b64))
    except Exception:
        return None

    if not isinstance(payload, dict):
        return None
    audio_id = payload.get("id")
    exp = payload.get("exp")
    if not isinstance(audio_id, str) or not isinstance(exp, int):
        return None
    if exp < int(time.time()):
        return None

    return audio_id
