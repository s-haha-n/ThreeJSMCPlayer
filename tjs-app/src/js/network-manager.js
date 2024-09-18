import Peer from 'peerjs';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

class NetworkManager {
  /**
   * This class synchronizes meshes across the network to each peer using a look-up table.
   */
  constructor(peerid, scene) {
    /**
     * @peerid the peerid to connect to, can be null if creating a new room
     */

    if (peerid === 'null') peerid = null;
    this.connection = peerid;
    this.scene = scene;
    this._peer_connect();

    this.tracked = {}; // [mesh_id] network trackable objects
    this.synced = {}; // [peerid (per client sync)][mesh_id] these are all children that are known to the cloud, synced per client
    this.backlog = [];

    this._cached_font = null;
    const loader = new FontLoader();
    loader.load('https://cdn.rawgit.com/mrdoob/three.js/master/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      this._cached_font = font;
    });

    this.onnewmesh = (mesh) => {};
    this.onupdatemesh = (mesh) => {};
  }

  _peer_connect() {
    this.pc = new Peer();
    this.pc.on('open', this._on_peerjs_uuid.bind(this));
    this.pc.on('error', (err) => {
      console.log(err);
      // retry after 3 seconds
      console.log(`Retrying connection after ${3} seconds...`);
      setTimeout(this._peer_connect.bind(this), 3000);
    });
  }

  _on_peerjs_uuid(id) {
    this.peerid = id;
    setTimeout(() => {
      for (const mesh of this.backlog) {
        this.add(mesh); // now we can add those objects into the scene
      }
      this.backlog = [];
    }, 200);

    if (this.connection) {
      // Create a client connection to connect to a server
      this.connection = this.pc.connect(this.connection);
      this.connection.on('open', () => {
        this.onConnect(this.connection.peer);
        this.updateTask = setInterval((() => {
          this.connection.send(JSON.stringify(this.sendData(this.connection.peer)));
        }).bind(this), 10); // 10ms = 100fps
      });
      this.connection.on('data', (data) => {
        this.onData(this.connection.peer, JSON.parse(data));
      });
    } else {
      // Create a server hook-process to wait on connections
      this.pc.on('connection', this._host_add_connection.bind(this));
      console.log(`Room is now available at peerid: ${this.peerid}`);
    }
  }

  _host_add_connection(connection) {
    this.connections = this.connections ? this.connections : {};
    this.connections[connection.peer] = connection;
    connection.on('open', () => {
      this.onConnect(connection.peer);
    });
    connection.on('data', (data) => {
      this.onData(connection.peer, JSON.parse(data));
      // send an update back
      connection.send(JSON.stringify(this.sendData(connection.peer)));
    });
  }

  ///////////////////// MESHES //////////////////////

  // !BUG: it looks like the snapshot isn't preserving the information enough to detect a proper "diff"

  _uuid(mesh) {
    if (!this.peerid) return null;
    if (mesh.userData.origin) {
      return mesh.userData.origin;
    }
    const new_uuid = `${this.peerid}-${mesh.uuid}`; // this may need to change in the future
    mesh.userData.origin = new_uuid;
    return mesh.userData.origin;
  }

  _snap(mesh) {
    // we will need to modify this to send more information than this
    const mesh_info = { // remember that we are working on a network, so every object has parents, children, originators
      geometry: {},
      material: {},
      uuid: this._uuid(mesh)
    };
    const discretize = (x) => Math.round(x * 10000) / 10000; // save on network bytes

    mesh_info.geometry.type = mesh.geometry.type;
    const params = mesh.geometry.parameters;
    switch (mesh_info.geometry.type) {
      case "BoxGeometry":
        mesh_info.geometry.args = [
          params.width, params.height, params.depth,
          params.widthSegments, params.heightSegments, params.depthSegments
        ];
        break;
      case "CapsuleGeometry":
        mesh_info.geometry.args = [
          params.radius, params.length, params.capSegments, params.radialSegments
        ];
        break;
      case "CircleGeometry":
        mesh_info.geometry.args = [
          params.radius, params.segments, params.thetaStart, params.thetaLength
        ];
        break;
      case "ConeGeometry":
        mesh_info.geometry.args = [
          params.radius, params.height, params.radialSegments, params.heightSegments,
          params.openEnded, params.thetaStart, params.thetaLength
        ];
        break;
      case "CylinderGeometry":
        mesh_info.geometry.args = [
          params.radiusTop, params.radiusBottom, params.height,
          params.radialSegments, params.heightSegments,
          params.openEnded, params.thetaStart, params.thetaLength
        ];
        break;
      case "PlaneGeometry":
        mesh_info.geometry.args = [
          params.width, params.height, params.widthSegments, params.heightSegments
        ];
        break;
      case "RingGeometry":
        mesh_info.geometry.args = [
          params.innerRadius, params.outerRadius, params.thetaSegments, params.phiSegments,
          params.thetaStart, params.thetaLength
        ];
        break;
      case "SphereGeometry":
        mesh_info.geometry.args = [
          params.radius, params.widthSegments, params.heightSegments,
          params.phiStart, params.phiLength, params.thetaStart, params.thetaLength
        ];
        break;
      case "TorusGeometry":
        mesh_info.geometry.args = [
          params.radius, params.tube, params.radialSegments, params.tubularSegments
        ];
        break;
      case "TorusKnotGeometry":
        mesh_info.geometry.args = [
          params.radius, params.tube, params.tubularSegments, params.radialSegments,
          params.p, params.q
        ];
        break;
      case "DodecahedronGeometry":
      case "IcosahedronGeometry":
      case "OctahedronGeometry":
      case "TetrahedronGeometry":
        mesh_info.geometry.args = [params.radius, params.detail];
        break;
      case "EdgesGeometry":
      case "ExtrudeGeometry":
      case "LatheGeometry":
      case "PolyhedronGeometry":
      case "ShapeGeometry":
      case "TubeGeometry":
      case "WireframeGeometry":
        console.log(`${mesh_info.geometry.type} is not supported at this time`);
        return null;
      case "TextGeometry":
        mesh_info.geometry.args = { ...params.options }
        delete mesh_info.geometry.args.font; // we want to generate this on the other side
        break;
      default:
        console.log(`An error occurred when attempting to inspect ${mesh_info.geometry.type}`);
        return null;
    }

    mesh_info.material.type = mesh.material.type;
    mesh_info.material.color = [
      discretize(mesh.material.color.r),
      discretize(mesh.material.color.g),
      discretize(mesh.material.color.b)];

    mesh_info.position = [
      discretize(mesh.position.x),
      discretize(mesh.position.y),
      discretize(mesh.position.z)];
    mesh_info.rotation = [
      discretize(mesh.rotation._x),
      discretize(mesh.rotation._y),
      discretize(mesh.rotation._z)]; // always Euler XYZ, see if there is a way to ensure this
    mesh_info.scale = [
      discretize(mesh.scale.x),
      discretize(mesh.scale.y),
      discretize(mesh.scale.z)];
    // mesh_info.parent = mesh.parent ? this._uuid(mesh.parent) : null;
    return mesh_info;
  }

  async _generate(mesh_info) {
    try {
      let geometry;
      if (mesh_info.geometry.type === "TextGeometry") {
        while (!this._cached_font) { // blocks! careful...
          console.log(`Still loading font at ${Date.now()}`);
        }
        const options = mesh_info.geometry.args;
        const text = options.text || '';
        const font_family = options.font_family || null;
        options.font = this._cached_font; // use only one type of cached font for now
        geometry = new TextGeometry(text, options);
      } else {
        geometry = new THREE[mesh_info.geometry.type](...mesh_info.geometry.args);
      }
      const material = new THREE[mesh_info.material.type]();
      material.color.setRGB(...mesh_info.material.color);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...mesh_info.position);
      mesh.rotation.set(...mesh_info.rotation);
      mesh.scale.set(...mesh_info.scale);

      mesh.userData.origin = mesh_info.uuid;
      // mesh.userData.parent = mesh_info.parent; // just uuid for now, what if we never add parent to trackable?

      this.onnewmesh(mesh); // experimental hook
      return mesh;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  _update(mesh, mesh_diff) {
    // first check to make sure that the mesh can be updated
    if (mesh_diff.geometry && mesh.geometry.type !== mesh_diff.geometry.type) return false; // we will have to create a new geometry and therefore mesh
    if (mesh_diff.material && mesh.material.type !== mesh_diff.material.type) return false; // we will have to create a new material and therefore mesh

    // geometry updates are ignored for now (todo)

    // if it can be updated, update predefined properties such as color, position, rotation, and scale
    if (mesh_diff.material) {
      if (mesh_diff.material.color) {
        mesh.material.color.setRGB(...mesh_diff.material.color);
      }
    }
    if (mesh_diff.position) mesh.position.set(...mesh_diff.position);
    if (mesh_diff.rotation) mesh.rotation.set(...mesh_diff.rotation);
    if (mesh_diff.scale)    mesh.scale.set(...mesh_diff.scale);

    this.onupdatemesh(mesh);
    return true;
  }

  _diff(source, target) {
    const diff = {};
    Object.keys(source).forEach((k) => {
      // assume that B[k] and A[k] are of the same type
      const a = source[k];
      const b = target[k];
      if (b === undefined && a !== undefined) {
        diff[k] = a;
      } else {
        if (a instanceof Object) {
          const subdiff = this._diff(a, b);
          if (subdiff !== null) diff[k] = subdiff;
        } else if (a instanceof Array) {
          if (a.length !== b.length) {
            diff[k] = a;
          } else {
            for (let i = 0; i < a.length; i++) {
              if (a[i] !== b[i]) {
                diff[k] = a;
                break;
              }
            }
          }
        } else if (a !== b) {
          diff[k] = a;
        }
      }
    });
    return (Object.keys(diff).length !== 0) ? diff : null;
  }

  _merge(source, target) {
    Object.keys(source).forEach((k) => {
      // assume that B[k] and A[k] are of the same type
      const a = source[k];
      if (a instanceof Object) {
        if (!target[k]) target[k] = {};
        this._merge(a, target[k]);
      } else if (a instanceof Array) {
        if (a.length !== target[k].length) {
          target[k] = a;
        } else {
          for (let i = 0; i < a.length; i++) {
            if (a[i] !== target[k][i]) {
              target[k] = a;
              break;
            }
          }
        }
      } else if (a !== target[k]) {
        target[k] = a;
      }
    });
  }

  _find_mesh_deletes(snapshot) {
    const deletes = [];
    Object.keys(snapshot).forEach((uuid) => {
      if (!this.tracked[uuid]) { // mesh info is now null
        // note: it might be better to persist this deletion for a couple of seconds before removing from dataset, but for now just deleting
        const info = snapshot[uuid];
        delete snapshot[uuid];
        deletes.push({ uuid: info.uuid }); // this will push 'del' to other clients
      }
    });
    return deletes;
  }

  _find_mesh_updates(snapshot) {
    const updates = [];
    // find all parents and their rank, but only for valid tracked objects
    // we put this in update because the parent may change at times
    Object.keys(this.tracked).forEach((uuid) => {
      const mesh_info = this._snap(this.tracked[uuid]);
      if (!snapshot[uuid]) {
        snapshot[uuid] = mesh_info;
        updates.push(mesh_info);
      } else {
        // need to check if there is any difference in the mesh info
        const mesh_diff = this._diff(mesh_info, snapshot[uuid]);
        if (mesh_diff !== null) {
          snapshot[uuid] = mesh_info;
          mesh_diff.uuid = uuid;
          updates.push(mesh_info); // we only care about the diff
        }
      }
    });
    return updates;
  }

  onConnect(peerid) {
    console.log(`Now connected to ${peerid}`);
  }

  sendData(peerid) {
    /**
     * Get a scene diff, like what we do with github commits
     */
    // compare to the last known snapshot of meshes that we already updated with
    if (!this.synced[peerid]) this.synced[peerid] = {};
    const snapshot = this.synced[peerid]; // these objects are in origin UUID names
    // const meshes_to_delete = this._find_mesh_deletes(snapshot);
    const meshes_to_delete = [];
    const meshes_to_update = this._find_mesh_updates(snapshot);

    const data = {
      upd: meshes_to_update,
      del: meshes_to_delete
    };

    // push a set of differences to the sendData() hook
    return data;
  }

  onData(peerid, data) {
    // aggregate updates using scene
    if (!this.synced[peerid]) this.synced[peerid] = {};
    const snapshot = this.synced[peerid];

    const scene_meshes = {};
    this.scene.traverse((object) => {
      if (object.isMesh) {
        scene_meshes[object.uuid] = object;
      }
    });

    if (data.upd.length > 0 || data.del.length > 0) {
      for (const mesh_info of data.del) { // we are now deleting
        const mesh = this.tracked[mesh_info.uuid];
        if (mesh) {
          console.log("Deleting:", mesh);
          if (scene_meshes[mesh.uuid]) {
            this.scene.remove(mesh);
          }
          delete snapshot[mesh_info.uuid];
          delete this.tracked[mesh_info.uuid];
          mesh.geometry.dispose();
          mesh.material.dispose();
        }
      }

      for (const mesh_diff of data.upd) {
        if (!snapshot[mesh_diff.uuid]) {
          snapshot[mesh_diff.uuid] = mesh_diff;
        } else {
          this._merge(mesh_diff, snapshot[mesh_diff.uuid]);
        }
        let mesh = this.tracked[mesh_diff.uuid];
        if (mesh && !this._update(mesh, mesh_diff)) {
          console.log("Deleting:", mesh);
          if (scene_meshes[mesh.uuid]) {
            this.scene.remove(mesh);
          }
          delete this.tracked[mesh_diff.uuid];
          mesh.geometry.dispose();
          mesh.material.dispose();
          mesh = null;
        }
        if (!mesh) { // just in case we deleted it
          this._generate(snapshot[mesh_diff.uuid], this.scene)
          .then((mesh) => {
            console.log("Adding:", mesh);
            this.tracked[mesh_diff.uuid] = mesh;
            this.scene.add(mesh);
          });
        }
      }
    }
  }

  add(mesh) {
    const uuid = this._uuid(mesh);
    if (uuid === null) {
      this.backlog.push(mesh);
    } else {
      mesh.userData.origin = this._uuid(mesh);
      this.tracked[mesh.userData.origin] = mesh;
    }
  }

  remove(mesh) {
    // only remove it from the tracker
    // will need to replace all children connections with a virtual node
    const uuid = this._uuid(mesh);
  }

};

export default NetworkManager;