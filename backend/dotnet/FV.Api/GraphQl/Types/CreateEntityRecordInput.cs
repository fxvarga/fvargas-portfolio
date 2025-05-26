using System.Text.Json;

public class CreateEntityRecordInput
{
    public string EntityType { get; set; } = default!;
    public JsonElement Data { get; set; } // flexible dynamic input

}
