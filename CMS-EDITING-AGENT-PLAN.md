# CMS Editing Agent - Implementation Plan

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Existing Infrastructure to Leverage](#existing-infrastructure-to-leverage)
4. [Agentic Design Patterns Applied](#agentic-design-patterns-applied)
5. [Component Design](#component-design)
   - [5.1 Backend: CMS Owner Tools](#51-backend-cms-owner-tools)
   - [5.2 Backend: Orchestrator Assistant Type](#52-backend-orchestrator-assistant-type)
   - [5.3 Frontend: Agent Side Panel](#53-frontend-agent-side-panel)
   - [5.4 Frontend: Preview Mechanism](#54-frontend-preview-mechanism)
   - [5.5 Commit Workflow](#55-commit-workflow)
6. [System Prompt Design](#6-system-prompt-design)
7. [Tool Definitions](#7-tool-definitions)
8. [Security & Guardrails](#8-security--guardrails)
9. [File Changes Summary](#9-file-changes-summary)
10. [Implementation Phases](#10-implementation-phases)
11. [Open Questions & Risks](#11-open-questions--risks)

---

## 1. Overview

### Goal
Build an AI-powered CMS editing agent that appears as a side panel on the public-facing portfolio sites. When an admin is logged in, they can chat with the agent in natural language to edit page content. Changes are previewed live on the frontend and only committed when the user explicitly approves.

### User Flow
1. Admin logs into the portfolio site (JWT auth via `cms_auth_token` in localStorage)
2. A floating toggle button appears on the screen edge (only visible to authenticated admins)
3. Clicking it opens a slide-out side panel with a chat interface
4. Admin types a natural language request (e.g., "Change the hero title to 'Building the Future'")
5. The agent interprets the request, fetches current content, and proposes changes
6. Changes appear as a **live preview** on the actual page (the page re-renders with proposed data)
7. The side panel shows a diff summary and Commit/Discard buttons
8. Admin clicks **Commit** to persist changes to the backend, or **Discard** to revert

### Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | GraphQL mutations via HotChocolate | Consistent with existing CMS API surface |
| LLM SDK | Semantic Kernel | Microsoft's .NET AI SDK; built-in function calling, chat history, Azure OpenAI support |
| Real-time communication | WebSocket via GraphQL subscriptions | HotChocolate natively supports subscriptions over WebSocket; full duplex for token streaming |
| Implementation approach | Phased (mock first) | Phase 1 validates UI/preview/commit with mock agent; Phase 2 adds real LLM |

---

## 2. Architecture

### High-Level Flow

```
                    Portfolio Site (React)
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    │  ┌──────────┐    ┌───────────────────┐  │
                    │  │  Public  │    │   Agent Panel      │  │
                    │  │  Page    │◄───│   (side panel)     │  │
                    │  │  with    │    │                    │  │
                    │  │  Preview │    │  Chat Messages     │  │
                    │  │  Overlay │    │  Proposed Changes  │  │
                    │  │          │    │  Commit/Discard    │  │
                    │  └──────────┘    └────────┬──────────┘  │
                    │                           │             │
                    └───────────────────────────┼─────────────┘
                                                │
                            GraphQL (mutations + subscriptions)
                                                │
                    ┌───────────────────────────┼─────────────┐
                    │  FV.Api (.NET Backend)    │             │
                    │                           ▼             │
                    │  ┌──────────────────────────────────┐   │
                    │  │  AgentMutations / Subscriptions  │   │
                    │  │  - agentChat(message)             │   │
                    │  │  - agentCommit(changes)           │   │
                    │  │  - onAgentEvent subscription      │   │
                    │  └────────────────┬─────────────────┘   │
                    │                   │                      │
                    │  ┌────────────────▼─────────────────┐   │
                    │  │  CmsAgentService                  │   │
                    │  │  (Semantic Kernel orchestration)  │   │
                    │  │                                    │   │
                    │  │  Tools:                            │   │
                    │  │  - GetPageContent                  │   │
                    │  │  - GetEntitySchema                 │   │
                    │  │  - ProposeContentUpdate            │   │
                    │  │  - ListContentTypes                │   │
                    │  │  - SearchContent                   │   │
                    │  └────────────────┬─────────────────┘   │
                    │                   │                      │
                    │  ┌────────────────▼─────────────────┐   │
                    │  │  Existing CMS Services            │   │
                    │  │  - EntityRecordRepository         │   │
                    │  │  - SchemaValidationService        │   │
                    │  │  - ContentMutations               │   │
                    │  └──────────────────────────────────┘   │
                    └─────────────────────────────────────────┘
```

### Two Architecture Options Considered

**Option A: Integrate into FV.Api directly (CHOSEN)**
- Add agent service, tools, and GraphQL endpoints directly into the existing `FV.Api` project
- Simpler deployment, direct access to CMS repositories and services
- No inter-service communication overhead
- Uses Semantic Kernel for LLM orchestration (lighter weight than the full AgentChat microservice system)

**Option B: Extend the existing AgentChat microservice system**
- Add a new `PortfolioOwner` assistant type to the Orchestrator
- Add CMS editing tools to `AgentChat.Tools`
- Leverage RabbitMQ, Postgres event store, Redis, approval system
- More infrastructure overhead but better separation of concerns

**Why Option A**: The AgentChat system is a complex distributed system with RabbitMQ, Postgres, Redis, and multiple microservices. It's designed for the finance/knowledge base use case. For CMS editing, we need:
- Direct access to the CMS database (SQLite via EF Core in `FV.Infrastructure`)
- Fast round-trips (not async message queues)
- Integration with the existing auth middleware (`TenantResolutionMiddleware`, JWT auth)
- The preview mechanism is frontend-only and doesn't need event sourcing

The CMS agent should live **inside FV.Api** as a lightweight service, reusing existing repositories. It can always be extracted later if complexity warrants it.

---

## 3. Existing Infrastructure to Leverage

### Backend (Already Built)

| Component | Location | How We Use It |
|-----------|----------|---------------|
| `EntityRecord` model | `FV.Domain/Models/Entities/EntityModels.cs` | Content records with JSON data, draft/publish, versioning |
| `EntityDefinition` model | Same file | Schema definitions with `AttributeDefinition` for validation |
| `EntityRecordVersion` model | Same file | Automatic version history on updates |
| Content mutations | `FV.Api/.../ContentMutations.cs` | `updateContent(id, data, publish)` — when `publish=false`, saves draft |
| Content queries | `FV.Api/.../ContentQueries.cs` | `portfolioContent` (all sections), `publishedContentSingle(entityType)` |
| Schema validation | `FV.Application/Services/SchemaValidationService.cs` | Validates JSON data against `EntityDefinition` attribute schemas |
| JWT Auth | `FV.Infrastructure/Services/AuthService.cs` | Token generation/validation, BCrypt password hashing |
| Tenant resolution | `FV.Infrastructure/Middleware/TenantResolutionMiddleware.cs` | Resolves `PortfolioId` from headers/hostname |
| `[Authorize]` attributes | Content mutations | Role-based access control on mutations |
| HotChocolate GraphQL | `FV.Api/Program.cs` | Full GraphQL server with auth integration |

### Frontend (Already Built)

| Component | Location | How We Use It |
|-----------|----------|---------------|
| `CMSProvider` | `frontend/portfolio-react/src/shared/hooks/useCMS.tsx` | Loads all content into React context; section hooks read from it |
| Section hooks | Same file | `useHero()`, `useAbout()`, `useServices()`, `useContact()`, `useNavigation()`, `useFooter()`, `useSiteConfig()` |
| `AuthProvider` | `frontend/.../admin/auth/AuthContext.tsx` | `useAuth()` hook: `isAuthenticated`, `user`, `token`, `portfolios` |
| Apollo Client | `frontend/.../api/apiProvider.ts` | Configured with JWT auth headers + tenant headers |
| Admin components | `frontend/.../admin/components/dynamic/` | `DynamicEntityEditor`, `DynamicFieldRenderer` — schema-driven form rendering |

### Existing AgentChat System (Reference, Not Directly Used)

The existing `AgentChat.*` microservice architecture provides patterns we can reference:

| Pattern | AgentChat Implementation | What We Adapt |
|---------|--------------------------|---------------|
| Tool definition | `IToolRegistry`, `ITool`, `ToolDefinition` | Similar interface for CMS tools, but using Semantic Kernel functions instead |
| Risk tiers | `RiskTier.Low/Medium/High/Critical` | All CMS tools are Low risk (no financial impact); commit is Medium |
| Approval flow | `IApprovalService`, `PendingApproval` | Our "preview + commit" IS the approval flow, just simpler |
| System prompts | `PortfolioSystemPrompts.cs` | Template for CMS agent system prompt |
| Tool access control | `ToolAccessControl.cs` | Reference for permission checks (we use JWT roles instead) |
| SSE streaming | `agent-chat-web/src/api/sse.ts` | Pattern for real-time event streaming (we use GraphQL subscriptions) |
| Chat store | `agent-chat-web/src/stores/chatStore.ts` | Pattern for state management (Zustand) |

---

## 4. Agentic Design Patterns Applied

Based on research from the [Agentic Design Patterns](https://github.com/Mathews-Tom/Agentic-Design-Patterns) book:

### 4.1 Prompt Chaining (Chapter 1)
The agent processes requests through a sequential chain:
1. **Understand** — Parse the user's natural language request
2. **Fetch** — Get current content for the relevant section(s)
3. **Generate** — Produce the proposed changes
4. **Validate** — Check against entity schema
5. **Present** — Return proposed changes for preview

Each step's output feeds into the next. If validation fails, loop back to Generate with error context.

### 4.2 Routing (Chapter 2)
The agent routes requests to the appropriate tool based on intent:
- "What does my hero section say?" → `GetPageContent` tool
- "Change the hero title to X" → `GetPageContent` → `ProposeContentUpdate` tool chain
- "Update multiple sections" → Planning pattern → multiple tool calls
- "What content types do I have?" → `ListContentTypes` tool

Routing is handled by the LLM's function calling capability (Semantic Kernel auto-invocation).

### 4.3 Tool Use / Function Calling (Chapter 5)
Core pattern. The LLM has access to typed tools with JSON schemas. Semantic Kernel handles:
- Tool schema generation from C# method signatures + `[Description]` attributes
- Automatic function invocation when the LLM returns tool calls
- Type-safe argument deserialization and result serialization

### 4.4 Planning (Chapter 6)
For complex multi-section edits, the LLM generates a plan:
```
User: "Rebrand my site — change hero title, update about section, and change the color scheme"
Agent Plan:
  1. Get current hero content
  2. Propose hero title change
  3. Get current about content
  4. Propose about section changes
  5. Get current site-config
  6. Propose color scheme changes
  7. Return all proposed changes for preview
```

Semantic Kernel's auto-invocation handles sequential tool calls naturally.

### 4.5 Human in the Loop (Chapter 13)
The entire preview/commit workflow is a HITL pattern:
- Agent **proposes** changes (never auto-commits)
- Human **reviews** via live preview on the actual page
- Human **approves** (Commit) or **rejects** (Discard)
- Per-change accept/reject for granular control

This is simpler than the AgentChat approval system (no Postgres approval records, no multi-approver workflows) because CMS edits are low-risk operations performed by the content owner themselves.

### 4.6 Reflection (Chapter 4)
After generating proposed changes, validate against the EntityDefinition schema:
- Field type checking (string, number, richtext, image, etc.)
- Required field validation
- Min/max length constraints
- Pattern matching (regex)

If validation fails, the agent receives the error and self-corrects. This is the "inner reflection loop."

### 4.7 Guardrails (Chapter 18)
- **Input guardrails**: Reject requests unrelated to content editing; prevent prompt injection
- **Output guardrails**: Schema validation ensures generated content matches entity definitions
- **Behavioral guardrails**: System prompt constrains the agent to content editing only; never auto-commit; scope limited to the authenticated user's portfolio

---

## 5. Component Design

### 5.1 Backend: CMS Agent Service

#### New Files

**`FV.Application/Services/CmsAgent/CmsAgentService.cs`**

The core orchestration service. Uses Semantic Kernel to manage the chat loop.

```csharp
public interface ICmsAgentService
{
    /// <summary>
    /// Process a user message and return agent response with proposed changes.
    /// Streams response tokens via the provided callback.
    /// </summary>
    Task<AgentResponse> ProcessMessageAsync(
        AgentChatRequest request,
        Func<string, Task>? onTokenStream = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Commit proposed changes to the CMS.
    /// </summary>
    Task<CommitResult> CommitChangesAsync(
        CommitRequest request,
        CancellationToken cancellationToken = default);
}
```

**Implementation sketch**:
```csharp
public class CmsAgentService : ICmsAgentService
{
    private readonly Kernel _kernel;
    private readonly IEntityRecordRepository _recordRepo;
    private readonly IEntityDefinitionRepository _definitionRepo;
    private readonly SchemaValidationService _schemaValidator;

    public async Task<AgentResponse> ProcessMessageAsync(...)
    {
        // 1. Build chat history from request.ConversationHistory
        // 2. Add system prompt with content schema context
        // 3. Invoke Semantic Kernel with auto function calling
        // 4. Collect proposed changes from tool results
        // 5. Validate all proposed changes against schemas
        // 6. Return response text + proposed changes
    }

    public async Task<CommitResult> CommitChangesAsync(...)
    {
        // 1. For each proposed change:
        //    a. Load current EntityRecord
        //    b. Apply the change to JsonData
        //    c. Validate against EntityDefinition schema
        //    d. Call updateContent with Publish=true
        // 2. Return success/failure per change
    }
}
```

**`FV.Application/Services/CmsAgent/CmsAgentTools.cs`**

Semantic Kernel plugin with native functions:

```csharp
public class CmsAgentTools
{
    [KernelFunction, Description("Get the current content for a page section")]
    public async Task<string> GetPageContent(
        [Description("The entity type (e.g., hero, about, services, contact, navigation, footer, site-config)")] string entityType)

    [KernelFunction, Description("Get the schema definition for a content type")]
    public async Task<string> GetEntitySchema(
        [Description("The entity type to get the schema for")] string entityType)

    [KernelFunction, Description("Propose a content update. Does NOT save — returns a ProposedChange for preview.")]
    public async Task<string> ProposeContentUpdate(
        [Description("The entity type")] string entityType,
        [Description("The field path to update (e.g., 'title', 'description', 'items[0].name')")] string fieldPath,
        [Description("The new value for the field")] string newValue)

    [KernelFunction, Description("List all available content types and their schemas")]
    public async Task<string> ListContentTypes()

    [KernelFunction, Description("Search across all content for specific text or topics")]
    public async Task<string> SearchContent(
        [Description("The search query")] string query)
}
```

**`FV.Application/Services/CmsAgent/Models/AgentModels.cs`**

```csharp
public record AgentChatRequest
{
    public required string Message { get; init; }
    public required Guid PortfolioId { get; init; }
    public required Guid UserId { get; init; }
    public List<ChatHistoryMessage> ConversationHistory { get; init; } = [];
    public string? SessionId { get; init; }
}

public record ChatHistoryMessage
{
    public required string Role { get; init; }  // "user" or "assistant"
    public required string Content { get; init; }
}

public record AgentResponse
{
    public required string Message { get; init; }
    public List<ProposedChange> ProposedChanges { get; init; } = [];
    public string? SessionId { get; init; }
}

public record ProposedChange
{
    public required string Id { get; init; }       // Unique change ID
    public required string EntityType { get; init; }
    public Guid? RecordId { get; init; }
    public required string FieldPath { get; init; }
    public required string OldValue { get; init; }
    public required string NewValue { get; init; }
    public required string Description { get; init; }  // Human-readable summary
}

public record CommitRequest
{
    public required Guid PortfolioId { get; init; }
    public required Guid UserId { get; init; }
    public required List<string> ChangeIds { get; init; }  // IDs of ProposedChanges to commit
    public required List<ProposedChange> Changes { get; init; }
}

public record CommitResult
{
    public bool Success { get; init; }
    public List<ChangeResult> Results { get; init; } = [];
    public string? Error { get; init; }
}

public record ChangeResult
{
    public required string ChangeId { get; init; }
    public bool Success { get; init; }
    public string? Error { get; init; }
}
```

#### GraphQL Endpoints

**`FV.Api/ApiEndpoints/GraphQl/Mutations/AgentMutations.cs`**

```csharp
[Authorize(Roles = new[] { "Admin" })]
public class AgentMutations
{
    [GraphQLDescription("Send a message to the CMS editing agent")]
    public async Task<AgentChatPayload> AgentChat(
        AgentChatInput input,
        [Service] ICmsAgentService agentService,
        [Service] ITenantContext tenantContext,
        ClaimsPrincipal user)
    {
        // Extract userId from claims
        // Call agentService.ProcessMessageAsync
        // Return response + proposed changes
    }

    [GraphQLDescription("Commit proposed changes from the agent")]
    public async Task<CommitPayload> AgentCommit(
        AgentCommitInput input,
        [Service] ICmsAgentService agentService,
        [Service] ITenantContext tenantContext,
        ClaimsPrincipal user)
    {
        // Call agentService.CommitChangesAsync
        // Return success/failure
    }
}
```

**`FV.Api/ApiEndpoints/GraphQl/Subscriptions/AgentSubscriptions.cs`**

```csharp
public class AgentSubscriptions
{
    [Subscribe]
    [GraphQLDescription("Stream agent response tokens in real-time")]
    public AgentStreamEvent OnAgentEvent(
        [EventMessage] AgentStreamEvent evt,
        string sessionId)
    {
        return evt;
    }
}

public record AgentStreamEvent
{
    public required string SessionId { get; init; }
    public required string EventType { get; init; }  // "token", "proposed_change", "complete", "error"
    public string? Token { get; init; }
    public ProposedChange? Change { get; init; }
    public string? Error { get; init; }
}
```

### 5.2 Backend: Orchestrator Configuration

**System Prompt** — stored in `FV.Application/Services/CmsAgent/Prompts/CmsAgentSystemPrompt.cs`

See [Section 6](#6-system-prompt-design) for the full prompt.

**Semantic Kernel Setup** — in `FV.Api/Program.cs` or `FV.Application/DependencyInjection.cs`:

```csharp
// Register Semantic Kernel
builder.Services.AddKernel();
builder.Services.AddAzureOpenAIChatCompletion(
    deploymentName: config["AzureOpenAi:ChatDeployment"],
    endpoint: config["AzureOpenAi:Endpoint"],
    apiKey: config["AzureOpenAi:ApiKey"]
);

// Register CMS Agent
builder.Services.AddScoped<CmsAgentTools>();
builder.Services.AddScoped<ICmsAgentService, CmsAgentService>();
```

### 5.3 Frontend: Agent Side Panel

#### New Files

**`frontend/portfolio-react/src/features/agent/AgentPanel.tsx`**

The main side panel component:
- Slide-out drawer (right side, ~400px wide)
- Chat message list (scrollable)
- Input box with send button
- Status indicator (thinking, streaming, idle)
- Renders only when `useAuth().isAuthenticated` is true

```tsx
// Pseudo-structure
export function AgentPanel() {
  const { isOpen, messages, isStreaming, proposedChanges, sendMessage, commit, discard } = useAgent();

  return (
    <div className={`agent-panel ${isOpen ? 'open' : ''}`}>
      <div className="agent-header">
        <h3>CMS Agent</h3>
        <button onClick={togglePanel}>×</button>
      </div>

      <div className="agent-messages">
        {messages.map(msg => <AgentMessage key={msg.id} message={msg} />)}
        {isStreaming && <StreamingIndicator />}
      </div>

      {proposedChanges.length > 0 && (
        <CommitToolbar
          changes={proposedChanges}
          onCommit={commit}
          onDiscard={discard}
        />
      )}

      <div className="agent-input">
        <textarea onSubmit={sendMessage} placeholder="Ask me to edit your content..." />
        <button onClick={() => sendMessage(inputValue)}>Send</button>
      </div>
    </div>
  );
}
```

**`frontend/portfolio-react/src/features/agent/AgentProvider.tsx`**

React context that manages:
- Chat state (messages, streaming content)
- Proposed changes queue
- Preview state (on/off)
- GraphQL subscription connection for streaming
- Session management

```tsx
interface AgentState {
  isOpen: boolean;
  messages: AgentMessage[];
  isStreaming: boolean;
  streamingContent: string;
  proposedChanges: ProposedChange[];
  isPreviewActive: boolean;
  sessionId: string | null;
}

interface AgentContextValue extends AgentState {
  togglePanel: () => void;
  sendMessage: (content: string) => Promise<void>;
  commit: (changeIds?: string[]) => Promise<void>;
  discard: (changeIds?: string[]) => void;
  togglePreview: () => void;
}
```

**`frontend/portfolio-react/src/features/agent/useAgent.ts`**

Hook wrapping the AgentProvider context. Handles:
- Sending `agentChat` mutation
- Subscribing to `onAgentEvent` for streaming tokens
- Building conversation history from messages
- Managing proposed changes

**`frontend/portfolio-react/src/features/agent/AgentToggle.tsx`**

Floating button (FAB) that opens/closes the panel:
- Fixed position (bottom-right corner)
- Only renders when authenticated
- Shows badge count for pending proposed changes
- Subtle, doesn't interfere with page content

**`frontend/portfolio-react/src/features/agent/AgentMessage.tsx`**

Renders a single message:
- User messages: right-aligned, simple text
- Agent messages: left-aligned, markdown-rendered
- Proposed changes inline: shows field, old value → new value as a diff card

**`frontend/portfolio-react/src/features/agent/CommitToolbar.tsx`**

Sticky toolbar at bottom of panel when changes exist:
- Shows count of pending changes
- "Preview" toggle button (enables/disables live preview on the page)
- "Commit All" button (green, prominent)
- "Discard All" button (red, secondary)
- Expandable list showing each proposed change with individual accept/reject

**`frontend/portfolio-react/src/features/agent/agentApi.ts`**

GraphQL operations for the agent:

```typescript
// Mutation: Send a message to the agent
const AGENT_CHAT = gql`
  mutation AgentChat($input: AgentChatInput!) {
    agentChat(input: $input) {
      message
      sessionId
      proposedChanges {
        id
        entityType
        recordId
        fieldPath
        oldValue
        newValue
        description
      }
    }
  }
`;

// Mutation: Commit changes
const AGENT_COMMIT = gql`
  mutation AgentCommit($input: AgentCommitInput!) {
    agentCommit(input: $input) {
      success
      results {
        changeId
        success
        error
      }
      error
    }
  }
`;

// Subscription: Stream agent events (tokens, changes)
const ON_AGENT_EVENT = gql`
  subscription OnAgentEvent($sessionId: String!) {
    onAgentEvent(sessionId: $sessionId) {
      sessionId
      eventType
      token
      change {
        id
        entityType
        recordId
        fieldPath
        oldValue
        newValue
        description
      }
      error
    }
  }
`;
```

**`frontend/portfolio-react/src/features/agent/types.ts`**

TypeScript types for agent state, messages, proposed changes, etc.

### 5.4 Frontend: Preview Mechanism

This is the most architecturally important piece. The preview must:
- Show proposed changes on the actual page in real-time
- Not persist anything to the backend
- Work with all existing section hooks (`useHero()`, `useAbout()`, etc.)
- Be clearly visually distinguished from committed content

**`frontend/portfolio-react/src/features/agent/PreviewProvider.tsx`**

Wraps the existing `CMSProvider` and intercepts the CMS context:

```tsx
export function PreviewProvider({ children }: { children: ReactNode }) {
  const { proposedChanges, isPreviewActive } = useAgent();
  const originalCmsData = useCMS(); // Get the real data

  // Build preview data by merging proposed changes over real data
  const previewData = useMemo(() => {
    if (!isPreviewActive || proposedChanges.length === 0) {
      return originalCmsData;
    }

    // Deep clone the original data
    const merged = structuredClone(originalCmsData);

    // Apply each proposed change
    for (const change of proposedChanges) {
      applyChangeToSection(merged, change);
    }

    return merged;
  }, [originalCmsData, proposedChanges, isPreviewActive]);

  return (
    <CMSPreviewContext.Provider value={previewData}>
      {children}
    </CMSPreviewContext.Provider>
  );
}
```

**How section hooks integrate**:

The existing `useCMS()` hook reads from `CMSContext`. We need to modify it slightly so that when a `CMSPreviewContext` is available, it reads from that instead. This is a minimal change:

```tsx
// In useCMS.tsx - modify the hook
export function useCMS() {
  const previewContext = useContext(CMSPreviewContext);
  const realContext = useContext(CMSContext);

  // Preview context takes priority when available
  return previewContext ?? realContext;
}
```

This means ALL existing section hooks (`useHero()`, `useAbout()`, etc.) automatically render preview data without any changes to those hooks or the page components.

**Visual indicators for preview**:
- A floating banner at the top: "Preview Mode — changes not yet saved"
- CSS outline/highlight on sections that have pending changes (using `data-entity-type` attributes on section wrappers)
- Pulsing border or subtle background color change on modified sections

### 5.5 Commit Workflow

**Commit Flow**:
```
User clicks "Commit All" (or per-change "Accept")
    │
    ▼
Frontend sends agentCommit mutation with selected ProposedChanges
    │
    ▼
Backend CmsAgentService.CommitChangesAsync:
    │
    ├─► For each ProposedChange:
    │   ├─► Load EntityRecord by (entityType + portfolioId)
    │   ├─► Parse current JsonData
    │   ├─► Apply change at fieldPath with newValue
    │   ├─► Validate merged JSON against EntityDefinition schema
    │   ├─► If valid: call updateContent(id, mergedData, publish: true)
    │   │   (This auto-creates EntityRecordVersion for rollback)
    │   └─► If invalid: return error for this change
    │
    ▼
Backend returns CommitResult with per-change success/failure
    │
    ▼
Frontend:
    ├─► Remove committed changes from proposedChanges queue
    ├─► Clear preview overlay for committed sections
    ├─► Refetch CMS data via Apollo (invalidate cache)
    ├─► Show success toast in chat: "✓ Changes committed successfully"
    └─► For failed changes: show error in chat, keep in queue for retry
```

**Discard Flow**:
```
User clicks "Discard All" (or per-change "Reject")
    │
    ▼
Frontend:
    ├─► Remove selected changes from proposedChanges queue
    ├─► Preview overlay automatically reverts (no proposed changes to merge)
    └─► Show message in chat: "Changes discarded"
```

**No backend call is needed for discard** — proposed changes are purely client-side state. The backend is only contacted on commit.

---

## 6. System Prompt Design

```
You are a CMS content editing assistant for a portfolio website. Your role is to help the website owner edit their page content through natural language conversation.

## Your Capabilities
- Read current page content for any section
- Propose content changes (text, descriptions, lists, configuration)
- Help with copywriting and content improvements
- Understand the content schema and suggest valid changes

## Available Content Types
{dynamically injected list of EntityDefinitions for this portfolio}

## Rules
1. NEVER auto-commit changes. Always propose changes for the user to review.
2. When asked to edit content, ALWAYS:
   a. First fetch the current content using GetPageContent
   b. Then propose specific changes using ProposeContentUpdate
   c. Explain what you're changing and why
3. Keep proposed changes minimal and focused — only change what the user asked for.
4. If a request is ambiguous, ask for clarification before proposing changes.
5. Validate that proposed values match the field type (e.g., don't put HTML in a plain text field).
6. You can only edit content within the authenticated user's portfolio.
7. If asked to do something outside content editing (run code, access external APIs, etc.), politely decline.

## Content Schema Reference
{dynamically injected EntityDefinition schemas with field types and constraints}

## Response Style
- Be concise and direct
- When proposing changes, always show what the current value is and what you're changing it to
- For multiple changes, list them clearly
- After proposing changes, remind the user they can preview and commit/discard
```

The dynamic sections (`{...}`) are populated at runtime by fetching the portfolio's EntityDefinitions and formatting them into the prompt. This gives the LLM full awareness of the content schema.

---

## 7. Tool Definitions

### Tool: `GetPageContent`
- **Purpose**: Fetch current content for a section
- **Input**: `entityType: string` (e.g., "hero", "about", "services")
- **Output**: JSON string of the section's current data
- **Implementation**: Queries `EntityRecord` where `EntityType = entityType AND PortfolioId = currentTenant AND IsDraft = false`
- **Risk**: Low (read-only)

### Tool: `GetEntitySchema`
- **Purpose**: Get the schema definition for a content type
- **Input**: `entityType: string`
- **Output**: JSON string of `EntityDefinition` with all `AttributeDefinition` entries
- **Implementation**: Queries `EntityDefinition` where `Name = entityType`
- **Risk**: Low (read-only)

### Tool: `ProposeContentUpdate`
- **Purpose**: Propose a change to a content field (does NOT persist)
- **Input**: `entityType: string`, `fieldPath: string`, `newValue: string`
- **Output**: `ProposedChange` object with old value, new value, and description
- **Implementation**:
  1. Fetch current record for the entity type
  2. Extract current value at `fieldPath`
  3. Validate `newValue` against the field's `AttributeDefinition` (type, constraints)
  4. Return `ProposedChange` without saving anything
- **Risk**: Low (no side effects)

### Tool: `ListContentTypes`
- **Purpose**: List all content types and their schemas
- **Input**: None
- **Output**: JSON array of entity type names with descriptions
- **Implementation**: Queries all `EntityDefinition` records for the portfolio
- **Risk**: Low (read-only)

### Tool: `SearchContent`
- **Purpose**: Full-text search across all content
- **Input**: `query: string`
- **Output**: Matching content snippets with entity type and field path
- **Implementation**: Searches `EntityRecord.JsonData` across all records for the portfolio. Uses Elasticsearch if available, otherwise simple LIKE query on JSON.
- **Risk**: Low (read-only)

---

## 8. Security & Guardrails

### Authentication & Authorization
- Agent endpoints require `[Authorize(Roles = "Admin")]` — same as existing content mutations
- JWT token is sent via Apollo Client's existing auth header configuration
- Tenant resolution middleware ensures the agent can only access the authenticated user's portfolio
- The agent panel only renders when `useAuth().isAuthenticated === true`

### Input Guardrails
- **Message length limit**: Max 2000 characters per message
- **Rate limiting**: Max 20 agent messages per minute per user
- **Content filtering**: The system prompt instructs the LLM to refuse non-content-editing requests
- **No code execution**: The agent has no tools that execute code or access external services

### Output Guardrails
- **Schema validation**: All proposed changes are validated against `EntityDefinition` schemas before being presented to the user
- **Type checking**: Proposed values must match the field's `AttributeType` (text, richtext, number, image, etc.)
- **Constraint enforcement**: Min/max length, required fields, regex patterns from `AttributeDefinition`
- **No auto-commit**: The agent physically cannot commit changes — only `CommitChangesAsync` does, and it requires explicit user action

### Behavioral Guardrails
- **Scope limitation**: System prompt constrains the agent to content editing only
- **Single-portfolio scope**: Tenant context ensures no cross-portfolio access
- **Minimal changes**: System prompt instructs the agent to only change what was requested
- **Transparency**: All proposed changes show old value → new value diffs

---

## 9. File Changes Summary

### New Files — Backend (~6 files)

```
backend/dotnet/FV.Application/Services/CmsAgent/
├── CmsAgentService.cs              — Core agent orchestration (Semantic Kernel)
├── CmsAgentTools.cs                — SK plugin with native functions (5 tools)
├── Prompts/
│   └── CmsAgentSystemPrompt.cs     — System prompt template with dynamic schema injection
└── Models/
    └── AgentModels.cs              — DTOs: AgentChatRequest, AgentResponse, ProposedChange, CommitRequest, CommitResult

backend/dotnet/FV.Api/ApiEndpoints/GraphQl/
├── Mutations/AgentMutations.cs     — agentChat, agentCommit mutations
└── Subscriptions/AgentSubscriptions.cs — onAgentEvent subscription for streaming
```

### New Files — Frontend (~9 files)

```
frontend/portfolio-react/src/features/agent/
├── AgentPanel.tsx                  — Side panel UI container
├── AgentProvider.tsx               — React context for agent state
├── AgentToggle.tsx                 — Floating toggle button
├── AgentMessage.tsx                — Individual message renderer
├── CommitToolbar.tsx               — Commit/Discard controls
├── PreviewProvider.tsx             — CMS context overlay for live preview
├── useAgent.ts                     — Agent hook (wraps context)
├── agentApi.ts                     — GraphQL operations (mutations, subscription)
├── types.ts                        — TypeScript types
└── agent.css                       — Agent panel styles
```

### Modified Files (~5 files)

```
backend/dotnet/FV.Api/Program.cs
  — Register Semantic Kernel, CmsAgentService, and new GraphQL types

backend/dotnet/FV.Application/FV.Application.csproj
  — Add Microsoft.SemanticKernel NuGet package

backend/dotnet/FV.Api/FV.Api.csproj
  — Add Microsoft.SemanticKernel NuGet package (if needed at API layer)

frontend/portfolio-react/src/shared/hooks/useCMS.tsx
  — Add CMSPreviewContext support (preview override in useCMS hook)

frontend/portfolio-react/src/App.tsx
  — Wrap app with PreviewProvider + render AgentPanel + AgentToggle
```

### Configuration Changes

```
backend/dotnet/FV.Api/appsettings.json
  — Add CmsAgent section:
    {
      "CmsAgent": {
        "AzureOpenAi": {
          "Endpoint": "...",
          "ApiKey": "...",
          "ChatDeployment": "gpt-4o",
          "MaxTokens": 4096,
          "Temperature": 0.3
        }
      }
    }
```

Note: The existing `appsettings.json` likely already has Azure OpenAI config for embeddings. We reuse the same endpoint/key but may need a separate chat deployment name.

---

## 10. Implementation Phases

### Phase 1: Mock Agent End-to-End (validate architecture)

**Goal**: Full working pipeline from UI → backend → preview → commit, using a mock agent that returns canned responses.

#### Phase 1a: Backend Scaffolding
- [ ] Create `AgentModels.cs` with all DTOs
- [ ] Create `ICmsAgentService` interface
- [ ] Create `MockCmsAgentService` that returns hardcoded proposed changes
- [ ] Create `AgentMutations.cs` with `agentChat` and `agentCommit` mutations
- [ ] Register services in `Program.cs`
- [ ] Test via GraphQL Banana Cake Pop / Postman

#### Phase 1b: Frontend Agent Panel
- [ ] Create `types.ts` with TypeScript types
- [ ] Create `agentApi.ts` with GraphQL operations
- [ ] Create `AgentProvider.tsx` with state management
- [ ] Create `useAgent.ts` hook
- [ ] Create `AgentPanel.tsx` (slide-out drawer)
- [ ] Create `AgentToggle.tsx` (floating button, auth-gated)
- [ ] Create `AgentMessage.tsx` (message rendering)
- [ ] Create `CommitToolbar.tsx` (commit/discard controls)
- [ ] Create `agent.css` (styling)
- [ ] Wire into `App.tsx`

#### Phase 1c: Preview Mechanism
- [ ] Create `PreviewProvider.tsx`
- [ ] Create `CMSPreviewContext`
- [ ] Modify `useCMS.tsx` to support preview context override
- [ ] Add `PreviewProvider` wrapper in `App.tsx`
- [ ] Add visual indicators (preview banner, section highlights)
- [ ] Test: mock agent proposes a hero title change → page shows new title live

#### Phase 1d: Commit Workflow
- [ ] Implement `CommitChangesAsync` in `MockCmsAgentService` (real commit logic using existing mutations)
- [ ] Wire commit button to `agentCommit` mutation
- [ ] Handle commit success: clear preview, refetch CMS data
- [ ] Handle commit failure: show errors, keep changes in queue
- [ ] Wire discard button: clear proposed changes, revert preview
- [ ] Test full flow: propose → preview → commit → verify in DB

### Phase 2: Real LLM Integration

#### Phase 2a: Semantic Kernel Setup
- [ ] Add `Microsoft.SemanticKernel` NuGet package to `FV.Application`
- [ ] Configure Azure OpenAI chat completion in DI
- [ ] Create `CmsAgentService` (real implementation replacing mock)
- [ ] Build system prompt template with dynamic schema injection
- [ ] Test basic chat completion (no tools yet)

#### Phase 2b: Tool Implementation
- [ ] Implement `CmsAgentTools` as a Semantic Kernel plugin
- [ ] Implement `GetPageContent` — query EntityRecord
- [ ] Implement `GetEntitySchema` — query EntityDefinition
- [ ] Implement `ProposeContentUpdate` — build ProposedChange from current data + proposed value
- [ ] Implement `ListContentTypes` — query all EntityDefinitions
- [ ] Implement `SearchContent` — search EntityRecord JSON data
- [ ] Register plugin with Semantic Kernel
- [ ] Test: send a message, verify tool calls are made correctly

#### Phase 2c: Streaming
- [ ] Add GraphQL subscription `onAgentEvent`
- [ ] Implement token streaming from Semantic Kernel to subscription
- [ ] Frontend: subscribe to `onAgentEvent` on message send
- [ ] Frontend: accumulate tokens and render streaming text
- [ ] Test: send a message, see tokens stream in real-time

#### Phase 2d: Guardrails & Polish
- [ ] Add input validation (message length, rate limiting)
- [ ] Add schema validation for proposed changes
- [ ] Add error handling throughout (network errors, LLM errors, schema validation failures)
- [ ] Add conversation history management (limit context window)
- [ ] Polish UI (animations, loading states, error states)
- [ ] Test edge cases: invalid requests, schema constraint violations, concurrent edits, large content

---

## 11. Open Questions & Risks

### Open Questions

1. **Field path format for nested JSON**: EntityRecord stores data as JSON. How do we address nested fields? Options:
   - JSON Pointer (`/hero/items/0/title`)
   - Dot notation (`hero.items[0].title`)
   - Simple field name when it's a top-level key in the JSON data
   
   **Recommendation**: Start with simple top-level field names (most content is flat). Add dot notation support later for nested structures like service items.

2. **Multi-record entity types**: Some entity types (e.g., `blog-post`, `case-study-page`) can have multiple records. How does the agent identify WHICH record to edit?
   
   **Recommendation**: For multi-record types, the agent should use `SearchContent` to find the specific record, then use the `recordId` in `ProposeContentUpdate`. For singleton types (hero, about, etc.), it's automatic.

3. **Rich text editing**: Fields like `description` may contain HTML/Markdown. How does the agent handle rich text?
   
   **Recommendation**: The agent works with the raw content format (HTML or Markdown, depending on what's stored). The system prompt should instruct it to preserve formatting when making partial edits.

4. **Image/media updates**: Can the agent update image URLs?
   
   **Recommendation**: Phase 1 focuses on text content. Image/media editing (upload, URL changes) can be added as a Phase 3 feature with additional tools (`UploadMedia`, `SearchMediaLibrary`).

5. **Azure OpenAI model**: Which deployment to use?
   
   **Recommendation**: `gpt-4o` for best function calling + content generation quality. Falls back to `gpt-4o-mini` for lower cost during development.

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM produces invalid content for schema | Medium | Low | Schema validation + reflection loop catches this |
| Agent edits wrong field/section | Low | Medium | System prompt + user preview before commit |
| Preview context override breaks existing hooks | Low | High | Minimal change to `useCMS.tsx` — only adds context fallback |
| HotChocolate subscription performance | Low | Medium | GraphQL subscriptions are lightweight; one per active session |
| Semantic Kernel version compatibility | Low | Medium | Pin to stable version; SK has reached v1.0+ stable |
| Concurrent edits (two admins) | Low | Medium | EntityRecord versioning provides conflict detection |
| Large content payloads in context window | Medium | Low | Truncate content in tool responses; only send relevant fields |

---

## Appendix A: Existing AgentChat System Reference

The `AgentChat.*` microservice system is a separate, more complex distributed architecture:

```
AgentChat Architecture:
  ApiBff (REST + SSE) → RabbitMQ → Orchestrator → ModelGateway (Azure OpenAI)
                                  → Tools Worker
                                  → Event Store (Postgres)
                                  → Redis (pub/sub)
```

Key components:
- **ApiBff**: REST API with SignalR hub and SSE endpoints for real-time streaming
- **Orchestrator**: Consumes from RabbitMQ, manages run state machine (Pending → Running → WaitingForApproval → Completed)
- **ModelGateway**: Proxies LLM calls to Azure OpenAI or OpenAI-compatible endpoints (Ollama, etc.)
- **Tools Worker**: Executes tool calls (web search, file write, code execute, portfolio search, etc.)
- **Infrastructure**: Postgres event store, RabbitMQ message queue, Redis event publisher
- **PortfolioAgent**: Assistant type with portfolio search, memory, draft, and analysis tools
- **Approval System**: Multi-tier approval flow with risk-based policies

This system is used for the standalone agent chat web app (`frontend/agent-chat-web/`) and is NOT directly used for the CMS editing agent. However, patterns from it (tool registry, event types, streaming) inform the design.

---

## Appendix B: Content Types Reference

Content types available in the CMS (from EntityDefinition):

| Entity Type | Singleton? | Description |
|-------------|-----------|-------------|
| `hero` | Yes | Hero banner section (title, subtitle, CTA) |
| `about` | Yes | About section (bio, skills, experience summary) |
| `services` | Yes | Services section (list of service items) |
| `contact` | Yes | Contact section (email, phone, social links) |
| `navigation` | Yes | Navigation menu items |
| `footer` | Yes | Footer content (copyright, links) |
| `site-config` | Yes | Site-wide configuration (colors, fonts, metadata) |
| `blog-post` | No | Blog posts (multiple records) |
| `case-study-page` | No | Case study pages (multiple records) |
| `experience` | No | Work experience entries |
| `skills` | No | Skills/competencies |

---

## Appendix C: GraphQL Schema Additions

```graphql
# Input types
input AgentChatInput {
  message: String!
  conversationHistory: [ChatHistoryMessageInput!]
  sessionId: String
}

input ChatHistoryMessageInput {
  role: String!
  content: String!
}

input AgentCommitInput {
  changeIds: [String!]!
  changes: [ProposedChangeInput!]!
}

input ProposedChangeInput {
  id: String!
  entityType: String!
  recordId: ID
  fieldPath: String!
  oldValue: String!
  newValue: String!
  description: String!
}

# Payload types
type AgentChatPayload {
  message: String!
  sessionId: String!
  proposedChanges: [ProposedChange!]!
}

type ProposedChange {
  id: String!
  entityType: String!
  recordId: ID
  fieldPath: String!
  oldValue: String!
  newValue: String!
  description: String!
}

type CommitPayload {
  success: Boolean!
  results: [ChangeResult!]!
  error: String
}

type ChangeResult {
  changeId: String!
  success: Boolean!
  error: String
}

# Subscription
type AgentStreamEvent {
  sessionId: String!
  eventType: String!
  token: String
  change: ProposedChange
  error: String
}

# Mutations (added to existing Mutation type)
extend type Mutation {
  agentChat(input: AgentChatInput!): AgentChatPayload! @authorize(roles: ["Admin"])
  agentCommit(input: AgentCommitInput!): CommitPayload! @authorize(roles: ["Admin"])
}

# Subscriptions (added to existing Subscription type, or new)
extend type Subscription {
  onAgentEvent(sessionId: String!): AgentStreamEvent!
}
```
