var container
var renderer
var camera
var scene
var loader = {}
var light = []
var model
var control
var effect


function initCamera(){    
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.y = 10;
    camera.position.z = 30;
    console.log("... camera ok")
}
function initScene(){
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    //var gridHelper = new THREE.PolarGridHelper( 30, 10 );
    //scene.add( gridHelper );
    console.log("... scene ok")
 
}
function initLight() {
    light[0] = new THREE.AmbientLight( 0x666666 );    
    light[1] = new THREE.DirectionalLight( 0x887766 );
    light[1].position.set( - 1, 1, 1 ).normalize();
    scene.add( light[0] );
    scene.add( light[1] );
    console.log('... light ok')

}
function initRenderer(){
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( 800, 600 );
    effect = new THREE.OutlineEffect( renderer );
    console.log('... renderer ok')
}
function initContainer(){
    container = document.createElement( 'div' );
    container.id = "modelTargetF"
    container.appendChild( renderer.domElement );
    document.getElementById('modelTarget').appendChild( container );
    console.log('... container ok')
}
function initControl(){
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.autoRotate = true
    controls.enabled = false
    console.log('... control ok')
}
function initLoader(){
    
    loader.MMDLoader = new THREE.MMDLoader();
    loader.XLoader = new THREE.XLoader();
    console.log('... loader ok')
}
function initEventListener(){
    window.addEventListener( 'resize', onWindowResize, false );
    console.log('... event ok')
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize( window.innerWidth / 2.5, window.innerHeight / 2.5 );

}
function onProgress( xhr ) {
    if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
    }
}
function clearCache(item) {
    if (item instanceof THREE.Mesh) {
        if(item.geometry){
            item.geometry.dispose(); // 删除几何体            
        }
        if(item.material){
            for(let i = 0; i < item.material.length; i++){
                item.material[i].dispose(); // 删除几何体
            }
        }
    }
}
function init(){

    initCamera()
    initScene()
    initLight()
    initRenderer()
    initContainer()
    initLoader()
    initControl()
    initEventListener()

}
function animate() {

    requestAnimationFrame( animate );
    render();

}
function render() {
    if(model){
        model.rotateY(0.01)
        effect.render( scene, camera );
    }
    

}
init();
animate();