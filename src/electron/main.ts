import { app, BrowserWindow, dialog, desktopCapturer, ipcMain, screen } from 'electron';
import { ipcMainHandle, isDev } from "./utils.js";
import { unlink, createWriteStream, WriteStream } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { getPreLoadPath, getUiPath } from "./pathResolver.js";
import { getDefaultSaveDirectory } from "./utils.js";
import { registerVideoTrimmingHandlers } from './videoTrimmingHandlers.js';

app.on("ready", () => {
    // Register video trimming IPC handlers
    registerVideoTrimmingHandlers();

    const mainWindow = new BrowserWindow({
        minWidth: 600,
        minHeight: 600,
        webPreferences: {
            preload: getPreLoadPath(),
            webSecurity: false, // Allow loading local video files
        },
        autoHideMenuBar: true,
    });

    // Handle automatic source selection for getDisplayMedia
    mainWindow.webContents.session.setDisplayMediaRequestHandler((_request, callback) => {
        desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
            if (pendingSourceId) {
                const source = sources.find(s => s.id === pendingSourceId);
                if (source) {
                    callback({ video: source, audio: pendingIncludeAudio ? 'loopback' : undefined });
                } else {
                    console.log('Pending source not found:', pendingSourceId);
                    // Fallback to first screen
                    callback({ video: sources[0], audio: pendingIncludeAudio ? 'loopback' : undefined });
                }
                pendingSourceId = null;
                pendingIncludeAudio = false;
            } else {
                // If no pending ID, default behavior (or select first screen to avoid hanging)
                // Since this handler effectively disables the default picker, we have to choose something.
                // We'll choose the primary screen consistently if not specified.
                callback({ video: sources[0], audio: undefined });
            }
        }).catch(err => {
            console.error('Error in display media request handler:', err);
        });
    }, { useSystemPicker: true });

    if (isDev()) {
        mainWindow.loadURL('http://localhost:5123');
    } else {
        mainWindow.loadURL(getUiPath());
    }

    ipcMainHandle('getDefaultSaveDirectory', async () => {
        return getDefaultSaveDirectory();
    });

    ipcMainHandle('dialog:selectDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
        });
        if (canceled) {
            return null;
        } else {
            return filePaths[0];
        }
    });


    ipcMainHandle('getSources', async () => {
        return await desktopCapturer.getSources({ types: ['window', 'screen'], thumbnailSize: { width: 0, height: 0 } });
    });

    ipcMainHandle('getPrimaryScreen', async () => {
        // Get only screen sources for region recording
        const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
        return sources.length > 0 ? sources[0] : null;
    });

    let recordingStream: WriteStream | null = null;
    let tempFilePath: string | null = null;

    ipcMainHandle('startRecording', async () => {
        const tempDir = tmpdir();
        tempFilePath = join(tempDir, `neewal_temp_${Date.now()}.webm`);
        recordingStream = createWriteStream(tempFilePath);
        return tempFilePath;
    });

    ipcMain.handle('saveChunk', async (_event, arrayBuffer) => {
        if (recordingStream) {
            recordingStream.write(Buffer.from(arrayBuffer));
        }
    });

    ipcMain.handle('stopRecording', async (_event, saveDir: string) => {
        return new Promise((resolve, reject) => {
            if (recordingStream) {
                recordingStream.end(async () => {
                    if (!tempFilePath) {
                        resolve(null);
                        return;
                    }

                    const now = new Date();
                    const yyyy = now.getFullYear();
                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                    const dd = String(now.getDate()).padStart(2, '0');
                    const h = String(now.getHours()).padStart(2, '0');
                    const m = String(now.getMinutes()).padStart(2, '0');
                    const s = String(now.getSeconds()).padStart(2, '0');

                    // Always save as WebM (internal format, optimized for speed)
                    const outputFilename = `Neewal_${yyyy}-${mm}-${dd}_${h}-${m}-${s}.webm`;
                    const outputPath = join(saveDir, outputFilename);

                    try {
                        // Fix WebM duration using FFmpeg remux
                        // MediaRecorder doesn't write duration to WebM header, so we need to fix it
                        console.log('Fixing WebM duration metadata...');

                        const { spawn } = await import('child_process');
                        const ffmpegProcess = spawn('ffmpeg', [
                            '-i', tempFilePath,
                            '-c', 'copy',  // Stream copy (no re-encoding)
                            '-y',          // Overwrite output
                            outputPath
                        ]);

                        let stderr = '';
                        ffmpegProcess.stderr.on('data', (data) => {
                            stderr += data.toString();
                        });

                        ffmpegProcess.on('close', async (code) => {
                            // Clean up temp file
                            try {
                                const fs = await import('fs/promises');
                                await fs.unlink(tempFilePath!);
                            } catch (err) {
                                console.warn('Failed to delete temp file:', err);
                            }

                            if (code === 0) {
                                console.log(`Recording saved with fixed duration: ${outputPath}`);
                                resolve(outputPath);
                            } else {
                                console.error('FFmpeg failed to fix duration:', stderr);
                                // Fallback: try to save the original file anyway
                                try {
                                    const fs = await import('fs/promises');
                                    await fs.rename(tempFilePath!, outputPath);
                                    console.log(`Saved original file (duration may be missing): ${outputPath}`);
                                    resolve(outputPath);
                                } catch (err) {
                                    console.error('Failed to save recording:', err);
                                    reject(err);
                                }
                            }
                        });

                        ffmpegProcess.on('error', async (err) => {
                            console.error('FFmpeg process error:', err);
                            // Fallback: save the original file
                            try {
                                const fs = await import('fs/promises');
                                await fs.rename(tempFilePath!, outputPath);
                                console.log(`Saved original file (duration may be missing): ${outputPath}`);
                                resolve(outputPath);
                            } catch (fallbackErr) {
                                console.error('Failed to save recording:', fallbackErr);
                                reject(fallbackErr);
                            }
                        });

                    } catch (err) {
                        console.error('Failed to process recording:', err);
                        reject(err);
                    }
                });
                recordingStream = null;
            } else {
                resolve(null);
            }
        });
    });

    // Region selector window
    let regionSelectorWindow: BrowserWindow | null = null;
    let regionScreenshot: string | null = null;
    let cachedRegionScreenId: string | null = null;

    ipcMainHandle('getRegionBackground', async () => {
        return regionScreenshot;
    });

    ipcMainHandle('openRegionSelector', async () => {
        if (regionSelectorWindow) {
            regionSelectorWindow.close();
        }

        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.bounds;

        // Capture screenshot for background
        try {
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width, height }
            });
            // Assuming the first screen is primary for now or matching display logic
            // On Linux/Wayland primary display detection can be tricky, but usually sources[0] is strictly the main one provided by pipewire portal if available, or X11 root.
            if (sources.length > 0) {
                regionScreenshot = sources[0].thumbnail.toDataURL();
                cachedRegionScreenId = sources[0].id;
            } else {
                // If no sources found (e.g. user cancelled selection or permission denied)
                console.log('No sources available for background capture');
                return false;
            }
        } catch (error) {
            console.error('Failed to capture screen for background:', error);
            regionScreenshot = null;
            cachedRegionScreenId = null;
            // Abort if capture failed, as we likely need it for the overlay and permissions
            return false;
        }

        regionSelectorWindow = new BrowserWindow({
            width,
            height,
            x: 0,
            y: 0,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            movable: false,
            fullscreen: true,
            webPreferences: {
                preload: getPreLoadPath(),
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        if (isDev()) {
            regionSelectorWindow.loadURL('http://localhost:5123/#/region-selector');
        } else {
            regionSelectorWindow.loadURL(getUiPath() + '#/region-selector');
        }

        regionSelectorWindow.setAlwaysOnTop(true, 'screen-saver');
        regionSelectorWindow.setVisibleOnAllWorkspaces(true);
        regionSelectorWindow.setFullScreenable(false);

        return true;
    });

    let pendingSourceId: string | null = null;
    let pendingIncludeAudio: boolean = false;

    ipcMain.handle('prepareRecording', async (_event, id: string, includeAudio: boolean = false) => {
        pendingSourceId = id;
        pendingIncludeAudio = includeAudio;
        return true;
    });

    ipcMainHandle('closeRegionSelector', async () => {
        if (regionSelectorWindow) {
            regionSelectorWindow.close();
            regionSelectorWindow = null;
        }
        return true;
    });

    ipcMain.handle('regionSelected', async (_event, region: Region) => {
        if (regionSelectorWindow) {
            regionSelectorWindow.close();
            regionSelectorWindow = null;
        }
        // Send the region back to the main window
        mainWindow.webContents.send('region-selected', region, cachedRegionScreenId);
        return true;
    });

    // Countdown window
    let countdownWindow: BrowserWindow | null = null;

    ipcMainHandle('showCountdown', async () => {
        if (countdownWindow) {
            countdownWindow.close();
        }

        countdownWindow = new BrowserWindow({
            width: 300,
            height: 300,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            movable: false,
            center: true,
            hasShadow: false, // Cleaner look for transparent content
            webPreferences: {
                preload: getPreLoadPath(),
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        if (isDev()) {
            countdownWindow.loadURL('http://localhost:5123/#/countdown');
        } else {
            countdownWindow.loadURL(getUiPath() + '#/countdown');
        }

        countdownWindow.setAlwaysOnTop(true, 'screen-saver');
        countdownWindow.setVisibleOnAllWorkspaces(true);
        countdownWindow.setFullScreenable(false);

        return true;
    });

    ipcMainHandle('hideCountdown', async () => {
        if (countdownWindow) {
            countdownWindow.close();
            countdownWindow = null;
        }
        return true;
    });

    ipcMain.handle('updateCountdown', async (_event, count: number) => {
        if (countdownWindow) {
            countdownWindow.webContents.send('countdown-update', count);
        }
        return true;
    });

    // Video management handlers
    ipcMain.handle('getVideos', async () => {
        const saveDir = getDefaultSaveDirectory();
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            const files = await fs.readdir(saveDir);
            const videoExtensions = ['.mp4', '.webm', '.mkv', '.gif'];

            const videoFilesRaw = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return videoExtensions.includes(ext);
            });

            // Cleanup: Delete orphaned thumbnails
            const thumbnailFiles = files.filter(file => file.startsWith('.thumb_') && file.endsWith('.jpg'));
            const validThumbnailNames = new Set(videoFilesRaw.map(v => `.thumb_${v}.jpg`));

            const orphans = thumbnailFiles.filter(t => !validThumbnailNames.has(t));
            if (orphans.length > 0) {
                Promise.all(orphans.map(t =>
                    fs.unlink(path.join(saveDir, t)).catch(err => {
                        if (err.code !== 'ENOENT') console.warn('Failed to delete orphan:', t, err);
                    })
                )).then(() => console.log(`Cleaned up ${orphans.length} orphaned thumbnails`));
            }

            const videoFiles = await Promise.all(
                videoFilesRaw.map(async (file) => {
                    const filePath = path.join(saveDir, file);
                    const stats = await fs.stat(filePath);

                    // Generate thumbnail
                    let thumbnail: string | undefined;
                    try {
                        const thumbnailPath = path.join(saveDir, `.thumb_${file}.jpg`);

                        // Check if thumbnail already exists
                        try {
                            await fs.access(thumbnailPath);
                            // Thumbnail exists, read it
                            const thumbBuffer = await fs.readFile(thumbnailPath);
                            thumbnail = `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`;
                        } catch {
                            // Generate new thumbnail using ffmpeg
                            try {
                                await execAsync(
                                    `ffmpeg -i "${filePath}" -ss 00:00:01 -vframes 1 -vf scale=320:-1 "${thumbnailPath}" -y`,
                                    { timeout: 5000 }
                                );
                                const thumbBuffer = await fs.readFile(thumbnailPath);
                                thumbnail = `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`;
                            } catch (ffmpegErr) {
                                console.warn(`Failed to generate thumbnail for ${file}:`, ffmpegErr);
                            }
                        }
                    } catch (err) {
                        console.warn(`Thumbnail error for ${file}:`, err);
                    }

                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        thumbnail,
                    };
                })
            );

            // Sort by creation date, newest first
            return videoFiles.sort((a, b) => b.created.getTime() - a.created.getTime());
        } catch (err) {
            console.error('Failed to get videos:', err);
            return [];
        }
    });

    ipcMain.handle('openVideo', async (_event, videoPath: string) => {
        const { shell } = await import('electron');
        await shell.openPath(videoPath);
    });

    ipcMain.handle('deleteVideo', async (_event, videoPath: string) => {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            // Delete the video file
            await fs.unlink(videoPath);

            // Try to delete the thumbnail
            try {
                const dir = path.dirname(videoPath);
                const file = path.basename(videoPath);
                const thumbnailPath = path.join(dir, `.thumb_${file}.jpg`);
                await fs.unlink(thumbnailPath);
            } catch (thumbErr) {
                // Ignore error if thumbnail doesn't exist
                console.warn('Could not delete thumbnail:', thumbErr);
            }
        } catch (err) {
            console.error('Failed to delete video:', err);
            throw err; // Re-throw to notify frontend
        }
    });

    ipcMain.handle('openFolder', async (_event, folderPath: string) => {
        const { shell } = await import('electron');
        await shell.openPath(folderPath);
    });

})