import React from 'react';
import {
  Button,
  Text,
  Card,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  AddRegular,
  ArrowUpRegular,
  ArrowDownRegular,
  DismissRegular,
} from '@fluentui/react-icons';

interface ArrayFieldProps<T> {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, onChange: (item: T) => void) => React.ReactNode;
  createItem: () => T;
  itemLabel?: (item: T, index: number) => string;
  maxItems?: number;
  minItems?: number;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: '13px',
    letterSpacing: '-0.01em',
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemCard: {
    borderLeft: `3px solid ${tokens.colorNeutralStroke2}`,
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  itemLabel: {
    fontSize: '12px',
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground2,
  },
  itemActions: {
    display: 'flex',
    gap: '2px',
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    padding: '16px',
    textAlign: 'center' as const,
    fontSize: '13px',
  },
});

function ArrayField<T>({
  label,
  items,
  onChange,
  renderItem,
  createItem,
  itemLabel,
  maxItems,
  minItems = 0,
}: ArrayFieldProps<T>) {
  const styles = useStyles();

  const handleAdd = () => {
    if (maxItems && items.length >= maxItems) return;
    onChange([...items, createItem()]);
  };

  const handleRemove = (index: number) => {
    if (items.length <= minItems) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleItemChange = (index: number, item: T) => {
    const newItems = [...items];
    newItems[index] = item;
    onChange(newItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
  };

  const canAdd = !maxItems || items.length < maxItems;
  const canRemove = items.length > minItems;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Text weight="semibold" className={styles.headerLabel}>{label}</Text>
        <Button
          appearance="subtle"
          size="small"
          icon={<AddRegular />}
          onClick={handleAdd}
          disabled={!canAdd}
        >
          Add
        </Button>
      </div>
      <div className={styles.items}>
        {items.length === 0 ? (
          <Text className={styles.empty}>
            No items yet. Click &ldquo;Add&rdquo; to create one.
          </Text>
        ) : (
          items.map((item, index) => (
            <Card key={index} size="small" className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <Text weight="semibold" className={styles.itemLabel}>
                  {itemLabel ? itemLabel(item, index) : `Item ${index + 1}`}
                </Text>
                <div className={styles.itemActions}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowUpRegular />}
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  />
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowDownRegular />}
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    title="Move down"
                  />
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<DismissRegular />}
                    onClick={() => handleRemove(index)}
                    disabled={!canRemove}
                    title="Remove"
                  />
                </div>
              </div>
              {renderItem(item, index, (newItem) => handleItemChange(index, newItem))}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default ArrayField;
