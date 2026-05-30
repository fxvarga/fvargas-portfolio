namespace AgentChat.Shared.Contracts;

public interface ISpeechProvider
{
    Task<string> TranscribeAsync(Stream audio, CancellationToken cancellationToken = default);
    Task<byte[]> SynthesizeAsync(string text, CancellationToken cancellationToken = default);
}
