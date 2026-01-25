export function RecordButton({ isRecording, onClick }: RecordButtonProps) {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className={`w-20 h-20 rounded-full bg-[var(--color-surface-dark)] border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-record)]/30 active:scale-95 cursor-pointer ${isRecording
                        ? 'border-[var(--color-record)] animate-pulse-red'
                        : 'border-[var(--color-border-dark)] hover:border-[var(--color-record)]/50 hover:bg-[var(--color-surface-dark)]/80'
                    }`}
            >
                <div
                    className={`bg-[var(--color-record)] transition-all duration-200 ${isRecording
                            ? 'rounded-sm w-4 h-4'
                            : 'rounded-full w-8 h-8'
                        }`}
                />
            </button>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Ctrl+Shift+R
            </div>
        </div>
    );
}
