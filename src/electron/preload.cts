const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectDirectory: () => ipcInvoke('dialog:selectDirectory'),
    getDefaultSaveDirectory: () => ipcInvoke('getDefaultSaveDirectory'),
    getSources: () => ipcInvoke('getSources'),
    getPrimaryScreen: () => ipcInvoke('getPrimaryScreen'),
    startRecording: () => ipcInvoke('startRecording'),
    saveChunk: (chunk: ArrayBuffer) => ipcInvoke('saveChunk', chunk),
    stopRecording: (saveDir: string) => ipcInvoke('stopRecording', saveDir),
    openRegionSelector: () => ipcInvoke('openRegionSelector'),
    closeRegionSelector: () => ipcInvoke('closeRegionSelector'),
    regionSelected: (region: Region) => ipcInvoke('regionSelected', region),
    onRegionSelected: (callback: (region: Region, sourceId?: string) => void) => {
        ipcRenderer.on('region-selected', (_event: any, region: any, sourceId: any) => callback(region, sourceId));
    },
    prepareRecording: (id: string) => ipcInvoke('prepareRecording', id),
    getRegionBackground: () => ipcInvoke('getRegionBackground'),
} satisfies Window['electron']);

const ipcInvoke = <Key extends keyof EventPayloadMapping>(
    key: Key,
    ...args: Key extends keyof EventParamsMapping ? EventParamsMapping[Key] : any[]
): Promise<EventPayloadMapping[Key]> => {
    return ipcRenderer.invoke(key, ...args);
}