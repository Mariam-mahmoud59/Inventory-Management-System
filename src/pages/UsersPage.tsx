import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Shield, ShieldAlert, ShieldCheck, UserPlus, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import { fetchUsers, updateUserRole, deleteUser, type ProfileWithBranch } from '@/api/users';
import { toast } from 'sonner';
import { InviteUserModal } from '@/components/InviteUserModal';

const getRoleIcon = (role: string) => {
    switch (role) {
        case 'admin': return <ShieldAlert className="mr-1.5 h-4 w-4 text-destructive" />;
        case 'manager': return <ShieldCheck className="mr-1.5 h-4 w-4 text-blue-500" />;
        default: return <Shield className="mr-1.5 h-4 w-4 text-muted-foreground" />;
    }
};

const RoleCell = ({ row }: { row: any }) => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (newRole: string) => updateUserRole(row.original.id, newRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Role updated successfully');
        },
        onError: (err: any) => toast.error(`Failed to update role: ${err.response?.data?.detail || err.message}`)
    });

    return (
        <select
            className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary cursor-pointer hover:bg-white/5 outline-none transition-colors"
            value={row.original.role}
            onChange={(e) => mutation.mutate(e.target.value)}
            disabled={mutation.isPending}
        >
            <option className="bg-background text-foreground" value="admin">Admin</option>
            <option className="bg-background text-foreground" value="manager">Manager</option>
            <option className="bg-background text-foreground" value="staff">Staff</option>
        </select>
    );
};

const DeleteCell = ({ row }: { row: any }) => {
    const queryClient = useQueryClient();
    const [confirming, setConfirming] = React.useState(false);
    const mutation = useMutation({
        mutationFn: () => deleteUser(row.original.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted');
        },
        onError: (err: any) => toast.error(`Delete failed: ${err.response?.data?.detail || err.message}`),
        onSettled: () => setConfirming(false),
    });

    if (confirming) {
        return (
            <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Sure?</span>
                <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                    {mutation.isPending ? '...' : 'Yes, delete'}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setConfirming(false)}>Cancel</Button>
            </div>
        );
    }

    return (
        <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirming(true)}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
};

const columns: ColumnDef<ProfileWithBranch>[] = [
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
                {row.original.role === 'admin' ? 'All Branches (Global)' : row.original.branches?.name || 'Unassigned'}
            </span>
        ),
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
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
        id: 'role_action',
        header: 'Change Role',
        cell: RoleCell
    },
    {
        id: 'delete',
        header: '',
        cell: DeleteCell
    }
];

export function UsersPage() {
    const [isInviteOpen, setIsInviteOpen] = React.useState(false);
    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
        retry: false, // Don't retry auth errors
    });

    if (error) {
        const status = (error as any).response?.status;
        if (status === 403) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-destructive/20 bg-destructive/10 mt-12 mx-auto max-w-lg shadow-[0_0_30px_rgba(220,38,38,0.15)]">
                    <ShieldAlert className="h-16 w-16 text-destructive mb-4 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h2>
                    <p className="text-muted-foreground">You do not have the required Administrator clearance to view or manage staff accounts.</p>
                </div>
            );
        }
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <InviteUserModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
            <div className="shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.5)]">User Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage staff access, roles, and branch assignments.
                    </p>
                </div>
                <Button
                    onClick={() => setIsInviteOpen(true)}
                    className="shadow-[0_0_15px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.5)] transition-shadow"
                >
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
