import * as THREE from 'three';
import { InteractableTarget } from './sceneTypes';
import { ProceduralTextureBundle } from './textures';
import { BoxCollider, groundHeightAt } from './worldMath';

export interface PropsBuildResult {
  group: THREE.Group;
  boxColliders: BoxCollider[];
  interactables: InteractableTarget[];
  update: (dt: number, shedUnlocked: boolean) => void;
  dispose: () => void;
}

export function buildPerimeterAndProps(textures: ProceduralTextureBundle): PropsBuildResult {
  const group = new THREE.Group();
  group.name = 'playground-perimeter-props';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const boxColliders: BoxCollider[] = [];
  const interactables: InteractableTarget[] = [];

  const fenceMetalMat = new THREE.MeshStandardMaterial({
    map: textures.rustedMetalAlbedo,
    roughness: 0.72,
    metalness: 0.72,
  });
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0x6b7278,
    alphaMap: textures.chainLinkAlpha,
    transparent: true,
    alphaTest: 0.25,
    side: THREE.DoubleSide,
    roughness: 0.6,
    metalness: 0.8,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    bumpMap: textures.woodBump,
    bumpScale: 0.03,
    roughness: 0.88,
    metalness: 0.04,
  });
  const concreteMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    bumpMap: textures.concreteBump,
    bumpScale: 0.03,
    roughness: 0.86,
    metalness: 0.04,
  });
  const shedWallMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    color: 0x5c6163,
    roughness: 0.9,
    metalness: 0.05,
  });
  const shedRoofMat = new THREE.MeshStandardMaterial({
    map: textures.rustedMetalAlbedo,
    color: 0x61443a,
    roughness: 0.75,
    metalness: 0.65,
  });
  materials.push(fenceMetalMat, wireMat, woodMat, concreteMat, shedWallMat, shedRoofMat);

  // =========================================================================
  // 1. BROKEN CHAIN-LINK PERIMETER FENCE (With gated breaches for Story Areas)
  // =========================================================================
  const postGeo = new THREE.CylinderGeometry(0.036, 0.04, 2.05, 8);
  const topRailGeo = new THREE.CylinderGeometry(0.025, 0.025, 3.6, 8);
  topRailGeo.rotateZ(Math.PI / 2);
  const wirePanelGeo = new THREE.PlaneGeometry(3.6, 1.85);
  geometries.push(postGeo, topRailGeo, wirePanelGeo);

  const addFenceSpan = (x1: number, z1: number, x2: number, z2: number, brokenIndex = -1) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const totalLen = Math.hypot(dx, dz);
    const segments = Math.max(1, Math.round(totalLen / 3.6));
    const yaw = Math.atan2(-dz, dx);

    for (let s = 0; s < segments; s++) {
      const t0 = s / segments;
      const t1 = (s + 1) / segments;
      const mx = x1 + dx * ((t0 + t1) * 0.5);
      const mz = z1 + dz * ((t0 + t1) * 0.5);
      const gy = groundHeightAt(mx, mz);

      const postX = x1 + dx * t0;
      const postZ = z1 + dz * t0;
      const post = new THREE.Mesh(postGeo, fenceMetalMat);
      post.position.set(postX, groundHeightAt(postX, postZ) + 0.95, postZ);
      if (s === brokenIndex) post.rotation.z = 0.24;
      post.castShadow = true;
      group.add(post);

      if (s !== brokenIndex) {
        const panelGroup = new THREE.Group();
        panelGroup.position.set(mx, gy + 0.96, mz);
        panelGroup.rotation.y = yaw;
        panelGroup.scale.x = (totalLen / segments) / 3.6;

        const wire = new THREE.Mesh(wirePanelGeo, wireMat);
        panelGroup.add(wire);

        const rail = new THREE.Mesh(topRailGeo, fenceMetalMat);
        rail.position.y = 0.92;
        panelGroup.add(rail);

        group.add(panelGroup);
      }
    }
    const endPost = new THREE.Mesh(postGeo, fenceMetalMat);
    endPost.position.set(x2, groundHeightAt(x2, z2) + 0.95, z2);
    group.add(endPost);
  };

  // North fence (leaves Forest Gate at x in [-2.4, 2.4] and Drainage Mouth at [6.2, 10.8] open)
  addFenceSpan(-19.5, -19.5, -2.5, -19.5, -1);
  addFenceSpan(2.5, -19.5, 6.2, -19.5, -1);
  addFenceSpan(10.8, -19.5, 19.5, -19.5, -1);

  // West fence (leaves Caretaker's House breach open at z in [-4.6, 0.6])
  addFenceSpan(-19.5, -19.5, -19.5, -4.6, -1);
  addFenceSpan(-19.5, 0.6, -19.5, 19.5, -1);

  // East & South fences
  addFenceSpan(19.5, -19.5, 19.5, 19.5, 3);
  addFenceSpan(-19.5, 19.5, -2.6, 19.5, -1);
  addFenceSpan(2.6, 19.5, 19.5, 19.5, -1);

  // Physical fence colliders matching the openings cleanly
  boxColliders.push(
    { id: 'fence-north-w', minX: -19.8, maxX: -2.4, minZ: -19.75, maxZ: -19.25 },
    { id: 'fence-north-mid', minX: 2.4, maxX: 6.2, minZ: -19.75, maxZ: -19.25 },
    { id: 'fence-north-e', minX: 10.8, maxX: 19.8, minZ: -19.75, maxZ: -19.25 },
    { id: 'fence-west-n', minX: -19.75, maxX: -19.25, minZ: -19.5, maxZ: -4.6 },
    { id: 'fence-west-s', minX: -19.75, maxX: -19.25, minZ: 0.6, maxZ: 19.5 },
    { id: 'fence-east', minX: 19.25, maxX: 19.75, minZ: -19.5, maxZ: 19.5 },
    { id: 'fence-south-w', minX: -19.8, maxX: -2.6, minZ: 19.25, maxZ: 19.75 },
    { id: 'fence-south-e', minX: 2.6, maxX: 19.8, minZ: 19.25, maxZ: 19.75 },
  );

  // =========================================================================
  // 2. MISSING-CHILD POSTER (1994 Jimmy Mercer)
  // =========================================================================
  const boardGroup = new THREE.Group();
  const bx = -2.75;
  const bz = 4.9;
  boardGroup.position.set(bx, groundHeightAt(bx, bz), bz);
  boardGroup.rotation.y = 0.48;
  group.add(boardGroup);

  const signPostGeo = new THREE.BoxGeometry(0.11, 1.85, 0.11);
  const backingGeo = new THREE.BoxGeometry(0.72, 0.88, 0.05);
  const posterGeo = new THREE.PlaneGeometry(0.56, 0.72);
  geometries.push(signPostGeo, backingGeo, posterGeo);

  const signPost = new THREE.Mesh(signPostGeo, woodMat);
  signPost.position.y = 0.9;
  signPost.castShadow = true;
  boardGroup.add(signPost);

  const backing = new THREE.Mesh(backingGeo, woodMat);
  backing.position.set(0, 1.42, 0.04);
  backing.castShadow = true;
  boardGroup.add(backing);

  const posterMat = new THREE.MeshStandardMaterial({
    map: textures.posterTexture,
    roughness: 0.85,
    metalness: 0.02,
  });
  materials.push(posterMat);

  const poster = new THREE.Mesh(posterGeo, posterMat);
  poster.position.set(0, 1.42, 0.07);
  boardGroup.add(poster);

  interactables.push({
    id: 'missing-poster-board',
    evidenceId: 'ev-jimmy-poster',
    keyLabel: 'E',
    verb: 'READ',
    label: '1994 MISSING POSTER: JIMMY MERCER',
    detail: 'Last seen Nov 12, 1994 · Tape weathered',
    worldPosition: new THREE.Vector3(bx, groundHeightAt(bx, bz) + 1.42, bz),
    maxDistance: 4.2,
    raycastMeshes: [poster, backing],
  });

  // =========================================================================
  // 3. OLD WOODEN PARK BENCHES (East & West of South entry walkway)
  // =========================================================================
  const buildBench = (x: number, z: number, rotY: number, idx: number) => {
    const bench = new THREE.Group();
    bench.position.set(x, groundHeightAt(x, z), z);
    bench.rotation.y = rotY;

    const legGeo = new THREE.BoxGeometry(0.08, 0.48, 0.56);
    const backPostGeo = new THREE.BoxGeometry(0.07, 0.52, 0.07);
    const slatGeo = new THREE.BoxGeometry(1.75, 0.045, 0.13);
    geometries.push(legGeo, backPostGeo, slatGeo);

    for (const lx of [-0.72, 0.72]) {
      const leg = new THREE.Mesh(legGeo, fenceMetalMat);
      leg.position.set(lx, 0.24, 0);
      leg.castShadow = true;
      bench.add(leg);

      const bPost = new THREE.Mesh(backPostGeo, fenceMetalMat);
      bPost.position.set(lx, 0.7, -0.24);
      bPost.rotation.x = -0.18;
      bench.add(bPost);
    }

    for (let s = 0; s < 3; s++) {
      const seatSlat = new THREE.Mesh(slatGeo, woodMat);
      seatSlat.position.set(0, 0.48, -0.16 + s * 0.16);
      seatSlat.castShadow = true;
      seatSlat.receiveShadow = true;
      bench.add(seatSlat);
    }
    for (let s = 0; s < 2; s++) {
      const backSlat = new THREE.Mesh(slatGeo, woodMat);
      backSlat.position.set(0, 0.68 + s * 0.18, -0.26 - s * 0.03);
      backSlat.rotation.x = -0.18;
      backSlat.castShadow = true;
      bench.add(backSlat);
    }

    group.add(bench);
    boxColliders.push({
      id: `bench-${idx}`,
      minX: x - 0.95,
      maxX: x + 0.95,
      minZ: z - 0.55,
      maxZ: z + 0.55,
    });
  };

  buildBench(3.4, 9.5, -Math.PI * 0.35, 1);
  buildBench(-4.8, 7.6, Math.PI * 0.22, 2);

  // =========================================================================
  // 4. ENTERABLE MAINTENANCE SHED (Northeast perimeter: x: 14.5, z: -15.5)
  // =========================================================================
  const shedGroup = new THREE.Group();
  const shX = 14.5;
  const shZ = -15.5;
  const shY = groundHeightAt(shX, shZ);
  shedGroup.position.set(shX, shY, shZ);
  shedGroup.rotation.y = -0.62;
  group.add(shedGroup);

  const slabGeo = new THREE.BoxGeometry(4.4, 0.16, 3.6);
  const wallBackGeo = new THREE.BoxGeometry(4.0, 2.6, 0.18);
  const wallSideGeo = new THREE.BoxGeometry(0.18, 2.6, 3.2);
  const frontPierGeo = new THREE.BoxGeometry(1.3, 2.6, 0.18);
  const headerGeo = new THREE.BoxGeometry(1.4, 0.5, 0.18);
  const roofSlopeGeo = new THREE.BoxGeometry(4.6, 0.1, 2.15);
  const doorGeo = new THREE.BoxGeometry(1.22, 2.1, 0.08);
  const benchTopGeo = new THREE.BoxGeometry(2.3, 0.82, 0.72);
  const tinGeo = new THREE.BoxGeometry(0.28, 0.07, 0.22);
  const photoBoardGeo = new THREE.PlaneGeometry(0.68, 0.68);
  geometries.push(
    slabGeo,
    wallBackGeo,
    wallSideGeo,
    frontPierGeo,
    headerGeo,
    roofSlopeGeo,
    doorGeo,
    benchTopGeo,
    tinGeo,
    photoBoardGeo,
  );

  const tapeTinMat = new THREE.MeshStandardMaterial({
    color: 0xd4a428,
    roughness: 0.45,
    metalness: 0.2,
    emissive: 0x3b2a04,
    emissiveIntensity: 0.45,
  });
  const photoPinMat = new THREE.MeshStandardMaterial({
    map: textures.surveillancePhotoTexture,
    roughness: 0.72,
    metalness: 0.04,
  });
  materials.push(tapeTinMat, photoPinMat);

  const slab = new THREE.Mesh(slabGeo, concreteMat);
  slab.position.y = 0.06;
  slab.receiveShadow = true;
  shedGroup.add(slab);

  const backWall = new THREE.Mesh(wallBackGeo, shedWallMat);
  backWall.position.set(0, 1.4, -1.55);
  backWall.castShadow = true;
  shedGroup.add(backWall);

  const leftWall = new THREE.Mesh(wallSideGeo, shedWallMat);
  leftWall.position.set(-1.95, 1.4, 0);
  leftWall.castShadow = true;
  shedGroup.add(leftWall);

  const rightWall = new THREE.Mesh(wallSideGeo, shedWallMat);
  rightWall.position.set(1.95, 1.4, 0);
  rightWall.castShadow = true;
  shedGroup.add(rightWall);

  const frontLeft = new THREE.Mesh(frontPierGeo, shedWallMat);
  frontLeft.position.set(-1.35, 1.4, 1.55);
  const frontRight = new THREE.Mesh(frontPierGeo, shedWallMat);
  frontRight.position.set(1.35, 1.4, 1.55);
  const frontHeader = new THREE.Mesh(headerGeo, shedWallMat);
  frontHeader.position.set(0, 2.45, 1.55);
  shedGroup.add(frontLeft, frontRight, frontHeader);

  // Hinged metal maintenance door (swings open when Maintenance Shed unlocks)
  const shedDoorPivot = new THREE.Group();
  shedDoorPivot.position.set(-0.62, 1.15, 1.55);
  shedGroup.add(shedDoorPivot);
  const door = new THREE.Mesh(doorGeo, shedRoofMat);
  door.position.set(0.62, 0, 0);
  door.castShadow = true;
  shedDoorPivot.add(door);

  // Interior Workbench & 1996 Julian Evidence Exhibits
  const workbench = new THREE.Mesh(benchTopGeo, woodMat);
  workbench.position.set(0, 0.48, -0.92);
  workbench.castShadow = true;
  shedGroup.add(workbench);

  const tapeTin = new THREE.Mesh(tinGeo, tapeTinMat);
  tapeTin.position.set(-0.35, 0.93, -0.85);
  tapeTin.rotation.y = 0.25;
  shedGroup.add(tapeTin);

  const survPhoto = new THREE.Mesh(photoBoardGeo, photoPinMat);
  survPhoto.position.set(0.55, 1.52, -1.42);
  shedGroup.add(survPhoto);

  // Gable roof slopes
  const roofFront = new THREE.Mesh(roofSlopeGeo, shedRoofMat);
  roofFront.position.set(0, 3.05, 0.92);
  roofFront.rotation.x = 0.32;
  roofFront.castShadow = true;
  const roofBack = new THREE.Mesh(roofSlopeGeo, shedRoofMat);
  roofBack.position.set(0, 3.05, -0.92);
  roofBack.rotation.x = -0.32;
  roofBack.castShadow = true;
  shedGroup.add(roofFront, roofBack);

  shedGroup.updateMatrixWorld(true);
  const tape01WorldPos = new THREE.Vector3(-0.35, 1.0, -0.85).applyMatrix4(shedGroup.matrixWorld);
  const photoWorldPos = new THREE.Vector3(0.55, 1.52, -1.38).applyMatrix4(shedGroup.matrixWorld);
  const doorWorldPos = new THREE.Vector3(0, 1.15, 1.65).applyMatrix4(shedGroup.matrixWorld);

  // Shed wall colliders (leave front doorway open so unlocked players can step inside)
  const shedDoorCollider: BoxCollider = {
    id: 'maintenance-shed-door',
    minX: shX - 2.35,
    maxX: shX + 2.35,
    minZ: shZ - 2.05,
    maxZ: shZ + 2.05,
    disabled: false,
  };
  boxColliders.push(
    shedDoorCollider,
    { id: 'shed-back-block', minX: shX - 0.5, maxX: shX + 2.6, minZ: shZ - 2.2, maxZ: shZ - 1.15 },
    { id: 'shed-east-block', minX: shX + 1.5, maxX: shX + 2.6, minZ: shZ - 1.5, maxZ: shZ + 1.4 },
  );

  interactables.push(
    {
      id: 'shed-door-latch',
      keyLabel: 'E',
      verb: 'INSPECT',
      label: 'MAINTENANCE SHED LATCH',
      detail: 'Rusted padlock // Inspect a playground clue first',
      worldPosition: doorWorldPos,
      maxDistance: 3.4,
      raycastMeshes: [door],
    },
    {
      id: 'shed-julian-tape-01',
      evidenceId: 'ev-julian-tape-01',
      keyLabel: 'E',
      verb: 'COLLECT',
      label: "JULIAN'S FIELD CASSETTES (REELS 01 & 02)",
      detail: '1996 Tin // Maintenance workbench',
      worldPosition: tape01WorldPos,
      maxDistance: 3.8,
      raycastMeshes: [tapeTin, workbench],
    },
    {
      id: 'shed-surveillance-photo',
      evidenceId: 'ev-surveillance-photo',
      keyLabel: 'E',
      verb: 'EXAMINE',
      label: '1994 / 1996 TREELINE SURVEILLANCE PHOTO',
      detail: 'Pinned above workbench // 19 days after',
      worldPosition: photoWorldPos,
      maxDistance: 4.0,
      raycastMeshes: [survPhoto],
    },
  );

  // =========================================================================
  // 5. BROKEN YELLOW DUCK TOY NEAR SWINGS (1994 Exhibit)
  // =========================================================================
  const brokenDuckMat = new THREE.MeshStandardMaterial({
    color: 0x9b7f24,
    roughness: 0.65,
    metalness: 0.05,
  });
  materials.push(brokenDuckMat);

  const brokenToyGroup = new THREE.Group();
  const btx = -1.75;
  const btz = -0.65;
  brokenToyGroup.position.set(btx, groundHeightAt(btx, btz) + 0.07, btz);
  brokenToyGroup.rotation.set(0.35, 1.1, 1.35);
  group.add(brokenToyGroup);

  const toyBodyGeo = new THREE.SphereGeometry(0.11, 10, 10);
  toyBodyGeo.scale(1, 0.85, 1.25);
  const toyWingGeo = new THREE.BoxGeometry(0.04, 0.08, 0.12);
  geometries.push(toyBodyGeo, toyWingGeo);

  const toyBody = new THREE.Mesh(toyBodyGeo, brokenDuckMat);
  const toyWing = new THREE.Mesh(toyWingGeo, brokenDuckMat);
  toyWing.position.set(0.09, 0.02, 0);
  brokenToyGroup.add(toyBody, toyWing);

  interactables.push({
    id: 'broken-duck-toy',
    evidenceId: 'ev-broken-duck',
    keyLabel: 'E',
    verb: 'INSPECT',
    label: '1994 BROKEN YELLOW DUCK TOY',
    detail: 'Hollow shell left half-buried in swing mulch',
    worldPosition: new THREE.Vector3(btx, groundHeightAt(btx, btz) + 0.12, btz),
    maxDistance: 3.4,
    raycastMeshes: [toyBody, toyWing],
  });

  let doorOpenAmount = 0;

  return {
    group,
    boxColliders,
    interactables,
    update: (dt: number, shedUnlocked: boolean) => {
      shedDoorCollider.disabled = shedUnlocked;
      const targetAngle = shedUnlocked ? 1.55 : 0.16;
      doorOpenAmount += (targetAngle - doorOpenAmount) * Math.min(1, dt * 4.5);
      shedDoorPivot.rotation.y = doorOpenAmount;
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
