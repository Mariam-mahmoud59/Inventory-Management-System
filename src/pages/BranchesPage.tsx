import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Store, CheckCircle2, XCircle, Loader2, X } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { Branch } from '@/types/schema';
import { toast } from 'sonner';

// --- MOCK API ---
const mockBranches: Branch[] = [
    {
        id: 'branch-1',
        name: 'Main Warehouse',
        address: '123 Logistics Way, Port City, CA 90210',
        phone: '+1 (555) 019-8234',
        is_active: true,
        created_at: new Date(Date.now() - 30000000000).toISOString(),
    },
    {
        id: 'branch-2',
        name: 'Downtown Retail Store',
        address: '456 Commerce Blvd, Metro Center, NY 10001',
        phone: '+1 (555) 012-4455',
        is_active: true,
        created_at: new Date(Date.now() - 15000000000).toISOString(),
    },
    {
        id: 'branch-3',
        name: 'Westside Outlet',
        address: '789 Sunset Strip, Westside, CA 90046',
        phone: '+1 (555) 018-9999',
        is_active: false,
        created_at: new Date(Date.now() - 5000000000).toISOString(),
    },
];

const fetchBranches = async (): Promise<Branch[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return mockBranches;
};
// ----------------

export function BranchesPage() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

    const { data: branches, isLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: fetchBranches,
    });

    const addMutation = useMutation({
        mutationFn: async (data: Partial<Branch>) => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            const newBranch: Branch = {
                id: `branch-new-${Date.now()}`,
                name: data.name!,
                address: data.address || null,
                phone: data.phone || null,
                is_active: true,
                created_at: new Date().toISOString(),
            };
            mockBranches.push(newBranch);
            return newBranch;
        },
        onSuccess: () => {
            toast.success('Branch location added successfully');
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            setIsAddModalOpen(false);
        },
        onError: () => toast.error('Failed to add branch')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (branch: Branch) => {
            await new Promise((resolve) => setTimeout(resolve, 400));
            // Mutate mock data so it persists in the session
            const target = mockBranches.find(b => b.id === branch.id);
            if (target) target.is_active = !target.is_active;
            return { ...branch, is_active: !branch.is_active };
        },
        onSuccess: (updatedBranch) => {
            toast.success(`${updatedBranch.name} is now ${updatedBranch.is_active ? 'Active' : 'Inactive'}`);
            queryClient.invalidateQueries({ queryKey: ['branches'] });
        },
        // Optimistic UI could be added here, but leaving simple for brevity
    });

    const columns: ColumnDef<Branch>[] = [
        {
            accessorKey: 'name',
            header: 'Branch Name',
            cell: ({ row }) => (
                <div className="flex items-center font-medium">
                    <Store className="mr-2 h-4 w-4 text-muted-foreground" />
                    {row.original.name}
                </div>
            )
        },
        { accessorKey: 'address', header: 'Address' },
        { accessorKey: 'phone', header: 'Contact Phone' },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <button
                        onClick={() => toggleStatusMutation.mutate(row.original)}
                        disabled={toggleStatusMutation.isPending}
                        className={cn(
                            "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors w-max",
                            isActive
                                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        )}
                        title="Click to toggle status"
                    >
                        {isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                );
            },
        },
        {
            id: 'actions',
            header: '',
            cell: () => <Button variant="ghost" size="sm">Edit Details</Button>
        }
    ];

    const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        addMutation.mutate({
            name: formData.get('name') as string,
            address: formData.get('address') as string,
            phone: formData.get('phone') as string,
        });
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.5)]">Branches</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage physical store locations, warehouses, and fulfillment centers.
                    </p>
                </div>
                <Button
                    className="shadow-[0_0_15px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.5)] transition-shadow"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Building2 className="mr-2 h-4 w-4" /> Add Branch
                </Button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col bg-muted/20 backdrop-blur-md border border-white/5 rounded-xl text-card-foreground shadow-lg p-6 relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex-1 min-h-0 relative z-10">
                    <DataTable
                        columns={columns}
                        data={branches ?? []}
                        pageCount={1}
                        totalElements={branches?.length || 0}
                        pagination={{ pageIndex: 0, pageSize: 10 }}
                        onPaginationChange={() => { }}
                        sorting={[]}
                        onSortingChange={() => { }}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* Add Branch Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
                    <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/95 backdrop-blur-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Add New Location</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">Branch Name</label>
                                <Input id="name" name="name" required placeholder="e.g. Northside Retail Hub" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="address" className="text-sm font-medium">Full Address</label>
                                <Input id="address" name="address" placeholder="123 Main St, City, ST 12345" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-medium">Contact Phone</label>
                                <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" />
                            </div>
                            <div className="pt-4 flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={addMutation.isPending}>
                                    {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Branch
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
