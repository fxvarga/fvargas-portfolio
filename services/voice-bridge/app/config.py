from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Azure Speech
    azure_speech_key: str = ""
    azure_speech_region: str = ""
    azure_speech_recognition_language: str = "en-US"
    azure_speech_voice_name: str = "en-US-JennyNeural"
    azure_speech_output_format: str = "Audio24Khz48KBitRateMonoMp3"

    # Hermes API server
    hermes_base_url: str = "http://hermes:8642/v1"
    hermes_api_key: str = ""
    hermes_model: str = "hermes-agent"
    hermes_request_timeout_seconds: int = 120
    hermes_system_prompt: str = (
        "You are speaking with Fernando over voice. Keep replies short, "
        "natural, and easy to follow when spoken aloud. Avoid markdown, "
        "code blocks, and long lists. If Fernando asks you to take an "
        "action such as sending email, use your available Hermes tools; "
        "approval prompts may be sent through Telegram when required."
    )

    # Audio token (HMAC-signed capability URLs for /api/voice/audio/{token})
    audio_token_secret: str = ""
    audio_token_ttl_seconds: int = 300
    audio_max_bytes: int = 5 * 1024 * 1024  # 5 MB cap per stored clip

    # Session conversation history
    session_max_messages: int = 20  # rolling window per session
    session_idle_seconds: int = 60 * 60  # drop sessions idle > 1h

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
