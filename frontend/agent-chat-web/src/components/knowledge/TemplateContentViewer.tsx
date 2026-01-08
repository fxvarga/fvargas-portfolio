/**
 * Template content viewer with AG Grid spreadsheet preview
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TemplateSpreadsheetPreview } from './TemplateSpreadsheetPreview';
import type { TemplateContent, TemplateField, TemplateSection, TemplateSheet } from '@/types/knowledge';
import { 
  Layout, 
  FileSpreadsheet,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  AlignLeft,
  Asterisk,
  Layers,
  Table,
  Code,
  Settings
} from 'lucide-react';

interface TemplateContentViewerProps {
  content: TemplateContent;
}

type ViewMode = 'spreadsheet' | 'details' | 'json';

const fieldTypeIcons: Record<string, React.ReactNode> = {
  string: <Type className="w-4 h-4" />,
  text: <AlignLeft className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  decimal: <Hash className="w-4 h-4" />,
  currency: <Hash className="w-4 h-4" />,
  date: <Calendar className="w-4 h-4" />,
  datetime: <Calendar className="w-4 h-4" />,
  boolean: <ToggleLeft className="w-4 h-4" />,
  select: <List className="w-4 h-4" />,
  enum: <List className="w-4 h-4" />,
};

const fieldTypeColors: Record<string, string> = {
  string: 'text-blue-400 bg-blue-500/10',
  text: 'text-blue-400 bg-blue-500/10',
  number: 'text-green-400 bg-green-500/10',
  decimal: 'text-green-400 bg-green-500/10',
  currency: 'text-emerald-400 bg-emerald-500/10',
  date: 'text-purple-400 bg-purple-500/10',
  datetime: 'text-purple-400 bg-purple-500/10',
  boolean: 'text-amber-400 bg-amber-500/10',
  select: 'text-cyan-400 bg-cyan-500/10',
  enum: 'text-cyan-400 bg-cyan-500/10',
};

function FieldCard({ field }: { field: TemplateField }) {
  const icon = fieldTypeIcons[field.type] || <Type className="w-4 h-4" />;
  const colorClass = fieldTypeColors[field.type] || 'text-gray-400 bg-gray-500/10';

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-200">{field.label || field.name}</span>
          {field.required && (
            <span aria-label="Required">
              <Asterisk className="w-3 h-3 text-red-400" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <code className="font-mono">{field.name}</code>
          <span>•</span>
          <span className="capitalize">{field.type}</span>
          {field.format && (
            <>
              <span>•</span>
              <span>{field.format}</span>
            </>
          )}
        </div>
        {field.description && (
          <p className="text-sm text-gray-400 mt-1">{field.description}</p>
        )}
        {field.options && field.options.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {field.options.map(opt => (
              <span key={opt} className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                {opt}
              </span>
            ))}
          </div>
        )}
        {field.default !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            Default: <code className="text-cyan-400">{JSON.stringify(field.default)}</code>
          </p>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: TemplateSection }) {
  return (
    <Card className="border-gray-700">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-purple-400" />
          <h4 className="font-semibold text-gray-200">{section.title || section.name}</h4>
        </div>
        {section.description && (
          <p className="text-sm text-gray-400 mb-4">{section.description}</p>
        )}
        {section.fields && section.fields.length > 0 && (
          <div className="space-y-2">
            {section.fields.map((field, idx) => (
              <FieldCard key={idx} field={field} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ViewModeToggle({ 
  mode, 
  onChange,
  hasSpreadsheet 
}: { 
  mode: ViewMode; 
  onChange: (mode: ViewMode) => void;
  hasSpreadsheet: boolean;
}) {
  return (
    <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
      {hasSpreadsheet && (
        <button
          onClick={() => onChange('spreadsheet')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            mode === 'spreadsheet'
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          <Table className="w-4 h-4" />
          Spreadsheet
        </button>
      )}
      <button
        onClick={() => onChange('details')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          mode === 'details'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
        }`}
      >
        <Settings className="w-4 h-4" />
        Details
      </button>
      <button
        onClick={() => onChange('json')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          mode === 'json'
            ? 'bg-purple-600 text-white'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
        }`}
      >
        <Code className="w-4 h-4" />
        JSON
      </button>
    </div>
  );
}

export function TemplateContentViewer({ content }: TemplateContentViewerProps) {
  // Check if we have the new Excel template structure (Sheets array)
  const sheets = (content as unknown as { Sheets?: TemplateSheet[] }).Sheets;
  const hasSpreadsheetData = sheets && Array.isArray(sheets) && sheets.length > 0;
  
  const [viewMode, setViewMode] = useState<ViewMode>(hasSpreadsheetData ? 'spreadsheet' : 'details');

  // Legacy fields/sections support
  const allFields = content.fields || [];
  const hasSections = content.sections && content.sections.length > 0;
  
  // Calculate stats
  const totalColumns = hasSpreadsheetData 
    ? sheets.reduce((sum, s) => sum + (s.Columns?.length || 0), 0)
    : hasSections 
      ? content.sections!.reduce((sum, s) => sum + (s.fields?.length || 0), 0)
      : allFields.length;
      
  const totalSheets = sheets?.length || 0;
  
  const requiredColumns = hasSpreadsheetData
    ? sheets.reduce((sum, s) => sum + (s.Columns?.filter(c => c.Required).length || 0), 0)
    : hasSections
      ? content.sections!.reduce((sum, s) => sum + (s.fields?.filter(f => f.required).length || 0), 0)
      : allFields.filter(f => f.required).length;

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <ViewModeToggle 
          mode={viewMode} 
          onChange={setViewMode}
          hasSpreadsheet={hasSpreadsheetData ?? false}
        />
      </div>

      {/* Template Overview Stats */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Layout className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100 capitalize">
                  {content.category?.replace(/_/g, ' ') || 'Template'}
                </p>
                <p className="text-xs text-gray-500">Category</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100">
                  {totalSheets || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Sheets</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Type className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100">{totalColumns}</p>
                <p className="text-xs text-gray-500">Total Columns</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Asterisk className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100">{requiredColumns}</p>
                <p className="text-xs text-gray-500">Required</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spreadsheet Preview Mode */}
      {viewMode === 'spreadsheet' && hasSpreadsheetData && (
        <TemplateSpreadsheetPreview 
          sheets={sheets} 
        />
      )}

      {/* Details Mode */}
      {viewMode === 'details' && (
        <>
          {/* Sections with Fields (legacy) */}
          {hasSections && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400">Template Sections</h3>
              {content.sections!.map((section, idx) => (
                <SectionCard key={idx} section={section} />
              ))}
            </div>
          )}

          {/* Standalone Fields (legacy, no sections) */}
          {!hasSections && allFields.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Template Fields</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {allFields.map((field, idx) => (
                    <FieldCard key={idx} field={field} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sheet Details for new templates */}
          {hasSpreadsheetData && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400">Sheet Details</h3>
              {sheets.map((sheet, idx) => (
                <Card key={idx} className="border-gray-700">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-400" />
                        <h4 className="font-semibold text-gray-200">{sheet.Name}</h4>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">
                          {sheet.Columns?.length || 0} columns
                        </Badge>
                        {sheet.Formulas?.length > 0 && (
                          <Badge variant="info">
                            {sheet.Formulas.length} formulas
                          </Badge>
                        )}
                      </div>
                    </div>
                    {sheet.Description && (
                      <p className="text-sm text-gray-400 mb-3">{sheet.Description}</p>
                    )}
                    {sheet.Columns && sheet.Columns.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="px-3 py-2 text-left text-gray-500 font-medium">Column</th>
                              <th className="px-3 py-2 text-left text-gray-500 font-medium">Type</th>
                              <th className="px-3 py-2 text-left text-gray-500 font-medium">Required</th>
                              <th className="px-3 py-2 text-left text-gray-500 font-medium">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.Columns.slice(0, 10).map((col, colIdx) => (
                              <tr key={colIdx} className="border-b border-gray-700/50">
                                <td className="px-3 py-2 text-gray-300 font-mono text-xs">{col.Header}</td>
                                <td className="px-3 py-2 text-cyan-400 text-xs">
                                  {['Text', 'Number', 'Currency', 'Date', 'DateTime', 'Percentage', 'Boolean', 'Formula', 'Dropdown', 'Lookup'][col.Type] || 'Unknown'}
                                </td>
                                <td className="px-3 py-2">
                                  {col.Required && <Asterisk className="w-3 h-3 text-red-400" />}
                                </td>
                                <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[200px]">
                                  {col.Description || '-'}
                                </td>
                              </tr>
                            ))}
                            {sheet.Columns.length > 10 && (
                              <tr>
                                <td colSpan={4} className="px-3 py-2 text-gray-500 text-xs text-center">
                                  ...and {sheet.Columns.length - 10} more columns
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Related Procedures */}
          {content.related_procedures && content.related_procedures.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Related Procedures</h3>
                <div className="flex flex-wrap gap-2">
                  {content.related_procedures.map(procId => (
                    <Badge key={procId} variant="info">
                      {procId}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* JSON Mode */}
      {viewMode === 'json' && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Full Template Content</h3>
            <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm text-gray-300 max-h-[600px]">
              {JSON.stringify(content, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
