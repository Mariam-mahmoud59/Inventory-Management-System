import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '@/components/CommandPalette';
import { Toaster } from 'sonner';

export function Layout() {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Notifications Hook */}
            {/* <useRealtimeNotifications /> - will be instantiated where auth is present */}

            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 min-h-0 flex flex-col p-6">
                    <div className="mx-auto max-w-7xl w-full h-full flex flex-col">
                        <Outlet />
                    </div>
                </main>
            </div>

            <CommandPalette />
            <Toaster position="bottom-right" theme="system" />
        </div>
    );
}
