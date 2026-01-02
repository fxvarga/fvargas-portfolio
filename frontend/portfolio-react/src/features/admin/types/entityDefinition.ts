// Types for dynamic entity definitions (matching backend schema)

export interface SelectOption {
  value: string;
  label: string;
}

export interface AttributeDefinition {
  id: string;
  name: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'image' | 'array' | 'object' | 'select' | 'reference' | 'richtext' | 'tags';
  isRequired: boolean;
  label?: string;
  helpText?: string;
  placeholder?: string;
  defaultValue?: string; // JSON string
  targetEntity?: string; // For reference type
  validation?: string; // JSON validation rules
  options?: SelectOption[]; // For select type
  children?: AttributeDefinition[]; // For nested object/array types
  order: number;
}

export interface EntityDefinition {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  icon?: string;
  isSingleton: boolean;
  category?: string;
  attributes: AttributeDefinition[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

// Helper to create default value from schema
export function createDefaultFromSchema(attributes?: AttributeDefinition[]): Record<string, unknown> {
  if (!attributes) return {};
  
  const result: Record<string, unknown> = {};
  
  for (const attr of attributes) {
    if (attr.defaultValue) {
      try {
        result[attr.name] = JSON.parse(attr.defaultValue);
        continue;
      } catch {
        // Fall through to type-based defaults
      }
    }
    
    switch (attr.type) {
      case 'string':
      case 'text':
      case 'richtext':
        result[attr.name] = '';
        break;
      case 'number':
        result[attr.name] = 0;
        break;
      case 'boolean':
        result[attr.name] = false;
        break;
      case 'image':
        result[attr.name] = { url: '', alt: '' };
        break;
      case 'array':
      case 'tags':
        result[attr.name] = [];
        break;
      case 'object':
        result[attr.name] = attr.children ? createDefaultFromSchema(attr.children) : {};
        break;
      case 'select':
        result[attr.name] = attr.options?.[0]?.value || '';
        break;
      case 'reference':
        result[attr.name] = null;
        break;
      default:
        result[attr.name] = null;
    }
  }
  
  return result;
}

// Helper to create a default array item from children schema
export function createDefaultArrayItem(children?: AttributeDefinition[]): unknown {
  if (!children || children.length === 0) return '';
  
  // If single child with primitive type, it's a simple array
  if (children.length === 1) {
    const child = children[0];
    if (['string', 'text', 'number', 'boolean'].includes(child.type)) {
      switch (child.type) {
        case 'string':
        case 'text':
          return '';
        case 'number':
          return 0;
        case 'boolean':
          return false;
        default:
          return '';
      }
    }
  }
  
  // Otherwise it's an array of objects
  return createDefaultFromSchema(children);
}

// Get display label for an attribute
export function getAttributeLabel(attr: AttributeDefinition): string {
  if (attr.label) return attr.label;
  // Convert camelCase/kebab-case to Title Case
  return attr.name
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Check if an array represents a simple string array vs array of objects
export function isSimpleArray(children?: AttributeDefinition[]): boolean {
  if (!children || children.length === 0) return true;
  if (children.length === 1) {
    const child = children[0];
    return ['string', 'text', 'number', 'boolean'].includes(child.type);
  }
  return false;
}

// Validation error from API
export interface ValidationError {
  field: string;
  message: string;
}

// Validation rules that can be specified in the validation field
export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  minItems?: number;
  maxItems?: number;
}

// Parse validation rules from JSON string
export function parseValidationRules(validation?: string): ValidationRules | null {
  if (!validation) return null;
  try {
    return JSON.parse(validation) as ValidationRules;
  } catch {
    return null;
  }
}

// Client-side validation result
export interface ClientValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Client-side validation function that mirrors backend logic
export function validateData(
  data: Record<string, unknown>,
  attributes?: AttributeDefinition[],
  path = ''
): ClientValidationResult {
  const errors: ValidationError[] = [];

  if (!attributes) return { isValid: true, errors };

  for (const attr of attributes) {
    const fieldPath = path ? `${path}.${attr.name}` : attr.name;
    const value = data[attr.name];

    // Check required fields
    if (attr.isRequired && isEmpty(value)) {
      errors.push({
        field: fieldPath,
        message: `${attr.label || attr.name} is required`,
      });
      continue;
    }

    // Skip further validation if no value
    if (value === undefined || value === null) continue;

    // Type-specific validation
    const typeErrors = validateType(attr, value, fieldPath);
    errors.push(...typeErrors);

    // Custom validation rules
    if (attr.validation) {
      const ruleErrors = validateCustomRules(attr, value, fieldPath);
      errors.push(...ruleErrors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function validateType(
  attr: AttributeDefinition,
  value: unknown,
  fieldPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const label = attr.label || attr.name;

  switch (attr.type) {
    case 'string':
    case 'text':
    case 'richtext':
    case 'image':
      if (typeof value !== 'string' && typeof value !== 'object') {
        errors.push({ field: fieldPath, message: `${label} must be a string` });
      }
      break;

    case 'number':
      if (typeof value !== 'number') {
        errors.push({ field: fieldPath, message: `${label} must be a number` });
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({ field: fieldPath, message: `${label} must be a boolean` });
      }
      break;

    case 'select':
      if (typeof value !== 'string') {
        errors.push({ field: fieldPath, message: `${label} must be a string` });
      } else if (attr.options && attr.options.length > 0) {
        if (!attr.options.some((o) => o.value === value)) {
          const validOptions = attr.options.map((o) => o.value).join(', ');
          errors.push({
            field: fieldPath,
            message: `${label} must be one of: ${validOptions}`,
          });
        }
      }
      break;

    case 'tags':
      if (!Array.isArray(value)) {
        errors.push({ field: fieldPath, message: `${label} must be an array` });
      } else {
        for (const item of value) {
          if (typeof item !== 'string') {
            errors.push({
              field: fieldPath,
              message: `All items in ${label} must be strings`,
            });
            break;
          }
        }
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push({ field: fieldPath, message: `${label} must be an array` });
      } else if (attr.children && attr.children.length > 0) {
        value.forEach((item, index) => {
          const itemPath = `${fieldPath}[${index}]`;
          if (typeof item === 'object' && item !== null) {
            const childResult = validateData(
              item as Record<string, unknown>,
              attr.children,
              itemPath
            );
            errors.push(...childResult.errors);
          }
        });
      }
      break;

    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push({ field: fieldPath, message: `${label} must be an object` });
      } else if (attr.children && attr.children.length > 0) {
        const childResult = validateData(
          value as Record<string, unknown>,
          attr.children,
          fieldPath
        );
        errors.push(...childResult.errors);
      }
      break;

    case 'reference':
      if (typeof value !== 'string') {
        errors.push({ field: fieldPath, message: `${label} must be a reference ID` });
      }
      break;
  }

  return errors;
}

function validateCustomRules(
  attr: AttributeDefinition,
  value: unknown,
  fieldPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const rules = parseValidationRules(attr.validation);
  if (!rules) return errors;

  const label = attr.label || attr.name;

  // String length validation
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push({
        field: fieldPath,
        message: `${label} must be at least ${rules.minLength} characters`,
      });
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push({
        field: fieldPath,
        message: `${label} must be at most ${rules.maxLength} characters`,
      });
    }
    if (rules.pattern) {
      try {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: fieldPath,
            message: rules.patternMessage || `${label} format is invalid`,
          });
        }
      } catch {
        // Invalid regex, skip
      }
    }
  }

  // Number validation
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push({
        field: fieldPath,
        message: `${label} must be at least ${rules.min}`,
      });
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push({
        field: fieldPath,
        message: `${label} must be at most ${rules.max}`,
      });
    }
  }

  // Array length validation
  if (Array.isArray(value)) {
    if (rules.minItems !== undefined && value.length < rules.minItems) {
      errors.push({
        field: fieldPath,
        message: `${label} must have at least ${rules.minItems} items`,
      });
    }
    if (rules.maxItems !== undefined && value.length > rules.maxItems) {
      errors.push({
        field: fieldPath,
        message: `${label} must have at most ${rules.maxItems} items`,
      });
    }
  }

  return errors;
}
