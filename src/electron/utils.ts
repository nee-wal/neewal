import path from 'path';
import os from 'os';
import { ipcMain } from "electron";

export const isDev = (): boolean => {
    return process.env.NODE_ENV === 'development';
}

export const getDefaultSaveDirectory = (): string => {
    switch (os.platform()) {
        case 'win32':
            return path.join(os.homedir(), 'Videos', 'Neewal');
        case 'darwin':
            return path.join(os.homedir(), 'Movies', 'Neewal');
        case 'linux':
            return path.join(os.homedir(), 'Videos', 'Neewal');
        default:
            return path.join(os.homedir(), 'Neewal');
    }
}

export const ipcMainHandle = <Key extends keyof EventPayloadMapping,>(
    key: Key,
    handler: () => Promise<EventPayloadMapping[Key]>
) => {
    ipcMain.handle(key, async () => {
        return await handler(); // ← unwrap here
    });
};
