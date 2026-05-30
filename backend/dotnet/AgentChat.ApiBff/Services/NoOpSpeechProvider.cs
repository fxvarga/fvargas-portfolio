using AgentChat.Shared.Contracts;

namespace AgentChat.ApiBff.Services;

public class NoOpSpeechProvider : ISpeechProvider
{
    public Task<string> TranscribeAsync(Stream audio, CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("Speech provider is not configured.");
    }

    public Task<byte[]> SynthesizeAsync(string text, CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("Speech provider is not configured.");
    }
}
