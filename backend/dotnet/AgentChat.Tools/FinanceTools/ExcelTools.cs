using System.Text.Json;
using AgentChat.FinanceKnowledge.Models;
using AgentChat.FinanceKnowledge.Services;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using ClosedXML.Excel;

namespace AgentChat.Tools.FinanceTools;

/// <summary>
/// Tool to search available Excel templates in the knowledge base.
/// </summary>
public class ExcelTemplateSearchTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public ExcelTemplateSearchTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "excel_template_search",
        Description = "Search for available Excel templates for accounting operations. " +
                      "Returns matching templates that can be generated with excel_template_generate. " +
                      "Use this to find templates for journal entries, reconciliations, close checklists, and analysis workpapers.",
        Category = "excel",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Template category: journal_entry, reconciliation, close, analysis",
                    "enum": ["journal_entry", "reconciliation", "close", "analysis"]
                },
                "keyword": {
                    "type": "string",
                    "description": "Search keyword to find templates (e.g., 'bank', 'warranty', 'intercompany')"
                }
            }
        }
        """).RootElement,
        Tags = ["excel", "template", "search", "read-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            await _knowledgeBase.InitializeAsync();

            string? category = args.TryGetProperty("category", out var cat) ? cat.GetString() : null;
            string? keyword = args.TryGetProperty("keyword", out var kw) ? kw.GetString() : null;

            var templates = _knowledgeBase.SearchTemplates(category: category, keyword: keyword);

            var result = JsonSerializer.SerializeToElement(new
            {
                success = true,
                count = templates.Count(),
                templates = templates.Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    category = t.Category,
                    subcategory = t.Subcategory,
                    description = t.Description,
                    sheets = t.Sheets.Select(s => s.Name).ToList(),
                    tags = t.Tags,
                    related_procedures = t.RelatedProcedures
                })
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            var errorResult = JsonSerializer.SerializeToElement(new { success = false, error = ex.Message });
            return ToolExecutionResult.Ok(errorResult, DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Tool to generate an Excel workbook from a template with optional data population.
/// Returns base64-encoded Excel file.
/// </summary>
public class ExcelTemplateGenerateTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public ExcelTemplateGenerateTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "excel_template_generate",
        Description = "Generate an Excel workbook from a template. " +
                      "Optionally populate with header data and line items. " +
                      "Returns a base64-encoded Excel file that can be downloaded. " +
                      "Use excel_template_search first to find available templates.",
        Category = "excel",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "template_id": {
                    "type": "string",
                    "description": "Template ID from excel_template_search (e.g., 'tmpl-journal-entry-support')"
                },
                "file_name": {
                    "type": "string",
                    "description": "Name for the generated file (without extension)"
                },
                "header_data": {
                    "type": "object",
                    "description": "Key-value pairs to populate header fields (e.g., {'entity_code': 'US01', 'fiscal_year': 2024})"
                },
                "line_items": {
                    "type": "array",
                    "description": "Array of objects to populate data rows in the primary data sheet",
                    "items": {
                        "type": "object"
                    }
                }
            },
            "required": ["template_id"]
        }
        """).RootElement,
        Tags = ["excel", "template", "generate", "export"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            await _knowledgeBase.InitializeAsync();

            var templateId = args.GetProperty("template_id").GetString();
            if (string.IsNullOrEmpty(templateId))
            {
                return CreateErrorResult("template_id is required", DateTime.UtcNow - startTime);
            }

            var template = _knowledgeBase.GetTemplate(templateId);
            if (template == null)
            {
                return CreateErrorResult($"Template not found: {templateId}", DateTime.UtcNow - startTime);
            }

            var fileName = args.TryGetProperty("file_name", out var fn) 
                ? fn.GetString() ?? template.Name 
                : template.Name;

            // Parse optional data
            Dictionary<string, object>? headerData = null;
            if (args.TryGetProperty("header_data", out var hd) && hd.ValueKind == JsonValueKind.Object)
            {
                headerData = JsonSerializer.Deserialize<Dictionary<string, object>>(hd.GetRawText());
            }

            List<Dictionary<string, object>>? lineItems = null;
            if (args.TryGetProperty("line_items", out var li) && li.ValueKind == JsonValueKind.Array)
            {
                lineItems = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(li.GetRawText());
            }

            // Generate the Excel workbook
            using var workbook = GenerateWorkbook(template, headerData, lineItems);

            // Convert to base64
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var base64Content = Convert.ToBase64String(stream.ToArray());

            var result = JsonSerializer.SerializeToElement(new
            {
                success = true,
                file_name = $"{fileName}.xlsx",
                template_id = templateId,
                template_name = template.Name,
                sheets_created = template.Sheets.Select(s => s.Name).ToList(),
                file_size_bytes = stream.Length,
                content_base64 = base64Content,
                mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }

    private XLWorkbook GenerateWorkbook(
        ExcelTemplate template,
        Dictionary<string, object>? headerData,
        List<Dictionary<string, object>>? lineItems)
    {
        var workbook = new XLWorkbook();

        // Set workbook properties
        if (template.Settings != null)
        {
            workbook.Properties.Author = template.Settings.Author ?? "Finance AI Assistant";
            workbook.Properties.Company = template.Settings.Company ?? "";
        }

        foreach (var sheetDef in template.Sheets)
        {
            var worksheet = workbook.Worksheets.Add(sheetDef.Name);

            // Apply header section if defined
            if (sheetDef.Header != null)
            {
                ApplyHeaderSection(worksheet, sheetDef.Header, headerData);
            }

            // Apply columns for data sheets
            if (sheetDef.Columns.Count > 0)
            {
                var startRow = sheetDef.Header?.StartRow ?? 1;
                var headerRow = startRow + (sheetDef.Header?.Fields.Count ?? 0) + 1;

                ApplyColumnHeaders(worksheet, sheetDef.Columns, headerRow);

                // Populate line items if this is the primary data sheet and we have data
                if (lineItems != null && lineItems.Count > 0 && sheetDef.Type == SheetType.Data)
                {
                    PopulateDataRows(worksheet, sheetDef.Columns, lineItems, headerRow + 1);
                }

                // Apply column widths
                ApplyColumnWidths(worksheet, sheetDef.Columns);
            }

            // Apply formulas
            foreach (var formula in sheetDef.Formulas)
            {
                try
                {
                    worksheet.Cell(formula.Cell).FormulaA1 = formula.Formula;
                    if (!string.IsNullOrEmpty(formula.Format))
                    {
                        worksheet.Cell(formula.Cell).Style.NumberFormat.Format = formula.Format;
                    }
                }
                catch
                {
                    // Skip invalid formulas
                }
            }

            // Freeze panes if configured
            if (template.Settings?.FreezePanes == true && !string.IsNullOrEmpty(template.Settings.FreezeAt))
            {
                try
                {
                    var freezeCell = worksheet.Cell(template.Settings.FreezeAt);
                    worksheet.SheetView.FreezeRows(freezeCell.Address.RowNumber - 1);
                }
                catch
                {
                    // Skip if freeze configuration is invalid
                }
            }

            // Protect sheet if configured
            if (sheetDef.Protected)
            {
                worksheet.Protect(sheetDef.ProtectionPassword ?? "");
            }
        }

        return workbook;
    }

    private void ApplyHeaderSection(
        IXLWorksheet worksheet,
        HeaderSection header,
        Dictionary<string, object>? headerData)
    {
        foreach (var field in header.Fields)
        {
            // Set label
            worksheet.Cell(field.Cell).Value = field.Label;
            worksheet.Cell(field.Cell).Style.Font.Bold = true;

            // Set value if value cell is defined
            if (!string.IsNullOrEmpty(field.ValueCell))
            {
                object? value = null;

                // Try to get value from header data
                if (headerData != null)
                {
                    var fieldKey = field.Label.TrimEnd(':').Replace(" ", "_").ToLowerInvariant();
                    if (headerData.TryGetValue(fieldKey, out var dataValue))
                    {
                        value = dataValue;
                    }
                }

                // Use default value if no data provided
                if (value == null && !string.IsNullOrEmpty(field.DefaultValue))
                {
                    value = field.DefaultValue;
                }

                if (value != null)
                {
                    var cell = worksheet.Cell(field.ValueCell);
                    SetCellValue(cell, value, field.Type);

                    if (!string.IsNullOrEmpty(field.Format))
                    {
                        cell.Style.NumberFormat.Format = field.Format;
                    }
                }
            }
        }
    }

    private void ApplyColumnHeaders(
        IXLWorksheet worksheet,
        List<ColumnDefinition> columns,
        int headerRow)
    {
        var col = 1;
        foreach (var column in columns)
        {
            var cell = worksheet.Cell(headerRow, col);
            cell.Value = column.Header;
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#E7E7E7");
            cell.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
            col++;
        }
    }

    private void PopulateDataRows(
        IXLWorksheet worksheet,
        List<ColumnDefinition> columns,
        List<Dictionary<string, object>> lineItems,
        int startRow)
    {
        var row = startRow;
        foreach (var item in lineItems)
        {
            var col = 1;
            foreach (var column in columns)
            {
                if (item.TryGetValue(column.Name, out var value) && value != null)
                {
                    var cell = worksheet.Cell(row, col);
                    SetCellValue(cell, value, column.Type);

                    if (!string.IsNullOrEmpty(column.Format))
                    {
                        cell.Style.NumberFormat.Format = column.Format;
                    }
                }
                col++;
            }
            row++;
        }
    }

    private void ApplyColumnWidths(IXLWorksheet worksheet, List<ColumnDefinition> columns)
    {
        var col = 1;
        foreach (var column in columns)
        {
            if (column.Width.HasValue)
            {
                worksheet.Column(col).Width = column.Width.Value;
            }
            else
            {
                worksheet.Column(col).AdjustToContents();
            }
            col++;
        }
    }

    private void SetCellValue(IXLCell cell, object value, ColumnType type)
    {
        switch (type)
        {
            case ColumnType.Number:
            case ColumnType.Currency:
            case ColumnType.Percentage:
                if (decimal.TryParse(value.ToString(), out var numValue))
                {
                    cell.Value = numValue;
                }
                else
                {
                    cell.Value = value.ToString();
                }
                break;

            case ColumnType.Date:
            case ColumnType.DateTime:
                if (DateTime.TryParse(value.ToString(), out var dateValue))
                {
                    cell.Value = dateValue;
                }
                else
                {
                    cell.Value = value.ToString();
                }
                break;

            case ColumnType.Boolean:
                if (bool.TryParse(value.ToString(), out var boolValue))
                {
                    cell.Value = boolValue ? "Yes" : "No";
                }
                else
                {
                    cell.Value = value.ToString();
                }
                break;

            default:
                cell.Value = value.ToString();
                break;
        }
    }

    private static ToolExecutionResult CreateErrorResult(string message, TimeSpan duration)
    {
        var errorResult = JsonSerializer.SerializeToElement(new { success = false, error = message });
        return ToolExecutionResult.Ok(errorResult, duration);
    }
}

/// <summary>
/// Tool to create a custom Excel support document with user-specified data.
/// More flexible than template generation for ad-hoc documents.
/// </summary>
public class ExcelSupportDocCreateTool : ITool
{
    public ToolDefinition Definition => new()
    {
        Name = "excel_support_doc_create",
        Description = "Create a custom Excel support document with specified sheets, columns, and data. " +
                      "Use this for ad-hoc support documentation that doesn't fit a standard template. " +
                      "Returns a base64-encoded Excel file.",
        Category = "excel",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "file_name": {
                    "type": "string",
                    "description": "Name for the generated file (without extension)"
                },
                "title": {
                    "type": "string",
                    "description": "Document title to display in the workbook"
                },
                "sheets": {
                    "type": "array",
                    "description": "Array of sheet definitions",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string", "description": "Sheet name" },
                            "headers": { 
                                "type": "array", 
                                "items": { "type": "string" },
                                "description": "Column headers" 
                            },
                            "data": {
                                "type": "array",
                                "description": "Array of row data (each row is an array of values)",
                                "items": { 
                                    "type": "array",
                                    "items": { "type": "string" }
                                }
                            },
                            "summary": {
                                "type": "object",
                                "description": "Key-value pairs to display as summary at top of sheet"
                            }
                        },
                        "required": ["name"]
                    }
                },
                "metadata": {
                    "type": "object",
                    "description": "Document metadata (entity_code, period, prepared_by, etc.)"
                }
            },
            "required": ["file_name", "sheets"]
        }
        """).RootElement,
        Tags = ["excel", "support", "document", "create", "export"]
    };

    public Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var fileName = args.GetProperty("file_name").GetString() ?? "SupportDocument";
            var title = args.TryGetProperty("title", out var t) ? t.GetString() : null;

            using var workbook = new XLWorkbook();
            workbook.Properties.Author = "Finance AI Assistant";

            // Parse metadata
            Dictionary<string, object>? metadata = null;
            if (args.TryGetProperty("metadata", out var md) && md.ValueKind == JsonValueKind.Object)
            {
                metadata = JsonSerializer.Deserialize<Dictionary<string, object>>(md.GetRawText());
            }

            var sheetsArray = args.GetProperty("sheets");
            var sheetNames = new List<string>();

            foreach (var sheetJson in sheetsArray.EnumerateArray())
            {
                var sheetName = sheetJson.GetProperty("name").GetString() ?? "Sheet";
                sheetNames.Add(sheetName);

                var worksheet = workbook.Worksheets.Add(sheetName);
                var currentRow = 1;

                // Add title if provided
                if (!string.IsNullOrEmpty(title) && sheetNames.Count == 1)
                {
                    worksheet.Cell(currentRow, 1).Value = title;
                    worksheet.Cell(currentRow, 1).Style.Font.Bold = true;
                    worksheet.Cell(currentRow, 1).Style.Font.FontSize = 14;
                    currentRow += 2;
                }

                // Add summary section if provided
                if (sheetJson.TryGetProperty("summary", out var summary) && summary.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in summary.EnumerateObject())
                    {
                        worksheet.Cell(currentRow, 1).Value = prop.Name + ":";
                        worksheet.Cell(currentRow, 1).Style.Font.Bold = true;
                        worksheet.Cell(currentRow, 2).Value = prop.Value.ToString();
                        currentRow++;
                    }
                    currentRow++;
                }

                // Add metadata if provided (on first sheet only)
                if (metadata != null && sheetNames.Count == 1)
                {
                    foreach (var item in metadata)
                    {
                        worksheet.Cell(currentRow, 1).Value = item.Key + ":";
                        worksheet.Cell(currentRow, 1).Style.Font.Bold = true;
                        worksheet.Cell(currentRow, 2).Value = item.Value?.ToString();
                        currentRow++;
                    }
                    currentRow++;
                }

                // Add headers
                if (sheetJson.TryGetProperty("headers", out var headers) && headers.ValueKind == JsonValueKind.Array)
                {
                    var col = 1;
                    foreach (var header in headers.EnumerateArray())
                    {
                        var cell = worksheet.Cell(currentRow, col);
                        cell.Value = header.GetString();
                        cell.Style.Font.Bold = true;
                        cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#4472C4");
                        cell.Style.Font.FontColor = XLColor.White;
                        cell.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
                        col++;
                    }
                    currentRow++;
                }

                // Add data rows
                if (sheetJson.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Array)
                {
                    foreach (var row in data.EnumerateArray())
                    {
                        if (row.ValueKind == JsonValueKind.Array)
                        {
                            var col = 1;
                            foreach (var cell in row.EnumerateArray())
                            {
                                var wsCell = worksheet.Cell(currentRow, col);
                                switch (cell.ValueKind)
                                {
                                    case JsonValueKind.Number:
                                        wsCell.Value = cell.GetDecimal();
                                        wsCell.Style.NumberFormat.Format = "#,##0.00";
                                        break;
                                    case JsonValueKind.True:
                                    case JsonValueKind.False:
                                        wsCell.Value = cell.GetBoolean() ? "Yes" : "No";
                                        break;
                                    default:
                                        wsCell.Value = cell.ToString();
                                        break;
                                }
                                col++;
                            }
                        }
                        currentRow++;
                    }
                }

                // Auto-fit columns
                worksheet.Columns().AdjustToContents();

                // Freeze header row
                if (sheetJson.TryGetProperty("headers", out _))
                {
                    worksheet.SheetView.FreezeRows(currentRow - 1);
                }
            }

            // Convert to base64
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var base64Content = Convert.ToBase64String(stream.ToArray());

            var result = JsonSerializer.SerializeToElement(new
            {
                success = true,
                file_name = $"{fileName}.xlsx",
                sheets_created = sheetNames,
                file_size_bytes = stream.Length,
                content_base64 = base64Content,
                mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });

            return Task.FromResult(ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime));
        }
        catch (Exception ex)
        {
            var errorResult = JsonSerializer.SerializeToElement(new { success = false, error = ex.Message });
            return Task.FromResult(ToolExecutionResult.Ok(errorResult, DateTime.UtcNow - startTime));
        }
    }
}
