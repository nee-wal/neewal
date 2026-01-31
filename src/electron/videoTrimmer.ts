import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export type ExportFormat = 'mp4' | 'webm' | 'mkv' | 'gif';

export interface TrimExportOptions {
    inputPath: string;
    outputPath: string;
    startTime: number;  // in seconds
    endTime: number;    // in seconds
    format: ExportFormat; // Output format
    onProgress?: (progress: number) => void;
}

export interface TrimExportResult {
    success: boolean;
    outputPath?: string;
    error?: string;
}

/**
 * Detect available GPU encoders
 */
async function detectGPUEncoder(): Promise<'vaapi' | 'nvenc' | 'none'> {
    return new Promise((resolve) => {
        // Check for NVIDIA GPU (NVENC)
        const nvencCheck = spawn('ffmpeg', ['-hide_banner', '-encoders']);
        let nvencOutput = '';

        nvencCheck.stdout.on('data', (data) => {
            nvencOutput += data.toString();
        });

        nvencCheck.on('close', () => {
            if (nvencOutput.includes('h264_nvenc')) {
                resolve('nvenc');
                return;
            }

            // Check for VAAPI (Intel/AMD)
            const vaapiCheck = spawn('ffmpeg', ['-hide_banner', '-hwaccels']);
            let vaapiOutput = '';

            vaapiCheck.stdout.on('data', (data) => {
                vaapiOutput += data.toString();
            });

            vaapiCheck.on('close', () => {
                if (vaapiOutput.includes('vaapi')) {
                    resolve('vaapi');
                } else {
                    resolve('none');
                }
            });

            vaapiCheck.on('error', () => resolve('none'));
        });

        nvencCheck.on('error', () => resolve('none'));
    });
}

/**
 * Build FFmpeg arguments based on format and GPU support
 */
function buildFFmpegArgs(
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    format: ExportFormat,
    gpuEncoder: 'vaapi' | 'nvenc' | 'none'
): string[] {
    const baseArgs = [
        '-ss', startTime.toString(),
        '-i', inputPath,
        '-t', duration.toString(),
    ];

    switch (format) {
        case 'webm':
            // WebM: Fast stream copy (no re-encoding)
            return [
                ...baseArgs,
                '-c', 'copy',
                '-avoid_negative_ts', 'make_zero',
                '-y',
                outputPath
            ];

        case 'mkv':
            // MKV: Fast stream copy (no re-encoding)
            return [
                ...baseArgs,
                '-c', 'copy',
                '-avoid_negative_ts', 'make_zero',
                '-y',
                outputPath
            ];

        case 'mp4':
            // MP4: H.264 encoding with GPU acceleration if available
            if (gpuEncoder === 'nvenc') {
                return [
                    ...baseArgs,
                    '-c:v', 'h264_nvenc',
                    '-preset', 'fast',
                    '-cq', '23',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-movflags', '+faststart',
                    '-y',
                    outputPath
                ];
            } else if (gpuEncoder === 'vaapi') {
                return [
                    ...baseArgs,
                    '-vaapi_device', '/dev/dri/renderD128',
                    '-vf', 'format=nv12,hwupload',
                    '-c:v', 'h264_vaapi',
                    '-qp', '23',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-movflags', '+faststart',
                    '-y',
                    outputPath
                ];
            } else {
                // CPU encoding fallback
                return [
                    ...baseArgs,
                    '-c:v', 'libx264',
                    '-preset', 'fast',
                    '-crf', '23',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-movflags', '+faststart',
                    '-y',
                    outputPath
                ];
            }

        case 'gif':
            // GIF: Optimized palette generation
            return [
                ...baseArgs,
                '-vf', 'fps=15,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer',
                '-loop', '0',
                '-y',
                outputPath
            ];

        default:
            // Default to MP4 CPU encoding
            return [
                ...baseArgs,
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                '-y',
                outputPath
            ];
    }
}

/**
 * Export a trimmed video using FFmpeg with format selection and GPU acceleration
 * This creates a new file containing only the trimmed portion in the chosen format
 */
/**
 * Ensures specific file is a valid video file with metadata.
 * If metadata is missing/invalid, attempts to remux the file to a temp location.
 * Returns the path to the valid file (either original or temp).
 */
async function ensureValidVideoFile(inputPath: string): Promise<{ path: string; isTemp: boolean; metadata?: any }> {
    let metadata = await getVideoMetadata(inputPath);

    // Check if duration is valid and > 0, and not Infinity
    if (metadata && !isNaN(metadata.duration) && metadata.duration > 0 && Number.isFinite(metadata.duration)) {
        return { path: inputPath, isTemp: false, metadata };
    }

    console.warn(`[VideoTrimmer] Invalid duration detected for ${inputPath}: ${metadata?.duration}. Attempting recovery...`);

    // Recovery: Remux to fix metadata
    const tempDir = path.dirname(inputPath);
    const tempPath = path.join(tempDir, `recovery_${Date.now()}.webm`);

    return new Promise((resolve) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', inputPath,
            '-c', 'copy',
            '-y',
            tempPath
        ]);

        ffmpeg.on('close', async (code) => {
            if (code === 0) {
                // Verify the recovered file
                const newMetadata = await getVideoMetadata(tempPath);
                if (newMetadata && !isNaN(newMetadata.duration) && newMetadata.duration > 0 && Number.isFinite(newMetadata.duration)) {
                    console.log(`[VideoTrimmer] Recovery successful. New duration: ${newMetadata.duration}`);
                    resolve({ path: tempPath, isTemp: true, metadata: newMetadata });
                } else {
                    console.error('[VideoTrimmer] Recovery failed to fix metadata.');
                    try { await fs.unlink(tempPath); } catch { }
                    resolve({ path: inputPath, isTemp: false, metadata });
                }
            } else {
                console.error('[VideoTrimmer] Recovery ffmpeg process failed.');
                resolve({ path: inputPath, isTemp: false, metadata });
            }
        });

        ffmpeg.on('error', (err) => {
            console.error('[VideoTrimmer] Recovery error:', err);
            resolve({ path: inputPath, isTemp: false, metadata });
        });
    });
}

export async function exportTrimmedVideo(options: TrimExportOptions): Promise<TrimExportResult> {
    const { inputPath, outputPath, startTime, endTime, format, onProgress } = options;

    let validFile: { path: string; isTemp: boolean; metadata?: any } | null = null;

    try {
        // Validate input file exists
        await fs.access(inputPath);

        // Ensure we have a valid video file with metadata
        validFile = await ensureValidVideoFile(inputPath);
        const sourcePath = validFile.path;

        let finalStartTime = startTime;
        let finalEndTime = endTime;

        // Handle bad inputs (Infinity or NaN)
        if (!Number.isFinite(finalEndTime) || finalEndTime <= 0) {
            if (validFile.metadata?.duration) {
                console.log(`[VideoTrimmer] End time was invalid (${endTime}), using full duration: ${validFile.metadata.duration}`);
                finalEndTime = validFile.metadata.duration;
            }
        }

        if (!Number.isFinite(finalStartTime) || finalStartTime < 0) {
            finalStartTime = 0;
        }

        // Calculate duration to export
        let exportDuration = finalEndTime - finalStartTime;

        if (exportDuration <= 0) {
            if (validFile.metadata?.duration) {
                exportDuration = validFile.metadata.duration;
                finalStartTime = 0;
            }
        }

        if (exportDuration <= 0) {
            throw new Error('Invalid trim range: Unable to determine valid video duration.');
        }

        // Backward compatibility for progress monitoring
        const duration = exportDuration;

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Helper function to run FFmpeg
        const runExport = async (encoder: 'vaapi' | 'nvenc' | 'none'): Promise<TrimExportResult> => {
            const args = buildFFmpegArgs(sourcePath, outputPath, finalStartTime, exportDuration, format, encoder);
            console.log(`[VideoTrimmer] Running export with encoder: ${encoder}`);
            console.log('FFmpeg command:', 'ffmpeg', args.join(' '));

            return new Promise((resolve) => {
                const ffmpeg = spawn('ffmpeg', args);
                let stderr = '';

                ffmpeg.stderr.on('data', (data) => {
                    const chunk = data.toString();
                    stderr += chunk;

                    // Parse progress from CURRENT chunk
                    // Use matchAll to find the LATEST time update in this chunk
                    const matches = [...chunk.matchAll(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/g)];

                    if (matches.length > 0 && onProgress) {
                        const lastMatch = matches[matches.length - 1];
                        const hours = parseInt(lastMatch[1], 10);
                        const minutes = parseInt(lastMatch[2], 10);
                        const seconds = parseFloat(lastMatch[3]);
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
                            resolve({ success: true, outputPath });
                        } catch (err) {
                            resolve({ success: false, error: 'Output file was not created' });
                        }
                    } else {
                        resolve({ success: false, error: `FFmpeg failed with code ${code}: ${stderr.slice(-500)}` });
                    }
                });

                ffmpeg.on('error', (err) => {
                    resolve({ success: false, error: `Failed to spawn FFmpeg: ${err.message}` });
                });
            });
        };

        // Detect GPU encoder (only for MP4)
        let gpuEncoder: 'vaapi' | 'nvenc' | 'none' = format === 'mp4' ? await detectGPUEncoder() : 'none';
        if (gpuEncoder !== 'none') {
            console.log(`[VideoTrimmer] Detected GPU capability: ${gpuEncoder}`);
        }

        // 1. Try with detected GPU encoder
        let result = await runExport(gpuEncoder);

        // 2. Fallback to CPU if GPU failed (and we actually tried GPU)
        if (!result.success && gpuEncoder !== 'none') {
            console.warn(`[VideoTrimmer] GPU export failed. Falling back to CPU encoding... Error: ${result.error}`);
            result = await runExport('none');
        }

        // Cleanup temp file if needed (after all attempts)
        if (validFile?.isTemp) {
            try {
                console.log('Cleaning up temp recovery file:', validFile.path);
                await fs.unlink(validFile.path);
            } catch (e) {
                console.warn('Failed to cleanup temp file:', e);
            }
        }

        return result;

    } catch (error) {
        // Clean up temp file in catch block too
        if (validFile?.isTemp) {
            try {
                await fs.unlink(validFile.path);
            } catch (e) { }
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate a unique output filename for trimmed video
 */
export function generateTrimmedFilename(originalPath: string, format: ExportFormat): string {
    const dir = path.dirname(originalPath);
    const basename = path.basename(originalPath, path.extname(originalPath));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return path.join(dir, `${basename}_trimmed_${timestamp}.${format}`);
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
