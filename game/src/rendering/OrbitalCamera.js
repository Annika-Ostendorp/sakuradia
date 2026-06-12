import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Enthält Funktionen zum Erstellen der Orbital-Kamera und ihrer Steuerung.

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

export function updateOrbitControlsWithRightStick(controls, deltaTime) {
	const gamepads = navigator.getGamepads();
	const gamepad = gamepads[0];

	if (!gamepad) {
		return;
	}

	const deadzone = 0.2;

	let rightX = gamepad.axes[2] ?? 0;
	let rightY = gamepad.axes[3] ?? 0;

	if (Math.abs(rightX) < deadzone) {
		rightX = 0;
	}

	if (Math.abs(rightY) < deadzone) {
		rightY = 0;
	}

	if (rightX === 0 && rightY === 0) {
		return;
	}

	const rotationSpeed = 1.5;

	controls.rotateLeft(rightX * rotationSpeed * deltaTime);
	controls.rotateUp(rightY * rotationSpeed * deltaTime);
}
