import { useState, useEffect } from 'react';
import { Play, Trash2, FolderOpen, RefreshCw, Video, LayoutGrid, List, CheckSquare, Square, X } from 'lucide-react';
import { Button } from '../components/Button';

export default function Videos() {
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saveDirectory, setSaveDirectory] = useState('');
    const [loadingThumbnails, setLoadingThumbnails] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    useEffect(() => {
        loadVideos();
        loadSaveDirectory();
    }, []);

    // Toggle selection mode automatically if items are selected
    useEffect(() => {
        if (selectedVideos.size > 0 && !isSelectionMode) {
            setIsSelectionMode(true);
        } else if (selectedVideos.size === 0 && isSelectionMode) {
            setIsSelectionMode(false);
        }
    }, [selectedVideos.size]);

    const toggleSelection = (path: string) => {
        setSelectedVideos(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedVideos.size === videos.length) {
            setSelectedVideos(new Set());
        } else {
            setSelectedVideos(new Set(videos.map(v => v.path)));
        }
    };

    const handleBulkDelete = async () => {
        if (!window.electron?.deleteVideo) return;

        const count = selectedVideos.size;
        const confirmed = confirm(`Are you sure you want to delete ${count} video${count !== 1 ? 's' : ''}?`);

        if (confirmed) {
            setLoading(true);
            try {
                // Delete all selected videos
                await Promise.all(
                    Array.from(selectedVideos).map(path => window.electron.deleteVideo(path))
                );

                // Reset selection and reload
                setSelectedVideos(new Set());
                loadVideos();
            } catch (err) {
                console.error('Failed to delete videos:', err);
                setLoading(false);
            }
        }
    };


    const loadSaveDirectory = async () => {
        const saved = localStorage.getItem('saveDirectory');
        if (saved) {
            setSaveDirectory(saved);
        } else if (window.electron?.getDefaultSaveDirectory) {
            const defaultDir = await window.electron.getDefaultSaveDirectory();
            setSaveDirectory(defaultDir);
        }
    };

    const loadVideos = async () => {
        setLoading(true);
        try {
            // Get videos from the save directory
            if (window.electron?.getVideos) {
                const videoList = await window.electron.getVideos();
                setVideos(videoList);
                // Initialize loading state for all videos with thumbnails
                setLoadingThumbnails(new Set(videoList.map((_, i) => i)));
            }
        } catch (err) {
            console.error('Failed to load videos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenVideo = async (path: string) => {
        if (window.electron?.openVideo) {
            await window.electron.openVideo(path);
        }
    };

    const handleDeleteVideo = async (path: string) => {
        if (window.electron?.deleteVideo) {
            const confirmed = confirm('Are you sure you want to delete this video?');
            if (confirmed) {
                await window.electron.deleteVideo(path);
                loadVideos(); // Reload the list
            }
        }
    };

    const handleOpenFolder = async () => {
        if (window.electron?.openFolder) {
            await window.electron.openFolder(saveDirectory);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex-1 flex flex-col bg-[var(--color-background-dark)]">
            {/* Header */}
            <div className="border-b border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] px-6 py-4">
                <div className="flex items-center justify-between">
                    {isSelectionMode ? (
                        <div className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(false);
                                        setSelectedVideos(new Set());
                                    }}
                                    className="p-2 rounded-full hover:bg-[var(--color-background-dark)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                        {selectedVideos.size} Selected
                                    </h1>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                    className="flex items-center gap-2"
                                >
                                    {selectedVideos.size === videos.length ? (
                                        <CheckSquare className="w-4 h-4" />
                                    ) : (
                                        <Square className="w-4 h-4" />
                                    )}
                                    Select All
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    disabled={selectedVideos.size === 0}
                                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Recorded Videos</h1>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                    {videos.length} video{videos.length !== 1 ? 's' : ''} found
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {/* View Toggle */}
                                <div className="flex bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-md p-1 gap-1 mr-2">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'grid'
                                            ? 'bg-[var(--color-primary)] text-white shadow-md'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-dark)]'
                                            }`}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'list'
                                            ? 'bg-[var(--color-primary)] text-white shadow-md'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-dark)]'
                                            }`}
                                        title="List View"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadVideos}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenFolder}
                                    className="flex items-center gap-2"
                                >
                                    <FolderOpen className="w-4 h-4" />
                                    Open Folder
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-[var(--color-text-muted)]">Loading videos...</div>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Video className="w-16 h-16 text-[var(--color-text-muted)] mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                            No videos yet
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
                            Start recording to see your videos here. All recordings will be saved to your selected directory.
                        </p>
                        {saveDirectory && (
                            <p className="text-xs text-[var(--color-text-muted)] mt-4 font-mono">
                                {saveDirectory}
                            </p>
                        )}
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="flex flex-col gap-2">
                        {videos.map((video, index) => {
                            const isSelected = selectedVideos.has(video.path);
                            return (
                                <div
                                    key={index}
                                    onClick={() => toggleSelection(video.path)}
                                    className={`flex items-center gap-4 p-3 bg-[var(--color-surface-dark)] border rounded-lg transition-all duration-200 group relative cursor-pointer
                                        ${isSelected
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md translate-x-1'
                                            : 'border-[var(--color-border-dark)] hover:border-[var(--color-primary)]/50 hover:shadow-md hover:translate-x-1'
                                        }`}
                                >
                                    {/* Selection Checkbox */}
                                    <div className={`absolute left-3 top-3 z-20 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-dark)] border-[var(--color-border-dark)]'}`}>
                                            {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                                        </div>
                                    </div>

                                    {/* Thumbnail (Small) */}
                                    <div className="w-32 aspect-video bg-[var(--color-background-dark)] rounded overflow-hidden flex-shrink-0 relative ml-8">
                                        {video.thumbnail ? (
                                            <img
                                                src={video.thumbnail}
                                                alt={video.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Video className="w-6 h-6 text-[var(--color-text-muted)] opacity-30" />
                                            </div>
                                        )}
                                        {/* Play Overlay on Hover - Only show if not multiple items selected or selection mode not active */}
                                        {!isSelectionMode && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenVideo(video.path);
                                                    }}
                                                    className="text-white hover:scale-110 transition-transform"
                                                >
                                                    <Play className="w-8 h-8 fill-white" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm font-medium truncate mb-1 transition-colors ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]'}`}>
                                            {video.name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                                            <span className="font-mono bg-[var(--color-border-dark)]/50 px-1.5 py-0.5 rounded">{formatFileSize(video.size)}</span>
                                            <span>{formatDate(video.created)}</span>
                                        </div>
                                    </div>

                                    {/* Actions - Hide in selection mode */}
                                    {!isSelectionMode && (
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenVideo(video.path);
                                                }}
                                                className="p-2 rounded-full hover:bg-[var(--color-primary)]/10 text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
                                                title="Play"
                                            >
                                                <Play className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteVideo(video.path);
                                                }}
                                                className="p-2 rounded-full hover:bg-red-500/10 text-[var(--color-text-primary)] hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {videos.map((video, index) => {
                            const isSelected = selectedVideos.has(video.path);
                            return (
                                <div
                                    key={index}
                                    onClick={() => toggleSelection(video.path)}
                                    className={`bg-[var(--color-surface-dark)] border rounded-lg overflow-hidden transition-all duration-300 group cursor-pointer relative
                                        ${isSelected
                                            ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] shadow-xl shadow-[var(--color-primary)]/10 -translate-y-1'
                                            : 'border-[var(--color-border-dark)] hover:border-[var(--color-primary)]/50 hover:shadow-xl hover:shadow-[var(--color-primary)]/10 hover:-translate-y-1'
                                        }`}
                                >
                                    {/* Selection Checkbox */}
                                    <div className={`absolute left-2 top-2 z-20 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}>
                                        <div className={`w-6 h-6 rounded border shadow-sm flex items-center justify-center ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-dark)] border-[var(--color-border-dark)]/80 backdrop-blur-sm'}`}>
                                            {isSelected && <CheckSquare className="w-4 h-4" />}
                                        </div>
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="aspect-video bg-[var(--color-background-dark)] flex items-center justify-center relative overflow-hidden">
                                        {video.thumbnail ? (
                                            <>
                                                {loadingThumbnails.has(index) && (
                                                    <div className="absolute inset-0 bg-[var(--color-surface-dark)] animate-pulse z-10 flex items-center justify-center">
                                                        <Video className="w-8 h-8 text-[var(--color-text-muted)] opacity-20" />
                                                    </div>
                                                )}
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.name}
                                                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loadingThumbnails.has(index) ? 'opacity-0' : 'opacity-100'}`}
                                                    onLoad={() => {
                                                        setLoadingThumbnails(prev => {
                                                            const next = new Set(prev);
                                                            next.delete(index);
                                                            return next;
                                                        });
                                                    }}
                                                />
                                                {/* Overlay gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                            </>
                                        ) : (
                                            <Video className="w-12 h-12 text-[var(--color-text-muted)] opacity-30 transition-transform duration-300 group-hover:scale-110" />
                                        )}

                                        {/* Actions Overlay - Hide in selection mode */}
                                        {!isSelectionMode && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenVideo(video.path);
                                                    }}
                                                    className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:scale-125 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-[var(--color-primary)]/50 group/play"
                                                    title="Play video"
                                                >
                                                    <Play className="w-5 h-5 ml-0.5 group-hover/play:ml-1 transition-all" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteVideo(video.path);
                                                    }}
                                                    className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-125 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-red-500/50 hover:bg-red-600"
                                                    title="Delete video"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 bg-gradient-to-b from-transparent to-[var(--color-background-dark)]/30">
                                        <h3 className="text-sm font-medium text-[var(--color-text-primary)] truncate mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                                            {video.name}
                                        </h3>
                                        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                                            <span className="font-mono">{formatFileSize(video.size)}</span>
                                            <span>{formatDate(video.created)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
