-- Initialize Agent Chat database schema

-- Events table (append-only event store)
CREATE TABLE IF NOT EXISTS events (
    sequence BIGSERIAL PRIMARY KEY,
    id UUID NOT NULL UNIQUE,
    run_id UUID NOT NULL,
    step_id UUID,
    event_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    correlation_id UUID NOT NULL,
    causation_id UUID,
    tenant_id UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    stored_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_events_run_sequence ON events(run_id, sequence);
CREATE INDEX IF NOT EXISTS ix_events_tenant ON events(tenant_id);
CREATE INDEX IF NOT EXISTS ix_events_correlation ON events(correlation_id);

-- Runs projection table
CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    message_count INT DEFAULT 0,
    step_count INT DEFAULT 0,
    first_user_message VARCHAR(500),
    last_sequence BIGINT DEFAULT 0,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_runs_tenant_user_created ON runs(tenant_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_runs_tenant_status ON runs(tenant_id, status);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL,
    step_id UUID NOT NULL,
    tool_call_id UUID NOT NULL UNIQUE,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    args JSONB NOT NULL,
    risk_tier VARCHAR(20) NOT NULL,
    summary VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL,
    decision VARCHAR(20),
    edited_args JSONB,
    resolved_by UUID,
    resolved_at TIMESTAMP,
    reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_approvals_run_status ON approvals(run_id, status);
CREATE INDEX IF NOT EXISTS ix_approvals_tenant_user_status ON approvals(tenant_id, user_id, status);
