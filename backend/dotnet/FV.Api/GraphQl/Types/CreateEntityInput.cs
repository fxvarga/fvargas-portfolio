public class CreateEntityInput
{
    public string Name { get; set; } = default!;
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public bool IsSingleton { get; set; } = true;
    public string? Category { get; set; }
    public List<AttributeInput> Attributes { get; set; } = new();
    public List<RelationshipInput>? Relationships { get; set; } = new();
}

public class AttributeInput
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = default!;
    public string Type { get; set; } = default!; // string, text, number, boolean, image, array, object, select, reference, richtext
    public bool IsRequired { get; set; }
    public string? Label { get; set; }
    public string? HelpText { get; set; }
    public string? Placeholder { get; set; }
    public string? DefaultValue { get; set; }
    public string? TargetEntity { get; set; }
    public string? Validation { get; set; }
    public List<SelectOptionInput>? Options { get; set; }
    public List<AttributeInput>? Children { get; set; }
    public int Order { get; set; }
}

public class SelectOptionInput
{
    public string Value { get; set; } = default!;
    public string Label { get; set; } = default!;
}

public class RelationshipInput
{
    public string Name { get; set; } = default!;
    public string TargetEntityId { get; set; } = default!;
    public string Type { get; set; } = default!;
}
