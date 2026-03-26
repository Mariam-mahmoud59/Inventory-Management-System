import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Mail, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    // Where did the user try to go before being redirected here?
    const from = location.state?.from?.pathname || '/';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Access Granted');
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            toast.error('An unexpected error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
            {/* Tactical Grid Background Layer */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Neon Glow overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="w-full max-w-md p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10 flex flex-col items-center">

                <div className="w-full flex justify-center mb-8">
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(0,184,217,0.3)]">
                        <ShieldAlert className="h-10 w-10 text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.8)]" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Access</h1>
                <p className="text-muted-foreground text-sm mb-8 text-center max-w-xs">
                    Authenticate to access the Inventory Management System core interface.
                </p>

                <form onSubmit={handleLogin} className="w-full space-y-5">
                    <div className="space-y-2 relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                            type="email"
                            placeholder="Admin Email"
                            className="pl-10 h-11 bg-muted/20 border-white/10 focus-visible:border-primary/50 text-white placeholder:text-muted-foreground/50 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2 relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                            type="password"
                            placeholder="Password"
                            className="pl-10 h-11 bg-muted/20 border-white/10 focus-visible:border-primary/50 text-white placeholder:text-muted-foreground/50 transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 mt-4 shadow-[0_0_15px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.6)] transition-all font-semibold text-primary-foreground tracking-wide"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            'INITIALIZE LINK'
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-xs text-muted-foreground/60 w-full text-center border-t border-white/5 pt-4">
                    END-TO-END ENCRYPTED CONNECTION
                </div>
            </div>
        </div>
    );
}
