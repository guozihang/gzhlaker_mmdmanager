const { contextBridge, ipcRenderer, clipboard } = require('electron');
const fs = require('fs');
const pathMod = require('path');
const processMod = require('process');

// App root directory for data storage
// Windows: %APPDATA%/mmdmanager, macOS: ~/.config/mmdmanager
function getDefaultDataPath() {
    if (process.platform === 'win32') {
        return pathMod.join(process.env.APPDATA, 'mmdmanager');
    } else {
        return pathMod.join(process.env.HOME, '.config', 'mmdmanager');
    }
}
const isPackaged = __dirname.indexOf('.asar') !== -1;
const CONFIGPATH = getDefaultDataPath();
let PROGRAMPATH;
if (isPackaged) {
    if (process.platform === 'win32') {
        PROGRAMPATH = CONFIGPATH;
    } else {
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
contextBridge.exposeInMainWorld('CONFIGPATH', CONFIGPATH);

contextBridge.exposeInMainWorld('fs', {
    readFile: (filePath, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }
        return fs.readFile(filePath, options || 'utf8', function(err, data) {
            if (err) return callback(err);
            if (typeof data === 'string') return callback(null, data);
            callback(null, Buffer.isBuffer(data) ? data.toString('utf8') : data);
        });
    },
    readFileSync: (filePath, options) => {
        var data = fs.readFileSync(filePath, options);
        if (typeof data === 'string') return data;
        return Buffer.isBuffer(data) ? data.toString('utf8') : data;
    },
    writeFile: (filePath, data, callback) => {
        return fs.writeFile(filePath, data, callback);
    },
    writeFileSync: (filePath, data, options) => {
        return fs.writeFileSync(filePath, data, options);
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
    basename: (p) => pathMod.basename(p),
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

contextBridge.exposeInMainWorld('exportToMmd', (opts) => {
    return ipcRenderer.invoke('export:toMmd', opts);
});

contextBridge.exposeInMainWorld('copyFolder', (src, dest) => {
    return ipcRenderer.invoke('fs:copyFolder', { src, dest });
});

contextBridge.exposeInMainWorld('rebuildMenu', () => {
    return ipcRenderer.invoke('menu:rebuild');
});

// Listen for menu navigation commands from main process
ipcRenderer.on('menu:navigate', (event, route) => {
    window.postMessage({ type: 'menu:navigate', route: route }, '*');
});

// Intercept file drops — File.path works on Windows but not macOS.
// On macOS we read via webkitGetAsEntry and write to a temp directory.
document.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
});
document.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    var droppedPath = e.dataTransfer.files[0].path;
    if (droppedPath) {
        // Windows / Linux: File.path works
        window.postMessage({ type: 'file:drop', path: droppedPath }, '*');
        return;
    }

    // macOS: webkitGetAsEntry tree walk
    var entry = items[0].webkitGetAsEntry();
    if (!entry) return;

    // For single files, make a folder named after the file (without extension)
    var folderName = entry.name;
    if (entry.isFile) {
        folderName = entry.name.replace(/\.[^.]+$/, '');
    }
    var destDir = pathMod.join(PROGRAMPATH, '.temp', folderName);
    try { fs.rmSync(destDir, { recursive: true, force: true }); } catch (_) {}
    fs.mkdirSync(destDir, { recursive: true });

    var pending = [];

    function copyEntry(ent, targetDir) {
        if (ent.isFile) {
            return new Promise(function (resolve, reject) {
                ent.file(function (file) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        try {
                            fs.writeFileSync(pathMod.join(targetDir, file.name), Buffer.from(reader.result));
                            resolve();
                        } catch (err) { reject(err); }
                    };
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(file);
                });
            });
        } else if (ent.isDirectory) {
            var subDir = pathMod.join(targetDir, ent.name);
            fs.mkdirSync(subDir, { recursive: true });
            var dirReader = ent.createReader();
            return new Promise(function (resolve) {
                var childPromises = [];
                function readBatch() {
                    dirReader.readEntries(function (entries) {
                        if (entries.length === 0) {
                            Promise.all(childPromises).then(resolve);
                            return;
                        }
                        for (var i = 0; i < entries.length; i++) {
                            childPromises.push(copyEntry(entries[i], subDir));
                        }
                        readBatch();
                    });
                }
                readBatch();
            });
        }
    }

    if (entry.isFile) {
        pending.push(copyEntry(entry, destDir));
    } else {
        // Directory: copy contents into destDir
        pending.push(new Promise(function (resolve) {
            var childPromises = [];
            var dirReader = entry.createReader();
            function readBatch() {
                dirReader.readEntries(function (entries) {
                    if (entries.length === 0) {
                        Promise.all(childPromises).then(resolve);
                        return;
                    }
                    for (var i = 0; i < entries.length; i++) {
                        childPromises.push(copyEntry(entries[i], destDir));
                    }
                    readBatch();
                });
            }
            readBatch();
        }));
    }

    Promise.all(pending).then(function () {
        window.postMessage({ type: 'file:drop', path: destDir }, '*');
    }).catch(function (err) {
        console.error('[preload] copy error:', err);
    });
});
