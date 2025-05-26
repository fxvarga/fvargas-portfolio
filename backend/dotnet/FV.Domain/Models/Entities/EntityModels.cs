namespace FV.Domain.Entities;

public class EntityDefinition
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public List<AttributeDefinition> Attributes { get; set; } = new();
    public List<RelationshipDefinition>? Relationships { get; set; } = new();
    public int Version { get; set; } = 1;
}


public class AttributeDefinition
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Type { get; set; } = default!; // string, int, reference, block-array, etc.
    public bool IsRequired { get; set; }
    public string? TargetEntity { get; set; } // for reference type
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
    public int Version { get; set; } = 1;
    public bool IsDraft { get; set; } = true;
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
