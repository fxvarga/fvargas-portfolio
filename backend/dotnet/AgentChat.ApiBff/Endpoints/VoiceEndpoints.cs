using System.Diagnostics;
using System.Security.Claims;
using AgentChat.ApiBff.Configuration;
using AgentChat.ApiBff.Services;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Dtos;
using AgentChat.Shared.Events;
using AgentChat.Shared.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AgentChat.ApiBff.Endpoints;

public static class VoiceEndpoints
{
    public static void MapVoiceEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/voice")
            .RequireAuthorization();

        group.MapPost("/transcribe", TranscribeAsync);
        group.MapPost("/chat", ChatAsync);
        group.MapGet("/audio/{audioId}", GetAudioAsync);
    }

    private static async Task<IResult> TranscribeAsync(
        HttpContext context,
        [FromServices] ISpeechProvider speechProvider,
        [FromServices] IAudioStorageService audioStorage,
        [FromServices] ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var logger = loggerFactory.CreateLogger("VoiceTranscribe");
        var tenantId = GetTenantId(context);
        var userId = GetUserId(context.User);
        var correlationId = Guid.NewGuid();
        var totalTimer = Stopwatch.StartNew();

        using var scope = logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId,
            ["TenantId"] = tenantId,
            ["UserId"] = userId
        });

        var audioInput = await ReadAudioRequestAsync(context.Request, cancellationToken);
        if (audioInput is null)
            return Results.BadRequest(new { error = "Audio content is required." });

        var transcriptionTimer = Stopwatch.StartNew();
        string transcript;
        try
        {
            await using var stream = new MemoryStream(audioInput.Content);
            transcript = await speechProvider.TranscribeAsync(stream, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Voice transcription failed");
            return Results.Problem("Failed to transcribe audio.", statusCode: 502);
        }

        transcriptionTimer.Stop();
        logger.LogInformation("Voice transcription completed in {DurationMs}ms", transcriptionTimer.ElapsedMilliseconds);

        var audioReference = await audioStorage.SaveAsync(audioInput.Content, audioInput.ContentType, tenantId, userId, cancellationToken);

        totalTimer.Stop();
        logger.LogInformation("Voice transcribe request completed in {DurationMs}ms", totalTimer.ElapsedMilliseconds);

        return Results.Ok(new VoiceTranscribeResponse(transcript, audioReference));
    }

    private static async Task<IResult> ChatAsync(
        [FromBody] VoiceChatRequest request,
        HttpContext context,
        [FromServices] ISpeechProvider speechProvider,
        [FromServices] IAudioStorageService audioStorage,
        [FromServices] IEventStore eventStore,
        [FromServices] IRunStateProjector projector,
        [FromServices] IMessageQueue messageQueue,
        [FromServices] IOptions<VoiceOptions> options,
        [FromServices] ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var logger = loggerFactory.CreateLogger("VoiceChat");
        var tenantId = GetTenantId(context);
        var userId = GetUserId(context.User);
        var correlationId = Guid.NewGuid();
        var totalTimer = Stopwatch.StartNew();

        using var scope = logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId,
            ["TenantId"] = tenantId,
            ["UserId"] = userId
        });

        if (string.IsNullOrWhiteSpace(request.AudioReference))
            return Results.BadRequest(new { error = "audioReference is required." });

        var sourceAudio = await audioStorage.GetAsync(request.AudioReference, tenantId, userId, cancellationToken);
        if (sourceAudio is null)
            return Results.NotFound(new { error = "Audio reference not found." });

        var transcriptionTimer = Stopwatch.StartNew();
        string userTranscript;
        try
        {
            await using var stream = new MemoryStream(sourceAudio.Content);
            userTranscript = await speechProvider.TranscribeAsync(stream, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Voice chat transcription failed");
            return Results.Problem("Failed to transcribe audio.", statusCode: 502);
        }
        transcriptionTimer.Stop();
        logger.LogInformation("Transcription completed in {DurationMs}ms", transcriptionTimer.ElapsedMilliseconds);

        if (string.IsNullOrWhiteSpace(userTranscript))
            return Results.BadRequest(new { error = "No speech detected." });

        var hermesTimer = Stopwatch.StartNew();

        Guid runId;
        int priorAssistantMessages;

        if (string.IsNullOrWhiteSpace(request.ConversationId))
        {
            runId = Guid.NewGuid();
            priorAssistantMessages = 0;

            var runStarted = new RunStartedEvent
            {
                RunId = runId,
                TenantId = tenantId,
                UserId = userId,
                CorrelationId = correlationId,
                InitialPrompt = userTranscript
            };

            var messageEvent = new MessageUserCreatedEvent
            {
                RunId = runId,
                TenantId = tenantId,
                MessageId = Guid.NewGuid(),
                Content = userTranscript,
                CorrelationId = correlationId
            };

            await eventStore.AppendAsync([runStarted, messageEvent]);

            var workItem = new RunWorkItem
            {
                Id = Guid.NewGuid(),
                RunId = runId,
                TenantId = tenantId,
                CorrelationId = correlationId,
                WorkType = WorkType.OrchestrateRun,
                Payload = new OrchestrateRunPayload { UserId = userId }
            };

            await messageQueue.PublishAsync(workItem);
        }
        else
        {
            if (!Guid.TryParse(request.ConversationId, out runId))
                return Results.BadRequest(new { error = "Invalid conversationId." });

            var state = await projector.ProjectAsync(runId, cancellationToken);

            if (state.RunId == Guid.Empty)
                return Results.NotFound(new { error = "Conversation not found." });

            if (state.TenantId != tenantId)
                return Results.Forbid();

            if (state.Status == RunStatus.Running)
                return Results.BadRequest(new { error = "Conversation is currently processing." });

            priorAssistantMessages = state.Messages.Count(m => m.Role == "assistant");

            var messageEvent = new MessageUserCreatedEvent
            {
                RunId = runId,
                TenantId = tenantId,
                MessageId = Guid.NewGuid(),
                Content = userTranscript,
                CorrelationId = correlationId
            };

            await eventStore.AppendAsync([messageEvent]);

            var workItem = new RunWorkItem
            {
                Id = Guid.NewGuid(),
                RunId = runId,
                TenantId = tenantId,
                CorrelationId = correlationId,
                WorkType = WorkType.ContinueRun,
                Payload = new ContinueRunPayload { UserId = userId }
            };

            await messageQueue.PublishAsync(workItem);
        }

        var assistantTranscript = await WaitForAssistantMessageAsync(
            runId,
            priorAssistantMessages,
            projector,
            options.Value.ResponseTimeoutSeconds,
            cancellationToken);

        hermesTimer.Stop();
        logger.LogInformation("Hermes processing completed in {DurationMs}ms", hermesTimer.ElapsedMilliseconds);

        string? audioUrl = null;
        var synthesisTimer = Stopwatch.StartNew();

        try
        {
            if (!string.IsNullOrWhiteSpace(assistantTranscript))
            {
                var synthesized = await speechProvider.SynthesizeAsync(assistantTranscript, cancellationToken);
                var synthesizedAudioReference = await audioStorage.SaveAsync(synthesized, "audio/mpeg", tenantId, userId, cancellationToken);
                audioUrl = $"/api/voice/audio/{synthesizedAudioReference}";
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Speech synthesis failed for voice response");
        }

        synthesisTimer.Stop();
        logger.LogInformation("Speech synthesis completed in {DurationMs}ms", synthesisTimer.ElapsedMilliseconds);

        totalTimer.Stop();
        logger.LogInformation("Voice chat total request completed in {DurationMs}ms", totalTimer.ElapsedMilliseconds);

        return Results.Ok(new VoiceChatResponse(runId.ToString(), assistantTranscript, audioUrl));
    }

    private static async Task<IResult> GetAudioAsync(
        string audioId,
        HttpContext context,
        [FromServices] IAudioStorageService audioStorage,
        CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId(context);
        var userId = GetUserId(context.User);

        var audio = await audioStorage.GetAsync(audioId, tenantId, userId, cancellationToken);
        if (audio is null)
            return Results.NotFound();

        return Results.File(audio.Content, audio.ContentType);
    }

    private static async Task<string> WaitForAssistantMessageAsync(
        Guid runId,
        int existingAssistantMessages,
        IRunStateProjector projector,
        int timeoutSeconds,
        CancellationToken cancellationToken)
    {
        var timeoutAt = DateTimeOffset.UtcNow.AddSeconds(timeoutSeconds <= 0 ? 45 : timeoutSeconds);

        while (DateTimeOffset.UtcNow < timeoutAt)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var state = await projector.ProjectAsync(runId, cancellationToken);
            var assistantMessages = state.Messages.Where(m => m.Role == "assistant").ToList();
            if (assistantMessages.Count > existingAssistantMessages)
                return assistantMessages[^1].Content;

            if (state.Status == RunStatus.Failed)
                return "I couldn't complete that request.";

            await Task.Delay(500, cancellationToken);
        }

        return "I'm still processing your request. Please check the transcript history shortly.";
    }

    private static async Task<AudioInput?> ReadAudioRequestAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        if (request.HasFormContentType)
        {
            var form = await request.ReadFormAsync(cancellationToken);
            var file = form.Files["audio"] ?? form.Files.FirstOrDefault();
            if (file is null || file.Length == 0)
                return null;

            await using var stream = file.OpenReadStream();
            using var memory = new MemoryStream();
            await stream.CopyToAsync(memory, cancellationToken);
            return new AudioInput(memory.ToArray(), file.ContentType);
        }

        using var rawAudio = new MemoryStream();
        await request.Body.CopyToAsync(rawAudio, cancellationToken);

        if (rawAudio.Length == 0)
            return null;

        return new AudioInput(rawAudio.ToArray(), request.ContentType ?? "application/octet-stream");
    }

    private static Guid GetTenantId(HttpContext context) =>
        Guid.Parse(context.Items["TenantId"]?.ToString() ?? Guid.Empty.ToString());

    private static Guid GetUserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

    private sealed record AudioInput(byte[] Content, string ContentType);
    public sealed record VoiceTranscribeResponse(string Text, string AudioReference);
    public sealed record VoiceChatRequest(string? ConversationId, string AudioReference, string? AssistantType = null);
    public sealed record VoiceChatResponse(string ConversationId, string Transcript, string? AudioUrl);
}
