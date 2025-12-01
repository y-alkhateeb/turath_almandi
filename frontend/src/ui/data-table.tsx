/**
 * DataTable Component
 * Generic reusable data table using TanStack Table + shadcn UI
 *
 * Features:
 * - Client-side sorting
 * - Server-side pagination
 * - Loading states
 * - Empty states
 * - RTL support for Arabic
 * - Responsive design
 * - Meta context for custom actions (view, edit, delete)
 */

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnMeta,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/ui/button';
import { Icon } from '@/components/icon';

// ============================================
// TYPES
// ============================================

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;
  meta?: any; // Custom meta for actions (onView, onEdit, onDelete, etc.)
}

// ============================================
// PAGINATION COMPONENT
// ============================================

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-between px-2" dir="rtl">
      <div className="text-sm text-[var(--text-secondary)]">
        صفحة {page} من {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
        >
          <Icon icon="solar:double-alt-arrow-right-bold-duotone" className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
        >
          <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
        >
          <Icon icon="solar:alt-arrow-left-linear" className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
        >
          <Icon icon="solar:double-alt-arrow-left-bold-duotone" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// DATA TABLE COMPONENT
// ============================================

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  pagination,
  onPageChange,
  meta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    meta, // Pass meta context to all cells
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <TableHead
                      key={header.id}
                      className="text-right"
                      style={{
                        width: header.column.columnDef.size
                          ? `${header.column.columnDef.size}px`
                          : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={canSort ? 'flex items-center gap-2 cursor-pointer select-none' : ''}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <Icon
                              icon={
                                isSorted === 'asc'
                                  ? 'solar:sort-vertical-bold'
                                  : isSorted === 'desc'
                                    ? 'solar:sort-vertical-bold'
                                    : 'solar:sort-bold'
                              }
                              className={`h-4 w-4 ${isSorted ? 'text-primary-600' : 'text-gray-400'}`}
                            />
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Icon icon="solar:loader-bold-duotone" className="h-6 w-6 animate-spin text-primary-600" />
                    <span className="text-[var(--text-secondary)]">جاري التحميل...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-right">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Icon icon="solar:folder-open-bold-duotone" className="h-12 w-12 text-gray-400" />
                    <span className="text-[var(--text-secondary)]">لا توجد بيانات</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && onPageChange && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
