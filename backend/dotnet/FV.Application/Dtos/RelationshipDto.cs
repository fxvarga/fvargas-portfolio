namespace FV.Application.Commands.EntityDefinition;

public class RelationshipDto
{
    public string Name { get; set; } = default!;
    public string TargetEntityId { get; set; } = default!;
    public string Type { get; set; } = default!; // "OneToMany", "ManyToOne"
}
