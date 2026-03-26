import { Bell, Shield, ShieldCheck, ShieldAlert, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

function fetchNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/notifications/').then(r => r.data).catch(() => []);
}

function markAllRead(): Promise<void> {
    return apiClient.post('/notifications/mark-all-read').then(() => undefined).catch(() => undefined);
}

const RoleIcon = ({ role }: { role?: string }) => {
    if (role === 'admin') return <ShieldAlert className="h-3 w-3 text-destructive" />;
    if (role === 'manager') return <ShieldCheck className="h-3 w-3 text-blue-400" />;
    return <Shield className="h-3 w-3 text-muted-foreground" />;
};

function getInitials(name?: string | null, email?: string | null): string {
    if (name) {
        const parts = name.trim().split(' ');
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();
    }
    return email ? email[0].toUpperCase() : 'U';
}

export function Header() {
    const { user, signOut } = useAuth();
    const { data: profile } = useProfile();
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
        refetchInterval: 30_000, // Poll every 30 seconds
    });

    const markReadMutation = useMutation({
        mutationFn: markAllRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const fullName: string | null = profile?.full_name ?? user?.user_metadata?.full_name ?? null;
    const email = user?.email ?? '';
    const role: string | undefined = profile?.role ?? user?.user_metadata?.role;
    const initials = getInitials(fullName, email);

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-black/20 px-6 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center flex-1">
                {/* Page breadcrumb area — intentionally empty, reserved */}
            </div>

            <div className="flex items-center space-x-3">
                {/* Notifications Bell */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative group text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
                            <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-primary ring-2 ring-black shadow-[0_0_8px_rgba(0,184,217,0.8)] animate-pulse" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-0 border-white/10 bg-black/80 backdrop-blur-xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <span className="text-sm font-semibold">
                                Notifications {unreadCount > 0 && (
                                    <span className="ml-1.5 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                                )}
                            </span>
                            {unreadCount > 0 && (
                                <span
                                    className="text-xs text-primary cursor-pointer hover:underline"
                                    onClick={() => markReadMutation.mutate()}
                                >
                                    Mark all read
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="p-6 text-center text-sm text-muted-foreground">No notifications</p>
                            ) : notifications.map(n => (
                                <div key={n.id} className={cn(
                                    "flex items-start gap-3 p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0",
                                    !n.is_read && "bg-primary/5"
                                )}>
                                    <div className="mt-0.5 rounded-full bg-destructive/10 p-1 shrink-0">
                                        <Package className="h-4 w-4 text-destructive" />
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <p className="text-sm font-medium leading-none">{n.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {!n.is_read && <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />}
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/5 transition-all group select-none">
                            {/* Avatar */}
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent transition-all group-hover:ring-indigo-500/50">
                                {initials}
                            </div>
                            {/* Name + Role */}
                            <div className="hidden sm:flex flex-col leading-none">
                                <span className="text-sm font-medium">{fullName ?? email}</span>
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
                                    <RoleIcon role={role} />
                                    {role ?? 'user'}
                                </span>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-52 border-white/10 bg-black/80 backdrop-blur-xl" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-0.5">
                                <p className="text-sm font-medium">{fullName ?? 'User'}</p>
                                <p className="text-xs text-muted-foreground truncate">{email}</p>
                                <span className={cn(
                                    "mt-1 inline-flex items-center gap-1 text-[10px] capitalize font-semibold px-1.5 py-0.5 rounded-full w-fit",
                                    role === 'admin' ? "bg-destructive/10 text-destructive" :
                                        role === 'manager' ? "bg-blue-500/10 text-blue-400" :
                                            "bg-white/10 text-muted-foreground"
                                )}>
                                    <RoleIcon role={role} />
                                    {role ?? 'staff'}
                                </span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={signOut}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
