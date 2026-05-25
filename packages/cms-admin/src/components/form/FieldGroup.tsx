import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

interface FieldGroupProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  description?: string;
}

const useStyles = makeStyles({
  description: {
    color: tokens.colorNeutralForeground3,
    marginLeft: tokens.spacingHorizontalS,
    fontSize: '13px',
  },
  panel: {
    paddingTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
});

const FieldGroup: React.FC<FieldGroupProps> = ({
  title,
  children,
  defaultExpanded = true,
  description,
}) => {
  const styles = useStyles();

  return (
    <Accordion
      defaultOpenItems={defaultExpanded ? ['field-group'] : []}
      collapsible
    >
      <AccordionItem value="field-group">
        <AccordionHeader>
          {title}
          {description && (
            <Text className={styles.description} size={200}>
              {description}
            </Text>
          )}
        </AccordionHeader>
        <AccordionPanel className={styles.panel}>
          {children}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export default FieldGroup;
