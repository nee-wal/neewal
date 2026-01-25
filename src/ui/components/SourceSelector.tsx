import { Monitor, AppWindow, Crop } from 'lucide-react';

export function SourceSelector({ selectedMode, onSelectMode }: SourceSelectorProps) {
    return (
        <div className="w-full bg-[var(--color-surface-dark)] p-1 rounded-lg border border-[var(--color-border-dark)] flex gap-1">
            <button
                onClick={() => onSelectMode('screen')}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-md transition-all text-xs font-medium cursor-pointer ${selectedMode === 'screen'
                    ? 'bg-[var(--color-background-dark)] shadow-sm border border-[var(--color-primary)]/50 text-[var(--color-primary)]'
                    : 'hover:bg-[var(--color-background-dark)]/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
            >
                <Monitor className="w-4 h-4" />
                Screen
            </button>
            <button
                onClick={() => onSelectMode('window')}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-md transition-all text-xs font-medium cursor-pointer ${selectedMode === 'window'
                    ? 'bg-[var(--color-background-dark)] shadow-sm border border-[var(--color-primary)]/50 text-[var(--color-primary)]'
                    : 'hover:bg-[var(--color-background-dark)]/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
            >
                <AppWindow className="w-4 h-4" />
                Window
            </button>
            <button
                onClick={() => onSelectMode('region')}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-md transition-all text-xs font-medium cursor-pointer ${selectedMode === 'region'
                    ? 'bg-[var(--color-background-dark)] shadow-sm border border-[var(--color-primary)]/50 text-[var(--color-primary)]'
                    : 'hover:bg-[var(--color-background-dark)]/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
            >
                <Crop className="w-4 h-4" />
                Region
            </button>
        </div>
    );
}
