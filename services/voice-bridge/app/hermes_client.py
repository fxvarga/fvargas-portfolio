"""HTTP client for Hermes' built-in OpenAI-compatible API server.

Docs: https://hermes-agent.nousresearch.com/docs/user-guide/messaging/open-webui
Hermes exposes POST /v1/chat/completions with standard OpenAI request/response
shape and a Bearer-token auth header matching API_SERVER_KEY.
"""

from __future__ import annotations

import logging
from typing import Iterable, Mapping

import httpx

from .config import Settings

log = logging.getLogger("voice-bridge.hermes")


class HermesError(Exception):
    pass


class HermesClient:
    def __init__(self, settings: Settings) -> None:
        if not settings.hermes_api_key:
            raise HermesError("HERMES_API_KEY not configured.")
        self._base_url = settings.hermes_base_url.rstrip("/")
        self._api_key = settings.hermes_api_key
        self._model = settings.hermes_model
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(settings.hermes_request_timeout_seconds),
            headers={"Authorization": f"Bearer {self._api_key}"},
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def chat(self, messages: Iterable[Mapping[str, str]]) -> str:
        payload = {
            "model": self._model,
            "messages": list(messages),
            "stream": False,
        }
        url = f"{self._base_url}/chat/completions"
        try:
            response = await self._client.post(url, json=payload)
        except httpx.HTTPError as exc:
            raise HermesError(f"Hermes request failed: {exc}") from exc

        if response.status_code >= 400:
            raise HermesError(
                f"Hermes returned {response.status_code}: {response.text[:500]}"
            )

        try:
            body = response.json()
            choice = body["choices"][0]
            message = choice["message"]
            content = message.get("content", "")
        except (KeyError, IndexError, ValueError) as exc:
            raise HermesError(f"Unexpected Hermes response: {exc}") from exc

        if isinstance(content, list):
            # OpenAI multimodal content arrays -> flatten text parts.
            parts = [
                part.get("text", "")
                for part in content
                if isinstance(part, dict) and part.get("type") == "text"
            ]
            content = "".join(parts)

        return (content or "").strip()
