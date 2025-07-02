# DataTable Migration Guide

This guide shows how to migrate from custom table implementations to the shared DataTable component.

## Before (Custom Table)

```tsx
// apps/web/src/components/users/UserTable.tsx
<div className="relative overflow-x-auto">
  <table className="w-full text-sm text-left">
    <thead className="text-xs uppercase bg-muted/50">
      <tr>
        <th scope="col" className="p-4">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => onSelectAll(e.target.checked ? allUserIds : [])}
          />
        </th>
        <th scope="col" className="px-6 py-3">Name</th>
        <th scope="col" className="px-6 py-3">Email</th>
        {/* ... more headers */}
      </tr>
    </thead>
    <tbody>
      {users.map((user) => (
        <tr key={user.id} className="border-b hover:bg-muted/30">
          {/* ... table cells */}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## After (Using DataTable)

```tsx
import { DataTable, Column, Badge, Button, DropdownMenu } from '@abyss/ui-components';
import { Eye, Edit, MoreHorizontal } from 'lucide-react';

const columns: Column<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: (user) => (
      <Link to={`/users/${user.id}`} className="hover:text-primary font-medium">
        {user.firstName} {user.lastName}
      </Link>
    ),
    sortable: true,
  },
  {
    id: 'email',
    header: 'Email / Username',
    accessor: (user) => (
      <div>
        <div>{user.email}</div>
        <div className="text-xs text-muted-foreground">@{user.username}</div>
      </div>
    ),
    sortable: true,
  },
  {
    id: 'roles',
    header: 'Role',
    accessor: (user) => (
      <div className="flex flex-wrap gap-1">
        {user.roles.map((role) => (
          <Badge key={role} variant={getRoleBadgeVariant(role)} size="sm">
            {role.replace(/_/g, ' ')}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (user) => (
      <Badge variant={user.isActive ? 'success' : 'secondary'} size="sm">
        {user.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    accessor: (user) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/users/${user.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/users/${user.id}/edit`)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user.isActive ? (
              <DropdownMenuItem onSelect={() => onDeactivate(user.id)}>
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onActivate(user.id)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(user.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    align: 'right',
    width: '120px',
  },
];

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  isLoading,
}) => {
  return (
    <DataTable
      data={users}
      columns={columns}
      getRowId={(user) => user.id}
      selectable
      selectedRows={selectedUsers}
      onSelectRow={onSelectUser}
      onSelectAll={onSelectAll}
      searchable
      searchPlaceholder="Search users..."
      loading={isLoading}
      pageSize={10}
      stickyHeader
      emptyMessage="No users found"
    />
  );
};
```

## Features

### 1. Built-in Sorting
```tsx
{
  id: 'name',
  header: 'Name',
  accessor: (user) => `${user.firstName} ${user.lastName}`,
  sortable: true, // Enable sorting for this column
}
```

### 2. Selection Support
```tsx
<DataTable
  selectable
  selectedRows={selectedIds}
  onSelectRow={(id) => setSelectedIds([...selectedIds, id])}
  onSelectAll={(ids) => setSelectedIds(ids)}
/>
```

### 3. Search Functionality
```tsx
<DataTable
  searchable
  searchPlaceholder="Search by name, email..."
  onSearch={(query) => {
    // Filter your data based on search query
    const filtered = users.filter(user => 
      user.name.includes(query) || user.email.includes(query)
    );
    setFilteredUsers(filtered);
  }}
/>
```

### 4. Loading States
```tsx
<DataTable
  loading={isLoading}
  data={users}
  columns={columns}
/>
```

### 5. Custom Row Styling
```tsx
<DataTable
  rowClassName={(user) => user.isVip ? 'bg-yellow-100' : ''}
  onRowClick={(user) => navigate(`/users/${user.id}`)}
/>
```

### 6. Pagination
```tsx
<DataTable
  data={users}
  columns={columns}
  pageSize={20} // Automatically handles pagination
/>
```

## Advanced Usage

### Custom Column Rendering
```tsx
const columns: Column<Order>[] = [
  {
    id: 'total',
    header: 'Total',
    accessor: (order) => (
      <span className="font-mono">
        ${order.total.toFixed(2)}
      </span>
    ),
    align: 'right',
    sortable: true,
  },
  {
    id: 'status',
    header: (
      <div className="flex items-center gap-2">
        <span>Status</span>
        <Tooltip content="Order fulfillment status">
          <Info className="h-4 w-4" />
        </Tooltip>
      </div>
    ),
    accessor: (order) => <OrderStatusBadge status={order.status} />,
  },
];
```

### With Filters
```tsx
const [statusFilter, setStatusFilter] = useState('all');

const filteredData = useMemo(() => {
  if (statusFilter === 'all') return orders;
  return orders.filter(order => order.status === statusFilter);
}, [orders, statusFilter]);

return (
  <>
    <Select
      value={statusFilter}
      onChange={setStatusFilter}
      options={[
        { value: 'all', label: 'All Orders' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
      ]}
    />
    <DataTable
      data={filteredData}
      columns={columns}
      getRowId={(order) => order.id}
    />
  </>
);
```

## Benefits of Migration

1. **Consistency**: All tables look and behave the same way
2. **Accessibility**: Built-in ARIA labels and keyboard navigation
3. **Performance**: Optimized rendering with memoization
4. **Features**: Sorting, selection, search, and pagination out of the box
5. **Maintenance**: Single source of truth for table behavior
6. **Type Safety**: Full TypeScript support with generics