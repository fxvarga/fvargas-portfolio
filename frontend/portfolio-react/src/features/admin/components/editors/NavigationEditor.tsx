import React from 'react';
import { FormInput, FieldGroup, ArrayField, ImagePicker } from '../form';

interface MenuItem {
  id: number;
  title: string;
  link: string;
}

interface Logo {
  url: string;
  alt: string;
}

interface NavigationData {
  logo: Logo;
  menuItems: MenuItem[];
  searchPlaceholder: string;
  devModeLabel: string;
  insightsLabel: string;
}

interface NavigationEditorProps {
  data: NavigationData;
  onChange: (data: NavigationData) => void;
}

const NavigationEditor: React.FC<NavigationEditorProps> = ({ data, onChange }) => {
  // Ensure data has proper structure
  const safeData: NavigationData = {
    logo: data?.logo || { url: '', alt: '' },
    menuItems: data?.menuItems || [],
    searchPlaceholder: data?.searchPlaceholder || '',
    devModeLabel: data?.devModeLabel || '',
    insightsLabel: data?.insightsLabel || '',
  };

  const updateField = <K extends keyof NavigationData>(field: K, value: NavigationData[K]) => {
    // Preserve any unknown fields from original data, then apply safe defaults and the new value
    onChange({ ...data, ...safeData, [field]: value });
  };

  const generateId = () => Date.now();

  return (
    <div className="admin-editor-form">
      <FieldGroup title="Logo" defaultExpanded>
        <ImagePicker
          label="Navigation Logo"
          value={safeData.logo}
          onChange={(value) => updateField('logo', value)}
          helpText="The logo displayed in the navigation bar"
        />
      </FieldGroup>

      <FieldGroup title="Menu Items" defaultExpanded>
        <ArrayField
          label="Navigation Links"
          items={safeData.menuItems}
          onChange={(items) => updateField('menuItems', items)}
          createItem={() => ({ id: generateId(), title: '', link: '' })}
          itemLabel={(item) => item.title || 'New Link'}
          renderItem={(item, _index, onItemChange) => (
            <div className="admin-editor-nested-fields">
              <FormInput
                label="Title"
                value={item.title}
                onChange={(value) => onItemChange({ ...item, title: value })}
                placeholder="Home"
              />
              <FormInput
                label="Link (Section ID)"
                value={item.link}
                onChange={(value) => onItemChange({ ...item, link: value })}
                placeholder="hero"
                helpText="Section ID to scroll to (without #)"
              />
            </div>
          )}
        />
      </FieldGroup>

      <FieldGroup title="Search & Labels" defaultExpanded={false}>
        <FormInput
          label="Search Placeholder"
          value={safeData.searchPlaceholder}
          onChange={(value) => updateField('searchPlaceholder', value)}
          placeholder="Search here..."
        />
        <FormInput
          label="Dev Mode Label"
          value={safeData.devModeLabel}
          onChange={(value) => updateField('devModeLabel', value)}
          placeholder="INSIGHTS MODE ON"
        />
        <FormInput
          label="Insights Label"
          value={safeData.insightsLabel}
          onChange={(value) => updateField('insightsLabel', value)}
          placeholder="Insights"
        />
      </FieldGroup>
    </div>
  );
};

export default NavigationEditor;
