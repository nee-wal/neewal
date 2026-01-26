import { app, BrowserWindow, dialog, desktopCapturer, ipcMain } from 'electron';
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

})