import { useQuery } from '@tanstack/react-query';
import { Shield, ShieldAlert, ShieldCheck, UserPlus } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { Profile } from '@/types/schema';

// --- MOCK API ---
const mockUsers: Profile[] = [
    {
        id: 'user-auth-1',
        full_name: 'Sarah Connor',
        avatar_url: null,
        branch_id: null,
        role: 'admin',
        is_active: true,
        created_at: new Date(Date.now() - 10000000000).toISOString(),
    },
    {
        id: 'user-auth-2',
        full_name: 'John Smith',
        avatar_url: null,
        branch_id: 'branch-1',
        role: 'manager',
        is_active: true,
        created_at: new Date(Date.now() - 8000000000).toISOString(),
    },
    {
        id: 'user-auth-3',
        full_name: 'Emily Davis',
        avatar_url: null,
        branch_id: 'branch-1',
        role: 'staff',
        is_active: true,
        created_at: new Date(Date.now() - 5000000000).toISOString(),
    },
    {
        id: 'user-auth-4',
        full_name: 'Michael Chang',
        avatar_url: null,
        branch_id: 'branch-2',
        role: 'staff',
        is_active: false,
        created_at: new Date(Date.now() - 2000000000).toISOString(),
    }
];

const fetchUsers = async (): Promise<Profile[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return mockUsers;
};
// ----------------

const getRoleIcon = (role: string) => {
    switch (role) {
        case 'admin': return <ShieldAlert className="mr-1.5 h-4 w-4 text-destructive" />;
        case 'manager': return <ShieldCheck className="mr-1.5 h-4 w-4 text-blue-500" />;
        default: return <Shield className="mr-1.5 h-4 w-4 text-muted-foreground" />;
    }
};

const columns: ColumnDef<Profile>[] = [
    {
        accessorKey: 'full_name',
        header: 'Full Name',
        cell: ({ row }) => <span className="font-medium">{row.original.full_name}</span>
    },
    {
        accessorKey: 'role',
        header: 'RBAC Role',
        cell: ({ row }) => (
            <div className="flex items-center capitalize">
                {getRoleIcon(row.original.role)}
                {row.original.role}
            </div>
        ),
    },
    {
        accessorKey: 'branch_id',
        header: 'Assigned Branch',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.role === 'admin' ? 'All Branches (Global)' : row.original.branch_id || 'Unassigned'}
            </span>
        ),
    },
    {
        accessorKey: 'is_active',
        header: 'Account Status',
        cell: ({ row }) => (
            <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                row.original.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
            )}>
                {row.original.is_active ? 'Active' : 'Suspended'}
            </span>
        ),
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: () => (
            <Button variant="ghost" size="sm">Edit Role</Button>
        )
    }
];

export function UsersPage() {
    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.5)]">User Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage staff access, roles, and branch assignments.
                    </p>
                </div>
                <Button className="shadow-[0_0_15px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.5)] transition-shadow">
                    <UserPlus className="mr-2 h-4 w-4" /> Invite User
                </Button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col bg-muted/20 backdrop-blur-md border border-white/5 rounded-xl text-card-foreground shadow-lg p-6 relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex-1 min-h-0 relative z-10">
                    <DataTable
                        columns={columns}
                        data={users ?? []}
                        pageCount={1}
                        totalElements={users?.length || 0}
                        pagination={{ pageIndex: 0, pageSize: 10 }}
                        onPaginationChange={() => { }}
                        sorting={[]}
                        onSortingChange={() => { }}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
