using FV.Api.GraphQL.Types;
using FV.Api.Services;
using HotChocolate;
using HotChocolate.Subscriptions;
using Microsoft.AspNetCore.Http;
using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType("Query")]
public class SessionQueries
{
    // Query to start a timer and return the initial session info
    public async Task<SessionInfo> StartTimer(
        [Service] ITopicEventSender eventSender,
        CancellationToken cancellationToken)
    {
        // Create a unique session ID
        var sessionId = Guid.NewGuid().ToString();
        var startTime = DateTime.UtcNow;

        // Use a stopwatch for high-precision time measurement
        var stopwatch = new Stopwatch();
        stopwatch.Start();

        // Initial session info
        var sessionInfo = new SessionInfo
        {
            SessionId = sessionId,
            StartTime = startTime,
            ElapsedMilliseconds = 0,
            DurationSeconds = 0 // Keep this for backward compatibility
        };

        // Send the initial event
        await eventSender.SendAsync("OnMessageReceived", sessionInfo, cancellationToken);

        // Create a cancellation token that will expire after 2 minutes
        var timerCts = new CancellationTokenSource(TimeSpan.FromMinutes(2));

        // Combine with the request cancellation token
        var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
          timerCts.Token,
          cancellationToken);

        // Get the combined token
        var combinedToken = linkedCts.Token;

        // Start a background task to send updates as fast as reasonably possible
        _ = Task.Run(async () =>
        {
            // Use a throttling interval to avoid overwhelming the system
            // 16ms = approximately 60 updates per second
            const int UPDATE_INTERVAL_MS = 16;
            const int MAX_RUNTIME_MS = 4900; // 2 minutes in milliseconds
            try
            {
                // Run until cancelled or until we reach 2 minutes
                while (!combinedToken.IsCancellationRequested && stopwatch.ElapsedMilliseconds <= MAX_RUNTIME_MS)
                {
                    // Get current elapsed time
                    var elapsedMs = stopwatch.ElapsedMilliseconds;

                    // Update session info with new duration
                    var updatedInfo = new SessionInfo
                    {
                        SessionId = sessionId,
                        StartTime = startTime,
                        ElapsedMilliseconds = elapsedMs,
                        DurationSeconds = (int)(elapsedMs / 1000)
                    };

                    // Publish to the topic
                    await eventSender.SendAsync("OnMessageReceived", updatedInfo, combinedToken);

                    // Wait a small interval to avoid overwhelming the system
                    // This controls the update frequency
                    await Task.Delay(UPDATE_INTERVAL_MS, combinedToken);
                }

                // If we reached max runtime naturally (not cancelled), send a final message
                if (stopwatch.ElapsedMilliseconds >= MAX_RUNTIME_MS && !cancellationToken.IsCancellationRequested)
                {
                    stopwatch.Stop();

                    var finalInfo = new SessionInfo
                    {
                        SessionId = sessionId,
                        StartTime = startTime,
                        ElapsedMilliseconds = MAX_RUNTIME_MS,
                        DurationSeconds = MAX_RUNTIME_MS / 1000,
                        IsCompleted = true
                    };

                    await eventSender.SendAsync("OnMessageReceived", finalInfo, cancellationToken);
                }
            }
            catch (TaskCanceledException)
            {
                // Normal cancellation
            }
            catch (OperationCanceledException)
            {
                // Also normal cancellation
            }
            catch (Exception ex)
            {
                // Just log the exception
                System.Diagnostics.Debug.WriteLine($"Timer error: {ex.Message}");
            }
            finally
            {
                // Stop the stopwatch
                if (stopwatch.IsRunning)
                {
                    stopwatch.Stop();
                }

                // Clean up the cancellation token sources
                try
                {
                    if (!timerCts.IsCancellationRequested)
                        timerCts.Cancel();

                    timerCts.Dispose();
                    linkedCts.Dispose();
                }
                catch { /* Ignore cleanup errors */ }
            }
        }, cancellationToken);

        // Return the initial session info to the client
        return sessionInfo;
    }
}