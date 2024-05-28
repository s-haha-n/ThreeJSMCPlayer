import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/home.css';

export default function HomePage() {
  
  const [worldId, setWorldId] = useState("");
  const navigate = useNavigate();
  const name = sessionStorage.getItem('username');
  console.log('username is ' + name);
  
  const enterWorld = () => {
    console.log("Entering world " + worldId);
    navigate('/world', { state: { peerId:worldId, username:name }});
  }

  const createWorld = () => {
    console.log("Creating new world");
    navigate('/world', { state: { peerId:null, username:name }});
  }

  return (
    <div className='SessionHandler'>
      <div className='JoinSession'>
        <label>
          <input value={worldId} onChange={e => setWorldId(e.target.value)} /> <button onClick={enterWorld}>Join World</button>
        </label>
      </div>
      <div className='NewWorld'>
        <button onClick={createWorld}>Create World</button>
      </div>
      <HomeScene />
    </div>
  );
}

const HomeScene: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement | null>(null);

  // Allows js to called in react, converts to ts
  useEffect(() => {
    
    // Set up Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    document.body.appendChild(renderer.domElement);

    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(2, 32, 16);
    const shellgeometry = new THREE.SphereGeometry(2.08, 32, 16);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const shellmaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    const shell= new THREE.Mesh(shellgeometry, shellmaterial);
    scene.add(sphere);
    scene.add(shell);

    // Position camera
    camera.position.z = 5;

    // Animation parameters
    let time = 0;

    const sun = new THREE.DirectionalLight();
    sun.position.set(150, 50, 50);
    scene.add(sun);

    const ambient = new THREE.AmbientLight();
    ambient.intensity = 0.1;
    scene.add(ambient);


    // Render function
    function animate() {
      requestAnimationFrame(animate);

      // Rotate the sphere
      sphere.rotation.x += 0.0008;
      sphere.rotation.y += 0.001;
      shell.rotation.x += 0.001;
      shell.rotation.y -= 0.003;

      // Render the scene
      renderer.render(scene, camera);
    }
    animate();    

    sceneRef.current?.appendChild(renderer.domElement);
    animate();

    return () => {
      sceneRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={sceneRef}></div>;

};