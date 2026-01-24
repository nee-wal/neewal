
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { X } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signInWithEmail, loginAsGuest } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const canClose = location.state?.canClose;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await signInWithEmail(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Auth state change will handle redirect, but we can also push
            navigate('/');
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--color-background-dark)] px-4">
            {canClose && (
                <button
                    onClick={() => navigate('/')}
                    className="absolute right-4 top-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                    <X className="h-6 w-6" />
                </button>
            )}
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tighter text-[var(--color-text-primary)]">Neewal</h1>
                    <p className="text-[var(--color-text-muted)]">Enter your email below to login</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder="Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
                <div className="text-center text-sm text-[var(--color-text-muted)]">
                    Don't have an account?{' '}
                    <Link
                        to="/signup"
                        state={canClose ? { canClose: true } : undefined}
                        className="underline hover:text-[var(--color-primary)]"
                    >
                        Sign up
                    </Link>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[var(--color-border-dark)]" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[var(--color-background-dark)] px-2 text-[var(--color-text-muted)]">
                            Or
                        </span>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full border-[var(--color-border-dark)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                    onClick={async () => {
                        setLoading(true);
                        await loginAsGuest();
                        navigate('/');
                    }}
                    disabled={loading}
                >
                    Continue as Guest
                </Button>
            </div>
        </div>
    );
}
