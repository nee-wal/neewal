import { Mic, Speaker } from 'lucide-react';

export function AudioControls({ micActive, onToggleMic, systemActive, onToggleSystem }: AudioControlsProps) {
    return (
        <div className="w-full grid grid-cols-2 gap-3">

            {/* Mic Toggle */}
            <button
                onClick={onToggleMic}
                className={`flex items-center justify-between bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] hover:border-[var(--color-text-muted)]/50 rounded-lg p-3 group transition-all cursor-pointer ${!micActive ? 'opacity-60' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <Mic className={`w-4 h-4 ${micActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                    <span className={`text-xs font-medium ${micActive ? 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>Mic</span>
                </div>
                {micActive ? (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"></div>
                ) : (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-border-dark)]"></div>
                )}
            </button>

            {/* System Audio Toggle */}
            <button
                onClick={onToggleSystem}
                className={`flex items-center justify-between bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] hover:border-[var(--color-text-muted)]/50 rounded-lg p-3 group transition-all cursor-pointer ${!systemActive ? 'opacity-60' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <Speaker className={`w-4 h-4 ${systemActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                    <span className={`text-xs font-medium ${systemActive ? 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>System</span>
                </div>
                {systemActive ? (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"></div>
                ) : (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-border-dark)]"></div>
                )}
            </button>
        </div>
    );
}
