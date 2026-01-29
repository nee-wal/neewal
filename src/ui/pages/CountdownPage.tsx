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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="text-9xl font-bold text-[var(--color-primary)] animate-scale-pulse">
                    {count}
                </div>
                <div className="text-xl text-[var(--color-text-muted)] font-medium">
                    Recording starts in...
                </div>
            </div>
        </div>
    );
}
