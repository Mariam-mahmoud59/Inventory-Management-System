import { Bell, User, Settings, Building, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
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

// Mock Notifications
const mockAlerts = [
    { id: 1, title: 'Low Stock Alert', message: 'Ergonomic Office Chair is below minimum threshold.', time: '10m ago', unread: true },
    { id: 2, title: 'New Transfer', message: '50 units of Wireless Mouse received from Warehouse.', time: '1h ago', unread: true },
];

export function Header() {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-black/20 px-6 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center flex-1">
                {/* Future breadcrumbs or page title could go here */}
            </div>

            <div className="flex items-center space-x-4">

                {/* Notifications Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative group text-muted-foreground mr-2 hover:bg-white/5 hover:text-foreground transition-all">
                            <Bell className="h-5 w-5 transition-transform group-hover:scale-110 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-primary ring-2 ring-black shadow-[0_0_8px_rgba(0,184,217,0.8)] animate-pulse" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-0">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <span className="text-sm font-semibold">Notifications</span>
                            <span className="text-xs text-muted-foreground cursor-pointer hover:underline">Mark all as read</span>
                        </div>
                        <div className="flex flex-col max-h-[300px] overflow-y-auto">
                            {mockAlerts.map(alert => (
                                <div key={alert.id} className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-0">
                                    <div className="mt-0.5 rounded-full bg-destructive/10 p-1">
                                        <Package className="h-4 w-4 text-destructive" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{alert.title}</p>
                                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                                    </div>
                                    {alert.unread && <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />}
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white cursor-pointer select-none ring-2 ring-transparent transition-all hover:ring-indigo-500/50 hover:scale-105 active:scale-95">
                            <User className="h-4 w-4" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Sarah Connor</p>
                                <p className="text-xs leading-none text-muted-foreground">sarah@nexusims.com</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Profile Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <Building className="mr-2 h-4 w-4" />
                                <span>Branch Preferences</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </header>
    );
}
