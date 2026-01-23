import { app, BrowserWindow } from 'electron';

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
    });

    mainWindow.loadURL('http://localhost:5173');
})