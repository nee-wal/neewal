import { useEffect, useState } from 'react';

export default function CountdownPage() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        if (window.electron && window.electron.onCountdownUpdate) {
            window.electron.onCountdownUpdate((newCount: number) => {
                setCount(newCount);
            });
        }
    }, []);

    if (count === null) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center rounded-[3rem] border border-[var(--color-primary)]/30 overflow-hidden shadow-2xl">
            <div className="flex flex-col items-center gap-2">
                <div className="text-8xl font-black text-[var(--color-primary)] animate-scale-pulse drop-shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]">
                    {count}
                </div>
                <div className="text-sm text-[var(--color-text-muted)] font-medium uppercase tracking-widest">
                    Starting...
                </div>
            </div>
        </div>
    );
}
