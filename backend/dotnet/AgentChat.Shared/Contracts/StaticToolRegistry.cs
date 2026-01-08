using System.Text.Json;
using AgentChat.Shared.Models;

namespace AgentChat.Shared.Contracts;

/// <summary>
/// Simple tool registry that uses static tool definitions
/// Can be used by services that only need tool metadata (not execution)
/// </summary>
public class StaticToolRegistry : IToolRegistry
{
    private readonly Dictionary<string, ToolDefinition> _tools;
    private static bool _constructorRan = false;
    private static int _toolsLoadedCount = -999;

    public StaticToolRegistry()
    {
        Console.Error.WriteLine($">>> CONSTRUCTOR ENTRY POINT");
        _tools = new Dictionary<string, ToolDefinition>();
        _constructorRan = true;
        Console.Error.WriteLine($">>> _constructorRan set to true");
        
        try
        {
            Console.Error.WriteLine($">>> StaticToolRegistry constructor starting");
            
            var defaultTools = CreateDefaultTools();
            _toolsLoadedCount = defaultTools?.Count ?? -1;
            Console.Error.WriteLine($">>> CreateDefaultTools returned {_toolsLoadedCount} tools");
            
            if (defaultTools != null && defaultTools.Count > 0)
            {
                _tools = defaultTools.ToDictionary(t => t.Name, t => t);
            }
            
            Console.Error.WriteLine($">>> _tools has {_tools.Count} entries");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($">>> StaticToolRegistry constructor FAILED: {ex}");
        }
    }

    // Removed the IEnumerable<ToolDefinition> constructor because .NET DI prefers
    // constructors with more parameters, and IEnumerable<T> always resolves (to empty)
    // which was causing the parameterless constructor to be skipped!

    public IReadOnlyList<ToolDefinition> GetAllTools()
    {
        Console.Error.WriteLine($">>> GetAllTools: constructorRan={_constructorRan}, toolsLoaded={_toolsLoadedCount}, count={_tools?.Count ?? -1}");
        return _tools?.Values.ToList() ?? new List<ToolDefinition>();
    }

    public IReadOnlyList<ToolDefinition> GetTools(string? category = null, IEnumerable<string>? tags = null)
    {
        var tools = _tools.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(category))
        {
            tools = tools.Where(t => t.Category == category);
        }

        if (tags != null && tags.Any())
        {
            var tagSet = tags.ToHashSet();
            tools = tools.Where(t => t.Tags.Any(tag => tagSet.Contains(tag)));
        }

        return tools.ToList();
    }

    public ToolDefinition? GetTool(string name) =>
        _tools.TryGetValue(name, out var tool) ? tool : null;

    public bool HasTool(string name) => _tools.ContainsKey(name);

    public ToolValidationResult ValidateArgs(string toolName, JsonElement args)
    {
        if (!_tools.ContainsKey(toolName))
        {
            return ToolValidationResult.Failure($"Tool '{toolName}' not found");
        }
        return ToolValidationResult.Success();
    }

    private static List<ToolDefinition> CreateDefaultTools()
    {
        var tools = new List<ToolDefinition>();
        
        // Built-in Tools (3)
        tools.Add(new()
        {
            Name = "web_search",
            Description = "Search the web for information using a search query",
            Category = "search",
            RiskTier = RiskTier.Low,
            Tags = ["web", "search", "information"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "query": { "type": "string", "description": "The search query" },
                    "max_results": { "type": "integer", "description": "Maximum number of results to return", "default": 5 }
                },
                "required": ["query"]
            }
            """).RootElement
        });
        
        tools.Add(new()
        {
            Name = "file_write",
            Description = "Write content to a file at the specified path",
            Category = "filesystem",
            RiskTier = RiskTier.High,
            Tags = ["file", "write", "filesystem"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "The file path to write to" },
                    "content": { "type": "string", "description": "The content to write to the file" },
                    "append": { "type": "boolean", "description": "Whether to append to existing file", "default": false }
                },
                "required": ["path", "content"]
            }
            """).RootElement
        });
        
        tools.Add(new()
        {
            Name = "code_execute",
            Description = "Execute code in a sandboxed environment",
            Category = "code",
            RiskTier = RiskTier.Critical,
            Tags = ["code", "execution", "compute"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "language": { "type": "string", "description": "Programming language", "enum": ["python", "javascript", "bash"] },
                    "code": { "type": "string", "description": "The code to execute" },
                    "timeout_seconds": { "type": "integer", "description": "Execution timeout in seconds", "default": 30 }
                },
                "required": ["language", "code"]
            }
            """).RootElement
        });
        
        // Finance Knowledge Base Tools (9)
        tools.Add(new()
        {
            Name = "kb_procedure_search",
            Description = "Search for accounting procedures in the finance knowledge base. Use to find procedures by category (close, reconciliation, journal_entry, revenue), subcategory, or keyword.",
            Category = "knowledge_base",
            RiskTier = RiskTier.Low,
            Tags = ["kb", "procedure", "search", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "category": { "type": "string", "description": "Procedure category", "enum": ["close", "reconciliation", "journal_entry", "revenue", "fixed_assets", "intercompany"] },
                    "subcategory": { "type": "string", "description": "Procedure subcategory" },
                    "keyword": { "type": "string", "description": "Search keyword" },
                    "limit": { "type": "integer", "description": "Max results", "default": 10 }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "kb_procedure_get",
            Description = "Get detailed information about a specific procedure by ID",
            Category = "knowledge_base",
            RiskTier = RiskTier.Low,
            Tags = ["kb", "procedure", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "procedure_id": { "type": "string", "description": "The procedure ID" }
                },
                "required": ["procedure_id"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "kb_policy_search",
            Description = "Search for accounting policies",
            Category = "knowledge_base",
            RiskTier = RiskTier.Low,
            Tags = ["kb", "policy", "search", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "topic": { "type": "string", "description": "Policy topic" },
                    "keyword": { "type": "string", "description": "Search keyword" }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "kb_policy_get",
            Description = "Get a specific policy by ID",
            Category = "knowledge_base",
            RiskTier = RiskTier.Low,
            Tags = ["kb", "policy", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "policy_id": { "type": "string", "description": "The policy ID" }
                },
                "required": ["policy_id"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "kb_account_lookup",
            Description = "Look up GL account information from the chart of accounts",
            Category = "knowledge_base",
            RiskTier = RiskTier.Low,
            Tags = ["kb", "account", "chart-of-accounts", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "account_number": { "type": "string", "description": "Account number" },
                    "account_name": { "type": "string", "description": "Account name search" },
                    "account_type": { "type": "string", "description": "Account type filter", "enum": ["asset", "liability", "equity", "revenue", "expense"] }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "kb_guidance_search",
            Description = "Search for accounting guidance (GAAP, IFRS, internal)",
            Category = "knowledge_base",
            RiskTier = RiskTier.Low,
            Tags = ["kb", "guidance", "gaap", "ifrs", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "standard": { "type": "string", "description": "Accounting standard", "enum": ["gaap", "ifrs", "internal"] },
                    "topic": { "type": "string", "description": "Topic to search" },
                    "keyword": { "type": "string", "description": "Search keyword" }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "kb_template_search",
            Description = "Search for journal entry or reconciliation templates",
            Category = "knowledge_base",
            RiskTier = RiskTier.Low,
            Tags = ["kb", "template", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "type": { "type": "string", "description": "Template type", "enum": ["journal_entry", "reconciliation", "close_checklist"] },
                    "category": { "type": "string", "description": "Category filter" }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "kb_template_get",
            Description = "Get a specific template by ID",
            Category = "knowledge_base",
            RiskTier = RiskTier.Low,
            Tags = ["kb", "template", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "template_id": { "type": "string", "description": "The template ID" }
                },
                "required": ["template_id"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "kb_faq_search",
            Description = "Search accounting FAQs",
            Category = "knowledge_base",
            RiskTier = RiskTier.Low,
            Tags = ["kb", "faq", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "question": { "type": "string", "description": "Question to search" },
                    "category": { "type": "string", "description": "FAQ category" }
                }
            }
            """).RootElement
        });

        // Data Lake Tools (5)
        tools.Add(new()
        {
            Name = "datalake_gl_query",
            Description = "Query general ledger data from the data lake",
            Category = "finance_datalake",
            RiskTier = RiskTier.Low,
            Tags = ["datalake", "gl", "query", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "account": { "type": "string", "description": "Account number or pattern" },
                    "period": { "type": "string", "description": "Period (YYYY-MM or YYYY)" },
                    "entity": { "type": "string", "description": "Legal entity code" },
                    "include_details": { "type": "boolean", "description": "Include line details", "default": false }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "datalake_fixed_asset_query",
            Description = "Query fixed asset data",
            Category = "finance_datalake",
            RiskTier = RiskTier.Low,
            Tags = ["datalake", "fixed-asset", "query", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "asset_class": { "type": "string", "description": "Asset class filter" },
                    "location": { "type": "string", "description": "Location code" },
                    "status": { "type": "string", "description": "Asset status", "enum": ["active", "disposed", "fully_depreciated"] }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "datalake_subledger_query",
            Description = "Query subledger data (AR, AP, Inventory)",
            Category = "finance_datalake",
            RiskTier = RiskTier.Low,
            Tags = ["datalake", "subledger", "query", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "subledger": { "type": "string", "description": "Subledger type", "enum": ["ar", "ap", "inventory", "payroll"] },
                    "entity": { "type": "string", "description": "Entity code" },
                    "period": { "type": "string", "description": "Period" },
                    "filter": { "type": "object", "description": "Additional filters" }
                },
                "required": ["subledger"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "datalake_intercompany_query",
            Description = "Query intercompany transactions and balances",
            Category = "finance_datalake",
            RiskTier = RiskTier.Low,
            Tags = ["datalake", "intercompany", "query", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "from_entity": { "type": "string", "description": "Source entity" },
                    "to_entity": { "type": "string", "description": "Target entity" },
                    "period": { "type": "string", "description": "Period" },
                    "status": { "type": "string", "description": "Match status", "enum": ["matched", "unmatched", "all"] }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "datalake_variance_analysis",
            Description = "Perform variance analysis between periods or vs budget",
            Category = "finance_datalake",
            RiskTier = RiskTier.Low,
            Tags = ["datalake", "variance", "analysis", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "account_pattern": { "type": "string", "description": "Account pattern to analyze" },
                    "current_period": { "type": "string", "description": "Current period" },
                    "compare_to": { "type": "string", "description": "Comparison type", "enum": ["prior_period", "prior_year", "budget", "forecast"] },
                    "threshold_pct": { "type": "number", "description": "Variance threshold %", "default": 10 }
                },
                "required": ["account_pattern", "current_period", "compare_to"]
            }
            """).RootElement
        });

        // System of Record (SOR) Tools (13)
        tools.Add(new()
        {
            Name = "sor_journal_entry_create",
            Description = "Create a new journal entry in the ERP. HIGH RISK - requires approval.",
            Category = "finance_sor",
            RiskTier = RiskTier.High,
            Tags = ["sor", "journal", "write", "high-risk"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "description": { "type": "string", "description": "JE description" },
                    "period": { "type": "string", "description": "Accounting period" },
                    "lines": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "account": { "type": "string" },
                                "debit": { "type": "number" },
                                "credit": { "type": "number" },
                                "entity": { "type": "string" },
                                "description": { "type": "string" }
                            }
                        }
                    },
                    "attachments": { "type": "array", "items": { "type": "string" } },
                    "auto_reverse": { "type": "boolean", "default": false },
                    "reverse_period": { "type": "string" }
                },
                "required": ["description", "period", "lines"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_journal_entry_query",
            Description = "Query journal entries from the ERP",
            Category = "finance_sor",
            RiskTier = RiskTier.Low,
            Tags = ["sor", "journal", "query", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "je_number": { "type": "string", "description": "JE number" },
                    "period": { "type": "string", "description": "Period filter" },
                    "status": { "type": "string", "enum": ["draft", "pending", "posted", "reversed"] },
                    "created_by": { "type": "string", "description": "Creator filter" }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_journal_entry_reverse",
            Description = "Reverse a posted journal entry. HIGH RISK - requires approval.",
            Category = "finance_sor",
            RiskTier = RiskTier.High,
            Tags = ["sor", "journal", "reverse", "high-risk"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "je_number": { "type": "string", "description": "JE number to reverse" },
                    "reverse_period": { "type": "string", "description": "Period for reversal" },
                    "reason": { "type": "string", "description": "Reason for reversal" }
                },
                "required": ["je_number", "reverse_period", "reason"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_reconciliation_status",
            Description = "Get reconciliation status for accounts",
            Category = "finance_sor",
            RiskTier = RiskTier.Low,
            Tags = ["sor", "reconciliation", "status", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "account": { "type": "string", "description": "Account number" },
                    "period": { "type": "string", "description": "Period" },
                    "entity": { "type": "string", "description": "Entity code" }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_reconciliation_update",
            Description = "Update reconciliation status. MEDIUM RISK - requires approval for signoff.",
            Category = "finance_sor",
            RiskTier = RiskTier.Medium,
            Tags = ["sor", "reconciliation", "update", "medium-risk"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "recon_id": { "type": "string", "description": "Reconciliation ID" },
                    "status": { "type": "string", "enum": ["in_progress", "ready_for_review", "approved"] },
                    "notes": { "type": "string", "description": "Update notes" },
                    "attachments": { "type": "array", "items": { "type": "string" } }
                },
                "required": ["recon_id", "status"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_close_task_query",
            Description = "Query close tasks and their status",
            Category = "finance_sor",
            RiskTier = RiskTier.Low,
            Tags = ["sor", "close", "task", "query", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "period": { "type": "string", "description": "Close period" },
                    "task_type": { "type": "string", "description": "Task type filter" },
                    "assignee": { "type": "string", "description": "Assignee filter" },
                    "status": { "type": "string", "enum": ["not_started", "in_progress", "completed", "blocked"] }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_close_task_update",
            Description = "Update a close task status. MEDIUM RISK - affects close timeline.",
            Category = "finance_sor",
            RiskTier = RiskTier.Medium,
            Tags = ["sor", "close", "task", "update", "medium-risk"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "task_id": { "type": "string", "description": "Task ID" },
                    "status": { "type": "string", "enum": ["not_started", "in_progress", "completed", "blocked"] },
                    "notes": { "type": "string", "description": "Status notes" },
                    "blockers": { "type": "array", "items": { "type": "string" } }
                },
                "required": ["task_id", "status"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_period_status",
            Description = "Get accounting period status",
            Category = "finance_sor",
            RiskTier = RiskTier.Low,
            Tags = ["sor", "period", "status", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "period": { "type": "string", "description": "Period (YYYY-MM)" },
                    "entity": { "type": "string", "description": "Entity code" }
                },
                "required": ["period"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_period_close",
            Description = "Close an accounting period. CRITICAL RISK - requires multiple approvals.",
            Category = "finance_sor",
            RiskTier = RiskTier.Critical,
            Tags = ["sor", "period", "close", "critical-risk"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "period": { "type": "string", "description": "Period to close" },
                    "entity": { "type": "string", "description": "Entity code" },
                    "checklist_complete": { "type": "boolean", "description": "Confirm checklist complete" }
                },
                "required": ["period", "entity", "checklist_complete"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_report_generate",
            Description = "Generate a financial report",
            Category = "finance_sor",
            RiskTier = RiskTier.Low,
            Tags = ["sor", "report", "generate", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "report_type": { "type": "string", "enum": ["trial_balance", "income_statement", "balance_sheet", "cash_flow", "gl_detail"] },
                    "period": { "type": "string", "description": "Reporting period" },
                    "entity": { "type": "string", "description": "Entity code" },
                    "format": { "type": "string", "enum": ["pdf", "excel", "csv"], "default": "pdf" },
                    "comparative": { "type": "boolean", "default": false }
                },
                "required": ["report_type", "period"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_audit_log",
            Description = "Query audit log for changes",
            Category = "finance_sor",
            RiskTier = RiskTier.Low,
            Tags = ["sor", "audit", "log", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "entity_type": { "type": "string", "enum": ["journal_entry", "reconciliation", "close_task", "period"] },
                    "entity_id": { "type": "string", "description": "Entity ID" },
                    "date_from": { "type": "string", "description": "Start date" },
                    "date_to": { "type": "string", "description": "End date" },
                    "user": { "type": "string", "description": "User filter" }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_workflow_status",
            Description = "Get workflow/approval status",
            Category = "finance_sor",
            RiskTier = RiskTier.Low,
            Tags = ["sor", "workflow", "approval", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "workflow_id": { "type": "string", "description": "Workflow ID" },
                    "entity_type": { "type": "string", "description": "Entity type" },
                    "entity_id": { "type": "string", "description": "Entity ID" }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "sor_approval_pending",
            Description = "Get pending approvals for the current user.",
            Category = "finance_sor",
            RiskTier = RiskTier.Low,
            Tags = ["sor", "approval", "query", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "type": { "type": "string", "description": "Filter by approval type", "enum": ["journal_entry", "reconciliation", "close_task", "all"] }
                }
            }
            """).RootElement
        });

        // Excel Tools (3)
        tools.Add(new()
        {
            Name = "excel_template_search",
            Description = "Search for available Excel templates for accounting operations. " +
                          "Returns matching templates that can be generated with excel_template_generate. " +
                          "Use this to find templates for journal entries, reconciliations, close checklists, and analysis workpapers.",
            Category = "excel",
            RiskTier = RiskTier.Low,
            Tags = ["excel", "template", "search", "read-only"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Template category: journal_entry, reconciliation, close, analysis",
                        "enum": ["journal_entry", "reconciliation", "close", "analysis"]
                    },
                    "keyword": {
                        "type": "string",
                        "description": "Search keyword to find templates (e.g., 'bank', 'warranty', 'intercompany')"
                    }
                }
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "excel_template_generate",
            Description = "Generate an Excel workbook from a template. " +
                          "Optionally populate with header data and line items. " +
                          "Returns a base64-encoded Excel file that can be downloaded. " +
                          "Use excel_template_search first to find available templates.",
            Category = "excel",
            RiskTier = RiskTier.Low,
            Tags = ["excel", "template", "generate", "export"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "template_id": {
                        "type": "string",
                        "description": "Template ID from excel_template_search (e.g., 'tmpl-journal-entry-support')"
                    },
                    "file_name": {
                        "type": "string",
                        "description": "Name for the generated file (without extension)"
                    },
                    "header_data": {
                        "type": "object",
                        "description": "Key-value pairs to populate header fields (e.g., {'entity_code': 'US01', 'fiscal_year': 2024})"
                    },
                    "line_items": {
                        "type": "array",
                        "description": "Array of objects to populate data rows in the primary data sheet",
                        "items": {
                            "type": "object"
                        }
                    }
                },
                "required": ["template_id"]
            }
            """).RootElement
        });

        tools.Add(new()
        {
            Name = "excel_support_doc_create",
            Description = "Create a custom Excel support document with specified sheets, columns, and data. " +
                          "Use this for ad-hoc support documentation that doesn't fit a standard template. " +
                          "Returns a base64-encoded Excel file.",
            Category = "excel",
            RiskTier = RiskTier.Low,
            Tags = ["excel", "support", "document", "create", "export"],
            ParametersSchema = JsonDocument.Parse("""
            {
                "type": "object",
                "properties": {
                    "file_name": {
                        "type": "string",
                        "description": "Name for the generated file (without extension)"
                    },
                    "title": {
                        "type": "string",
                        "description": "Document title to display in the workbook"
                    },
                    "sheets": {
                        "type": "array",
                        "description": "Array of sheet definitions",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": { "type": "string", "description": "Sheet name" },
                                "headers": { 
                                    "type": "array", 
                                    "items": { "type": "string" },
                                    "description": "Column headers" 
                                },
                                "data": {
                                    "type": "array",
                                    "description": "Array of row data (each row is an array of values)",
                                    "items": { 
                                        "type": "array",
                                        "items": { "type": "string" }
                                    }
                                },
                                "summary": {
                                    "type": "object",
                                    "description": "Key-value pairs to display as summary at top of sheet"
                                }
                            },
                            "required": ["name"]
                        }
                    },
                    "metadata": {
                        "type": "object",
                        "description": "Document metadata (entity_code, period, prepared_by, etc.)"
                    }
                },
                "required": ["file_name", "sheets"]
            }
            """).RootElement
        });
        
        return tools;
    }
}
