class GMenu {
    constructor() {
        this.menu = new nw.Menu({ type: 'menubar' });
        this.registerFirstLevel = this.registerFirstLevel.bind(this);
        this.registerSecondLevel = this.registerSecondLevel.bind(this);
        this.configManu = new nw.Menu();
        this.pageManu = new nw.Menu();
        this.dirManu = new nw.Menu();
        this.softManu = new nw.Menu();
        this.registerSecondLevel();
        this.registerFirstLevel();
        nw.Window.get().menu = this.menu;
    }
    registerFirstLevel(){
        this.menu.append(new nw.MenuItem({ 
            label: 'Config',
            submenu: this.configManu
        }));
        this.menu.append(new nw.MenuItem({ 
            label: 'Page',
            submenu: this.pageManu
        }));
        this.menu.append(new nw.MenuItem({ 
            label: 'Dir',
            submenu: this.dirManu
        }));
        this.menu.append(new nw.MenuItem({ 
            label: 'Software',
            submenu: this.softManu
        }));
    }
    registerSecondLevel() {
        this.pageManu.append(new nw.MenuItem({ 
            label: 'Models',
            click: function(){
                if(router){
                    router.replace("/index")
                }
            },
        
            key: '1',
            modifiers: "shift",
        }));
        this.pageManu.append(new nw.MenuItem({ 
            label: 'Project',
            click: function(){
                if(router){
                    router.replace("/project")
                }
            },
        
            key: '2',
            modifiers: "shift",
        }));
        this.dirManu.append(new nw.MenuItem({ 
            label: 'Models',
            click: function(){
                window.child_process.exec('explorer.exe' + ' ' + PathManager.MODELPATH)
            },
        }));
        this.dirManu.append(new nw.MenuItem({ 
            label: 'Scene',
            click: function(){
                window.child_process.exec('explorer.exe' + ' ' + PathManager.SCENEPATH)
            },
        }));
        this.dirManu.append(new nw.MenuItem({ 
            label: 'VMD',
            click: function(){
                window.child_process.exec('explorer.exe' + ' ' + PathManager.VMDPATH)
            },
        }));
        this.dirManu.append(new nw.MenuItem({ 
            label: 'MME',
            click: function(){
                window.child_process.exec('explorer.exe' + ' ' + PathManager.MMEPATH)
            },
        }));
        this.dirManu.append(new nw.MenuItem({ 
            label: 'BridgeOut',
            click: function(){
                window.child_process.exec('explorer.exe' + ' ' + PathManager.SOFTPATH + "MikuMikuDance_V926_Bridge\\out\\")
            },
        }));
        this.softManu.append(new nw.MenuItem({ 
            label: 'MikuMikuDance_V926',
            click: function(){
                child_process.spawn(PathManager.SOFTPATH + "MikuMikuDance_V926\\MikuMikuDance.exe", {stdin:"inherent", cwd:"./",detached:true})
            },
        }));
        this.softManu.append(new nw.MenuItem({ 
            label: 'MikuMikuDance_V926_Bridge',
            click: function(){
                child_process.spawn(PathManager.SOFTPATH + "MikuMikuDance_V926_Bridge\\MikuMikuDance.exe", {stdin:"inherent", cwd:"./",detached:true})
            },
        }));
        this.softManu.append(new nw.MenuItem({ 
            label: 'PmxEditor_0254e_CHS',
            click: function(){
                child_process.spawn(PathManager.SOFTPATH + "PmxEditor_0254e_CHS\\PmxEditor_x64.exe", {stdin:"inherent", cwd:"./",detached:true})
            },
        }));
        this.softManu.append(new nw.MenuItem({ 
            label: 'RayMatirialControler',
            click: function(){
                child_process.spawn(PathManager.SOFTPATH + "RayMatirial\\RayMatirialControler.exe", {stdin:"inherent", cwd:"./",detached:true})
            },
        }));
        this.softManu.append(new nw.MenuItem({ 
            label: 'Metasequoia_472_64',
            click: function(){
                child_process.spawn(PathManager.SOFTPATH + "Metasequoia_472_64\\Metaseq.exe", {stdin:"inherent", cwd:"./",detached:true})
            },
        }));
        this.softManu.append(new nw.MenuItem({ 
            label: 'MMEdit_bin_0.1.0.0',
            click: function(){
                child_process.spawn(PathManager.SOFTPATH + "MMEdit_bin_0.1.0.0\\MMEdit.exe", {stdin:"inherent", cwd:"./",detached:true})
            },
        }));
    }
}