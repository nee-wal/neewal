import {useAuth} from '../context/AuthContext';
import {Button} from '../components/Button';

export default function Recorder() {
    const {signOut, user} = useAuth();

    return (
        <div className="flex h-screen flex-col bg-[var(--color-background-dark)] text-[var(--color-text-primary)]">
            <header
                className="flex h-14 items-center justify-between border-b border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] px-4">
                <div className="flex items-center gap-2 font-semibold">
                    <span className="text-[var(--color-primary)]">⦿</span> Neewal
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-[var(--color-text-muted)]">{user?.email}</span>
                    <Button variant="outline" size="sm" onClick={() => signOut()}>
                        Logout
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <h2 className="mb-2 text-2xl font-bold">Ready to Record</h2>
                <p className="mb-8 text-[var(--color-text-muted)]">
                    Configure your recording settings below.
                </p>

                {/* Placeholder controls matching requirements */}
                <div
                    className="flex w-full max-w-2xl flex-col gap-4 rounded-xl border border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className="flex h-32 items-center justify-center rounded-lg border border-dashed border-[var(--color-border-dark)] bg-black/20">
                            Screen Selector (Coming Soon)
                        </div>
                        <div
                            className="flex h-32 items-center justify-center rounded-lg border border-dashed border-[var(--color-border-dark)] bg-black/20">
                            Audio Options (Coming Soon)
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-4">
                        <div className="text-4xl font-mono text-[var(--color-text-primary)]">00:00:00</div>
                    </div>

                    <div className="mt-4 flex justify-center">
                        <button
                            className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-record)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
                            <div className="h-6 w-6 rounded bg-white"/>
                            {/* Stop icon initially? Or Circle for record. Let's do huge red circle */}
                        </button>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">Ide / Recording / Error</div>
                </div>
            </main>
        </div>
    );
}
