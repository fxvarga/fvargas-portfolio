using System.Text.Json;

namespace FV.Application.Dtos;
public class EntityRecordDto
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = default!;
    public JsonElement Data { get; set; } // ← real JSON!
    public DateTime CreatedAt { get; set; }
    public int Version { get; set; }
    public bool IsDraft { get; set; }
}
