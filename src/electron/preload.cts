const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectDirectory: () => ipcInvoke('dialog:selectDirectory'),
    getDefaultSaveDirectory: () => ipcInvoke('getDefaultSaveDirectory'),
} satisfies Window['electron']);

const ipcInvoke = <Key extends keyof EventPayloadMapping>(key: Key): Promise<EventPayloadMapping[Key]> => {
    return ipcRenderer.invoke(key);
}