import React from 'react';
import { FormInput, FormTextarea, FieldGroup, ArrayField, ImagePicker, TagInput } from '../form';

interface ServiceApproach {
  title: string;
  content: string;
}

interface ServiceCta {
  title: string;
  description: string;
}

interface ServiceImage {
  url: string;
  alt: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: ServiceImage;
  dialogTitle: string;
  leadIn: string;
  technologies: string[];
  approach: ServiceApproach[];
  cta: ServiceCta;
}

interface ServicesData {
  label: string;
  title: string;
  backgroundText: string;
  services: Service[];
}

interface ServicesEditorProps {
  data: ServicesData;
  onChange: (data: ServicesData) => void;
}

const ServicesEditor: React.FC<ServicesEditorProps> = ({ data, onChange }) => {
  // Ensure data has proper structure
  const safeData: ServicesData = {
    label: data?.label || '',
    title: data?.title || '',
    backgroundText: data?.backgroundText || '',
    services: data?.services || [],
  };

  const updateField = <K extends keyof ServicesData>(field: K, value: ServicesData[K]) => {
    // Preserve any unknown fields from original data, then apply safe defaults and the new value
    onChange({ ...data, ...safeData, [field]: value });
  };

  const generateId = () => `${Date.now()}`;

  return (
    <div className="admin-editor-form">
      <FieldGroup title="Section Header" defaultExpanded>
        <FormInput
          label="Label"
          value={safeData.label}
          onChange={(value) => updateField('label', value)}
          placeholder="Enterprise Work"
        />
        <FormInput
          label="Title"
          value={safeData.title}
          onChange={(value) => updateField('title', value)}
          placeholder="My featured projects"
          required
        />
        <FormInput
          label="Background Text"
          value={safeData.backgroundText}
          onChange={(value) => updateField('backgroundText', value)}
          placeholder="Services"
          helpText="Large text displayed in the background"
        />
      </FieldGroup>

      <FieldGroup title="Services" defaultExpanded>
        <ArrayField
          label="Service Items"
          items={safeData.services}
          onChange={(items) => updateField('services', items)}
          createItem={() => ({
            id: generateId(),
            title: '',
            description: '',
            icon: '',
            image: { url: '', alt: '' },
            dialogTitle: '',
            leadIn: '',
            technologies: [],
            approach: [],
            cta: { title: '', description: '' },
          })}
          itemLabel={(item) => item.title || 'New Service'}
          renderItem={(item, _index, onItemChange) => (
            <div className="admin-editor-nested-fields">
              <FormInput
                label="Service Title"
                value={item.title}
                onChange={(value) => onItemChange({ ...item, title: value })}
                placeholder="AI Workflow Orchestration"
                required
              />
              <FormTextarea
                label="Short Description"
                value={item.description}
                onChange={(value) => onItemChange({ ...item, description: value })}
                placeholder="Brief description of the service..."
                rows={3}
              />
              <FormInput
                label="Icon"
                value={item.icon}
                onChange={(value) => onItemChange({ ...item, icon: value })}
                placeholder="flaticon-vector"
                helpText="Flaticon icon class"
              />

              <div className="admin-nested-section">
                <h4>Service Image</h4>
                <ImagePicker
                  label="Service Image"
                  value={item.image || { url: '', alt: '' }}
                  onChange={(value) => onItemChange({ ...item, image: value })}
                  helpText="Image to display for this service"
                />
              </div>

              <div className="admin-nested-section">
                <h4>Dialog Content</h4>
                <FormInput
                  label="Dialog Title"
                  value={item.dialogTitle || ''}
                  onChange={(value) => onItemChange({ ...item, dialogTitle: value })}
                  placeholder="AI Workflow"
                />
                <FormTextarea
                  label="Lead In"
                  value={item.leadIn || ''}
                  onChange={(value) => onItemChange({ ...item, leadIn: value })}
                  placeholder="Detailed introduction when dialog opens..."
                  rows={4}
                />
              </div>

              <div className="admin-nested-section">
                <h4>Technologies</h4>
                <TagInput
                  label="Technologies Used"
                  value={item.technologies || []}
                  onChange={(value) => onItemChange({ ...item, technologies: value })}
                  placeholder="Add technology and press Enter..."
                  helpText="Technologies or tools used for this service"
                />
              </div>

              <div className="admin-nested-section">
                <h4>Approach</h4>
                <ArrayField
                  label="Approach Steps"
                  items={item.approach || []}
                  onChange={(approaches) => onItemChange({ ...item, approach: approaches })}
                  createItem={() => ({ title: '', content: '' })}
                  itemLabel={(approach) => approach.title || 'New Step'}
                  renderItem={(approach, _approachIndex, onApproachChange) => (
                    <div className="admin-editor-nested-fields">
                      <FormInput
                        label="Step Title"
                        value={approach.title}
                        onChange={(value) => onApproachChange({ ...approach, title: value })}
                        placeholder="Prompt Engineering"
                      />
                      <FormTextarea
                        label="Step Content"
                        value={approach.content}
                        onChange={(value) => onApproachChange({ ...approach, content: value })}
                        placeholder="Describe this approach step..."
                        rows={3}
                      />
                    </div>
                  )}
                />
              </div>

              <div className="admin-nested-section">
                <h4>Call to Action</h4>
                <FormInput
                  label="CTA Title"
                  value={item.cta?.title || ''}
                  onChange={(value) => onItemChange({ ...item, cta: { ...item.cta, title: value } })}
                  placeholder="Have project in mind? Let's discuss"
                />
                <FormTextarea
                  label="CTA Description"
                  value={item.cta?.description || ''}
                  onChange={(value) => onItemChange({ ...item, cta: { ...item.cta, description: value } })}
                  placeholder="Get in touch with us..."
                  rows={2}
                />
              </div>
            </div>
          )}
        />
      </FieldGroup>
    </div>
  );
};

export default ServicesEditor;
