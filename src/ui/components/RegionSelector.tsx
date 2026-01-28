import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface RegionSelectorProps {
    isOpen: boolean;
    onRegionSelect: (region: { x: number; y: number; width: number; height: number }) => void;
    onCancel: () => void;
}

export function RegionSelector({ isOpen, onRegionSelect, onCancel }: RegionSelectorProps) {
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const overlayRef = useRef<HTMLDivElement>(null);

    // Reset selection state when closing
    const handleCancel = useCallback(() => {
        setIsSelecting(false);
        setStartPos({ x: 0, y: 0 });
        setCurrentPos({ x: 0, y: 0 });
        onCancel();
    }, [onCancel]);

    const handleRegionSelect = useCallback((region: { x: number; y: number; width: number; height: number }) => {
        setIsSelecting(false);
        setStartPos({ x: 0, y: 0 });
        setCurrentPos({ x: 0, y: 0 });
        onRegionSelect(region);
    }, [onRegionSelect]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target !== overlayRef.current) return;

        const rect = overlayRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsSelecting(true);
        setStartPos({ x, y });
        setCurrentPos({ x, y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting) return;

        const rect = overlayRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentPos({ x, y });
    };

    const handleMouseUp = () => {
        if (!isSelecting) return;

        setIsSelecting(false);

        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(currentPos.x - startPos.x);
        const height = Math.abs(currentPos.y - startPos.y);

        // Only accept regions with minimum size
        if (width > 50 && height > 50) {
            handleRegionSelect({ x, y, width, height });
        }
    };

    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleCancel]);

    if (!isOpen) return null;

    const selectionBox = {
        left: Math.min(startPos.x, currentPos.x),
        top: Math.min(startPos.y, currentPos.y),
        width: Math.abs(currentPos.x - startPos.x),
        height: Math.abs(currentPos.y - startPos.y),
    };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 cursor-crosshair"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Instructions */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-lg px-6 py-3 shadow-2xl">
                <div className="flex items-center gap-4">
                    <p className="text-[var(--color-text-primary)] text-sm font-medium">
                        Click and drag to select recording area
                    </p>
                    <button
                        onClick={handleCancel}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        title="Cancel (ESC)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-[var(--color-text-muted)] text-xs mt-1">
                    Press ESC to cancel
                </p>
            </div>

            {/* Selection Box */}
            {(isSelecting || (selectionBox.width > 0 && selectionBox.height > 0)) && (
                <>
                    {/* Selection rectangle */}
                    <div
                        className="absolute border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        style={{
                            left: `${selectionBox.left}px`,
                            top: `${selectionBox.top}px`,
                            width: `${selectionBox.width}px`,
                            height: `${selectionBox.height}px`,
                            pointerEvents: 'none',
                        }}
                    >
                        {/* Dimension display */}
                        <div className="absolute -top-8 left-0 bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded px-2 py-1 text-xs text-[var(--color-text-primary)] font-mono">
                            {Math.round(selectionBox.width)} × {Math.round(selectionBox.height)}
                        </div>

                        {/* Corner handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-[var(--color-primary)] rounded-full border-2 border-white"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-primary)] rounded-full border-2 border-white"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[var(--color-primary)] rounded-full border-2 border-white"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--color-primary)] rounded-full border-2 border-white"></div>
                    </div>
                </>
            )}
        </div>
    );
}
