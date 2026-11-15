import * as THREE from 'three';
import { ProceduralTextureBundle } from './textures';
import { CircleCollider, groundHeightAt } from './worldMath';

export interface VegetationBuildResult {
  group: THREE.Group;
  colliders: CircleCollider[];
  update: (elapsedTime: number) => void;
  dispose: () => void;
}

export function buildVegetation(textures: ProceduralTextureBundle): VegetationBuildResult {
  const group = new THREE.Group();
  group.name = 'playground-vegetation';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const colliders: CircleCollider[] = [];

  const barkMat = new THREE.MeshStandardMaterial({
    map: textures.barkAlbedo,
    bumpMap: textures.barkBump,
    bumpScale: 0.06,
    roughness: 0.94,
    metalness: 0.02,
  });
  const foliageMat = new THREE.MeshStandardMaterial({
    map: textures.foliageAlbedo,
    color: 0x222c20,
    roughness: 0.96,
    metalness: 0.01,
  });
  const bushMat = new THREE.MeshStandardMaterial({
    map: textures.foliageAlbedo,
    color: 0xffffff,
    roughness: 0.97,
    metalness: 0.01,
  });
  materials.push(barkMat, foliageMat, bushMat);

  const perturbGeometry = (geo: THREE.BufferGeometry, amount: number, seedVal: number) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    let s = seedVal;
    const rng = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const jitter = 1 + (Math.sin(x * 3.1 + y * 2.4 + z * 2.7) * 0.5 + (rng() - 0.5)) * amount;
      pos.setXYZ(i, x * jitter, y * (1 + (rng() - 0.5) * amount * 0.6), z * jitter);
    }
    geo.computeVertexNormals();
  };

  // Shared tree sub-geometries (organically perturbed)
  const trunkLowerGeo = new THREE.CylinderGeometry(0.24, 0.38, 3.2, 8);
  const trunkUpperGeo = new THREE.CylinderGeometry(0.14, 0.24, 2.8, 7);
  const branchGeo = new THREE.CylinderGeometry(0.055, 0.13, 2.2, 6);
  const canopyGeoA = new THREE.IcosahedronGeometry(1.45, 2);
  const canopyGeoB = new THREE.IcosahedronGeometry(1.08, 2);
  perturbGeometry(canopyGeoA, 0.32, 701);
  perturbGeometry(canopyGeoB, 0.34, 709);
  geometries.push(trunkLowerGeo, trunkUpperGeo, branchGeo, canopyGeoA, canopyGeoB);

  const heroTreeSpots: Array<{ x: number; z: number; scale: number; rot: number }> = [
    { x: -16.2, z: -13.5, scale: 1.18, rot: 0.4 },
    { x: -15.4, z: -3.0, scale: 1.05, rot: 1.7 },
    { x: -15.8, z: 9.8, scale: 1.12, rot: 2.8 },
    { x: -7.5, z: -16.8, scale: 1.24, rot: 0.9 },
    { x: 4.5, z: -16.4, scale: 1.15, rot: 4.1 },
    { x: 16.4, z: -10.0, scale: 1.2, rot: 5.1 },
    { x: 16.2, z: 2.5, scale: 1.08, rot: 2.1 },
    { x: 14.5, z: 13.8, scale: 1.16, rot: 3.4 },
    { x: -8.8, z: 16.2, scale: 1.0, rot: 1.2 },
    { x: 8.6, z: 16.4, scale: 1.04, rot: 4.6 },
  ];

  const swayCanopies: Array<{ obj: THREE.Object3D; phase: number; baseRotZ: number }> = [];

  // 1. Bespoke composite trees with irregular trunks, forked branches & jagged organic crowns
  heroTreeSpots.forEach((spot, idx) => {
    const tree = new THREE.Group();
    const gy = groundHeightAt(spot.x, spot.z);
    tree.position.set(spot.x, gy - 0.12, spot.z);
    tree.rotation.y = spot.rot;
    tree.scale.setScalar(spot.scale);

    const lowerTrunk = new THREE.Mesh(trunkLowerGeo, barkMat);
    lowerTrunk.position.set(0, 1.55, 0);
    lowerTrunk.rotation.z = ((idx % 3) - 1) * 0.07;
    lowerTrunk.castShadow = true;
    lowerTrunk.receiveShadow = true;
    tree.add(lowerTrunk);

    const upperTrunk = new THREE.Mesh(trunkUpperGeo, barkMat);
    upperTrunk.position.set(0.14, 4.1, 0.06);
    upperTrunk.rotation.z = -0.16;
    upperTrunk.castShadow = true;
    tree.add(upperTrunk);

    // 4 irregular primary boughs with ragged foliage clusters
    for (let b = 0; b < 4; b++) {
      const bough = new THREE.Mesh(branchGeo, barkMat);
      const bAngle = b * 1.58 + (idx % 2) * 0.45;
      bough.position.set(Math.cos(bAngle) * 0.72, 3.7 + b * 0.3, Math.sin(bAngle) * 0.72);
      bough.rotation.order = 'YXZ';
      bough.rotation.y = -bAngle;
      bough.rotation.z = -0.84;
      bough.castShadow = true;
      tree.add(bough);

      const leafCluster = new THREE.Mesh(canopyGeoB, foliageMat);
      leafCluster.position.set(Math.cos(bAngle) * 1.48, 4.35 + b * 0.36, Math.sin(bAngle) * 1.48);
      leafCluster.scale.set(1.2, 0.78, 1.05);
      leafCluster.castShadow = true;
      tree.add(leafCluster);
      swayCanopies.push({ obj: leafCluster, phase: idx * 1.1 + b, baseRotZ: leafCluster.rotation.z });
    }

    const crown = new THREE.Mesh(canopyGeoA, foliageMat);
    crown.position.set(0.2, 5.55, 0.1);
    crown.scale.set(1.25, 0.85, 1.15);
    crown.castShadow = true;
    tree.add(crown);
    swayCanopies.push({ obj: crown, phase: idx * 0.9, baseRotZ: crown.rotation.z });

    group.add(tree);
    colliders.push({
      id: `hero-tree-${idx}`,
      x: spot.x,
      z: spot.z,
      radius: 0.48 * spot.scale,
    });
  });

  // 2. Dense Outer Dark Treeline Ring (InstancedMesh) with multi-tiered ragged pine silhouettes
  const outerCount = 72;
  const outerTrunkGeo = new THREE.CylinderGeometry(0.22, 0.42, 7.8, 7);
  const outerLowerTierGeo = new THREE.ConeGeometry(2.3, 4.8, 9, 2);
  const outerUpperTierGeo = new THREE.ConeGeometry(1.65, 4.4, 9, 2);
  perturbGeometry(outerLowerTierGeo, 0.28, 811);
  perturbGeometry(outerUpperTierGeo, 0.3, 823);
  geometries.push(outerTrunkGeo, outerLowerTierGeo, outerUpperTierGeo);

  const outerTrunks = new THREE.InstancedMesh(outerTrunkGeo, barkMat, outerCount);
  const outerLowerTiers = new THREE.InstancedMesh(outerLowerTierGeo, foliageMat, outerCount);
  const outerUpperTiers = new THREE.InstancedMesh(outerUpperTierGeo, foliageMat, outerCount);
  const dummy = new THREE.Object3D();

  let seed = 1998;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2 + (rand() - 0.5) * 0.12;
    const radius = 23.2 + rand() * 17.5;
    const tx = Math.cos(angle) * radius;
    const tz = Math.sin(angle) * radius;
    const ty = groundHeightAt(tx, tz);
    const sc = 0.85 + rand() * 0.65;
    const yaw = rand() * Math.PI * 2;

    dummy.position.set(tx, ty + 3.5 * sc, tz);
    dummy.rotation.set((rand() - 0.5) * 0.08, yaw, (rand() - 0.5) * 0.08);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    outerTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx, ty + 5.6 * sc, tz);
    dummy.scale.set(sc * (0.95 + rand() * 0.3), sc * (0.95 + rand() * 0.3), sc * (0.95 + rand() * 0.3));
    dummy.updateMatrix();
    outerLowerTiers.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx, ty + 8.3 * sc, tz);
    dummy.rotation.set(0, yaw + 0.7, 0);
    dummy.scale.set(sc * (0.9 + rand() * 0.25), sc * (0.95 + rand() * 0.25), sc * (0.9 + rand() * 0.25));
    dummy.updateMatrix();
    outerUpperTiers.setMatrixAt(i, dummy.matrix);
  }
  outerTrunks.instanceMatrix.needsUpdate = true;
  outerLowerTiers.instanceMatrix.needsUpdate = true;
  outerUpperTiers.instanceMatrix.needsUpdate = true;
  outerTrunks.computeBoundingSphere();
  outerLowerTiers.computeBoundingSphere();
  outerUpperTiers.computeBoundingSphere();
  group.add(outerTrunks, outerLowerTiers, outerUpperTiers);

  // 3. Overgrown Perimeter Bushes & Brambles (InstancedMesh with organic jagged geometry)
  const bushCount = 110;
  const bushGeo = new THREE.IcosahedronGeometry(0.66, 2);
  perturbGeometry(bushGeo, 0.36, 919);
  geometries.push(bushGeo);
  const bushes = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
  const bushColors = [
    new THREE.Color(0x1f2a1d),
    new THREE.Color(0x273221),
    new THREE.Color(0x1a2118),
    new THREE.Color(0x2f3523),
  ];

  for (let i = 0; i < bushCount; i++) {
    // Cluster along fence line and shed edges, keeping south entrance walkway clear
    const side = i % 4;
    let bx = 0;
    let bz = 0;
    if (side === 0) {
      bx = -18.5 + (rand() - 0.5) * 4.2;
      bz = (rand() - 0.5) * 34;
    } else if (side === 1) {
      bx = 18.5 + (rand() - 0.5) * 4.2;
      bz = (rand() - 0.5) * 34;
    } else if (side === 2) {
      bx = (rand() - 0.5) * 36;
      bz = -18.2 + (rand() - 0.5) * 3.8;
    } else {
      // South fence line leaving gate [-2.8 .. 2.8] wide open
      bx = (rand() > 0.5 ? 1 : -1) * (3.6 + rand() * 14.5);
      bz = 17.6 + (rand() - 0.5) * 3.2;
    }

    const by = groundHeightAt(bx, bz);
    const sc = 0.72 + rand() * 0.78;
    dummy.position.set(bx, by + 0.34 * sc, bz);
    dummy.rotation.set(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4);
    dummy.scale.set(sc * 1.25, sc * 0.8, sc * 1.15);
    dummy.updateMatrix();
    bushes.setMatrixAt(i, dummy.matrix);
    bushes.setColorAt(i, bushColors[i % bushColors.length]);
  }
  bushes.instanceMatrix.needsUpdate = true;
  if (bushes.instanceColor) bushes.instanceColor.needsUpdate = true;
  bushes.computeBoundingSphere();
  bushes.castShadow = true;
  bushes.receiveShadow = true;
  group.add(bushes);

  // 4. Fallen Dead Branches (InstancedMesh)
  const deadBranchCount = 26;
  const fallenBranchGeo = new THREE.CylinderGeometry(0.035, 0.06, 1.45, 6);
  fallenBranchGeo.rotateZ(Math.PI / 2);
  geometries.push(fallenBranchGeo);
  const fallenBranches = new THREE.InstancedMesh(fallenBranchGeo, barkMat, deadBranchCount);
  for (let i = 0; i < deadBranchCount; i++) {
    const fx = (rand() - 0.5) * 32;
    const fz = (rand() - 0.5) * 32;
    // Keep concrete south path uncluttered
    const safeX = Math.abs(fx) < 2.2 && fz > 4 ? (fx >= 0 ? 3.2 : -3.2) : fx;
    dummy.position.set(safeX, groundHeightAt(safeX, fz) + 0.05, fz);
    dummy.rotation.set((rand() - 0.5) * 0.15, rand() * Math.PI * 2, (rand() - 0.5) * 0.15);
    dummy.scale.setScalar(0.65 + rand() * 0.75);
    dummy.updateMatrix();
    fallenBranches.setMatrixAt(i, dummy.matrix);
  }
  fallenBranches.instanceMatrix.needsUpdate = true;
  fallenBranches.computeBoundingSphere();
  group.add(fallenBranches);

  return {
    group,
    colliders,
    update: (elapsedTime: number) => {
      for (let i = 0; i < swayCanopies.length; i++) {
        const s = swayCanopies[i];
        s.obj.rotation.z = s.baseRotZ + Math.sin(elapsedTime * 0.9 + s.phase) * 0.025;
      }
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
