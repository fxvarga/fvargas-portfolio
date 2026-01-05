# Building an Enterprise Data Grid with FluentUI 8's DetailsList

FluentUI 8's `DetailsList` is Microsoft's battle-tested data grid component, powering applications like Outlook, SharePoint, and Teams. In this tutorial, we'll build a comprehensive data grid implementation with sorting, filtering, pagination, inline editing, grouping, and export functionality.

## What We're Building

Our enterprise data grid includes:

- **ShimmeredDetailsList** for loading states with skeleton animations
- **Selection class** for built-in row selection management
- **IColumn interface** for column configuration with sorting and resizing
- **IGroup interface** for collapsible row grouping by category
- **CommandBar** for toolbar actions (Refresh, Export)
- **SearchBox & Dropdown** for powerful filtering
- **TextField** for inline cell editing
- **ThemeProvider** for consistent Microsoft styling

TIP: Toggle the feature buttons in the demo above to see how each capability works independently!

## Prerequisites

Before we start, make sure you have:

- React 18+ with TypeScript
- FluentUI React installed: `npm install @fluentui/react`
- Basic understanding of React hooks and TypeScript

## Step 1: Install FluentUI and Initialize Icons

First, install the required packages:

```bash
npm install @fluentui/react @fluentui/react-icons
```

Then initialize FluentUI icons at your application entry point:

```tsx
import { initializeIcons } from '@fluentui/react/lib/Icons';

// Call this once at app startup
initializeIcons();
```

## Step 2: Define Your Data Types

Create TypeScript interfaces for type-safe grid operations:

```tsx
interface Employee {
  key: string;           // Required by DetailsList
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  startDate: string;
  status: 'Active' | 'On Leave' | 'Remote';
  performance: number;
}
```

NOTE: The `key` property is required by DetailsList for efficient rendering and selection tracking.

## Step 3: Set Up the Selection Class

FluentUI's `Selection` class handles row selection state automatically:

```tsx
import { Selection, SelectionMode } from '@fluentui/react/lib/DetailsList';

const [selection] = useState(() => new Selection({
  onSelectionChanged: () => {
    console.log('Selected items:', selection.getSelection());
  },
}));
```

The Selection class provides methods like:
- `getSelection()` - Get selected items
- `getSelectedCount()` - Get selection count
- `setAllSelected(isSelected)` - Select/deselect all
- `isKeySelected(key)` - Check if specific item is selected

## Step 4: Configure Columns with IColumn

FluentUI's `IColumn` interface provides comprehensive column configuration:

```tsx
import { IColumn, ColumnActionsMode } from '@fluentui/react/lib/DetailsList';

const columns: IColumn[] = [
  {
    key: 'name',
    name: 'Name',
    fieldName: 'name',
    minWidth: 120,
    maxWidth: 200,
    isResizable: true,
    isSorted: sortColumn === 'name',
    isSortedDescending: sortColumn === 'name' && isSortedDescending,
    onColumnClick: () => handleSort('name'),
    columnActionsMode: ColumnActionsMode.clickable,
    onRender: (item: Employee) => (
      <Text>{item.name}</Text>
    ),
  },
  {
    key: 'status',
    name: 'Status',
    fieldName: 'status',
    minWidth: 80,
    maxWidth: 120,
    onRender: (item: Employee) => (
      <StatusBadge status={item.status} />
    ),
  },
  // ... more columns
];
```

Key IColumn properties:
- `isResizable` - Enable column drag-to-resize
- `isSorted` / `isSortedDescending` - Show sort indicators
- `onColumnClick` - Handle column header clicks
- `onRender` - Custom cell rendering function
- `columnActionsMode` - Control header click behavior

## Step 5: Create Custom Cell Renderers

### Status Badge with FluentUI Styling

```tsx
import { mergeStyleSets } from '@fluentui/react/lib/Styling';

const classNames = mergeStyleSets({
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    display: 'inline-block',
  },
  statusActive: {
    backgroundColor: '#dff6dd',
    color: '#107c10',
  },
  statusRemote: {
    backgroundColor: '#deecf9',
    color: '#0078d4',
  },
});

const StatusBadge: React.FC<{ status: Employee['status'] }> = ({ status }) => {
  const statusClass = status === 'Active' 
    ? classNames.statusActive 
    : classNames.statusRemote;
  
  return (
    <span className={`${classNames.statusBadge} ${statusClass}`}>
      {status}
    </span>
  );
};
```

### Performance Bar with Dynamic Colors

```tsx
const PerformanceBar: React.FC<{ value: number }> = ({ value }) => {
  const getColor = () => {
    if (value >= 90) return '#107c10';  // Green
    if (value >= 80) return '#ffaa44';  // Yellow
    return '#d13438';                    // Red
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ 
        width: '80px', 
        backgroundColor: '#edebe9', 
        borderRadius: '4px',
        overflow: 'hidden' 
      }}>
        <div style={{ 
          width: `${value}%`, 
          height: '8px',
          backgroundColor: getColor(),
          transition: 'width 0.3s ease'
        }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 500 }}>{value}%</span>
    </div>
  );
};
```

## Step 6: Implement Inline Editing

Use FluentUI's TextField for seamless inline editing:

```tsx
import { TextField } from '@fluentui/react/lib/TextField';
import { IconButton } from '@fluentui/react/lib/Button';

const EditableCell: React.FC<{
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number';
}> = ({ value, onSave, type = 'text' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  const handleSave = () => {
    const newValue = type === 'number' ? Number(editValue) : editValue;
    onSave(newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') {
      setEditValue(String(value));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <TextField
        value={editValue}
        onChange={(_, newValue) => setEditValue(newValue || '')}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
      <span>{value}</span>
      <IconButton
        iconProps={{ iconName: 'Edit' }}
        styles={{ root: { marginLeft: '4px', height: '20px' } }}
      />
    </div>
  );
};
```

TIP: Always handle both Enter (save) and Escape (cancel) keys for professional UX.

## Step 7: Add Row Grouping with IGroup

FluentUI's grouping feature organizes data into collapsible sections:

```tsx
import { IGroup, GroupHeader, IDetailsGroupDividerProps } from '@fluentui/react/lib/DetailsList';

// Create groups from data
const groups: IGroup[] = useMemo(() => {
  const groupMap: Record<string, Employee[]> = {};
  
  items.forEach(item => {
    if (!groupMap[item.department]) {
      groupMap[item.department] = [];
    }
    groupMap[item.department].push(item);
  });

  let startIndex = 0;
  return Object.entries(groupMap).map(([department, groupItems]) => {
    const group: IGroup = {
      key: department,
      name: department,
      startIndex,
      count: groupItems.length,
      level: 0,
    };
    startIndex += groupItems.length;
    return group;
  });
}, [items]);

// Custom group header
const onRenderGroupHeader = (props?: IDetailsGroupDividerProps) => {
  if (!props) return null;
  
  return (
    <GroupHeader
      {...props}
      styles={{
        root: { backgroundColor: '#f3f2f1' },
        title: { fontWeight: 600 },
      }}
    />
  );
};
```

## Step 8: Use ShimmeredDetailsList for Loading States

FluentUI provides built-in loading shimmer animations:

```tsx
import { ShimmeredDetailsList } from '@fluentui/react/lib/DetailsList';

<ShimmeredDetailsList
  items={items}
  columns={columns}
  groups={groups}
  groupProps={{ onRenderHeader: onRenderGroupHeader }}
  setKey="set"
  layoutMode={DetailsListLayoutMode.justified}
  constrainMode={ConstrainMode.unconstrained}
  selection={selection}
  selectionMode={SelectionMode.multiple}
  selectionPreservedOnEmptyClick={true}
  checkboxVisibility={CheckboxVisibility.onHover}
  enableShimmer={isLoading}
  shimmerLines={5}
  ariaLabelForSelectionColumn="Toggle selection"
  ariaLabelForSelectAllCheckbox="Toggle selection for all"
/>
```

## Step 9: Build the Toolbar with CommandBar

FluentUI's CommandBar provides a familiar Office-style toolbar:

```tsx
import { CommandBar, ICommandBarItemProps } from '@fluentui/react/lib/CommandBar';

const commandBarItems: ICommandBarItemProps[] = [
  {
    key: 'refresh',
    text: 'Refresh',
    iconProps: { iconName: 'Refresh' },
    onClick: () => refreshData(),
  },
  {
    key: 'export',
    text: 'Export CSV',
    iconProps: { iconName: 'Download' },
    onClick: () => exportToCSV(),
  },
];

const farItems: ICommandBarItemProps[] = [
  {
    key: 'selected',
    text: `${selection.getSelectedCount()} selected`,
    disabled: true,
  },
];

<CommandBar
  items={commandBarItems}
  farItems={farItems}
/>
```

## Step 10: Add Filter Controls

Combine SearchBox and Dropdown for powerful filtering:

```tsx
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { Stack } from '@fluentui/react/lib/Stack';

const departmentOptions: IDropdownOption[] = [
  { key: '', text: 'All Departments' },
  { key: 'Engineering', text: 'Engineering' },
  { key: 'Design', text: 'Design' },
  { key: 'Marketing', text: 'Marketing' },
];

<Stack horizontal tokens={{ childrenGap: 12 }}>
  <SearchBox
    placeholder="Search name, email, or role..."
    value={searchText}
    onChange={(_, value) => setSearchText(value || '')}
    styles={{ root: { width: 250 } }}
  />
  <Dropdown
    placeholder="All Departments"
    options={departmentOptions}
    selectedKey={departmentFilter}
    onChange={(_, option) => setDepartmentFilter(option?.key as string)}
    styles={{ root: { width: 180 } }}
  />
</Stack>
```

## Step 11: Apply Custom Theming

Use ThemeProvider for consistent styling across your grid:

```tsx
import { ThemeProvider, createTheme } from '@fluentui/react/lib/Theme';

const customTheme = createTheme({
  palette: {
    themePrimary: '#0078d4',
    themeDark: '#005a9e',
    neutralLighter: '#f3f2f1',
    neutralLight: '#edebe9',
    neutralPrimary: '#323130',
  },
});

<ThemeProvider theme={customTheme}>
  <div className="fluentui-datagrid-demo">
    {/* Your grid components */}
  </div>
</ThemeProvider>
```

## Step 12: Implement CSV Export

Add data export functionality:

```tsx
const exportToCSV = useCallback(() => {
  const headers = ['Name', 'Email', 'Department', 'Role', 'Salary', 'Status'];
  const rows = items.map(e => [
    e.name, e.email, e.department, e.role, e.salary, e.status
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'employee-data.csv';
  link.click();
}, [items]);
```

## Complete Implementation

Here's the full component structure:

```tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  DetailsList,
  ShimmeredDetailsList,
  DetailsListLayoutMode,
  Selection,
  SelectionMode,
  IColumn,
  IGroup,
  ConstrainMode,
  CheckboxVisibility,
} from '@fluentui/react/lib/DetailsList';
import { CommandBar } from '@fluentui/react/lib/CommandBar';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { Dropdown } from '@fluentui/react/lib/Dropdown';
import { Stack } from '@fluentui/react/lib/Stack';
import { ThemeProvider, createTheme } from '@fluentui/react/lib/Theme';
import { initializeIcons } from '@fluentui/react/lib/Icons';

initializeIcons();

const FluentUIDataGrid: React.FC = () => {
  const [items, setItems] = useState<Employee[]>(sampleData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selection] = useState(() => new Selection());

  // Filter, sort, group, and render your data...
  
  return (
    <ThemeProvider theme={customTheme}>
      <CommandBar items={toolbarItems} />
      <Stack horizontal tokens={{ childrenGap: 12 }}>
        <SearchBox ... />
        <Dropdown ... />
      </Stack>
      <ShimmeredDetailsList
        items={processedItems}
        columns={columns}
        groups={groups}
        selection={selection}
        enableShimmer={isLoading}
      />
    </ThemeProvider>
  );
};
```

## FluentUI DetailsList vs Custom Implementation

| Feature | DetailsList | Custom Grid |
|---------|-------------|-------------|
| Selection Management | Built-in Selection class | Manual state |
| Virtualization | Built-in (1000+ rows) | Requires react-window |
| Column Resizing | `isResizable` prop | Manual implementation |
| Grouping | `groups` + `IGroup` | Manual rendering |
| Loading States | ShimmeredDetailsList | Custom skeleton |
| Accessibility | ARIA built-in | Manual implementation |
| Keyboard Navigation | Full support | Manual implementation |
| Theming | ThemeProvider | CSS variables |

## Performance Tips

WARNING: For datasets larger than 10,000 rows, DetailsList automatically virtualizes, but consider server-side pagination.

1. **Use `setKey` prop** - Helps React identify the list instance for efficient updates
2. **Memoize columns and groups** - Prevent unnecessary re-renders
3. **Use `selectionPreservedOnEmptyClick`** - Maintain selection when clicking empty space
4. **Debounce search input** - Reduce filtering operations

```tsx
const [searchInput, setSearchInput] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setSearchText(searchInput);
  }, 300);
  return () => clearTimeout(timer);
}, [searchInput]);
```

## Accessibility

FluentUI DetailsList provides excellent accessibility out of the box:

- **Screen reader support** - Proper ARIA roles and labels
- **Keyboard navigation** - Arrow keys, Enter, Space
- **Focus management** - Visible focus indicators
- **Selection announcements** - Screen reader feedback

Add custom ARIA labels for better context:

```tsx
<DetailsList
  ariaLabelForSelectionColumn="Toggle selection"
  ariaLabelForSelectAllCheckbox="Toggle selection for all items"
  checkButtonAriaLabel="select row"
/>
```

## Conclusion

FluentUI 8's DetailsList provides a production-ready data grid with enterprise features built-in. By leveraging the Selection class, IColumn configuration, IGroup for grouping, and ShimmeredDetailsList for loading states, you can build powerful data-driven applications with minimal custom code.

The component architecture is designed for extensibility - add features like drag-and-drop column reordering, frozen columns, or integration with state management libraries as needed.

---

## Related Tutorials

- [Building a Workflow Execution GUI](/blog/workflow-execution-gui)
- [Creating Animated Counters](/blog/animated-counters)
- [Magnetic Button Effects](/blog/magnetic-button-effect)
