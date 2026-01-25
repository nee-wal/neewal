const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
    getDefaultSaveDirectory: () => ipcRenderer.invoke('get-default-save-dir'),
} satisfies Window['electron']);