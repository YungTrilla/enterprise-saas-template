import React, { useState, useMemo, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { SkeletonTableRow } from './skeleton';

export interface Column<T> {
  id: string;
  header: string | ReactNode;
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T) => string);
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  getRowId,
  loading = false,
  emptyMessage = 'No data available',
  className,
  headerClassName,
  rowClassName,
  onRowClick,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find(col => col.id === sortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = column.accessor(a);
      const bValue = column.accessor(b);

      // Convert to string for comparison
      const aStr = String(aValue);
      const bStr = String(bValue);

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortColumn, sortDirection, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  // Handle select all
  const isAllSelected = selectable && data.length > 0 && selectedRows.length === data.length;

  const handleSelectAll = () => {
    if (onSelectAll) {
      if (isAllSelected) {
        onSelectAll([]);
      } else {
        onSelectAll(data.map(row => getRowId(row)));
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1);
    if (onSearch) {
      onSearch(query);
    }
  };

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ChevronsUpDown className='h-4 w-4 text-muted-foreground' />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className='h-4 w-4' />;
    }
    return <ChevronDown className='h-4 w-4' />;
  };

  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <div className='space-y-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns.length} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {searchable && (
        <div className='mb-4'>
          <Input
            type='search'
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className='max-w-sm'
          />
        </div>
      )}

      <div className='relative overflow-x-auto rounded-lg border'>
        <table className='w-full text-sm text-left'>
          <thead
            className={cn(
              'text-xs uppercase bg-muted/50',
              stickyHeader && 'sticky top-0 z-10',
              headerClassName
            )}
          >
            <tr>
              {selectable && (
                <th scope='col' className='p-4'>
                  <input
                    type='checkbox'
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className='w-4 h-4 rounded border-gray-300'
                    aria-label='Select all rows'
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.id}
                  scope='col'
                  className={cn(
                    'px-6 py-3',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer select-none hover:bg-muted/70'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}
                  >
                    {column.header}
                    {column.sortable && getSortIcon(column.id)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className='px-6 py-8 text-center text-muted-foreground'
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map(row => {
                const rowId = getRowId(row);
                const isSelected = selectedRows.includes(rowId);
                const rowClassValue =
                  typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      'border-b hover:bg-muted/30 transition-colors',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-muted/50',
                      rowClassValue
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className='p-4' onClick={e => e.stopPropagation()}>
                        <input
                          type='checkbox'
                          checked={isSelected}
                          onChange={() => onSelectRow?.(rowId)}
                          className='w-4 h-4 rounded border-gray-300'
                          aria-label={`Select row ${rowId}`}
                        />
                      </td>
                    )}
                    {columns.map(column => (
                      <td
                        key={column.id}
                        className={cn(
                          'px-6 py-4',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.accessor(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className='flex items-center justify-between mt-4'>
          <div className='text-sm text-muted-foreground'>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, data.length)} of {data.length} entries
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className='flex items-center gap-1'>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const dataTableVariants = {
  size: {
    default: '',
    sm: 'text-xs',
    lg: 'text-base',
  },
  variant: {
    default: '',
    striped: '[&_tbody_tr:nth-child(even)]:bg-muted/30',
    bordered: 'border-separate border-spacing-0',
  },
};
