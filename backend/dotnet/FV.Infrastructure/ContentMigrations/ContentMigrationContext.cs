using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FV.Domain.Entities;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FV.Infrastructure.ContentMigrations;

/// <summary>
/// Context passed to content migrations providing a fluent API for content operations.
/// Inspired by Rails migration DSL and Laravel's Schema facade.
/// </summary>
public class ContentMigrationContext
{
    private readonly CmsDbContext _db;
    private readonly IServiceProvider _serviceProvider;

    public ContentMigrationContext(CmsDbContext db, IServiceProvider serviceProvider)
    {
        _db = db;
        _serviceProvider = serviceProvider;
    }

    #region Well-Known Portfolio IDs

    /// <summary>Fernando Vargas portfolio ID</summary>
    public static readonly Guid FernandoPortfolioId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    /// <summary>Jessica Sutherland portfolio ID</summary>
    public static readonly Guid JessicaPortfolioId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    /// <summary>Busy Bee Web portfolio ID</summary>
    public static readonly Guid BusybeePortfolioId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    #endregion

    #region Deterministic ID Generation (Flyway-inspired)

    /// <summary>
    /// Generates a deterministic GUID based on portfolio, entity type, and slug.
    /// This ensures the same content always gets the same ID, enabling upsert operations.
    /// </summary>
    public static Guid GenerateDeterministicId(Guid portfolioId, string entityType, string slug)
    {
        var input = $"{portfolioId}:{entityType}:{slug}";
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return new Guid(hash);
    }

    /// <summary>
    /// Generates a deterministic GUID for entity definitions.
    /// </summary>
    public static Guid GenerateDefinitionId(Guid portfolioId, string name)
    {
        var input = $"{portfolioId}:definition:{name}";
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return new Guid(hash);
    }

    #endregion

    #region Content Operations (Rails-inspired upsert pattern)

    /// <summary>
    /// Upserts content - creates if not exists, updates if exists.
    /// Uses deterministic ID based on portfolioId + entityType + slug.
    /// </summary>
    public async Task<EntityRecord> UpsertContentAsync<T>(
        Guid portfolioId,
        string entityType,
        string slug,
        T data,
        bool isPublished = true)
    {
        var id = GenerateDeterministicId(portfolioId, entityType, slug);
        var jsonData = JsonSerializer.Serialize(data);

        var existing = await _db.EntityRecords.FindAsync(id);

        if (existing != null)
        {
            existing.JsonData = jsonData;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.Version++;
            existing.IsDraft = !isPublished;
            if (isPublished && existing.PublishedAt == null)
            {
                existing.PublishedAt = DateTime.UtcNow;
            }
        }
        else
        {
            existing = new EntityRecord
            {
                Id = id,
                PortfolioId = portfolioId,
                EntityType = entityType,
                JsonData = jsonData,
                IsDraft = !isPublished,
                PublishedAt = isPublished ? DateTime.UtcNow : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 1
            };
            _db.EntityRecords.Add(existing);
        }

        return existing;
    }

    /// <summary>
    /// Deletes content by portfolio, entity type, and slug.
    /// </summary>
    public async Task<bool> DeleteContentAsync(Guid portfolioId, string entityType, string slug)
    {
        var id = GenerateDeterministicId(portfolioId, entityType, slug);
        var existing = await _db.EntityRecords.FindAsync(id);

        if (existing != null)
        {
            _db.EntityRecords.Remove(existing);
            return true;
        }

        return false;
    }

    /// <summary>
    /// Checks if content exists.
    /// </summary>
    public async Task<bool> ContentExistsAsync(Guid portfolioId, string entityType, string slug)
    {
        var id = GenerateDeterministicId(portfolioId, entityType, slug);
        return await _db.EntityRecords.AnyAsync(e => e.Id == id);
    }

    #endregion

    #region Entity Definition Operations

    /// <summary>
    /// Upserts an entity definition using a fluent builder.
    /// </summary>
    public async Task<EntityDefinition> UpsertEntityDefinitionAsync(
        Guid portfolioId,
        string name,
        Action<EntityDefinitionBuilder> configure)
    {
        var id = GenerateDefinitionId(portfolioId, name);
        var builder = new EntityDefinitionBuilder(name);
        configure(builder);

        var existing = await _db.EntityDefinitions.FindAsync(id);

        if (existing != null)
        {
            builder.ApplyTo(existing);
            existing.UpdatedAt = DateTime.UtcNow;
            existing.Version++;
        }
        else
        {
            existing = builder.Build(id, portfolioId);
            _db.EntityDefinitions.Add(existing);
        }

        return existing;
    }

    /// <summary>
    /// Deletes an entity definition.
    /// </summary>
    public async Task<bool> DeleteEntityDefinitionAsync(Guid portfolioId, string name)
    {
        var id = GenerateDefinitionId(portfolioId, name);
        var existing = await _db.EntityDefinitions.FindAsync(id);

        if (existing != null)
        {
            _db.EntityDefinitions.Remove(existing);
            return true;
        }

        return false;
    }

    #endregion

    #region Portfolio Operations

    /// <summary>
    /// Upserts a portfolio.
    /// </summary>
    public async Task<Portfolio> UpsertPortfolioAsync(
        Guid id,
        string slug,
        Action<PortfolioBuilder> configure)
    {
        var builder = new PortfolioBuilder(slug);
        configure(builder);

        var existing = await _db.Portfolios.FindAsync(id);

        if (existing != null)
        {
            builder.ApplyTo(existing);
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = builder.Build(id);
            _db.Portfolios.Add(existing);
        }

        return existing;
    }

    /// <summary>
    /// Deletes a portfolio and all its content (cascading).
    /// </summary>
    public async Task<bool> DeletePortfolioAsync(Guid id)
    {
        var existing = await _db.Portfolios.FindAsync(id);

        if (existing != null)
        {
            _db.Portfolios.Remove(existing);
            return true;
        }

        return false;
    }

    #endregion

    #region User Operations

    /// <summary>
    /// Ensures admin user exists and is assigned to all portfolios.
    /// </summary>
    public async Task EnsureAdminUserAsync(string username, string passwordHash)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);

        if (user == null)
        {
            user = new CmsUser
            {
                Id = Guid.NewGuid(),
                Username = username,
                PasswordHash = passwordHash,
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        // Assign to all portfolios
        var portfolioIds = await _db.Portfolios.Select(p => p.Id).ToListAsync();
        foreach (var portfolioId in portfolioIds)
        {
            var exists = await _db.UserPortfolios
                .AnyAsync(up => up.UserId == user.Id && up.PortfolioId == portfolioId);

            if (!exists)
            {
                _db.UserPortfolios.Add(new UserPortfolio
                {
                    UserId = user.Id,
                    PortfolioId = portfolioId,
                    Role = PortfolioRoles.Admin,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
    }

    #endregion

    #region Database Access

    /// <summary>
    /// Direct database access for complex operations.
    /// Use sparingly - prefer the fluent API methods.
    /// </summary>
    public CmsDbContext Database => _db;

    /// <summary>
    /// Service provider for resolving additional services.
    /// </summary>
    public IServiceProvider Services => _serviceProvider;

    /// <summary>
    /// Saves all pending changes to the database.
    /// </summary>
    public Task SaveChangesAsync() => _db.SaveChangesAsync();

    #endregion
}

#region Fluent Builders (Laravel/Rails-inspired)

/// <summary>
/// Fluent builder for entity definitions.
/// </summary>
public class EntityDefinitionBuilder
{
    private readonly string _name;
    private string? _displayName;
    private string? _description;
    private string? _icon;
    private string? _category;
    private bool _isSingleton;
    private readonly List<AttributeDefinition> _attributes = new();
    private readonly List<RelationshipDefinition> _relationships = new();

    public EntityDefinitionBuilder(string name)
    {
        _name = name;
    }

    public EntityDefinitionBuilder DisplayName(string displayName)
    {
        _displayName = displayName;
        return this;
    }

    public EntityDefinitionBuilder Description(string description)
    {
        _description = description;
        return this;
    }

    public EntityDefinitionBuilder Icon(string icon)
    {
        _icon = icon;
        return this;
    }

    public EntityDefinitionBuilder Category(string category)
    {
        _category = category;
        return this;
    }

    public EntityDefinitionBuilder IsSingleton(bool isSingleton = true)
    {
        _isSingleton = isSingleton;
        return this;
    }

    public EntityDefinitionBuilder IsCollection()
    {
        _isSingleton = false;
        return this;
    }

    public EntityDefinitionBuilder AddAttribute(Action<AttributeBuilder> configure)
    {
        var builder = new AttributeBuilder();
        configure(builder);
        _attributes.Add(builder.Build(_attributes.Count));
        return this;
    }

    public EntityDefinitionBuilder AddRelationship(string name, string targetEntityId, string type)
    {
        _relationships.Add(new RelationshipDefinition
        {
            Id = Guid.NewGuid(),
            Name = name,
            TargetEntityId = targetEntityId,
            Type = type
        });
        return this;
    }

    public EntityDefinition Build(Guid id, Guid portfolioId)
    {
        return new EntityDefinition
        {
            Id = id,
            PortfolioId = portfolioId,
            Name = _name,
            DisplayName = _displayName ?? _name,
            Description = _description,
            Icon = _icon,
            Category = _category,
            IsSingleton = _isSingleton,
            Attributes = _attributes,
            Relationships = _relationships,
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void ApplyTo(EntityDefinition existing)
    {
        existing.DisplayName = _displayName ?? existing.DisplayName;
        existing.Description = _description ?? existing.Description;
        existing.Icon = _icon ?? existing.Icon;
        existing.Category = _category ?? existing.Category;
        existing.IsSingleton = _isSingleton;
        existing.Attributes = _attributes.Count > 0 ? _attributes : existing.Attributes;
        existing.Relationships = _relationships.Count > 0 ? _relationships : existing.Relationships;
    }
}

/// <summary>
/// Fluent builder for attribute definitions.
/// </summary>
public class AttributeBuilder
{
    private string _name = default!;
    private string _type = "string";
    private bool _isRequired;
    private string? _label;
    private string? _helpText;
    private string? _placeholder;
    private string? _defaultValue;
    private string? _targetEntity;
    private string? _validation;
    private List<SelectOption>? _options;
    private List<AttributeDefinition>? _children;

    public AttributeBuilder Name(string name)
    {
        _name = name;
        return this;
    }

    public AttributeBuilder Type(string type)
    {
        _type = type;
        return this;
    }

    public AttributeBuilder Required(bool required = true)
    {
        _isRequired = required;
        return this;
    }

    public AttributeBuilder Label(string label)
    {
        _label = label;
        return this;
    }

    public AttributeBuilder HelpText(string helpText)
    {
        _helpText = helpText;
        return this;
    }

    public AttributeBuilder Placeholder(string placeholder)
    {
        _placeholder = placeholder;
        return this;
    }

    public AttributeBuilder DefaultValue(string defaultValue)
    {
        _defaultValue = defaultValue;
        return this;
    }

    public AttributeBuilder TargetEntity(string targetEntity)
    {
        _targetEntity = targetEntity;
        return this;
    }

    public AttributeBuilder Validation(string validation)
    {
        _validation = validation;
        return this;
    }

    public AttributeBuilder Options(params (string value, string label)[] options)
    {
        _options = options.Select(o => new SelectOption { Value = o.value, Label = o.label }).ToList();
        return this;
    }

    public AttributeBuilder Children(Action<ChildAttributeBuilder> configure)
    {
        var builder = new ChildAttributeBuilder();
        configure(builder);
        _children = builder.Build();
        return this;
    }

    public AttributeDefinition Build(int order)
    {
        return new AttributeDefinition
        {
            Id = Guid.NewGuid(),
            Name = _name,
            Type = _type,
            IsRequired = _isRequired,
            Label = _label ?? _name,
            HelpText = _helpText,
            Placeholder = _placeholder,
            DefaultValue = _defaultValue,
            TargetEntity = _targetEntity,
            Validation = _validation,
            Options = _options,
            Children = _children,
            Order = order
        };
    }
}

/// <summary>
/// Builder for nested/child attributes.
/// </summary>
public class ChildAttributeBuilder
{
    private readonly List<AttributeDefinition> _attributes = new();

    public ChildAttributeBuilder Add(Action<AttributeBuilder> configure)
    {
        var builder = new AttributeBuilder();
        configure(builder);
        _attributes.Add(builder.Build(_attributes.Count));
        return this;
    }

    public List<AttributeDefinition> Build() => _attributes;
}

/// <summary>
/// Fluent builder for portfolios.
/// </summary>
public class PortfolioBuilder
{
    private readonly string _slug;
    private string _name = default!;
    private string _domain = default!;
    private string? _description;
    private bool _isActive = true;

    public PortfolioBuilder(string slug)
    {
        _slug = slug;
    }

    public PortfolioBuilder Name(string name)
    {
        _name = name;
        return this;
    }

    public PortfolioBuilder Domain(string domain)
    {
        _domain = domain;
        return this;
    }

    public PortfolioBuilder Description(string description)
    {
        _description = description;
        return this;
    }

    public PortfolioBuilder IsActive(bool isActive = true)
    {
        _isActive = isActive;
        return this;
    }

    public Portfolio Build(Guid id)
    {
        return new Portfolio
        {
            Id = id,
            Slug = _slug,
            Name = _name,
            Domain = _domain,
            Description = _description,
            IsActive = _isActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void ApplyTo(Portfolio existing)
    {
        existing.Slug = _slug;
        existing.Name = _name;
        existing.Domain = _domain;
        existing.Description = _description ?? existing.Description;
        existing.IsActive = _isActive;
    }
}

#endregion
