using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace AgentChat.FinanceKnowledge.Services;

/// <summary>
/// Parser for converting YAML files to strongly-typed knowledge base models.
/// </summary>
public class YamlParser
{
    private readonly IDeserializer _deserializer;
    private readonly ISerializer _serializer;

    public YamlParser()
    {
        _deserializer = new DeserializerBuilder()
            .WithNamingConvention(UnderscoredNamingConvention.Instance)
            .IgnoreUnmatchedProperties()
            .Build();

        _serializer = new SerializerBuilder()
            .WithNamingConvention(UnderscoredNamingConvention.Instance)
            .Build();
    }

    /// <summary>
    /// Deserialize YAML content to a strongly-typed object.
    /// </summary>
    public T Deserialize<T>(string yamlContent)
    {
        return _deserializer.Deserialize<T>(yamlContent);
    }

    /// <summary>
    /// Deserialize YAML content to a dictionary for flexible access.
    /// </summary>
    public Dictionary<string, object> DeserializeToDictionary(string yamlContent)
    {
        return _deserializer.Deserialize<Dictionary<string, object>>(yamlContent) 
            ?? new Dictionary<string, object>();
    }

    /// <summary>
    /// Serialize an object to YAML format.
    /// </summary>
    public string Serialize<T>(T obj)
    {
        return _serializer.Serialize(obj);
    }

    /// <summary>
    /// Try to deserialize YAML content, returning null on failure.
    /// </summary>
    public T? TryDeserialize<T>(string yamlContent) where T : class
    {
        try
        {
            return _deserializer.Deserialize<T>(yamlContent);
        }
        catch
        {
            return null;
        }
    }
}
