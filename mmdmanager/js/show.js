var loadingLog = function(){};
var clock = new THREE.Clock();
var container;
var renderer;
var camera;
var scene;
var loader = {};
var light = [];
var model;
var control;
var effect;
var mmdHelper;

function initCamera() {
    var target = document.getElementById("modelTarget");
    var w = target.clientWidth || 800;
    var h = Math.min(w * 0.75, 600);
    camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000);
    camera.position.y = 10;
    camera.position.z = 30;
}

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
}

function initLight() {
    light[0] = new THREE.AmbientLight(0x666666);
    light[1] = new THREE.DirectionalLight(0x887766);
    light[1].position.set(-1, 1, 1).normalize();
    scene.add(light[0]);
    scene.add(light[1]);
}

function initRenderer() {
    var target = document.getElementById("modelTarget");
    var w = target.clientWidth || 800;
    var h = Math.min(w * 0.75, 600);
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
    controls = new THREE.OrbitControls(camera, document.getElementById("modelTarget"));
    controls.autoRotate = true;
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
}

function onWindowResize() {
    var target = document.getElementById("modelTarget");
    if (!target) return;
    var w = target.clientWidth;
    var h = Math.min(w * 0.75, 600);
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
        // Remove from MMDAnimationHelper first
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
    THREE.Cache.clear();
}

function resetCamera() {
    camera.position.set(0, 10, 30);
    controls.target.set(0, 10, 0);
    controls.update();
}

function setupModel(m) {
    // Use MMDAnimationHelper instead of manual AnimationMixer + CCDIKSolver
    // Disable physics since MMDPhysics is not loaded
    if (!mmdHelper.objects.get(m)) {
        mmdHelper.add(m, { physics: false });
    }
}

function playAnimation() {
    // If model has geometry animations (from pourVmdIntoModel or PMX) but no
    // mixer is set up yet through MMDAnimationHelper, set it up now.
    if (model) {
        var objects = mmdHelper.objects.get(model);
        if (objects && !objects.mixer && model.geometry.animations && model.geometry.animations.length > 0) {
            mmdHelper._setupMeshAnimation(model, model.geometry.animations);
        }
    }
    mmdHelper.enable('animation', true);
}

function stopAnimation() {
    mmdHelper.enable('animation', false);
    // Also stop actions on the mixer managed by mmdHelper
    if (model) {
        var objects = mmdHelper.objects.get(model);
        if (objects && objects.mixer) {
            for (var i = 0; i < objects.mixer._actions.length; i++) {
                objects.mixer._actions[i].stop();
            }
        }
    }
}

function render() {
    var delta = clock.getDelta();
    if (model) {
        controls.update();
        // MMDAnimationHelper handles mixer, IK, grant, camera animation
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

init();
animate();
