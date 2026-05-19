import * as THREE from 'three';
import './styles/global.css';
import './ui/styles/menuBackground.css';
import { createGameCamera, createGameOrbitControls } from './rendering/orbitalcamera.js';
import { getGameConfig, updateGameConfig } from './states/gameConfigState.js';
import { createMainMenu } from './ui/components/createMainMenu.js';

const canvas = document.querySelector('#game-canvas');
const menuRoot = document.querySelector('#menu-root');

if (!canvas || !menuRoot) {
  throw new Error('App shell is missing required DOM nodes.');
}

let isGameStarted = false;
let rotationStep = 0.01;

const gameConfig = getGameConfig();

function startGame(config) {
  if (isGameStarted) {
    return;
  }

  const nextConfig = updateGameConfig({
    ...config,
    gameStarted: true,
  });

  // Higher round counts increase cube speed to show the selected config is applied.
  rotationStep = 0.002 + nextConfig.rounds * 0.0015;
  isGameStarted = true;

  menuRoot.classList.add('menu-root--hidden');
  menuRoot.setAttribute('aria-hidden', 'true');

  animate();
}

const mainMenu = createMainMenu({
  initialConfig: gameConfig,
  onConfigChange: (config) => {
    updateGameConfig(config);
  },
  onStart: (config) => {
    startGame(config);
  },
});

menuRoot.append(mainMenu);

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

  cube.rotation.x += rotationStep;
  cube.rotation.y += rotationStep;

  renderer.render(scene, camera);
}

renderer.render(scene, camera);