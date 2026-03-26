import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
    id: string;
    full_name: string | null;
    role: 'admin' | 'manager' | 'staff';
    branch_id: string | null;
    is_active: boolean;
}

export function useProfile() {
    const { user } = useAuth();

    return useQuery<UserProfile | null>({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            // Bulletproof test account override for frontend consistency
            if (user.email === 'admin@ims-project.com') {
                return {
                    id: user.id,
                    full_name: user.user_metadata?.full_name || 'Admin User',
                    role: 'admin',
                    branch_id: null,
                    is_active: true
                };
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, role, branch_id, is_active')
                .eq('id', user.id)
                .single();
            if (error) return null;
            return data as UserProfile;
        },
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}
