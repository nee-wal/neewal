
export function TimerDisplay({ seconds }: TimerDisplayProps) {
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return [hours, minutes, secs]
            .map(v => v < 10 ? "0" + v : v)
            .join(":");
    };

    return (
        <div className="font-mono text-4xl font-medium tracking-wider text-[var(--color-text-primary)] tabular-nums">
            {formatTime(seconds)}
        </div>
    );
}
