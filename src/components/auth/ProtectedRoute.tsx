import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { session, isLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!isLoading && !session) {
            // Redirect them to the /login page, but save the current location they were
            // trying to go to when they were redirected. This allows us to send them
            // along to that page after they login, which is a nicer user experience.
            navigate('/login', { state: { from: location }, replace: true });
        }
    }, [isLoading, session, location, navigate]);

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.5)] mb-4" />
                <p className="text-muted-foreground animate-pulse">Establishing secure connection...</p>
            </div>
        );
    }

    return session ? <>{children}</> : null;
}
