using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AgentChat.Infrastructure.Persistence;

public class EventEntityConfiguration : IEntityTypeConfiguration<EventEntity>
{
    public void Configure(EntityTypeBuilder<EventEntity> builder)
    {
        builder.ToTable("events");
        
        builder.HasKey(e => e.Sequence);
        
        builder.Property(e => e.Sequence)
            .HasColumnName("sequence")
            .ValueGeneratedOnAdd();
            
        builder.Property(e => e.Id)
            .HasColumnName("id")
            .IsRequired();
            
        builder.Property(e => e.RunId)
            .HasColumnName("run_id")
            .IsRequired();
            
        builder.Property(e => e.StepId)
            .HasColumnName("step_id");
            
        builder.Property(e => e.EventType)
            .HasColumnName("event_type")
            .HasMaxLength(100)
            .IsRequired();
            
        builder.Property(e => e.Data)
            .HasColumnName("data")
            .HasColumnType("jsonb")
            .IsRequired();
            
        builder.Property(e => e.CorrelationId)
            .HasColumnName("correlation_id")
            .IsRequired();
            
        builder.Property(e => e.CausationId)
            .HasColumnName("causation_id");
            
        builder.Property(e => e.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();
            
        builder.Property(e => e.Timestamp)
            .HasColumnName("timestamp")
            .IsRequired();
            
        builder.Property(e => e.StoredAt)
            .HasColumnName("stored_at")
            .HasDefaultValueSql("now()")
            .IsRequired();
        
        // Indexes for common query patterns
        builder.HasIndex(e => new { e.RunId, e.Sequence })
            .HasDatabaseName("ix_events_run_sequence");
            
        builder.HasIndex(e => e.TenantId)
            .HasDatabaseName("ix_events_tenant");
            
        builder.HasIndex(e => e.CorrelationId)
            .HasDatabaseName("ix_events_correlation");
            
        builder.HasIndex(e => e.Id)
            .IsUnique()
            .HasDatabaseName("ix_events_id");
    }
}

public class RunEntityConfiguration : IEntityTypeConfiguration<RunEntity>
{
    public void Configure(EntityTypeBuilder<RunEntity> builder)
    {
        builder.ToTable("runs");
        
        builder.HasKey(e => e.Id);
        
        builder.Property(e => e.Id)
            .HasColumnName("id");
            
        builder.Property(e => e.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();
            
        builder.Property(e => e.UserId)
            .HasColumnName("user_id")
            .IsRequired();
            
        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasMaxLength(50)
            .IsRequired();
            
        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
            
        builder.Property(e => e.CompletedAt)
            .HasColumnName("completed_at");
            
        builder.Property(e => e.MessageCount)
            .HasColumnName("message_count");
            
        builder.Property(e => e.StepCount)
            .HasColumnName("step_count");
            
        builder.Property(e => e.FirstUserMessage)
            .HasColumnName("first_user_message")
            .HasMaxLength(500);
            
        builder.Property(e => e.LastSequence)
            .HasColumnName("last_sequence");
            
        builder.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();
        
        // Indexes
        builder.HasIndex(e => new { e.TenantId, e.UserId, e.CreatedAt })
            .HasDatabaseName("ix_runs_tenant_user_created")
            .IsDescending(false, false, true);
            
        builder.HasIndex(e => new { e.TenantId, e.Status })
            .HasDatabaseName("ix_runs_tenant_status");
    }
}

public class ApprovalEntityConfiguration : IEntityTypeConfiguration<ApprovalEntity>
{
    public void Configure(EntityTypeBuilder<ApprovalEntity> builder)
    {
        builder.ToTable("approvals");
        
        builder.HasKey(e => e.Id);
        
        builder.Property(e => e.Id)
            .HasColumnName("id");
            
        builder.Property(e => e.RunId)
            .HasColumnName("run_id")
            .IsRequired();
            
        builder.Property(e => e.StepId)
            .HasColumnName("step_id")
            .IsRequired();
            
        builder.Property(e => e.ToolCallId)
            .HasColumnName("tool_call_id")
            .IsRequired();
            
        builder.Property(e => e.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();
            
        builder.Property(e => e.UserId)
            .HasColumnName("user_id")
            .IsRequired();
            
        builder.Property(e => e.ToolName)
            .HasColumnName("tool_name")
            .HasMaxLength(100)
            .IsRequired();
            
        builder.Property(e => e.Args)
            .HasColumnName("args")
            .HasColumnType("jsonb")
            .IsRequired();
            
        builder.Property(e => e.RiskTier)
            .HasColumnName("risk_tier")
            .HasMaxLength(20)
            .IsRequired();
            
        builder.Property(e => e.Summary)
            .HasColumnName("summary")
            .HasMaxLength(1000)
            .IsRequired();
            
        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasMaxLength(20)
            .IsRequired();
            
        builder.Property(e => e.Decision)
            .HasColumnName("decision")
            .HasMaxLength(20);
            
        builder.Property(e => e.EditedArgs)
            .HasColumnName("edited_args")
            .HasColumnType("jsonb");
            
        builder.Property(e => e.ResolvedBy)
            .HasColumnName("resolved_by");
            
        builder.Property(e => e.ResolvedAt)
            .HasColumnName("resolved_at");
            
        builder.Property(e => e.Reason)
            .HasColumnName("reason")
            .HasMaxLength(500);
            
        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
            
        builder.Property(e => e.ExpiresAt)
            .HasColumnName("expires_at");
        
        // Indexes
        builder.HasIndex(e => new { e.RunId, e.Status })
            .HasDatabaseName("ix_approvals_run_status");
            
        builder.HasIndex(e => new { e.TenantId, e.UserId, e.Status })
            .HasDatabaseName("ix_approvals_tenant_user_status");
            
        builder.HasIndex(e => e.ToolCallId)
            .IsUnique()
            .HasDatabaseName("ix_approvals_toolcall");
    }
}
