import { app, BrowserWindow, dialog, desktopCapturer, ipcMain, screen } from 'electron';
import { ipcMainHandle, isDev } from "./utils.js";
import { unlink, createWriteStream, WriteStream } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { getPreLoadPath, getUiPath } from "./pathResolver.js";
import { getDefaultSaveDirectory } from "./utils.js";

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        minWidth: 600,
        minHeight: 600,
        webPreferences: {
            preload: getPreLoadPath(),
        },
        autoHideMenuBar: true,
    });

    // Handle automatic source selection for getDisplayMedia
    mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
            if (pendingSourceId) {
                const source = sources.find(s => s.id === pendingSourceId);
                if (source) {
                    callback({ video: source, audio: 'loopback' });
                } else {
                    console.log('Pending source not found:', pendingSourceId);
                    // Fallback to first screen
                    callback({ video: sources[0], audio: 'loopback' });
                }
                pendingSourceId = null;
            } else {
                // If no pending ID, default behavior (or select first screen to avoid hanging)
                // Since this handler effectively disables the default picker, we have to choose something.
                // We'll choose the primary screen consistently if not specified.
                callback({ video: sources[0], audio: 'loopback' });
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

    ipcMain.handle('saveChunk', async (event, arrayBuffer) => {
        if (recordingStream) {
            recordingStream.write(Buffer.from(arrayBuffer));
        }
    });

    ipcMain.handle('stopRecording', async (event, saveDir: string) => {
        return new Promise((resolve, reject) => {
            if (recordingStream) {
                recordingStream.end(async () => {
                    // Conversion to MP4 using ffmpeg
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
                    const outputFilename = `Neewal_${yyyy}-${mm}-${dd}_${h}-${m}-${s}.mp4`;
                    const outputPath = join(saveDir, outputFilename);

                    // Allow ffmpeg path to be configurable or found in path
                    const ffmpegPath = '/usr/bin/ffmpeg'; // Hardcoded as per user instructions for now/Linux

                    const ffmpeg = spawn(ffmpegPath, [
                        '-i', tempFilePath,
                        '-c:v', 'copy', // Try copy first, or use libx264 if needed. Copy is fast.
                        '-c:a', 'aac',
                        '-strict', 'experimental',
                        outputPath
                    ]);

                    ffmpeg.on('close', (code) => {
                        if (code === 0) {
                            // Delete temp file
                            unlink(tempFilePath!, () => { });
                            resolve(outputPath);
                        } else {
                            console.error('ffmpeg failed with code', code);
                            resolve(null);
                        }
                    });

                    ffmpeg.on('error', (err) => {
                        console.error('ffmpeg spawn error', err);
                        // Fallback: Just move the file if ffmpeg fails (rename to mp4)
                        // But user wants MP4.
                        reject(err);
                    });

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
            }
        } catch (error) {
            console.error('Failed to capture screen for background:', error);
            regionScreenshot = null;
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

    ipcMain.handle('prepareRecording', async (event, id: string) => {
        pendingSourceId = id;
        return true;
    });

    ipcMainHandle('closeRegionSelector', async () => {
        if (regionSelectorWindow) {
            regionSelectorWindow.close();
            regionSelectorWindow = null;
        }
        return true;
    });

    ipcMain.handle('regionSelected', async (_event: any, region: { x: number; y: number; width: number; height: number }) => {
        if (regionSelectorWindow) {
            regionSelectorWindow.close();
            regionSelectorWindow = null;
        }
        // Send the region back to the main window
        mainWindow.webContents.send('region-selected', region);
        return true;
    });

})