import * as THREE from 'three';
import { InteractableTarget } from '../sceneTypes';
import { ProceduralTextureBundle } from '../textures';
import { BoxCollider, CircleCollider, groundHeightAt } from '../worldMath';

export interface ExpandedAreasBuildResult {
  group: THREE.Group;
  circleColliders: CircleCollider[];
  boxColliders: BoxCollider[];
  interactables: InteractableTarget[];
  update: (dt: number, elapsedTime: number, forestGateUnlocked: boolean) => void;
  dispose: () => void;
}

export function buildExpandedAreas(textures: ProceduralTextureBundle): ExpandedAreasBuildResult {
  const group = new THREE.Group();
  group.name = 'expanded-story-areas';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const circleColliders: CircleCollider[] = [];
  const boxColliders: BoxCollider[] = [];
  const interactables: InteractableTarget[] = [];

  const concreteMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    bumpMap: textures.concreteBump,
    bumpScale: 0.04,
    color: 0x6f7579,
    roughness: 0.88,
    metalness: 0.05,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    bumpMap: textures.woodBump,
    bumpScale: 0.04,
    color: 0x7b6a58,
    roughness: 0.88,
    metalness: 0.04,
  });
  const darkRoofMat = new THREE.MeshStandardMaterial({
    map: textures.rustedMetalAlbedo,
    color: 0x3b332f,
    roughness: 0.78,
    metalness: 0.45,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    map: textures.rustedMetalAlbedo,
    bumpMap: textures.rustedMetalBump,
    bumpScale: 0.03,
    color: 0x42474c,
    roughness: 0.52,
    metalness: 0.78,
  });
  const barkMat = new THREE.MeshStandardMaterial({
    map: textures.barkAlbedo,
    bumpMap: textures.barkBump,
    bumpScale: 0.06,
    roughness: 0.94,
    metalness: 0.02,
  });
  const pineMat = new THREE.MeshStandardMaterial({
    map: textures.foliageAlbedo,
    color: 0xffffff,
    roughness: 0.96,
    metalness: 0.01,
  });
  const yellowAccentMat = new THREE.MeshStandardMaterial({
    color: 0xd4a428,
    roughness: 0.45,
    metalness: 0.1,
    emissive: 0x3b2a04,
    emissiveIntensity: 0.55,
  });
  const redRibbonMat = new THREE.MeshStandardMaterial({
    color: 0x9b2226,
    roughness: 0.8,
    metalness: 0.05,
  });
  materials.push(
    concreteMat,
    woodMat,
    darkRoofMat,
    ironMat,
    barkMat,
    pineMat,
    yellowAccentMat,
    redRibbonMat,
  );

  // =========================================================================
  // 1. MANDATORY NORTH FOREST GATE (x: 0, z: -19.5)
  // =========================================================================
  const gateGroup = new THREE.Group();
  const gateBaseY = groundHeightAt(0, -19.5);
  gateGroup.position.set(0, gateBaseY, -19.5);
  group.add(gateGroup);

  const pierGeo = new THREE.BoxGeometry(0.65, 2.75, 0.65);
  const pierCapGeo = new THREE.BoxGeometry(0.78, 0.18, 0.78);
  const barVGeo = new THREE.CylinderGeometry(0.024, 0.024, 2.1, 8);
  const barHGeo = new THREE.BoxGeometry(2.15, 0.07, 0.06);
  const lockBoxGeo = new THREE.BoxGeometry(0.24, 0.3, 0.14);
  const lockLedGeo = new THREE.SphereGeometry(0.06, 10, 10);
  geometries.push(pierGeo, pierCapGeo, barVGeo, barHGeo, lockBoxGeo, lockLedGeo);

  for (const px of [-2.4, 2.4]) {
    const pier = new THREE.Mesh(pierGeo, concreteMat);
    pier.position.set(px, 1.35, 0);
    pier.castShadow = true;
    pier.receiveShadow = true;
    const cap = new THREE.Mesh(pierCapGeo, concreteMat);
    cap.position.set(px, 2.78, 0);
    gateGroup.add(pier, cap);
  }

  const leftLeafPivot = new THREE.Group();
  leftLeafPivot.position.set(-2.08, 0.05, 0);
  const rightLeafPivot = new THREE.Group();
  rightLeafPivot.position.set(2.08, 0.05, 0);
  gateGroup.add(leftLeafPivot, rightLeafPivot);

  const buildGateLeaf = (pivot: THREE.Group, dir: 1 | -1): THREE.Mesh[] => {
    const parts: THREE.Mesh[] = [];
    for (const ry of [0.3, 1.15, 2.05]) {
      const hBar = new THREE.Mesh(barHGeo, ironMat);
      hBar.position.set(dir * 1.04, ry, 0);
      hBar.castShadow = true;
      pivot.add(hBar);
      parts.push(hBar);
    }
    for (let i = 0; i < 7; i++) {
      const vBar = new THREE.Mesh(barVGeo, ironMat);
      vBar.position.set(dir * (0.15 + i * 0.3), 1.18, 0);
      vBar.castShadow = true;
      pivot.add(vBar);
      parts.push(vBar);
    }
    return parts;
  };

  const leftParts = buildGateLeaf(leftLeafPivot, 1);
  const rightParts = buildGateLeaf(rightLeafPivot, -1);

  const lockBody = new THREE.Mesh(lockBoxGeo, ironMat);
  lockBody.position.set(2.02, 1.12, 0.14);
  leftLeafPivot.add(lockBody);

  const lockLampMat = new THREE.MeshStandardMaterial({
    color: 0xd93829,
    emissive: 0xba181b,
    emissiveIntensity: 1.6,
    roughness: 0.3,
  });
  materials.push(lockLampMat);
  const lockLamp = new THREE.Mesh(lockLedGeo, lockLampMat);
  lockLamp.position.set(-2.35, 2.25, 0.36);
  gateGroup.add(lockLamp);

  const forestGateCollider: BoxCollider = {
    id: 'north-forest-gate-collider',
    minX: -2.5,
    maxX: 2.5,
    minZ: -19.95,
    maxZ: -19.05,
    disabled: false,
  };
  boxColliders.push(forestGateCollider);

  interactables.push({
    id: 'north-forest-gate',
    keyLabel: 'E',
    verb: 'INSPECT',
    label: 'NORTH FOREST PERIMETER GATE',
    detail: 'Padlocked iron gate // Requires full case deduction',
    worldPosition: new THREE.Vector3(0, gateBaseY + 1.25, -19.35),
    maxDistance: 4.2,
    raycastMeshes: [lockBody, lockLamp, ...leftParts.slice(0, 3), ...rightParts.slice(0, 3)],
  });

  // =========================================================================
  // 2. CARETAKER'S HOUSE (West Fence Breach: x ~ -26.8, z ~ -2.0)
  // =========================================================================
  const houseGroup = new THREE.Group();
  const hx = -27.2;
  const hz = -2.0;
  const hy = groundHeightAt(hx, hz);
  houseGroup.position.set(hx, hy, hz);
  group.add(houseGroup);

  const porchFloorGeo = new THREE.BoxGeometry(7.2, 0.24, 6.4);
  const cabinBackWallGeo = new THREE.BoxGeometry(0.28, 3.1, 5.8);
  const cabinSideWallGeo = new THREE.BoxGeometry(4.4, 3.1, 0.28);
  const cabinFrontPierGeo = new THREE.BoxGeometry(0.28, 3.1, 1.9);
  const cabinWindowWallGeo = new THREE.BoxGeometry(0.28, 1.15, 2.0);
  const cabinRoofGeo = new THREE.BoxGeometry(7.4, 0.16, 6.8);
  const porchPostGeo = new THREE.BoxGeometry(0.14, 2.95, 0.14);
  const porchStepGeo = new THREE.BoxGeometry(0.95, 0.16, 2.4);
  const deskGeo = new THREE.BoxGeometry(1.1, 0.78, 2.1);
  const windowGlassGeo = new THREE.PlaneGeometry(1.5, 1.15);
  geometries.push(
    porchFloorGeo,
    cabinBackWallGeo,
    cabinSideWallGeo,
    cabinFrontPierGeo,
    cabinWindowWallGeo,
    cabinRoofGeo,
    porchPostGeo,
    porchStepGeo,
    deskGeo,
    windowGlassGeo,
  );

  const porchFloor = new THREE.Mesh(porchFloorGeo, woodMat);
  porchFloor.position.set(0.6, 0.12, 0);
  porchFloor.receiveShadow = true;
  houseGroup.add(porchFloor);

  // Approach dirt walkway from Playground West breach (x: -19.5 -> -23.0)
  const westPathGeo = new THREE.PlaneGeometry(6.8, 2.8);
  westPathGeo.rotateX(-Math.PI / 2);
  geometries.push(westPathGeo);
  const westPath = new THREE.Mesh(westPathGeo, concreteMat);
  westPath.position.set(5.4, 0.02, 0);
  westPath.receiveShadow = true;
  houseGroup.add(westPath);

  const stepMesh = new THREE.Mesh(porchStepGeo, woodMat);
  stepMesh.position.set(4.5, 0.06, 0);
  houseGroup.add(stepMesh);

  // Cabin shell (back at x=-2.2, front window wall at x=+2.0 facing playground)
  const backWall = new THREE.Mesh(cabinBackWallGeo, woodMat);
  backWall.position.set(-2.2, 1.75, 0);
  backWall.castShadow = true;
  const northWall = new THREE.Mesh(cabinSideWallGeo, woodMat);
  northWall.position.set(-0.1, 1.75, -2.75);
  northWall.castShadow = true;
  const southWall = new THREE.Mesh(cabinSideWallGeo, woodMat);
  southWall.position.set(-0.1, 1.75, 2.75);
  southWall.castShadow = true;
  const frontPierN = new THREE.Mesh(cabinFrontPierGeo, woodMat);
  frontPierN.position.set(2.0, 1.75, -1.9);
  const frontPierS = new THREE.Mesh(cabinFrontPierGeo, woodMat);
  frontPierS.position.set(2.0, 1.75, 1.9);
  const frontUnderWin = new THREE.Mesh(cabinWindowWallGeo, woodMat);
  frontUnderWin.position.set(2.0, 0.78, 0);
  const frontOverWin = new THREE.Mesh(cabinWindowWallGeo, woodMat);
  frontOverWin.position.set(2.0, 2.78, 0);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0c1318,
    roughness: 0.18,
    metalness: 0.45,
    transparent: true,
    opacity: 0.72,
  });
  materials.push(glassMat);
  const winPane = new THREE.Mesh(windowGlassGeo, glassMat);
  winPane.position.set(2.02, 1.78, 0);
  winPane.rotation.y = Math.PI / 2;

  const cabinRoof = new THREE.Mesh(cabinRoofGeo, darkRoofMat);
  cabinRoof.position.set(0.4, 3.35, 0);
  cabinRoof.rotation.z = -0.09;
  cabinRoof.castShadow = true;

  houseGroup.add(
    backWall,
    northWall,
    southWall,
    frontPierN,
    frontPierS,
    frontUnderWin,
    frontOverWin,
    winPane,
    cabinRoof,
  );

  for (const pz of [-2.6, 2.6]) {
    const post = new THREE.Mesh(porchPostGeo, woodMat);
    post.position.set(3.85, 1.65, pz);
    post.castShadow = true;
    houseGroup.add(post);
  }

  // Porch Lantern (1 PointLight for Caretaker porch visibility)
  const porchBulbMat = new THREE.MeshBasicMaterial({ color: 0xffa84c });
  materials.push(porchBulbMat);
  const porchLantern = new THREE.Mesh(lockLedGeo, porchBulbMat);
  porchLantern.position.set(3.7, 2.85, 0);
  houseGroup.add(porchLantern);
  const caretakerLight = new THREE.PointLight(0xff9238, 12, 16, 1.6);
  caretakerLight.position.set(hx + 3.5, hy + 2.75, hz);
  group.add(caretakerLight);

  // Porch Evidence Desk holding Jimmy's 1994 Portrait + Caretaker's Log & Tape 03
  const porchDesk = new THREE.Mesh(deskGeo, woodMat);
  porchDesk.position.set(3.0, 0.62, -0.35);
  porchDesk.castShadow = true;
  houseGroup.add(porchDesk);

  const photoPlaneGeo = new THREE.PlaneGeometry(0.42, 0.42);
  photoPlaneGeo.rotateX(-Math.PI / 2);
  const logPlaneGeo = new THREE.PlaneGeometry(0.48, 0.42);
  logPlaneGeo.rotateX(-Math.PI / 2);
  const tape03Geo = new THREE.BoxGeometry(0.18, 0.05, 0.26);
  geometries.push(photoPlaneGeo, logPlaneGeo, tape03Geo);

  const jimmyPhotoMat = new THREE.MeshStandardMaterial({
    map: textures.jimmyPhotoTexture,
    roughness: 0.72,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const caretakerLogMat = new THREE.MeshStandardMaterial({
    map: textures.caretakerLogTexture,
    roughness: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  materials.push(jimmyPhotoMat, caretakerLogMat);

  const jimmyPhotoMesh = new THREE.Mesh(photoPlaneGeo, jimmyPhotoMat);
  jimmyPhotoMesh.position.set(2.96, 1.03, -0.82);
  jimmyPhotoMesh.rotation.y = 0.24;
  houseGroup.add(jimmyPhotoMesh);

  const logMesh = new THREE.Mesh(logPlaneGeo, caretakerLogMat);
  logMesh.position.set(3.02, 1.03, 0.14);
  logMesh.rotation.y = -0.18;
  houseGroup.add(logMesh);

  const tape03Mesh = new THREE.Mesh(tape03Geo, yellowAccentMat);
  tape03Mesh.position.set(3.2, 1.04, 0.48);
  tape03Mesh.rotation.y = 0.5;
  houseGroup.add(tape03Mesh);

  // House collision box (keeps player smoothly on front porch x >= -24.8)
  boxColliders.push(
    { id: 'caretaker-cabin-body', minX: hx - 2.6, maxX: hx + 2.35, minZ: hz - 3.2, maxZ: hz + 3.2 },
    { id: 'caretaker-porch-desk', minX: hx + 2.45, maxX: hx + 3.45, minZ: hz - 1.45, maxZ: hz + 0.75 },
    // West yard boundary walls so player stays along porch path
    { id: 'west-yard-north', minX: -33.5, maxX: -19.5, minZ: -9.5, maxZ: -6.2 },
    { id: 'west-yard-south', minX: -33.5, maxX: -19.5, minZ: 2.2, maxZ: 6.5 },
    { id: 'west-yard-back', minX: -33.5, maxX: -31.8, minZ: -6.5, maxZ: 2.5 },
  );

  interactables.push(
    {
      id: 'caretaker-jimmy-photo',
      evidenceId: 'ev-jimmy-photo',
      keyLabel: 'E',
      verb: 'EXAMINE',
      label: "JIMMY'S ORIGINAL 1994 PORTRAIT",
      detail: "Caretaker's porch desk // Matches 2026 parcel",
      worldPosition: new THREE.Vector3(hx + 2.96, hy + 1.08, hz - 0.82),
      maxDistance: 3.4,
      raycastMeshes: [jimmyPhotoMesh],
    },
    {
      id: 'caretaker-log-book',
      evidenceId: 'ev-caretaker-log',
      keyLabel: 'E',
      verb: 'READ',
      label: "CARETAKER'S INCIDENT LOG & TAPE 03",
      detail: '1994–1996 Ledger // Jimmy stopped speaking',
      worldPosition: new THREE.Vector3(hx + 3.04, hy + 1.08, hz + 0.25),
      maxDistance: 3.4,
      raycastMeshes: [logMesh, tape03Mesh],
    },
  );

  // =========================================================================
  // 3. DRAINAGE TUNNELS (NE Culvert: x: 8.5, z: -19.5 .. -32.5)
  // =========================================================================
  const drainGroup = new THREE.Group();
  const dx = 8.5;
  const dz = -26.0;
  drainGroup.position.set(dx, 0, dz);
  group.add(drainGroup);

  const culvertWallGeo = new THREE.BoxGeometry(0.45, 2.8, 13.4);
  const culvertCeilingGeo = new THREE.BoxGeometry(4.8, 0.35, 11.2);
  const culvertFloorGeo = new THREE.BoxGeometry(4.6, 0.16, 13.4);
  const grateWallGeo = new THREE.BoxGeometry(4.6, 2.8, 0.35);
  const pipeGeo = new THREE.CylinderGeometry(0.24, 0.24, 10.8, 10);
  pipeGeo.rotateX(Math.PI / 2);
  const puddleFloorGeo = new THREE.PlaneGeometry(3.2, 11.6);
  puddleFloorGeo.rotateX(-Math.PI / 2);
  geometries.push(
    culvertWallGeo,
    culvertCeilingGeo,
    culvertFloorGeo,
    grateWallGeo,
    pipeGeo,
    puddleFloorGeo,
  );

  const drainFloor = new THREE.Mesh(culvertFloorGeo, concreteMat);
  drainFloor.position.set(0, -0.4, 0);
  drainFloor.receiveShadow = true;
  const drainWallW = new THREE.Mesh(culvertWallGeo, concreteMat);
  drainWallW.position.set(-2.35, 0.95, 0);
  drainWallW.castShadow = true;
  const drainWallE = new THREE.Mesh(culvertWallGeo, concreteMat);
  drainWallE.position.set(2.35, 0.95, 0);
  drainWallE.castShadow = true;
  const drainCeiling = new THREE.Mesh(culvertCeilingGeo, concreteMat);
  drainCeiling.position.set(0, 2.4, -0.8);
  const drainEndWall = new THREE.Mesh(grateWallGeo, ironMat);
  drainEndWall.position.set(0, 0.95, -6.5);
  const overheadPipe = new THREE.Mesh(pipeGeo, ironMat);
  overheadPipe.position.set(-1.55, 1.95, -0.6);

  const drainWaterMat = new THREE.MeshStandardMaterial({
    color: 0x070a0d,
    roughness: 0.12,
    metalness: 0.35,
  });
  materials.push(drainWaterMat);
  const drainWater = new THREE.Mesh(puddleFloorGeo, drainWaterMat);
  drainWater.position.set(0, -0.29, 0);

  // Subtle cold culvert light inside tunnel
  const culvertLight = new THREE.PointLight(0x7ca2bd, 7.5, 15, 1.5);
  culvertLight.position.set(dx, 1.85, -28.5);
  group.add(culvertLight);

  // Julian's Final Recordings (Reels 04 & 05) + dead lantern at culvert sump
  const sumpCrateGeo = new THREE.BoxGeometry(0.55, 0.32, 0.42);
  const tape05TinGeo = new THREE.BoxGeometry(0.24, 0.08, 0.22);
  const lanternGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.22, 10);
  geometries.push(sumpCrateGeo, tape05TinGeo, lanternGeo);

  const sumpCrate = new THREE.Mesh(sumpCrateGeo, concreteMat);
  sumpCrate.position.set(0.2, -0.18, -4.1);
  const tape05Tin = new THREE.Mesh(tape05TinGeo, yellowAccentMat);
  tape05Tin.position.set(0.15, 0.02, -4.1);
  const deadLantern = new THREE.Mesh(lanternGeo, ironMat);
  deadLantern.position.set(0.4, 0.08, -4.05);

  drainGroup.add(
    drainFloor,
    drainWallW,
    drainWallE,
    drainCeiling,
    drainEndWall,
    overheadPipe,
    drainWater,
    sumpCrate,
    tape05Tin,
    deadLantern,
  );

  // Culvert walls keep player cleanly isolated from Final Forest
  boxColliders.push(
    { id: 'drain-west-wall', minX: 5.75, maxX: 6.45, minZ: -33.2, maxZ: -19.2 },
    { id: 'drain-east-wall', minX: 10.55, maxX: 11.25, minZ: -33.2, maxZ: -19.2 },
    { id: 'drain-back-grate', minX: 6.0, maxX: 11.0, minZ: -33.2, maxZ: -31.8 },
  );

  interactables.push({
    id: 'drainage-julian-tape-05',
    evidenceId: 'ev-julian-tape-05',
    keyLabel: 'E',
    verb: 'COLLECT',
    label: "JULIAN'S FINAL RECORDINGS (REELS 04 & 05)",
    detail: 'Silt-covered tin beside dead lantern',
    worldPosition: new THREE.Vector3(dx + 0.15, 0.15, dz - 4.1),
    maxDistance: 3.8,
    raycastMeshes: [tape05Tin, sumpCrate, deadLantern],
  });

  // =========================================================================
  // 4. FINAL FOREST (North of Gate: z: -20 .. -56, x: -12 .. 5.2)
  // =========================================================================
  const forestGroup = new THREE.Group();
  group.add(forestGroup);

  // Winding dark mud trail segments north from gate to clearing (0, -52.2)
  const trailPts: Array<[number, number, number]> = [
    [0, -22.5, 0],
    [-0.5, -26.5, 0.14],
    [-0.9, -30.5, -0.1],
    [0.2, -34.5, -0.22],
    [0.5, -39.0, 0.12],
    [-0.2, -43.5, 0.08],
    [0.0, -48.5, 0],
    // Misleading east fork leading toward blocked rocks
    [2.6, -34.0, -0.78],
  ];
  const trailSegGeo = new THREE.PlaneGeometry(2.6, 4.8);
  trailSegGeo.rotateX(-Math.PI / 2);
  geometries.push(trailSegGeo);

  const trailMat = new THREE.MeshStandardMaterial({
    map: textures.groundAlbedo,
    color: 0x3b3329,
    roughness: 0.94,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  materials.push(trailMat);

  for (const [tx, tz, rot] of trailPts) {
    const seg = new THREE.Mesh(trailSegGeo, trailMat);
    seg.position.set(tx, groundHeightAt(tx, tz) + 0.03, tz);
    seg.rotation.y = rot;
    seg.receiveShadow = true;
    forestGroup.add(seg);
  }

  // Dense Pine Corridor Trees (InstancedMesh with variation)
  const pineTrunkGeo = new THREE.CylinderGeometry(0.2, 0.36, 6.8, 7);
  const pineCrownGeo = new THREE.ConeGeometry(1.95, 5.4, 8);
  geometries.push(pineTrunkGeo, pineCrownGeo);

  const pineSpots: Array<[number, number, number]> = [];
  for (let z = -22; z >= -55; z -= 3.6) {
    // West flank trees
    pineSpots.push([-5.2 - ((Math.abs(z) * 3) % 3), z, 0.9 + (Math.abs(z) % 3) * 0.15]);
    pineSpots.push([-9.2, z - 1.5, 1.15]);
    // East flank trees (keeping trail around x in [-2.2, 2.2] + east fork clear)
    const eastX = z < -31 && z > -37 ? 5.2 : 3.8 + (Math.abs(z) % 2);
    pineSpots.push([eastX, z - 0.6, 1.0 + (Math.abs(z) % 2) * 0.2]);
  }
  // Clearing perimeter ring behind (0, -52.2)
  pineSpots.push([-3.6, -54.5, 1.25], [0.0, -55.4, 1.3], [3.6, -54.4, 1.2]);

  const pineTrunks = new THREE.InstancedMesh(pineTrunkGeo, barkMat, pineSpots.length);
  const pineCrowns = new THREE.InstancedMesh(pineCrownGeo, pineMat, pineSpots.length);
  const dummy = new THREE.Object3D();
  const pineColors = [
    new THREE.Color(0x182118),
    new THREE.Color(0x1f2b1d),
    new THREE.Color(0x141b14),
  ];

  pineSpots.forEach(([px, pz, sc], idx) => {
    const py = groundHeightAt(px, pz);
    dummy.position.set(px, py + 3.2 * sc, pz);
    dummy.rotation.set(0, idx * 0.9, 0);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    pineTrunks.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(px, py + 6.3 * sc, pz);
    dummy.scale.set(sc * 1.1, sc, sc * 1.1);
    dummy.updateMatrix();
    pineCrowns.setMatrixAt(idx, dummy.matrix);
    pineCrowns.setColorAt(idx, pineColors[idx % pineColors.length]);

    circleColliders.push({
      id: `forest-pine-${idx}`,
      x: px,
      z: pz,
      radius: 0.42 * sc,
    });
  });
  pineTrunks.instanceMatrix.needsUpdate = true;
  pineCrowns.instanceMatrix.needsUpdate = true;
  if (pineCrowns.instanceColor) pineCrowns.instanceColor.needsUpdate = true;
  pineTrunks.computeBoundingSphere();
  pineCrowns.computeBoundingSphere();
  forestGroup.add(pineTrunks, pineCrowns);

  // Forest Bounds & Dead-End Boulders on East Fork
  boxColliders.push(
    { id: 'forest-west-wall', minX: -13.5, maxX: -11.5, minZ: -56.5, maxZ: -19.5 },
    { id: 'forest-east-divider', minX: 4.9, maxX: 5.8, minZ: -56.5, maxZ: -19.5 },
    { id: 'forest-north-wall', minX: -13.5, maxX: 5.5, minZ: -56.5, maxZ: -55.0 },
  );

  // Forest Exhibit 1: 1994 Caution Ribbon on pine trunk at (-1.6, -30.5)
  const ribX = -1.6;
  const ribZ = -30.5;
  const ribY = groundHeightAt(ribX, ribZ);
  const ribPostGeo = new THREE.CylinderGeometry(0.16, 0.21, 2.8, 8);
  const ribStripGeo = new THREE.BoxGeometry(0.55, 0.08, 0.36);
  const ribTagGeo = new THREE.BoxGeometry(0.14, 0.16, 0.05);
  geometries.push(ribPostGeo, ribStripGeo, ribTagGeo);

  const ribTrunk = new THREE.Mesh(ribPostGeo, barkMat);
  ribTrunk.position.set(ribX, ribY + 1.35, ribZ);
  const ribWrap = new THREE.Mesh(ribStripGeo, redRibbonMat);
  ribWrap.position.set(ribX + 0.08, ribY + 1.15, ribZ);
  ribWrap.rotation.y = 0.4;
  const ribTag = new THREE.Mesh(ribTagGeo, yellowAccentMat);
  ribTag.position.set(ribX + 0.25, ribY + 1.05, ribZ + 0.1);
  forestGroup.add(ribTrunk, ribWrap, ribTag);

  interactables.push({
    id: 'forest-caution-ribbon',
    evidenceId: 'ev-forest-ribbon',
    keyLabel: 'E',
    verb: 'INSPECT',
    label: '1994 CAUTION RIBBON & TOY TAG',
    detail: 'Search dog perimeter marker',
    worldPosition: new THREE.Vector3(ribX + 0.15, ribY + 1.1, ribZ),
    maxDistance: 3.6,
    raycastMeshes: [ribWrap, ribTag, ribTrunk],
  });

  // Forest Exhibit 2: Julian's Dropped Flashlight & Pocket Note at (0.4, -41.5)
  const cmpX = 0.4;
  const cmpZ = -41.5;
  const cmpY = groundHeightAt(cmpX, cmpZ);
  const stumpGeo = new THREE.CylinderGeometry(0.32, 0.4, 0.48, 9);
  const magliteGeo = new THREE.CylinderGeometry(0.036, 0.04, 0.32, 10);
  magliteGeo.rotateZ(Math.PI / 2);
  const noteCardGeo = new THREE.BoxGeometry(0.22, 0.02, 0.16);
  geometries.push(stumpGeo, magliteGeo, noteCardGeo);

  const stump = new THREE.Mesh(stumpGeo, barkMat);
  stump.position.set(cmpX, cmpY + 0.22, cmpZ);
  const maglite = new THREE.Mesh(magliteGeo, ironMat);
  maglite.position.set(cmpX - 0.05, cmpY + 0.49, cmpZ + 0.06);
  maglite.rotation.y = 0.65;
  const noteCard = new THREE.Mesh(noteCardGeo, yellowAccentMat);
  noteCard.position.set(cmpX + 0.12, cmpY + 0.48, cmpZ - 0.05);
  noteCard.rotation.y = -0.3;
  forestGroup.add(stump, maglite, noteCard);

  interactables.push({
    id: 'forest-julian-compass',
    evidenceId: 'ev-julian-compass',
    keyLabel: 'E',
    verb: 'READ',
    label: "JULIAN'S DROPPED FLASHLIGHT & NOTE",
    detail: '1996 Maglite // Final handwritten warning',
    worldPosition: new THREE.Vector3(cmpX, cmpY + 0.52, cmpZ),
    maxDistance: 3.6,
    raycastMeshes: [maglite, noteCard, stump],
  });

  let gateOpenProgress = 0;

  return {
    group,
    circleColliders,
    boxColliders,
    interactables,
    update: (dt: number, elapsedTime: number, forestGateUnlocked: boolean) => {
      forestGateCollider.disabled = forestGateUnlocked;
      const targetProgress = forestGateUnlocked ? 1 : 0;
      gateOpenProgress += (targetProgress - gateOpenProgress) * Math.min(1, dt * 4.5);

      leftLeafPivot.rotation.y = gateOpenProgress * 1.38;
      rightLeafPivot.rotation.y = -gateOpenProgress * 1.38;

      if (forestGateUnlocked) {
        lockLampMat.color.setHex(0x69b578);
        lockLampMat.emissive.setHex(0x2f7d44);
        lockLampMat.emissiveIntensity = 1.25;
      } else {
        lockLampMat.color.setHex(0xd93829);
        lockLampMat.emissive.setHex(0xba181b);
        lockLampMat.emissiveIntensity = 1.1 + Math.sin(elapsedTime * 3.2) * 0.45;
      }
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
