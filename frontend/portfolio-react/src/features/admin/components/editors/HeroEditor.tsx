import React from 'react';
import { FormInput, FormTextarea, FieldGroup, ImagePicker } from '../form';

interface CtaButton {
  label: string;
  scrollTo: string;
}

interface InsightsDialog {
  title: string;
  description: string;
  prompt: string;
}

interface HeroImage {
  url: string;
  alt: string;
}

interface HeroData {
  title: string;
  name: string;
  backgroundText: string;
  image: HeroImage;
  ctaButton: CtaButton;
  insightsDialog: InsightsDialog;
}

interface HeroEditorProps {
  data: HeroData;
  onChange: (data: HeroData) => void;
}

const HeroEditor: React.FC<HeroEditorProps> = ({ data, onChange }) => {
  // Ensure data has proper structure
  const safeData: HeroData = {
    title: data?.title || '',
    name: data?.name || '',
    backgroundText: data?.backgroundText || '',
    image: data?.image || { url: '', alt: '' },
    ctaButton: data?.ctaButton || { label: '', scrollTo: '' },
    insightsDialog: data?.insightsDialog || { title: '', description: '', prompt: '' },
  };

  const updateField = <K extends keyof HeroData>(field: K, value: HeroData[K]) => {
    // Preserve any unknown fields from original data, then apply safe defaults and the new value
    onChange({ ...data, ...safeData, [field]: value });
  };

  return (
    <div className="admin-editor-form">
      <FieldGroup title="Hero Content" defaultExpanded>
        <FormInput
          label="Title"
          value={safeData.title}
          onChange={(value) => updateField('title', value)}
          placeholder="Senior Full-Stack Engineer"
          required
        />
        <FormInput
          label="Name"
          value={safeData.name}
          onChange={(value) => updateField('name', value)}
          placeholder="Your Name"
          required
        />
        <FormInput
          label="Background Text"
          value={safeData.backgroundText}
          onChange={(value) => updateField('backgroundText', value)}
          placeholder="Developer"
          helpText="Large text displayed in the background"
        />
      </FieldGroup>

      <FieldGroup title="Hero Image" defaultExpanded={false}>
        <ImagePicker
          label="Profile Image"
          value={safeData.image}
          onChange={(value) => updateField('image', value)}
          helpText="Your profile photo or avatar"
        />
      </FieldGroup>

      <FieldGroup title="Call-to-Action Button" defaultExpanded={false}>
        <FormInput
          label="Button Label"
          value={safeData.ctaButton.label}
          onChange={(value) => updateField('ctaButton', { ...safeData.ctaButton, label: value })}
          placeholder="Contact Me"
        />
        <FormInput
          label="Scroll To Section"
          value={safeData.ctaButton.scrollTo}
          onChange={(value) => updateField('ctaButton', { ...safeData.ctaButton, scrollTo: value })}
          placeholder="contact"
          helpText="Section ID to scroll to when clicked (without #)"
        />
      </FieldGroup>

      <FieldGroup title="AI Insights Dialog" defaultExpanded={false}>
        <FormInput
          label="Dialog Title"
          value={safeData.insightsDialog.title}
          onChange={(value) => updateField('insightsDialog', { ...safeData.insightsDialog, title: value })}
          placeholder="AI Image Remix"
        />
        <FormTextarea
          label="Dialog Description"
          value={safeData.insightsDialog.description}
          onChange={(value) => updateField('insightsDialog', { ...safeData.insightsDialog, description: value })}
          placeholder="Click the button below to generate a unique AI-powered variation..."
          rows={3}
        />
        <FormTextarea
          label="AI Prompt"
          value={safeData.insightsDialog.prompt}
          onChange={(value) => updateField('insightsDialog', { ...safeData.insightsDialog, prompt: value })}
          placeholder="Generate a creative remix of this portfolio hero image"
          rows={3}
          helpText="The prompt sent to the AI for image generation"
        />
      </FieldGroup>
    </div>
  );
};

export default HeroEditor;
