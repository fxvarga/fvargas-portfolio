using AgentChat.FinanceKnowledge.Models;

namespace AgentChat.FinanceKnowledge.Services;

/// <summary>
/// Interface for the finance knowledge base service.
/// </summary>
public interface IKnowledgeBaseService
{
    /// <summary>
    /// Initialize the knowledge base by loading all embedded resources.
    /// </summary>
    Task InitializeAsync();

    #region Procedures

    /// <summary>
    /// Get a procedure by its ID.
    /// </summary>
    Procedure? GetProcedure(string procedureId);

    /// <summary>
    /// Search procedures by category, subcategory, or keyword.
    /// </summary>
    IEnumerable<Procedure> SearchProcedures(
        string? category = null,
        string? subcategory = null,
        string? keyword = null);

    /// <summary>
    /// Get all procedures.
    /// </summary>
    IEnumerable<Procedure> GetAllProcedures();

    /// <summary>
    /// Get procedures applicable to an entity.
    /// </summary>
    IEnumerable<Procedure> GetProceduresForEntity(string entityCode);

    #endregion

    #region Standards

    /// <summary>
    /// Get an accounting standard by its ID.
    /// </summary>
    AccountingStandard? GetStandard(string standardId);

    /// <summary>
    /// Search accounting standards by keyword.
    /// </summary>
    IEnumerable<AccountingStandard> SearchStandards(string? keyword = null);

    /// <summary>
    /// Get all accounting standards.
    /// </summary>
    IEnumerable<AccountingStandard> GetAllStandards();

    /// <summary>
    /// Get the IFRS equivalent of a US GAAP standard.
    /// </summary>
    AccountingStandard? GetIfrsEquivalent(string usGaapStandardId);

    #endregion

    #region Policies

    /// <summary>
    /// Get a company policy by its ID.
    /// </summary>
    CompanyPolicy? GetPolicy(string policyId);

    /// <summary>
    /// Search company policies by keyword.
    /// </summary>
    IEnumerable<CompanyPolicy> SearchPolicies(string? keyword = null);

    /// <summary>
    /// Get all company policies.
    /// </summary>
    IEnumerable<CompanyPolicy> GetAllPolicies();

    /// <summary>
    /// Get policies applicable to an entity.
    /// </summary>
    IEnumerable<CompanyPolicy> GetPoliciesForEntity(string entityCode);

    /// <summary>
    /// Check if an amount meets the capitalization threshold for an entity.
    /// </summary>
    ThresholdCheckResult CheckCapitalizationThreshold(string entityCode, decimal amount);

    #endregion

    #region Templates

    /// <summary>
    /// Get an Excel template by its ID.
    /// </summary>
    ExcelTemplate? GetTemplate(string templateId);

    /// <summary>
    /// Search Excel templates by category, subcategory, or keyword.
    /// </summary>
    IEnumerable<ExcelTemplate> SearchTemplates(
        string? category = null,
        string? subcategory = null,
        string? keyword = null);

    /// <summary>
    /// Get all Excel templates.
    /// </summary>
    IEnumerable<ExcelTemplate> GetAllTemplates();

    #endregion

    #region Cross-Reference

    /// <summary>
    /// Get treatment recommendation based on standards and policies.
    /// </summary>
    TreatmentRecommendation GetTreatmentRecommendation(
        string transactionType,
        string entityCode,
        decimal amount,
        Dictionary<string, object>? additionalContext = null);

    #endregion
}
