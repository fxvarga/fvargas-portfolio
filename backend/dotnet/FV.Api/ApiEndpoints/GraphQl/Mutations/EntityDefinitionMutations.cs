using FV.Application.Dtos;
using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FV.Api.ApiEndpoints.GraphQl.Mutations;

[ExtendObjectType(OperationTypeNames.Mutation)]
public class EntityDefinitionMutations
{
    public async Task<Guid> CreateEntityDefinition(
        CreateEntityInput input,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
        {
            throw new InvalidOperationException("Tenant context not resolved");
        }

        var entity = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            Name = input.Name,
            DisplayName = input.DisplayName,
            Description = input.Description,
            Icon = input.Icon,
            IsSingleton = input.IsSingleton,
            Category = input.Category,
            Attributes = MapAttributeInputs(input.Attributes),
            Relationships = input.Relationships?.Select(r => new RelationshipDefinition
            {
                Id = Guid.NewGuid(),
                Name = r.Name,
                TargetEntityId = r.TargetEntityId,
                Type = r.Type
            }).ToList() ?? new List<RelationshipDefinition>(),
            PortfolioId = tenantContext.PortfolioId.Value
        };

        dbContext.EntityDefinitions.Add(entity);
        await dbContext.SaveChangesAsync();
        return entity.Id;
    }

    public async Task<bool> UpdateEntityDefinition(
        UpdateEntityDefinitionInput input,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
        {
            throw new InvalidOperationException("Tenant context not resolved");
        }

        var entity = await dbContext.EntityDefinitions
            .FirstOrDefaultAsync(e => e.Id == input.Id && e.PortfolioId == tenantContext.PortfolioId.Value);

        if (entity == null)
        {
            throw new InvalidOperationException("Entity definition not found");
        }

        entity.Name = input.Name;
        entity.DisplayName = input.DisplayName;
        entity.Description = input.Description;
        entity.Icon = input.Icon;
        entity.IsSingleton = input.IsSingleton ?? entity.IsSingleton;
        entity.Category = input.Category;
        entity.Attributes = input.Attributes != null ? MapAttributeInputs(input.Attributes) : entity.Attributes;

        await dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteEntityDefinition(
        Guid id,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
        {
            throw new InvalidOperationException("Tenant context not resolved");
        }

        var entity = await dbContext.EntityDefinitions
            .FirstOrDefaultAsync(e => e.Id == id && e.PortfolioId == tenantContext.PortfolioId.Value);

        if (entity == null)
        {
            throw new InvalidOperationException("Entity definition not found");
        }

        dbContext.EntityDefinitions.Remove(entity);
        await dbContext.SaveChangesAsync();
        return true;
    }

    private static List<AttributeDefinition> MapAttributeInputs(List<AttributeInput> inputs)
    {
        return inputs.Select((a, index) => new AttributeDefinition
        {
            Id = a.Id ?? Guid.NewGuid(),
            Name = a.Name,
            Type = a.Type,
            IsRequired = a.IsRequired,
            Label = a.Label,
            HelpText = a.HelpText,
            Placeholder = a.Placeholder,
            DefaultValue = a.DefaultValue,
            TargetEntity = a.TargetEntity,
            Validation = a.Validation,
            Options = a.Options?.Select(o => new SelectOption
            {
                Value = o.Value,
                Label = o.Label
            }).ToList(),
            Children = a.Children != null ? MapAttributeInputs(a.Children) : null,
            Order = a.Order > 0 ? a.Order : index
        }).ToList();
    }
}
