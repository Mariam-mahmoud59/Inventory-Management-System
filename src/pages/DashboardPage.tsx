import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { CommandPalette } from '@/components/CommandPalette';
import type { ColumnDef } from '@tanstack/react-table';

// Mock API call to simulate data fetching for dashboard statistics
const fetchDashboardStats = async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
        totalProducts: 1240,
        activeOrders: 48,
        lowStockAlerts: 12,
        inventoryValue: 1450000.5,
    };
};

type MockProduct = {
    id: string;
    sku: string;
    name: string;
    category: string;
    stockLevel: number;
    status: string;
};

// Generates an array of at least 1,000 objects for testing virtualization
const generateMockProducts = (count: number): MockProduct[] => {
    const categories = ['Electronics', 'Furniture', 'Office Supplies', 'Apparel', 'Accessories'];
    const statuses = ['Active', 'Active', 'Active', 'Low Stock', 'Discontinued'];
    return Array.from({ length: count }, (_, i) => ({
        id: `prod-${i}`,
        sku: `SKU-${10000 + i}`,
        name: `Virtual Test Product ${i + 1}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        stockLevel: Math.floor(Math.random() * 1000),
        status: statuses[Math.floor(Math.random() * statuses.length)],
    }));
};

const columns: ColumnDef<MockProduct>[] = [
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'name', header: 'Product Name' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'stockLevel', header: 'Stock Level' },
    { accessorKey: 'status', header: 'Status' },
];

export function DashboardPage() {
    const { data: statsData, isLoading: statsLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: fetchDashboardStats,
    });

    // Generate 1000 mock rows, memoized so it only happens once
    const mockData = React.useMemo(() => generateMockProducts(1000), []);

    const formattedValue = !statsData?.inventoryValue
        ? '$0.00'
        : new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(statsData.inventoryValue);

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-destructive/20 bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">Failed to load dashboard data</h2>
                <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <CommandPalette />

            <div className="shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.5)]">Dashboard Overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time insights across all inventory branches. (Press <kbd className="px-1 py-0.5 rounded-md bg-muted border text-xs">Cmd+K</kbd> to test palette)
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/20 hover:border-primary/50 hover:bg-primary/10 text-primary transition-all duration-300 backdrop-blur-md"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
                    Refresh
                </Button>
            </div>

            <div className="shrink-0 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Products"
                    value={statsLoading ? null : statsData?.totalProducts}
                    icon={Package}
                    trend="+4.2% from last month"
                    iconClassName="text-blue-500"
                />
                <StatCard
                    title="Active Orders"
                    value={statsLoading ? null : statsData?.activeOrders}
                    icon={TrendingUp}
                    trend="+12 this week"
                    iconClassName="text-emerald-500"
                />
                <StatCard
                    title="Low Stock Alerts"
                    value={statsLoading ? null : statsData?.lowStockAlerts}
                    icon={AlertCircle}
                    trend="Requires action"
                    iconClassName="text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"
                    isAlert
                />
                <StatCard
                    title="Total Value"
                    value={statsLoading ? null : formattedValue}
                    icon={Package} // Can use currency icon
                    trend="Across 3 branches"
                    iconClassName="text-indigo-500"
                />
            </div>

            <div className="flex-1 min-h-0 flex flex-col bg-muted/20 backdrop-blur-md border border-white/5 rounded-xl text-card-foreground shadow-lg p-6 relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="shrink-0 font-semibold text-lg mb-4 text-primary/90 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Product Inventory (Virtualization Test - 1000 rows)
                </h3>
                <div className="flex-1 min-h-0 relative z-10">
                    <DataTable
                        columns={columns}
                        data={mockData}
                        pageCount={1}
                        pagination={{ pageIndex: 0, pageSize: 50 }}
                        onPaginationChange={() => { }}
                        sorting={[]}
                        onSortingChange={() => { }}
                    />
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string | number | null | undefined;
    icon: React.ElementType;
    trend: string;
    iconClassName?: string;
    isAlert?: boolean;
}

// Sub-component for Dashboard Widgets
function StatCard({ title, value, icon: Icon, trend, iconClassName, isAlert }: StatCardProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border border-white/5 bg-muted/20 backdrop-blur-md p-6 transition-all duration-300",
            "hover:border-primary/30 hover:bg-muted/30 hover:shadow-[0_0_15px_rgba(0,184,217,0.15)] group",
            isAlert && "border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        )}>
            {/* Subtle top-edge highlight on hover */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                isAlert && "via-amber-500/50"
            )} />

            <div className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <h3 className="tracking-tight text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</h3>
                <Icon className={cn("h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110 duration-300", iconClassName)} />
            </div>
            <div className="mt-2 relative z-10">
                {value === null ? (
                    <div className="h-8 w-24 animate-pulse rounded-md bg-muted/50" />
                ) : (
                    <div className={cn(
                        "text-2xl font-bold tracking-tight",
                        isAlert ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "text-foreground drop-shadow-sm"
                    )}>{value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            </div>

            {/* Decorative background glow blob */}
            <div className={cn(
                "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none",
                isAlert ? "bg-amber-500" : "bg-primary"
            )} />
        </div>
    );
}
