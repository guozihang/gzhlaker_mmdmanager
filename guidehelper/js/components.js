/*----------------------------------------------------
# ● Init主界面的组件
----------------------------------------------------*/
var componentInit = {
    template: `#tInit`,
    methods:{
        init: function(){
            /*----------------------
            # ● 读取系统文件列表
            ----------------------*/
            window.fs.readFile(PathManager.getDataFullPath(), (err, data) => {
                var rf = data.toString('utf8');
                var rj = JSON.parse(data.toString('utf8'));
                window.store.state.important = rj
            });
            /*----------------------
            # ● 读取游戏列表
            ----------------------*/
            //读取一级文件夹
            var games = fs.readdirSync(PathManager.GAMEPATH)
            //临时数组，储存所有的二级文件夹
            var temp = []
            //遍历所有二级文件夹
            for (let i = 0; i < games.length; i++) {
                //代表二级文件夹的JSON对象
                let d = {
                    "id":i,
                    "name":games[i],
                    "address":PathManager.GAMEPATH + games[i] + "\\",
                    "panels":[]
                }
                //如果名称是文件夹，加入对象
                if(fs.lstatSync(PathManager.GAMEPATH + games[i]).isDirectory()){
                    //读取此二级文件夹下的所有文件
                    let childs = fs.readdirSync(d.address)
                    //遍历三级文件夹下的所有文件夹
                    for(let j = 0; j < childs.length; j++){
                        //代表三级级文件夹的JSON对象
                        let files = fs.readdirSync(d.address + childs[j] + "\\")
                        let cd = {
                            "id":j,
                            "name":childs[j],
                            "address":PathManager.GAMEPATH + games[i] + "\\" + childs[j] + "\\",
                            "files":[],
                            "filespath":[]
                        }
                        for(let k = 0; k < files.length; k++){
                            let td = {
                                "id":k,
                                "address":PathManager.GAMEPATH + games[i] + "\\" + childs[j] + "\\" + files[k],
                                "name":files[k],
                            }
                            cd.files.push(td);
                            cd.filespath.push(td.address);
                        }
                        d.panels.push(cd)  
                    }
                    temp.push(d)
                }
            }
            console.log(temp)
            this.$store.state.data.games = temp
            /*----------------------
            # ● 进入主菜单
            ----------------------*/
            window.gmenu = new GMenu()
            this.message("初始化完成");
            router.replace('/game');  
        },
        message: function(info){
            const h = this.$createElement;
            this.$notify({
              title: '消息',
              message: h('i', { style: 'color: teal'}, info)
            });
        }
                
    },
    beforeRouteEnter: (to, from, next) => {
        next((vm) =>{
            setTimeout(() => {
                vm.init()
            }, 1000)
        })
    }
}
/*----------------------------------------------------
# ● 游戏攻略界面的组件
----------------------------------------------------*/
var componentGame = {
    template: `#tGame`,
    data () {
        return {
            visible: [],
            subdir: 0,
            srcList: []
        }
    },
    computed:{
        mData:{
            get(){
                return this.$store.state.data;
            },
            set(value){
                this.$store.commit('data', value)
            }
        },
        search:{
            get(){
                return this.$store.state.search;
            },
            set(value){
                this.$store.commit('search', value)
            }
        },
        tag:{
            get(){
                return this.$store.state.tag;
            },
            set(value){
                this.$store.commit('tag', value)
            }
        },
        showPath:{
            get(){
                return this.$store.state.showPath;
            },
            set(value){
                this.$store.commit('showPath', value)
            }
        },
        games:{
            get(){
                if(this.search == ""){
                    return this.mData.games;
                }
                else{
                    return this.mData.vmds.filter((item) => {
                        return this.isSubStr(item)
                    })
                }
            },
        },
        pic:{
            get(){
                if(this.search == ""){
                    return this.mData.games;
                }
                else{
                    return this.mData.vmds.filter((item) => {
                        return this.isSubStr(item)
                    })
                }
            },
        },
    },
    methods:{
        open: function(address) {
            window.child_process.exec('explorer.exe' + ' ' + address)
        },
        vip: function(data, type) {
            data.type = type
            this.$store.state.important.push(data);
            this.save()
        },
        del: function(id){
            for (let i = 0; i < this.$store.state.important.length; i++) {
                if(id == this.$store.state.important[i].id){
                    this.$store.state.important.splice(i, 1);
                }
            }
            this.save()
        },
        save: function(){
            window.fs.writeFile(PathManager.getDataFullPath(), JSON.stringify(this.$store.state.important),(err, data) => {
                if (err) throw err;
                console.log(this.$store.state.important)
            });
        },
        copy: function(data){
            window.child_process.exec('clip').stdin.end(data);
        },
        isSubStr: function(item){
            if(item.name.toLowerCase().indexOf(this.search.toLowerCase()) != -1){
                return true
            }
            else{
                return false
            }
        },
        isHasTag: function(item){
            console.log(item)
            if('info' in item){
                if('tags' in item.info){
                    return item.info.tags.includes(this.tag)
                }
            }
            else{
                return false
            }
        },
        format: function (row) {
            let name = row.name
            return this.isSubStr(name, search)
        },
        getModelsNum: function(){
            return this.models.length
        },
        getScenesNum: function(){
            return this.scenes.length
        },
        changeTag: function(item){
            this.tag = item
        },
        clearTag: function(){
            this.tag = ''
        },
        updateModel: function(path){
            if(this.showPath != path){
                if(window.model){
                    window.scene.remove(window.model)
                    //clearCache(window.model)                
                }
                if(window.path.extname(path).toLowerCase() == '.pmx' || window.path.extname(path).toLowerCase() == '.pmd'){
                    window.loader.MMDLoader.loadModel( path, function ( mmd ) {
                        console.log(mmd)
                        window.model = mmd;
                        window.scene.add( window.model );
                
                    }, window.onProgress, null );
                }
                else if(window.path.extname(path).toLowerCase() == '.x'){
                    window.loader.XLoader.load( path, function ( x ) {
                        console.log(x)
                        window.model = x;
                        window.scene.add( window.model );
                
                    }, window.onProgress, null );
                }
                this.showPath = path
                $('#modelButton').click()
            }
            else{
                $('#modelButton').click()
            }
        },
        vbs: function(val) {
            this.srcList = []
            this.srcList.push(val)
        }

    }
}
window.routes = [
    {path: "/",component: componentInit},
    {path: "/game",component: componentGame},
];