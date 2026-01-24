import { app, BrowserWindow } from 'electron';
import {isDev} from "./utils.js";
import {getPreLoadPath, getUiPath} from "./pathResolver.js";

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
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
})