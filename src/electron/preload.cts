const { contextBridge, ipcRenderer } = require('electron');
import type { IpcRendererEvent } from 'electron';

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
        ipcRenderer.on('region-selected', (_event: IpcRendererEvent, region: Region, sourceId?: string) => callback(region, sourceId));
    },
    prepareRecording: (id: string) => ipcInvoke('prepareRecording', id),
    getRegionBackground: () => ipcInvoke('getRegionBackground'),
} satisfies Window['electron']);

const ipcInvoke = <Key extends keyof EventPayloadMapping>(
    key: Key,
    ...args: Key extends keyof EventParamsMapping ? EventParamsMapping[Key] : never[]
): Promise<EventPayloadMapping[Key]> => {
    return ipcRenderer.invoke(key, ...args);
}