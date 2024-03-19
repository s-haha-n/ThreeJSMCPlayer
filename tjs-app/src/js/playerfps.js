// playerfps.js
import * as THREE from 'three';

export class PlayerFPS {
    constructor(camera, collider) {
        this.camera = camera;
        this.collider = collider;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.onFloor = false;
        this.keyStates = {};
        this.mouseTime = 0;
        this.vector1 = new THREE.Vector3();
        this.vector2 = new THREE.Vector3();
        this.vector3 = new THREE.Vector3();
    }

    // Initialize player controls
    initControls() {
        document.addEventListener('keydown', event => {
            this.keyStates[event.code] = true;
        });

        document.addEventListener('keyup', event => {
            this.keyStates[event.code] = false;
        });

        document.body.addEventListener('mousedown', () => {
            document.body.requestPointerLock();
            this.mouseTime = performance.now();
        });

        /*
        document.addEventListener('mouseup', () => {
            if (document.pointerLockElement !== null) this.throwBall();
        });
        */

        document.body.addEventListener('mousemove', event => {
            if (document.pointerLockElement === document.body) {
                this.camera.rotation.y -= event.movementX / 500;
                this.camera.rotation.x -= event.movementY / 500;
            }
        });
    }

    // Perform player collisions
    playerCollisions(worldOctree, GRAVITY) {
        const result = worldOctree.capsuleIntersect(this.collider);
        this.onFloor = false;
        if (result) {
            this.onFloor = result.normal.y > 0;
            if (!this.onFloor) {
                this.velocity.addScaledVector(result.normal, -result.normal.dot(this.velocity));
            }
            this.collider.translate(result.normal.multiplyScalar(result.depth));
        }
    }

    // Update player state
    update(deltaTime, worldOctree, GRAVITY) {
        let damping = Math.exp(-4 * deltaTime) - 1;
        if (!this.onFloor) {
            this.velocity.y -= GRAVITY * deltaTime;
            damping *= 0.1; // Small air resistance
        }
        this.velocity.addScaledVector(this.velocity, damping);
        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
        this.collider.translate(deltaPosition);
        this.playerCollisions(worldOctree, GRAVITY);
        this.camera.position.copy(this.collider.end);
    }

    // Handle player controls
    controls(deltaTime, getForwardVector, getSideVector) {
        const speedDelta = deltaTime * (this.onFloor ? 25 : 8);
        if (this.keyStates['KeyW']) {
            this.velocity.add(getForwardVector().multiplyScalar(speedDelta));
        }
        if (this.keyStates['KeyS']) {
            this.velocity.add(getForwardVector().multiplyScalar(-speedDelta));
        }
        if (this.keyStates['KeyA']) {
            this.velocity.add(getSideVector().multiplyScalar(-speedDelta));
        }
        if (this.keyStates['KeyD']) {
            this.velocity.add(getSideVector().multiplyScalar(speedDelta));
        }
        if (this.onFloor && this.keyStates['Space']) {
            this.velocity.y = 15;
        }
    }

    /*
    // Throw a ball
    throwBall(spheres, sphereIdx) {
        const sphere = spheres[sphereIdx];
        this.camera.getWorldDirection(this.direction);
        sphere.collider.center.copy(this.collider.end).addScaledVector(this.direction, this.collider.radius * 1.5);
        const impulse = 15 + 30 * (1 - Math.exp((this.mouseTime - performance.now()) * 0.001));
        sphere.velocity.copy(this.direction).multiplyScalar(impulse);
        sphere.velocity.addScaledVector(this.velocity, 2);
    }
    */
}
