import path from "path";
import { app } from "electron";
import { isDev } from "./utils.js";

export const getPreLoadPath = () => {
    return path.join(
        app.getAppPath(),
        isDev() ? '.' : '..',
        '/dist-electron/preload.cjs'
    )
}

export const getUiPath = () => {
    return path.join(app.getAppPath(), '/dist-react/index.html');
}

export const getAssetPath = () => {
    return path.join(app.getAppPath(), isDev() ? '.' : '..', '/src/assets');
}

