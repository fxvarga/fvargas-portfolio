using System.Text;
using System.Xml.Linq;
using AgentChat.ApiBff.Configuration;
using AgentChat.Shared.Contracts;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.Extensions.Options;

namespace AgentChat.ApiBff.Services;

public class AzureSpeechProvider : ISpeechProvider
{
    private readonly AzureSpeechOptions _options;

    public AzureSpeechProvider(IOptions<VoiceOptions> options)
    {
        _options = options.Value.AzureSpeech;
    }

    public async Task<string> TranscribeAsync(Stream audio, CancellationToken cancellationToken = default)
    {
        ValidateConfiguration();

        await using var copy = new MemoryStream();
        await audio.CopyToAsync(copy, cancellationToken);
        copy.Position = 0;

        var speechConfig = SpeechConfig.FromSubscription(_options.SubscriptionKey, _options.Region);
        speechConfig.SpeechRecognitionLanguage = _options.RecognitionLanguage;

        using var pushStream = AudioInputStream.CreatePushStream();
        copy.Position = 0;
        var buffer = new byte[81920];
        int read;
        while ((read = await copy.ReadAsync(buffer, cancellationToken)) > 0)
        {
            pushStream.Write(buffer.AsSpan(0, read).ToArray());
        }
        pushStream.Close();

        using var audioConfig = AudioConfig.FromStreamInput(pushStream);
        using var recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        var result = await recognizer.RecognizeOnceAsync();

        if (result.Reason == ResultReason.RecognizedSpeech)
            return result.Text;

        if (result.Reason == ResultReason.NoMatch)
            throw new InvalidOperationException("Speech could not be transcribed.");

        throw new InvalidOperationException($"Speech recognition failed: {result.Reason}");
    }

    public async Task<byte[]> SynthesizeAsync(string text, CancellationToken cancellationToken = default)
    {
        ValidateConfiguration();

        var speechConfig = SpeechConfig.FromSubscription(_options.SubscriptionKey, _options.Region);
        speechConfig.SetSpeechSynthesisOutputFormat(Enum.TryParse<SpeechSynthesisOutputFormat>(_options.OutputFormat, ignoreCase: true, out var format)
            ? format
            : SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3);

        using var synthesizer = new SpeechSynthesizer(speechConfig, audioConfig: null);
        var ssml = BuildSsml(text);
        var result = await synthesizer.SpeakSsmlAsync(ssml);

        if (result.Reason != ResultReason.SynthesizingAudioCompleted)
            throw new InvalidOperationException($"Speech synthesis failed: {result.Reason}");

        return result.AudioData;
    }

    private string BuildSsml(string text)
    {
        var escaped = new XElement("t", text).Value;
        var sb = new StringBuilder();
        sb.Append("<speak version=\"1.0\" xml:lang=\"").Append(_options.RecognitionLanguage).Append("\">\n");
        sb.Append("  <voice name=\"").Append(_options.VoiceName).Append("\">\n");
        sb.Append("    ").Append(escaped).Append("\n");
        sb.Append("  </voice>\n");
        sb.Append("</speak>");
        return sb.ToString();
    }

    private void ValidateConfiguration()
    {
        if (string.IsNullOrWhiteSpace(_options.SubscriptionKey) || string.IsNullOrWhiteSpace(_options.Region))
            throw new InvalidOperationException("Azure Speech provider is not fully configured.");
    }
}
