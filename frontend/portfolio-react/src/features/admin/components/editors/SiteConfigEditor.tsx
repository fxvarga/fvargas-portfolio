import React from 'react';
import { FormInput, FormTextarea, FieldGroup, ArrayField } from '../form';

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface Owner {
  name: string;
  title: string;
  tagline: string;
}

interface Contact {
  phone: string;
  email: string;
  formEndpoint: string;
}

interface SiteConfigData {
  owner: Owner;
  contact: Contact;
  socialLinks: SocialLink[];
  copyright: string;
}

interface SiteConfigEditorProps {
  data: SiteConfigData;
  onChange: (data: SiteConfigData) => void;
}

const SiteConfigEditor: React.FC<SiteConfigEditorProps> = ({ data, onChange }) => {
  // Ensure data has proper structure
  const safeData: SiteConfigData = {
    owner: data?.owner || { name: '', title: '', tagline: '' },
    contact: data?.contact || { phone: '', email: '', formEndpoint: '' },
    socialLinks: data?.socialLinks || [],
    copyright: data?.copyright || '',
  };

  const updateField = <K extends keyof SiteConfigData>(field: K, value: SiteConfigData[K]) => {
    // Preserve any unknown fields from original data, then apply safe defaults and the new value
    onChange({ ...data, ...safeData, [field]: value });
  };

  return (
    <div className="admin-editor-form">
      <FieldGroup title="Owner Information" defaultExpanded>
        <FormInput
          label="Name"
          value={safeData.owner.name}
          onChange={(value) => updateField('owner', { ...safeData.owner, name: value })}
          placeholder="Fernando Vargas"
          required
        />
        <FormInput
          label="Title"
          value={safeData.owner.title}
          onChange={(value) => updateField('owner', { ...safeData.owner, title: value })}
          placeholder="Senior Full-Stack Engineer"
        />
        <FormInput
          label="Tagline"
          value={safeData.owner.tagline}
          onChange={(value) => updateField('owner', { ...safeData.owner, tagline: value })}
          placeholder="Full-Stack Engineer with Passion for UX"
        />
      </FieldGroup>

      <FieldGroup title="Contact Information" defaultExpanded>
        <FormInput
          label="Phone"
          type="tel"
          value={safeData.contact.phone}
          onChange={(value) => updateField('contact', { ...safeData.contact, phone: value })}
          placeholder="(980)-219-0610"
        />
        <FormInput
          label="Email"
          type="email"
          value={safeData.contact.email}
          onChange={(value) => updateField('contact', { ...safeData.contact, email: value })}
          placeholder="fxvarga@gmail.com"
        />
        <FormInput
          label="Form Endpoint"
          type="url"
          value={safeData.contact.formEndpoint}
          onChange={(value) => updateField('contact', { ...safeData.contact, formEndpoint: value })}
          placeholder="https://formspree.io/f/xxxxx"
          helpText="URL where the contact form submits to"
        />
      </FieldGroup>

      <FieldGroup title="Social Links" defaultExpanded={false}>
        <ArrayField
          label="Social Media Links"
          items={safeData.socialLinks}
          onChange={(items) => updateField('socialLinks', items)}
          createItem={() => ({ platform: '', url: '', icon: '' })}
          itemLabel={(item) => item.platform || 'New Link'}
          renderItem={(item, _index, onItemChange) => (
            <div className="admin-editor-nested-fields">
              <FormInput
                label="Platform"
                value={item.platform}
                onChange={(value) => onItemChange({ ...item, platform: value })}
                placeholder="LinkedIn"
              />
              <FormInput
                label="URL"
                type="url"
                value={item.url}
                onChange={(value) => onItemChange({ ...item, url: value })}
                placeholder="https://www.linkedin.com/in/..."
              />
              <FormInput
                label="Icon"
                value={item.icon}
                onChange={(value) => onItemChange({ ...item, icon: value })}
                placeholder="ti-linkedin"
                helpText="Themify icon class"
              />
            </div>
          )}
        />
      </FieldGroup>

      <FieldGroup title="Footer" defaultExpanded={false}>
        <FormTextarea
          label="Copyright Text"
          value={safeData.copyright}
          onChange={(value) => updateField('copyright', value)}
          placeholder="© 2025. All rights reserved by Fernando Vargas."
          rows={2}
        />
      </FieldGroup>
    </div>
  );
};

export default SiteConfigEditor;
