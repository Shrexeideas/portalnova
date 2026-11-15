import * as THREE from 'three';
import { InteractableTarget } from '../sceneTypes';
import { ProceduralTextureBundle } from '../textures';
import { groundHeightAt } from '../worldMath';

export interface CarouselAndDuckResult {
  group: THREE.Group;
  duckHeadWorldPos: THREE.Vector3;
  interactables: InteractableTarget[];
  update: (
    dt: number,
    elapsedTime: number,
    isPlayerLooking: boolean,
    roamingPose?: { anchorId: string; x: number; z: number; yaw: number; visible: boolean },
  ) => void;
  dispose: () => void;
}

export function buildCarouselAndDuck(textures: ProceduralTextureBundle): CarouselAndDuckResult {
  const group = new THREE.Group();
  group.name = 'carousel-and-duck';

  const cx = 8.4;
  const cz = -4.6;
  const baseY = groundHeightAt(cx, cz);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const interactables: InteractableTarget[] = [];

  const rustedSteelMat = new THREE.MeshStandardMaterial({
    map: textures.rustedMetalAlbedo,
    bumpMap: textures.rustedMetalBump,
    bumpScale: 0.03,
    roughness: 0.7,
    metalness: 0.68,
  });
  const deckPaintedMat = new THREE.MeshStandardMaterial({
    map: textures.rustedMetalAlbedo,
    bumpMap: textures.rustedMetalBump,
    bumpScale: 0.035,
    color: 0x5f4a46,
    roughness: 0.84,
    metalness: 0.48,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x7b8086,
    map: textures.rustedMetalAlbedo,
    roughness: 0.56,
    metalness: 0.76,
  });
  materials.push(rustedSteelMat, deckPaintedMat, railMat);

  // =========================================================================
  // 1. ABANDONED MERRY-GO-ROUND / CAROUSEL
  // =========================================================================
  const carouselRoot = new THREE.Group();
  carouselRoot.position.set(cx, baseY, cz);
  group.add(carouselRoot);

  // Ground concrete collar
  const baseCollarGeo = new THREE.CylinderGeometry(0.65, 0.78, 0.16, 16);
  const deckGeo = new THREE.CylinderGeometry(2.15, 2.2, 0.12, 28);
  const hubColGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.05, 14);
  const hubCapGeo = new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  geometries.push(baseCollarGeo, deckGeo, hubColGeo, hubCapGeo);

  const baseCollar = new THREE.Mesh(baseCollarGeo, rustedSteelMat);
  baseCollar.position.y = 0.06;
  baseCollar.receiveShadow = true;
  carouselRoot.add(baseCollar);

  // Rotating turntable platform
  const spinnerGroup = new THREE.Group();
  spinnerGroup.position.y = 0.22;
  carouselRoot.add(spinnerGroup);

  const deck = new THREE.Mesh(deckGeo, deckPaintedMat);
  deck.castShadow = true;
  deck.receiveShadow = true;
  spinnerGroup.add(deck);

  const hubCol = new THREE.Mesh(hubColGeo, rustedSteelMat);
  hubCol.position.y = 0.52;
  hubCol.castShadow = true;
  spinnerGroup.add(hubCol);

  const hubCap = new THREE.Mesh(hubCapGeo, railMat);
  hubCap.position.y = 1.04;
  spinnerGroup.add(hubCap);

  // 6 arched handrail loops + diagonal braces to center hub
  const railPostGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8);
  const archTopGeo = new THREE.TorusGeometry(0.46, 0.028, 8, 14, Math.PI);
  const spokeGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.55, 8);
  geometries.push(railPostGeo, archTopGeo, spokeGeo);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const armGroup = new THREE.Group();
    armGroup.rotation.y = angle;
    spinnerGroup.add(armGroup);

    const outerPost = new THREE.Mesh(railPostGeo, railMat);
    outerPost.position.set(1.88, 0.45, 0);
    outerPost.castShadow = true;
    armGroup.add(outerPost);

    const innerPost = new THREE.Mesh(railPostGeo, railMat);
    innerPost.position.set(0.96, 0.45, 0);
    innerPost.castShadow = true;
    armGroup.add(innerPost);

    const arch = new THREE.Mesh(archTopGeo, railMat);
    arch.position.set(1.42, 0.86, 0);
    arch.castShadow = true;
    armGroup.add(arch);

    const spoke = new THREE.Mesh(spokeGeo, rustedSteelMat);
    spoke.position.set(0.95, 0.72, 0);
    spoke.rotation.z = 1.18;
    armGroup.add(spoke);
  }

  // Strange concentric chalk & scrape markings on ground around carousel
  const markGeo = new THREE.PlaneGeometry(5.8, 5.8);
  markGeo.rotateX(-Math.PI / 2);
  geometries.push(markGeo);
  const markMat = new THREE.MeshStandardMaterial({
    map: textures.carouselScratchesTexture,
    transparent: true,
    alphaTest: 0.04,
    roughness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  materials.push(markMat);
  const markDecal = new THREE.Mesh(markGeo, markMat);
  markDecal.position.set(cx, baseY + 0.035, cz);
  group.add(markDecal);

  // =========================================================================
  // 2. UNCANNY DUCK PRESENCE (Weathered fiberglass/polymer figure on carousel)
  // Sculptural, muted matte ochre/charcoal — unsettling, NOT cartoonish.
  // =========================================================================
  const duckGroup = new THREE.Group();
  // Positioned subtly near carousel far rim facing southwest into shadow
  duckGroup.position.set(-0.92, 0.08, -0.95);
  duckGroup.rotation.y = -0.78;
  spinnerGroup.add(duckGroup);

  const duckBodyMat = new THREE.MeshStandardMaterial({
    color: 0x7b6729, // Weathered damp ochre-yellow
    map: textures.woodAlbedo, // Subtle weathered grime streaks
    roughness: 0.72,
    metalness: 0.05,
  });
  const duckBillMat = new THREE.MeshStandardMaterial({
    color: 0x9e4b1c, // Weathered burnt orange bill
    roughness: 0.55,
    metalness: 0.08,
  });
  const duckEyeMat = new THREE.MeshStandardMaterial({
    color: 0x090a0c,
    roughness: 0.12,
    metalness: 0.5,
  });
  materials.push(duckBodyMat, duckBillMat, duckEyeMat);

  // Sculpted 8-part uncanny duck form (pedestal base, torso, tail, neck, head, upper/lower bill, recessed eyes)
  const plinthGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.14, 12);
  const bodyGeo = new THREE.SphereGeometry(0.42, 16, 14);
  bodyGeo.scale(0.95, 0.85, 1.28);
  const tailGeo = new THREE.ConeGeometry(0.22, 0.36, 10);
  tailGeo.rotateX(-1.15);
  const neckGeo = new THREE.CylinderGeometry(0.14, 0.21, 0.52, 12);
  const headGeo = new THREE.SphereGeometry(0.23, 16, 14);
  const billGeo = new THREE.ConeGeometry(0.12, 0.32, 10);
  billGeo.scale(1.25, 1, 0.55);
  billGeo.rotateX(Math.PI / 2);
  const eyeGeo = new THREE.SphereGeometry(0.036, 10, 10);
  geometries.push(plinthGeo, bodyGeo, tailGeo, neckGeo, headGeo, billGeo, eyeGeo);

  const plinth = new THREE.Mesh(plinthGeo, rustedSteelMat);
  plinth.position.y = 0.07;
  duckGroup.add(plinth);

  const torso = new THREE.Mesh(bodyGeo, duckBodyMat);
  torso.position.set(0, 0.42, 0);
  torso.castShadow = true;
  duckGroup.add(torso);

  const tail = new THREE.Mesh(tailGeo, duckBodyMat);
  tail.position.set(0, 0.52, -0.45);
  duckGroup.add(tail);

  const neckPivot = new THREE.Group();
  neckPivot.position.set(0, 0.65, 0.28);
  duckGroup.add(neckPivot);

  const neck = new THREE.Mesh(neckGeo, duckBodyMat);
  neck.position.set(0, 0.22, 0.02);
  neck.rotation.x = 0.14;
  neck.castShadow = true;
  neckPivot.add(neck);

  const head = new THREE.Mesh(headGeo, duckBodyMat);
  head.position.set(0, 0.5, 0.07);
  head.castShadow = true;
  neckPivot.add(head);

  const bill = new THREE.Mesh(billGeo, duckBillMat);
  bill.position.set(0, 0.46, 0.32);
  neckPivot.add(bill);

  const eyeL = new THREE.Mesh(eyeGeo, duckEyeMat);
  eyeL.position.set(-0.11, 0.54, 0.23);
  const eyeR = new THREE.Mesh(eyeGeo, duckEyeMat);
  eyeR.position.set(0.11, 0.54, 0.23);
  neckPivot.add(eyeL, eyeR);

  // =========================================================================
  // 3. EVIDENCE #05: SILT-STAINED DUCK WHISTLE (Two paces SW of carousel)
  // =========================================================================
  const wx = 5.95;
  const wz = -2.45;
  const wy = groundHeightAt(wx, wz);

  const whistleGroup = new THREE.Group();
  whistleGroup.position.set(wx, wy + 0.04, wz);
  whistleGroup.rotation.y = 0.85;
  group.add(whistleGroup);

  const whistleMat = new THREE.MeshStandardMaterial({
    color: 0xd4a428,
    roughness: 0.42,
    metalness: 0.1,
    emissive: 0x3b2a04,
    emissiveIntensity: 0.45,
  });
  materials.push(whistleMat);

  const wBodyGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.14, 12);
  wBodyGeo.rotateZ(Math.PI / 2);
  const wMouthGeo = new THREE.BoxGeometry(0.09, 0.035, 0.06);
  const wStoneGeo = new THREE.DodecahedronGeometry(0.09, 0);
  geometries.push(wBodyGeo, wMouthGeo, wStoneGeo);

  const wBody = new THREE.Mesh(wBodyGeo, whistleMat);
  wBody.castShadow = true;
  const wMouth = new THREE.Mesh(wMouthGeo, whistleMat);
  wMouth.position.set(0.08, 0.01, 0);
  const wBaseStone = new THREE.Mesh(wStoneGeo, rustedSteelMat);
  wBaseStone.position.set(-0.1, -0.02, 0.06);
  wBaseStone.scale.set(1.2, 0.5, 1.1);
  whistleGroup.add(wBody, wMouth, wBaseStone);

  interactables.push({
    id: 'yellow-whistle',
    evidenceId: 'clue-05-yellow-whistle',
    keyLabel: 'E',
    verb: 'PICK UP',
    label: 'SILT-STAINED DUCK WHISTLE',
    detail: 'Exhibit-00 // Two paces from carousel',
    worldPosition: new THREE.Vector3(wx, wy + 0.12, wz),
    maxDistance: 3.4,
    raycastMeshes: [wBody, wMouth],
  });

  const duckHeadWorldPos = new THREE.Vector3();
  group.updateMatrixWorld(true);
  head.getWorldPosition(duckHeadWorldPos);

  return {
    group,
    duckHeadWorldPos,
    interactables,
    update: (
      dt: number,
      elapsedTime: number,
      isPlayerLooking: boolean,
      roamingPose?: { anchorId: string; x: number; z: number; yaw: number; visible: boolean },
    ) => {
      const onCarousel = !roamingPose || roamingPose.anchorId === 'carousel-rim';

      if (onCarousel) {
        if (duckGroup.parent !== spinnerGroup) {
          spinnerGroup.add(duckGroup);
        }
        duckGroup.position.set(-0.92, 0.08, -0.95);
        duckGroup.rotation.y = -0.78;
        duckGroup.visible = roamingPose ? roamingPose.visible : true;
      } else {
        if (duckGroup.parent !== group) {
          group.add(duckGroup);
        }
        duckGroup.visible = roamingPose.visible;
        duckGroup.position.set(
          roamingPose.x,
          groundHeightAt(roamingPose.x, roamingPose.z),
          roamingPose.z,
        );
        duckGroup.rotation.y = roamingPose.yaw;
      }

      // Uncanny carousel creeps imperceptibly only when player is NOT directly staring,
      // and freezes eerily when caught in player's direct line of sight.
      if (!isPlayerLooking) {
        const creep = 0.055 + Math.max(0, Math.sin(elapsedTime * 0.45)) * 0.04;
        spinnerGroup.rotation.y += creep * dt;
        neckPivot.rotation.y = Math.sin(elapsedTime * 0.6) * 0.08;
        neckPivot.rotation.z = Math.sin(elapsedTime * 0.37) * 0.045;
      } else {
        neckPivot.rotation.y *= Math.max(0, 1 - dt * 6);
        neckPivot.rotation.z *= Math.max(0, 1 - dt * 6);
      }

      duckGroup.updateMatrixWorld(true);
      head.getWorldPosition(duckHeadWorldPos);
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
