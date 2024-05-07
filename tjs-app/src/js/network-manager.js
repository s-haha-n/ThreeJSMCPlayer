import * as THREE from 'three';
import Peer from 'peerjs';


class NetworkManager {
  /**
   * This class manages network objects, meaning the synchronization of data over the network.
   */
  constructor(peerid, scene) {
    if(peerid == 'null')
    {
      peerid = null;
    }
    this.connection = peerid;
    this._peer_connect();
    this.scene = scene;

    this.last_update = {};
  }

  _peer_connect() {
    this.pc = new Peer();
    this.pc.on('open', this._on_peerjs_uuid.bind(this));
    this.pc.on('error', (err) => {
      console.log(err);
      // retry after 3 seconds
      console.log(`Retrying connection after ${3} seconds...`)
      setTimeout(this._peer_connect.bind(this), 3000);
    });
  }

  _on_peerjs_uuid(id) {
    this.peerid = id;
    if (this.connection) { // create a client
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
    } else { // server
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
      connection.send(JSON.stringify(this.sendData(connection.peer))); // remember, this is from host! need to aggregate
    });
  }

  _get_mesh_info(object) {
    // get vital geometry information and material information
    const mesh_info = {
      geometry: {},
      material: {},
      uuid: object.uuid,
      author: this.peerid
    };
    mesh_info.geometry.type = object.geometry.type;
    mesh_info.geometry.parameters = object.geometry.parameters; // !! this may cause some issues in the future as it has variable parameters
    mesh_info.material.type = object.material.type;
    mesh_info.material.color = [ // what about alpha channel or other types of materials parameters? will have to see...
      object.material.color.r,
      object.material.color.g,
      object.material.color.b
    ];
    mesh_info.position = [object.position.x, object.position.y, object.position.z];
    mesh_info.rotation = [object.rotation._x, object.rotation._y, object.rotation._z]; // always Euler XYZ
    mesh_info.scale = [object.scale.x, object.scale.y, object.scale.z];
    return mesh_info;
  }

  _to_object_mesh(mesh_info) {
    const geometry = new THREE[mesh_info.geometry.type]();
    Object.entries(mesh_info.geometry.parameters).forEach((entry) => {
      geometry[entry[0]] = entry[1];
    });
    const material = new THREE[mesh_info.material.type]();
    material.color.setRGB(mesh_info.material.color[0], mesh_info.material.color[1], mesh_info.material.color[2]);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(mesh_info.position[0], mesh_info.position[1], mesh_info.position[2]);
    mesh.rotation.set(mesh_info.rotation[0], mesh_info.rotation[1], mesh_info.rotation[2]);
    mesh.scale.set(mesh_info.scale[0], mesh_info.scale[1], mesh_info.scale[2]);
    mesh.uuid = mesh_info.uuid; // this will cause bugs since different users may have similar uuids! use a remap table in the future
    mesh.userData.remote_uuid = mesh_info.uuid;
    mesh.userData.author = mesh_info.author;
    return mesh;
  }

  _update_object(object, mesh_info) {
    if (object.geometry.type !== mesh_info.geometry.type) return false;
    let valid = true;
    Object.entries(mesh_info.geometry.parameters).forEach((entry) => {
      if (object.geometry[entry[0]] !== entry[1]) valid = false;
    });
    if (!valid) return false;
    if (object.material.type !== mesh_info.material.type) return false;
    object.material.color.setRGB(mesh_info.material.color[0], mesh_info.material.color[1], mesh_info.material.color[2]);
    object.position.set(mesh_info.position[0], mesh_info.position[1], mesh_info.position[2]);
    object.rotation.set(mesh_info.rotation[0], mesh_info.rotation[1], mesh_info.rotation[2]);
    object.scale.set(mesh_info.scale[0], mesh_info.scale[1], mesh_info.scale[2]);
    return true;
  }

  onConnect(peerid) {
    console.log(`Now connected to ${peerid}`);
  }

  sendData(peerid) {
    /**
     * Get a scene diff, like what we do with github commits
     */
    // get a list of all scene objects
    const objects = {};
    this.scene.traverse((object) => {
      if (object.isMesh && object.userData.author !== peerid) {
        objects[object.uuid] = object;
      }
    });

    // compare to the last known snapshot of objects that we already updated with
    if (!this.last_update.users) {
      this.last_update.users = {};
    }
    if (!this.last_update.users[peerid]) {
      this.last_update.users[peerid] = {};
    }
    const snapshot = this.last_update.users[peerid];

    function meshDiff(A, B) {
      const diff = {};
      Object.keys(A).forEach((k) => {
        // assume that B[k] and A[k] are of the same type
        if (B[k] === undefined && A[k] !== undefined) {
          diff[k] = A[k];
        } else {
          const a = A[k];
          const b = B[k]
          if (a instanceof Object) {
            const subdiff = meshDiff(a, b);
            if (subdiff !== null) {
              diff[k] = subdiff;
            }
          } else if (a instanceof Array) {
            if (a.length !== b.length) {
              diff[k] = a;
            } else {
              for (let i = 0; i < a.length; i++) {
                if (a[i] != b[i]);
              }
            }
          } else {
            if (a !== b) {
              diff[k] = a;
            }
          }
        }
      });
      if (Object.keys(diff).length === 0) {
        return null;
      }
      return diff;
    }

    const toModify = [];
    const toDelete = [];
    Object.keys(snapshot).forEach((uuid) => {
      if (!objects[uuid]) {
        delete snapshot[uuid];
        toDelete.push(uuid);
      }
    });
    Object.values(objects).forEach((object) => {
      const object_info = this._get_mesh_info(object);
      if (!snapshot[object.uuid]) {
        snapshot[object.uuid] = object_info;
        toModify.push(object_info);
      } else {
        // need to check if there is any difference in the object info
        const object_diff = meshDiff(object_info, snapshot[object.uuid]);
        if (object_diff !== null) {
          // just add the whole object info for now
          snapshot[object.uuid] = object_info;
          toModify.push(object_info);
        }
      }
    });

    // push a set of differences to the sendData() hook
    return {
      put: toModify,
      del: toDelete
    };
  }

  onData(peerid, data) {
    // aggregate updates using scene
    if (!this.last_update.users) {
      this.last_update.users = {};
    }
    if (!this.last_update.users[peerid]) {
      this.last_update.users[peerid] = {};
    }
    const snapshot = this.last_update.users[peerid];

    const objects = {};
    this.scene.traverse((object) => {
      if (object.isMesh) {
        objects[object.uuid] = object;
      }
    });

    if (data.put && data.del) {
      for (const uuid of data.del) {
        const scene_obj = objects[uuid];
        if (scene_obj) {
          delete snapshot[uuid];
          scene_obj.geometry.dispose();
          scene_obj.material.dispose();
          this.scene.remove(scene_obj);
        }
      }

      for (const object_info of data.put) {
        console.log(`Creating new object with info`, object_info);
        snapshot[object_info.uuid] = object_info;
        const scene_obj = objects[object_info.uuid];
        if (scene_obj) {
          if (!this._update_object(scene_obj, object_info)) {
            console.log("Removing from scene", scene_obj);
            this.scene.remove(scene_obj);
            scene_obj.geometry.dispose();
            scene_obj.material.dispose();
            const mesh = this._to_object_mesh(object_info);
            console.log("Adding to scene", mesh);
            this.scene.add(mesh);
          }
        } else {
          const mesh = this._to_object_mesh(object_info);
          console.log("Adding to scene", mesh);
          this.scene.add(mesh);
        }
      }
    }
  }

};

export default NetworkManager;