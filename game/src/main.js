import * as THREE from 'three';
import './styles/global.css';
import { createGameCamera, createGameOrbitControls } from './rendering/orbitalcamera.js';

const canvas = document.querySelector('#game-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20242a);



const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});

 const camera = createGameCamera(renderer);
 const controls = createGameOrbitControls(
    camera,
    renderer.domElement
        );

     camera.position.set(0, 15, 0);
     camera.lookAt(0, 0, 0);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
  color: 0x55cc88,
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);

function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();