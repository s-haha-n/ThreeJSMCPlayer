import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//import { World } from './world';
import { SimpleWorld } from './simpleWorld';
import { Player } from './player';
import { setupUI } from './ui';

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
orbitCamera.position.set(45, 45, 45);
orbitCamera.lookAt(0, 0, 0);

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

// Scene setup
const scene = new THREE.Scene();
const player = new Player(scene); 
const simpleWorld = new SimpleWorld();
simpleWorld.generate();
scene.add(simpleWorld);

// Add Player
// const player = new Player(scene); // doesn't happen here
// simplify and figure out how to instance players

function setupLighting() {
    const sun = new THREE.DirectionalLight();
    sun.position.set(50, 50, 50);
    sun.castShadow = true;

    // Set the size of the sun's shadow box
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 100;
    sun.shadow.bias = -0.001;
    sun.shadow.mapSize = new THREE.Vector2(2048, 2048)
    scene.add(sun);

    scene.add(new THREE.CameraHelper(sun.shadow.camera));

    const ambient = new THREE.AmbientLight();
    ambient.intensity = 0.1;
    scene.add(ambient);
}

// Events
window.addEventListener('resize', () => {
    // Resize camera aspect ratio and renderer size to the new window size
    orbitCamera.aspect = window.innerWidth / window.innerHeight;
    orbitCamera.updateProjectionMatrix();
    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

// UI Setup
const stats = new Stats();
document.body.appendChild(stats.dom);

// Render loop
let previousTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const dt = (currentTime - previousTime) / 1000; // like time.deltatime in unity

    player.update(dt);

    //renderer.render(scene, camera);
    //renderer.render(scene, player.camera);
    renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);

    stats.update();

    previousTime = currentTime;
}

setupUI(simpleWorld, player, scene.sun);
setupLighting();
animate();