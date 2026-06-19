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
                } catch(e) {
                    console.log("Dir create failed:", dirs[i], e.message);
                }
            }
            // 自动创建空的 data.json
            var dataJsonPath = PathManager.getDataFullPath();
            if (!fs.existsSync(dataJsonPath)) {
                fs.writeFile(dataJsonPath, '[]', function(){});
            }
            /*----------------------
            # ● 读取系统文件列表
            ----------------------*/
            window.fs.readFile(PathManager.getDataFullPath(), (err, data) => {
                if (err || !data) return;
                var rf = data.toString("utf8");
                try { var rj = JSON.parse(rf); window.store.state.important = rj; } catch(e) {}
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
            window.fs.writeFile(PathManager.getDataFullPath(), JSON.stringify(this.$store.state.important), (err, data) => {
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
            return this.models.length;
        },
        getScenesNum: function () {
            return this.scenes.length;
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
                resetCamera();
                $("#modelButton").click();
            }
            $("#modelButton").click();
        },
        playVmd: function (vmdPath) {
            if (!window.model) {
                this.message("请先在人物模型中选择并加载模型");
                return;
            }
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
            return this.project.length;
        },
    },
};
window.routes = [
    { path: "/", component: componentInit },
    { path: "/index", component: componentIndex },
    { path: "/project", component: componentProject },
];
