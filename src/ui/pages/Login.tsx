
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signInWithEmail } = useAuth();
    const navigate = useNavigate();

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
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background-dark)] px-4">
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
                    <Link to="/signup" className="underline hover:text-[var(--color-primary)]">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
