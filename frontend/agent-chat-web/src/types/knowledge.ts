/**
 * Knowledge content types for detailed views
 * These types represent the full content of procedures, policies, standards, and templates
 */

// =============================================================================
// PROCEDURE TYPES
// =============================================================================

export interface ProcedureStep {
  sequence: number;
  step_number?: number; // Alternative field name from YAML
  action: string;
  description: string;
  tool_hint?: string;
  parameters?: Record<string, unknown>;
  output?: string;
  output_variable?: string; // Alternative field name
  condition?: string;
  requires_approval?: boolean;
  approval_threshold?: number;
}

export interface ProcedureTrigger {
  type: string;
  frequency?: string;
  timing?: string;
  day?: number;
  depends_on?: string[];
  event_name?: string;
  description?: string;
}

export interface ProcedureScope {
  entities?: string[] | string;
  account_ranges?: AccountRange[];
  account_types?: string[];
  asset_classes?: string[];
  materiality_threshold?: number;
}

export interface AccountRange {
  start: string;
  end: string;
  description?: string;
}

export interface ProcedureInput {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface ProcedureOutput {
  name: string;
  type: string;
  description?: string;
}

export interface ProcedureException {
  condition: string;
  action: string;
  message?: string;
}

export interface StandardReference {
  id: string;
  name: string;
  relevance?: string;
  sections?: string[];
}

export interface PolicyReference {
  id: string;
  name: string;
}

export interface ValidationRule {
  name: string;
  description: string;
}

export interface ProcedureContent {
  id: string;
  name: string;
  version?: string;
  category: string;
  subcategory?: string;
  frequency?: string;
  description: string;
  trigger?: ProcedureTrigger;
  triggers?: ProcedureTrigger[];
  scope?: ProcedureScope;
  applies_to?: ProcedureScope;
  inputs?: ProcedureInput[];
  outputs?: ProcedureOutput[];
  steps: ProcedureStep[];
  exceptions?: ProcedureException[];
  related_standards?: StandardReference[];
  related_policies?: PolicyReference[];
  validation_rules?: ValidationRule[];
  accounts_mapping?: Record<string, Record<string, string>>;
  tags?: string[];
}

// =============================================================================
// POLICY TYPES
// =============================================================================

export interface ApprovalLevel {
  threshold?: number;
  min?: number;
  max?: number;
  approver: string;
  description?: string;
}

export interface PolicyRule {
  name: string;
  description: string;
  condition?: string;
  action?: string;
}

export interface PolicyContent {
  id: string;
  name: string;
  version?: string;
  category: string;
  subcategory?: string;
  owner: string;
  effective_date: string;
  description: string;
  scope?: {
    entities?: string[] | string;
    applies_to?: string[];
  };
  approval_matrix?: ApprovalLevel[];
  approval_levels?: ApprovalLevel[];
  rules?: PolicyRule[];
  thresholds?: Record<string, number | string>;
  useful_lives?: Record<string, number | string>;
  related_procedures?: Array<{ id: string; name: string }>;
  tags?: string[];
}

// =============================================================================
// STANDARD TYPES
// =============================================================================

export interface StandardSection {
  id: string;
  title: string;
  content?: string;
  subsections?: StandardSection[];
  key_points?: string[];
  examples?: string[];
}

export interface StandardContent {
  id: string;
  name: string;
  codification: string;
  version?: string;
  issuer: string;
  effective_date?: string;
  description: string;
  scope?: string;
  sections?: StandardSection[];
  key_principles?: string[];
  recognition_criteria?: string[];
  measurement_guidance?: string[];
  disclosure_requirements?: string[];
  related_standards?: StandardReference[];
  tags?: string[];
}

// =============================================================================
// TEMPLATE TYPES (Excel Workbook Templates)
// =============================================================================

/**
 * Column type values from C# ColumnType
 */
export const ColumnType = {
  Text: 0,
  Number: 1,
  Currency: 2,
  Date: 3,
  DateTime: 4,
  Percentage: 5,
  Boolean: 6,
  Formula: 7,
  Dropdown: 8,
  Lookup: 9,
} as const;

export type ColumnType = (typeof ColumnType)[keyof typeof ColumnType];

/**
 * Sheet type values from C# SheetType
 */
export const SheetType = {
  Data: 0,
  Summary: 1,
  Instructions: 2,
  Lookup: 3,
  Calculation: 4,
} as const;

export type SheetType = (typeof SheetType)[keyof typeof SheetType];

export interface TemplateColumn {
  Name: string;
  Header: string;
  Type: ColumnType;
  Format?: string | null;
  Width?: number | null;
  Required: boolean;
  DefaultValue?: string | null;
  Formula?: string | null;
  Description?: string | null;
  AllowedValues?: string[] | null;
  ValidationFormula?: string | null;
  LookupSheet?: string | null;
  LookupColumn?: string | null;
}

export interface TemplateHeaderField {
  Label: string;
  Cell: string;
  ValueCell?: string | null;
  DefaultValue?: string | null;
  Type: ColumnType;
  Format?: string | null;
  AllowedValues?: string[] | null;
}

export interface TemplateHeader {
  Fields: TemplateHeaderField[];
  StartRow: number;
}

export interface TemplateFormula {
  Name: string;
  Cell: string;
  Formula: string;
  Description?: string | null;
  Format?: string | null;
}

export interface TemplateFormatStyle {
  BackgroundColor?: string | null;
  FontColor?: string | null;
  Bold: boolean;
  Italic: boolean;
}

export interface TemplateConditionalFormatting {
  Range: string;
  Condition: string;
  Style: TemplateFormatStyle;
}

export interface TemplateValidation {
  Column: string;
  Rule: string;
  ErrorMessage?: string | null;
}

export interface TemplateSheet {
  Name: string;
  Description?: string | null;
  Type: SheetType;
  Columns: TemplateColumn[];
  Header?: TemplateHeader | null;
  Formulas: TemplateFormula[];
  ConditionalFormatting?: TemplateConditionalFormatting[] | null;
  Validations?: TemplateValidation[] | null;
  Protected: boolean;
  ProtectionPassword?: string | null;
}

export interface TemplateAppliesTo {
  Entities: string[];
  BusinessUnits: string[];
}

export interface TemplateSettings {
  DefaultFont?: string | null;
  DefaultFontSize?: number | null;
  FreezePanes: boolean;
  FreezeAt?: string | null;
  ShowGridlines: boolean;
  Author?: string | null;
  Company?: string | null;
}

/**
 * Full Excel template content from API (PascalCase)
 */
export interface ExcelTemplateContent {
  Id: string;
  Name: string;
  Version: string;
  Category: string;
  Subcategory?: string | null;
  Description: string;
  Purpose?: string | null;
  AppliesTo?: TemplateAppliesTo | null;
  RelatedProcedures: string[];
  RelatedPolicies: string[];
  Sheets: TemplateSheet[];
  Settings?: TemplateSettings | null;
  Tags: string[];
}

// Legacy types for backward compatibility
export interface TemplateField {
  name: string;
  label?: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: unknown;
  options?: string[];
  format?: string;
}

export interface TemplateSection {
  name: string;
  title?: string;
  description?: string;
  fields?: TemplateField[];
}

export interface TemplateContent {
  id: string;
  name: string;
  version?: string;
  category: string;
  subcategory?: string;
  description: string;
  template_type?: string;
  file_format?: string;
  sections?: TemplateSection[];
  fields?: TemplateField[];
  sample_data?: Record<string, unknown>;
  related_procedures?: string[];
  tags?: string[];
  // New Excel template fields (from API)
  Sheets?: TemplateSheet[];
  Settings?: TemplateSettings;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type KnowledgeContent = 
  | ProcedureContent 
  | PolicyContent 
  | StandardContent 
  | TemplateContent;

/**
 * Type guard for ProcedureContent - handles both PascalCase (API) and snake_case
 */
export function isProcedureContent(content: unknown): content is ProcedureContent {
  if (typeof content !== 'object' || content === null) return false;
  const c = content as Record<string, unknown>;
  // Check for Steps (PascalCase from API) or steps (snake_case)
  return (
    ('steps' in c && Array.isArray(c.steps)) ||
    ('Steps' in c && Array.isArray(c.Steps))
  );
}

/**
 * Type guard for PolicyContent
 */
export function isPolicyContent(content: unknown): content is PolicyContent {
  if (typeof content !== 'object' || content === null) return false;
  const c = content as Record<string, unknown>;
  return (
    'approval_matrix' in c || 'approval_levels' in c || 'owner' in c ||
    'ApprovalMatrix' in c || 'ApprovalLevels' in c || 'Owner' in c
  );
}

/**
 * Type guard for StandardContent
 */
export function isStandardContent(content: unknown): content is StandardContent {
  if (typeof content !== 'object' || content === null) return false;
  const c = content as Record<string, unknown>;
  return 'codification' in c || 'Codification' in c;
}

/**
 * Type guard for TemplateContent
 */
export function isTemplateContent(content: unknown): content is TemplateContent {
  if (typeof content !== 'object' || content === null) return false;
  const c = content as Record<string, unknown>;
  // Check for legacy template_type OR new Excel template structure with Sheets
  return 'template_type' in c || 'TemplateType' in c || 'Sheets' in c || 'sheets' in c;
}

/**
 * Normalize API response (PascalCase) to our types (snake_case)
 */
export function normalizeProcedureContent(content: unknown): ProcedureContent | null {
  if (typeof content !== 'object' || content === null) return null;
  
  const c = content as Record<string, unknown>;
  
  // Get steps array (handle both cases)
  const rawSteps = (c.Steps || c.steps) as Array<Record<string, unknown>> | undefined;
  if (!rawSteps || !Array.isArray(rawSteps)) return null;

  // Normalize steps
  const steps: ProcedureStep[] = rawSteps.map((s, index) => ({
    sequence: (s.Sequence as number) || (s.sequence as number) || (s.StepNumber as number) || (s.step_number as number) || index + 1,
    step_number: (s.StepNumber as number) || (s.step_number as number) || index + 1,
    action: (s.Action as string) || (s.action as string) || 'unknown',
    description: (s.Description as string) || (s.description as string) || '',
    tool_hint: (s.ToolHint as string) || (s.tool_hint as string) || (s.Tool as string) || (s.tool as string),
    parameters: (s.Parameters || s.parameters) as Record<string, unknown> | undefined,
    output: (s.Output as string) || (s.output as string),
    output_variable: (s.OutputVariable as string) || (s.output_variable as string),
    condition: (s.Condition as string) || (s.condition as string),
    requires_approval: (s.RequiresApproval as boolean) || (s.requires_approval as boolean),
    approval_threshold: (s.ApprovalThreshold as number) || (s.approval_threshold as number),
  }));

  // Normalize related standards
  const rawStandards = (c.RelatedStandards || c.related_standards) as Array<Record<string, unknown>> | undefined;
  const related_standards: StandardReference[] | undefined = rawStandards?.map(s => ({
    id: (s.Id as string) || (s.id as string) || '',
    name: (s.Name as string) || (s.name as string) || '',
    relevance: (s.Relevance as string) || (s.relevance as string),
    sections: (s.Sections || s.sections) as string[] | undefined,
  }));

  // Normalize related policies
  const rawPolicies = (c.RelatedPolicies || c.related_policies) as Array<Record<string, unknown>> | undefined;
  const related_policies: PolicyReference[] | undefined = rawPolicies?.map(p => ({
    id: (p.Id as string) || (p.id as string) || '',
    name: (p.Name as string) || (p.name as string) || '',
  }));

  // Normalize validation rules
  const rawRules = (c.ValidationRules || c.validation_rules) as Array<Record<string, unknown>> | undefined;
  const validation_rules: ValidationRule[] | undefined = rawRules?.map(r => ({
    name: (r.Name as string) || (r.name as string) || '',
    description: (r.Description as string) || (r.description as string) || '',
  }));

  return {
    id: (c.Id as string) || (c.id as string) || '',
    name: (c.Name as string) || (c.name as string) || '',
    version: (c.Version as string) || (c.version as string),
    category: (c.Category as string) || (c.category as string) || '',
    subcategory: (c.Subcategory as string) || (c.subcategory as string),
    frequency: (c.Frequency as string) || (c.frequency as string),
    description: (c.Description as string) || (c.description as string) || '',
    steps,
    related_standards,
    related_policies,
    validation_rules,
    accounts_mapping: (c.AccountsMapping || c.accounts_mapping) as Record<string, Record<string, string>> | undefined,
    tags: (c.Tags || c.tags) as string[] | undefined,
  };
}
