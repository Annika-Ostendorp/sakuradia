import * as THREE from "three";
import "../styles/global.css";
import {
  createGameCamera,
  createGameOrbitControls,
  updateOrbitControlsWithRightStick,
  moveOrbitCameraHorizontal,
} from "/src/rendering/OrbitalCamera.js";
import {
  createOrthographicCamera,
  createOrthographicDragControls,
  updateOrthographicCameraSize,
  DEFAULT_ORTHO_VIEW_SIZE,
  MIN_ORTHO_VIEW_SIZE,
  MAX_ORTHO_VIEW_SIZE,
} from "/src/rendering/OrthographicCamera.js";
import ModelLoader from "/src/utils/ModelLoader.js";
import SmoothAnimator from "/src/utils/SmoothAnimator.js";
import GameplayManager from "../gameplay/GameplayManager.js";
import InputManager from "../input/InputManager.js";
import DebugConfig from "../debug/DebugConfig.js";
import { createRulesPopup } from "../ui/components/createRulesPopup.js";
import ruleImage01 from "../assets/images/rules/Sakura_RulePopup-01.jpg";
import ruleImage02 from "../assets/images/rules/Sakura_RulePopup-02.jpg";
import ruleImage03 from "../assets/images/rules/Sakura_RulePopup-03.jpg";
import ruleImage04 from "../assets/images/rules/Sakura_RulePopup-04.jpg";
import ruleImage07 from "../assets/images/rules/Sakura_RulePopup-07.jpg";
import ruleImage08 from "../assets/images/rules/Sakura_RulePopup-08.jpg";
import AudioManager from "/src/audio/AudioManager.js";
import { AudioType } from "/src/data/AudioType.js";

const RULE_PAGES = [
  { src: ruleImage01, alt: "Rules page 1" },
  { src: ruleImage02, alt: "Rules page 2" },
  { src: ruleImage03, alt: "Rules page 3" },
  { src: ruleImage04, alt: "Rules page 4" },
  { src: ruleImage07, alt: "Rules page 7" },
  { src: ruleImage08, alt: "Rules page 8" },
];

/**
 * Baut die 3D-Szene auf und startet die Render-Schleife. Initialisiert Kamera,
 * Renderer, Lichtquellen und delegiert die Spiel- sowie Input-Initialisierung an
 * `GameplayManager` bzw. `InputManager`.
 *
 * Wichtiger Ablaufpunkt: Die `animate()`-Schleife wird bereits vor der
 * Initialisierung der Spiel-Logik gestartet. Das ist unkritisch, da die Szene
 * zunächst leer ist und das Rendering weiterhin korrekt arbeitet.
 */
export default class GameScene {
  #modelLoader = null;
  #scene = null;
  #camera = null;
  #orthographicGround = null;

  constructor(gameConfig) {
    this.gameConfig = gameConfig;
    this.smoothAnimator = new SmoothAnimator();
    this.#modelLoader = new ModelLoader();

    this.initialization();

    this.timer = new THREE.Timer();
    this.isUsingPerspectiveCamera = true;
    this.orthoViewSize = DEFAULT_ORTHO_VIEW_SIZE;

    this.audioManager = AudioManager.getInstance();
    this.audioManager.initialize(this.#scene, this.#camera);

    this.audioManager.play(
      "assets/audio/ambience/ambience.wav",
      new THREE.Vector3(0, 0, 0),
      0,
      AudioType.AMBIENCE,
      1,
      1,
      true,
    );

    this.audioManager.play(
      "assets/audio/music/backgroundmusic.mp3",
      new THREE.Vector3(0, 0, 0),
      0,
      AudioType.MUSIC,
      1,
      1,
      true,
      0.04,
    );

    this.gameplayManager = new GameplayManager(
      this.#scene,
      this.gameConfig,
      this.#modelLoader,
      this.smoothAnimator,
    );

    this.inputManager = new InputManager(
      this.#scene,
      this.canvas,
      this.gameplayManager,
      this.#camera,
    );

    this.rulesPopup = createRulesPopup({ pages: RULE_PAGES });
    this.appShell.append(this.rulesPopup.element);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  initialization() {
    this.appShell = document.querySelector("#app-shell");
    this.canvas = document.querySelector("#game-canvas");

    if (!this.appShell || !this.canvas) {
      throw new Error("App shell is missing required DOM nodes.");
    }

    this.#scene = new THREE.Scene();

    const cubeTextureLoader = new THREE.CubeTextureLoader();

    const skybox = cubeTextureLoader.load([
      "assets/images/skybox/sky_32_cubemap_2k/px.png",
      "assets/images/skybox/sky_32_cubemap_2k/nx.png",
      "assets/images/skybox/sky_32_cubemap_2k/py.png",
      "assets/images/skybox/sky_32_cubemap_2k/ny.png",
      "assets/images/skybox/sky_32_cubemap_2k/pz.png",
      "assets/images/skybox/sky_32_cubemap_2k/nz.png",
    ]);

    this.#scene.background = skybox;
    this.#scene.fog = new THREE.Fog("#323E6E", 20, 80);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.setupPerspectiveCamera();

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.#scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;

    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;

    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;

    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.normalBias = 0.02;

    this.#scene.add(directionalLight);

    this.#orthographicGround = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({
        color: "#323E6E",
      }),
    );

    this.#orthographicGround.rotation.x = -Math.PI / 2;
    this.#orthographicGround.position.y = -0.05;
    this.#orthographicGround.visible = false;
    this.#orthographicGround.name = "OrthographicGround";
    this.#orthographicGround.userData.ignoreRaycast = true;

    this.#scene.add(this.#orthographicGround);

    if (DebugConfig.enabled && DebugConfig.showAxes) {
      const axesHelper = new THREE.AxesHelper(5);
      this.#scene.add(axesHelper);
    }
  }

  handleResize() {
    const aspect = window.innerWidth / window.innerHeight;

    if (this.isUsingPerspectiveCamera) {
      this.#camera.aspect = aspect;
      this.#camera.updateProjectionMatrix();
    } else {
      updateOrthographicCameraSize(this.#camera, this.orthoViewSize);
    }

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setupPerspectiveCamera() {
    this.#camera = createGameCamera();

    if (this.#orthographicGround) {
      this.#orthographicGround.visible = false;
    }

    this.controls = createGameOrbitControls(
      this.#camera,
      this.renderer.domElement,
    );

    this.#camera.position.set(0, 15, 0);
    this.#camera.lookAt(0, 0, 0);
  }

  setupOrthographicCamera() {
    this.orthoViewSize = DEFAULT_ORTHO_VIEW_SIZE;
    this.#camera = createOrthographicCamera(this.orthoViewSize);

    if (this.#orthographicGround) {
      this.#orthographicGround.visible = true;
    }

    this.#camera.up.set(0, 0, -1);
    this.#camera.position.set(0, 15, 0);
    this.#camera.lookAt(0, 0, 0);

    this.controls = createOrthographicDragControls(
      this.#camera,
      this.renderer.domElement,
      {
        dragButton: 2,

        minViewSize: MIN_ORTHO_VIEW_SIZE,
        maxViewSize: MAX_ORTHO_VIEW_SIZE,
        zoomSpeed: 0.12,

        getViewSize: () => this.orthoViewSize,

        setViewSize: (nextViewSize) => {
          this.orthoViewSize = nextViewSize;
          updateOrthographicCameraSize(this.#camera, this.orthoViewSize);
        },
      },
    );
  }
  resetCamera() {
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.isUsingPerspectiveCamera) {
      this.setupPerspectiveCamera();
    } else {
      this.setupOrthographicCamera();
    }

    this.inputManager.updateCamera(this.#camera);
    this.audioManager.initialize(this.#scene, this.#camera);
  }

  animate() {
    requestAnimationFrame(this.animate);

    this.timer.update();

    const deltaTime = this.timer.getDelta();

    this.smoothAnimator.update(deltaTime);

    if (this.isUsingPerspectiveCamera) {
      updateOrbitControlsWithRightStick(
        this.controls,
        deltaTime,
        this.inputManager.getInvertPan(),
        this.inputManager.getInvertTilt(),
      );

      moveOrbitCameraHorizontal(
        this.#camera,
        this.controls,
        this.inputManager.getShoulderInput(),
      );

      this.controls.update();
    }

    if (this.inputManager.doResetCamera()) {
      this.isUsingPerspectiveCamera = !this.isUsingPerspectiveCamera;
      this.resetCamera();
    }

    this.inputManager.update(deltaTime);

    this.renderer.render(this.#scene, this.#camera);
  }
}
