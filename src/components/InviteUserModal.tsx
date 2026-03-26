import * as React from 'react';
import { X, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { fetchBranches } from '@/api/branches';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
    const queryClient = useQueryClient();
    const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });

    const [email, setEmail] = React.useState('');
    const [fullName, setFullName] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [role, setRole] = React.useState('staff');
    const [branchId, setBranchId] = React.useState('');

    const reset = () => {
        setEmail(''); setFullName(''); setPassword('');
        setRole('staff'); setBranchId(''); setShowPassword(false);
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post('/users/create', {
                email,
                password,
                full_name: fullName,
                role,
                branch_id: branchId || null,
            });
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || 'User created!');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
            reset();
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail;
            toast.error(detail ? `Failed: ${detail}` : 'Failed to create user.');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div
                className="w-full max-w-md rounded-xl border border-white/10 bg-card shadow-[0_0_40px_rgba(0,184,217,0.15)] overflow-hidden animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold">Create Team Member</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { onClose(); reset(); }}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form
                    onSubmit={e => { e.preventDefault(); mutation.mutate(); }}
                    className="p-6 space-y-4"
                >
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name *</label>
                        <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address *</label>
                        <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password *</label>
                        <div className="relative">
                            <Input
                                required
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                minLength={6}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">The user can change this after first login.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="staff" className="bg-background">Staff</option>
                                <option value="manager" className="bg-background">Manager</option>
                                <option value="admin" className="bg-background">Admin</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Branch</label>
                            <select
                                value={branchId}
                                onChange={e => setBranchId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="" className="bg-background">None</option>
                                {branches?.map(b => (
                                    <option key={b.id} value={b.id} className="bg-background">{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => { onClose(); reset(); }} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="shadow-[0_0_15px_rgba(0,184,217,0.3)]">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
