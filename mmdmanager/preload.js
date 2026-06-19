const { contextBridge, ipcRenderer, clipboard } = require('electron');
const fs = require('fs');
const pathMod = require('path');
const processMod = require('process');

// App root directory for data storage
// Packaged: platform-appropriate persistent location, dev: __dirname
const isPackaged = __dirname.indexOf('.asar') !== -1;
let PROGRAMPATH;
if (isPackaged) {
    if (process.platform === 'win32') {
        // Windows: use AppData (portable extracts to temp, which gets cleared)
        PROGRAMPATH = pathMod.join(process.env.APPDATA, 'mmdmanager');
    } else {
        // macOS: exe directory
        PROGRAMPATH = pathMod.dirname(process.execPath);
    }
} else {
    PROGRAMPATH = __dirname;
}

// Wrap stat objects to convert methods to plain boolean properties
function wrapStats(stats) {
    return {
        dev: stats.dev,
        ino: stats.ino,
        mode: stats.mode,
        nlink: stats.nlink,
        uid: stats.uid,
        gid: stats.gid,
        rdev: stats.rdev,
        size: stats.size,
        blksize: stats.blksize,
        blocks: stats.blocks,
        atimeMs: stats.atimeMs,
        mtimeMs: stats.mtimeMs,
        ctimeMs: stats.ctimeMs,
        birthtimeMs: stats.birthtimeMs,
        atime: stats.atime,
        mtime: stats.mtime,
        ctime: stats.ctime,
        birthtime: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        isBlockDevice: stats.isBlockDevice(),
        isCharacterDevice: stats.isCharacterDevice(),
        isSymbolicLink: stats.isSymbolicLink(),
        isFIFO: stats.isFIFO(),
        isSocket: stats.isSocket()
    };
}

contextBridge.exposeInMainWorld('PROGRAMPATH', PROGRAMPATH);

contextBridge.exposeInMainWorld('fs', {
    readFile: (filePath, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }
        return fs.readFile(filePath, options, callback);
    },
    writeFile: (filePath, data, callback) => {
        return fs.writeFile(filePath, data, callback);
    },
    exists: (filePath, callback) => {
        return fs.exists(filePath, callback);
    },
    existsSync: (filePath) => {
        return fs.existsSync(filePath);
    },
    readdirSync: (dirPath) => {
        return fs.readdirSync(dirPath);
    },
    mkdirSync: (dirPath, options) => {
        return fs.mkdirSync(dirPath, options || { recursive: true });
    },
    statSync: (filePath) => {
        const s = fs.statSync(filePath);
        return wrapStats(s);
    },
    lstatSync: (filePath) => {
        const s = fs.lstatSync(filePath);
        return wrapStats(s);
    }
});

contextBridge.exposeInMainWorld('path', {
    extname: (p) => pathMod.extname(p),
    dirname: (p) => pathMod.dirname(p),
    join: (...args) => pathMod.join(...args),
    sep: pathMod.sep
});

contextBridge.exposeInMainWorld('process', {
    platform: processMod.platform,
    env: processMod.env
});

contextBridge.exposeInMainWorld('child_process', {
    exec: (command, options, callback) => {
        // exec is only used in the old code — delegate to main for cross-platform support
        return ipcRenderer.invoke('child-process:exec', { command, options });
    },
    spawn: (exePath, args, options) => {
        return ipcRenderer.invoke('child-process:spawn', { exePath, args, options });
    }
});

contextBridge.exposeInMainWorld('dialog', {
    openDirectory: (defaultPath) => ipcRenderer.invoke('dialog:openDirectory', defaultPath),
    openFile: (defaultPath, filters) => ipcRenderer.invoke('dialog:openFile', { defaultPath, filters })
});

contextBridge.exposeInMainWorld('clipboard', {
    writeText: (text) => clipboard.writeText(text)
});

contextBridge.exposeInMainWorld('shell', {
    openPath: (folderPath) => ipcRenderer.invoke('shell:openPath', folderPath)
});

// Listen for menu navigation commands from main process
ipcRenderer.on('menu:navigate', (event, route) => {
    // The Vue router is exposed as window.app.$router
    if (window.app && window.app.$router) {
        window.app.$router.replace(route);
    }
});
