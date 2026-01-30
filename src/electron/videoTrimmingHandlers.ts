/**
 * IPC Handler for Video Trimming
 * 
 * Add this to your main Electron process (main.ts or index.ts)
 * This handles the exportTrimmedVideo IPC call from the renderer process
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { exportTrimmedVideo, generateTrimmedFilename, getVideoMetadata } from './videoTrimmer.js';

/**
 * Register the video trimming IPC handler
 * Call this function during your Electron app initialization
 */
export function registerVideoTrimmingHandlers() {

    // Handle video export with trimming
    ipcMain.handle('exportTrimmedVideo', async (
        event: IpcMainInvokeEvent,
        inputPath: string,
        startTime: number,
        endTime: number
    ) => {
        try {
            console.log(`Exporting trimmed video: ${inputPath}`);
            console.log(`Trim range: ${startTime}s - ${endTime}s`);

            // Generate output filename
            const outputPath = generateTrimmedFilename(inputPath);
            console.log(`Output path: ${outputPath}`);

            // Export the video with progress tracking
            const result = await exportTrimmedVideo({
                inputPath,
                outputPath,
                startTime,
                endTime,
                onProgress: (progress) => {
                    // Send progress updates to renderer
                    event.sender.send('export-progress', progress);
                }
            });

            if (result.success) {
                console.log(`Export successful: ${result.outputPath}`);
            } else {
                console.error(`Export failed: ${result.error}`);
            }

            return result;

        } catch (error) {
            console.error('Export error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    });

    // Optional: Get video metadata
    ipcMain.handle('getVideoMetadata', async (event: IpcMainInvokeEvent, videoPath: string) => {
        try {
            const metadata = await getVideoMetadata(videoPath);
            return metadata;
        } catch (error) {
            console.error('Failed to get video metadata:', error);
            return null;
        }
    });

    console.log('Video trimming IPC handlers registered');
}

/**
 * Example usage in your main process:
 * 
 * import { app, BrowserWindow } from 'electron';
 * import { registerVideoTrimmingHandlers } from './videoTrimmingHandlers';
 * 
 * app.whenReady().then(() => {
 *     registerVideoTrimmingHandlers();
 *     // ... rest of your app initialization
 * });
 */
