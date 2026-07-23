// === WORLD ===
// Environment: terrain, platforms, structures, collision geometry

import * as THREE from 'three';
import { WORLD } from './config.js';

class World {
  constructor(scene) {
    this.scene = scene;
    this.groundMeshes = [];
    this.collisionObjects = [];
    this.platforms = [];
    this.structures = [];
    this.walls = [];
    this.decorations = [];

    this._buildWorld();
  }

  _buildWorld() {
    // Main ground plane
    this._createGround();

    // Temple arena
    this._createTempleArena();

    // Platforming section
    this._createPlatformSection();

    // Elevated walkways
    this._createWalkways();

    // Pillars and columns
    this._createPillars();

    // Walls and boundaries
    this._createBoundaries();

    // Decorative elements
    this._createDecorations();
  }

  _createGround() {
    // Large textured ground
    var groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    // Add subtle height variation
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const dist = Math.sqrt(x*x + y*y) * 0.05;
      pos.setZ(i, Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.4 + Math.sin(dist) * 0.3);
    }
    groundGeo.computeVertexNormals();

    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      roughness: 0.8,
      metalness: 0.1,
    });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMeshes.push(ground);
    this.collisionObjects.push(ground);
  }

  _createTempleArena() {
    // Central arena — large circular platform
    var arenaGeo = new THREE.CylinderGeometry(12, 12.5, 0.4, 32);
    var arenaMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a4a,
      roughness: 0.5,
      metalness: 0.4,
    });
    var arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.set(0, 0.1, 0);
    arena.receiveShadow = true;
    arena.castShadow = true;
    this.scene.add(arena);
    this.collisionObjects.push(arena);
    this.structures.push({ mesh: arena, type: 'arena' });

    // Arena ring pattern
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      var pillarGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
      var pillarMat = new THREE.MeshStandardMaterial({
        color: 0x5a5a6a,
        roughness: 0.4,
        metalness: 0.6,
        emissive: 0x111122,
        emissiveIntensity: 0.2,
      });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(
        Math.cos(angle) * 11,
        1.5,
        Math.sin(angle) * 11
      );
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
      this.collisionObjects.push(pillar);
      this.structures.push({ mesh: pillar, type: 'pillar' });

      // Torch light on each pillar
      var flameGeo = new THREE.SphereGeometry(0.15, 8, 8);
      var flameMat = new THREE.MeshBasicMaterial({ color: 0xff8844 });
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 1.7, 0);
      pillar.add(flame);
    }

    // Center crystal/statue
    var crystalGeo = new THREE.OctahedronGeometry(0.8, 0);
    var crystalMat = new THREE.MeshStandardMaterial({
      color: 0x4dc9f6,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x113355,
      emissiveIntensity: 0.6,
    });
    var crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 1.5;
    crystal.castShadow = true;
    this.scene.add(crystal);
    this.structures.push({ mesh: crystal, type: 'crystal' });

    // Floating particles around crystal
    for (let i = 0; i < 20; i++) {
      var pGeo = new THREE.SphereGeometry(0.05, 4, 4);
      var pMat = new THREE.MeshBasicMaterial({ color: 0x88ccff });
      var p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 3,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * 3
      );
      p.userData = {
        baseY: p.position.y,
        speed: 0.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        radius: 0.5 + Math.random() * 1.5,
        angle: Math.random() * Math.PI * 2,
      };
      this.scene.add(p);
      this.decorations.push(p);
    }
  }

  _createPlatformSection() {
    // Series of floating platforms for parkour
    const platformData = [
      { x: 15, y: 2, z: -5, w: 3, h: 0.3, d: 3 },
      { x: 19, y: 3.5, z: -5, w: 2.5, h: 0.3, d: 2.5 },
      { x: 23, y: 5, z: -5, w: 2, h: 0.3, d: 2 },
      { x: 27, y: 6.5, z: -3, w: 2, h: 0.3, d: 2 },
      { x: 31, y: 8, z: -1, w: 2.5, h: 0.3, d: 2.5 },
      { x: 34, y: 9.5, z: 1, w: 3, h: 0.3, d: 3 },
      { x: 36, y: 11, z: 3, w: 4, h: 0.3, d: 4 },
      // Descent platforms
      { x: 32, y: 8, z: 8, w: 2.5, h: 0.3, d: 2.5 },
      { x: 28, y: 5, z: 10, w: 2, h: 0.3, d: 2 },
      { x: 24, y: 2.5, z: 10, w: 3, h: 0.3, d: 3 },
    ];

    platformData.forEach((p, i) => {
      var platGeo = new THREE.BoxGeometry(p.w, p.h, p.d);
      var platMat = new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0x4a5a6a : i % 3 === 1 ? 0x5a4a5a : 0x4a6a5a,
        roughness: 0.4,
        metalness: 0.5,
      });
      var plat = new THREE.Mesh(platGeo, platMat);
      plat.position.set(p.x, p.y, p.z);
      plat.castShadow = true;
      plat.receiveShadow = true;
      plat.userData = { type: 'platform', index: i };
      this.scene.add(plat);
      this.collisionObjects.push(plat);
      this.platforms.push(plat);

      // Glowing edge highlight
      var edgeGeo = new THREE.EdgesGeometry(platGeo);
      var edgeLine = new THREE.LineSegments(
        edgeGeo,
        new THREE.LineBasicMaterial({ color: 0x4dc9f6, transparent: true, opacity: 0.3 })
      );
      plat.add(edgeLine);
    });
  }

  _createWalkways() {
    // Elevated bridge/walkway
    for (let i = 0; i < 6; i++) {
      var segGeo = new THREE.BoxGeometry(3, 0.25, 8);
      var segMat = new THREE.MeshStandardMaterial({
        color: 0x5a4a3a,
        roughness: 0.6,
        metalness: 0.3,
      });
      var seg = new THREE.Mesh(segGeo, segMat);
      seg.position.set(-15 + i * 6, 2.5, 15);
      seg.castShadow = true;
      seg.receiveShadow = true;
      this.scene.add(seg);
      this.collisionObjects.push(seg);
      this.structures.push({ mesh: seg, type: 'walkway' });

      // Support pillars
      var supGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.5, 8);
      var supMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, roughness: 0.5 });
      var supL = new THREE.Mesh(supGeo, supMat);
      supL.position.set(-15 + i * 6, 1.2, 12);
      this.scene.add(supL);
      this.collisionObjects.push(supL);
      var supR = new THREE.Mesh(supGeo, supMat);
      supR.position.set(-15 + i * 6, 1.2, 18);
      this.scene.add(supR);
      this.collisionObjects.push(supR);
    }
  }

  _createPillars() {
    const positions = [
      [-25, 0, -15], [25, 0, -15], [-25, 0, 15], [25, 0, 15],
      [-35, 0, 0], [35, 0, 0], [0, 0, -25], [0, 0, 25],
    ];

    positions.forEach(([x, _, z]) => {
      var pillarGeo = new THREE.CylinderGeometry(0.6, 0.8, 6, 8);
      var pillarMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a4e,
        roughness: 0.3,
        metalness: 0.7,
      });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, 2.8, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
      this.collisionObjects.push(pillar);
      this.structures.push({ mesh: pillar, type: 'pillar' });

      // Top light
      var topGeo = new THREE.SphereGeometry(0.2, 8, 8);
      var topMat = new THREE.MeshBasicMaterial({ color: 0xaaccff });
      var top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 3.2;
      pillar.add(top);
    });
  }

  _createBoundaries() {
    // Invisible walls (collision only)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.7,
      transparent: true,
      opacity: 0.5,
    });
    const boundaries = [
      { x: 0, y: 3, z: -50, w: 100, h: 6, d: 0.5 },
      { x: 0, y: 3, z: 50, w: 100, h: 6, d: 0.5 },
      { x: -50, y: 3, z: 0, w: 0.5, h: 6, d: 100 },
      { x: 50, y: 3, z: 0, w: 0.5, h: 6, d: 100 },
    ];

    boundaries.forEach(b => {
      var wallGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(b.x, b.y, b.z);
      this.scene.add(wall);
      this.collisionObjects.push(wall);
      this.walls.push(wall);
    });
  }

  _createDecorations() {
    // Scattered ruins/debris
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      // Skip central arena
      if (Math.sqrt(x*x + z*z) < 14) continue;

      const size = 0.2 + Math.random() * 0.8;
      var debrisGeo = Math.random() > 0.5
        ? new THREE.BoxGeometry(size, size * 0.5, size * 0.7)
        : new THREE.CylinderGeometry(size * 0.3, size * 0.4, size, 6);
      var debrisMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.65 + Math.random() * 0.1, 0.1, 0.2 + Math.random() * 0.2),
        roughness: 0.7,
      });
      var debris = new THREE.Mesh(debrisGeo, debrisMat);
      debris.position.set(x, size * 0.2, z);
      debris.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
      debris.receiveShadow = true;
      this.scene.add(debris);
      this.decorations.push(debris);
    }

    // Floating crystal shards (atmosphere)
    for (let i = 0; i < 15; i++) {
      var shardGeo = new THREE.OctahedronGeometry(0.3 + Math.random() * 0.5, 0);
      var shardMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.3),
        roughness: 0.2,
        metalness: 0.8,
        emissive: new THREE.Color().setHSL(0.6, 0.8, 0.2),
        emissiveIntensity: 0.4,
      });
      var shard = new THREE.Mesh(shardGeo, shardMat);
      shard.position.set(
        (Math.random() - 0.5) * 60,
        2 + Math.random() * 10,
        (Math.random() - 0.5) * 60
      );
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      shard.userData = {
        baseY: shard.position.y,
        floatSpeed: 0.3 + Math.random() * 1,
        floatAmp: 0.3 + Math.random() * 1.5,
        rotSpeed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      };
      this.scene.add(shard);
      this.decorations.push(shard);
    }
  }

  update(dt) {
    const t = performance.now() * 0.001;

    // Animate floating decorations
    this.decorations.forEach(d => {
      if (d.userData.floatSpeed !== undefined) {
        d.position.y = d.userData.baseY + Math.sin(t * d.userData.floatSpeed + d.userData.phase) * d.userData.floatAmp;
        d.rotation.y += d.userData.rotSpeed * dt;
      }
      if (d.userData.angle !== undefined) {
        // Crystal particles
        d.userData.angle += d.userData.speed * dt;
        d.position.x = Math.cos(d.userData.angle) * d.userData.radius;
        d.position.z = Math.sin(d.userData.angle) * d.userData.radius;
        d.position.y = d.userData.baseY + Math.sin(t * d.userData.speed + d.userData.phase) * 0.5;
      }
    });
  }

  getGroundHeight(x, z) {
    // Simple ground height lookup — base ground at y=0
    let h = 0;

    // Check platforms
    for (const plat of this.platforms) {
      const px = plat.position.x, pz = plat.position.z;
      const hw = plat.geometry.parameters.width / 2;
      const hd = plat.geometry.parameters.depth / 2;
      if (Math.abs(x - px) < hw + 0.3 && Math.abs(z - pz) < hd + 0.3) {
        const top = plat.position.y + plat.geometry.parameters.height / 2;
        if (top > h && Math.abs(top - h) < 5) h = top;
      }
    }

    // Check structures that are walkable
    for (const s of this.structures) {
      if (s.type === 'arena') {
        const dx = x - s.mesh.position.x;
        const dz = z - s.mesh.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < 12) {
          const top = s.mesh.position.y + 0.2;
          if (top > h) h = top;
        }
      }
    }

    return h;
  }

  isWalkable(x, z) {
    // Check if position is within bounds and not inside a wall
    if (Math.abs(x) > 48 || Math.abs(z) > 48) return false;
    return true;
  }
}

export { World };
