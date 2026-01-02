namespace FV.Application.Dtos;

public class AttributeDto
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
    public List<SelectOptionDto>? Options { get; set; }
    public List<AttributeDto>? Children { get; set; }
    public int Order { get; set; }
}

public class SelectOptionDto
{
    public string Value { get; set; } = default!;
    public string Label { get; set; } = default!;
}
