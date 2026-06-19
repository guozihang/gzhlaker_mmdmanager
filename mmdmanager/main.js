const { app, BrowserWindow, Menu, ipcMain, clipboard, shell } = require('electron');
const path = require('path');
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

function buildMenu() {
    const template = [
        {
            label: 'Config',
            submenu: []
        },
        {
            label: 'Page',
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
                }
            ]
        },
        {
            label: 'Dir',
            submenu: [
                {
                    label: 'Models',
                    click: () => shell.openPath(MODELPATH)
                },
                {
                    label: 'Scene',
                    click: () => shell.openPath(SCENEPATH)
                },
                {
                    label: 'VMD',
                    click: () => shell.openPath(VMDPATH)
                },
                {
                    label: 'MME',
                    click: () => shell.openPath(MMEPATH)
                },
                {
                    label: 'BridgeOut',
                    click: () => shell.openPath(path.join(SOFTPATH, 'MikuMikuDance_V926_Bridge', 'out'))
                }
            ]
        },
        {
            label: 'Software',
            submenu: [
                {
                    label: 'Effekseer15Beta4',
                    click: () => spawnApp(path.join(SOFTPATH, 'Effekseer15Beta4', 'Effekseer.exe'))
                },
                {
                    label: 'MikuMikuDance_V739',
                    click: () => spawnApp(path.join(SOFTPATH, 'MikuMikuDance_V739', 'MikuMikuDance.CHS.exe'))
                },
                {
                    label: 'MikuMikuDance_V926',
                    click: () => spawnApp(path.join(SOFTPATH, 'MikuMikuDance_V926', 'MikuMikuDance.exe'))
                },
                {
                    label: 'MikuMikuDance_V926_Bridge',
                    click: () => spawnApp(path.join(SOFTPATH, 'MikuMikuDance_V926_Bridge', 'MikuMikuDance.exe'))
                },
                {
                    label: 'MikuMikuDance_V926_BridgeRT',
                    click: () => spawnApp(path.join(SOFTPATH, 'MikuMikuDance_V926_BridgeRT', 'MikuMikuDance.exe'))
                },
                {
                    label: 'MikumikuDance_V931',
                    click: () => spawnApp(path.join(SOFTPATH, 'MikumikuDance_V931', 'MikuMikuDance.exe'))
                },
                {
                    label: 'MikuMikuDance_V931_DX11',
                    click: () => spawnApp(path.join(SOFTPATH, 'MikuMikuDance_V931_DX11', 'MikuMikuDance.exe'))
                },
                {
                    label: 'MikuMikuDance_v932',
                    click: () => spawnApp(path.join(SOFTPATH, 'MikuMikuDance_v932', 'MikuMikuDance.exe'))
                },
                {
                    label: 'PMM_V2_Path_Editor',
                    click: () => shell.openPath(path.join(SOFTPATH, 'PMM_V2_Path_Editor'))
                },
                {
                    label: 'PmxEditor_0254e_CHS',
                    click: () => spawnApp(path.join(SOFTPATH, 'PmxEditor_0254e_CHS', 'PmxEditor_x64.exe'))
                },
                {
                    label: 'PmxEditor_0254f_EN',
                    click: () => spawnApp(path.join(SOFTPATH, 'PmxEditor_0254f_EN', 'PmxEditor_x64.exe'))
                },
                {
                    label: 'RayMatirialControler',
                    click: () => spawnApp(path.join(SOFTPATH, 'RayMatirial', 'RayMatirialControler.exe'))
                },
                {
                    label: 'Metasequoia_472_64',
                    click: () => spawnApp(path.join(SOFTPATH, 'Metasequoia_472_64', 'Metaseq.exe'))
                },
                {
                    label: 'MMEdit_bin_0.1.0.0',
                    click: () => spawnApp(path.join(SOFTPATH, 'MMEdit_bin_0.1.0.0', 'MMEdit.exe'))
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        title: 'demo',
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
