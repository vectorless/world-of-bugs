// Smooth follow camera. Lerp factor is intentionally low so panning across
// the big world has a deliberate, tunnel-y feel — the camera trails the
// beetle rather than snapping.

export class CameraController {
  constructor(scene, target) {
    this.scene = scene;
    this.target = target;
    this.camera = scene.cameras.main;
    this.camera.startFollow(target, true, 0.10, 0.10);
    this.camera.setDeadzone(120, 60);
    this.camera.setZoom(1);
  }

  setBounds(pixelWidth, pixelHeight) {
    this.camera.setBounds(0, 0, pixelWidth, pixelHeight);
    this.camera.centerOn(this.target.x, this.target.y);
  }
}
