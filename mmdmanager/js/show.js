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
    if (!m.mixer) m.mixer = new THREE.AnimationMixer(m);
    try {
        if (m.geometry.iks && m.geometry.iks.length > 0) {
            m.ikSolver = new THREE.CCDIKSolver(m, m.geometry.iks);
        }
    } catch(e) { console.log("IK init:", e.message); }
}
function playAnimation() {
    if (!model || !model.mixer) return;
    for (var i = 0; i < model.mixer._actions.length; i++) {
        model.mixer._actions[i].stop();
    }
    var clips = model.geometry.animations;
    if (clips && clips.length > 0) {
        var lastClip = clips[clips.length - 1];
        var action = model.mixer.clipAction(lastClip);
        action.play();
    }
}
function render() {
    var delta = clock.getDelta();
    if (model) {
        controls.update();
        if (model.mixer) model.mixer.update(delta);
        if (model.ikSolver) model.ikSolver.update();
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
    initControl();
    initEventListener();
}
init();
animate();
