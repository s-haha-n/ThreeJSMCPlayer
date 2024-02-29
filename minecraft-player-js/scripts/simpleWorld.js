import * as THREE from 'three';

const geometry = new THREE.BoxGeometry(100, 10, 100);
const material = new THREE.MeshLambertMaterial();

export class SimpleWorld extends THREE.Group {
  size = {
    width: 64,
    height: 32 
  }

  generate() {
    //const rng = new RNG(this.params.seed);
    this.initialize();
    //this.generateTerrain(rng);
    this.generateMeshes();
  }

  /**
   * Initializes an empty world
   */
  initialize() {
    
  }

  generateMeshes() {
    // Initialize instanced mesh to total size of world
    const maxCount = this.size.width * this.size.width * this.size.height;
    //const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    const mesh = new THREE.Mesh(geometry, material);
    //mesh.count = 0;

    // variation for simpleWorld
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  
    this.add(mesh);
  }

}