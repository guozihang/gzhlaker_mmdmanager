const { app, BrowserWindow, Menu, ipcMain, clipboard, shell, dialog } = require('electron');

// Must be set before app.whenReady() for macOS menu bar name
app.name = 'MMDManager';

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Path constants matching the original PathManager
const PROGRAMPATH = __dirname;
const DATAPATH = path.join(PROGRAMPATH, 'data') + path.sep;
const SOFTPATH = path.join(PROGRAMPATH, 'software') + path.sep;
const PROJECTPATH = path.join(PROGRAMPATH, 'project') + path.sep;
const MODELPATH = path.join(DATAPATH, 'Model') + path.sep;
const MMEPATH = path.join(DATAPATH, 'MME') + path.sep;
const SCENEPATH = path.join(DATAPATH, 'Scene') + path.sep;
const VMDPATH = path.join(DATAPATH, 'Vmd') + path.sep;
const GAMEPATH = path.join(DATAPATH, 'Game') + path.sep;

let mainWindow = null;

function spawnApp(exePath) {
    try {
        const proc = spawn(exePath, [], {
            detached: true,
            stdio: 'ignore',
            cwd: path.dirname(exePath)
        });
        proc.unref();
    } catch (err) {
        console.error('Failed to launch:', exePath, err);
    }
}

function scanSoftware() {
    const items = [];
    if (!fs.existsSync(SOFTPATH)) return items;
    const dirs = fs.readdirSync(SOFTPATH);
    for (const dir of dirs) {
        const dirPath = path.join(SOFTPATH, dir);
        let stat;
        try { stat = fs.statSync(dirPath); } catch (_) { continue; }
        if (!stat.isDirectory()) continue;
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            if (path.extname(file).toLowerCase() === '.exe') {
                const exePath = path.join(dirPath, file);
                items.push({
                    label: dir,  // Use folder name as the menu label
                    click: () => spawnApp(exePath)
                });
                break; // Only take the first .exe per folder
            }
        }
    }
    return items;
}

function buildMenu() {
    const softwareItems = scanSoftware();

    const template = [
        {
            label: 'MMDManager',
            submenu: [
                {
                    label: 'Models',
                    accelerator: 'CmdOrCtrl+Shift+1',
                    click: () => {
                        if (mainWindow) mainWindow.webContents.send('menu:navigate', '/index');
                    }
                },
                {
                    label: 'Project',
                    accelerator: 'CmdOrCtrl+Shift+2',
                    click: () => {
                        if (mainWindow) mainWindow.webContents.send('menu:navigate', '/project');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Models 文件夹',
                    click: () => shell.openPath(MODELPATH)
                },
                {
                    label: 'Scene 文件夹',
                    click: () => shell.openPath(SCENEPATH)
                },
                {
                    label: 'VMD 文件夹',
                    click: () => shell.openPath(VMDPATH)
                },
                {
                    label: 'MME 文件夹',
                    click: () => shell.openPath(MMEPATH)
                },
                {
                    label: 'BridgeOut 文件夹',
                    click: () => shell.openPath(path.join(SOFTPATH, 'MikuMikuDance_V926_Bridge', 'out'))
                },
                { type: 'separator' },
                ...softwareItems
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        title: 'MMDManager',
        icon: path.join(__dirname, 'icon.png'),
        width: 1487,
        height: 967,
        minWidth: 400,
        minHeight: 300,
        resizable: true,
        fullscreen: false,
        center: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    buildMenu();

    mainWindow.loadFile('index.html');

    mainWindow.webContents.openDevTools();

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC handlers
ipcMain.handle('dialog:openDirectory', async (event, defaultPath) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        defaultPath: defaultPath || undefined
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:openFile', async (event, { defaultPath, filters }) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        defaultPath: defaultPath || undefined,
        filters: filters || [{ name: 'MMD Models', extensions: ['pmx', 'pmd'] }]
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('child-process:exec', (event, { command, options }) => {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
        exec(command, options || {}, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
});

ipcMain.handle('clipboard:write', (event, text) => {
    clipboard.writeText(text);
});

ipcMain.handle('shell:openPath', (event, folderPath) => {
    return shell.openPath(folderPath);
});

ipcMain.handle('child-process:spawn', (event, { exePath, args, options }) => {
    try {
        const proc = spawn(exePath, args || [], Object.assign({
            detached: true,
            stdio: 'ignore'
        }, options || {}));
        proc.unref();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('export:toMmd', async (event, { mmdPath, modelPath }) => {
    try {
        const proc = spawn(mmdPath, [modelPath], {
            detached: true,
            stdio: 'ignore',
            cwd: path.dirname(mmdPath)
        });
        proc.unref();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('fs:copyFolder', async (event, { src, dest }) => {
    try {
        var srcStat = fs.statSync(src);
        var finalDest = dest;

        if (srcStat.isFile()) {
            // Single file: create dest folder, copy file into it
            if (fs.existsSync(dest)) {
                var base = dest, counter = 1;
                while (fs.existsSync(base + '_' + counter)) { counter++; }
                finalDest = base + '_' + counter;
            }
            fs.mkdirSync(finalDest, { recursive: true });
            var fileName = path.basename(src);
            fs.copyFileSync(src, path.join(finalDest, fileName));
        } else {
            // Directory: copy recursively
            if (fs.existsSync(dest)) {
                var base2 = dest, counter2 = 1;
                while (fs.existsSync(base2 + '_' + counter2)) { counter2++; }
                finalDest = base2 + '_' + counter2;
            }
            fs.cpSync(src, finalDest, { recursive: true });
        }
        return { success: true, dest: finalDest };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Pass all path constants to renderer
ipcMain.handle('get-app-paths', () => {
    return {
        PROGRAMPATH,
        DATAPATH,
        SOFTPATH,
        PROJECTPATH,
        MODELPATH,
        MMEPATH,
        SCENEPATH,
        VMDPATH,
        GAMEPATH
    };
});

// Fix GPU mailbox errors and WebGL texture issues on macOS
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-features', 'SkiaOutputDeviceBufferQueue');

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
