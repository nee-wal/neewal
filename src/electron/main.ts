import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { isDev } from "./utils.js";
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

    ipcMain.handle('get-default-save-dir', () => {
        return getDefaultSaveDirectory();
    });

    ipcMain.handle('dialog:selectDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
        });
        if (canceled) {
            return null;
        } else {
            return filePaths[0];
        }
    });

})