public class UpdateEntityDefinitionInput
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public bool? IsSingleton { get; set; }
    public string? Category { get; set; }
    public List<AttributeInput>? Attributes { get; set; }
}
