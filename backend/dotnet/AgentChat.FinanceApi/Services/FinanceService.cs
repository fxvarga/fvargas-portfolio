using System.Collections.Concurrent;
using System.Text.Json;
using AgentChat.FinanceApi.Models;

namespace AgentChat.FinanceApi.Services;

/// <summary>
/// In-memory implementation of the Finance System of Record service
/// </summary>
public class FinanceService : IFinanceService
{
    private readonly ConcurrentDictionary<string, JournalEntry> _journalEntries = new();
    private readonly ConcurrentDictionary<string, Reconciliation> _reconciliations = new();
    private readonly ConcurrentDictionary<string, CloseTask> _closeTasks = new();
    private readonly ConcurrentDictionary<string, FiscalPeriod> _fiscalPeriods = new();
    private readonly ConcurrentDictionary<string, Approval> _approvals = new();
    
    private int _journalEntryCounter = 1000;
    private int _reconciliationCounter = 1000;
    private int _approvalCounter = 1000;
    private readonly string _dataPath;

    public FinanceService(string? dataPath = null)
    {
        _dataPath = dataPath ?? Path.Combine(AppContext.BaseDirectory, "Data");
        LoadMockDataAsync().Wait();
    }

    private async Task LoadMockDataAsync()
    {
        await LoadJournalEntriesAsync();
        await LoadReconciliationsAsync();
        await LoadCloseTasksAsync();
        await LoadFiscalPeriodsAsync();
        await LoadApprovalsAsync();
    }

    private async Task LoadJournalEntriesAsync()
    {
        var path = Path.Combine(_dataPath, "journal_entries");
        if (!Directory.Exists(path)) return;

        foreach (var file in Directory.GetFiles(path, "*.json"))
        {
            try
            {
                var json = await File.ReadAllTextAsync(file);
                var entries = JsonSerializer.Deserialize<List<JournalEntry>>(json);
                if (entries != null)
                {
                    foreach (var entry in entries)
                    {
                        _journalEntries.TryAdd(entry.Id, entry);
                    }
                }
            }
            catch { /* Ignore malformed files */ }
        }
    }

    private async Task LoadReconciliationsAsync()
    {
        var path = Path.Combine(_dataPath, "reconciliations");
        if (!Directory.Exists(path)) return;

        foreach (var file in Directory.GetFiles(path, "*.json"))
        {
            try
            {
                var json = await File.ReadAllTextAsync(file);
                var recs = JsonSerializer.Deserialize<List<Reconciliation>>(json);
                if (recs != null)
                {
                    foreach (var rec in recs)
                    {
                        _reconciliations.TryAdd(rec.Id, rec);
                    }
                }
            }
            catch { /* Ignore malformed files */ }
        }
    }

    private async Task LoadCloseTasksAsync()
    {
        var path = Path.Combine(_dataPath, "close_tasks");
        if (!Directory.Exists(path)) return;

        foreach (var file in Directory.GetFiles(path, "*.json"))
        {
            try
            {
                var json = await File.ReadAllTextAsync(file);
                var tasks = JsonSerializer.Deserialize<List<CloseTask>>(json);
                if (tasks != null)
                {
                    foreach (var task in tasks)
                    {
                        _closeTasks.TryAdd(task.Id, task);
                    }
                }
            }
            catch { /* Ignore malformed files */ }
        }
    }

    private async Task LoadFiscalPeriodsAsync()
    {
        var path = Path.Combine(_dataPath, "fiscal_periods");
        if (!Directory.Exists(path)) return;

        foreach (var file in Directory.GetFiles(path, "*.json"))
        {
            try
            {
                var json = await File.ReadAllTextAsync(file);
                var periods = JsonSerializer.Deserialize<List<FiscalPeriod>>(json);
                if (periods != null)
                {
                    foreach (var period in periods)
                    {
                        _fiscalPeriods.TryAdd(period.Id, period);
                    }
                }
            }
            catch { /* Ignore malformed files */ }
        }
    }

    private async Task LoadApprovalsAsync()
    {
        var path = Path.Combine(_dataPath, "approvals");
        if (!Directory.Exists(path)) return;

        foreach (var file in Directory.GetFiles(path, "*.json"))
        {
            try
            {
                var json = await File.ReadAllTextAsync(file);
                var approvals = JsonSerializer.Deserialize<List<Approval>>(json);
                if (approvals != null)
                {
                    foreach (var approval in approvals)
                    {
                        _approvals.TryAdd(approval.Id, approval);
                    }
                }
            }
            catch { /* Ignore malformed files */ }
        }
    }

    #region Journal Entry Operations

    public Task<JournalEntry?> GetJournalEntryAsync(string id)
    {
        _journalEntries.TryGetValue(id, out var entry);
        return Task.FromResult(entry);
    }

    public Task<List<JournalEntry>> QueryJournalEntriesAsync(string? entityCode = null, int? fiscalYear = null,
        int? fiscalPeriod = null, string? status = null, string? entryType = null)
    {
        var query = _journalEntries.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(entityCode))
            query = query.Where(e => e.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase));
        if (fiscalYear.HasValue)
            query = query.Where(e => e.FiscalYear == fiscalYear.Value);
        if (fiscalPeriod.HasValue)
            query = query.Where(e => e.FiscalPeriod == fiscalPeriod.Value);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(e => e.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(entryType))
            query = query.Where(e => e.EntryType.Equals(entryType, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(query.OrderByDescending(e => e.CreatedAt).ToList());
    }

    public Task<JournalEntryResponse> CreateJournalEntryAsync(CreateJournalEntryRequest request)
    {
        var errors = ValidateJournalEntry(request);
        if (errors.Any())
        {
            return Task.FromResult(new JournalEntryResponse
            {
                Success = false,
                Message = "Validation failed",
                ValidationErrors = errors
            });
        }

        var entryNumber = $"JE-{request.EntityCode}-{DateTime.UtcNow:yyyyMM}-{Interlocked.Increment(ref _journalEntryCounter)}";
        var entry = new JournalEntry
        {
            Id = Guid.NewGuid().ToString(),
            EntryNumber = entryNumber,
            EntityCode = request.EntityCode,
            FiscalYear = request.FiscalYear,
            FiscalPeriod = request.FiscalPeriod,
            EntryDate = DateTime.UtcNow,
            EffectiveDate = request.EffectiveDate,
            EntryType = request.EntryType,
            Description = request.Description,
            Lines = request.Lines,
            Status = "DRAFT",
            CreatedBy = request.CreatedBy,
            CreatedAt = DateTime.UtcNow,
            SourceSystem = request.SourceSystem,
            Reference = request.Reference,
            IsReversing = request.IsReversing,
            ReversalDate = request.ReversalDate,
            ProcedureId = request.ProcedureId
        };

        // Assign line numbers
        for (int i = 0; i < entry.Lines.Count; i++)
        {
            entry.Lines[i].LineNumber = i + 1;
        }

        _journalEntries.TryAdd(entry.Id, entry);

        return Task.FromResult(new JournalEntryResponse
        {
            Success = true,
            Message = $"Journal entry {entryNumber} created successfully",
            Entry = entry
        });
    }

    private List<string> ValidateJournalEntry(CreateJournalEntryRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrEmpty(request.EntityCode))
            errors.Add("Entity code is required");
        if (request.Lines.Count == 0)
            errors.Add("At least one line is required");
        if (string.IsNullOrEmpty(request.Description))
            errors.Add("Description is required");
        if (string.IsNullOrEmpty(request.CreatedBy))
            errors.Add("Created by is required");

        var totalDebits = request.Lines.Sum(l => l.DebitAmount);
        var totalCredits = request.Lines.Sum(l => l.CreditAmount);
        if (Math.Abs(totalDebits - totalCredits) >= 0.01m)
            errors.Add($"Journal entry must balance. Debits: {totalDebits}, Credits: {totalCredits}");

        foreach (var line in request.Lines)
        {
            if (string.IsNullOrEmpty(line.AccountNumber))
                errors.Add("Account number is required for all lines");
            if (line.DebitAmount == 0 && line.CreditAmount == 0)
                errors.Add("Each line must have a debit or credit amount");
            if (line.DebitAmount > 0 && line.CreditAmount > 0)
                errors.Add("A line cannot have both debit and credit amounts");
        }

        return errors;
    }

    public Task<JournalEntryResponse> UpdateJournalEntryStatusAsync(string id, string status, string updatedBy)
    {
        if (!_journalEntries.TryGetValue(id, out var entry))
        {
            return Task.FromResult(new JournalEntryResponse
            {
                Success = false,
                Message = $"Journal entry {id} not found"
            });
        }

        var validTransitions = new Dictionary<string, List<string>>
        {
            { "DRAFT", new List<string> { "PENDING_APPROVAL", "CANCELLED" } },
            { "PENDING_APPROVAL", new List<string> { "APPROVED", "DRAFT", "CANCELLED" } },
            { "APPROVED", new List<string> { "POSTED", "DRAFT" } },
            { "POSTED", new List<string> { "REVERSED" } }
        };

        if (!validTransitions.TryGetValue(entry.Status, out var validStatuses) || !validStatuses.Contains(status))
        {
            return Task.FromResult(new JournalEntryResponse
            {
                Success = false,
                Message = $"Invalid status transition from {entry.Status} to {status}"
            });
        }

        entry.Status = status;

        if (status == "APPROVED")
        {
            entry.ApprovedBy = updatedBy;
            entry.ApprovedAt = DateTime.UtcNow;
        }

        return Task.FromResult(new JournalEntryResponse
        {
            Success = true,
            Message = $"Journal entry {entry.EntryNumber} status updated to {status}",
            Entry = entry
        });
    }

    public Task<JournalEntryResponse> PostJournalEntryAsync(string id, string postedBy)
    {
        if (!_journalEntries.TryGetValue(id, out var entry))
        {
            return Task.FromResult(new JournalEntryResponse
            {
                Success = false,
                Message = $"Journal entry {id} not found"
            });
        }

        if (entry.Status != "APPROVED")
        {
            return Task.FromResult(new JournalEntryResponse
            {
                Success = false,
                Message = $"Journal entry must be approved before posting. Current status: {entry.Status}"
            });
        }

        entry.Status = "POSTED";
        entry.PostedBy = postedBy;
        entry.PostedAt = DateTime.UtcNow;

        return Task.FromResult(new JournalEntryResponse
        {
            Success = true,
            Message = $"Journal entry {entry.EntryNumber} posted successfully",
            Entry = entry
        });
    }

    public Task<JournalEntryResponse> ReverseJournalEntryAsync(string id, DateTime reversalDate, string reversedBy)
    {
        if (!_journalEntries.TryGetValue(id, out var entry))
        {
            return Task.FromResult(new JournalEntryResponse
            {
                Success = false,
                Message = $"Journal entry {id} not found"
            });
        }

        if (entry.Status != "POSTED")
        {
            return Task.FromResult(new JournalEntryResponse
            {
                Success = false,
                Message = "Only posted journal entries can be reversed"
            });
        }

        // Create reversing entry
        var reversalEntryNumber = $"JE-REV-{entry.EntityCode}-{DateTime.UtcNow:yyyyMM}-{Interlocked.Increment(ref _journalEntryCounter)}";
        var reversalEntry = new JournalEntry
        {
            Id = Guid.NewGuid().ToString(),
            EntryNumber = reversalEntryNumber,
            EntityCode = entry.EntityCode,
            FiscalYear = reversalDate.Year,
            FiscalPeriod = reversalDate.Month,
            EntryDate = DateTime.UtcNow,
            EffectiveDate = reversalDate,
            EntryType = "REVERSING",
            Description = $"Reversal of {entry.EntryNumber}: {entry.Description}",
            Lines = entry.Lines.Select(l => new JournalEntryLine
            {
                LineNumber = l.LineNumber,
                AccountNumber = l.AccountNumber,
                AccountName = l.AccountName,
                DebitAmount = l.CreditAmount, // Swap debit/credit
                CreditAmount = l.DebitAmount,
                Currency = l.Currency,
                CostCenter = l.CostCenter,
                Department = l.Department,
                Project = l.Project,
                Description = $"Reversal: {l.Description}"
            }).ToList(),
            Status = "POSTED",
            CreatedBy = reversedBy,
            CreatedAt = DateTime.UtcNow,
            PostedBy = reversedBy,
            PostedAt = DateTime.UtcNow,
            SourceSystem = "SYSTEM",
            Reference = entry.EntryNumber,
            ReversedEntryId = entry.Id
        };

        _journalEntries.TryAdd(reversalEntry.Id, reversalEntry);
        entry.Status = "REVERSED";

        return Task.FromResult(new JournalEntryResponse
        {
            Success = true,
            Message = $"Journal entry {entry.EntryNumber} reversed. Reversal entry: {reversalEntryNumber}",
            Entry = reversalEntry
        });
    }

    #endregion

    #region Reconciliation Operations

    public Task<Reconciliation?> GetReconciliationAsync(string id)
    {
        _reconciliations.TryGetValue(id, out var rec);
        return Task.FromResult(rec);
    }

    public Task<List<Reconciliation>> QueryReconciliationsAsync(string? entityCode = null, int? fiscalYear = null,
        int? fiscalPeriod = null, string? status = null, string? reconciliationType = null)
    {
        var query = _reconciliations.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(entityCode))
            query = query.Where(r => r.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase));
        if (fiscalYear.HasValue)
            query = query.Where(r => r.FiscalYear == fiscalYear.Value);
        if (fiscalPeriod.HasValue)
            query = query.Where(r => r.FiscalPeriod == fiscalPeriod.Value);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(reconciliationType))
            query = query.Where(r => r.ReconciliationType.Equals(reconciliationType, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(query.OrderByDescending(r => r.PreparedAt).ToList());
    }

    public Task<ReconciliationResponse> CreateReconciliationAsync(CreateReconciliationRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrEmpty(request.EntityCode))
            errors.Add("Entity code is required");
        if (string.IsNullOrEmpty(request.AccountNumber))
            errors.Add("Account number is required");
        if (string.IsNullOrEmpty(request.PreparedBy))
            errors.Add("Prepared by is required");

        if (errors.Any())
        {
            return Task.FromResult(new ReconciliationResponse
            {
                Success = false,
                Message = "Validation failed",
                ValidationErrors = errors
            });
        }

        var recNumber = $"REC-{request.EntityCode}-{DateTime.UtcNow:yyyyMM}-{Interlocked.Increment(ref _reconciliationCounter)}";
        var rec = new Reconciliation
        {
            Id = Guid.NewGuid().ToString(),
            ReconciliationNumber = recNumber,
            EntityCode = request.EntityCode,
            FiscalYear = request.FiscalYear,
            FiscalPeriod = request.FiscalPeriod,
            ReconciliationType = request.ReconciliationType,
            AccountNumber = request.AccountNumber,
            AccountName = request.AccountName,
            GlBalance = request.GlBalance,
            SubledgerBalance = request.SubledgerBalance,
            ExternalBalance = request.ExternalBalance,
            Variance = request.GlBalance - request.SubledgerBalance,
            Status = "OPEN",
            PreparedBy = request.PreparedBy,
            PreparedAt = DateTime.UtcNow,
            DueDate = request.DueDate,
            ProcedureId = request.ProcedureId
        };

        _reconciliations.TryAdd(rec.Id, rec);

        return Task.FromResult(new ReconciliationResponse
        {
            Success = true,
            Message = $"Reconciliation {recNumber} created successfully",
            Reconciliation = rec
        });
    }

    public Task<ReconciliationResponse> UpdateReconciliationAsync(string id, string? status = null,
        ReconcilingItem? reconcilingItem = null, string? reviewedBy = null, string? approvedBy = null)
    {
        if (!_reconciliations.TryGetValue(id, out var rec))
        {
            return Task.FromResult(new ReconciliationResponse
            {
                Success = false,
                Message = $"Reconciliation {id} not found"
            });
        }

        if (reconcilingItem != null)
        {
            reconcilingItem.Id = Guid.NewGuid().ToString();
            rec.ReconcilingItems.Add(reconcilingItem);
        }

        if (!string.IsNullOrEmpty(status))
            rec.Status = status;

        if (!string.IsNullOrEmpty(reviewedBy))
        {
            rec.ReviewedBy = reviewedBy;
            rec.ReviewedAt = DateTime.UtcNow;
        }

        if (!string.IsNullOrEmpty(approvedBy))
        {
            rec.ApprovedBy = approvedBy;
            rec.ApprovedAt = DateTime.UtcNow;
            rec.Status = "APPROVED";
        }

        return Task.FromResult(new ReconciliationResponse
        {
            Success = true,
            Message = $"Reconciliation {rec.ReconciliationNumber} updated",
            Reconciliation = rec
        });
    }

    #endregion

    #region Close Task Operations

    public Task<CloseTask?> GetCloseTaskAsync(string id)
    {
        _closeTasks.TryGetValue(id, out var task);
        return Task.FromResult(task);
    }

    public Task<List<CloseTask>> QueryCloseTasksAsync(string? entityCode = null, int? fiscalYear = null,
        int? fiscalPeriod = null, string? status = null, string? category = null, string? assignedTo = null)
    {
        var query = _closeTasks.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(entityCode))
            query = query.Where(t => t.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase));
        if (fiscalYear.HasValue)
            query = query.Where(t => t.FiscalYear == fiscalYear.Value);
        if (fiscalPeriod.HasValue)
            query = query.Where(t => t.FiscalPeriod == fiscalPeriod.Value);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(t => t.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(category))
            query = query.Where(t => t.TaskCategory.Equals(category, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(assignedTo))
            query = query.Where(t => t.AssignedTo.Equals(assignedTo, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(query.OrderBy(t => t.SequenceOrder).ToList());
    }

    public Task<CloseTaskResponse> UpdateCloseTaskAsync(string id, UpdateCloseTaskRequest request)
    {
        if (!_closeTasks.TryGetValue(id, out var task))
        {
            return Task.FromResult(new CloseTaskResponse
            {
                Success = false,
                Message = $"Close task {id} not found"
            });
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            var prevStatus = task.Status;
            task.Status = request.Status;

            if (request.Status == "IN_PROGRESS" && task.StartedAt == null)
                task.StartedAt = DateTime.UtcNow;

            if (request.Status == "COMPLETED")
            {
                task.CompletedAt = DateTime.UtcNow;
                task.CompletedBy = request.CompletedBy;
                if (task.StartedAt.HasValue)
                    task.ActualDurationHours = (decimal)(DateTime.UtcNow - task.StartedAt.Value).TotalHours;
            }
        }

        if (!string.IsNullOrEmpty(request.AssignedTo))
            task.AssignedTo = request.AssignedTo;

        if (!string.IsNullOrEmpty(request.Notes))
            task.Notes = request.Notes;

        if (request.BlockingIssue != null)
        {
            request.BlockingIssue.Id = Guid.NewGuid().ToString();
            request.BlockingIssue.ReportedAt = DateTime.UtcNow;
            task.BlockingIssues.Add(request.BlockingIssue);
            task.Status = "BLOCKED";
        }

        if (!string.IsNullOrEmpty(request.JournalEntryId))
            task.JournalEntriesCreated.Add(request.JournalEntryId);

        if (!string.IsNullOrEmpty(request.ReconciliationId))
            task.ReconciliationsCreated.Add(request.ReconciliationId);

        return Task.FromResult(new CloseTaskResponse
        {
            Success = true,
            Message = $"Close task {task.TaskNumber} updated",
            Task = task
        });
    }

    public Task<CloseStatus> GetCloseStatusAsync(string entityCode, int fiscalYear, int fiscalPeriod)
    {
        var tasks = _closeTasks.Values
            .Where(t => t.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase) &&
                       t.FiscalYear == fiscalYear &&
                       t.FiscalPeriod == fiscalPeriod)
            .ToList();

        var status = new CloseStatus
        {
            EntityCode = entityCode,
            FiscalYear = fiscalYear,
            FiscalPeriod = fiscalPeriod,
            TotalTasks = tasks.Count,
            CompletedTasks = tasks.Count(t => t.Status == "COMPLETED"),
            InProgressTasks = tasks.Count(t => t.Status == "IN_PROGRESS"),
            BlockedTasks = tasks.Count(t => t.Status == "BLOCKED"),
            NotStartedTasks = tasks.Count(t => t.Status == "NOT_STARTED"),
            TargetCloseDate = tasks.Any() ? tasks.Max(t => t.DueDate) : DateTime.UtcNow,
            BlockingIssues = tasks.SelectMany(t => t.BlockingIssues.Where(b => b.Status == "OPEN")).ToList()
        };

        if (status.CompletedTasks == status.TotalTasks && status.TotalTasks > 0)
            status.Status = "HARD_CLOSE";
        else if (status.CompletedTasks > 0)
            status.Status = "IN_PROGRESS";
        else
            status.Status = "OPEN";

        return Task.FromResult(status);
    }

    #endregion

    #region Fiscal Period Operations

    public Task<FiscalPeriod?> GetFiscalPeriodAsync(string entityCode, int fiscalYear, int period)
    {
        var fp = _fiscalPeriods.Values.FirstOrDefault(p =>
            p.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase) &&
            p.FiscalYear == fiscalYear &&
            p.Period == period);
        return Task.FromResult(fp);
    }

    public Task<List<FiscalPeriod>> GetFiscalPeriodsAsync(string? entityCode = null, int? fiscalYear = null)
    {
        var query = _fiscalPeriods.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(entityCode))
            query = query.Where(p => p.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase));
        if (fiscalYear.HasValue)
            query = query.Where(p => p.FiscalYear == fiscalYear.Value);

        return Task.FromResult(query.OrderBy(p => p.FiscalYear).ThenBy(p => p.Period).ToList());
    }

    public Task<FiscalPeriodResponse> UpdateFiscalPeriodAsync(string entityCode, int fiscalYear, int period,
        UpdateFiscalPeriodRequest request)
    {
        var fp = _fiscalPeriods.Values.FirstOrDefault(p =>
            p.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase) &&
            p.FiscalYear == fiscalYear &&
            p.Period == period);

        if (fp == null)
        {
            return Task.FromResult(new FiscalPeriodResponse
            {
                Success = false,
                Message = $"Fiscal period {entityCode}/{fiscalYear}/{period} not found"
            });
        }

        if (!string.IsNullOrEmpty(request.Subledger) && !string.IsNullOrEmpty(request.SubledgerStatus))
        {
            fp.SubledgerStatus[request.Subledger] = request.SubledgerStatus;
        }
        else if (!string.IsNullOrEmpty(request.Status))
        {
            fp.Status = request.Status;

            if (request.Status == "SOFT_CLOSE")
                fp.SoftCloseDate = DateTime.UtcNow;
            else if (request.Status == "HARD_CLOSE")
                fp.HardCloseDate = DateTime.UtcNow;
            else if (request.Status == "LOCKED")
            {
                fp.LockedDate = DateTime.UtcNow;
                fp.LockedBy = request.UpdatedBy;
            }
            else if (request.Status == "OPEN" && fp.LockedDate.HasValue)
            {
                fp.ReopenReason = request.Reason;
                fp.LastReopenedAt = DateTime.UtcNow;
                fp.LastReopenedBy = request.UpdatedBy;
            }
        }

        return Task.FromResult(new FiscalPeriodResponse
        {
            Success = true,
            Message = $"Fiscal period {entityCode}/{fiscalYear}/{period} updated",
            Period = fp
        });
    }

    #endregion

    #region Approval Operations

    public Task<Approval?> GetApprovalAsync(string id)
    {
        _approvals.TryGetValue(id, out var approval);
        return Task.FromResult(approval);
    }

    public Task<List<Approval>> QueryApprovalsAsync(string? entityCode = null, string? assignedTo = null,
        string? status = null, string? approvalType = null)
    {
        var query = _approvals.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(entityCode))
            query = query.Where(a => a.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(assignedTo))
            query = query.Where(a => a.AssignedTo.Equals(assignedTo, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(approvalType))
            query = query.Where(a => a.ApprovalType.Equals(approvalType, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(query.OrderByDescending(a => a.RequestedAt).ToList());
    }

    public Task<ApprovalResponse> CreateApprovalAsync(CreateApprovalRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrEmpty(request.ObjectId))
            errors.Add("Object ID is required");
        if (string.IsNullOrEmpty(request.RequestedBy))
            errors.Add("Requested by is required");
        if (string.IsNullOrEmpty(request.AssignedTo))
            errors.Add("Assigned to is required");

        if (errors.Any())
        {
            return Task.FromResult(new ApprovalResponse
            {
                Success = false,
                Message = "Validation failed",
                ValidationErrors = errors
            });
        }

        var approvalNumber = $"APR-{DateTime.UtcNow:yyyyMM}-{Interlocked.Increment(ref _approvalCounter)}";
        var approval = new Approval
        {
            Id = Guid.NewGuid().ToString(),
            ApprovalNumber = approvalNumber,
            EntityCode = request.EntityCode,
            ApprovalType = request.ApprovalType,
            ObjectType = request.ObjectType,
            ObjectId = request.ObjectId,
            ObjectDescription = request.ObjectDescription,
            Amount = request.Amount,
            Currency = request.Currency,
            RequestedBy = request.RequestedBy,
            RequestedAt = DateTime.UtcNow,
            AssignedTo = request.AssignedTo,
            Priority = request.Priority,
            DueDate = request.DueDate,
            Notes = request.Notes,
            History = new List<ApprovalHistoryEntry>
            {
                new ApprovalHistoryEntry
                {
                    Timestamp = DateTime.UtcNow,
                    Action = "CREATED",
                    PerformedBy = request.RequestedBy,
                    NewStatus = "PENDING"
                }
            }
        };

        _approvals.TryAdd(approval.Id, approval);

        return Task.FromResult(new ApprovalResponse
        {
            Success = true,
            Message = $"Approval {approvalNumber} created successfully",
            Approval = approval
        });
    }

    public Task<ApprovalResponse> ProcessApprovalAsync(string id, ProcessApprovalRequest request)
    {
        if (!_approvals.TryGetValue(id, out var approval))
        {
            return Task.FromResult(new ApprovalResponse
            {
                Success = false,
                Message = $"Approval {id} not found"
            });
        }

        if (approval.Status != "PENDING" && approval.Status != "ESCALATED")
        {
            return Task.FromResult(new ApprovalResponse
            {
                Success = false,
                Message = $"Approval is not in a pending state. Current status: {approval.Status}"
            });
        }

        var previousStatus = approval.Status;

        switch (request.Action.ToUpperInvariant())
        {
            case "APPROVE":
                approval.Status = "APPROVED";
                approval.DecidedAt = DateTime.UtcNow;
                approval.DecidedBy = request.DecidedBy;
                approval.DecisionComments = request.Comments;
                break;

            case "REJECT":
                approval.Status = "REJECTED";
                approval.DecidedAt = DateTime.UtcNow;
                approval.DecidedBy = request.DecidedBy;
                approval.DecisionComments = request.Comments;
                break;

            case "ESCALATE":
                approval.Status = "ESCALATED";
                approval.EscalationDate = DateTime.UtcNow;
                approval.EscalationReason = request.Comments;
                approval.ApprovalLevel++;
                break;

            case "REASSIGN":
                if (string.IsNullOrEmpty(request.ReassignTo))
                {
                    return Task.FromResult(new ApprovalResponse
                    {
                        Success = false,
                        Message = "Reassign to is required for reassignment"
                    });
                }
                approval.AssignedTo = request.ReassignTo;
                break;

            default:
                return Task.FromResult(new ApprovalResponse
                {
                    Success = false,
                    Message = $"Unknown action: {request.Action}"
                });
        }

        approval.History.Add(new ApprovalHistoryEntry
        {
            Timestamp = DateTime.UtcNow,
            Action = request.Action.ToUpperInvariant(),
            PerformedBy = request.DecidedBy,
            Comments = request.Comments,
            PreviousStatus = previousStatus,
            NewStatus = approval.Status
        });

        return Task.FromResult(new ApprovalResponse
        {
            Success = true,
            Message = $"Approval {approval.ApprovalNumber} processed: {request.Action}",
            Approval = approval
        });
    }

    #endregion
}
