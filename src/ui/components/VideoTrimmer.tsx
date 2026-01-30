import { useState, useRef, useEffect } from 'react';
import { Scissors, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface VideoTrimmerProps {
    videoPath: string;
    onTrimChange: (trimData: TrimData) => void;
    onExport: (trimData: TrimData) => void;
}

export interface TrimData {
    startTime: number; // in seconds
    endTime: number;   // in seconds
    duration: number;  // total video duration
}

export function VideoTrimmer({ videoPath, onTrimChange, onExport }: VideoTrimmerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [isDraggingStart, setIsDraggingStart] = useState(false);
    const [isDraggingEnd, setIsDraggingEnd] = useState(false);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);

    // Convert file path to proper URL
    const videoUrl = videoPath.startsWith('file://') ? videoPath : `file://${videoPath}`;

    // Initialize video
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            const dur = video.duration;
            setDuration(dur);
            setEndTime(dur);
            onTrimChange({ startTime: 0, endTime: dur, duration: dur });
        };

        const handleTimeUpdate = () => {
            const time = video.currentTime;
            setCurrentTime(time);

            // Auto-pause at end trim point
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
    }, [endTime, isPlaying, onTrimChange]);

    // Notify parent of trim changes
    useEffect(() => {
        if (duration > 0) {
            onTrimChange({ startTime, endTime, duration });
        }
    }, [startTime, endTime, duration, onTrimChange]);

    // Play/Pause toggle
    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            // If at end, jump to start
            if (currentTime >= endTime) {
                video.currentTime = startTime;
            }
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Jump to start trim point
    const jumpToStart = () => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = startTime;
    };

    // Jump to end trim point
    const jumpToEnd = () => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = endTime;
    };

    // Convert time to percentage position
    const timeToPercent = (time: number) => {
        return duration > 0 ? (time / duration) * 100 : 0;
    };

    // Convert pixel position to time
    const pixelToTime = (pixel: number, rect: DOMRect) => {
        const percent = pixel / rect.width;
        return Math.max(0, Math.min(duration, percent * duration));
    };

    // Handle timeline click
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDraggingStart || isDraggingEnd || isDraggingPlayhead) return;

        const timeline = timelineRef.current;
        if (!timeline || !videoRef.current) return;

        const rect = timeline.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const time = pixelToTime(clickX, rect);

        videoRef.current.currentTime = time;
    };

    // Start handle drag
    const handleStartDrag = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingStart(true);
    };

    // End handle drag
    const handleEndDrag = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingEnd(true);
    };

    // Playhead drag
    const handlePlayheadDrag = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingPlayhead(true);
    };

    // Mouse move handler
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
                if (videoRef.current) {
                    videoRef.current.currentTime = newStart;
                }
            } else if (isDraggingEnd) {
                const newEnd = Math.max(startTime + 0.1, Math.min(time, duration));
                setEndTime(newEnd);
                if (videoRef.current) {
                    videoRef.current.currentTime = newEnd;
                }
            } else if (isDraggingPlayhead) {
                const newTime = Math.max(startTime, Math.min(time, endTime));
                if (videoRef.current) {
                    videoRef.current.currentTime = newTime;
                }
            }
        };

        const handleMouseUp = () => {
            setIsDraggingStart(false);
            setIsDraggingEnd(false);
            setIsDraggingPlayhead(false);
        };

        if (isDraggingStart || isDraggingEnd || isDraggingPlayhead) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingStart, isDraggingEnd, isDraggingPlayhead, startTime, endTime, duration]);

    // Format time display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const trimmedDuration = endTime - startTime;

    return (
        <div className="flex flex-col gap-4 bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-xl p-6">
            {/* Video Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    preload="auto"
                    crossOrigin="anonymous"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={(e) => {
                        console.error('Video error:', e);
                        console.error('Video path:', videoPath);
                        console.error('Video URL:', videoUrl);
                        const videoElement = e.currentTarget;
                        console.error('Video error code:', videoElement.error?.code);
                        console.error('Video error message:', videoElement.error?.message);
                        setVideoError(`Failed to load video: ${videoElement.error?.message || 'Unknown error'}`);
                    }}
                    onLoadedMetadata={() => {
                        console.log('Video loaded successfully');
                        console.log('Duration:', videoRef.current?.duration);
                        setVideoError(null);
                    }}
                />

                {/* Error message */}
                {videoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
                        <div>
                            <p className="text-red-500 font-bold mb-2">Video Load Error</p>
                            <p className="text-sm">{videoError}</p>
                            <p className="text-xs mt-2 text-gray-400">Path: {videoPath}</p>
                            <p className="text-xs mt-1 text-gray-400">Try recording in MP4 format instead</p>
                        </div>
                    </div>
                )}

                {/* Overlay controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between text-white text-sm font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={jumpToStart}
                    className="p-2 rounded-lg bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all duration-200 active:scale-95"
                    title="Jump to Start"
                >
                    <SkipBack className="w-5 h-5" />
                </button>

                <button
                    onClick={togglePlayPause}
                    className="p-4 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-all duration-200 active:scale-95 shadow-lg hover:shadow-[0_0_20px_rgba(63,182,168,0.4)]"
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                    ) : (
                        <Play className="w-6 h-6 fill-current" />
                    )}
                </button>

                <button
                    onClick={jumpToEnd}
                    className="p-2 rounded-lg bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all duration-200 active:scale-95"
                    title="Jump to End"
                >
                    <SkipForward className="w-5 h-5" />
                </button>
            </div>

            {/* Timeline Scrubber */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Trim Points</span>
                    <span className="font-mono">
                        Duration: {formatTime(trimmedDuration)}
                    </span>
                </div>

                <div
                    ref={timelineRef}
                    className="relative h-16 bg-[var(--color-background-dark)] rounded-lg border border-[var(--color-border-dark)] cursor-pointer overflow-hidden"
                    onClick={handleTimelineClick}
                >
                    {/* Trimmed region highlight */}
                    <div
                        className="absolute top-0 bottom-0 bg-[var(--color-primary)]/20 border-l-2 border-r-2 border-[var(--color-primary)]"
                        style={{
                            left: `${timeToPercent(startTime)}%`,
                            width: `${timeToPercent(endTime) - timeToPercent(startTime)}%`,
                        }}
                    />

                    {/* Dimmed regions */}
                    <div
                        className="absolute top-0 bottom-0 bg-black/60 pointer-events-none"
                        style={{
                            left: 0,
                            width: `${timeToPercent(startTime)}%`,
                        }}
                    />
                    <div
                        className="absolute top-0 bottom-0 bg-black/60 pointer-events-none"
                        style={{
                            left: `${timeToPercent(endTime)}%`,
                            right: 0,
                        }}
                    />

                    {/* Start handle */}
                    <div
                        className="absolute top-0 bottom-0 w-3 bg-[var(--color-primary)] cursor-ew-resize hover:bg-[var(--color-primary)]/80 transition-colors group z-20"
                        style={{ left: `${timeToPercent(startTime)}%`, transform: 'translateX(-50%)' }}
                        onMouseDown={handleStartDrag}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-full opacity-70 group-hover:opacity-100" />
                    </div>

                    {/* End handle */}
                    <div
                        className="absolute top-0 bottom-0 w-3 bg-[var(--color-primary)] cursor-ew-resize hover:bg-[var(--color-primary)]/80 transition-colors group z-20"
                        style={{ left: `${timeToPercent(endTime)}%`, transform: 'translateX(-50%)' }}
                        onMouseDown={handleEndDrag}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-full opacity-70 group-hover:opacity-100" />
                    </div>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-30 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        style={{ left: `${timeToPercent(currentTime)}%` }}
                        onMouseDown={handlePlayheadDrag}
                    >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                    </div>

                    {/* Time markers */}
                    <div className="absolute bottom-1 left-2 text-[10px] text-white/70 font-mono">
                        {formatTime(startTime)}
                    </div>
                    <div className="absolute bottom-1 right-2 text-[10px] text-white/70 font-mono">
                        {formatTime(endTime)}
                    </div>
                </div>
            </div>

            {/* Trim Info */}
            <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Start</div>
                    <div className="font-mono text-[var(--color-text-primary)]">{formatTime(startTime)}</div>
                </div>
                <div className="bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">End</div>
                    <div className="font-mono text-[var(--color-text-primary)]">{formatTime(endTime)}</div>
                </div>
                <div className="bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Length</div>
                    <div className="font-mono text-[var(--color-text-primary)]">{formatTime(trimmedDuration)}</div>
                </div>
            </div>

            {/* Export Button */}
            <button
                onClick={() => onExport({ startTime, endTime, duration })}
                className="w-full py-3 px-4 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary)]/90 transition-all duration-200 active:scale-98 shadow-lg hover:shadow-[0_0_20px_rgba(63,182,168,0.4)] flex items-center justify-center gap-2"
            >
                <Scissors className="w-5 h-5" />
                Export Trimmed Video
            </button>
        </div>
    );
}
