import * as THREE from 'three';
import { InteractableTarget } from '../sceneTypes';
import { ProceduralTextureBundle } from '../textures';
import { groundHeightAt } from '../worldMath';

export interface SlideAndSeesawResult {
  group: THREE.Group;
  interactables: InteractableTarget[];
  dispose: () => void;
}

export function buildSlideAndSeesaw(textures: ProceduralTextureBundle): SlideAndSeesawResult {
  const group = new THREE.Group();
  group.name = 'slide-and-seesaw';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const interactables: InteractableTarget[] = [];

  const frameMat = new THREE.MeshStandardMaterial({
    map: textures.paintedGreenMetalAlbedo,
    bumpMap: textures.rustedMetalBump,
    bumpScale: 0.03,
    roughness: 0.68,
    metalness: 0.56,
  });
  const chuteMat = new THREE.MeshStandardMaterial({
    map: textures.rustedMetalAlbedo,
    bumpMap: textures.rustedMetalBump,
    bumpScale: 0.02,
    color: 0x9aa3aa,
    roughness: 0.36,
    metalness: 0.86,
  });
  const rustRedMat = new THREE.MeshStandardMaterial({
    map: textures.paintedRedMetalAlbedo,
    bumpMap: textures.rustedMetalBump,
    bumpScale: 0.03,
    roughness: 0.72,
    metalness: 0.52,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    bumpMap: textures.woodBump,
    bumpScale: 0.03,
    roughness: 0.86,
    metalness: 0.04,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x191b1d,
    roughness: 0.9,
    metalness: 0.05,
  });
  materials.push(frameMat, chuteMat, rustRedMat, woodMat, tireMat);

  // =========================================================================
  // 1. OXIDIZED METAL SLIDE (Northwest sector: x: -8.6, z: -7.8)
  // =========================================================================
  const slideGroup = new THREE.Group();
  const sx = -8.6;
  const sz = -7.8;
  slideGroup.position.set(sx, groundHeightAt(sx, sz), sz);
  slideGroup.rotation.y = 0.62; // Angles chute toward central playground
  group.add(slideGroup);

  const platHeight = 2.15;

  // Rear support legs + ladder stringers
  const postGeo = new THREE.CylinderGeometry(0.042, 0.045, platHeight + 0.55, 10);
  const ladderLegGeo = new THREE.CylinderGeometry(0.038, 0.042, 2.55, 10);
  const rungGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.56, 8);
  rungGeo.rotateZ(Math.PI / 2);
  const platformGeo = new THREE.BoxGeometry(0.68, 0.08, 0.68);
  const safetyBarGeo = new THREE.TorusGeometry(0.32, 0.028, 8, 16, Math.PI);
  geometries.push(postGeo, ladderLegGeo, rungGeo, platformGeo, safetyBarGeo);

  for (const lx of [-0.28, 0.28]) {
    // Support posts under top platform
    const support = new THREE.Mesh(postGeo, frameMat);
    support.position.set(lx, (platHeight + 0.45) * 0.5, -0.2);
    support.castShadow = true;
    slideGroup.add(support);

    // Angled ladder rails going back (-Z)
    const ladderRail = new THREE.Mesh(ladderLegGeo, frameMat);
    ladderRail.position.set(lx, 1.12, -0.95);
    ladderRail.rotation.x = 0.52;
    ladderRail.castShadow = true;
    slideGroup.add(ladderRail);

    // Top arched safety handrail
    const railArch = new THREE.Mesh(safetyBarGeo, rustRedMat);
    railArch.position.set(lx, platHeight + 0.16, -0.15);
    railArch.rotation.y = Math.PI / 2;
    railArch.castShadow = true;
    slideGroup.add(railArch);
  }

  for (let r = 0; r < 6; r++) {
    const t = (r + 0.6) / 6.2;
    const rung = new THREE.Mesh(rungGeo, chuteMat);
    rung.position.set(0, t * platHeight, -1.55 + t * 1.15);
    rung.castShadow = true;
    slideGroup.add(rung);
  }

  const platform = new THREE.Mesh(platformGeo, frameMat);
  platform.position.set(0, platHeight, -0.15);
  platform.castShadow = true;
  platform.receiveShadow = true;
  slideGroup.add(platform);

  // Curved stainless/rusted chute built cleanly from articulated segments
  const chuteSegments = 10;
  const chuteBaseGeo = new THREE.BoxGeometry(0.56, 0.045, 0.42);
  const chuteWallGeo = new THREE.BoxGeometry(0.04, 0.16, 0.43);
  const chutePropGeo = new THREE.CylinderGeometry(0.032, 0.036, 0.55, 8);
  geometries.push(chuteBaseGeo, chuteWallGeo, chutePropGeo);

  for (let i = 0; i < chuteSegments; i++) {
    const t = i / (chuteSegments - 1);
    const cz = 0.25 + t * 2.85;
    // S-curve vertical drop flattening out into exit lip
    const cy = platHeight * Math.pow(1 - t, 1.45) + 0.24 * Math.sin(t * Math.PI * 0.5);
    const nextT = Math.min(1, (i + 1) / (chuteSegments - 1));
    const nextZ = 0.25 + nextT * 2.85;
    const nextY = platHeight * Math.pow(1 - nextT, 1.45) + 0.24 * Math.sin(nextT * Math.PI * 0.5);
    const slope = Math.atan2(cy - nextY, Math.max(0.05, nextZ - cz));

    const seg = new THREE.Group();
    seg.position.set(0, cy, cz);
    seg.rotation.x = i === chuteSegments - 1 ? 0.06 : slope;

    const bed = new THREE.Mesh(chuteBaseGeo, chuteMat);
    bed.castShadow = true;
    bed.receiveShadow = true;
    seg.add(bed);

    const wallL = new THREE.Mesh(chuteWallGeo, rustRedMat);
    wallL.position.set(-0.28, 0.06, 0);
    wallL.castShadow = true;
    seg.add(wallL);

    const wallR = new THREE.Mesh(chuteWallGeo, rustRedMat);
    wallR.position.set(0.28, 0.06, 0);
    wallR.castShadow = true;
    seg.add(wallR);

    slideGroup.add(seg);
  }

  // Exit ground prop under chute mouth
  const exitLeg = new THREE.Mesh(chutePropGeo, frameMat);
  exitLeg.position.set(0, 0.16, 2.85);
  slideGroup.add(exitLeg);

  // Evidence #02: Julian Vance's Micro-Cassette Recorder near slide drainage base
  const recorderGroup = new THREE.Group();
  recorderGroup.position.set(0.38, 0.05, 3.25);
  recorderGroup.rotation.y = -0.45;
  slideGroup.add(recorderGroup);

  const recBodyGeo = new THREE.BoxGeometry(0.16, 0.045, 0.24);
  const recWindowGeo = new THREE.BoxGeometry(0.11, 0.012, 0.08);
  const reelGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.015, 10);
  const labelGeo = new THREE.BoxGeometry(0.12, 0.008, 0.05);
  geometries.push(recBodyGeo, recWindowGeo, reelGeo, labelGeo);

  const recBodyMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.45,
    metalness: 0.35,
  });
  const recAccentMat = new THREE.MeshStandardMaterial({
    color: 0xb52b27,
    roughness: 0.5,
    emissive: 0x450b09,
    emissiveIntensity: 0.6,
  });
  const recLabelMat = new THREE.MeshStandardMaterial({
    color: 0xd6cfb8,
    roughness: 0.8,
  });
  materials.push(recBodyMat, recAccentMat, recLabelMat);

  const recBody = new THREE.Mesh(recBodyGeo, recBodyMat);
  recBody.castShadow = true;
  recorderGroup.add(recBody);

  const recWindow = new THREE.Mesh(recWindowGeo, recAccentMat);
  recWindow.position.set(0, 0.025, 0.02);
  recorderGroup.add(recWindow);

  const reelA = new THREE.Mesh(reelGeo, recLabelMat);
  reelA.position.set(-0.026, 0.028, 0.02);
  const reelB = new THREE.Mesh(reelGeo, recLabelMat);
  reelB.position.set(0.026, 0.028, 0.02);
  const recStrip = new THREE.Mesh(labelGeo, recLabelMat);
  recStrip.position.set(0, 0.025, -0.06);
  recorderGroup.add(reelA, reelB, recStrip);

  slideGroup.updateMatrixWorld(true);
  const recorderWorldPos = new THREE.Vector3(0.38, 0.14, 3.25).applyMatrix4(slideGroup.matrixWorld);

  interactables.push({
    id: 'cassette-recorder',
    evidenceId: 'clue-02-cassette-04b',
    keyLabel: 'E',
    verb: 'PLAY',
    label: "JULIAN'S MICRO-CASSETTE",
    detail: 'Tape #04-B // Slide drainage base',
    worldPosition: recorderWorldPos,
    maxDistance: 3.3,
    raycastMeshes: [recBody, recWindow],
  });

  // =========================================================================
  // 2. WEATHERED SEESAW (West-Central sector: x: -9.6, z: 3.2)
  // =========================================================================
  const seesawGroup = new THREE.Group();
  const ssx = -9.6;
  const ssz = 3.2;
  seesawGroup.position.set(ssx, groundHeightAt(ssx, ssz), ssz);
  seesawGroup.rotation.y = 0.22;
  group.add(seesawGroup);

  const fulcrumLegGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.85, 10);
  const axleGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.52, 10);
  axleGeo.rotateZ(Math.PI / 2);
  const plankGeo = new THREE.BoxGeometry(0.36, 0.075, 4.1);
  const handleLoopGeo = new THREE.TorusGeometry(0.11, 0.018, 6, 12, Math.PI);
  const tireGeo = new THREE.TorusGeometry(0.24, 0.085, 8, 16);
  tireGeo.rotateX(Math.PI / 2);
  geometries.push(fulcrumLegGeo, axleGeo, plankGeo, handleLoopGeo, tireGeo);

  for (const sideX of [-0.2, 0.2]) {
    for (const sDir of [-1, 1]) {
      const fLeg = new THREE.Mesh(fulcrumLegGeo, rustRedMat);
      fLeg.position.set(sideX, 0.34, sDir * 0.22);
      fLeg.rotation.x = -sDir * 0.48;
      fLeg.castShadow = true;
      seesawGroup.add(fLeg);
    }
  }
  const fulcrumAxle = new THREE.Mesh(axleGeo, chuteMat);
  fulcrumAxle.position.set(0, 0.62, 0);
  seesawGroup.add(fulcrumAxle);

  // Tilted seesaw beam resting asymmetrically
  const beamGroup = new THREE.Group();
  beamGroup.position.set(0, 0.65, 0);
  beamGroup.rotation.x = 0.16;
  seesawGroup.add(beamGroup);

  const plank = new THREE.Mesh(plankGeo, woodMat);
  plank.castShadow = true;
  plank.receiveShadow = true;
  beamGroup.add(plank);

  for (const endZ of [-1.55, 1.55]) {
    const handle = new THREE.Mesh(handleLoopGeo, rustRedMat);
    handle.position.set(0, 0.05, endZ);
    handle.castShadow = true;
    beamGroup.add(handle);
  }

  // Half-buried rubber bumper tires beneath seesaw ends
  for (const endZ of [-1.75, 1.75]) {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.position.set(0, 0.05, endZ);
    tire.receiveShadow = true;
    seesawGroup.add(tire);
  }

  // Evidence #04: Tommy Mercer's Desk Sketch pinned near the seesaw pivot
  const sketchGeo = new THREE.PlaneGeometry(0.32, 0.32);
  sketchGeo.rotateX(-Math.PI / 2);
  geometries.push(sketchGeo);
  const sketchMat = new THREE.MeshStandardMaterial({
    map: textures.crayonSketchTexture,
    roughness: 0.9,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  materials.push(sketchMat);

  const sketchMesh = new THREE.Mesh(sketchGeo, sketchMat);
  sketchMesh.position.set(0.45, 0.045, 0.35);
  sketchMesh.rotation.y = 0.38;
  seesawGroup.add(sketchMesh);

  seesawGroup.updateMatrixWorld(true);
  const sketchWorldPos = new THREE.Vector3(0.45, 0.15, 0.35).applyMatrix4(seesawGroup.matrixWorld);

  interactables.push({
    id: 'crayon-sketch',
    evidenceId: 'clue-04-crayon-sketch',
    keyLabel: 'E',
    verb: 'READ',
    label: "JIMMY'S 1994 CRAYON SKETCH",
    detail: '"HE IS WATCHING" // Seesaw pivot',
    worldPosition: sketchWorldPos,
    maxDistance: 3.4,
    raycastMeshes: [sketchMesh, plank],
  });

  return {
    group,
    interactables,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
