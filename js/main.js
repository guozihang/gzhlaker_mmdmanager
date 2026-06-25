// Unified notification helper
window.showNotify = function (msg, type) {
    var titleMap = { success: '成功', error: '错误', warning: '提示', info: '消息' };
    var typeMap  = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
    var t = type || 'success';
    window.app.$notify({
        title: titleMap[t] || '消息',
        message: '<div style="text-align:center;font-size:14px">' + msg + '</div>',
        dangerouslyUseHTMLString: true,
        type: typeMap[t],
        duration: t === 'error' ? 3000 : 1500
    });
};

// Import progress state (reactive for Vue overlay)
window._importProgress = { visible: false, pct: 0, text: '', detail: '', total: 0, done: 0 };

window.updateImportProgress = function(opts) {
    var p = window._importProgress;
    if (opts.visible !== undefined) { p.visible = opts.visible; }
    if (opts.text !== undefined) { p.text = opts.text; }
    if (opts.detail !== undefined) { p.detail = opts.detail; }
    if (opts.total !== undefined) { p.total = opts.total; }
    if (opts.done !== undefined) {
        p.done = opts.done;
        p.pct = p.total > 0 ? Math.round(p.done / p.total * 100) : 0;
    }
    // Force Vue to detect changes on the plain object
    window._importProgress = p;
    if (window.app && window.app.$forceUpdate) window.app.$forceUpdate();
};

//Vue相关
Vue.config.productionTip = false;
router = new VueRouter({
    routes: routes,
});
// Listen for messages from preload (menu navigation + file drops)
window.addEventListener('message', function (event) {
    if (!event.data) return;
    if (event.data.type === 'menu:navigate') {
        router.replace(event.data.route);
    } else if (event.data.type === 'file:drop') {
        handleDrop(event.data.path);
    } else if (event.data.type === 'file:batch-drop') {
        window.handleBatchDrop(event.data.paths, event.data.total);
    }
});

window.app = new Vue({
    el: "#app",
    store,
    router: router,
    computed: {
        importProgress: {
            get() { return window._importProgress || {}; },
        },
    },
    methods: {},
});
hulla = new hullabaloo();

// ---- Import queue & progress ----
var _importQueue = [];
var _importRunning = false;

function processQueue() {
    if (_importRunning || _importQueue.length === 0) return;
    _importRunning = true;
    window.updateImportProgress({ visible: true });

    function next() {
        if (_importQueue.length === 0) {
            // All done
            _importRunning = false;
            setTimeout(function() {
                window.updateImportProgress({ visible: false });
                router.replace('/');
            }, 600);
            return;
        }
        var task = _importQueue.shift();
        var name = window.path.basename(task.srcPath);
        window.updateImportProgress({
            text: '正在导入: ' + name,
            detail: '(' + (task.index + 1) + '/' + task.total + ')',
            done: task.index
        });
        doCopyToDir(task.srcPath, task.destDir, task.isModel, task.total, task.index)
            .then(function() { next(); })
            .catch(function() { next(); });
    }
    next();
}

function enqueueImport(srcPath, destDir, isModel, total, index) {
    _importQueue.push({ srcPath: srcPath, destDir: destDir, isModel: isModel, total: total, index: index });
    window.updateImportProgress({ total: total });
}

// Handle a single dropped path: determine type, enqueue
function handleDrop(droppedPath) {
    var stats;
    try { stats = window.fs.statSync(droppedPath); } catch (err) { return; }

    if (!stats.isDirectory) {
        var ext = window.path.extname(droppedPath).toLowerCase();
        if (ext === '.vmd') {
            enqueueImport(droppedPath, PathManager.VMDPATH, false, 1, 0);
            processQueue();
        } else if (ext === '.pmx' || ext === '.pmd') {
            askModelScene(droppedPath, 1, 0);
        } else if (ext === '.fx' || ext === '.x') {
            enqueueImport(droppedPath, PathManager.MMEPATH, false, 1, 0);
            processQueue();
        }
        return;
    }

    // Directory: determine content type
    var hasPmx = false, hasVmd = false, hasMme = false;
    function scanDir(dir) {
        var list;
        try { list = window.fs.readdirSync(dir); } catch (e) { return; }
        for (var i = 0; i < list.length; i++) {
            var full = dir + list[i];
            var stat;
            try { stat = window.fs.statSync(full); } catch (e) { continue; }
            if (stat.isDirectory) { scanDir(full + '/'); }
            else {
                var e = window.path.extname(list[i]).toLowerCase();
                if (e === '.pmx' || e === '.pmd') hasPmx = true;
                if (e === '.vmd') hasVmd = true;
                if (e === '.fx' || e === '.x') hasMme = true;
            }
        }
    }
    scanDir(droppedPath + '/');
    if (hasPmx) { askModelScene(droppedPath, 1, 0); }
    else if (hasVmd) { enqueueImport(droppedPath, PathManager.VMDPATH, false, 1, 0); processQueue(); }
    else if (hasMme) { enqueueImport(droppedPath, PathManager.MMEPATH, false, 1, 0); processQueue(); }
}

// ---- Batch handler for multiple simultaneous drops ----
window.handleBatchDrop = function(paths, total) {
    _importQueue = [];
    window.updateImportProgress({ visible: true, total: total, done: 0, pct: 0 });

    var results = [];
    paths.forEach(function(p) {
        try {
            var stats = window.fs.statSync(p);
            if (!stats.isDirectory) {
                var ext = window.path.extname(p).toLowerCase();
                if (ext === '.pmx' || ext === '.pmd') {
                    results.push({ src: p, name: window.path.basename(p), needsAsk: true });
                } else if (ext === '.vmd') {
                    results.push({ src: p, name: window.path.basename(p), dest: PathManager.VMDPATH, needsAsk: false });
                } else if (ext === '.fx' || ext === '.x') {
                    results.push({ src: p, name: window.path.basename(p), dest: PathManager.MMEPATH, needsAsk: false });
                }
                return;
            }
            // Scan directory for type
            var hasPmx = false, hasVmd = false;
            function scan(d) {
                var list;
                try { list = window.fs.readdirSync(d); } catch(e) { return; }
                for (var i = 0; i < list.length; i++) {
                    var full = d + list[i];
                    var s;
                    try { s = window.fs.statSync(full); } catch(e) { continue; }
                    if (s.isDirectory) scan(full + '/');
                    else {
                        var e = window.path.extname(list[i]).toLowerCase();
                        if (e === '.pmx' || e === '.pmd') hasPmx = true;
                        if (e === '.vmd') hasVmd = true;
                    }
                }
            }
            scan(p + '/');
            if (hasPmx) results.push({ src: p, name: window.path.basename(p), needsAsk: true });
            else if (hasVmd) results.push({ src: p, name: window.path.basename(p), dest: PathManager.VMDPATH, needsAsk: false });
        } catch(e) {}
    });

    var askItems = results.filter(function(r) { return r.needsAsk; });
    var otherItems = results.filter(function(r) { return !r.needsAsk; });

    function doEnqueue(choices) {
        // choices: { srcPath: 'model'|'scene' }
        var all = [];
        askItems.forEach(function(r) {
            var dest = (choices[r.src] === 'scene') ? PathManager.SCENEPATH : PathManager.MODELPATH;
            all.push({ src: r.src, dest: dest, isModel: true });
        });
        otherItems.forEach(function(r) {
            all.push({ src: r.src, dest: r.dest, isModel: false });
        });
        var n = all.length;
        if (n === 0) return;
        window.updateImportProgress({ total: n });
        all.forEach(function(r, i) {
            _importQueue.push({ srcPath: r.src, destDir: r.dest, isModel: r.isModel, total: n, index: i });
        });
        processQueue();
    }

    if (askItems.length === 0) {
        doEnqueue({});
    } else if (askItems.length === 1) {
        // Single model: use existing confirm dialog
        askModelSceneBatch(askItems[0].src, function(choice) {
            var c = {}; c[askItems[0].src] = choice;
            doEnqueue(c);
        });
    } else {
        // Multiple items: show custom selection dialog with all items
        showBatchModelDialog(askItems, otherItems, doEnqueue);
    }
};

// Single-item ask (reuses existing $confirm)
function askModelSceneBatch(srcPath, callback) {
    window.app.$confirm('将文件夹导入为模型还是场景？', '导入选择', {
        confirmButtonText: '场景',
        cancelButtonText: '模型',
        distinguishCancelAndClose: true,
        type: 'info'
    }).then(function () {
        callback('scene');
    }).catch(function (action) {
        if (action === 'cancel') callback('model');
    });
}

// Multi-item selection dialog — shows models + VMD/MME items
function showBatchModelDialog(askItems, otherItems, callback) {
    var el = document.createElement('div');
    document.body.appendChild(el);

    var choices = {};
    askItems.forEach(function(r) { choices[r.src] = 'model'; });

    var allItems = [];
    askItems.forEach(function(r) { allItems.push({ src: r.src, name: r.name, type: 'model' }); });
    otherItems.forEach(function(r) {
        var label = '';
        try {
            var ext = window.path.extname(r.name).toLowerCase();
            if (ext === '.vmd') label = 'VMD动作';
            else if (ext === '.fx' || ext === '.x') label = 'MME特效';
            else {
                // Check directory content
                var s = window.fs.statSync(r.src);
                if (s.isDirectory) {
                    var files = window.fs.readdirSync(r.src);
                    for (var i = 0; i < files.length; i++) {
                        var e = window.path.extname(files[i]).toLowerCase();
                        if (e === '.vmd') { label = 'VMD动作'; break; }
                        if (e === '.fx' || e === '.x') { label = 'MME特效'; break; }
                    }
                }
            }
        } catch(_) {}
        allItems.push({ src: r.src, name: r.name, type: 'other', label: label || '其他' });
    });

    var vm = new Vue({
        el: el,
        data: { choices: choices, items: allItems, visible: true },
        methods: {
            confirm: function() {
                this.visible = false;
                callback(this.choices);
                setTimeout(function() { vm.$destroy(); document.body.removeChild(el); }, 300);
            },
        },
        template:
            '<div>' +
            '<el-dialog title="导入选择" :visible.sync="visible" width="550px" :close-on-click-modal="false">' +
            '  <div style="max-height:400px;overflow-y:auto">' +
            '    <div v-for="item in items" :key="item.src" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #eee">' +
            '      <span style="flex:1;font-size:13px;word-break:break-all">{{item.name}}</span>' +
            '      <span v-if="item.type===\'other\'" style="font-size:12px;color:#909399;white-space:nowrap">{{item.label}}</span>' +
            '      <el-radio-group v-else v-model="choices[item.src]" size="small">' +
            '        <el-radio label="model">模型</el-radio>' +
            '        <el-radio label="scene">场景</el-radio>' +
            '      </el-radio-group>' +
            '    </div>' +
            '  </div>' +
            '  <span slot="footer">' +
            '    <el-button type="primary" size="small" @click="confirm">全部导入</el-button>' +
            '  </span>' +
            '</el-dialog>' +
            '</div>',
    });
}

function askModelScene(srcPath, total, index) {
    window.app.$confirm('将文件夹导入为模型还是场景？', '导入选择', {
        confirmButtonText: '场景',
        cancelButtonText: '模型',
        distinguishCancelAndClose: true,
        type: 'info'
    }).then(function () {
        enqueueImport(srcPath, PathManager.SCENEPATH, true, total, index);
        processQueue();
    }).catch(function (action) {
        if (action === 'cancel') {
            enqueueImport(srcPath, PathManager.MODELPATH, true, total, index);
            processQueue();
        }
    });
}

// Promise-based copy, used by queue processor
function doCopyToDir(srcPath, destDir, isModel, total, index) {
    var name = window.path.basename(srcPath);
    var ext = window.path.extname(name).toLowerCase();
    var isSingleModel = ext === '.pmx' || ext === '.pmd';
    var folderName = (isSingleModel || ext === '.vmd')
        ? name.replace(/\.[^.]+$/, '') : name;
    var destPath = destDir + folderName;

    if (!isModel && !isSingleModel) {
        try {
            var sst = window.fs.statSync(srcPath);
            if (sst.isDirectory) {
                var ents = window.fs.readdirSync(srcPath);
                for (var ei = 0; ei < ents.length; ei++) {
                    if (window.path.extname(ents[ei]).toLowerCase() === '.pmx' ||
                        window.path.extname(ents[ei]).toLowerCase() === '.pmd') { isModel = true; break; }
                }
            }
        } catch(e) {}
    }

    return new Promise(function(resolve) {
        window.copyFolder(srcPath, destPath).then(function (res) {
            if (!res.success) { resolve(); return; }
            var finalDest = res.dest || destPath;
            window.updateImportProgress({ detail: name + ' 导入完成，渲染预览...' });
            if (isModel && window.autoPreviewImport) {
                setTimeout(function() {
                    window.autoPreviewImport(finalDest, function(modelName, step, modelIdx, modelTotal) {
                        window.updateImportProgress({
                            detail: modelName + ' ' + step + ' (' + modelIdx + '/' + modelTotal + ')',
                            text: '正在渲染预览: ' + (index + 1) + '/' + total
                        });
                    }).then(function() {
                        window.updateImportProgress({ done: index + 1 });
                        resolve();
                    });
                }, 500);
            } else {
                window.updateImportProgress({ done: index + 1 });
                resolve();
            }
        }).catch(function() { resolve(); });
    });
}
