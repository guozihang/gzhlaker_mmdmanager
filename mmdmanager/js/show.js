var loadingLog = function(){};
var clock = new THREE.Clock();
var container;
var renderer;
var camera;
var scene;
var loader = {};
var light = [];
var model;         // character model (VMD target)
var sceneModel;    // scene/environment model
var control;
var effect;
var mmdHelper;

function initCamera() {
    var target = document.getElementById("modelTarget");
    var w = target.clientWidth || 800;
    var h = Math.min(w * 0.75, 600);
    var fov = getPreview().cameraFov || 45;
    camera = new THREE.PerspectiveCamera(fov, w / h, 1, 2000);
    camera.position.y = 10;
    camera.position.z = 30;
}

function initScene() {
    scene = new THREE.Scene();
    scene.background = createSkybox();
    scene._axisHelper = new THREE.AxisHelper(5);
    if (getPreview().showAxis !== false) {
        scene.add(scene._axisHelper);
    }
}

function initLight() {
    var p = getPreview();
    light[0] = new THREE.AmbientLight(p.ambientColor || '#666666');
    light[1] = new THREE.DirectionalLight(p.directionalColor || '#887766');
    light[1].position.set(-1, 1, 1).normalize();
    scene.add(light[0]);
    scene.add(light[1]);
}

function initRenderer() {
    var target = document.getElementById("modelTarget");
    var w = target.clientWidth || 800;
    var h = Math.min(w * 0.75, 600);
    // Guard against zero height when modal is initially hidden
    if (h < 100) h = 450;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    effect = new THREE.OutlineEffect(renderer);
}

function initContainer() {
    container = document.createElement("div");
    container.id = "modelTargetF";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.appendChild(renderer.domElement);
    document.getElementById("modelTarget").appendChild(container);
}

function initControl() {
    var p = getPreview();
    controls = new THREE.OrbitControls(camera, document.getElementById("modelTarget"));
    controls.autoRotate = p.autoRotate !== false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 100;
    controls.target.set(0, 10, 0);
    controls.update();
}

function initLoader() {
    loader.MMDLoader = new THREE.MMDLoader();
    loader.XLoader = new THREE.XLoader();
}

function initMMDHelper() {
    mmdHelper = new MMDAnimationHelper({
        sync: true,
        afterglow: 2.0,
        resetPhysicsOnLoop: true,
        pmxAnimation: true
    });
}

function initEventListener() {
    window.addEventListener("resize", onWindowResize, false);
    // Bootstrap modal opens with 0×0 then transitions — resize when fully shown
    $('#myModal').on('shown.bs.modal', function () {
        setTimeout(onWindowResize, 150);
    });
}

function onWindowResize() {
    var target = document.getElementById("modelTarget");
    if (!target) return;
    var w = target.clientWidth || 800;
    var h = Math.min(w * 0.75, 600);
    if (h < 100) h = 450;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    effect.setSize(w, h);
}

function onProgress(xhr) {
    if (xhr.lengthComputable) {
        var percentComplete = (xhr.loaded / xhr.total) * 100;
        console.log(Math.round(percentComplete, 2) + "% downloaded");
    }
}

function clearCache(item) {
    if (item instanceof THREE.Mesh) {
        if (mmdHelper && mmdHelper.objects.has(item)) {
            mmdHelper.remove(item);
        }
        if (item.geometry) item.geometry.dispose();
        if (item.material) {
            for (let i = 0; i < item.material.length; i++) {
                item.material[i].dispose();
            }
        }
    }
    if (item === sceneModel) sceneModel = null;
    if (item === model) model = null;
    THREE.Cache.clear();
}

function resetCamera() {
    camera.position.set(0, 10, 30);
    controls.target.set(0, 10, 0);
    controls.update();
}

function setupModel(m, isScene) {
    if (!mmdHelper.objects.get(m)) {
        mmdHelper.add(m, { physics: false });
    }
    if (isScene) {
        sceneModel = m;
    } else {
        model = m;
    }
}

// Load a scene model without replacing the character model
function loadSceneModel(m) {
    if (sceneModel) {
        scene.remove(sceneModel);
        clearCache(sceneModel);
    }
    scene.add(m);
    setupModel(m, true);
    resetCamera();
}

// Load a character model without replacing the scene model
function loadCharacterModel(m) {
    if (model) {
        scene.remove(model);
        clearCache(model);
    }
    scene.add(m);
    setupModel(m, false);
    resetCamera();
}

function playAnimation() {
    // VMD always targets the character model
    var target = model || sceneModel;
    if (target) {
        var objects = mmdHelper.objects.get(target);
        if (objects && !objects.mixer && target.geometry.animations && target.geometry.animations.length > 0) {
            mmdHelper._setupMeshAnimation(target, target.geometry.animations);
        }
    }
    mmdHelper.enable('animation', true);
}

function stopAnimation() {
    mmdHelper.enable('animation', false);
    var target = model || sceneModel;
    if (target) {
        var objects = mmdHelper.objects.get(target);
        if (objects && objects.mixer) {
            for (var i = 0; i < objects.mixer._actions.length; i++) {
                objects.mixer._actions[i].stop();
            }
        }
    }
}

function render() {
    var delta = clock.getDelta();
    if (model || sceneModel) {
        controls.update();
        mmdHelper.update(delta);
        effect.render(scene, camera);
    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function init() {
    initCamera();
    initScene();
    initLight();
    initRenderer();
    initContainer();
    initLoader();
    initMMDHelper();
    initControl();
    initEventListener();
}

function getPreview() {
    var s = window.store && window.store.state && window.store.state.settings;
    return (s && s.preview) || {};
}

function applyPreviewSettings() {
    var p = getPreview();
    if (light[0]) light[0].color.set(p.ambientColor || '#666666');
    if (light[1]) light[1].color.set(p.directionalColor || '#887766');
    if (scene._axisHelper) {
        if (p.showAxis !== false) scene.add(scene._axisHelper);
        else scene.remove(scene._axisHelper);
    }
    if (controls) controls.autoRotate = p.autoRotate !== false;
    if (camera) {
        camera.fov = p.cameraFov || 45;
        camera.updateProjectionMatrix();
    }
}
window.applyPreviewSettings = applyPreviewSettings;

function createSkybox() {
    var size = 256;

    function makeCanvas(topColor, bottomColor) {
        var c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        var ctx = c.getContext('2d', { willReadFrequently: true });
        var grad = ctx.createLinearGradient(0, 0, 0, size);
        grad.addColorStop(0, topColor);
        grad.addColorStop(0.5, bottomColor);
        grad.addColorStop(1, bottomColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        return c;
    }

    var skyTop    = makeCanvas('#87CEEB', '#B0D4E8');
    var skyBottom = makeCanvas('#E8E8E8', '#D0D0D0');
    var skySide   = makeCanvas('#B8D8F0', '#E0E0E0');

    var cubeMap = new THREE.CubeTexture([
        skySide, skySide, skyTop, skyBottom, skySide, skySide
    ]);
    cubeMap.needsUpdate = true;
    return cubeMap;
}

init();
animate();


