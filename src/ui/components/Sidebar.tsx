import { Video, FolderOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const tabs = [
        {
            id: 'recorder',
            label: 'Recording',
            icon: Video,
            path: '/'
        },
        {
            id: 'videos',
            label: 'Videos',
            icon: FolderOpen,
            path: '/videos'
        }
    ];

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/' || location.pathname === '';
        }
        return location.pathname === path;
    };

    return (
        <div className="w-20 bg-[var(--color-surface-dark)] border-r border-[var(--color-border-dark)] flex flex-col items-center py-6 gap-4">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.path);

                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={`
                            w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1
                            transition-all duration-300 ease-out cursor-pointer group relative
                            ${active
                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] scale-105 shadow-lg shadow-[var(--color-primary)]/20'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-dark)] hover:scale-110 active:scale-95'
                            }
                        `}
                        title={tab.label}
                    >
                        {/* Background glow effect */}
                        {active && (
                            <div className="absolute inset-0 rounded-xl bg-[var(--color-primary)]/5 animate-pulse" />
                        )}

                        <Icon className={`w-5 h-5 transition-all duration-300 relative z-10 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className={`text-[9px] font-medium transition-all duration-300 relative z-10 ${active ? 'font-semibold' : ''}`}>{tab.label}</span>

                        {/* Active indicator */}
                        {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-primary)] rounded-r-full shadow-lg shadow-[var(--color-primary)]/50" />
                        )}

                        {/* Hover indicator */}
                        {!active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-8 bg-[var(--color-text-muted)] rounded-r-full transition-all duration-300 group-hover:w-1 opacity-50" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
