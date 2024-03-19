import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    cameraHelper = new THREE.CameraHelper(this.camera);
    controls = new PointerLockControls(this.camera, document.body);

    maxSpeed = 10;
    velocity = new THREE.Vector3();
    input = new THREE.Vector3();

    constructor(scene) {
        // Player body, why 'this'...
        this.geometry = new THREE.SphereGeometry(0.5);
        this.material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;

        // how to child a mesh to some obj with offset like in unity
        this.camera.add(this.mesh);
        this.mesh.position.set(0, 0, 0.75);

        this.position.set(32, 10, 32);
        scene.add(this.camera);
        scene.add(this.cameraHelper);

        // Add event listeners for keyboard/mouse events
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    /**
     * Updates the state of the player
     * @param {Number} dt 
     */
    update(dt) {
        if (this.controls.isLocked === true) {
            this.velocity.x = this.input.x;
            this.velocity.z = this.input.z;
            this.controls.moveRight(this.velocity.x * dt);
            this.controls.moveForward(this.velocity.z * dt);
        }

        document.getElementById('info-player-position').innerHTML = this.toString();
    }

    /**
     * Returns the current world position of the player
     * @returns {THREE.Vector3}
     */
    get position() {
        return this.camera.position;
    }

    /**
     * Event handler for 'keyup' event
     * @param {KeyboardEvent} event 
     */
    onKeyUp(event) {
        switch (event.code) {
            case 'Escape':
                if (event.repeat) break;
                if (this.controls.isLocked) {
                    console.log('unlocking controls');
                    this.controls.unlock();
                } else {
                    console.log('locking controls');
                    this.controls.lock();
                }
                break;
            case 'KeyW':
                this.input.z = 0;
                break;
            case 'KeyA':
                this.input.x = 0;
                break;
            case 'KeyS':
                this.input.z = 0;
                break;
            case 'KeyD':
                this.input.x = 0;
                break;
        }
    }

    /**
     * Event handler for 'keyup' event
     * @param {KeyboardEvent} event 
     */
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.input.z = this.maxSpeed;
                break;
            case 'KeyA':
                this.input.x = -this.maxSpeed;
                break;
            case 'KeyS':
                this.input.z = -this.maxSpeed;
                break;
            case 'KeyD':
                this.input.x = this.maxSpeed;
                break;
            case 'KeyR':
                if (this.repeat) break;
                this.position.set(32, 10, 32);
                this.velocity.set(0, 0, 0);
                break;
        }
    }

    /**
     * Returns player position in a readable string form
     * @returns {string}
     */
    toString() {
        let str = '';
        str += `X: ${this.position.x.toFixed(3)} `;
        str += `Y: ${this.position.y.toFixed(3)} `;
        str += `Z: ${this.position.z.toFixed(3)}`;
        return str;
    }
}