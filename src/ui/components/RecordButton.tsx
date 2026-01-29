export function RecordButton({ isRecording, onClick }: RecordButtonProps) {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className={`w-20 h-20 rounded-full bg-[var(--color-surface-dark)] border-2 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[var(--color-record)]/30 active:scale-90 cursor-pointer relative overflow-hidden ${isRecording
                    ? 'border-[var(--color-record)] animate-pulse-red shadow-lg shadow-[var(--color-record)]/50'
                    : 'border-[var(--color-border-dark)] hover:border-[var(--color-record)]/50 hover:bg-[var(--color-surface-dark)]/80 hover:scale-110 hover:shadow-xl hover:shadow-[var(--color-record)]/20'
                    }`}
            >
                {/* Ripple effect */}
                {isRecording && (
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--color-record)] animate-ping opacity-75" />
                )}

                {/* Glow effect on hover */}
                <div className={`absolute inset-0 rounded-full bg-[var(--color-record)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isRecording ? 'opacity-100' : ''}`} />

                <div
                    className={`bg-[var(--color-record)] transition-all duration-300 relative z-10 ${isRecording
                        ? 'rounded-sm w-4 h-4 shadow-lg'
                        : 'rounded-full w-8 h-8 group-hover:w-9 group-hover:h-9 shadow-md'
                        }`}
                />
            </button>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] font-mono opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap bg-[var(--color-surface-dark)] px-2 py-1 rounded border border-[var(--color-border-dark)]">
                Ctrl+Shift+R
            </div>
        </div>
    );
}
