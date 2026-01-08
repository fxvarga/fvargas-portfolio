using AgentChat.FinanceApi.Models;

namespace AgentChat.FinanceApi.Services;

/// <summary>
/// Interface for the Finance System of Record service
/// </summary>
public interface IFinanceService
{
    // Journal Entry operations
    Task<JournalEntry?> GetJournalEntryAsync(string id);
    Task<List<JournalEntry>> QueryJournalEntriesAsync(string? entityCode = null, int? fiscalYear = null, 
        int? fiscalPeriod = null, string? status = null, string? entryType = null);
    Task<JournalEntryResponse> CreateJournalEntryAsync(CreateJournalEntryRequest request);
    Task<JournalEntryResponse> UpdateJournalEntryStatusAsync(string id, string status, string updatedBy);
    Task<JournalEntryResponse> PostJournalEntryAsync(string id, string postedBy);
    Task<JournalEntryResponse> ReverseJournalEntryAsync(string id, DateTime reversalDate, string reversedBy);

    // Reconciliation operations
    Task<Reconciliation?> GetReconciliationAsync(string id);
    Task<List<Reconciliation>> QueryReconciliationsAsync(string? entityCode = null, int? fiscalYear = null,
        int? fiscalPeriod = null, string? status = null, string? reconciliationType = null);
    Task<ReconciliationResponse> CreateReconciliationAsync(CreateReconciliationRequest request);
    Task<ReconciliationResponse> UpdateReconciliationAsync(string id, string? status = null, 
        ReconcilingItem? reconcilingItem = null, string? reviewedBy = null, string? approvedBy = null);

    // Close Task operations
    Task<CloseTask?> GetCloseTaskAsync(string id);
    Task<List<CloseTask>> QueryCloseTasksAsync(string? entityCode = null, int? fiscalYear = null,
        int? fiscalPeriod = null, string? status = null, string? category = null, string? assignedTo = null);
    Task<CloseTaskResponse> UpdateCloseTaskAsync(string id, UpdateCloseTaskRequest request);
    Task<CloseStatus> GetCloseStatusAsync(string entityCode, int fiscalYear, int fiscalPeriod);

    // Fiscal Period operations
    Task<FiscalPeriod?> GetFiscalPeriodAsync(string entityCode, int fiscalYear, int period);
    Task<List<FiscalPeriod>> GetFiscalPeriodsAsync(string? entityCode = null, int? fiscalYear = null);
    Task<FiscalPeriodResponse> UpdateFiscalPeriodAsync(string entityCode, int fiscalYear, int period, 
        UpdateFiscalPeriodRequest request);

    // Approval operations
    Task<Approval?> GetApprovalAsync(string id);
    Task<List<Approval>> QueryApprovalsAsync(string? entityCode = null, string? assignedTo = null,
        string? status = null, string? approvalType = null);
    Task<ApprovalResponse> CreateApprovalAsync(CreateApprovalRequest request);
    Task<ApprovalResponse> ProcessApprovalAsync(string id, ProcessApprovalRequest request);
}
