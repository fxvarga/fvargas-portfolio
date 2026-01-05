/**
 * FluentUI Data Grid Demo Component
 * 
 * A comprehensive data grid implementation using FluentUI 8's DetailsList
 * with sorting, filtering, pagination, column resizing, row selection,
 * inline editing, grouping, and export functionality.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  DetailsListLayoutMode,
  Selection,
  SelectionMode,
  IColumn,
  IGroup,
  ColumnActionsMode,
  ConstrainMode,
  IDetailsListStyles,
  CheckboxVisibility,
  IDetailsGroupDividerProps,
} from '@fluentui/react/lib/DetailsList';
import { ShimmeredDetailsList } from '@fluentui/react/lib/ShimmeredDetailsList';
import { GroupHeader } from '@fluentui/react/lib/GroupedList';
import { TextField } from '@fluentui/react/lib/TextField';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { CommandBar, ICommandBarItemProps } from '@fluentui/react/lib/CommandBar';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { Stack } from '@fluentui/react/lib/Stack';
import { Text } from '@fluentui/react/lib/Text';
import { IconButton } from '@fluentui/react/lib/Button';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import { ThemeProvider, createTheme } from '@fluentui/react/lib/Theme';
import './FluentUIDataGrid.css';

// Initialize FluentUI icons
initializeIcons();

// ============================================================================
// Types
// ============================================================================

interface Employee {
  key: string;
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

// ============================================================================
// Theme
// ============================================================================

const customTheme = createTheme({
  palette: {
    themePrimary: '#0078d4',
    themeLighterAlt: '#eff6fc',
    themeLighter: '#deecf9',
    themeLight: '#c7e0f4',
    themeTertiary: '#71afe5',
    themeSecondary: '#2b88d8',
    themeDarkAlt: '#106ebe',
    themeDark: '#005a9e',
    themeDarker: '#004578',
    neutralLighterAlt: '#faf9f8',
    neutralLighter: '#f3f2f1',
    neutralLight: '#edebe9',
    neutralQuaternaryAlt: '#e1dfdd',
    neutralQuaternary: '#d0d0d0',
    neutralTertiaryAlt: '#c8c6c4',
    neutralTertiary: '#a19f9d',
    neutralSecondary: '#605e5c',
    neutralPrimaryAlt: '#3b3a39',
    neutralPrimary: '#323130',
    neutralDark: '#201f1e',
    black: '#000000',
    white: '#ffffff',
  },
});

// ============================================================================
// Styles
// ============================================================================

const classNames = mergeStyleSets({
  wrapper: {
    height: '100%',
    position: 'relative' as const,
  },
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
  statusLeave: {
    backgroundColor: '#fff4ce',
    color: '#797673',
  },
  statusRemote: {
    backgroundColor: '#deecf9',
    color: '#0078d4',
  },
  performanceBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  performanceFill: {
    height: '8px',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  performanceValue: {
    fontSize: '12px',
    fontWeight: 500,
    minWidth: '35px',
  },
  editableCell: {
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f3f2f1',
    },
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderTop: '1px solid #edebe9',
    backgroundColor: '#faf9f8',
  },
  paginationInfo: {
    fontSize: '13px',
    color: '#605e5c',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pageButton: {
    minWidth: '32px',
    height: '32px',
  },
  featureToggles: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#f3f2f1',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  toggleButton: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #c8c6c4',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  toggleButtonActive: {
    backgroundColor: '#0078d4',
    color: '#ffffff',
    borderColor: '#0078d4',
  },
});

const detailsListStyles: Partial<IDetailsListStyles> = {
  root: {
    overflowX: 'auto',
  },
  headerWrapper: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 1,
  },
};

// ============================================================================
// Sample Data
// ============================================================================

const generateSampleData = (): Employee[] => [
  { key: '1', id: '1', name: 'Sarah Johnson', email: 'sarah.j@company.com', department: 'Engineering', role: 'Senior Developer', salary: 125000, startDate: '2020-03-15', status: 'Active', performance: 92 },
  { key: '2', id: '2', name: 'Michael Chen', email: 'michael.c@company.com', department: 'Engineering', role: 'Tech Lead', salary: 145000, startDate: '2019-06-01', status: 'Active', performance: 95 },
  { key: '3', id: '3', name: 'Emily Rodriguez', email: 'emily.r@company.com', department: 'Design', role: 'UX Designer', salary: 95000, startDate: '2021-01-10', status: 'Remote', performance: 88 },
  { key: '4', id: '4', name: 'James Wilson', email: 'james.w@company.com', department: 'Marketing', role: 'Marketing Manager', salary: 110000, startDate: '2018-09-22', status: 'Active', performance: 85 },
  { key: '5', id: '5', name: 'Amanda Lee', email: 'amanda.l@company.com', department: 'HR', role: 'HR Specialist', salary: 75000, startDate: '2022-04-05', status: 'Active', performance: 90 },
  { key: '6', id: '6', name: 'David Kim', email: 'david.k@company.com', department: 'Engineering', role: 'Frontend Developer', salary: 105000, startDate: '2021-08-15', status: 'Active', performance: 87 },
  { key: '7', id: '7', name: 'Jessica Brown', email: 'jessica.b@company.com', department: 'Sales', role: 'Sales Executive', salary: 85000, startDate: '2020-11-30', status: 'On Leave', performance: 91 },
  { key: '8', id: '8', name: 'Robert Taylor', email: 'robert.t@company.com', department: 'Engineering', role: 'Backend Developer', salary: 115000, startDate: '2019-02-14', status: 'Remote', performance: 89 },
  { key: '9', id: '9', name: 'Lisa Wang', email: 'lisa.w@company.com', department: 'Design', role: 'Product Designer', salary: 100000, startDate: '2020-07-20', status: 'Active', performance: 93 },
  { key: '10', id: '10', name: 'Christopher Martinez', email: 'chris.m@company.com', department: 'Finance', role: 'Financial Analyst', salary: 90000, startDate: '2021-03-08', status: 'Active', performance: 86 },
  { key: '11', id: '11', name: 'Nicole Adams', email: 'nicole.a@company.com', department: 'Marketing', role: 'Content Strategist', salary: 80000, startDate: '2022-01-15', status: 'Remote', performance: 84 },
  { key: '12', id: '12', name: 'Daniel Thompson', email: 'daniel.t@company.com', department: 'Engineering', role: 'DevOps Engineer', salary: 130000, startDate: '2019-10-05', status: 'Active', performance: 94 },
  { key: '13', id: '13', name: 'Rachel Green', email: 'rachel.g@company.com', department: 'HR', role: 'Recruiter', salary: 70000, startDate: '2022-06-20', status: 'Active', performance: 82 },
  { key: '14', id: '14', name: 'Kevin Patel', email: 'kevin.p@company.com', department: 'Sales', role: 'Account Manager', salary: 95000, startDate: '2020-04-12', status: 'Active', performance: 88 },
  { key: '15', id: '15', name: 'Samantha White', email: 'sam.w@company.com', department: 'Engineering', role: 'QA Engineer', salary: 95000, startDate: '2021-05-25', status: 'Active', performance: 90 },
];

// ============================================================================
// Custom Cell Renderers
// ============================================================================

const StatusBadge: React.FC<{ status: Employee['status'] }> = ({ status }) => {
  const statusClass = status === 'Active' 
    ? classNames.statusActive 
    : status === 'On Leave' 
      ? classNames.statusLeave 
      : classNames.statusRemote;
  
  return (
    <span className={`${classNames.statusBadge} ${statusClass}`}>
      {status}
    </span>
  );
};

const PerformanceBar: React.FC<{ value: number }> = ({ value }) => {
  const getColor = () => {
    if (value >= 90) return '#107c10';
    if (value >= 80) return '#ffaa44';
    return '#d13438';
  };

  return (
    <div className={classNames.performanceBar}>
      <div style={{ width: '80px', backgroundColor: '#edebe9', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          className={classNames.performanceFill}
          style={{ width: `${value}%`, backgroundColor: getColor() }}
        />
      </div>
      <span className={classNames.performanceValue}>{value}%</span>
    </div>
  );
};

// ============================================================================
// Editable Cell Component
// ============================================================================

interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number';
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, type = 'text' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  const handleSave = () => {
    const newValue = type === 'number' ? Number(editValue) : editValue;
    onSave(newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
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
        styles={{ root: { width: '100%' } }}
      />
    );
  }

  return (
    <div className={classNames.editableCell} onClick={() => setIsEditing(true)}>
      <span>{type === 'number' && typeof value === 'number' ? `$${value.toLocaleString()}` : value}</span>
      <IconButton
        iconProps={{ iconName: 'Edit' }}
        styles={{ root: { marginLeft: '4px', height: '20px', width: '20px' } }}
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      />
    </div>
  );
};

// ============================================================================
// Main Data Grid Demo Component
// ============================================================================

interface DemoProps {
  className?: string;
}

const FluentUIDataGridDemo: React.FC<DemoProps> = ({ className }) => {
  // State
  const [items, setItems] = useState<Employee[]>(generateSampleData);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [isSortedDescending, setIsSortedDescending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [enableGrouping, setEnableGrouping] = useState(false);

  // Feature toggles for demo
  const [features, setFeatures] = useState({
    sorting: true,
    filtering: true,
    pagination: true,
    selection: true,
    inlineEdit: true,
    grouping: false,
    resizing: true,
  });

  // Selection
  const [selection] = useState(() => new Selection({
    onSelectionChanged: () => {
      // Selection changed - you can handle this event
    },
  }));

  // Get unique values for filters
  const departments = useMemo(() => 
    [...new Set(items.map(e => e.department))].sort(),
    [items]
  );

  const departmentOptions: IDropdownOption[] = useMemo(() => [
    { key: '', text: 'All Departments' },
    ...departments.map(d => ({ key: d, text: d })),
  ], [departments]);

  const statusOptions: IDropdownOption[] = [
    { key: '', text: 'All Statuses' },
    { key: 'Active', text: 'Active' },
    { key: 'On Leave', text: 'On Leave' },
    { key: 'Remote', text: 'Remote' },
  ];

  const pageSizeOptions: IDropdownOption[] = [
    { key: 5, text: '5 per page' },
    { key: 10, text: '10 per page' },
    { key: 25, text: '25 per page' },
  ];

  // Handle inline edit save
  const handleSaveCell = useCallback((id: string, field: keyof Employee, value: string | number) => {
    if (!features.inlineEdit) return;
    
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, [features.inlineEdit]);

  // Handle column click for sorting
  const onColumnClick = useCallback((columnKey: string) => {
    if (!features.sorting) return;

    if (sortColumn === columnKey) {
      setIsSortedDescending(!isSortedDescending);
    } else {
      setSortColumn(columnKey);
      setIsSortedDescending(false);
    }
  }, [sortColumn, isSortedDescending, features.sorting]);

  // Column definitions
  const columns: IColumn[] = useMemo(() => [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 120,
      maxWidth: 200,
      isResizable: features.resizing,
      isSorted: sortColumn === 'name',
      isSortedDescending: sortColumn === 'name' && isSortedDescending,
      onColumnClick: features.sorting ? () => onColumnClick('name') : undefined,
      columnActionsMode: features.sorting ? ColumnActionsMode.clickable : ColumnActionsMode.disabled,
      onRender: (item: Employee) => features.inlineEdit ? (
        <EditableCell
          value={item.name}
          onSave={(value) => handleSaveCell(item.id, 'name', value)}
        />
      ) : (
        <Text>{item.name}</Text>
      ),
    },
    {
      key: 'email',
      name: 'Email',
      fieldName: 'email',
      minWidth: 150,
      maxWidth: 250,
      isResizable: features.resizing,
      isSorted: sortColumn === 'email',
      isSortedDescending: sortColumn === 'email' && isSortedDescending,
      onColumnClick: features.sorting ? () => onColumnClick('email') : undefined,
      columnActionsMode: features.sorting ? ColumnActionsMode.clickable : ColumnActionsMode.disabled,
    },
    {
      key: 'department',
      name: 'Department',
      fieldName: 'department',
      minWidth: 100,
      maxWidth: 150,
      isResizable: features.resizing,
      isSorted: sortColumn === 'department',
      isSortedDescending: sortColumn === 'department' && isSortedDescending,
      onColumnClick: features.sorting ? () => onColumnClick('department') : undefined,
      columnActionsMode: features.sorting ? ColumnActionsMode.clickable : ColumnActionsMode.disabled,
    },
    {
      key: 'role',
      name: 'Role',
      fieldName: 'role',
      minWidth: 120,
      maxWidth: 180,
      isResizable: features.resizing,
      isSorted: sortColumn === 'role',
      isSortedDescending: sortColumn === 'role' && isSortedDescending,
      onColumnClick: features.sorting ? () => onColumnClick('role') : undefined,
      columnActionsMode: features.sorting ? ColumnActionsMode.clickable : ColumnActionsMode.disabled,
    },
    {
      key: 'salary',
      name: 'Salary',
      fieldName: 'salary',
      minWidth: 100,
      maxWidth: 130,
      isResizable: features.resizing,
      isSorted: sortColumn === 'salary',
      isSortedDescending: sortColumn === 'salary' && isSortedDescending,
      onColumnClick: features.sorting ? () => onColumnClick('salary') : undefined,
      columnActionsMode: features.sorting ? ColumnActionsMode.clickable : ColumnActionsMode.disabled,
      onRender: (item: Employee) => features.inlineEdit ? (
        <EditableCell
          value={item.salary}
          onSave={(value) => handleSaveCell(item.id, 'salary', value)}
          type="number"
        />
      ) : (
        <Text>${item.salary.toLocaleString()}</Text>
      ),
    },
    {
      key: 'status',
      name: 'Status',
      fieldName: 'status',
      minWidth: 80,
      maxWidth: 120,
      isResizable: features.resizing,
      isSorted: sortColumn === 'status',
      isSortedDescending: sortColumn === 'status' && isSortedDescending,
      onColumnClick: features.sorting ? () => onColumnClick('status') : undefined,
      columnActionsMode: features.sorting ? ColumnActionsMode.clickable : ColumnActionsMode.disabled,
      onRender: (item: Employee) => <StatusBadge status={item.status} />,
    },
    {
      key: 'performance',
      name: 'Performance',
      fieldName: 'performance',
      minWidth: 140,
      maxWidth: 180,
      isResizable: features.resizing,
      isSorted: sortColumn === 'performance',
      isSortedDescending: sortColumn === 'performance' && isSortedDescending,
      onColumnClick: features.sorting ? () => onColumnClick('performance') : undefined,
      columnActionsMode: features.sorting ? ColumnActionsMode.clickable : ColumnActionsMode.disabled,
      onRender: (item: Employee) => <PerformanceBar value={item.performance} />,
    },
  ], [sortColumn, isSortedDescending, features, handleSaveCell, onColumnClick]);

  // Filter and sort data
  const processedItems = useMemo(() => {
    let result = [...items];

    // Apply filters
    if (features.filtering) {
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        result = result.filter(e =>
          e.name.toLowerCase().includes(searchLower) ||
          e.email.toLowerCase().includes(searchLower) ||
          e.role.toLowerCase().includes(searchLower)
        );
      }
      if (departmentFilter) {
        result = result.filter(e => e.department === departmentFilter);
      }
      if (statusFilter) {
        result = result.filter(e => e.status === statusFilter);
      }
    }

    // Apply sorting
    if (features.sorting && sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn as keyof Employee];
        const bVal = b[sortColumn as keyof Employee];
        
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        }
        
        return isSortedDescending ? -comparison : comparison;
      });
    }

    return result;
  }, [items, searchText, departmentFilter, statusFilter, sortColumn, isSortedDescending, features]);

  // Create groups if enabled
  const groups: IGroup[] | undefined = useMemo(() => {
    if (!features.grouping || !enableGrouping) return undefined;

    const groupMap: Record<string, Employee[]> = {};
    processedItems.forEach(item => {
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
  }, [processedItems, features.grouping, enableGrouping]);

  // Paginate data
  const paginatedItems = useMemo(() => {
    if (!features.pagination || enableGrouping) return processedItems;
    
    const start = (currentPage - 1) * pageSize;
    return processedItems.slice(start, start + pageSize);
  }, [processedItems, currentPage, pageSize, features.pagination, enableGrouping]);

  const totalPages = Math.ceil(processedItems.length / pageSize);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = ['Name', 'Email', 'Department', 'Role', 'Salary', 'Start Date', 'Status', 'Performance'];
    const rows = items.map(e => [
      e.name,
      e.email,
      e.department,
      e.role,
      e.salary,
      e.startDate,
      e.status,
      e.performance
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

  // Simulate loading
  const simulateLoading = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setItems(generateSampleData());
      setIsLoading(false);
    }, 1500);
  }, []);

  // Command bar items
  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: simulateLoading,
    },
    {
      key: 'export',
      text: 'Export CSV',
      iconProps: { iconName: 'Download' },
      onClick: exportToCSV,
    },
  ];

  const commandBarFarItems: ICommandBarItemProps[] = features.selection ? [
    {
      key: 'selected',
      text: `${selection.getSelectedCount()} selected`,
      disabled: true,
    },
  ] : [];

  // Toggle feature
  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
    if (feature === 'grouping') {
      setEnableGrouping(!features.grouping);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchText('');
    setDepartmentFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Custom group header render
  const onRenderGroupHeader = (props?: IDetailsGroupDividerProps): JSX.Element | null => {
    if (!props) return null;
    
    return (
      <GroupHeader
        {...props}
        styles={{
          root: {
            backgroundColor: '#f3f2f1',
          },
          title: {
            fontWeight: 600,
          },
        }}
      />
    );
  };

  return (
    <ThemeProvider theme={customTheme}>
      <div className={`fluentui-datagrid-demo ${className || ''}`}>
        <div className="demo-header">
          <Text variant="xLarge" block>FluentUI DetailsList Demo</Text>
          <Text variant="medium" style={{ color: '#605e5c' }}>
            Enterprise-grade data grid using FluentUI 8's DetailsList component
          </Text>
        </div>

        {/* Feature Toggles */}
        <div className={classNames.featureToggles}>
          <Text variant="smallPlus" style={{ marginRight: '8px', fontWeight: 600 }}>Toggle Features:</Text>
          {Object.entries(features).map(([key, enabled]) => (
            <button
              key={key}
              className={`${classNames.toggleButton} ${enabled ? classNames.toggleButtonActive : ''}`}
              onClick={() => toggleFeature(key as keyof typeof features)}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <CommandBar
          items={commandBarItems}
          farItems={commandBarFarItems}
          styles={{ root: { padding: '0', marginBottom: '8px' } }}
        />

        {/* Filters */}
        {features.filtering && (
          <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginBottom: '16px' }}>
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
              onChange={(_, option) => setDepartmentFilter(option?.key as string || '')}
              styles={{ root: { width: 180 } }}
            />
            <Dropdown
              placeholder="All Statuses"
              options={statusOptions}
              selectedKey={statusFilter}
              onChange={(_, option) => setStatusFilter(option?.key as string || '')}
              styles={{ root: { width: 150 } }}
            />
            {(searchText || departmentFilter || statusFilter) && (
              <IconButton
                iconProps={{ iconName: 'ClearFilter' }}
                title="Clear filters"
                onClick={resetFilters}
              />
            )}
          </Stack>
        )}

        {/* Data Grid */}
        <div className={classNames.wrapper}>
          <ShimmeredDetailsList
            items={enableGrouping ? processedItems : paginatedItems}
            columns={columns}
            groups={groups}
            groupProps={{
              onRenderHeader: onRenderGroupHeader,
            }}
            setKey="set"
            layoutMode={DetailsListLayoutMode.justified}
            constrainMode={ConstrainMode.unconstrained}
            selection={selection}
            selectionMode={features.selection ? SelectionMode.multiple : SelectionMode.none}
            selectionPreservedOnEmptyClick={true}
            checkboxVisibility={features.selection ? CheckboxVisibility.onHover : CheckboxVisibility.hidden}
            enableShimmer={isLoading}
            shimmerLines={pageSize}
            styles={detailsListStyles}
            ariaLabelForSelectionColumn="Toggle selection"
            ariaLabelForSelectAllCheckbox="Toggle selection for all items"
            checkButtonAriaLabel="select row"
          />
        </div>

        {/* Empty State */}
        {!isLoading && processedItems.length === 0 && (
          <Stack horizontalAlign="center" style={{ padding: '40px' }}>
            <Text variant="large">No results found</Text>
            <Text variant="medium" style={{ color: '#605e5c', marginTop: '8px' }}>
              Try adjusting your search or filter criteria
            </Text>
            <IconButton
              iconProps={{ iconName: 'Refresh' }}
              text="Reset Filters"
              onClick={resetFilters}
              style={{ marginTop: '16px' }}
            />
          </Stack>
        )}

        {/* Pagination */}
        {features.pagination && !isLoading && processedItems.length > 0 && !enableGrouping && (
          <div className={classNames.pagination}>
            <Text className={classNames.paginationInfo}>
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, processedItems.length)} of {processedItems.length} items
            </Text>
            <div className={classNames.paginationControls}>
              <Dropdown
                options={pageSizeOptions}
                selectedKey={pageSize}
                onChange={(_, option) => {
                  setPageSize(option?.key as number);
                  setCurrentPage(1);
                }}
                styles={{ root: { width: 120 } }}
              />
              <IconButton
                iconProps={{ iconName: 'ChevronLeft' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              />
              <Text style={{ padding: '0 12px' }}>
                Page {currentPage} of {totalPages}
              </Text>
              <IconButton
                iconProps={{ iconName: 'ChevronRight' }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              />
            </div>
          </div>
        )}

        {/* Demo Info */}
        <div className="demo-info" style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f3f2f1', borderRadius: '4px' }}>
          <Text variant="mediumPlus" block style={{ fontWeight: 600, marginBottom: '12px' }}>
            FluentUI DetailsList Features Used
          </Text>
          <Stack tokens={{ childrenGap: 8 }}>
            <Text>• <strong>DetailsList & ShimmeredDetailsList</strong> - Core grid component with loading shimmer</Text>
            <Text>• <strong>Selection</strong> - Built-in row selection with SelectionMode.multiple</Text>
            <Text>• <strong>IColumn</strong> - Column configuration with sorting, resizing, and custom renderers</Text>
            <Text>• <strong>IGroup</strong> - Grouping rows by department with collapsible headers</Text>
            <Text>• <strong>CommandBar</strong> - Toolbar with actions (Refresh, Export)</Text>
            <Text>• <strong>SearchBox & Dropdown</strong> - Filter controls</Text>
            <Text>• <strong>TextField</strong> - Inline editing with Enter/Escape key handling</Text>
            <Text>• <strong>ThemeProvider</strong> - Consistent theming across components</Text>
          </Stack>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default FluentUIDataGridDemo;
