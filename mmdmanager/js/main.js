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
    }
});

window.app = new Vue({
    el: "#app",
    store,
    router: router,
    methods: {},
});
hulla = new hullabaloo();

function handleDrop(droppedPath) {

    var stats;
    try { stats = window.fs.statSync(droppedPath); } catch (err) {
        return;
    }

    if (!stats.isDirectory) {
        var ext = window.path.extname(droppedPath).toLowerCase();
        if (ext === '.vmd') {
            copyToDir(droppedPath, PathManager.VMDPATH);
        } else if (ext === '.pmx' || ext === '.pmd') {
            askModelScene(droppedPath);
        } else if (ext === '.fx' || ext === '.x') {
            copyToDir(droppedPath, PathManager.MMEPATH);
        }
        return;
    }

    var entries;
    try { entries = window.fs.readdirSync(droppedPath); } catch (err) { return; }

    var hasPmx = false, hasVmd = false, hasMme = false;
    function scanDir(dir) {
        var list;
        try { list = window.fs.readdirSync(dir); } catch (e) { return; }
        for (var i = 0; i < list.length; i++) {
            var full = dir + list[i];
            var stat;
            try { stat = window.fs.statSync(full); } catch (e) { continue; }
            if (stat.isDirectory) {
                scanDir(full + '/');
            } else {
                var ext = window.path.extname(list[i]).toLowerCase();
                if (ext === '.pmx' || ext === '.pmd') hasPmx = true;
                if (ext === '.vmd') hasVmd = true;
                if (ext === '.fx' || ext === '.x') hasMme = true;
            }
        }
    }
    scanDir(droppedPath + '/');

    if (hasPmx) {
        askModelScene(droppedPath);
    } else if (hasVmd) {
        copyToDir(droppedPath, PathManager.VMDPATH);
    } else if (hasMme) {
        copyToDir(droppedPath, PathManager.MMEPATH);
    }
}

function askModelScene(srcPath) {
    window.app.$confirm('将文件夹导入为模型还是场景？', '导入选择', {
        confirmButtonText: '场景',
        cancelButtonText: '模型',
        distinguishCancelAndClose: true,
        type: 'info'
    }).then(function () {
        copyToDir(srcPath, PathManager.SCENEPATH);
    }).catch(function (action) {
        if (action === 'cancel') {
            copyToDir(srcPath, PathManager.MODELPATH);
        }
    });
}

function copyToDir(srcPath, destDir) {
    var name = window.path.basename(srcPath);
    var ext = window.path.extname(name).toLowerCase();
    var folderName = (ext === '.pmx' || ext === '.pmd' || ext === '.vmd')
        ? name.replace(/\.[^.]+$/, '') : name;
    var destPath = destDir + folderName;
    window.copyFolder(srcPath, destPath).then(function (res) {
        if (res.success) {
            showNotify('已导入到 ' + (res.dest || destPath), 'success');
            setTimeout(function () {
                router.replace('/');
            }, 600);
        } else {
            showNotify(res.error || '导入失败', 'error');
        }
    });
}
