import * as React from 'react';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type {
    ColumnDef,
    SortingState,
    PaginationState,
    OnChangeFn,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pageCount: number;
    totalElements?: number;
    pagination: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>;
    sorting: SortingState;
    onSortingChange: OnChangeFn<SortingState>;
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    isLoading?: boolean;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    pageCount,
    totalElements,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    globalFilter,
    onGlobalFilterChange,
    isLoading,
}: DataTableProps<TData, TValue>) {
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        pageCount,
        state: {
            pagination,
            sorting,
            globalFilter,
        },
        onPaginationChange,
        onSortingChange,
        onGlobalFilterChange,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    const { rows } = table.getRowModel();

    // Virtualization setup
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 40, // Estimate row height in px
        overscan: 10,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
    const paddingBottom = virtualItems.length > 0
        ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0)
        : 0;

    return (
        <div className="space-y-4">
            {/* Table Toolbar */}
            <div className="flex items-center justify-between">
                {onGlobalFilterChange !== undefined && (
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-md rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Input
                            placeholder="Search all columns..."
                            value={globalFilter ?? ''}
                            onChange={(event) => onGlobalFilterChange(event.target.value)}
                            className="max-w-sm relative z-10 bg-black/40 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary placeholder:text-muted-foreground/50 transition-all"
                        />
                    </div>
                )}
            </div>

            {/* Virtualized Table Container */}
            <div
                ref={tableContainerRef}
                className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-auto max-h-[calc(100vh-16rem)] relative"
            >
                <Table>
                    <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-md z-10 shadow-md border-b border-white/10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
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
                                    Loading data...
                                </TableCell>
                            </TableRow>
                        ) : rows.length ? (
                            <>
                                {paddingTop > 0 && (
                                    <tr>
                                        <td style={{ height: `${paddingTop}px` }} />
                                    </tr>
                                )}
                                {virtualItems.map((virtualRow) => {
                                    const row = rows[virtualRow.index];
                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && 'selected'}
                                            className="border-b border-white/5 hover:bg-primary/5 hover:shadow-[inset_4px_0_0_rgba(0,184,217,0.5)] transition-all"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className="text-muted-foreground/90 group-hover:text-foreground">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })}
                                {paddingBottom > 0 && (
                                    <tr>
                                        <td style={{ height: `${paddingBottom}px` }} />
                                    </tr>
                                )}
                            </>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground/70">
                                    No results found in current tactical view.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground/70 font-mono">
                    {totalElements !== undefined ? `SYS_TOTAL: ${totalElements}` : ''}
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-muted-foreground">Rows per page</p>
                        <select
                            className="h-8 w-[70px] rounded-md border border-white/10 bg-black/40 px-2 text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-muted-foreground"
                            value={table.getState().pagination.pageSize}
                            onChange={(e) => {
                                table.setPageSize(Number(e.target.value));
                            }}
                        >
                            {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                                <option key={pageSize} value={pageSize} className="bg-background">
                                    {pageSize}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of{' '}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex border-white/10 bg-black/20 hover:bg-primary/20 hover:text-primary hover:border-primary/50 hover:shadow-[0_0_10px_rgba(0,184,217,0.2)] transition-all"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            {'<<'}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 border-white/10 bg-black/20 hover:bg-primary/20 hover:text-primary hover:border-primary/50 hover:shadow-[0_0_10px_rgba(0,184,217,0.2)] transition-all"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            {'<'}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 border-white/10 bg-black/20 hover:bg-primary/20 hover:text-primary hover:border-primary/50 hover:shadow-[0_0_10px_rgba(0,184,217,0.2)] transition-all"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            {'>'}
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex border-white/10 bg-black/20 hover:bg-primary/20 hover:text-primary hover:border-primary/50 hover:shadow-[0_0_10px_rgba(0,184,217,0.2)] transition-all"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            {'>>'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
