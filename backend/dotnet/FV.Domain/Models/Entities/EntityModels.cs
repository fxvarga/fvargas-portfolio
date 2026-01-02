namespace FV.Domain.Entities;

public class EntityDefinition
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public bool IsSingleton { get; set; } = true; // Single record vs collection
    public string? Category { get; set; } // For grouping in admin nav
    public List<AttributeDefinition> Attributes { get; set; } = new();
    public List<RelationshipDefinition>? Relationships { get; set; } = new();
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}


public class AttributeDefinition
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Type { get; set; } = default!; // string, text, number, boolean, image, array, object, select, reference, richtext
    public bool IsRequired { get; set; }
    public string? Label { get; set; } // Display label for UI
    public string? HelpText { get; set; } // Help text shown below field
    public string? Placeholder { get; set; } // Input placeholder
    public string? DefaultValue { get; set; } // Default value as JSON string
    public string? TargetEntity { get; set; } // For reference type
    public string? Validation { get; set; } // JSON validation rules (min, max, pattern, etc.)
    public List<SelectOption>? Options { get; set; } // For select/enum types
    public List<AttributeDefinition>? Children { get; set; } // For nested object/array types
    public int Order { get; set; } // Display order in form
}

public class SelectOption
{
    public string Value { get; set; } = default!;
    public string Label { get; set; } = default!;
}

public class RelationshipDefinition
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string TargetEntityId { get; set; } = default!;
    public string Type { get; set; } = default!; // OneToMany, ManyToOne
}

public class EntityRecord
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = default!;
    public string JsonData { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public bool IsDraft { get; set; } = true;
    public DateTime? PublishedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

// Stores historical versions of entity records
public class EntityRecordVersion
{
    public Guid Id { get; set; }
    public Guid EntityRecordId { get; set; }
    public string EntityType { get; set; } = default!;
    public string JsonData { get; set; } = default!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
}


public class ContentBlock
{
    public string Layout { get; set; } = default!;
    public Dictionary<string, object?> Content { get; set; } = new();
}


public class LayoutDefinition
{
    public string Layout { get; set; } = default!;
    public string DisplayName { get; set; } = default!;
    public List<AttributeDefinition> Fields { get; set; } = new();
}

// Media asset for local file storage
public class MediaAsset
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = default!;
    public string FilePath { get; set; } = default!;
    public string MimeType { get; set; } = default!;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? UploadedBy { get; set; }
    public string? AltText { get; set; }
}
