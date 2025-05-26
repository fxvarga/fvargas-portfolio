public class CreateEntityInput
{
    public string Name { get; set; } = default!;
    public List<AttributeInput> Attributes { get; set; } = new();
    public List<RelationshipInput>? Relationships { get; set; } = new();
}

public class AttributeInput
{
    public string Name { get; set; } = default!;
    public string Type { get; set; } = default!;
    public bool IsRequired { get; set; }
    public string? TargetEntity { get; set; }
}

public class RelationshipInput
{
    public string Name { get; set; } = default!;
    public string TargetEntityId { get; set; } = default!;
    public string Type { get; set; } = default!;
}
