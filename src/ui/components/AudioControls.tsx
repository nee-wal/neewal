import { Mic, Speaker } from 'lucide-react';

export function AudioControls({ micActive, onToggleMic, systemActive, onToggleSystem }: AudioControlsProps) {
    return (
        <div className="w-full flex gap-2">

            {/* Mic Toggle */}
            <button
                onClick={onToggleMic}
                className={`flex-1 flex items-center justify-center gap-2 bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] hover:border-[var(--color-text-muted)]/50 rounded-lg p-2 group transition-all cursor-pointer ${!micActive ? 'opacity-60' : ''}`}
                title="Microphone"
            >
                <div className="flex items-center gap-2">
                    <Mic className={`w-3.5 h-3.5 ${micActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                    <span className={`text-xs font-medium truncate ${micActive ? 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>Mic</span>
                </div>
                {micActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"></div>
                )}
            </button>

            {/* System Audio Toggle */}
            <button
                onClick={onToggleSystem}
                className={`flex-1 flex items-center justify-center gap-2 bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] hover:border-[var(--color-text-muted)]/50 rounded-lg p-2 group transition-all cursor-pointer ${!systemActive ? 'opacity-60' : ''}`}
                title="System Audio"
            >
                <div className="flex items-center gap-2">
                    <Speaker className={`w-3.5 h-3.5 ${systemActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                    <span className={`text-xs font-medium truncate ${systemActive ? 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>System</span>
                </div>
                {systemActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"></div>
                )}
            </button>
        </div>
    );
}
