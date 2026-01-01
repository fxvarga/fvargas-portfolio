import React from 'react';
import { FormInput, FormTextarea, FieldGroup, ImagePicker } from '../form';

interface AboutImage {
  url: string;
  alt: string;
}

interface InsightsDialog {
  title: string;
  description: string;
}

interface AboutData {
  greeting: string;
  headline: string;
  subheadline: string;
  bio: string;
  experienceYears: string;
  sectionTitle: string;
  image: AboutImage;
  insightsDialog: InsightsDialog;
}

interface AboutEditorProps {
  data: AboutData;
  onChange: (data: AboutData) => void;
}

const AboutEditor: React.FC<AboutEditorProps> = ({ data, onChange }) => {
  // Ensure data has proper structure
  const safeData: AboutData = {
    greeting: data?.greeting || '',
    headline: data?.headline || '',
    subheadline: data?.subheadline || '',
    bio: data?.bio || '',
    experienceYears: data?.experienceYears || '',
    sectionTitle: data?.sectionTitle || '',
    image: data?.image || { url: '', alt: '' },
    insightsDialog: data?.insightsDialog || { title: '', description: '' },
  };

  const updateField = <K extends keyof AboutData>(field: K, value: AboutData[K]) => {
    // Preserve any unknown fields from original data, then apply safe defaults and the new value
    onChange({ ...data, ...safeData, [field]: value });
  };

  return (
    <div className="admin-editor-form">
      <FieldGroup title="Section Header" defaultExpanded>
        <FormInput
          label="Section Title"
          value={safeData.sectionTitle}
          onChange={(value) => updateField('sectionTitle', value)}
          placeholder="About Me"
          required
        />
        <FormInput
          label="Greeting"
          value={safeData.greeting}
          onChange={(value) => updateField('greeting', value)}
          placeholder="Hi I'm Fernando Vargas"
        />
        <FormInput
          label="Headline"
          value={safeData.headline}
          onChange={(value) => updateField('headline', value)}
          placeholder="Full-Stack Engineer with Passion for UX"
        />
        <FormTextarea
          label="Subheadline"
          value={safeData.subheadline}
          onChange={(value) => updateField('subheadline', value)}
          placeholder="Over 12 years of experience..."
          rows={3}
        />
      </FieldGroup>

      <FieldGroup title="Content" defaultExpanded>
        <FormTextarea
          label="Bio"
          value={safeData.bio}
          onChange={(value) => updateField('bio', value)}
          placeholder="Your detailed biography..."
          rows={6}
        />
        <FormInput
          label="Experience Years"
          value={safeData.experienceYears}
          onChange={(value) => updateField('experienceYears', value)}
          placeholder="12+"
          helpText="Years of experience to display"
        />
      </FieldGroup>

      <FieldGroup title="Profile Image" defaultExpanded={false}>
        <ImagePicker
          label="About Section Image"
          value={safeData.image}
          onChange={(value) => updateField('image', value)}
          helpText="Image displayed alongside the about content"
        />
      </FieldGroup>

      <FieldGroup title="AI Insights Dialog" defaultExpanded={false}>
        <FormInput
          label="Dialog Title"
          value={safeData.insightsDialog.title}
          onChange={(value) => updateField('insightsDialog', { ...safeData.insightsDialog, title: value })}
          placeholder="AI Career Insights"
        />
        <FormTextarea
          label="Dialog Description"
          value={safeData.insightsDialog.description}
          onChange={(value) => updateField('insightsDialog', { ...safeData.insightsDialog, description: value })}
          placeholder="Description for the AI insights dialog..."
          rows={4}
        />
      </FieldGroup>
    </div>
  );
};

export default AboutEditor;
