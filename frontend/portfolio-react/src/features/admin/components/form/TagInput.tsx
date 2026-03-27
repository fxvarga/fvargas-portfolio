import React, { useState, KeyboardEvent } from 'react';
import {
  Field,
  Input,
  InteractionTag,
  InteractionTagPrimary,
  TagGroup,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  helpText?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
  },
});

const TagInput: React.FC<TagInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Type and press Enter...',
  helpText,
}) => {
  const styles = useStyles();
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleRemove = (_e: React.MouseEvent | React.KeyboardEvent, data: { value: string }) => {
    onChange(value.filter((tag) => tag !== data.value));
  };

  return (
    <Field label={label} hint={helpText}>
      <div className={styles.root}>
        {value.length > 0 && (
          <TagGroup onDismiss={handleRemove} className={styles.tagsRow}>
            {value.map((tag) => (
              <InteractionTag
                key={tag}
                shape="rounded"
                size="small"
                value={tag}
              >
                <InteractionTagPrimary hasSecondaryAction>{tag}</InteractionTagPrimary>
              </InteractionTag>
            ))}
          </TagGroup>
        )}
        <Input
          value={inputValue}
          onChange={(_e, data) => setInputValue(data.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          size="small"
        />
      </div>
    </Field>
  );
};

export default TagInput;
