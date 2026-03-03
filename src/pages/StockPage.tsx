import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useAdjustStockMutation } from '@/api/mutations/useStockMutations';
import type { StockLevel } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransferStockModal } from '@/components/TransferStockModal';

// Mock Fetcher for demonstration
const fetchStockLevels = async (): Promise<StockLevel[]> => {
    await new Promise((res) => setTimeout(res, 500));
    return [
        {
            id: 'uuid-1',
            product_id: 'prod-1',
            branch_id: 'branch-1',
            quantity: 120,
            updated_at: new Date().toISOString(),
            product: {
                id: 'prod-1',
                sku: 'SKU-1001',
                name: 'Ergonomic Office Chair',
                unit_price: 199.99,
                cost_price: 100,
                min_stock_level: 50,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                barcode: null,
                description: null,
                category_id: null,
                supplier_id: null,
                image_url: null,
            },
        }
    ];
};

export function StockPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['stock'],
        queryFn: fetchStockLevels,
    });

    const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);

    const { mutate: adjustStock, isPending } = useAdjustStockMutation();

    const handleQuickAdjust = (row: StockLevel, change: number) => {
        adjustStock({
            product_id: row.product_id,
            branch_id: row.branch_id,
            quantity_change: change,
            txn_type: change > 0 ? 'adjustment_in' : 'adjustment_out',
            performed_by: 'current-user-uuid',
            notes: 'Quick adjust from UI',
        });
    };

    const columns: ColumnDef<StockLevel>[] = [
        {
            accessorKey: 'product.sku',
            header: 'SKU',
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.product?.sku}</span>
        },
        {
            accessorKey: 'product.name',
            header: 'Product Name',
            cell: ({ row }) => <span className="font-medium">{row.original.product?.name}</span>
        },
        {
            accessorKey: 'quantity',
            header: 'Current Quantity',
            cell: ({ row }) => {
                const isLowStock = row.original.quantity <= (row.original.product?.min_stock_level || 0);
                return (
                    <span className={cn(
                        "font-bold text-lg px-2.5 py-1 rounded-md",
                        isLowStock ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                        {row.original.quantity} {isLowStock && '!'}
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: 'Quick Adjust (Optimistic)',
            cell: ({ row }) => {
                return (
                    <div className="flex items-center space-x-1.5 bg-muted/50 p-1 rounded-lg w-max border">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive shrink-0"
                            onClick={() => handleQuickAdjust(row.original, -10)}
                            disabled={isPending || row.original.quantity < 10}
                        >
                            -10
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive shrink-0"
                            onClick={() => handleQuickAdjust(row.original, -1)}
                            disabled={isPending || row.original.quantity < 1}
                        >
                            -1
                        </Button>

                        <div className="w-px h-6 bg-border mx-1" />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-emerald-500/10 hover:text-emerald-500 shrink-0"
                            onClick={() => handleQuickAdjust(row.original, 1)}
                            disabled={isPending}
                        >
                            +1
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-emerald-500/10 hover:text-emerald-500 shrink-0"
                            onClick={() => handleQuickAdjust(row.original, 10)}
                            disabled={isPending}
                        >
                            +10
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.5)]">Stock Levels</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage inventory counts and perform quick adjustments.
                    </p>
                </div>
                <Button
                    className="shadow-[0_0_15px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.5)] transition-shadow"
                    onClick={() => setIsTransferModalOpen(true)}
                >
                    <Box className="mr-2 h-4 w-4" /> Transfer Stock
                </Button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col bg-muted/20 backdrop-blur-md border border-white/5 rounded-xl text-card-foreground shadow-lg p-6 relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex-1 min-h-0 relative z-10">
                    <DataTable
                        columns={columns}
                        data={data ?? []}
                        pageCount={1}
                        isLoading={isLoading}
                        pagination={{ pageIndex: 0, pageSize: 10 }}
                        onPaginationChange={() => { }}
                        sorting={[]}
                        onSortingChange={() => { }}
                    />
                </div>
            </div>

            <TransferStockModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
            />
        </div>
    );
}
