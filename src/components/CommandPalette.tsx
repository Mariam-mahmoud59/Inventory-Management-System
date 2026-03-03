import * as React from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Box, Home, Package, ShoppingCart } from 'lucide-react';

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const navigate = useNavigate();

    // Toggle the menu when ⌘K is pressed
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-background/80 backdrop-blur-sm shadow-sm transition-all duration-300">
            <div className="w-full max-w-[600px] rounded-lg border bg-popover text-popover-foreground shadow-lg overflow-hidden relative">
                <Command
                    label="Global Command Menu"
                    shouldFilter={false} // Would be true or custom if purely static, but we might do dynamic search
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setOpen(false);
                    }}
                    className="flex h-full w-full flex-col bg-transparent"
                >
                    <div className="flex items-center border-b px-3">
                        <Command.Input
                            autoFocus
                            placeholder="Type a command or search..."
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                        <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>

                        <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/'))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:opacity-50"
                            >
                                <Home className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/products'))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:opacity-50"
                            >
                                <Package className="mr-2 h-4 w-4" />
                                <span>Products</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/stock'))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:opacity-50"
                            >
                                <Box className="mr-2 h-4 w-4" />
                                <span>Stock Setup</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/orders'))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:opacity-50"
                            >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                <span>Orders</span>
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground mt-2 border-t pt-2">
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/stock'))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:opacity-50"
                            >
                                <Box className="mr-2 h-4 w-4 text-emerald-500" />
                                <span>Quick Stock Adjustment</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/orders'))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:opacity-50"
                            >
                                <ShoppingCart className="mr-2 h-4 w-4 text-emerald-500" />
                                <span>New Order</span>
                            </Command.Item>
                        </Command.Group>

                    </Command.List>
                </Command>

                {/* Click outside to close */}
                <div
                    className="absolute inset-0 -z-10"
                    onClick={() => setOpen(false)}
                />
            </div>
        </div>
    );
}
