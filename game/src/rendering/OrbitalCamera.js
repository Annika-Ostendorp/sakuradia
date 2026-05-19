import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createGameCamera() {
	const camera = new THREE.PerspectiveCamera(
		60,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);

	camera.position.set(6, 5, 8);
	return camera;
}

export function createGameOrbitControls(camera, domElement) {
	const controls = new OrbitControls(camera, domElement);

	controls.target.set(0, 1, 0);
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;

	controls.minDistance = 2;
	controls.maxDistance = 30;

	controls.minPolarAngle = 0;
	controls.maxPolarAngle = Math.PI / 2 - 0.05;

	controls.minAzimuthAngle = -Infinity;
	controls.maxAzimuthAngle = Infinity;

	controls.update();

	return controls;
}