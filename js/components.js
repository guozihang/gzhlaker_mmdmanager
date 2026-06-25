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
            // Merge default preview settings for upgrades from older data.json
            var s = this.$store.state.settings;
            if (!s.preview) this.$set(s, 'preview', {});
            if (s.preview.ambientColor === undefined)     this.$set(s.preview, 'ambientColor', '#666666');
            if (s.preview.directionalColor === undefined) this.$set(s.preview, 'directionalColor', '#887766');
            if (s.preview.showAxis === undefined)         this.$set(s.preview, 'showAxis', true);
            if (s.preview.autoRotate === undefined)       this.$set(s.preview, 'autoRotate', true);
            if (s.preview.cameraFov === undefined)        this.$set(s.preview, 'cameraFov', 45);
            if (s.preview.dualModel === undefined)        this.$set(s.preview, 'dualModel', false);
            if (s.preview.buttonMode === undefined)      this.$set(s.preview, 'buttonMode', 'hover');
            if (s.preview.pageSize === undefined)        this.$set(s.preview, 'pageSize', 20);
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
            // Rebuild native menu so folder shortcuts and software items reflect current paths
            if (window.rebuildMenu) {
                window.rebuildMenu();
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
                            d.models.push(PathManager.SCENEPATH + scenes[i] + "/" + childF[j]);
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
            currentPageModels: 1,
            currentPageScenes: 1,
            currentPageMmes: 1,
            currentPageVmds: 1,
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
        importProgress: {
            get() { return window._importProgress || {}; },
        },
        pageSize: {
            get() {
                var s = this.$store.state.settings;
                return (s && s.preview && s.preview.pageSize) || 20;
            },
        },
        pagedModels: {
            get() { return this.paginate(this.models, this.currentPageModels); },
        },
        pagedScenes: {
            get() { return this.paginate(this.scenes, this.currentPageScenes); },
        },
        pagedMmes: {
            get() { return this.paginate(this.mmes, this.currentPageMmes); },
        },
        pagedVmds: {
            get() { return this.paginate(this.vmds, this.currentPageVmds); },
        },
    },
    methods: {
        paginate: function(arr, page) {
            var size = this.pageSize;
            var start = (page - 1) * size;
            return arr.slice(start, start + size);
        },
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
        getMmesNum: function () {
            return this.mmes ? this.mmes.length : 0;
        },
        getVmdsNum: function () {
            return this.vmds ? this.vmds.length : 0;
        },
        changeTag: function (item) {
            this.tag = item;
        },
        clearTag: function () {
            this.tag = "";
        },
        updateModel: function (path) {
            var self = this;
            var isScene = path.indexOf(PathManager.SCENEPATH) === 0;
            var dualMode = self.settings.preview && self.settings.preview.dualModel;

            if (this.showPath != path) {
                // Remove only the same type when dual mode is on
                if (dualMode) {
                    if (isScene && window.sceneModel) {
                        window.scene.remove(window.sceneModel);
                        clearCache(window.sceneModel);
                    } else if (!isScene && window.model) {
                        window.scene.remove(window.model);
                        clearCache(window.model);
                    }
                } else {
                    if (window.model) {
                        window.scene.remove(window.model);
                        clearCache(window.model);
                    }
                    if (window.sceneModel) {
                        window.scene.remove(window.sceneModel);
                        clearCache(window.sceneModel);
                    }
                }

                var ext = window.path.extname(path).toLowerCase();
                if (ext == ".pmx" || ext == ".pmd") {
                    window.loader.MMDLoader.loadModel(
                        path,
                        function (mmd) {
                            if (dualMode && isScene) {
                                loadSceneModel(mmd);
                            } else {
                                window.model = mmd;
                                mmd.userData.modelPath = path;
                                window.scene.add(window.model);
                                setupModel(mmd, false);
                                resetCamera();
                            }
                            self._capturePreviewAfterLoad(path);
                        },
                        window.onProgress,
                        null
                    );
                } else if (ext == ".x") {
                    window.loader.XLoader.load(
                        path,
                        function (x) {
                            if (dualMode && isScene) {
                                loadSceneModel(x);
                            } else {
                                window.model = x;
                                x.userData.modelPath = path;
                                window.scene.add(window.model);
                                setupModel(x, false);
                                resetCamera();
                            }
                            self._capturePreviewAfterLoad(path);
                        },
                        window.onProgress,
                        null
                    );
                }
                this.showPath = path;
            } else {
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
                    mmd.userData.modelPath = defaultPath;
                    model = mmd;
                    window.scene.add(window.model);
                    setupModel(mmd);
                    // Wait one frame for mmdHelper to fully initialize the model's
                    // animation mixer before pouring VMD data into it
                    requestAnimationFrame(function() {
                        self._loadVmd(vmdPath);
                    });
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
                self.message("配置已保存，数据刷新中...");
                // Refresh to reload file lists from potentially new dataPath
                setTimeout(function () { router.replace('/'); }, 500);
            } catch(e) {
                self.message("保存失败: " + e.message);
            }
        },
        resetSettings: function() {
            var defaults = {
                dataPath: PathManager.PROGRAMPATH,
                defaultModelPath: '',
                mmdPath: '',
                preview: {
                    ambientColor: '#666666',
                    directionalColor: '#887766',
                    showAxis: true,
                    autoRotate: true,
                    cameraFov: 45,
                    dualModel: false
                }
            };
            this.settings = defaults;
            applyPreviewSettings();
            this.message("已恢复默认配置，保存后刷新生效");
        },
        applyPreview: function() {
            applyPreviewSettings();
        },
        toggleDualModel: function(val) {
            this.$set(this.settings.preview, 'dualModel', val);
        },
        selectMmdPath: function() {
            var self = this;
            var currentPath = self.settings.mmdPath || PathManager.SOFTPATH;
            window.dialog.openFile(currentPath, [{ name: '可执行文件', extensions: ['exe'] }]).then(function(result) {
                if (result) {
                    self.settings = Object.assign({}, self.settings, { mmdPath: result });
                }
            });
        },
        exportToMmd: function(modelPath) {
            var self = this;
            var mmdPath = self.settings.mmdPath;
            if (!mmdPath) {
                self.message("请先在设置中配置 MMD 软件路径");
                return;
            }
            window.exportToMmd({ mmdPath: mmdPath, modelPath: modelPath }).then(function(res) {
                if (res.success) {
                    self.message("已发送到 MMD 软件");
                } else {
                    self.message("启动失败: " + (res.error || "未知错误"));
                }
            });
        },
        exportVmdToMmd: function(vmdPath) {
            var self = this;
            var mmdPath = self.settings.mmdPath;
            if (!mmdPath) {
                self.message("请先在设置中配置 MMD 软件路径");
                return;
            }
            // Use currently loaded model, or default model from settings
            var modelPath = window.model ? window.model.userData.modelPath : null;
            if (!modelPath) {
                modelPath = self.settings.defaultModelPath;
            }
            if (!modelPath) {
                self.message("请先加载一个模型，或在设置中配置默认模型路径");
                return;
            }
            window.exportToMmd({ mmdPath: mmdPath, modelPath: modelPath, vmdPath: vmdPath }).then(function(res) {
                if (res.success) {
                    self.message("已发送到 MMD 软件");
                } else {
                    self.message("启动失败: " + (res.error || "未知错误"));
                }
            });
        },
        _getPreviewPath: function(modelPath) {
            var dir = window.path.dirname(modelPath);
            var base = window.path.basename(modelPath);
            var name = base.replace(/\.[^.]+$/, ''); // strip extension
            return dir + '/' + name + '.png';
        },
        _capturePreviewAfterLoad: function(modelPath) {
            var previewPath = this._getPreviewPath(modelPath);
            var self = this;
            // Wait for textures to finish loading, then capture
            setTimeout(function() {
                window.fs.exists(previewPath, function(exists) {
                    if (exists) return;
                    var dataUrl = window.capturePreview && window.capturePreview();
                    if (dataUrl && window.savePreviewImage) {
                        window.savePreviewImage(previewPath, dataUrl);
                        // Invalidate cache so hasPreview returns true next time
                        self['__prev_' + modelPath] = true;
                    }
                });
            }, 2500);
        },
        hasPreview: function(modelPath) {
            if (!modelPath) return false;
            var key = '__prev_' + modelPath;
            if (this[key] !== undefined) return this[key];
            try {
                this[key] = window.fs.existsSync(this._getPreviewPath(modelPath));
            } catch(e) {
                this[key] = false;
            }
            return this[key];
        },
        previewSrc: function(modelPath) {
            if (!modelPath) return '';
            return this._getPreviewPath(modelPath) + '?t=' + Date.now();
        },
        toggleDevTools: function() {
            window.toggleDevTools && window.toggleDevTools();
        },
        message: function (info, type) {
            showNotify(info, type || 'info');
        },
    },
};
// Auto-load all models in a folder for preview capture (background).
// onProgress(name, step, idx, total) called for each model.
// Returns a Promise that resolves when all captures are done.
window.autoPreviewImport = function(folderPath, onProgress) {
    onProgress = onProgress || function(){};
    return new Promise(function(resolveAll) {
        try {
            var files = window.fs.readdirSync(folderPath);
            var modelFiles = [];
            for (var i = 0; i < files.length; i++) {
                var ext = window.path.extname(files[i]).toLowerCase();
                if (ext === '.pmx' || ext === '.pmd') {
                    modelFiles.push(folderPath + '/' + files[i]);
                }
            }
            if (modelFiles.length === 0) { resolveAll(); return; }

            var prevModel = window.model;
            if (prevModel) window.scene.remove(prevModel);
            window.model = null;

            var idx = 0;
            var total = modelFiles.length;
            function processNext() {
                if (idx >= modelFiles.length) {
                    if (prevModel) {
                        window.scene.add(prevModel);
                        window.model = prevModel;
                    }
                    resolveAll();
                    return;
                }
                var modelPath = modelFiles[idx];
                var modelName = window.path.basename(modelPath);
                var curIdx = idx + 1;
                idx++;
                onProgress(modelName, '加载中...', curIdx, total);
                window.loader.MMDLoader.loadModel(
                    modelPath,
                    function(mmd) {
                        window.model = mmd;
                        mmd.userData.modelPath = modelPath;
                        window.scene.add(mmd);
                        setupModel(mmd, false);
                        onProgress(modelName, '渲染截图...', curIdx, total);
                        var previewPath = window.path.dirname(modelPath) + '/' +
                            window.path.basename(modelPath).replace(/\.[^.]+$/, '') + '.png';
                        setTimeout(function() {
                            window.resetCamera && window.resetCamera();
                            var dataUrl = window.capturePreview && window.capturePreview();
                            if (dataUrl && window.savePreviewImage) {
                                window.savePreviewImage(previewPath, dataUrl);
                            }
                            onProgress(modelName, '完成', curIdx, total);
                            window.scene.remove(mmd);
                            window.model = null;
                            processNext();
                        }, 2000);
                    },
                    window.onProgress,
                    function() { onProgress(modelName, '失败', curIdx, total); processNext(); }
                );
            }
            processNext();
        } catch(e) {
            console.error('[autoPreview] Error:', e);
            resolveAll();
        }
    });
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
