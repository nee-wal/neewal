export function FormatSelector({ format, onFormatChange }: FormatSelectorProps) {
    return (
        <div className="w-full flex items-center justify-between px-1">
            <span className="text-xs text-[var(--color-text-muted)] font-medium">Format</span>
            <div className="relative">
                <select
                    value={format}
                    onChange={(e) => onFormatChange(e.target.value)}
                    className="appearance-none bg-[var(--color-surface-dark)] text-[var(--color-text-primary)] text-xs font-mono font-medium pl-3 pr-8 py-1.5 rounded border border-[var(--color-border-dark)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer hover:bg-[var(--color-surface-dark)]/80"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238FB5B8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em'
                    }}
                >
                    <option value="mp4">.mp4 (H.264)</option>
                    <option value="webm">.webm (Native)</option>
                    <option value="mkv">.mkv (Lossless)</option>
                    <option value="gif">.gif</option>
                </select>
            </div>
        </div>
    );
}
