import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
//import Stats from 'three/examples/jsm/libs/stats.module.js';
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimpleWorld } from '../js/simpleWorld';
import { Octree } from 'three/examples/jsm/math/Octree.js';
//import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js'; // used for visuallizing collisions
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
import { PlayerFPS } from '../js/playerfps';
import NetworkManager from '../js/network-manager.js';
import { useLocation } from 'react-router-dom';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const ThreeScene: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement | null>(null);

    const location = useLocation();

    const myData = location.state || {peerId:null};
    const material = new THREE.MeshLambertMaterial({ color: 0xbb0000 });
    const netcube = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), material);

    const offset = new THREE.Vector3(0, 0, -5);

    // Allows js to called in react, converts to ts
    useEffect(() => {

        var objectRotate = false;

        const clock = new THREE.Clock();
        //const container = document.getElementById( 'container' );
        
        // Scene setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog( 0x88ccee, 0, 50 );

        console.log("myData.peerId = " + myData.peerId);
        const network = new NetworkManager(myData.peerId, scene); // peerid can be null to start
        
        // Camera setup
        //const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        //orbitCamera.position.set(45, 45, 45);
        //orbitCamera.lookAt(0, 0, 0);
        const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.rotation.order = 'YXZ';
        
        //const controls = new OrbitControls(orbitCamera, renderer.domElement);
        //controls.target.set(16, 0, 16);
        //controls.update();
        
        // Renderer setup
        const renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x80a0e0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        //container.appendChild(renderer.domElement);
        //document.body.appendChild(renderer.domElement);
        
        //const stats = new Stats();
        //stats.domElement.style.position = 'absolute';
        //stats.domElement.style.top = '0px';
        //container.appendChild(stats.domElement);
        
        const GRAVITY = 30;
        
        const NUM_SPHERES = 100;
        const SPHERE_RADIUS = 0.2;
        
        const STEPS_PER_FRAME = 5;
        
        /*
        const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
        const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xdede8d });
        
        const spheres = [];
        let sphereIdx = 0;
        
        for (let i = 0; i < NUM_SPHERES; i++) {
        
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.castShadow = true;
            sphere.receiveShadow = true;
        
            scene.add(sphere);
        
            spheres.push({
                mesh: sphere,
                collider: new THREE.Sphere(new THREE.Vector3(0, - 100, 0), SPHERE_RADIUS),
                velocity: new THREE.Vector3()
            });
        
        }
        */
        
        const worldOctree = new Octree();
        
        const playerDirection = new THREE.Vector3();
        
        //const player = new Player(scene); 
        const simpleWorld = new SimpleWorld();
        simpleWorld.generate();
        scene.add(simpleWorld);
        
        const geometry = new THREE.BoxGeometry(10, 5, 5);
        const groundMesh = new THREE.Mesh(geometry, material);
        scene.add(groundMesh);
        groundMesh.position.set(0, -5, 0);
        network.add(groundMesh);

        netcube.position.set(0, -3, -10);
        scene.add(netcube);
        network.add(netcube);

        //worldOctree.fromGraphNode(netcube);

        worldOctree.fromGraphNode(groundMesh);
        worldOctree.fromGraphNode(simpleWorld);
        worldOctree.fromGraphNode(netcube);
        
        // Add Player
        // const player = new Player(scene); // doesn't happen here
        // simplify and figure out how to instance players
        
        const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);
        const playerfps = new PlayerFPS(camera, playerCollider);
        playerfps.initControls();

        // Player body, why 'this'...
        const playerGeometry = new THREE.SphereGeometry(0.5);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00bb00});
        const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
        playerMesh.castShadow = true;
        scene.add(playerMesh);

        var textMesh = new THREE.Mesh();

        // Create 3D text geometry
        const loader = new FontLoader();
        loader.load('https://cdn.rawgit.com/mrdoob/three.js/master/examples/fonts/helvetiker_regular.typeface.json', function(font) {
            const textGeometry = new TextGeometry('Player 1', {
                font: font,
                size: 0.25,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelSegments: 5
            });

            const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            textMesh = new THREE.Mesh(textGeometry, textMaterial);
            scene.add(textMesh);
            //network.add(textMesh);
        });

        scene.add(camera);

        network.add(playerMesh); // playermesh position is set to camera position in animate loop
        //worldOctree.fromGraphNode(playerMesh);
        
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

        // not sure why this can't be in player class 
        function getForwardVector() {
            camera.getWorldDirection(playerDirection);
            playerDirection.y = 0;
            playerDirection.normalize();
        
            return playerDirection;
        }
        
        function getSideVector() {
            camera.getWorldDirection(playerDirection);
            playerDirection.y = 0;
            playerDirection.normalize();
            playerDirection.cross(camera.up);
        
            return playerDirection;
        }
        
        // Render loop
        let previousTime = performance.now();

        const handleinput = (e:any) => {
            if (e.code === "KeyR") {
                //objectRotate = !objectRotate;
                //console.log(objectRotate);
                netcube.rotateY(20);
                netcube.translateY(1);
            }
        }

        document.body.addEventListener("keyup",handleinput);

        function animate() {

            const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

            /*
            if(objectRotate) {
                netcube.rotation.y -= GRAVITY * deltaTime;
                //object.position.y += GRAVITY * deltaTime;
            }
            */

            //const currentTime = performance.now();
            //const dt = (currentTime - previousTime) / 1000; // like time.deltatime in unity

            //player.update(dt);
            for (let i = 0; i < STEPS_PER_FRAME; i++) {

                playerfps.update(deltaTime, worldOctree, GRAVITY);
                playerfps.controls(deltaTime, getForwardVector, getSideVector);

                //playerMesh.position.copy(camera.position.add(offset));
                playerMesh.position.copy(camera.position);
                //textMesh.position.copy(camera.position);
            }

            renderer.render(scene, camera);
            //renderer.render(scene, player.camera);
            //renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);

            //stats.update();

            //previousTime = currentTime;
            requestAnimationFrame(animate);
        }

        //setupUI(simpleWorld, player, scene.sun);
        setupLighting();

        sceneRef.current?.appendChild(renderer.domElement);
        animate();

        return () => {
            document.body.removeEventListener("keyup", handleinput);
            sceneRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={sceneRef}></div>;
};


export default ThreeScene;