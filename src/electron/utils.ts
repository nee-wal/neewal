import path from 'path';
import os from 'os';

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