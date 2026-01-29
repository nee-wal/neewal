const { contextBridge, ipcRenderer } = require('electron');
import type { IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    selectDirectory: () => ipcInvoke('dialog:selectDirectory'),
    getDefaultSaveDirectory: () => ipcInvoke('getDefaultSaveDirectory'),
    getSources: () => ipcInvoke('getSources'),
    getPrimaryScreen: () => ipcInvoke('getPrimaryScreen'),
    startRecording: () => ipcInvoke('startRecording'),
    saveChunk: (chunk: ArrayBuffer) => ipcInvoke('saveChunk', chunk),
    stopRecording: (saveDir: string, format: string) => ipcInvoke('stopRecording', saveDir, format),
    openRegionSelector: () => ipcInvoke('openRegionSelector'),
    closeRegionSelector: () => ipcInvoke('closeRegionSelector'),
    regionSelected: (region: Region) => ipcInvoke('regionSelected', region),
    onRegionSelected: (callback: (region: Region, sourceId?: string) => void) => {
        ipcRenderer.on('region-selected', (_event: IpcRendererEvent, region: Region, sourceId?: string) => callback(region, sourceId));
    },
    prepareRecording: (id: string, includeAudio?: boolean) => ipcInvoke('prepareRecording', id, includeAudio),
    getRegionBackground: () => ipcInvoke('getRegionBackground'),
    showCountdown: () => ipcInvoke('showCountdown'),
    hideCountdown: () => ipcInvoke('hideCountdown'),
    updateCountdown: (count: number) => ipcInvoke('updateCountdown', count),
    onCountdownUpdate: (callback: (count: number) => void) => {
        ipcRenderer.on('countdown-update', (_event: IpcRendererEvent, count: number) => callback(count));
    },
    getVideos: () => ipcInvoke('getVideos'),
    openVideo: (path: string) => ipcInvoke('openVideo', path),
    deleteVideo: (path: string) => ipcInvoke('deleteVideo', path),
    openFolder: (path: string) => ipcInvoke('openFolder', path),
} satisfies Window['electron']);

const ipcInvoke = <Key extends keyof EventPayloadMapping>(
    key: Key,
    ...args: Key extends keyof EventParamsMapping ? EventParamsMapping[Key] : never[]
): Promise<EventPayloadMapping[Key]> => {
    return ipcRenderer.invoke(key, ...args);
}