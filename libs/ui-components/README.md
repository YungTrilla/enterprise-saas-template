# @abyss/ui-components

Shared UI component library for Abyss Central suite with dark minimalist theme.

## Features

- 🎨 **Dark Theme First** - Designed for the Abyss Central dark minimalist
  aesthetic
- 🔧 **TypeScript** - Full type safety and IntelliSense support
- 🎯 **Accessible** - Built with accessibility best practices (WCAG 2.1)
- 🎨 **Customizable** - Variants and styling options for different use cases
- 📱 **Responsive** - Mobile-first design approach
- ⚡ **Performance** - Optimized bundle size and tree-shaking support

## Installation

This library is part of the Abyss Central monorepo and is used internally by the
suite applications.

```bash
# From any app within the monorepo
pnpm add @abyss/ui-components
```

## Usage

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DataTable,
} from '@abyss/ui-components';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant='primary'>Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

## Components

### Core Components

- **Button** - Interactive button with variants (default, destructive, outline,
  secondary, ghost, link, success, warning)
- **Input** - Form input with error states, icons, and validation
- **Textarea** - Multi-line text input with auto-resize option
- **Select** - Dropdown select with search, multi-select, and custom rendering
- **Badge** - Status indicators and labels with multiple variants
- **Loading** - Loading states with spinner, pulse, dots, and bars variants
- **Skeleton** - Loading placeholders for content

### Data Display

- **Card** - Container component with header, content, and footer sections
- **DataTable** - Advanced table with sorting, selection, search, and pagination
- **Tabs** - Tabbed navigation for organizing content
- **Tooltip** - Contextual information displayed on hover

### Overlay Components

- **Modal** - Dialog windows with accessibility features and focus management
- **DropdownMenu** - Context menus and action dropdowns with keyboard navigation

### Layout Components

- **Layout** - Main application layout with sidebar, header, and footer
- **Header** - Page header with title, subtitle, and actions
- **Sidebar** - Navigation sidebar with collapse support
- **Footer** - Page footer component

## Component Examples

### DataTable with Advanced Features

```tsx
import { DataTable, Column, Badge } from '@abyss/ui-components';

const columns: Column<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: user => `${user.firstName} ${user.lastName}`,
    sortable: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: user => (
      <Badge variant={user.isActive ? 'success' : 'secondary'}>
        {user.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    accessor: user => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm'>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => handleEdit(user)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleDelete(user)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    align: 'right',
  },
];

<DataTable
  data={users}
  columns={columns}
  getRowId={user => user.id}
  searchable
  searchPlaceholder='Search users...'
  selectable
  selectedRows={selectedIds}
  onSelectRow={handleSelectRow}
  onSelectAll={handleSelectAll}
  pageSize={20}
  loading={isLoading}
  stickyHeader
/>;
```

### Select with Search and Multi-select

```tsx
// Single select with search
<Select
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'Regular User' },
    { value: 'guest', label: 'Guest', disabled: true },
  ]}
  value={role}
  onChange={setRole}
  searchable
  clearable
  placeholder="Select a role..."
/>

// Multi-select
<Select
  multiple
  options={departmentOptions}
  value={selectedDepartments}
  onChange={setSelectedDepartments}
  searchable
  placeholder="Select departments..."
/>
```

### Modal with Confirmation

```tsx
import { Modal, ConfirmModal } from '@abyss/ui-components';

// Standard modal
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit User"
  description="Update user information"
  size="lg"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save Changes</Button>
    </>
  }
>
  <UserForm user={user} />
</Modal>

// Confirmation modal
<ConfirmModal
  open={showDelete}
  onClose={() => setShowDelete(false)}
  title="Delete User"
  message="Are you sure you want to delete this user? This action cannot be undone."
  confirmText="Delete"
  confirmVariant="destructive"
  onConfirm={handleDelete}
  loading={isDeleting}
/>
```

### Tabs Navigation

```tsx
<Tabs defaultValue='overview' onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value='overview'>Overview</TabsTrigger>
    <TabsTrigger value='analytics'>Analytics</TabsTrigger>
    <TabsTrigger value='settings'>Settings</TabsTrigger>
  </TabsList>
  <TabsContent value='overview'>
    <OverviewPanel />
  </TabsContent>
  <TabsContent value='analytics'>
    <AnalyticsPanel />
  </TabsContent>
  <TabsContent value='settings'>
    <SettingsPanel />
  </TabsContent>
</Tabs>
```

### Tooltips

```tsx
<Tooltip content="This action requires admin privileges">
  <Button disabled>
    <Lock className="h-4 w-4 mr-2" />
    Admin Only
  </Button>
</Tooltip>

// With custom positioning
<Tooltip content="Delete this item" side="left" align="center">
  <Button variant="ghost" size="icon">
    <Trash className="h-4 w-4" />
  </Button>
</Tooltip>
```

## Component Variants

### Button Variants

- `default` - Primary action button
- `destructive` - Dangerous actions (delete, remove)
- `outline` - Secondary actions with border
- `secondary` - Secondary actions
- `ghost` - Minimal button without background
- `link` - Link-styled button
- `success` - Success/confirmation actions
- `warning` - Warning/caution actions

### Button Sizes

- `sm` - Small button (32px height)
- `default` - Default button (40px height)
- `lg` - Large button (44px height)
- `xl` - Extra large button (48px height)
- `icon` - Icon-only button (40x40px)

### Badge Variants

- `default` - Standard badge
- `secondary` - Muted badge
- `destructive` - Error/danger state
- `success` - Success state
- `warning` - Warning state
- `outline` - Border only

## Utilities

```tsx
import {
  cn,
  generateId,
  formatFileSize,
  debounce,
  truncateText,
} from '@abyss/ui-components';

// Class name utility for conditional classes
const className = cn(
  'base-classes',
  isActive && 'active-classes',
  isError && 'error-classes'
);

// Generate unique IDs
const id = generateId(); // "abc123def456"

// Format file sizes
formatFileSize(1024); // "1 KB"
formatFileSize(1048576); // "1 MB"

// Debounce function calls
const debouncedSearch = debounce(handleSearch, 300);

// Truncate text with ellipsis
truncateText('Long text here', 10); // "Long text..."
```

## Styling

The library uses Tailwind CSS with CSS custom properties for theming. The dark
theme is applied by default.

### CSS Variables

```css
:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 262.1 83.3% 57.8%;
  --secondary: 217.2 32.6% 17.5%;
  --muted: 217.2 32.6% 17.5%;
  --accent: 217.2 32.6% 17.5%;
  --destructive: 0 62.8% 30.6%;
  --success: 142.1 76.2% 36.3%;
  --warning: 47.9 95.8% 53.1%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 262.1 83.3% 57.8%;
}
```

## TypeScript Support

All components are fully typed with TypeScript:

```tsx
import type {
  ButtonProps,
  DataTableProps,
  Column,
  SelectOption,
  ModalProps,
} from '@abyss/ui-components';

// Type-safe column definitions
const columns: Column<MyDataType>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: row => row.name,
    sortable: true,
  },
];

// Type-safe select options
const options: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2', disabled: true },
];
```

## Accessibility

All components follow WCAG 2.1 guidelines:

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management and trapping
- Screen reader compatibility
- High contrast support

## Development

```bash
# Build the library
pnpm build

# Watch mode for development
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Migration Guides

See [docs/data-table-migration.md](./docs/data-table-migration.md) for examples
of migrating from custom implementations to shared components.

## Design Principles

1. **Consistency** - All components follow the same design patterns and spacing
2. **Accessibility** - WCAG 2.1 compliance with proper ARIA attributes
3. **Performance** - Minimal bundle impact with tree-shaking support
4. **Developer Experience** - Full TypeScript support with IntelliSense
5. **Customization** - Easy to customize while maintaining design consistency

## Contributing

When adding new components:

1. Follow the established component patterns
2. Ensure accessibility compliance
3. Add proper TypeScript types
4. Include tests for new components
5. Update documentation and examples
6. Export from index.ts

---

Built with ❤️ for the Abyss Central Suite
