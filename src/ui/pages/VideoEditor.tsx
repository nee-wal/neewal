import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, FolderOpen, Scissors, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface VideoEditorProps {
    videoPath: string;
    onBack: () => void;
}

export interface TrimData {
    startTime: number;
    endTime: number;
    duration: number;
}

export default function VideoEditor({ videoPath, onBack }: VideoEditorProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    // Video player state
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const timelineRef = React.useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [isDraggingStart, setIsDraggingStart] = useState(false);
    const [isDraggingEnd, setIsDraggingEnd] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);

    const videoUrl = videoPath.startsWith('file://') ? videoPath : `file://${videoPath}`;
    const videoName = videoPath.split('/').pop() || 'Unknown';

    // Initialize video
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            const dur = video.duration;
            setDuration(dur);
            setEndTime(dur);
        };

        const handleTimeUpdate = () => {
            const time = video.currentTime;
            setCurrentTime(time);

            if (time >= endTime && isPlaying) {
                video.pause();
                setIsPlaying(false);
            }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [endTime, isPlaying]);

    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            if (currentTime >= endTime) {
                video.currentTime = startTime;
            }
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const jumpToStart = () => {
        if (videoRef.current) videoRef.current.currentTime = startTime;
    };

    const jumpToEnd = () => {
        if (videoRef.current) videoRef.current.currentTime = endTime;
    };

    const timeToPercent = (time: number) => {
        return duration > 0 ? (time / duration) * 100 : 0;
    };

    const pixelToTime = (pixel: number, rect: DOMRect) => {
        const percent = pixel / rect.width;
        return Math.max(0, Math.min(duration, percent * duration));
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDraggingStart || isDraggingEnd) return;
        const timeline = timelineRef.current;
        if (!timeline || !videoRef.current) return;

        const rect = timeline.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const time = pixelToTime(clickX, rect);
        videoRef.current.currentTime = time;
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const timeline = timelineRef.current;
            if (!timeline) return;

            const rect = timeline.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const time = pixelToTime(mouseX, rect);

            if (isDraggingStart) {
                const newStart = Math.max(0, Math.min(time, endTime - 0.1));
                setStartTime(newStart);
                if (videoRef.current) videoRef.current.currentTime = newStart;
            } else if (isDraggingEnd) {
                const newEnd = Math.max(startTime + 0.1, Math.min(time, duration));
                setEndTime(newEnd);
                if (videoRef.current) videoRef.current.currentTime = newEnd;
            }
        };

        const handleMouseUp = () => {
            setIsDraggingStart(false);
            setIsDraggingEnd(false);
        };

        if (isDraggingStart || isDraggingEnd) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingStart, isDraggingEnd, startTime, endTime, duration]);

    // Listen for export progress updates
    useEffect(() => {
        if (window.electron && window.electron.onExportProgress) {
            window.electron.onExportProgress((progress: number) => {
                setExportProgress(progress);
            });
        }
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const handleExport = async () => {
        if (!window.electron) {
            alert('Export functionality requires Electron');
            return;
        }

        try {
            setIsExporting(true);
            setExportProgress(0);

            console.log('[VideoEditor] Starting export...');
            const result = await window.electron.exportTrimmedVideo(
                videoPath,
                startTime,
                endTime
            );

            console.log('[VideoEditor] Export result:', result);

            if (result.success) {
                // Open the folder first
                if (result.outputPath) {
                    const folderPath = result.outputPath.substring(0, result.outputPath.lastIndexOf('/'));
                    await window.electron.openFolder(folderPath);
                }

                // Show success message
                alert(`Video exported successfully to: ${result.outputPath}`);

                // Close the trimming page after user acknowledges
                onBack();
            } else {
                alert(`Export failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('[VideoEditor] Export error:', error);
            alert('Failed to export video. See console for details.');
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    const handleDelete = async () => {
        if (!window.electron) return;
        const confirmed = confirm('Are you sure you want to delete this video? This action cannot be undone.');
        if (!confirmed) return;

        try {
            await window.electron.deleteVideo(videoPath);
            alert('Video deleted successfully');
            onBack();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete video');
        }
    };

    const handleOpenFolder = async () => {
        if (!window.electron) return;
        try {
            const folderPath = videoPath.substring(0, videoPath.lastIndexOf('/'));
            await window.electron.openFolder(folderPath);
        } catch (error) {
            console.error('Open folder error:', error);
        }
    };

    const trimmedDuration = endTime - startTime;

    return (
        <main className="flex-1 flex flex-col bg-[var(--color-background-dark)] h-screen overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-dark)]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all duration-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Video Editor</h1>
                        <p className="text-xs text-[var(--color-text-muted)] font-mono">{videoName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenFolder}
                        className="p-2 rounded-lg bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all duration-200"
                        title="Open Folder"
                    >
                        <FolderOpen className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 rounded-lg bg-[var(--color-surface-dark)] border border-red-500/50 text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all duration-200"
                        title="Delete Video"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="flex-1 flex gap-6 p-6 overflow-hidden">
                {/* Left: Video Preview */}
                <div className="flex-1 flex flex-col">
                    <div className="relative bg-[var(--color-surface-dark)] rounded-lg overflow-hidden flex-1 flex items-center justify-center border border-[var(--color-border-dark)]">
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="max-w-full max-h-full object-contain"
                            preload="auto"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onError={(e) => {
                                console.error('Video error:', e);
                                const videoElement = e.currentTarget;
                                setVideoError(videoElement.error?.message || 'Unknown error');
                            }}
                            onLoadedMetadata={() => setVideoError(null)}
                        />

                        {videoError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
                                <div>
                                    <p className="text-red-500 font-bold mb-2">Video Load Error</p>
                                    <p className="text-sm">{videoError}</p>
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <div className="flex items-center justify-between text-white text-sm font-mono">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Controls Panel */}
                <div className="w-96 flex flex-col gap-4">
                    {/* Playback Controls */}
                    <div className="bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-xl p-4">
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={jumpToStart}
                                className="p-3 rounded-lg bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all"
                                title="Jump to Start"
                            >
                                <SkipBack className="w-5 h-5" />
                            </button>
                            <button
                                onClick={togglePlayPause}
                                className="p-4 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(63,182,168,0.4)]"
                                title={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                            </button>
                            <button
                                onClick={jumpToEnd}
                                className="p-3 rounded-lg bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all"
                                title="Jump to End"
                            >
                                <SkipForward className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    {/* Timeline */}
                    <div className="bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-xl p-4">
                        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-3">
                            <span className="font-bold uppercase">Trim Points</span>
                            <span className="font-mono">{formatTime(trimmedDuration)}</span>
                        </div>

                        <div
                            ref={timelineRef}
                            className="relative h-20 bg-[var(--color-background-dark)] rounded-lg border border-[var(--color-border-dark)] cursor-pointer overflow-hidden mb-4"
                            onClick={handleTimelineClick}
                        >
                            <div
                                className="absolute top-0 bottom-0 bg-[var(--color-primary)]/20 border-l-2 border-r-2 border-[var(--color-primary)]"
                                style={{
                                    left: `${timeToPercent(startTime)}%`,
                                    width: `${timeToPercent(endTime) - timeToPercent(startTime)}%`,
                                }}
                            />
                            <div
                                className="absolute top-0 bottom-0 bg-black/60"
                                style={{ left: 0, width: `${timeToPercent(startTime)}%` }}
                            />
                            <div
                                className="absolute top-0 bottom-0 bg-black/60"
                                style={{ left: `${timeToPercent(endTime)}%`, right: 0 }}
                            />
                            <div
                                className="absolute top-0 bottom-0 w-3 bg-[var(--color-primary)] cursor-ew-resize z-20"
                                style={{ left: `${timeToPercent(startTime)}%`, transform: 'translateX(-50%)' }}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingStart(true); }}
                            >
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-full" />
                            </div>
                            <div
                                className="absolute top-0 bottom-0 w-3 bg-[var(--color-primary)] cursor-ew-resize z-20"
                                style={{ left: `${timeToPercent(endTime)}%`, transform: 'translateX(-50%)' }}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingEnd(true); }}
                            >
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-full" />
                            </div>
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-white z-30"
                                style={{ left: `${timeToPercent(currentTime)}%` }}
                            >
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
                            </div>
                            <div className="absolute bottom-1 left-2 text-[10px] text-white/70 font-mono">{formatTime(startTime)}</div>
                            <div className="absolute bottom-1 right-2 text-[10px] text-white/70 font-mono">{formatTime(endTime)}</div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-[var(--color-background-dark)] rounded-lg p-2 text-center">
                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Start</div>
                                <div className="font-mono text-[var(--color-text-primary)]">{formatTime(startTime)}</div>
                            </div>
                            <div className="bg-[var(--color-background-dark)] rounded-lg p-2 text-center">
                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">End</div>
                                <div className="font-mono text-[var(--color-text-primary)]">{formatTime(endTime)}</div>
                            </div>
                            <div className="bg-[var(--color-background-dark)] rounded-lg p-2 text-center">
                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Length</div>
                                <div className="font-mono text-[var(--color-text-primary)]">{formatTime(trimmedDuration)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Export Info */}
                    <div className="bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-xl p-4">
                        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-3">Export Information</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Original:</span>
                                <span className="text-[var(--color-text-primary)] font-mono">{formatTime(duration)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Trimmed:</span>
                                <span className="text-[var(--color-text-primary)] font-mono">{formatTime(trimmedDuration)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Reduction:</span>
                                <span className="text-[var(--color-text-primary)] font-mono">
                                    {duration > 0 ? ((1 - trimmedDuration / duration) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Format:</span>
                                <span className="text-[var(--color-text-primary)] font-mono">MP4 (H.264)</span>
                            </div>
                        </div>
                    </div>

                    {/* Export Progress */}
                    {isExporting && (
                        <div className="bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">Exporting...</span>
                                <span className="text-sm text-[var(--color-text-muted)] font-mono">{exportProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-[var(--color-background-dark)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--color-primary)] transition-all duration-300 rounded-full"
                                    style={{ width: `${exportProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full py-3 px-4 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                    >
                        <Scissors className="w-5 h-5" />
                        {isExporting ? 'Exporting...' : 'Export Trimmed Video'}
                    </button>
                </div>
            </div>
        </main>
    );
}

// Add React import at the top
import React from 'react';
