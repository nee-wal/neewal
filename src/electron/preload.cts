const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectDirectory: () => ipcInvoke('dialog:selectDirectory'),
    getDefaultSaveDirectory: () => ipcInvoke('getDefaultSaveDirectory'),
    getSources: () => ipcInvoke('getSources'),
    startRecording: () => ipcInvoke('startRecording'),
    saveChunk: (chunk: ArrayBuffer) => ipcInvoke('saveChunk', chunk),
    stopRecording: (saveDir: string) => ipcInvoke('stopRecording', saveDir),
} satisfies Window['electron']);

const ipcInvoke = <Key extends keyof EventPayloadMapping>(
    key: Key,
    ...args: Key extends keyof EventParamsMapping ? EventParamsMapping[Key] : any[]
): Promise<EventPayloadMapping[Key]> => {
    return ipcRenderer.invoke(key, ...args);
}