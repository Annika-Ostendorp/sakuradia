import * as THREE from "three";

export const DEFAULT_ORTHO_VIEW_SIZE = 17;
export const MIN_ORTHO_VIEW_SIZE = 1;
export const MAX_ORTHO_VIEW_SIZE = 25;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function createOrthographicCamera(viewSize = DEFAULT_ORTHO_VIEW_SIZE) {
  const camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 1000);

  updateOrthographicCameraSize(camera, viewSize);

  return camera;
}

export function updateOrthographicCameraSize(camera, viewSize) {
  const aspect = window.innerWidth / window.innerHeight;

  camera.left = (-viewSize * aspect) / 2;
  camera.right = (viewSize * aspect) / 2;
  camera.top = viewSize / 2;
  camera.bottom = -viewSize / 2;

  camera.updateProjectionMatrix();
}

export function createOrthographicDragControls(camera, domElement, options = {}) {
  const dragButton = options.dragButton ?? 2;

  const minViewSize = options.minViewSize ?? MIN_ORTHO_VIEW_SIZE;
  const maxViewSize = options.maxViewSize ?? MAX_ORTHO_VIEW_SIZE;
  const zoomSpeed = options.zoomSpeed ?? 0.12;

  const getViewSize = options.getViewSize;
  const setViewSize = options.setViewSize;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  const lastPoint = new THREE.Vector3();
  const currentPoint = new THREE.Vector3();

  let isDragging = false;
  let pointerId = null;

  function getGroundPoint(event, target) {
    const rect = domElement.getBoundingClientRect();

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);

    return raycaster.ray.intersectPlane(groundPlane, target);
  }

  function onPointerDown(event) {
    if (event.button !== dragButton) return;

    const hit = getGroundPoint(event, lastPoint);
    if (!hit) return;

    isDragging = true;
    pointerId = event.pointerId;

    domElement.setPointerCapture(pointerId);
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!isDragging || event.pointerId !== pointerId) return;

    const hit = getGroundPoint(event, currentPoint);
    if (!hit) return;

    const offset = lastPoint.clone().sub(currentPoint);
    camera.position.add(offset);

    event.preventDefault();
  }

  function onPointerUp(event) {
    if (event.pointerId !== pointerId) return;

    isDragging = false;

    if (domElement.hasPointerCapture(pointerId)) {
      domElement.releasePointerCapture(pointerId);
    }

    pointerId = null;
  }

  function onWheel(event) {
    if (!getViewSize || !setViewSize) return;

    event.preventDefault();

    const currentViewSize = getViewSize();

    const zoomFactor =
      event.deltaY > 0
        ? 1 + zoomSpeed
        : 1 - zoomSpeed;

    const nextViewSize = clamp(
      currentViewSize * zoomFactor,
      minViewSize,
      maxViewSize,
    );

    setViewSize(nextViewSize);
  }

  function onContextMenu(event) {
    if (dragButton === 2) {
      event.preventDefault();
    }
  }

  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("pointercancel", onPointerUp);
  domElement.addEventListener("wheel", onWheel, { passive: false });
  domElement.addEventListener("contextmenu", onContextMenu);

  return {
    dispose() {
      domElement.removeEventListener("pointerdown", onPointerDown);
      domElement.removeEventListener("pointermove", onPointerMove);
      domElement.removeEventListener("pointerup", onPointerUp);
      domElement.removeEventListener("pointercancel", onPointerUp);
      domElement.removeEventListener("wheel", onWheel);
      domElement.removeEventListener("contextmenu", onContextMenu);
    },
  };
}