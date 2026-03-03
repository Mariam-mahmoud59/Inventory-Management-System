import { NavLink } from 'react-router-dom';
import { Home, Package, Box, ShoppingCart, MapPin, Users, FileBarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Stock', href: '/stock', icon: Box },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Branches', href: '/branches', icon: MapPin },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
];

export function Sidebar() {
    return (
        <div className="flex h-full w-64 flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl px-4 py-8 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-20 relative">
            <div className="flex items-center mb-8 px-2 space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,184,217,0.4)]">
                    <Box className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400 drop-shadow-sm">
                    Nexus IMS
                </span>
            </div>

            <nav className="flex-1 space-y-2 mt-4 relative z-10">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 group relative overflow-hidden',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-[inset_4px_0_0_rgba(0,184,217,1)]'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-300",
                                    isActive ? "opacity-100" : "group-hover:opacity-50"
                                )} />
                                <item.icon className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-300 relative z-10",
                                    isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(0,184,217,0.6)]" : "group-hover:scale-110"
                                )} aria-hidden="true" />
                                <span className={cn("relative z-10 tracking-wide", isActive && "drop-shadow-[0_0_5px_rgba(0,184,217,0.5)]")}>{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-8 px-2">
                <div className="rounded-lg bg-accent/50 p-4 border flex flex-col items-center text-center">
                    <span className="text-sm font-semibold mb-1">Press <kbd className="font-mono text-xs bg-muted px-1 rounded shadow-sm border">⌘K</kbd> or <kbd className="font-mono text-xs bg-muted px-1 rounded shadow-sm border">Ctrl+K</kbd></span>
                    <span className="text-xs text-muted-foreground">to open command menu</span>
                </div>
            </div>
        </div>
    );
}
