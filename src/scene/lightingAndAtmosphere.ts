import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ProceduralTextureBundle } from './textures';
import { groundHeightAt } from './worldMath';

export interface AtmosphereResult {
  group: THREE.Group;
  flashlight: THREE.SpotLight;
  flashlightTarget: THREE.Object3D;
  update: (dt: number, elapsedTime: number, flashlightOn: boolean, reducedMotion: boolean) => void;
  dispose: () => void;
}

export function buildLightingAndAtmosphere(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  textures: ProceduralTextureBundle,
  isSoftwareGl: boolean,
): AtmosphereResult {
  const group = new THREE.Group();
  group.name = 'lighting-and-atmosphere';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Horizon-matched deep midnight fog so distant treeline dissolves ominously
  const fogColor = new THREE.Color(0x070a0e);
  scene.background = fogColor;
  scene.fog = new THREE.FogExp2(0x070a0e, 0.041);

  // Subtle Image-Based Environment Lighting (kept low so night chiaroscuro holds)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.26;
  pmrem.dispose();

  // 1. Cool 3:47 AM Moonlight Key + Hemisphere Sky/Mud Fill
  const hemiLight = new THREE.HemisphereLight(0x3a4e6b, 0x101310, 0.56);
  group.add(hemiLight);

  const moonKey = new THREE.DirectionalLight(0x88a8d0, 0.95);
  moonKey.position.set(16, 26, 12);
  if (!isSoftwareGl) {
    moonKey.castShadow = true;
    moonKey.shadow.mapSize.set(1024, 1024);
    moonKey.shadow.camera.near = 2;
    moonKey.shadow.camera.far = 65;
    moonKey.shadow.camera.left = -24;
    moonKey.shadow.camera.right = 24;
    moonKey.shadow.camera.top = 24;
    moonKey.shadow.camera.bottom = -24;
    moonKey.shadow.bias = -0.0005;
    moonKey.shadow.normalBias = 0.025;
  }
  group.add(moonKey);

  // Soft hazy moon glow diffused behind overcast clouds (no hard circle edge)
  const moonGlowMat = new THREE.SpriteMaterial({
    map: textures.mistTexture,
    color: 0xaac2dc,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    fog: false,
  });
  materials.push(moonGlowMat);
  const moonGlow = new THREE.Sprite(moonGlowMat);
  moonGlow.position.set(22, 29, -46);
  moonGlow.scale.set(13, 13, 1);
  group.add(moonGlow);

  // 2. Iconic Tall Sodium-Vapor Streetlight Pole (Stitch focal beacon behind swing/slide)
  const lampX = -1.2;
  const lampZ = -8.6;
  const lampGroundY = groundHeightAt(lampX, lampZ);

  const poleMat = new THREE.MeshStandardMaterial({
    map: textures.rustedMetalAlbedo,
    roughness: 0.72,
    metalness: 0.72,
  });
  const bulbMat = new THREE.MeshBasicMaterial({
    color: 0xffb85c,
    fog: false,
  });
  const haloMat = new THREE.SpriteMaterial({
    map: textures.mistTexture,
    color: 0xff9a38,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lowHazeMat = new THREE.SpriteMaterial({
    map: textures.mistTexture,
    color: 0xff9333,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  materials.push(poleMat, bulbMat, haloMat, lowHazeMat);

  const poleGeo = new THREE.CylinderGeometry(0.065, 0.11, 6.8, 10);
  const armGeo = new THREE.CylinderGeometry(0.04, 0.048, 1.35, 8);
  armGeo.rotateX(Math.PI / 2);
  const hoodGeo = new THREE.CylinderGeometry(0.14, 0.28, 0.16, 10);
  const bulbGeo = new THREE.SphereGeometry(0.12, 12, 10);
  geometries.push(poleGeo, armGeo, hoodGeo, bulbGeo);

  const poleGroup = new THREE.Group();
  poleGroup.position.set(lampX, lampGroundY, lampZ);
  group.add(poleGroup);

  const poleMesh = new THREE.Mesh(poleGeo, poleMat);
  poleMesh.position.y = 3.4;
  poleMesh.castShadow = true;
  poleGroup.add(poleMesh);

  const armMesh = new THREE.Mesh(armGeo, poleMat);
  armMesh.position.set(0, 6.72, 0.55);
  armMesh.rotation.x = -0.18;
  poleGroup.add(armMesh);

  const hoodMesh = new THREE.Mesh(hoodGeo, poleMat);
  hoodMesh.position.set(0, 6.8, 1.15);
  poleGroup.add(hoodMesh);

  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
  bulbMesh.position.set(0, 6.68, 1.15);
  poleGroup.add(bulbMesh);

  const sodiumHalo = new THREE.Sprite(haloMat);
  sodiumHalo.position.set(0, 6.68, 1.15);
  sodiumHalo.scale.set(4.8, 4.8, 1);
  poleGroup.add(sodiumHalo);

  const sodiumBloom = new THREE.Sprite(lowHazeMat);
  sodiumBloom.position.set(0, 4.4, 1.15);
  sodiumBloom.scale.set(8.5, 7.2, 1);
  poleGroup.add(sodiumBloom);

  const sodiumLight = new THREE.PointLight(0xff9636, 36, 34, 1.42);
  sodiumLight.position.set(lampX, lampGroundY + 6.5, lampZ + 1.15);
  group.add(sodiumLight);

  // 3. Faint Distant Bulkhead Light over Maintenance Shed Doorway
  const shedBulbLight = new THREE.PointLight(0xff7f2a, 6.5, 13, 1.7);
  shedBulbLight.position.set(13.2, groundHeightAt(13.2, -13.8) + 2.45, -13.8);
  group.add(shedBulbLight);

  // 4. Camera-Mounted Player Flashlight SpotLight
  const flashlight = new THREE.SpotLight(0xfff5e6, 28, 28, Math.PI / 6.0, 0.65, 1.3);
  flashlight.position.set(0.14, -0.08, 0.05);
  const flashlightTarget = new THREE.Object3D();
  flashlightTarget.position.set(0, -0.04, -5);
  camera.add(flashlight);
  camera.add(flashlightTarget);
  flashlight.target = flashlightTarget;

  // 5. Low Drifting Ground Mist Layers (Soft translucent ribbons hugging terrain)
  const mistGeo = new THREE.PlaneGeometry(12, 12);
  mistGeo.rotateX(-Math.PI / 2);
  geometries.push(mistGeo);

  const mistMat = new THREE.MeshBasicMaterial({
    map: textures.mistTexture,
    color: 0x7c90a4,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  materials.push(mistMat);

  const mistSpots: Array<{ mesh: THREE.Mesh; baseX: number; baseZ: number; phase: number }> = [];
  const mistPositions = [
    [-3.5, -3.0],
    [2.5, 0.5],
    [8.2, -4.6],
    [-8.5, -7.2],
    [0.5, 8.2],
  ];
  mistPositions.forEach(([mx, mz], idx) => {
    const m = new THREE.Mesh(mistGeo, mistMat);
    m.position.set(mx, groundHeightAt(mx, mz) + 0.16, mz);
    group.add(m);
    mistSpots.push({ mesh: m, baseX: mx, baseZ: mz, phase: idx * 1.4 });
  });

  // 6. Pre-Allocated Zero-GC Diagonal Night Rain Streaks (cinematic 3:47 AM drizzle)
  const streakCount = 180;
  const streakPositions = new Float32Array(streakCount * 6);
  for (let i = 0; i < streakCount; i++) {
    const rx = (Math.random() - 0.5) * 28;
    const ry = Math.random() * 10;
    const rz = (Math.random() - 0.5) * 28;
    const base = i * 6;
    streakPositions[base] = rx;
    streakPositions[base + 1] = ry;
    streakPositions[base + 2] = rz;
    streakPositions[base + 3] = rx - 0.06;
    streakPositions[base + 4] = ry - 0.36;
    streakPositions[base + 5] = rz - 0.02;
  }
  const rainGeo = new THREE.BufferGeometry();
  const rainPosAttr = new THREE.BufferAttribute(streakPositions, 3);
  rainGeo.setAttribute('position', rainPosAttr);
  geometries.push(rainGeo);

  const rainMat = new THREE.LineBasicMaterial({
    color: 0x9eb2c6,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  materials.push(rainMat);

  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  group.add(rainLines);

  return {
    group,
    flashlight,
    flashlightTarget,
    update: (dt: number, elapsedTime: number, flashlightOn: boolean, reducedMotion: boolean) => {
      flashlight.intensity = flashlightOn ? 28 : 0;

      // Subtle authentic 03:47 AM sodium ballast flicker
      const flickerWave =
        Math.sin(elapsedTime * 19.3) * Math.sin(elapsedTime * 7.1) > 0.86 ? 0.56 : 1.0;
      const pulse = 0.94 + Math.sin(elapsedTime * 2.2) * 0.06;
      const factor = reducedMotion ? 1.0 : flickerWave * pulse;
      sodiumLight.intensity = 36 * factor;
      haloMat.opacity = 0.62 * factor;
      lowHazeMat.opacity = 0.24 * factor;

      if (!reducedMotion) {
        for (let i = 0; i < mistSpots.length; i++) {
          const ms = mistSpots[i];
          ms.mesh.position.x = ms.baseX + Math.sin(elapsedTime * 0.18 + ms.phase) * 0.85;
          ms.mesh.position.z = ms.baseZ + Math.cos(elapsedTime * 0.14 + ms.phase) * 0.7;
        }

        const arr = rainPosAttr.array as Float32Array;
        const dropY = 8.4 * dt;
        const dropX = 0.9 * dt;
        for (let i = 0; i < streakCount; i++) {
          const base = i * 6;
          arr[base] += dropX;
          arr[base + 1] -= dropY;
          arr[base + 3] += dropX;
          arr[base + 4] -= dropY;
          if (arr[base + 1] < 0.1) {
            const nx = ((i * 61) % 28) - 14;
            const ny = 8.5 + (i % 4) * 0.6;
            const nz = ((i * 97) % 28) - 14;
            arr[base] = nx;
            arr[base + 1] = ny;
            arr[base + 2] = nz;
            arr[base + 3] = nx - 0.06;
            arr[base + 4] = ny - 0.36;
            arr[base + 5] = nz - 0.02;
          }
        }
        rainPosAttr.needsUpdate = true;
      }
    },
    dispose: () => {
      camera.remove(flashlight);
      camera.remove(flashlightTarget);
      envTex.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
