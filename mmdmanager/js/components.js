function longestCommonSubstring(a, b) {
    if (!a || !b) return 0;
    var lenA = a.length, lenB = b.length;
    var maxLen = 0;
    for (var i = 0; i < lenA; i++) {
        for (var j = 0; j < lenB; j++) {
            var k = 0;
            while (i + k < lenA && j + k < lenB && a[i + k] === b[j + k]) k++;
            if (k > maxLen) maxLen = k;
        }
    }
    return maxLen / Math.max(lenA, lenB);
}
/*----------------------------------------------------
# ● Init主界面的组件
----------------------------------------------------*/
var componentInit = {
    template: `#tInit`,
    methods: {
        init: function () {
            /*----------------------
            # ● 读取配置文件（优先，影响后续路径）
            ----------------------*/
            var applySettings = function(cfg) {
                if (cfg && cfg.dataPath && cfg.dataPath !== PathManager.PROGRAMPATH) {
                    PathManager.PROGRAMPATH = cfg.dataPath;
                    PathManager.DATAPATH = path.join(cfg.dataPath, 'data') + path.sep;
                    PathManager.SOFTPATH = path.join(cfg.dataPath, 'software') + path.sep;
                    PathManager.PROJECTPATH = path.join(cfg.dataPath, 'project') + path.sep;
                    PathManager.MODELPATH = path.join(PathManager.DATAPATH, 'Model') + path.sep;
                    PathManager.MMEPATH = path.join(PathManager.DATAPATH, 'MME') + path.sep;
                    PathManager.SCENEPATH = path.join(PathManager.DATAPATH, 'Scene') + path.sep;
                    PathManager.VMDPATH = path.join(PathManager.DATAPATH, 'Vmd') + path.sep;
                    PathManager.GAMEPATH = path.join(PathManager.DATAPATH, 'Game') + path.sep;
                }
                if (cfg && cfg.defaultModelPath !== undefined) {
                    this.$store.state.settings.defaultModelPath = cfg.defaultModelPath;
                }
            }.bind(this);
            // Phase 1: create config directory and read data.json
            var configDir = PathManager.CONFIGPATH;
            console.log("Config dir:", configDir);
            console.log("CONFIGPATH:", PathManager.CONFIGPATH);
            console.log("getDataFullPath:", PathManager.getDataFullPath());
            if (!fs.existsSync(configDir)) {
                console.log("Creating config dir:", configDir);
                try { fs.mkdirSync(configDir, { recursive: true }); } catch(e) { console.log("mkdir failed:", e); }
            }
            var dataJsonPath = PathManager.getDataFullPath();
            console.log("data.json path:", dataJsonPath, "exists:", fs.existsSync(dataJsonPath));
            if (fs.existsSync(dataJsonPath)) {
                try {
                    var raw = JSON.parse(fs.readFileSync(dataJsonPath).toString('utf8'));
                    if (raw.settings) {
                        applySettings(raw.settings);
                        this.$store.state.settings = raw.settings;
                    }
                } catch(e) {}
            }
            this.$store.state.settings.dataPath = this.$store.state.settings.dataPath || PathManager.PROGRAMPATH;
            /*----------------------
            # ● 自动创建所需文件夹
            ----------------------*/
            var dirs = [
                PathManager.DATAPATH,
                PathManager.MODELPATH,
                PathManager.SCENEPATH,
                PathManager.MMEPATH,
                PathManager.VMDPATH,
                PathManager.GAMEPATH,
                PathManager.SOFTPATH,
                PathManager.PROJECTPATH
            ];
            for (var i = 0; i < dirs.length; i++) {
                try {
                    if (!fs.existsSync(dirs[i])) {
                        fs.mkdirSync(dirs[i], { recursive: true });
                    }
                } catch(e) {}
            }
            // Ensure data.json exists
            if (!fs.existsSync(dataJsonPath)) {
                console.log("Creating new data.json at:", dataJsonPath);
                try {
                    fs.writeFileSync(dataJsonPath, JSON.stringify({ important: [], settings: this.$store.state.settings }));
                    console.log("data.json created successfully");
                } catch(e) {
                    console.log("data.json create failed:", e);
                }
            }
            /*----------------------
            # ● 读取系统文件列表
            ----------------------*/
            window.fs.readFile(dataJsonPath, (err, data) => {
                console.log("Read data.json:", err, !!data);
                if (err || !data) return;
                var rf = data.toString("utf8");
                console.log("data.json content:", rf);
                try { var rj = JSON.parse(rf); window.store.state.important = Array.isArray(rj) ? rj : (rj.important || []); } catch(e) {}
            });
            /*----------------------
            # ● 读取人物模型文件列表
            ----------------------*/
            var models = fs.existsSync(PathManager.MODELPATH) ? fs.readdirSync(PathManager.MODELPATH) : [];
            var temp = [];
            var d = {};
            for (let i = 0; i < models.length; i++) {
                let d = { id: i, name: models[i], address: PathManager.MODELPATH + models[i] + "/", models: [] };
                if (fs.lstatSync(PathManager.MODELPATH + models[i]).isDirectory) {
                    let childF = fs.readdirSync(d.address);
                    for (let j = 0; j < childF.length; j++) {
                        //console.log(window.path.extname(childF[j]).toLowerCase())
                        if (
                            window.path.extname(childF[j]).toLowerCase() == ".pmx" ||
                            window.path.extname(childF[j]).toLowerCase() == ".pmd" ||
                            window.path.extname(childF[j]).toLowerCase() == ".x"
                        ) {
                            d.models.push(PathManager.MODELPATH + models[i] + "/" + childF[j]);
                        }
                    }
                }
                window.fs.exists(PathManager.MODELPATH + models[i] + "/info.json", function (exists) {
                    //console.log(PathManager.MODELPATH + models[i] + "/info.json");
                    if (exists) {
                        window.fs.readFile(PathManager.MODELPATH + models[i] + "/info.json", (err, data) => {
                            if (err || !data) return;
                            var rf = data.toString("utf8");
                            try { var rj = JSON.parse(rf); d["info"] = rj; } catch(e) {}
                            //console.log(rj)
                        });
                        d.type = "yes";
                    } else {
                        d.type = "no";
                    }

                    //console.log(exists ? "创建成功" : "创建失败");
                });
                window.fs.exists(PathManager.MODELPATH + models[i] + "/image.png", function (exists) {
                    //console.log(PathManager.MODELPATH + models[i] + "/image.png");
                    if (exists) {
                        d.img = "yes";
                    } else {
                        d.img = "no";
                    }

                    //console.log(exists ? "创建成功" : "创建失败");
                });
                temp.push(d);
            }
            this.$store.state.data.models = temp;
            /*----------------------
            # ● 读取MME文件列表
            ----------------------*/
            var mmes = fs.existsSync(PathManager.MMEPATH) ? fs.readdirSync(PathManager.MMEPATH) : [];
            var temp = [];
            for (let i = 0; i < mmes.length; i++) {
                temp.push({ id: i, name: mmes[i], address: PathManager.MMEPATH + mmes[i] + "/" });
            }
            this.$store.state.data.mmes = temp;
            /*----------------------
            # ● 读取场景模型文件列表
            ----------------------*/
            var scenes = fs.existsSync(PathManager.SCENEPATH) ? fs.readdirSync(PathManager.SCENEPATH) : [];
            var temp = [];
            for (let i = 0; i < scenes.length; i++) {
                let d = { id: i, name: scenes[i], address: PathManager.SCENEPATH + scenes[i] + "/", models: [] };
                if (fs.lstatSync(PathManager.SCENEPATH + scenes[i]).isDirectory) {
                    let childF = fs.readdirSync(d.address);
                    for (let j = 0; j < childF.length; j++) {
                        //console.log(window.path.extname(childF[j]).toLowerCase())
                        if (
                            window.path.extname(childF[j]).toLowerCase() == ".pmx" ||
                            window.path.extname(childF[j]).toLowerCase() == ".pmd" ||
                            window.path.extname(childF[j]).toLowerCase() == ".x"
                        ) {
                            d.models.push("/data/Scene/" + scenes[i] + "/" + childF[j]);
                        }
                    }
                }
                window.fs.exists(PathManager.SCENEPATH + scenes[i] + "/info.json", function (exists) {
                    if (exists) {
                        window.fs.readFile(PathManager.SCENEPATH + scenes[i] + "/info.json", (err, data) => {
                            if (err || !data) return;
                            var rf = data.toString("utf8");
                            try { var rj = JSON.parse(rf); d["info"] = rj; } catch(e) {}
                            //console.log(rj)
                        });
                        d.type = "yes";
                    } else {
                        d.type = "no";
                    }

                    //console.log(exists ? "创建成功" : "创建失败");
                });
                window.fs.exists(PathManager.SCENEPATH + scenes[i] + "/image.png", function (exists) {
                    if (exists) {
                        d.img = "yes";
                    } else {
                        d.img = "no";
                    }

                    //console.log(exists ? "创建成功" : "创建失败");
                });
                temp.push(d);
            }
            console.log(temp);
            this.$store.state.data.scenes = temp;
            /*----------------------
            # ● 读取动作文件列表
            ----------------------*/
            var vmdEntries = fs.existsSync(PathManager.VMDPATH) ? fs.readdirSync(PathManager.VMDPATH) : [];
            var temp = [];
            for (let i = 0; i < vmdEntries.length; i++) {
                var entryPath = PathManager.VMDPATH + vmdEntries[i];
                var d = { id: i, name: vmdEntries[i], address: PathManager.VMDPATH + vmdEntries[i] + "/", vmds: [] };
                var entryStat = fs.lstatSync(entryPath);
                if (entryStat.isFile && window.path.extname(vmdEntries[i]).toLowerCase() === ".vmd") {
                    d.vmds.push(entryPath);
                } else if (entryStat.isDirectory) {
                    var subFiles = fs.readdirSync(entryPath + "/");
                    for (let j = 0; j < subFiles.length; j++) {
                        if (window.path.extname(subFiles[j]).toLowerCase() === ".vmd") {
                            d.vmds.push(entryPath + "/" + subFiles[j]);
                        }
                    }
                }
                temp.push(d);
            }
            this.$store.state.data.vmds = temp;
            /*----------------------
            # ● 读取工程文件列表
            ----------------------*/
            var project = fs.existsSync(PathManager.PROJECTPATH) ? fs.readdirSync(PathManager.PROJECTPATH) : [];
            var temp = [];
            for (let i = 0; i < project.length; i++) {
                if (window.path.extname(project[i]).toLowerCase() == ".pmm") {
                    temp.push({ id: i, name: project[i], address: PathManager.PROJECTPATH + project[i] + "/" });
                }
            }
            this.$store.state.data.project = temp;
            /*----------------------
            # ● 读取软件列表
            ----------------------*/
            window.fs.readFile(PathManager.SOFTPATH + "software.json", (err, data) => {
                if (err || !data) return;
                var rf = data.toString("utf8");
                console.log(rf);
                try { var rj = JSON.parse(rf); window.store.state.software = rj; } catch(e) {}
                console.log(rj);
            });
            /*----------------------
            # ● 进入主菜单
            ----------------------*/
            this.message("初始化完成");
            router.replace("/index");
        },
        message: function (info) {
            const h = this.$createElement;
            this.$notify({
                title: "消息",
                message: h("i", { style: "color: teal" }, info),
            });
        },
    },
    beforeRouteEnter: (to, from, next) => {
        next((vm) => {
            setTimeout(() => {
                vm.init();
            }, 1000);
        });
    },
};
/*----------------------------------------------------
# ● 入口界面的组件
----------------------------------------------------*/
var componentIndex = {
    template: `#tIndex`,
    data() {
        return {
            visible: false,
        };
    },
    computed: {
        mData: {
            get() {
                return this.$store.state.data;
            },
            set(value) {
                this.$store.commit("data", value);
            },
        },
        search: {
            get() {
                return this.$store.state.search;
            },
            set(value) {
                this.$store.commit("search", value);
            },
        },
        tag: {
            get() {
                return this.$store.state.tag;
            },
            set(value) {
                this.$store.commit("tag", value);
            },
        },
        showPath: {
            get() {
                return this.$store.state.showPath;
            },
            set(value) {
                this.$store.commit("showPath", value);
            },
        },
        models: {
            get() {
                if (this.search == "" && this.tag == "") {
                    return this.mData.models;
                } else if (this.search != "" && this.tag == "") {
                    return this.mData.models.filter((item) => {
                        return this.isSubStr(item);
                    });
                } else if (this.search == "" && this.tag != "") {
                    return this.mData.models.filter((item) => {
                        return this.isHasTag(item);
                    });
                } else if (this.search != "" && this.tag != "") {
                    return this.mData.models.filter((item) => {
                        return this.isHasTag(item) && this.isSubStr(item);
                    });
                }
            },
        },
        scenes: {
            get() {
                if (this.search == "" && this.tag == "") {
                    return this.mData.scenes;
                } else if (this.search != "" && this.tag == "") {
                    return this.mData.scenes.filter((item) => {
                        return this.isSubStr(item);
                    });
                } else if (this.search == "" && this.tag != "") {
                    return this.mData.scenes.filter((item) => {
                        return this.isHasTag(item);
                    });
                } else if (this.search != "" && this.tag != "") {
                    return this.mData.scenes.filter((item) => {
                        return this.isHasTag(item) && this.isSubStr(item);
                    });
                }
            },
        },
        mmes: {
            get() {
                if (this.search == "") {
                    return this.mData.mmes;
                } else {
                    return this.mData.mmes.filter((item) => {
                        return this.isSubStr(item);
                    });
                }
            },
        },
        vmds: {
            get() {
                if (this.search == "") {
                    return this.mData.vmds;
                } else {
                    return this.mData.vmds.filter((item) => {
                        return this.isSubStr(item);
                    });
                }
            },
        },
        important: {
            get() {
                return this.$store.state.important;
            },
            set(value) {
                this.$store.commit("important", value);
            },
        },
        settings: {
            get() {
                return this.$store.state.settings;
            },
            set(value) {
                this.$store.commit("settings", value);
            },
        },
    },
    methods: {
        open: function (address) {
            window.shell.openPath(address);
        },
        vip: function (data, type) {
            data.type = type;
            this.$store.state.important.push(data);
            this.message("收藏成功");
            this.save();
        },
        del: function (id) {
            for (let i = 0; i < this.$store.state.important.length; i++) {
                if (id == this.$store.state.important[i].id) {
                    this.$store.state.important.splice(i, 1);
                }
            }
            this.message("删除成功");
            this.save();
        },
        save: function () {
            var data = {
                important: this.$store.state.important,
                settings: this.$store.state.settings
            };
            window.fs.writeFile(PathManager.getDataFullPath(), JSON.stringify(data), (err) => {
                if (err) throw err;
                this.message("保存成功");
            });
        },
        copy: function (data) {
            window.clipboard.writeText(data);
        },
        isSubStr: function (item) {
            if (item.name.toLowerCase().indexOf(this.search.toLowerCase()) != -1) {
                return true;
            } else {
                return false;
            }
        },
        isHasTag: function (item) {
            console.log(item);
            if ("info" in item) {
                if ("tags" in item.info) {
                    return item.info.tags.includes(this.tag);
                }
            } else {
                return false;
            }
        },
        format: function (row) {
            let name = row.name;
            return this.isSubStr(name, search);
        },
        getModelsNum: function () {
            return this.models ? this.models.length : 0;
        },
        getScenesNum: function () {
            return this.scenes ? this.scenes.length : 0;
        },
        changeTag: function (item) {
            this.tag = item;
        },
        clearTag: function () {
            this.tag = "";
        },
        updateModel: function (path) {
            if (this.showPath != path) {
                if (window.model) {
                    window.scene.remove(window.model);
                    clearCache(window.model);
                    this.message("清除缓存");
                }
                if (window.path.extname(path).toLowerCase() == ".pmx" || window.path.extname(path).toLowerCase() == ".pmd") {
                    window.loader.MMDLoader.loadModel(
                        path,
                        function (mmd) {
                            window.model = mmd;
                            window.scene.add(window.model);
                            setupModel(mmd);
                            resetCamera();
                        },
                        window.onProgress,
                        null
                    );
                } else if (window.path.extname(path).toLowerCase() == ".x") {
                    window.loader.XLoader.load(
                        path,
                        function (x) {
                            console.log(x);
                            window.model = x;
                            window.scene.add(window.model);
                            setupModel(x);
                            resetCamera();
                        },
                        window.onProgress,
                        null
                    );
                }
                this.showPath = path;
            } else {
                // Same model: stop animation, reset pose
                stopAnimation();
                resetCamera();
                $("#modelButton").click();
            }
            $("#modelButton").click();
        },
        playVmd: function (vmdPath) {
            var self = this;
            if (!window.model) {
                var defaultPath = self.settings.defaultModelPath;
                if (!defaultPath) {
                    self.message("请先在人物模型中选择并加载模型，或在设置中配置默认模型路径");
                    return;
                }
                self.message("正在加载默认模型...");
                window.loader.MMDLoader.loadModel(defaultPath, function(mmd) {
                    window.model = mmd;
                    model = mmd;
                    window.scene.add(window.model);
                    setupModel(mmd);
                    // Now load VMD
                    self._loadVmd(vmdPath);
                }, window.onProgress, function() {
                    self.message("默认模型加载失败");
                });
                return;
            }
            this._loadVmd(vmdPath);
        },
        _loadVmd: function(vmdPath) {
            var self = this;
            resetCamera();
            $("#modelButton").click();
            window.loader.MMDLoader.loadVmd(
                vmdPath,
                function (vmd) {
                    // Fuzzy match VMD bone names to model bones
                    var modelBones = window.model.geometry.bones;
                    if (modelBones) {
                        var modelNames = modelBones.map(function(b) { return b.name; });
                        for (var i = 0; i < vmd.motions.length; i++) {
                            var vName = vmd.motions[i].boneName;
                            if (modelNames.indexOf(vName) !== -1) continue;
                            // Find best match
                            var best = null, bestScore = 0, bestIdx = -1;
                            for (var j = 0; j < modelNames.length; j++) {
                                var score = longestCommonSubstring(vName, modelNames[j]);
                                if (score > bestScore) { bestScore = score; best = modelNames[j]; bestIdx = j; }
                            }
                            if (best && bestScore > 0.2) {
                                vmd.motions[i].boneName = modelBones[bestIdx].name;
                            }
                        }
                    }
                    window.loader.MMDLoader.pourVmdIntoModel(window.model, vmd, "");
                    playAnimation();
                    self.message("动作已加载");
                },
                window.onProgress,
                function (err) {
                    self.message("加载失败");
                }
            );
        },
        selectDataPath: function() {
            var self = this;
            var currentPath = self.settings.dataPath || PathManager.PROGRAMPATH;
            window.dialog.openDirectory(currentPath).then(function(result) {
                if (result) {
                    self.settings = Object.assign({}, self.settings, { dataPath: result });
                }
            });
        },
        selectDefaultModel: function() {
            var self = this;
            var currentPath = self.settings.defaultModelPath || PathManager.MODELPATH;
            window.dialog.openFile(currentPath, [{ name: 'MMD模型', extensions: ['pmx', 'pmd'] }]).then(function(result) {
                if (result) {
                    self.settings = Object.assign({}, self.settings, { defaultModelPath: result });
                }
            });
        },
        saveSettings: function() {
            var self = this;
            var dataPath = PathManager.getDataFullPath();
            // Read existing data.json to preserve important array
            var existing = { important: self.important };
            if (fs.existsSync(dataPath)) {
                try {
                    existing = JSON.parse(fs.readFileSync(dataPath).toString('utf8'));
                } catch(e) {}
            }
            existing.settings = self.settings;
            try {
                fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2));
                // Apply immediately — no refresh needed
                if (self.settings.dataPath) {
                    PathManager.PROGRAMPATH = self.settings.dataPath;
                    // Update data dirs for current session
                    var dirs = [
                        path.join(self.settings.dataPath, 'data'),
                        path.join(self.settings.dataPath, 'software'),
                        path.join(self.settings.dataPath, 'project')
                    ];
                    for (var i = 0; i < dirs.length; i++) {
                        try { if (!fs.existsSync(dirs[i])) fs.mkdirSync(dirs[i], { recursive: true }); } catch(e) {}
                    }
                }
                self.message("配置已保存");
            } catch(e) {
                self.message("保存失败: " + e.message);
            }
        },
        resetSettings: function() {
            var defaults = {
                dataPath: PathManager.PROGRAMPATH,
                defaultModelPath: ''
            };
            this.settings = defaults;
            this.message("已恢复默认配置，保存后刷新生效");
        },
        message: function (info) {
            const h = this.$createElement;
            this.$notify({
                title: "消息",
                dangerouslyUseHTMLString: true,
                duration: 800,
                message: "<div><strong>" + info + "</strong></div>",
            });
        },
    },
};
var componentSetting = {
    template: '#tSetting',
    created: function() {
        router.replace('/index');
    },
};
var componentProject = {
    template: `#tProject`,
    data() {
        return {
            visible: false,
        };
    },
    computed: {
        mData: {
            get() {
                return this.$store.state.data;
            },
            set(value) {
                this.$store.commit("data", value);
            },
        },
        search: {
            get() {
                return this.$store.state.search;
            },
            set(value) {
                this.$store.commit("search", value);
            },
        },
        project: {
            get() {
                if (this.search == "") {
                    return this.mData.project;
                } else {
                    return this.mData.project.filter((item) => {
                        return this.isSubStr(item);
                    });
                }
            },
        },
    },
    methods: {
        open: function (address) {
            window.shell.openPath(address);
        },
        isSubStr: function (item) {
            if (item.name.toLowerCase().indexOf(this.search.toLowerCase()) != -1) {
                return true;
            } else {
                return false;
            }
        },
        getProjectNum: function () {
            return this.project ? this.project.length : 0;
        },
    },
};
window.routes = [
    { path: "/", component: componentInit },
    { path: "/index", component: componentIndex },
    { path: "/project", component: componentProject },
];
