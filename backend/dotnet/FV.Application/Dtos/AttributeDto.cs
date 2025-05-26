namespace FV.Application.Commands.EntityDefinition;

public class AttributeDto
{
    public string Name { get; set; } = default!;
    public string Type { get; set; } = default!;
    public bool IsRequired { get; set; }
    public string? TargetEntity { get; set; }
}
