namespace AgentChat.FinanceKnowledge.Models;

/// <summary>
/// Represents an Excel template definition for generating accounting workbooks.
/// </summary>
public class ExcelTemplate
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0";
    public string Category { get; set; } = string.Empty;
    public string? Subcategory { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Purpose { get; set; }
    public AppliesTo? AppliesTo { get; set; }
    public List<string> RelatedProcedures { get; set; } = [];
    public List<string> RelatedPolicies { get; set; } = [];
    public List<SheetDefinition> Sheets { get; set; } = [];
    public WorkbookSettings? Settings { get; set; }
    public List<string> Tags { get; set; } = [];
}

public class AppliesTo
{
    public List<string> Entities { get; set; } = [];
    public List<string> BusinessUnits { get; set; } = [];
}

public class SheetDefinition
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SheetType Type { get; set; } = SheetType.Data;
    public List<ColumnDefinition> Columns { get; set; } = [];
    public HeaderSection? Header { get; set; }
    public List<FormulaDefinition> Formulas { get; set; } = [];
    public ConditionalFormattingRule[]? ConditionalFormatting { get; set; }
    public ValidationRule[]? Validations { get; set; }
    public bool Protected { get; set; } = false;
    public string? ProtectionPassword { get; set; }
}

public enum SheetType
{
    Data,
    Summary,
    Instructions,
    Lookup,
    Calculation
}

public class ColumnDefinition
{
    public string Name { get; set; } = string.Empty;
    public string Header { get; set; } = string.Empty;
    public ColumnType Type { get; set; } = ColumnType.Text;
    public string? Format { get; set; }
    public int? Width { get; set; }
    public bool Required { get; set; } = false;
    public string? DefaultValue { get; set; }
    public string? Formula { get; set; }
    public string? Description { get; set; }
    public List<string>? AllowedValues { get; set; }
    public string? ValidationFormula { get; set; }
    public string? LookupSheet { get; set; }
    public string? LookupColumn { get; set; }
}

public enum ColumnType
{
    Text,
    Number,
    Currency,
    Date,
    DateTime,
    Percentage,
    Boolean,
    Formula,
    Dropdown,
    Lookup
}

public class HeaderSection
{
    public List<HeaderField> Fields { get; set; } = [];
    public int StartRow { get; set; } = 1;
}

public class HeaderField
{
    public string Label { get; set; } = string.Empty;
    public string Cell { get; set; } = string.Empty;
    public string? ValueCell { get; set; }
    public string? DefaultValue { get; set; }
    public ColumnType Type { get; set; } = ColumnType.Text;
    public string? Format { get; set; }
    public List<string>? AllowedValues { get; set; }
}

public class FormulaDefinition
{
    public string Name { get; set; } = string.Empty;
    public string Cell { get; set; } = string.Empty;
    public string Formula { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Format { get; set; }
}

public class ConditionalFormattingRule
{
    public string Range { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public FormatStyle? Style { get; set; }
}

public class FormatStyle
{
    public string? BackgroundColor { get; set; }
    public string? FontColor { get; set; }
    public bool Bold { get; set; } = false;
    public bool Italic { get; set; } = false;
}

public class ValidationRule
{
    public string Column { get; set; } = string.Empty;
    public string Rule { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}

public class WorkbookSettings
{
    public string? DefaultFont { get; set; }
    public int? DefaultFontSize { get; set; }
    public bool FreezePanes { get; set; } = true;
    public string? FreezeAt { get; set; }
    public bool ShowGridlines { get; set; } = true;
    public string? Author { get; set; }
    public string? Company { get; set; }
}
