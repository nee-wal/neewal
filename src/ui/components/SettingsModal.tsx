import { X, FolderOpen } from 'lucide-react';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    return (
        <div
            className={`fixed inset-0 bg-[var(--color-background-dark)]/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div className="w-full max-w-md bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] rounded-xl shadow-2xl overflow-hidden">
                <div className="h-10 border-b border-[var(--color-border-dark)] flex items-center justify-between px-4 bg-[var(--color-surface-dark)]">
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">Settings</span>
                    <button
                        onClick={onClose}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                    {/* Setting Item */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--color-text-primary)] block">Save Directory</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value="~/Videos/RecOne"
                                className="w-full bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded px-3 py-1.5 text-xs text-[var(--color-text-muted)] font-mono focus:outline-none"
                            />
                            <button className="bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded px-3 text-[var(--color-text-primary)] hover:bg-[var(--color-border-dark)] transition-colors cursor-pointer">
                                <FolderOpen className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Setting Item: Cursor */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-[var(--color-text-primary)]">Show Cursor</div>
                            <div className="text-[10px] text-[var(--color-text-muted)]">Capture mouse pointer</div>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-9 h-5 bg-[var(--color-border-dark)] rounded-full peer peer-checked:bg-[var(--color-primary)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                    </div>

                    {/* Setting Item: Countdown */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-[var(--color-text-primary)]">Countdown</div>
                            <div className="text-[10px] text-[var(--color-text-muted)]">3s delay before start</div>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-9 h-5 bg-[var(--color-border-dark)] rounded-full peer peer-checked:bg-[var(--color-primary)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                    </div>

                    {/* Setting Item: Frame Rate */}
                    <div className="space-y-2 pt-2 border-t border-[var(--color-border-dark)]">
                        <label className="text-xs font-medium text-[var(--color-text-primary)] block">Frame Rate</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button className="py-1 rounded bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] cursor-pointer">30 FPS</button>
                            <button className="py-1 rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)] text-[10px] text-[var(--color-primary)] font-medium cursor-pointer">60 FPS</button>
                            <button className="py-1 rounded bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] cursor-pointer">120 FPS</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
