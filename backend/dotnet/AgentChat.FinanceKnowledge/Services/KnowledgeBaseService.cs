using System.Reflection;
using AgentChat.FinanceKnowledge.Models;

namespace AgentChat.FinanceKnowledge.Services;

/// <summary>
/// Service for accessing and querying the finance knowledge base.
/// Loads procedures, standards, and policies from embedded YAML resources.
/// </summary>
public class KnowledgeBaseService : IKnowledgeBaseService
{
    private readonly YamlParser _parser;
    private readonly Dictionary<string, Procedure> _procedures;
    private readonly Dictionary<string, AccountingStandard> _standards;
    private readonly Dictionary<string, CompanyPolicy> _policies;
    private readonly Dictionary<string, ExcelTemplate> _templates;
    private readonly Assembly _assembly;
    private bool _isInitialized;

    public KnowledgeBaseService()
    {
        _parser = new YamlParser();
        _procedures = new Dictionary<string, Procedure>(StringComparer.OrdinalIgnoreCase);
        _standards = new Dictionary<string, AccountingStandard>(StringComparer.OrdinalIgnoreCase);
        _policies = new Dictionary<string, CompanyPolicy>(StringComparer.OrdinalIgnoreCase);
        _templates = new Dictionary<string, ExcelTemplate>(StringComparer.OrdinalIgnoreCase);
        _assembly = Assembly.GetExecutingAssembly();
        _isInitialized = false;
    }

    /// <summary>
    /// Initialize the knowledge base by loading all embedded resources.
    /// </summary>
    public async Task InitializeAsync()
    {
        if (_isInitialized) return;

        await Task.Run(() =>
        {
            LoadProcedures();
            LoadStandards();
            LoadPolicies();
            LoadTemplates();
        });

        _isInitialized = true;
    }

    private void LoadProcedures()
    {
        var procedureResources = _assembly.GetManifestResourceNames()
            .Where(name => name.Contains(".Procedures.") && name.EndsWith(".yaml"));

        foreach (var resourceName in procedureResources)
        {
            try
            {
                using var stream = _assembly.GetManifestResourceStream(resourceName);
                if (stream == null) continue;

                using var reader = new StreamReader(stream);
                var yamlContent = reader.ReadToEnd();
                var procedure = _parser.Deserialize<Procedure>(yamlContent);
                
                if (procedure != null && !string.IsNullOrEmpty(procedure.Id))
                {
                    _procedures[procedure.Id] = procedure;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading procedure {resourceName}: {ex.Message}");
            }
        }
    }

    private void LoadStandards()
    {
        var standardResources = _assembly.GetManifestResourceNames()
            .Where(name => name.Contains(".Standards.") && name.EndsWith(".yaml"));

        foreach (var resourceName in standardResources)
        {
            try
            {
                using var stream = _assembly.GetManifestResourceStream(resourceName);
                if (stream == null) continue;

                using var reader = new StreamReader(stream);
                var yamlContent = reader.ReadToEnd();
                var standard = _parser.Deserialize<AccountingStandard>(yamlContent);
                
                if (standard != null && !string.IsNullOrEmpty(standard.Id))
                {
                    _standards[standard.Id] = standard;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading standard {resourceName}: {ex.Message}");
            }
        }
    }

    private void LoadPolicies()
    {
        var policyResources = _assembly.GetManifestResourceNames()
            .Where(name => name.Contains(".Policies.") && name.EndsWith(".yaml"));

        foreach (var resourceName in policyResources)
        {
            try
            {
                using var stream = _assembly.GetManifestResourceStream(resourceName);
                if (stream == null) continue;

                using var reader = new StreamReader(stream);
                var yamlContent = reader.ReadToEnd();
                var policy = _parser.Deserialize<CompanyPolicy>(yamlContent);
                
                if (policy != null && !string.IsNullOrEmpty(policy.Id))
                {
                    _policies[policy.Id] = policy;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading policy {resourceName}: {ex.Message}");
            }
        }
    }

    private void LoadTemplates()
    {
        var templateResources = _assembly.GetManifestResourceNames()
            .Where(name => name.Contains(".Templates.") && name.EndsWith(".yaml"));

        foreach (var resourceName in templateResources)
        {
            try
            {
                using var stream = _assembly.GetManifestResourceStream(resourceName);
                if (stream == null) continue;

                using var reader = new StreamReader(stream);
                var yamlContent = reader.ReadToEnd();
                var template = _parser.Deserialize<ExcelTemplate>(yamlContent);
                
                if (template != null && !string.IsNullOrEmpty(template.Id))
                {
                    _templates[template.Id] = template;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading template {resourceName}: {ex.Message}");
                Console.WriteLine($"  Inner: {ex.InnerException?.Message}");
                Console.WriteLine($"  Stack: {ex.StackTrace?.Substring(0, Math.Min(ex.StackTrace.Length, 500))}");
            }
        }
    }

    #region Procedure Methods

    /// <summary>
    /// Get a procedure by its ID.
    /// </summary>
    public Procedure? GetProcedure(string procedureId)
    {
        EnsureInitialized();
        return _procedures.TryGetValue(procedureId, out var procedure) ? procedure : null;
    }

    /// <summary>
    /// Search procedures by category, subcategory, or keyword.
    /// </summary>
    public IEnumerable<Procedure> SearchProcedures(
        string? category = null,
        string? subcategory = null,
        string? keyword = null)
    {
        EnsureInitialized();
        
        var query = _procedures.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(p => 
                p.Category?.Equals(category, StringComparison.OrdinalIgnoreCase) == true);
        }

        if (!string.IsNullOrEmpty(subcategory))
        {
            query = query.Where(p => 
                p.Subcategory?.Equals(subcategory, StringComparison.OrdinalIgnoreCase) == true);
        }

        if (!string.IsNullOrEmpty(keyword))
        {
            var lowerKeyword = keyword.ToLowerInvariant();
            query = query.Where(p =>
                (p.Name?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (p.Description?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (p.Id?.ToLowerInvariant().Contains(lowerKeyword) == true));
        }

        return query.ToList();
    }

    /// <summary>
    /// Get all procedures.
    /// </summary>
    public IEnumerable<Procedure> GetAllProcedures()
    {
        EnsureInitialized();
        return _procedures.Values.ToList();
    }

    /// <summary>
    /// Get procedures applicable to an entity.
    /// </summary>
    public IEnumerable<Procedure> GetProceduresForEntity(string entityCode)
    {
        EnsureInitialized();
        
        return _procedures.Values
            .Where(p => p.Scope?.Entities == null || 
                        p.Scope.Entities.Contains("*") ||
                        p.Scope.Entities.Contains(entityCode, StringComparer.OrdinalIgnoreCase))
            .ToList();
    }

    #endregion

    #region Standard Methods

    /// <summary>
    /// Get an accounting standard by its ID.
    /// </summary>
    public AccountingStandard? GetStandard(string standardId)
    {
        EnsureInitialized();
        return _standards.TryGetValue(standardId, out var standard) ? standard : null;
    }

    /// <summary>
    /// Search accounting standards by keyword.
    /// </summary>
    public IEnumerable<AccountingStandard> SearchStandards(string? keyword = null)
    {
        EnsureInitialized();
        
        if (string.IsNullOrEmpty(keyword))
        {
            return _standards.Values.ToList();
        }

        var lowerKeyword = keyword.ToLowerInvariant();
        return _standards.Values
            .Where(s =>
                (s.Name?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (s.Description?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (s.Id?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (s.Codification?.ToLowerInvariant().Contains(lowerKeyword) == true))
            .ToList();
    }

    /// <summary>
    /// Get all accounting standards.
    /// </summary>
    public IEnumerable<AccountingStandard> GetAllStandards()
    {
        EnsureInitialized();
        return _standards.Values.ToList();
    }

    /// <summary>
    /// Get the IFRS equivalent of a US GAAP standard.
    /// </summary>
    public AccountingStandard? GetIfrsEquivalent(string usGaapStandardId)
    {
        EnsureInitialized();
        
        var usGaapStandard = GetStandard(usGaapStandardId);
        if (usGaapStandard?.IfrsEquivalent == null) return null;

        return GetStandard(usGaapStandard.IfrsEquivalent);
    }

    #endregion

    #region Policy Methods

    /// <summary>
    /// Get a company policy by its ID.
    /// </summary>
    public CompanyPolicy? GetPolicy(string policyId)
    {
        EnsureInitialized();
        return _policies.TryGetValue(policyId, out var policy) ? policy : null;
    }

    /// <summary>
    /// Search company policies by keyword.
    /// </summary>
    public IEnumerable<CompanyPolicy> SearchPolicies(string? keyword = null)
    {
        EnsureInitialized();
        
        if (string.IsNullOrEmpty(keyword))
        {
            return _policies.Values.ToList();
        }

        var lowerKeyword = keyword.ToLowerInvariant();
        return _policies.Values
            .Where(p =>
                (p.Name?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (p.Description?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (p.Id?.ToLowerInvariant().Contains(lowerKeyword) == true))
            .ToList();
    }

    /// <summary>
    /// Get all company policies.
    /// </summary>
    public IEnumerable<CompanyPolicy> GetAllPolicies()
    {
        EnsureInitialized();
        return _policies.Values.ToList();
    }

    /// <summary>
    /// Get policies applicable to an entity.
    /// </summary>
    public IEnumerable<CompanyPolicy> GetPoliciesForEntity(string entityCode)
    {
        EnsureInitialized();
        
        return _policies.Values
            .Where(p => p.Scope?.Entities == null || 
                        p.Scope.Entities.Contains("*") ||
                        p.Scope.Entities.Contains(entityCode, StringComparer.OrdinalIgnoreCase))
            .ToList();
    }

    /// <summary>
    /// Check if an amount meets the capitalization threshold for an entity.
    /// </summary>
    public ThresholdCheckResult CheckCapitalizationThreshold(string entityCode, decimal amount)
    {
        var policy = GetPolicy("POL-CAP-001");
        if (policy == null)
        {
            return new ThresholdCheckResult
            {
                MeetsThreshold = amount >= 5000, // Default threshold
                Threshold = 5000,
                Currency = "USD",
                PolicyId = null,
                Message = "Default threshold applied - policy not found"
            };
        }

        // Default threshold from policy
        decimal threshold = 5000;
        string currency = "USD";

        // Check for entity-specific threshold
        if (policy.Thresholds != null)
        {
            var entityThreshold = policy.Thresholds
                .FirstOrDefault(t => t.Entities?.Contains(entityCode, StringComparer.OrdinalIgnoreCase) == true);
            
            if (entityThreshold != null)
            {
                threshold = entityThreshold.Amount;
                currency = entityThreshold.Currency ?? "USD";
            }
        }

        return new ThresholdCheckResult
        {
            MeetsThreshold = amount >= threshold,
            Threshold = threshold,
            Currency = currency,
            PolicyId = policy.Id,
            Message = amount >= threshold 
                ? $"Amount meets capitalization threshold of {threshold:N0} {currency}"
                : $"Amount below capitalization threshold of {threshold:N0} {currency} - expense"
        };
    }

    #endregion

    #region Template Methods

    /// <summary>
    /// Get an Excel template by its ID.
    /// </summary>
    public ExcelTemplate? GetTemplate(string templateId)
    {
        EnsureInitialized();
        return _templates.TryGetValue(templateId, out var template) ? template : null;
    }

    /// <summary>
    /// Search Excel templates by category, subcategory, or keyword.
    /// </summary>
    public IEnumerable<ExcelTemplate> SearchTemplates(
        string? category = null,
        string? subcategory = null,
        string? keyword = null)
    {
        EnsureInitialized();
        
        var query = _templates.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(t => 
                t.Category?.Equals(category, StringComparison.OrdinalIgnoreCase) == true);
        }

        if (!string.IsNullOrEmpty(subcategory))
        {
            query = query.Where(t => 
                t.Subcategory?.Equals(subcategory, StringComparison.OrdinalIgnoreCase) == true);
        }

        if (!string.IsNullOrEmpty(keyword))
        {
            var lowerKeyword = keyword.ToLowerInvariant();
            query = query.Where(t =>
                (t.Name?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (t.Description?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (t.Id?.ToLowerInvariant().Contains(lowerKeyword) == true) ||
                (t.Tags?.Any(tag => tag.ToLowerInvariant().Contains(lowerKeyword)) == true));
        }

        return query.ToList();
    }

    /// <summary>
    /// Get all Excel templates.
    /// </summary>
    public IEnumerable<ExcelTemplate> GetAllTemplates()
    {
        EnsureInitialized();
        return _templates.Values.ToList();
    }

    #endregion

    #region Cross-Reference Methods

    /// <summary>
    /// Get treatment recommendation based on standards and policies.
    /// </summary>
    public TreatmentRecommendation GetTreatmentRecommendation(
        string transactionType,
        string entityCode,
        decimal amount,
        Dictionary<string, object>? additionalContext = null)
    {
        EnsureInitialized();

        var recommendation = new TreatmentRecommendation
        {
            TransactionType = transactionType,
            EntityCode = entityCode,
            Amount = amount,
            Timestamp = DateTime.UtcNow
        };

        // Find relevant procedures
        recommendation.ApplicableProcedures = SearchProcedures(keyword: transactionType)
            .Where(p => p.Scope?.Entities == null || 
                        p.Scope.Entities.Contains("*") ||
                        p.Scope.Entities.Contains(entityCode))
            .Select(p => p.Id ?? "")
            .Where(id => !string.IsNullOrEmpty(id))
            .ToList();

        // Find relevant standards
        recommendation.ApplicableStandards = SearchStandards(keyword: transactionType)
            .Select(s => s.Id ?? "")
            .Where(id => !string.IsNullOrEmpty(id))
            .ToList();

        // Find relevant policies
        recommendation.ApplicablePolicies = SearchPolicies(keyword: transactionType)
            .Where(p => p.Scope?.Entities == null || 
                        p.Scope.Entities.Contains("*") ||
                        p.Scope.Entities.Contains(entityCode))
            .Select(p => p.Id ?? "")
            .Where(id => !string.IsNullOrEmpty(id))
            .ToList();

        // Set confidence based on matches found
        var totalMatches = recommendation.ApplicableProcedures.Count + 
                          recommendation.ApplicableStandards.Count + 
                          recommendation.ApplicablePolicies.Count;

        recommendation.Confidence = totalMatches switch
        {
            0 => ConfidenceLevel.Low,
            1 or 2 => ConfidenceLevel.Medium,
            _ => ConfidenceLevel.High
        };

        recommendation.RequiresManualReview = recommendation.Confidence != ConfidenceLevel.High;

        return recommendation;
    }

    #endregion

    private void EnsureInitialized()
    {
        if (!_isInitialized)
        {
            throw new InvalidOperationException(
                "KnowledgeBaseService must be initialized before use. Call InitializeAsync() first.");
        }
    }
}

/// <summary>
/// Result of a threshold check against company policy.
/// </summary>
public class ThresholdCheckResult
{
    public bool MeetsThreshold { get; set; }
    public decimal Threshold { get; set; }
    public string Currency { get; set; } = "USD";
    public string? PolicyId { get; set; }
    public string? Message { get; set; }
}
