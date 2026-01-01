import React from 'react';
import { FormInput, FormTextarea, FieldGroup } from '../form';

interface FormFieldConfig {
  label: string;
  placeholder: string;
}

interface FormFields {
  name: FormFieldConfig;
  email: FormFieldConfig;
  message: FormFieldConfig;
}

interface ContactData {
  title: string;
  description: string;
  backgroundText: string;
  successMessage: string;
  errorMessage: string;
  submitButtonText: string;
  formFields: FormFields;
}

interface ContactEditorProps {
  data: ContactData;
  onChange: (data: ContactData) => void;
}

const ContactEditor: React.FC<ContactEditorProps> = ({ data, onChange }) => {
  // Ensure data has proper structure
  const safeData: ContactData = {
    title: data?.title || '',
    description: data?.description || '',
    backgroundText: data?.backgroundText || '',
    successMessage: data?.successMessage || '',
    errorMessage: data?.errorMessage || '',
    submitButtonText: data?.submitButtonText || '',
    formFields: data?.formFields || {
      name: { label: '', placeholder: '' },
      email: { label: '', placeholder: '' },
      message: { label: '', placeholder: '' },
    },
  };

  const updateField = <K extends keyof ContactData>(field: K, value: ContactData[K]) => {
    // Preserve any unknown fields from original data, then apply safe defaults and the new value
    onChange({ ...data, ...safeData, [field]: value });
  };

  const updateFormField = (fieldName: keyof FormFields, key: keyof FormFieldConfig, value: string) => {
    updateField('formFields', {
      ...safeData.formFields,
      [fieldName]: {
        ...safeData.formFields[fieldName],
        [key]: value,
      },
    });
  };

  return (
    <div className="admin-editor-form">
      <FieldGroup title="Section Header" defaultExpanded>
        <FormInput
          label="Title"
          value={safeData.title}
          onChange={(value) => updateField('title', value)}
          placeholder="Send me a Message"
          required
        />
        <FormTextarea
          label="Description"
          value={safeData.description}
          onChange={(value) => updateField('description', value)}
          placeholder="Your email address will not be published..."
          rows={2}
        />
        <FormInput
          label="Background Text"
          value={safeData.backgroundText}
          onChange={(value) => updateField('backgroundText', value)}
          placeholder="Contact Me"
          helpText="Large text displayed in the background"
        />
      </FieldGroup>

      <FieldGroup title="Form Messages" defaultExpanded>
        <FormInput
          label="Success Message"
          value={safeData.successMessage}
          onChange={(value) => updateField('successMessage', value)}
          placeholder="Message sent!"
        />
        <FormInput
          label="Error Message"
          value={safeData.errorMessage}
          onChange={(value) => updateField('errorMessage', value)}
          placeholder="Failed to send message. Please try again."
        />
        <FormInput
          label="Submit Button Text"
          value={safeData.submitButtonText}
          onChange={(value) => updateField('submitButtonText', value)}
          placeholder="Submit now"
        />
      </FieldGroup>

      <FieldGroup title="Name Field" defaultExpanded={false}>
        <FormInput
          label="Label"
          value={safeData.formFields.name.label}
          onChange={(value) => updateFormField('name', 'label', value)}
          placeholder="Name*"
        />
        <FormInput
          label="Placeholder"
          value={safeData.formFields.name.placeholder}
          onChange={(value) => updateFormField('name', 'placeholder', value)}
          placeholder="Your Name"
        />
      </FieldGroup>

      <FieldGroup title="Email Field" defaultExpanded={false}>
        <FormInput
          label="Label"
          value={safeData.formFields.email.label}
          onChange={(value) => updateFormField('email', 'label', value)}
          placeholder="Email*"
        />
        <FormInput
          label="Placeholder"
          value={safeData.formFields.email.placeholder}
          onChange={(value) => updateFormField('email', 'placeholder', value)}
          placeholder="Your Email"
        />
      </FieldGroup>

      <FieldGroup title="Message Field" defaultExpanded={false}>
        <FormInput
          label="Label"
          value={safeData.formFields.message.label}
          onChange={(value) => updateFormField('message', 'label', value)}
          placeholder="Message*"
        />
        <FormInput
          label="Placeholder"
          value={safeData.formFields.message.placeholder}
          onChange={(value) => updateFormField('message', 'placeholder', value)}
          placeholder="Message"
        />
      </FieldGroup>
    </div>
  );
};

export default ContactEditor;
