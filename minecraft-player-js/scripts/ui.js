import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { SimpleWorld } from './simpleWorld';

/**
 * 
 * @param {simpleWorld} simpleWorld 
 */
export function setupUI(simpleWorld, player, sun) {
  const gui = new GUI();

  const playerFolder = gui.addFolder('Player');
  playerFolder.add(player, 'maxSpeed', 1, 20, 0.1).name('Max Speed');
  playerFolder.add(player.cameraHelper, 'visible').name('Show Camera Helper');

  const simpleWorldFolder = gui.addFolder('World Settings');
  //simpleWorldFolder.add(sun.intensity, 'intesnity', 0, 1).name('Something');
  //console.log(sun);
  simpleWorldFolder.add(simpleWorld.size, 'width', 8, 128, 1).name('Width');
  simpleWorldFolder.add(simpleWorld.size, 'height', 8, 32, 1).name('Height');
  
  const terrainFolder = simpleWorldFolder.addFolder('Terrain');
  terrainFolder.add(simpleWorld.params, 'seed', 0, 10000, 1).name('Seed');
  terrainFolder.add(simpleWorld.params.terrain, 'scale', 10, 100).name('Scale');
  terrainFolder.add(simpleWorld.params.terrain, 'magnitude', 0, 1).name('Magnitude');
  terrainFolder.add(simpleWorld.params.terrain, 'offset', 0, 1).name('Offset');

  gui.onChange((event) => {
    simpleWorld.generate();
  });
}