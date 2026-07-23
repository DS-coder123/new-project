// === RENDERER ===
// Three.js scene setup, lighting, fog, post-processing prep

import * as THREE from 'three';
import { WORLD } from './config.js';

class Renderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    document.body.prepend(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a18);
    this.scene.fog = new THREE.FogExp2(0x0a0a18, 0.00015);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.1, 500
    );
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 1, 0);

    // Lighting
    this._setupLighting();

    // Clock
    this.clock = new THREE.Clock();

    // Post-processing prep (separate scene for UI/effects)
    this.uiScene = new THREE.Scene();
    this.uiCamera = new THREE.OrthographicCamera(-1,1,1,-1,0.1,10);

    // Resize handler
    window.addEventListener('resize', () => this._onResize());

    // Performance
    this.fpsFrames = 0;
    this.fpsTime = 0;
    this.fps = 60;
  }

  _setupLighting() {
    // Ambient
    var amb = new THREE.AmbientLight(0x1a1a3e, 1.2);
    this.scene.add(amb);

    // Directional sun
    var sun = new THREE.DirectionalLight(0xffeedd, 3.5);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.bias = -0.0001;
    this.scene.add(sun);
    this.sun = sun;

    // Hemisphere
    var hemi = new THREE.HemisphereLight(0x8899cc, 0x223344, 0.8);
    this.scene.add(hemi);

    // Point lights for atmosphere
    this.atmoLights = [];
    const colors = [0x4dc9f6, 0xa78bfa, 0xf64d9b];
    for (let i = 0; i < 3; i++) {
      var pt = new THREE.PointLight(colors[i], 3, 30);
      pt.position.set(
        (Math.random() - 0.5) * 40,
        5 + Math.random() * 15,
        (Math.random() - 0.5) * 40
      );
      this.scene.add(pt);
      this.atmoLights.push(pt);
    }
  }

  update(dt) {
    // FPS counter
    this.fpsFrames++;
    this.fpsTime += dt;
    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsFrames = 0;
      this.fpsTime = 0;
      const el = document.getElementById('fps-counter');
      if (el) el.textContent = this.fps + ' FPS';
    }

    // Animate atmosphere lights
    const t = this.clock.getElapsedTime();
    for (let i = 0; i < this.atmoLights.length; i++) {
      const l = this.atmoLights[i];
      l.intensity = 2.5 + Math.sin(t * 0.7 + i * 2) * 1.5;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  getDelta() { return Math.min(this.clock.getDelta(), 0.1); }
  getElapsed() { return this.clock.getElapsedTime(); }
}

export { Renderer };
