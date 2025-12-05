'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  skeletonRows?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  skeletonRows = 5,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const coreRowModel = useMemo(() => getCoreRowModel<TData>(), []);
  const sortedRowModel = useMemo(() => getSortedRowModel<TData>(), []);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isSortable = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      isSortable &&
                        'cursor-pointer select-none hover:text-white/80 transition-colors'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {isSortable && (
                        <span className="text-white/40">
                          {sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sortDirection === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </tr>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Skeleton loading rows
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <TableRow
                key={`skeleton-${rowIndex}`}
                index={rowIndex}
                isAnimated={true}
                className="animate-pulse"
              >
                {columns.map((_, colIndex) => (
                  <TableCell key={`skeleton-cell-${colIndex}`}>
                    <Skeleton
                      className={cn(
                        'h-4',
                        colIndex === 0 ? 'w-20' : colIndex === 1 ? 'w-40' : 'w-14'
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                index={index}
                isAnimated={true}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow isAnimated={false}>
              <TableCell colSpan={columns.length} className="h-24 text-center text-white/40">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
