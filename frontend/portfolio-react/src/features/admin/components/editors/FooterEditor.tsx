import React from 'react';
import { ImagePicker } from '../form';

interface FooterData {
  logo: {
    url: string;
    alt: string;
  };
}

interface FooterEditorProps {
  data: FooterData;
  onChange: (data: FooterData) => void;
}

const FooterEditor: React.FC<FooterEditorProps> = ({ data, onChange }) => {
  const handleLogoChange = (logo: { url: string; alt: string }) => {
    onChange({ ...data, logo });
  };

  // Ensure data has proper structure
  const safeData: FooterData = {
    logo: data?.logo || { url: '', alt: '' },
  };

  return (
    <div className="admin-editor-form">
      <ImagePicker
        label="Footer Logo"
        value={safeData.logo}
        onChange={handleLogoChange}
        helpText="The logo displayed in the footer section"
      />
    </div>
  );
};

export default FooterEditor;
