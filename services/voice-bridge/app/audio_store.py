"""Tiny in-memory single-use audio blob store.

Audio synthesized for a response is held here just long enough for the browser
to fetch it via /api/voice/audio/{token}. The token is HMAC-signed and embeds
the same id used to key this store. On successful GET the entry is popped, so
each token is single-use.
"""

from __future__ import annotations

import threading
import time
import uuid
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class StoredAudio:
    content: bytes
    content_type: str
    stored_at: float


class AudioStore:
    def __init__(self, ttl_seconds: int) -> None:
        self._ttl = ttl_seconds
        self._items: Dict[str, StoredAudio] = {}
        self._lock = threading.Lock()

    def put(self, content: bytes, content_type: str) -> str:
        audio_id = uuid.uuid4().hex
        now = time.time()
        with self._lock:
            self._prune(now)
            self._items[audio_id] = StoredAudio(content, content_type, now)
        return audio_id

    def pop(self, audio_id: str) -> Optional[StoredAudio]:
        now = time.time()
        with self._lock:
            self._prune(now)
            item = self._items.pop(audio_id, None)
            return item

    def _prune(self, now: float) -> None:
        cutoff = now - self._ttl
        stale = [aid for aid, item in self._items.items() if item.stored_at < cutoff]
        for aid in stale:
            self._items.pop(aid, None)
