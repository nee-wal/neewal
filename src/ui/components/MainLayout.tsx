import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Sidebar } from '../components/Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { signOut, user, isGuest } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="flex h-screen flex-col bg-[var(--color-background-dark)] text-[var(--color-text-primary)] font-sans">
            {/* Header */}
            <header className="flex h-14 items-center justify-between border-b border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] px-4">
                <div className="flex items-center gap-2 font-semibold">
                    <span className="text-[var(--color-primary)]">⦿</span> Neewal
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {isGuest ? (
                        <>
                            <span className="text-[var(--color-text-muted)]">Guest</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/login', { state: { canClose: true } })}
                            >
                                Login
                            </Button>
                        </>
                    ) : (
                        <>
                            <span className="text-[var(--color-text-muted)]">{user?.email}</span>
                            <Button variant="outline" size="sm" onClick={() => signOut()}>
                                Logout
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {/* Main content with sidebar */}
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                {children}
            </div>
        </div>
    );
}
