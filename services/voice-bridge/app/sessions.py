"""In-memory rolling conversation history per session.

Single-replica only by design. Sessions are keyed by an opaque client-supplied
id (the frontend persists it in sessionStorage). Idle sessions are evicted on
access.
"""

from __future__ import annotations

import threading
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Deque, Dict, List


@dataclass
class _Session:
    messages: Deque[dict] = field(default_factory=deque)
    last_seen: float = field(default_factory=time.time)


class SessionStore:
    def __init__(self, max_messages: int, idle_seconds: int) -> None:
        self._max_messages = max_messages
        self._idle_seconds = idle_seconds
        self._sessions: Dict[str, _Session] = {}
        self._lock = threading.Lock()

    def _prune(self, now: float) -> None:
        cutoff = now - self._idle_seconds
        stale = [sid for sid, s in self._sessions.items() if s.last_seen < cutoff]
        for sid in stale:
            self._sessions.pop(sid, None)

    def append_and_get(
        self, session_id: str, user_message: str
    ) -> List[dict]:
        now = time.time()
        with self._lock:
            self._prune(now)
            session = self._sessions.setdefault(session_id, _Session())
            session.last_seen = now
            session.messages.append({"role": "user", "content": user_message})
            self._trim(session)
            return list(session.messages)

    def record_assistant(self, session_id: str, content: str) -> None:
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return
            session.last_seen = time.time()
            session.messages.append({"role": "assistant", "content": content})
            self._trim(session)

    def _trim(self, session: _Session) -> None:
        while len(session.messages) > self._max_messages:
            session.messages.popleft()
