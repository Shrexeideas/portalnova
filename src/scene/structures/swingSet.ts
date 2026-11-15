import * as THREE from 'three';
import { InteractableTarget } from '../sceneTypes';
import { ProceduralTextureBundle } from '../textures';
import { groundHeightAt, stepSwingPendulum, SwingPendulumState } from '../worldMath';

export interface SwingSetResult {
  group: THREE.Group;
  interactables: InteractableTarget[];
  update: (dt: number, elapsedTime: number) => void;
  pushSwing: (index?: number) => void;
  dispose: () => void;
}

export function buildSwingSet(textures: ProceduralTextureBundle): SwingSetResult {
  const group = new THREE.Group();
  group.name = 'aframe-swing-set';

  const originX = -3.8;
  const originZ = -2.2;
  const groundY = groundHeightAt(originX, originZ);
  group.position.set(originX, groundY, originZ);
  group.rotation.y = 0.28;

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const frameMat = new THREE.MeshStandardMaterial({
    map: textures.rustedMetalAlbedo,
    bumpMap: textures.rustedMetalBump,
    bumpScale: 0.035,
    roughness: 0.68,
    metalness: 0.72,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    map: textures.paintedRedMetalAlbedo,
    bumpMap: textures.rustedMetalBump,
    bumpScale: 0.03,
    roughness: 0.72,
    metalness: 0.52,
  });
  const chainMat = new THREE.MeshStandardMaterial({
    color: 0x62676c,
    roughness: 0.45,
    metalness: 0.85,
  });
  const seatMat = new THREE.MeshStandardMaterial({
    map: textures.rubberAlbedo,
    color: 0x202224,
    roughness: 0.86,
    metalness: 0.08,
  });
  const footingMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    roughness: 0.9,
    metalness: 0.02,
  });
  materials.push(frameMat, collarMat, chainMat, seatMat, footingMat);

  const height = 3.25;
  const halfSpanX = 2.1;
  const halfSpreadZ = 1.25;
  const legLength = Math.hypot(height, halfSpreadZ);

  // Top horizontal crossbar
  const topBarGeo = new THREE.CylinderGeometry(0.058, 0.058, halfSpanX * 2 + 0.55, 14);
  topBarGeo.rotateZ(Math.PI / 2);
  geometries.push(topBarGeo);
  const topBar = new THREE.Mesh(topBarGeo, frameMat);
  topBar.position.set(0, height, 0);
  topBar.castShadow = true;
  topBar.receiveShadow = true;
  group.add(topBar);

  // A-frame angled steel legs + concrete ground collars + cross braces
  const legGeo = new THREE.CylinderGeometry(0.044, 0.048, legLength + 0.16, 12);
  const braceGeo = new THREE.CylinderGeometry(0.028, 0.028, halfSpreadZ * 1.15, 10);
  const footingGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.22, 12);
  const apexCollarGeo = new THREE.BoxGeometry(0.24, 0.22, 0.24);
  geometries.push(legGeo, braceGeo, footingGeo, apexCollarGeo);

  for (const sideX of [-halfSpanX, halfSpanX]) {
    const collar = new THREE.Mesh(apexCollarGeo, collarMat);
    collar.position.set(sideX, height, 0);
    collar.castShadow = true;
    group.add(collar);

    for (const dirZ of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, frameMat);
      const midY = height * 0.5;
      const midZ = dirZ * (halfSpreadZ * 0.5);
      leg.position.set(sideX, midY, midZ);
      leg.rotation.x = dirZ * Math.atan2(halfSpreadZ, height);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);

      const footing = new THREE.Mesh(footingGeo, footingMat);
      footing.position.set(sideX, 0.04, dirZ * halfSpreadZ);
      footing.receiveShadow = true;
      group.add(footing);
    }

    // Horizontal stabilizer bar halfway up A-frame
    const brace = new THREE.Mesh(braceGeo, frameMat);
    brace.rotation.x = Math.PI / 2;
    brace.position.set(sideX, height * 0.44, 0);
    brace.castShadow = true;
    group.add(brace);
  }

  // Build 2 articulated chain swings
  const swingPivots: THREE.Group[] = [];
  const swingStates: SwingPendulumState[] = [
    { angle: 0.05, angularVelocity: 0.02 },
    { angle: -0.14, angularVelocity: -0.06 }, // Swing #2 gently stirring
  ];

  const chainDrop = 2.45;
  const linkGeo = new THREE.TorusGeometry(0.026, 0.007, 6, 10);
  const clampGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.09, 10);
  clampGeo.rotateZ(Math.PI / 2);
  const seatGeo = new THREE.BoxGeometry(0.58, 0.038, 0.21);
  const bracketGeo = new THREE.BoxGeometry(0.05, 0.07, 0.06);
  geometries.push(linkGeo, clampGeo, seatGeo, bracketGeo);

  const swingOffsets = [-0.95, 0.95];
  const swing2RaycastTargets: THREE.Object3D[] = [];

  swingOffsets.forEach((sx, sIdx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx, height, 0);
    group.add(pivot);

    const linksPerChain = 24;
    const linkStep = chainDrop / linksPerChain;

    for (const side of [-0.26, 0.26]) {
      const clamp = new THREE.Mesh(clampGeo, collarMat);
      clamp.position.set(side, 0, 0);
      pivot.add(clamp);

      for (let l = 0; l < linksPerChain; l++) {
        const link = new THREE.Mesh(linkGeo, chainMat);
        link.position.set(side, -(l + 0.65) * linkStep, 0);
        link.rotation.y = l % 2 === 0 ? 0 : Math.PI / 2;
        link.scale.set(0.75, 1.45, 0.75);
        link.castShadow = true;
        pivot.add(link);
        if (sIdx === 1 && l > 12) {
          swing2RaycastTargets.push(link);
        }
      }

      const seatBracket = new THREE.Mesh(bracketGeo, frameMat);
      seatBracket.position.set(side, -chainDrop, 0);
      pivot.add(seatBracket);
    }

    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, -chainDrop - 0.025, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    pivot.add(seat);
    if (sIdx === 1) {
      swing2RaycastTargets.push(seat);
    }

    swingPivots.push(pivot);
  });

  // Evidence #01: Brittle Yellow Beak Shard wedged on Swing #2 chain collar / seat bracket
  const shardGeo = new THREE.ConeGeometry(0.055, 0.14, 5);
  shardGeo.rotateZ(0.65);
  geometries.push(shardGeo);
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0xd9a11e,
    roughness: 0.38,
    metalness: 0.08,
    emissive: 0x3b2804,
    emissiveIntensity: 0.45,
  });
  materials.push(shardMat);

  const beakShard = new THREE.Mesh(shardGeo, shardMat);
  beakShard.position.set(0.24, -chainDrop + 0.09, 0.03);
  swingPivots[1].add(beakShard);
  swing2RaycastTargets.push(beakShard);

  // Compute world coordinate for Swing #2 interaction prompt
  group.updateMatrixWorld(true);
  const swing2WorldPos = new THREE.Vector3(0.95, height - chainDrop * 0.72, 0).applyMatrix4(
    group.matrixWorld,
  );

  const pushSwing = (index = 1) => {
    const target = swingStates[index] ?? swingStates[1];
    target.angularVelocity += target.angle >= 0 ? -1.15 : 1.15;
  };

  const interactables: InteractableTarget[] = [
    {
      id: 'swing-chains',
      evidenceId: 'clue-01-beak-shard',
      keyLabel: 'E',
      verb: 'INSPECT',
      label: 'RUSTED SWING #2',
      detail: 'Yellow polymer shard wedged in chain',
      worldPosition: swing2WorldPos,
      maxDistance: 4.1,
      raycastMeshes: swing2RaycastTargets,
      onInteract: () => pushSwing(1),
    },
  ];

  return {
    group,
    interactables,
    pushSwing,
    update: (dt: number, elapsedTime: number) => {
      for (let i = 0; i < swingPivots.length; i++) {
        swingStates[i] = stepSwingPendulum(swingStates[i], dt, elapsedTime, i * 2.1);
        swingPivots[i].rotation.x = swingStates[i].angle;
      }
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
