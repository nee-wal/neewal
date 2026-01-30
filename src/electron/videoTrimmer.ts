import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface TrimExportOptions {
    inputPath: string;
    outputPath: string;
    startTime: number;  // in seconds
    endTime: number;    // in seconds
    onProgress?: (progress: number) => void;
}

export interface TrimExportResult {
    success: boolean;
    outputPath?: string;
    error?: string;
}

/**
 * Export a trimmed video using FFmpeg with non-destructive editing
 * This creates a new file containing only the trimmed portion
 */
export async function exportTrimmedVideo(options: TrimExportOptions): Promise<TrimExportResult> {
    const { inputPath, outputPath, startTime, endTime, onProgress } = options;

    try {
        // Validate input file exists
        await fs.access(inputPath);

        // Calculate duration
        const duration = endTime - startTime;

        if (duration <= 0) {
            return {
                success: false,
                error: 'Invalid trim range: end time must be greater than start time'
            };
        }

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        // FFmpeg command for trimming
        // Using -ss before -i for faster seeking (input seeking)
        // -c copy for stream copy (no re-encoding, fastest and lossless)
        // Falls back to re-encoding if stream copy fails
        const args = [
            '-ss', startTime.toString(),           // Start time
            '-i', inputPath,                        // Input file
            '-t', duration.toString(),              // Duration to extract
            '-c', 'copy',                           // Copy streams (no re-encode)
            '-avoid_negative_ts', 'make_zero',      // Fix timestamp issues
            '-y',                                   // Overwrite output file
            outputPath
        ];

        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', args);

            let stderr = '';

            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();

                // Parse progress from FFmpeg output
                // FFmpeg outputs progress like: time=00:00:10.00
                const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
                if (timeMatch && onProgress) {
                    const hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    const seconds = parseFloat(timeMatch[3]);
                    const currentTime = hours * 3600 + minutes * 60 + seconds;
                    const progress = Math.min(100, (currentTime / duration) * 100);
                    onProgress(Math.floor(progress));
                }
            });

            ffmpeg.on('close', async (code) => {
                if (code === 0) {
                    // Verify output file was created
                    try {
                        await fs.access(outputPath);
                        resolve({
                            success: true,
                            outputPath
                        });
                    } catch (err) {
                        resolve({
                            success: false,
                            error: 'Output file was not created'
                        });
                    }
                } else {
                    // If stream copy failed, try re-encoding
                    if (stderr.includes('codec') || stderr.includes('stream')) {
                        console.log('Stream copy failed, attempting re-encode...');

                        // Retry with re-encoding
                        const reencodeArgs = [
                            '-ss', startTime.toString(),
                            '-i', inputPath,
                            '-t', duration.toString(),
                            '-c:v', 'libx264',              // H.264 video codec
                            '-preset', 'fast',              // Encoding speed
                            '-crf', '23',                   // Quality (lower = better, 18-28 range)
                            '-c:a', 'aac',                  // AAC audio codec
                            '-b:a', '128k',                 // Audio bitrate
                            '-movflags', '+faststart',      // Web optimization
                            '-y',
                            outputPath
                        ];

                        const ffmpegRetry = spawn('ffmpeg', reencodeArgs);
                        let retryStderr = '';

                        ffmpegRetry.stderr.on('data', (data) => {
                            retryStderr += data.toString();

                            const timeMatch = retryStderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
                            if (timeMatch && onProgress) {
                                const hours = parseInt(timeMatch[1], 10);
                                const minutes = parseInt(timeMatch[2], 10);
                                const seconds = parseFloat(timeMatch[3]);
                                const currentTime = hours * 3600 + minutes * 60 + seconds;
                                const progress = Math.min(100, (currentTime / duration) * 100);
                                onProgress(Math.floor(progress));
                            }
                        });

                        ffmpegRetry.on('close', async (retryCode) => {
                            if (retryCode === 0) {
                                try {
                                    await fs.access(outputPath);
                                    resolve({
                                        success: true,
                                        outputPath
                                    });
                                } catch (err) {
                                    resolve({
                                        success: false,
                                        error: 'Output file was not created after re-encode'
                                    });
                                }
                            } else {
                                resolve({
                                    success: false,
                                    error: `FFmpeg re-encode failed with code ${retryCode}: ${retryStderr}`
                                });
                            }
                        });

                        ffmpegRetry.on('error', (err) => {
                            resolve({
                                success: false,
                                error: `Failed to spawn FFmpeg for re-encode: ${err.message}`
                            });
                        });
                    } else {
                        resolve({
                            success: false,
                            error: `FFmpeg failed with code ${code}: ${stderr}`
                        });
                    }
                }
            });

            ffmpeg.on('error', (err) => {
                resolve({
                    success: false,
                    error: `Failed to spawn FFmpeg: ${err.message}. Make sure FFmpeg is installed.`
                });
            });
        });
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate a unique output filename for trimmed video
 */
export function generateTrimmedFilename(originalPath: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return path.join(dir, `${basename}_trimmed_${timestamp}${ext}`);
}

/**
 * Get video metadata using FFprobe
 */
export async function getVideoMetadata(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
} | null> {
    return new Promise((resolve) => {
        const ffprobe = spawn('ffprobe', [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            videoPath
        ]);

        let stdout = '';

        ffprobe.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        ffprobe.on('close', (code) => {
            if (code === 0) {
                try {
                    const data = JSON.parse(stdout);
                    const videoStream = data.streams?.find((s: any) => s.codec_type === 'video');

                    if (videoStream) {
                        // Parse frame rate (can be in format like "30/1")
                        let fps = 30; // default
                        if (videoStream.r_frame_rate) {
                            const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
                            fps = den ? num / den : num;
                        }

                        resolve({
                            duration: parseFloat(data.format?.duration || '0'),
                            width: videoStream.width || 0,
                            height: videoStream.height || 0,
                            fps
                        });
                    } else {
                        resolve(null);
                    }
                } catch (err) {
                    console.error('Failed to parse ffprobe output:', err);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });

        ffprobe.on('error', () => {
            resolve(null);
        });
    });
}
