using System.Text.Json;
using AgentChat.FinanceKnowledge.Models;
using AgentChat.FinanceKnowledge.Services;
using AgentChat.Shared.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace AgentChat.ApiBff.Endpoints;

public static class KnowledgeEndpoints
{
    public static void MapKnowledgeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/knowledge")
            .RequireAuthorization();

        group.MapGet("", ListKnowledgeItems);
        group.MapGet("metadata", GetMetadata);
        group.MapGet("{type}/{id}", GetKnowledgeItem);
    }

    /// <summary>
    /// List knowledge items with optional filtering
    /// </summary>
    private static IResult ListKnowledgeItems(
        [FromServices] IKnowledgeBaseService knowledgeService,
        [FromQuery] KnowledgeItemType? type = null,
        [FromQuery] string? category = null,
        [FromQuery] string? subcategory = null,
        [FromQuery] string? keyword = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        var items = new List<KnowledgeItemSummaryDto>();

        // Get items based on type filter (or all if no type specified)
        if (type == null || type == KnowledgeItemType.Procedure)
        {
            var procedures = knowledgeService.SearchProcedures(category, subcategory, keyword);
            items.AddRange(procedures.Select(MapProcedureToSummary));
        }

        if (type == null || type == KnowledgeItemType.Policy)
        {
            var policies = knowledgeService.SearchPolicies(keyword);
            items.AddRange(policies.Select(MapPolicyToSummary));
        }

        if (type == null || type == KnowledgeItemType.Standard)
        {
            var standards = knowledgeService.SearchStandards(keyword);
            items.AddRange(standards.Select(MapStandardToSummary));
        }

        if (type == null || type == KnowledgeItemType.Template)
        {
            var templates = knowledgeService.SearchTemplates(category, subcategory, keyword);
            items.AddRange(templates.Select(MapTemplateToSummary));
        }

        var totalCount = items.Count;
        var paginatedItems = items.Skip(skip).Take(take).ToList();

        return Results.Ok(new KnowledgeSearchResponse
        {
            Items = paginatedItems,
            TotalCount = totalCount,
            Skip = skip,
            Take = take
        });
    }

    /// <summary>
    /// Get metadata for filtering (categories, tags, counts)
    /// </summary>
    private static IResult GetMetadata(
        [FromServices] IKnowledgeBaseService knowledgeService)
    {
        var procedures = knowledgeService.GetAllProcedures().ToList();
        var policies = knowledgeService.GetAllPolicies().ToList();
        var standards = knowledgeService.GetAllStandards().ToList();
        var templates = knowledgeService.GetAllTemplates().ToList();

        var categories = procedures
            .Select(p => p.Category)
            .Concat(templates.Select(t => t.Category))
            .Where(c => !string.IsNullOrEmpty(c))
            .Distinct()
            .OrderBy(c => c)
            .Cast<string>()
            .ToList();

        var subcategories = procedures
            .Select(p => p.Subcategory)
            .Concat(templates.Select(t => t.Subcategory))
            .Where(s => !string.IsNullOrEmpty(s))
            .Distinct()
            .OrderBy(s => s)
            .Cast<string>()
            .ToList();

        var tags = procedures.SelectMany(p => p.Tags ?? [])
            .Concat(policies.SelectMany(p => p.Tags ?? []))
            .Concat(standards.SelectMany(s => s.Tags ?? []))
            .Concat(templates.SelectMany(t => t.Tags ?? []))
            .Distinct()
            .OrderBy(t => t)
            .ToList();

        return Results.Ok(new KnowledgeMetadataDto
        {
            Categories = categories,
            Subcategories = subcategories,
            Tags = tags,
            TypeCounts = new Dictionary<KnowledgeItemType, int>
            {
                [KnowledgeItemType.Procedure] = procedures.Count,
                [KnowledgeItemType.Policy] = policies.Count,
                [KnowledgeItemType.Standard] = standards.Count,
                [KnowledgeItemType.Template] = templates.Count
            }
        });
    }

    /// <summary>
    /// Get a single knowledge item by type and ID
    /// </summary>
    private static IResult GetKnowledgeItem(
        [FromServices] IKnowledgeBaseService knowledgeService,
        KnowledgeItemType type,
        string id)
    {
        return type switch
        {
            KnowledgeItemType.Procedure => GetProcedureItem(knowledgeService, id),
            KnowledgeItemType.Policy => GetPolicyItem(knowledgeService, id),
            KnowledgeItemType.Standard => GetStandardItem(knowledgeService, id),
            KnowledgeItemType.Template => GetTemplateItem(knowledgeService, id),
            _ => Results.BadRequest("Invalid knowledge item type")
        };
    }

    private static IResult GetProcedureItem(IKnowledgeBaseService knowledgeService, string id)
    {
        var procedure = knowledgeService.GetProcedure(id);
        if (procedure == null)
            return Results.NotFound();

        return Results.Ok(MapProcedureToDto(procedure));
    }

    private static IResult GetPolicyItem(IKnowledgeBaseService knowledgeService, string id)
    {
        var policy = knowledgeService.GetPolicy(id);
        if (policy == null)
            return Results.NotFound();

        return Results.Ok(MapPolicyToDto(policy));
    }

    private static IResult GetStandardItem(IKnowledgeBaseService knowledgeService, string id)
    {
        var standard = knowledgeService.GetStandard(id);
        if (standard == null)
            return Results.NotFound();

        return Results.Ok(MapStandardToDto(standard));
    }

    private static IResult GetTemplateItem(IKnowledgeBaseService knowledgeService, string id)
    {
        var template = knowledgeService.GetTemplate(id);
        if (template == null)
            return Results.NotFound();

        return Results.Ok(MapTemplateToDto(template));
    }

    #region Mapping helpers

    private static KnowledgeItemSummaryDto MapProcedureToSummary(Procedure p) => new()
    {
        Id = p.Id ?? string.Empty,
        Type = KnowledgeItemType.Procedure,
        Name = p.Name ?? string.Empty,
        Description = p.Description,
        Category = p.Category,
        Subcategory = p.Subcategory,
        Tags = p.Tags ?? []
    };

    private static KnowledgeItemSummaryDto MapPolicyToSummary(CompanyPolicy p) => new()
    {
        Id = p.Id ?? string.Empty,
        Type = KnowledgeItemType.Policy,
        Name = p.Name ?? string.Empty,
        Description = p.Description,
        Category = null, // Policies don't have categories
        Subcategory = null,
        Tags = p.Tags ?? []
    };

    private static KnowledgeItemSummaryDto MapStandardToSummary(AccountingStandard s) => new()
    {
        Id = s.Id ?? string.Empty,
        Type = KnowledgeItemType.Standard,
        Name = s.Name ?? string.Empty,
        Description = s.Description,
        Category = null, // Standards don't have categories
        Subcategory = null,
        Tags = s.Tags ?? []
    };

    private static KnowledgeItemSummaryDto MapTemplateToSummary(ExcelTemplate t) => new()
    {
        Id = t.Id ?? string.Empty,
        Type = KnowledgeItemType.Template,
        Name = t.Name ?? string.Empty,
        Description = t.Description,
        Category = t.Category,
        Subcategory = t.Subcategory,
        Tags = t.Tags ?? []
    };

    private static KnowledgeItemDto MapProcedureToDto(Procedure p) => new()
    {
        Id = p.Id ?? string.Empty,
        Type = KnowledgeItemType.Procedure,
        Name = p.Name ?? string.Empty,
        Description = p.Description,
        Version = p.Version,
        Category = p.Category,
        Subcategory = p.Subcategory,
        Tags = p.Tags ?? [],
        StepCount = p.Steps?.Count,
        Content = JsonSerializer.SerializeToElement(p)
    };

    private static KnowledgeItemDto MapPolicyToDto(CompanyPolicy p) => new()
    {
        Id = p.Id ?? string.Empty,
        Type = KnowledgeItemType.Policy,
        Name = p.Name ?? string.Empty,
        Description = p.Description,
        Version = p.Version,
        Owner = p.Owner,
        EffectiveDate = p.EffectiveDate,
        Tags = p.Tags ?? [],
        Content = JsonSerializer.SerializeToElement(p)
    };

    private static KnowledgeItemDto MapStandardToDto(AccountingStandard s) => new()
    {
        Id = s.Id ?? string.Empty,
        Type = KnowledgeItemType.Standard,
        Name = s.Name ?? string.Empty,
        Description = s.Description,
        Codification = s.Codification,
        EffectiveDate = s.EffectiveDate,
        Tags = s.Tags ?? [],
        Content = JsonSerializer.SerializeToElement(s)
    };

    private static KnowledgeItemDto MapTemplateToDto(ExcelTemplate t) => new()
    {
        Id = t.Id ?? string.Empty,
        Type = KnowledgeItemType.Template,
        Name = t.Name ?? string.Empty,
        Description = t.Description,
        Version = t.Version,
        Category = t.Category,
        Subcategory = t.Subcategory,
        Tags = t.Tags ?? [],
        Content = JsonSerializer.SerializeToElement(t)
    };

    #endregion
}
