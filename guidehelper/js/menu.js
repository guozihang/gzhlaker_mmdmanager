class GMenu {
    constructor() {
        this.menu = new nw.Menu({ type: 'menubar' });
        this.registerFirstLevel = this.registerFirstLevel.bind(this);
        this.registerSecondLevel = this.registerSecondLevel.bind(this);
        this.pageManu = new nw.Menu();
        this.registerSecondLevel();
        this.registerFirstLevel();
        nw.Window.get().menu = this.menu;
    }
    registerFirstLevel(){
        this.menu.append(new nw.MenuItem({ 
            label: 'Page',
            submenu: this.pageManu
        }));
    }
    registerSecondLevel() {
        this.pageManu.append(new nw.MenuItem({ 
            label: 'Game',
            click: function(){
                if(router){
                    router.replace("/game")
                }
            },
        
            key: '3',
            modifiers: "shift",
        }));
    }
}