import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PackageSearch, X, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { Product } from '@/types/schema';
import { toast } from 'sonner';

// --- MOCK API ---
const mockProducts: Product[] = Array.from({ length: 145 }, (_, i) => ({
    id: `prod-${i}`,
    sku: `SKU-${20000 + i}`,
    barcode: `BC-${i}`,
    name: `Pro Inventory Item ${i + 1}`,
    description: 'High quality item for retail.',
    category_id: null,
    supplier_id: null,
    unit_price: Number((Math.random() * 100).toFixed(2)),
    cost_price: Number((Math.random() * 50).toFixed(2)),
    min_stock_level: 10,
    image_url: null,
    is_active: Math.random() > 0.1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Mock joined category for display
    category: {
        id: 'cat-1',
        name: ['Electronics', 'Home Goods', 'Apparel', 'Office'][Math.floor(Math.random() * 4)],
        description: null,
        created_at: new Date().toISOString(),
    },
}));

const fetchProducts = async (): Promise<Product[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate network
    return mockProducts;
};

const createProduct = async (newProduct: Partial<Product>): Promise<Product> => {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network
    const product: Product = {
        id: `prod-new-${Date.now()}`,
        sku: newProduct.sku || `SKU-NEW-${Date.now()}`,
        barcode: null,
        name: newProduct.name || 'New Product',
        description: '',
        category_id: null,
        supplier_id: null,
        unit_price: newProduct.unit_price || 0,
        cost_price: 0,
        min_stock_level: 10,
        image_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    mockProducts.unshift(product);
    return product;
};
// ----------------

const columns: ColumnDef<Product>[] = [
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'name', header: 'Product Name' },
    {
        accessorKey: 'category.name',
        header: 'Category',
        cell: ({ row }) => row.original.category?.name || 'Uncategorized',
    },
    {
        accessorKey: 'unit_price',
        header: 'Price',
        cell: ({ row }) => `$${row.original.unit_price.toFixed(2)}`,
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
            <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                row.original.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
            )}>
                {row.original.is_active ? 'Active' : 'Inactive'}
            </span>
        ),
    },
];

export function ProductsPage() {
    const queryClient = useQueryClient();
    const [isSlideOverOpen, setIsSlideOverOpen] = React.useState(false);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 20 });

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });

    // Mock mutation for product creation
    const mutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsSlideOverOpen(false);
            toast.success('Product created successfully');
        },
        onError: () => {
            toast.error('Failed to create product');
        }
    });

    const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        mutation.mutate({
            name: formData.get('name') as string,
            sku: formData.get('sku') as string,
            unit_price: Number(formData.get('price')),
        });
    };

    // Client-side filtering and slicing since we rely on mock data entirely
    const filteredData = React.useMemo(() => {
        if (!products) return [];
        let filtered = products;
        if (globalFilter) {
            const lowerFilter = globalFilter.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(lowerFilter) ||
                p.sku.toLowerCase().includes(lowerFilter)
            );
        }
        return filtered;
    }, [products, globalFilter]);

    const paginatedData = React.useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        return filteredData.slice(start, start + pagination.pageSize);
    }, [filteredData, pagination]);

    const pageCount = Math.ceil(filteredData.length / pagination.pageSize);

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.5)]">Products</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your catalog, pricing, and master records.
                    </p>
                </div>
                <Button
                    className="shadow-[0_0_15px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.5)] transition-shadow"
                    onClick={() => setIsSlideOverOpen(true)}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col bg-muted/20 backdrop-blur-md border border-white/5 rounded-xl text-card-foreground shadow-lg p-6 relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="mb-4 flex items-center gap-4 relative z-10 shrink-0">
                    <div className="relative max-w-sm w-full">
                        <PackageSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by name or SKU..."
                            className="pl-9"
                            value={globalFilter}
                            onChange={(e) => {
                                setGlobalFilter(e.target.value);
                                setPagination(prev => ({ ...prev, pageIndex: 0 }));
                            }}
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={paginatedData}
                    pageCount={pageCount}
                    totalElements={filteredData.length}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    sorting={[]}
                    onSortingChange={() => { }}
                    isLoading={isLoading}
                />
            </div>

            {/* Slide-over for Create Product */}
            <div className={cn(
                "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-300",
                isSlideOverOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )} onClick={() => setIsSlideOverOpen(false)}>
                <div
                    className={cn(
                        "fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-white/10 bg-black/95 backdrop-blur-2xl shadow-[[-20px_0_50px_rgba(0,0,0,0.5)]] transition-transform duration-300 ease-in-out p-6 flex flex-col",
                        isSlideOverOpen ? "translate-x-0" : "translate-x-full"
                    )}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-semibold">New Product</h2>
                        <Button variant="ghost" size="icon" onClick={() => setIsSlideOverOpen(false)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>

                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">Product Name</label>
                            <Input id="name" name="name" required placeholder="e.g. Ergonomic Office Chair" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="sku" className="text-sm font-medium">SKU</label>
                            <Input id="sku" name="sku" required placeholder="e.g. CHR-001" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="price" className="text-sm font-medium">Unit Price ($)</label>
                            <Input id="price" name="price" type="number" step="0.01" min="0" required placeholder="0.00" />
                        </div>

                        <div className="pt-6 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsSlideOverOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Product
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
