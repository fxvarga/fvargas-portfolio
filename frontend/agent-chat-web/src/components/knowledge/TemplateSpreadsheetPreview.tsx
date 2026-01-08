/**
 * AG Grid based spreadsheet preview for Excel templates
 * Renders a realistic preview of the template with sample data
 */

import { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import type { 
  TemplateSheet, 
  TemplateColumn, 
  ColumnType,
  SheetType 
} from '@/types/knowledge';
import { Card, CardContent } from '@/components/ui/Card';
import { FileSpreadsheet, Table, BookOpen, Search, Calculator } from 'lucide-react';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom dark theme based on Quartz
const darkTheme = themeQuartz.withParams({
  backgroundColor: '#1f2937',
  foregroundColor: '#e5e7eb',
  headerBackgroundColor: '#374151',
  headerTextColor: '#f3f4f6',
  oddRowBackgroundColor: '#1f2937',
  borderColor: '#4b5563',
  cellHorizontalPaddingScale: 0.8,
  headerFontSize: 12,
  fontSize: 12,
  rowHeight: 32,
  headerHeight: 36,
});

interface TemplateSpreadsheetPreviewProps {
  sheets: TemplateSheet[];
}

// Column type to display name mapping
const columnTypeNames: Record<ColumnType, string> = {
  [0]: 'Text',
  [1]: 'Number',
  [2]: 'Currency',
  [3]: 'Date',
  [4]: 'DateTime',
  [5]: 'Percentage',
  [6]: 'Boolean',
  [7]: 'Formula',
  [8]: 'Dropdown',
  [9]: 'Lookup',
};

// Sheet type icons
const sheetTypeIcons: Record<SheetType, React.ReactNode> = {
  [0]: <Table className="w-4 h-4" />,
  [1]: <FileSpreadsheet className="w-4 h-4" />,
  [2]: <BookOpen className="w-4 h-4" />,
  [3]: <Search className="w-4 h-4" />,
  [4]: <Calculator className="w-4 h-4" />,
};

const sheetTypeNames: Record<SheetType, string> = {
  [0]: 'Data',
  [1]: 'Summary',
  [2]: 'Instructions',
  [3]: 'Lookup',
  [4]: 'Calculation',
};

/**
 * Generate sample data based on column type
 */
function generateSampleValue(column: TemplateColumn, rowIndex: number): unknown {
  const { Type, AllowedValues, DefaultValue, Name } = column;
  
  // Use default value if available
  if (DefaultValue) return DefaultValue;
  
  // Use first allowed value for dropdowns
  if (AllowedValues && AllowedValues.length > 0) {
    return AllowedValues[rowIndex % AllowedValues.length];
  }

  switch (Type) {
    case 0: // Text
      if (Name.includes('id')) return `ID-${1000 + rowIndex}`;
      if (Name.includes('name')) return `Sample ${rowIndex + 1}`;
      if (Name.includes('description')) return `Description for item ${rowIndex + 1}`;
      if (Name.includes('reference')) return `REF-${2024}${String(rowIndex + 1).padStart(4, '0')}`;
      return `Text ${rowIndex + 1}`;
    
    case 1: // Number
      return Math.floor(Math.random() * 1000) + rowIndex;
    
    case 2: // Currency
      return (Math.random() * 100000 + 1000).toFixed(2);
    
    case 3: // Date
      const date = new Date();
      date.setDate(date.getDate() - rowIndex * 7);
      return date.toISOString().split('T')[0];
    
    case 4: // DateTime
      return new Date().toISOString();
    
    case 5: // Percentage
      return `${(Math.random() * 100).toFixed(1)}%`;
    
    case 6: // Boolean
      return rowIndex % 2 === 0 ? 'Yes' : 'No';
    
    case 7: // Formula
      return column.Formula || '=...';
    
    case 8: // Dropdown
      return AllowedValues?.[0] || 'Select...';
    
    case 9: // Lookup
      return `Lookup ${rowIndex + 1}`;
    
    default:
      return '';
  }
}

/**
 * Generate sample rows for preview
 */
function generateSampleData(columns: TemplateColumn[], rowCount: number = 5): Record<string, unknown>[] {
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const row: Record<string, unknown> = {};
    columns.forEach(col => {
      row[col.Name] = generateSampleValue(col, rowIndex);
    });
    return row;
  });
}

/**
 * Convert template column to AG Grid column definition
 */
function columnToColDef(column: TemplateColumn): ColDef {
  const colDef: ColDef = {
    field: column.Name,
    headerName: column.Header,
    width: column.Width ? column.Width * 8 : 120, // Convert character width to pixels
    minWidth: 80,
    resizable: true,
    sortable: true,
    headerTooltip: column.Description || undefined,
  };

  // Type-specific formatting
  switch (column.Type) {
    case 2: // Currency
      colDef.cellClass = 'text-right font-mono';
      colDef.valueFormatter = (params) => {
        if (params.value == null) return '';
        const num = parseFloat(params.value);
        return isNaN(num) ? params.value : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      };
      break;
    
    case 1: // Number
      colDef.cellClass = 'text-right font-mono';
      colDef.valueFormatter = (params) => {
        if (params.value == null) return '';
        const num = parseFloat(params.value);
        return isNaN(num) ? params.value : num.toLocaleString('en-US');
      };
      break;
    
    case 5: // Percentage
      colDef.cellClass = 'text-right font-mono';
      break;
    
    case 3: // Date
    case 4: // DateTime
      colDef.cellClass = 'text-center';
      break;
    
    case 7: // Formula
      colDef.cellClass = 'font-mono text-cyan-400 text-xs';
      break;
    
    case 8: // Dropdown
    case 9: // Lookup
      colDef.cellClass = 'text-purple-300';
      break;
  }

  // Mark required columns
  if (column.Required) {
    colDef.headerClass = 'required-column';
  }

  return colDef;
}

/**
 * Sheet tab component
 */
function SheetTab({ 
  sheet, 
  isActive, 
  onClick 
}: { 
  sheet: TemplateSheet; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const icon = sheetTypeIcons[sheet.Type] || <Table className="w-4 h-4" />;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg
        border border-b-0 transition-colors
        ${isActive 
          ? 'bg-gray-800 text-gray-100 border-gray-600' 
          : 'bg-gray-900/50 text-gray-400 border-gray-700 hover:bg-gray-800/50 hover:text-gray-300'
        }
      `}
    >
      {icon}
      <span className="max-w-[120px] truncate">{sheet.Name}</span>
      {sheet.Columns.length > 0 && (
        <span className="text-xs text-gray-500">({sheet.Columns.length})</span>
      )}
    </button>
  );
}

/**
 * Header fields display (for Summary/Data sheets with header section)
 */
function HeaderFieldsPreview({ sheet }: { sheet: TemplateSheet }) {
  if (!sheet.Header?.Fields || sheet.Header.Fields.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
        Header Fields
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sheet.Header.Fields.map((field, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{field.Label}</span>
            <span className="font-mono text-xs text-gray-600">[{field.ValueCell || field.Cell}]</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Formulas display
 */
function FormulasPreview({ sheet }: { sheet: TemplateSheet }) {
  if (!sheet.Formulas || sheet.Formulas.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
        Formulas ({sheet.Formulas.length})
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
        {sheet.Formulas.map((formula, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <span className="font-mono text-cyan-400">{formula.Cell}</span>
            <span className="text-gray-500 truncate" title={formula.Formula}>
              {formula.Description || formula.Formula}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main spreadsheet preview component
 */
export function TemplateSpreadsheetPreview({ sheets }: TemplateSpreadsheetPreviewProps) {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  
  const activeSheet = sheets[activeSheetIndex];
  
  // Generate column definitions from template
  const columnDefs = useMemo<ColDef[]>(() => {
    if (!activeSheet?.Columns || activeSheet.Columns.length === 0) {
      return [];
    }
    return activeSheet.Columns.map(columnToColDef);
  }, [activeSheet]);

  // Generate sample data
  const rowData = useMemo(() => {
    if (!activeSheet?.Columns || activeSheet.Columns.length === 0) {
      return [];
    }
    return generateSampleData(activeSheet.Columns, 5);
  }, [activeSheet]);

  // Default column properties
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: false,
  }), []);

  const hasColumns = activeSheet?.Columns && activeSheet.Columns.length > 0;
  const hasHeaderFields = activeSheet?.Header?.Fields && activeSheet.Header.Fields.length > 0;
  const hasFormulas = activeSheet?.Formulas && activeSheet.Formulas.length > 0;

  return (
    <Card className="border-gray-700">
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-green-400" />
            Spreadsheet Preview
          </h3>
          <span className="text-xs text-gray-500">
            {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Sheet Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0 mb-0 border-b border-gray-700">
          {sheets.map((sheet, idx) => (
            <SheetTab
              key={idx}
              sheet={sheet}
              isActive={idx === activeSheetIndex}
              onClick={() => setActiveSheetIndex(idx)}
            />
          ))}
        </div>

        {/* Active Sheet Content */}
        <div className="bg-gray-800 rounded-b-lg border border-t-0 border-gray-700 p-4">
          {/* Sheet description */}
          {activeSheet?.Description && (
            <p className="text-sm text-gray-400 mb-3">{activeSheet.Description}</p>
          )}

          {/* Sheet type badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
              {sheetTypeNames[activeSheet?.Type ?? 0]} Sheet
            </span>
            {hasColumns && (
              <span className="text-xs text-gray-500">
                {activeSheet.Columns.length} columns
              </span>
            )}
          </div>

          {/* Header fields preview */}
          {hasHeaderFields && <HeaderFieldsPreview sheet={activeSheet} />}

          {/* AG Grid Preview */}
          {hasColumns ? (
            <div className="ag-theme-quartz-dark rounded overflow-hidden" style={{ height: 250 }}>
              <AgGridReact
                theme={darkTheme}
                columnDefs={columnDefs}
                rowData={rowData}
                defaultColDef={defaultColDef}
                animateRows={false}
                suppressMovableColumns={true}
                suppressCellFocus={true}
                headerHeight={36}
                rowHeight={32}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[150px] bg-gray-900/50 rounded-lg border border-dashed border-gray-700">
              <p className="text-gray-500 text-sm">
                {hasHeaderFields || hasFormulas
                  ? 'This sheet contains header fields and/or formulas (no data columns)'
                  : 'No columns defined for this sheet'}
              </p>
            </div>
          )}

          {/* Formulas preview */}
          {hasFormulas && <FormulasPreview sheet={activeSheet} />}

          {/* Column legend */}
          {hasColumns && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Column types:</span>
              {Array.from(new Set(activeSheet.Columns.map(c => c.Type))).map(type => (
                <span 
                  key={type} 
                  className="text-xs px-2 py-0.5 bg-gray-700/50 rounded text-gray-400"
                >
                  {columnTypeNames[type]}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
