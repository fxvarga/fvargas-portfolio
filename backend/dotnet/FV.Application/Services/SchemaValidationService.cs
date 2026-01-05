using System.Text.Json;
using System.Text.RegularExpressions;
using FV.Domain.Entities;

namespace FV.Application.Services;

/// <summary>
/// Validates entity record data against EntityDefinition schemas
/// </summary>
public class SchemaValidationService
{
    /// <summary>
    /// Validates the provided data against the entity definition schema
    /// </summary>
    /// <param name="definition">The entity definition containing the schema</param>
    /// <param name="data">The JSON data to validate</param>
    /// <returns>A validation result with any errors found</returns>
    public ValidationResult Validate(EntityDefinition definition, JsonElement data)
    {
        var result = new ValidationResult();

        if (definition.Attributes == null || definition.Attributes.Count == 0)
        {
            return result; // No schema to validate against
        }

        foreach (var attribute in definition.Attributes)
        {
            ValidateAttribute(attribute, data, "", result);
        }

        return result;
    }

    private void ValidateAttribute(AttributeDefinition attribute, JsonElement data, string path, ValidationResult result)
    {
        var fieldPath = string.IsNullOrEmpty(path) ? attribute.Name : $"{path}.{attribute.Name}";
        var hasProperty = data.TryGetProperty(attribute.Name, out var value);

        // Check required fields
        if (attribute.IsRequired)
        {
            if (!hasProperty || IsEmpty(value))
            {
                result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} is required");
                return;
            }
        }

        // If no value present and not required, skip further validation
        if (!hasProperty || value.ValueKind == JsonValueKind.Null || value.ValueKind == JsonValueKind.Undefined)
        {
            return;
        }

        // Type-specific validation
        ValidateType(attribute, value, fieldPath, result);

        // Custom validation rules
        if (!string.IsNullOrEmpty(attribute.Validation))
        {
            ValidateCustomRules(attribute, value, fieldPath, result);
        }
    }

    private void ValidateType(AttributeDefinition attribute, JsonElement value, string fieldPath, ValidationResult result)
    {
        switch (attribute.Type.ToLowerInvariant())
        {
            case "string":
            case "text":
            case "richtext":
            case "image":
                if (value.ValueKind != JsonValueKind.String)
                {
                    result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be a string");
                }
                break;

            case "number":
                if (value.ValueKind != JsonValueKind.Number)
                {
                    result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be a number");
                }
                break;

            case "boolean":
                if (value.ValueKind != JsonValueKind.True && value.ValueKind != JsonValueKind.False)
                {
                    result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be a boolean");
                }
                break;

            case "select":
                if (value.ValueKind != JsonValueKind.String)
                {
                    result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be a string");
                }
                else if (attribute.Options != null && attribute.Options.Count > 0)
                {
                    var selectedValue = value.GetString();
                    if (!attribute.Options.Any(o => o.Value == selectedValue))
                    {
                        var validOptions = string.Join(", ", attribute.Options.Select(o => o.Value));
                        result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be one of: {validOptions}");
                    }
                }
                break;

            case "tags":
                if (value.ValueKind != JsonValueKind.Array)
                {
                    result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be an array of strings");
                }
                else
                {
                    foreach (var item in value.EnumerateArray())
                    {
                        if (item.ValueKind != JsonValueKind.String)
                        {
                            result.AddError(fieldPath, $"All items in {attribute.Label ?? attribute.Name} must be strings");
                            break;
                        }
                    }
                }
                break;

            case "array":
                if (value.ValueKind != JsonValueKind.Array)
                {
                    result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be an array");
                }
                else if (attribute.Children != null && attribute.Children.Count > 0)
                {
                    // Validate each array item against child schema
                    int index = 0;
                    foreach (var item in value.EnumerateArray())
                    {
                        var itemPath = $"{fieldPath}[{index}]";

                        if (item.ValueKind == JsonValueKind.Object)
                        {
                            foreach (var childAttr in attribute.Children)
                            {
                                ValidateAttribute(childAttr, item, itemPath, result);
                            }
                        }
                        else if (attribute.Children.Count == 1 && IsSimpleType(attribute.Children[0].Type))
                        {
                            // Simple array (e.g., array of strings)
                            ValidateSimpleArrayItem(attribute.Children[0], item, itemPath, result);
                        }

                        index++;
                    }
                }
                break;

            case "object":
                if (value.ValueKind != JsonValueKind.Object)
                {
                    result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be an object");
                }
                else if (attribute.Children != null && attribute.Children.Count > 0)
                {
                    foreach (var childAttr in attribute.Children)
                    {
                        ValidateAttribute(childAttr, value, fieldPath, result);
                    }
                }
                break;

            case "reference":
                if (value.ValueKind != JsonValueKind.String)
                {
                    result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be a reference ID (string)");
                }
                else
                {
                    var refValue = value.GetString();
                    if (!string.IsNullOrEmpty(refValue) && !Guid.TryParse(refValue, out _))
                    {
                        result.AddError(fieldPath, $"{attribute.Label ?? attribute.Name} must be a valid GUID reference");
                    }
                }
                break;
        }
    }

    private void ValidateSimpleArrayItem(AttributeDefinition childDef, JsonElement item, string itemPath, ValidationResult result)
    {
        var expectedKind = childDef.Type.ToLowerInvariant() switch
        {
            "string" or "text" or "image" => JsonValueKind.String,
            "number" => JsonValueKind.Number,
            "boolean" => JsonValueKind.True, // Will also check False
            _ => JsonValueKind.Undefined
        };

        if (expectedKind == JsonValueKind.True)
        {
            if (item.ValueKind != JsonValueKind.True && item.ValueKind != JsonValueKind.False)
            {
                result.AddError(itemPath, $"Array item must be a boolean");
            }
        }
        else if (expectedKind != JsonValueKind.Undefined && item.ValueKind != expectedKind)
        {
            result.AddError(itemPath, $"Array item must be a {childDef.Type}");
        }
    }

    private void ValidateCustomRules(AttributeDefinition attribute, JsonElement value, string fieldPath, ValidationResult result)
    {
        try
        {
            var rules = JsonSerializer.Deserialize<ValidationRules>(attribute.Validation!);
            if (rules == null) return;

            var label = attribute.Label ?? attribute.Name;

            // String length validation
            if (value.ValueKind == JsonValueKind.String)
            {
                var strValue = value.GetString() ?? "";

                if (rules.MinLength.HasValue && strValue.Length < rules.MinLength.Value)
                {
                    result.AddError(fieldPath, $"{label} must be at least {rules.MinLength} characters");
                }

                if (rules.MaxLength.HasValue && strValue.Length > rules.MaxLength.Value)
                {
                    result.AddError(fieldPath, $"{label} must be at most {rules.MaxLength} characters");
                }

                if (!string.IsNullOrEmpty(rules.Pattern))
                {
                    try
                    {
                        if (!Regex.IsMatch(strValue, rules.Pattern))
                        {
                            result.AddError(fieldPath, rules.PatternMessage ?? $"{label} format is invalid");
                        }
                    }
                    catch (RegexParseException)
                    {
                        // Invalid regex pattern in schema, skip validation
                    }
                }
            }

            // Number validation
            if (value.ValueKind == JsonValueKind.Number)
            {
                var numValue = value.GetDouble();

                if (rules.Min.HasValue && numValue < rules.Min.Value)
                {
                    result.AddError(fieldPath, $"{label} must be at least {rules.Min}");
                }

                if (rules.Max.HasValue && numValue > rules.Max.Value)
                {
                    result.AddError(fieldPath, $"{label} must be at most {rules.Max}");
                }
            }

            // Array length validation
            if (value.ValueKind == JsonValueKind.Array)
            {
                var arrayLength = value.GetArrayLength();

                if (rules.MinItems.HasValue && arrayLength < rules.MinItems.Value)
                {
                    result.AddError(fieldPath, $"{label} must have at least {rules.MinItems} items");
                }

                if (rules.MaxItems.HasValue && arrayLength > rules.MaxItems.Value)
                {
                    result.AddError(fieldPath, $"{label} must have at most {rules.MaxItems} items");
                }
            }
        }
        catch (JsonException)
        {
            // Invalid validation JSON, skip custom validation
        }
    }

    private static bool IsEmpty(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.Null => true,
            JsonValueKind.Undefined => true,
            JsonValueKind.String => string.IsNullOrWhiteSpace(value.GetString()),
            JsonValueKind.Array => value.GetArrayLength() == 0,
            JsonValueKind.Object => !value.EnumerateObject().Any(),
            _ => false
        };
    }

    private static bool IsSimpleType(string type)
    {
        return type.ToLowerInvariant() switch
        {
            "string" or "text" or "number" or "boolean" or "image" => true,
            _ => false
        };
    }
}

/// <summary>
/// Validation rules that can be specified in the Validation field of AttributeDefinition
/// </summary>
public class ValidationRules
{
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public double? Min { get; set; }
    public double? Max { get; set; }
    public string? Pattern { get; set; }
    public string? PatternMessage { get; set; }
    public int? MinItems { get; set; }
    public int? MaxItems { get; set; }
}

/// <summary>
/// Result of schema validation containing any errors found
/// </summary>
public class ValidationResult
{
    public bool IsValid => Errors.Count == 0;
    public List<ValidationError> Errors { get; } = new();

    public void AddError(string field, string message)
    {
        Errors.Add(new ValidationError { Field = field, Message = message });
    }
}

/// <summary>
/// A single validation error
/// </summary>
public class ValidationError
{
    public string Field { get; set; } = default!;
    public string Message { get; set; } = default!;
}
