import React from 'react';

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
    <div className="admin-array-field">
      <div className="admin-array-field-header">
        <label>{label}</label>
        <button
          type="button"
          className="admin-btn admin-btn-sm admin-btn-primary"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          + Add
        </button>
      </div>
      <div className="admin-array-field-items">
        {items.length === 0 ? (
          <div className="admin-array-field-empty">
            No items yet. Click "Add" to create one.
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index} className="admin-array-field-item">
              <div className="admin-array-field-item-header">
                <span className="admin-array-field-item-label">
                  {itemLabel ? itemLabel(item, index) : `Item ${index + 1}`}
                </span>
                <div className="admin-array-field-item-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-secondary"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-secondary"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    onClick={() => handleRemove(index)}
                    disabled={!canRemove}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="admin-array-field-item-content">
                {renderItem(item, index, (newItem) => handleItemChange(index, newItem))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ArrayField;
