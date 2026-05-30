namespace AgentChat.ApiBff.Configuration;

public class VoiceOptions
{
    public const string SectionName = "Voice";

    public string Provider { get; set; } = "None";
    public int RetentionHours { get; set; } = 24;
    public string StoragePath { get; set; } = Path.Combine(Path.GetTempPath(), "agent-chat-voice");
    public int ResponseTimeoutSeconds { get; set; } = 45;

    public AzureSpeechOptions AzureSpeech { get; set; } = new();
}

public class AzureSpeechOptions
{
    public string Region { get; set; } = string.Empty;
    public string SubscriptionKey { get; set; } = string.Empty;
    public string RecognitionLanguage { get; set; } = "en-US";
    public string VoiceName { get; set; } = "en-US-JennyNeural";
    public string OutputFormat { get; set; } = "audio-24khz-48kbitrate-mono-mp3";
}
