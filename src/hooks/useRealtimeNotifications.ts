import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

// Configure the Supabase Client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Hook to listen for realtime inventory changes via Supabase.
 * In a real-world scenario, you might pass specific table names/filters or schema arguments.
 */
export function useRealtimeNotifications() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Listen for low-stock alerts or inventory updates on the 'inventory' table
        const channel = supabase
            .channel('public:inventory_updates')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events: INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'inventory',
                },
                (payload) => {
                    console.log('Realtime inventory change received:', payload);

                    // Invalidate relevant queries to fetch fresh data
                    queryClient.invalidateQueries({ queryKey: ['inventory'] });
                    queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });

                    // Further logic could go here:
                    // Examples: Dispatch a toast notification to the user,
                    // optimistically update the query cache, etc.
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to realtime inventory updates.');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Failed to subscribe to realtime inventory updates.');
                }
            });

        return () => {
            // Clean up the subscription on unmount
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
}
