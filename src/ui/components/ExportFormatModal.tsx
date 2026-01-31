import { useState } from 'react';
import { FileVideo, Film, Package, ImageIcon, X } from 'lucide-react';

interface ExportFormatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: 'mp4' | 'webm' | 'mkv' | 'gif') => void;
}

export function ExportFormatModal({ isOpen, onClose, onExport }: ExportFormatModalProps) {
    const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'webm' | 'mkv' | 'gif'>('mp4');

    if (!isOpen) return null;

    const formats = [
        {
            value: 'mp4' as const,
            icon: FileVideo,
            label: 'MP4',
            description: 'Universal compatibility, best for sharing',
            details: 'H.264 video, AAC audio',
            recommended: true
        },
        {
            value: 'webm' as const,
            icon: Film,
            label: 'WebM',
            description: 'Fast export, no re-encoding needed',
            details: 'VP8/VP9 video, Opus audio',
            recommended: false
        },
        {
            value: 'mkv' as const,
            icon: Package,
            label: 'MKV',
            description: 'High quality, lossless export',
            details: 'Stream copy, no quality loss',
            recommended: false
        },
        {
            value: 'gif' as const,
            icon: ImageIcon,
            label: 'GIF',
            description: 'Animated image, perfect for loops',
            details: 'Optimized palette, 15fps',
            recommended: false
        }
    ];

    const handleExport = () => {
        onExport(selectedFormat);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-dark)]">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Choose Export Format</h2>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Select the output format for your trimmed video</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--color-background-dark)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Format Options */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formats.map((format) => {
                        const Icon = format.icon;
                        const isSelected = selectedFormat === format.value;

                        return (
                            <button
                                key={format.value}
                                onClick={() => setSelectedFormat(format.value)}
                                className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${isSelected
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-[0_0_20px_rgba(63,182,168,0.2)]'
                                        : 'border-[var(--color-border-dark)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-background-dark)]'
                                    }`}
                            >
                                {/* Recommended Badge */}
                                {format.recommended && (
                                    <div className="absolute -top-2 -right-2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                        RECOMMENDED
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg transition-colors ${isSelected
                                            ? 'bg-[var(--color-primary)] text-white'
                                            : 'bg-[var(--color-background-dark)] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]'
                                        }`}>
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`font-bold ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'
                                                }`}>
                                                {format.label}
                                            </h3>
                                            {isSelected && (
                                                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--color-text-muted)] mb-2">
                                            {format.description}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)] font-mono">
                                            {format.details}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Info Box */}
                <div className="mx-6 mb-6 p-4 bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
                            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Format Tips</h4>
                            <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
                                <li>• <strong>MP4</strong>: Best for sharing on social media and most devices</li>
                                <li>• <strong>WebM</strong>: Fastest export, keeps original quality</li>
                                <li>• <strong>MKV</strong>: Lossless quality, larger file size</li>
                                <li>• <strong>GIF</strong>: Perfect for short clips and memes</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-dark)] bg-[var(--color-background-dark)]/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-dark)] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary)]/90 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(63,182,168,0.4)] flex items-center gap-2"
                    >
                        <FileVideo className="w-4 h-4" />
                        Export as {selectedFormat.toUpperCase()}
                    </button>
                </div>
            </div>
        </div>
    );
}
