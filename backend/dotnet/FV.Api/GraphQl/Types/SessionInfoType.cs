using HotChocolate.Types;

namespace FV.Api.GraphQL.Types
{
    public class SessionInfoType : ObjectType<SessionInfo>
    {
        protected override void Configure(IObjectTypeDescriptor<SessionInfo> descriptor)
        {
            descriptor.Field(f => f.SessionId).Description("The unique identifier for this session");
            descriptor.Field(f => f.StartTime).Description("The time when this session started (UTC)");
            descriptor.Field(f => f.DurationSeconds).Description("The duration of this session in seconds");
        }
    }

    // Add to your SessionInfo class or create it if it doesn't exist
    public class SessionInfo
    {
        public string SessionId { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }

        // Add millisecond precision
        public long ElapsedMilliseconds { get; set; }

        // Keep for backward compatibility
        public int DurationSeconds { get; set; }

        public bool IsCompleted { get; set; } = false;

        // Helper properties for formatting
        public string FormattedDuration =>
            TimeSpan.FromMilliseconds(ElapsedMilliseconds).ToString(@"hh\:mm\:ss\.fff");

        public string FormattedStartTime =>
            StartTime.ToString("HH:mm:ss.fff");

        public string HumanReadableDuration
        {
            get
            {
                var ts = TimeSpan.FromMilliseconds(ElapsedMilliseconds);

                if (ts.TotalHours >= 1)
                    return $"{Math.Floor(ts.TotalHours)}h {ts.Minutes}m {ts.Seconds}.{ts.Milliseconds:D3}s";
                if (ts.TotalMinutes >= 1)
                    return $"{ts.Minutes}m {ts.Seconds}.{ts.Milliseconds:D3}s";
                return $"{ts.Seconds}.{ts.Milliseconds:D3}s";
            }
        }
    }
}