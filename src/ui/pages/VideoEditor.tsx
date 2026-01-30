import { useState } from 'react';
import { ArrowLeft, Trash2, FolderOpen } from 'lucide-react';
import { VideoTrimmer, type TrimData } from '../components/VideoTrimmer';

interface VideoEditorProps {
    videoPath: string;
    onBack: () => void;
}

export default function VideoEditor({ videoPath, onBack }: VideoEditorProps) {
    const [trimData, setTrimData] = useState<TrimData | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const handleTrimChange = (data: TrimData) => {
        setTrimData(data);
    };

    const handleExport = async (data: TrimData) => {
        if (!window.electron) {
            alert('Export functionality requires Electron');
            return;
        }

        try {
            setIsExporting(true);
            setExportProgress(0);

            // Call electron API to export trimmed video
            // This will use FFmpeg to create a new file with only the trimmed portion
            const result = await window.electron.exportTrimmedVideo(
                videoPath,
                data.startTime,
                data.endTime
            );

            if (result.success) {
                alert(`Video exported successfully to: ${result.outputPath}`);

                // Open the folder containing the exported video
                if (result.outputPath) {
                    const folderPath = result.outputPath.substring(0, result.outputPath.lastIndexOf('/'));
                    await window.electron.openFolder(folderPath);
                }
            } else {
                alert(`Export failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Export error:', error);
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

    const videoName = videoPath.split('/').pop() || 'Unknown';

    return (
        <main className="flex-1 flex flex-col p-6 bg-[var(--color-background-dark)] relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)] opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 opacity-5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div className="w-full max-w-4xl mx-auto z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-lg bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all duration-200 active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Video Editor</h1>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1 font-mono">{videoName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleOpenFolder}
                            className="p-2 rounded-lg bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all duration-200 active:scale-95"
                            title="Open Folder"
                        >
                            <FolderOpen className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-lg bg-[var(--color-surface-dark)] border border-red-500/50 text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all duration-200 active:scale-95"
                            title="Delete Video"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Video Trimmer */}
                <VideoTrimmer
                    videoPath={videoPath}
                    onTrimChange={handleTrimChange}
                    onExport={handleExport}
                />

                {/* Export Progress */}
                {isExporting && (
                    <div className="mt-6 bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                Exporting Video...
                            </span>
                            <span className="text-sm text-[var(--color-text-muted)] font-mono">
                                {exportProgress}%
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[var(--color-background-dark)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--color-primary)] transition-all duration-300 rounded-full"
                                style={{ width: `${exportProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Trim Info Display */}
                {trimData && (
                    <div className="mt-6 bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-xl p-6">
                        <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase mb-3">
                            Export Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-[var(--color-text-muted)]">Original Duration:</span>
                                <span className="ml-2 text-[var(--color-text-primary)] font-mono">
                                    {formatDuration(trimData.duration)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[var(--color-text-muted)]">Trimmed Duration:</span>
                                <span className="ml-2 text-[var(--color-text-primary)] font-mono">
                                    {formatDuration(trimData.endTime - trimData.startTime)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[var(--color-text-muted)]">Reduction:</span>
                                <span className="ml-2 text-[var(--color-text-primary)] font-mono">
                                    {((1 - (trimData.endTime - trimData.startTime) / trimData.duration) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div>
                                <span className="text-[var(--color-text-muted)]">Export Format:</span>
                                <span className="ml-2 text-[var(--color-text-primary)] font-mono">
                                    MP4 (H.264)
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
