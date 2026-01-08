using Microsoft.EntityFrameworkCore;

namespace AgentChat.Infrastructure.Persistence;

/// <summary>
/// DbContext for Agent Chat event store and projections
/// </summary>
public class AgentChatDbContext : DbContext
{
    public AgentChatDbContext(DbContextOptions<AgentChatDbContext> options) : base(options)
    {
    }

    public DbSet<EventEntity> Events => Set<EventEntity>();
    public DbSet<RunEntity> Runs => Set<RunEntity>();
    public DbSet<ApprovalEntity> Approvals => Set<ApprovalEntity>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.ApplyConfiguration(new EventEntityConfiguration());
        modelBuilder.ApplyConfiguration(new RunEntityConfiguration());
        modelBuilder.ApplyConfiguration(new ApprovalEntityConfiguration());
    }
}

/// <summary>
/// Stored event entity
/// </summary>
public class EventEntity
{
    public long Sequence { get; set; }
    public Guid Id { get; set; }
    public Guid RunId { get; set; }
    public Guid? StepId { get; set; }
    public required string EventType { get; set; }
    public required string Data { get; set; }
    public Guid CorrelationId { get; set; }
    public Guid? CausationId { get; set; }
    public Guid TenantId { get; set; }
    public DateTime Timestamp { get; set; }
    public DateTime StoredAt { get; set; }
}

/// <summary>
/// Run projection for quick queries
/// </summary>
public class RunEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public required string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int MessageCount { get; set; }
    public int StepCount { get; set; }
    public string? FirstUserMessage { get; set; }
    public long LastSequence { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Approval entity for pending approvals
/// </summary>
public class ApprovalEntity
{
    public Guid Id { get; set; }
    public Guid RunId { get; set; }
    public Guid StepId { get; set; }
    public Guid ToolCallId { get; set; }
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public required string ToolName { get; set; }
    public required string Args { get; set; }
    public required string RiskTier { get; set; }
    public required string Summary { get; set; }
    public required string Status { get; set; }
    public string? Decision { get; set; }
    public string? EditedArgs { get; set; }
    public Guid? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
