import * as THREE from 'three';
import { InteractableTarget } from './sceneTypes';
import { ProceduralTextureBundle } from './textures';
import { groundHeightAt } from './worldMath';

export interface TerrainBuildResult {
  group: THREE.Group;
  interactables: InteractableTarget[];
  dispose: () => void;
}

export function buildPlaygroundTerrain(textures: ProceduralTextureBundle): TerrainBuildResult {
  const group = new THREE.Group();
  group.name = 'playground-terrain';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const interactables: InteractableTarget[] = [];

  // 1. Sculpted 140m x 140m ground terrain covering Playground, Caretaker's House, Drainage Tunnels, and Final Forest
  const terrainGeo = new THREE.PlaneGeometry(140, 140, 112, 112);
  terrainGeo.rotateX(-Math.PI / 2);
  terrainGeo.translate(-8, 0, -18);
  geometries.push(terrainGeo);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const colorArray = new Float32Array(posAttr.count * 3);
  const cMud = new THREE.Color(0x52483c);
  const cGrass = new THREE.Color(0x3f4c34);
  const cCreek = new THREE.Color(0x2c302b);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = groundHeightAt(x, z);
    posAttr.setY(i, y);

    const dist = Math.hypot(x, z + 1);
    const puddleFactor = Math.max(0, 1 - Math.hypot(x - 0.8, z - 0.8) / 4.2);
    const grassFactor = Math.max(0, Math.min(1, (dist - 8) / 14));
    tmpColor.copy(cMud).lerp(cGrass, grassFactor * 0.85);
    tmpColor.lerp(cCreek, puddleFactor * 0.72);

    colorArray[i * 3] = tmpColor.r;
    colorArray[i * 3 + 1] = tmpColor.g;
    colorArray[i * 3 + 2] = tmpColor.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: textures.groundAlbedo,
    bumpMap: textures.groundBump,
    bumpScale: 0.08,
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
  });
  materials.push(terrainMat);

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 2. Central Cracked Rubber Safety Pad + Timber Border Curb (under Swing Set & Slide landing)
  const padGeo = new THREE.PlaneGeometry(14.6, 13.4, 24, 24);
  padGeo.rotateX(-Math.PI / 2);
  const padPos = padGeo.attributes.position as THREE.BufferAttribute;
  const padCenterX = -5.6;
  const padCenterZ = -3.8;
  for (let i = 0; i < padPos.count; i++) {
    const wx = padPos.getX(i) + padCenterX;
    const wz = padPos.getZ(i) + padCenterZ;
    padPos.setY(i, groundHeightAt(wx, wz) + 0.025);
  }
  padGeo.computeVertexNormals();
  geometries.push(padGeo);

  const padMat = new THREE.MeshStandardMaterial({
    map: textures.rubberAlbedo,
    bumpMap: textures.rubberBump,
    bumpScale: 0.04,
    color: 0x8e9195,
    roughness: 0.78,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  materials.push(padMat);

  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.position.set(padCenterX, 0, padCenterZ);
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // Timber curb sleepers enclosing the play pit (matching Stitch CCTV frame)
  const timberMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    bumpMap: textures.woodBump,
    bumpScale: 0.03,
    roughness: 0.88,
    metalness: 0.02,
  });
  materials.push(timberMat);

  const curbSpecs: Array<[number, number, number, number]> = [
    [padCenterX, padCenterZ - 6.7, 14.8, 0.22],
    [padCenterX, padCenterZ + 6.7, 14.8, 0.22],
    [padCenterX - 7.3, padCenterZ, 0.22, 13.6],
    [padCenterX + 7.3, padCenterZ, 0.22, 13.6],
  ];
  for (const [cx, cz, w, d] of curbSpecs) {
    const beamGeo = new THREE.BoxGeometry(w, 0.16, d);
    geometries.push(beamGeo);
    const beam = new THREE.Mesh(beamGeo, timberMat);
    beam.position.set(cx, groundHeightAt(cx, cz) + 0.08, cz);
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);
  }

  // 3. South Cracked Concrete Entry Walkway leading straight toward the central playground
  const pathGeo = new THREE.PlaneGeometry(3.2, 14.2, 8, 28);
  pathGeo.rotateX(-Math.PI / 2);
  const pathPos = pathGeo.attributes.position as THREE.BufferAttribute;
  const pathZCenter = 11.4;
  for (let i = 0; i < pathPos.count; i++) {
    const wx = pathPos.getX(i);
    const wz = pathPos.getZ(i) + pathZCenter;
    pathPos.setY(i, groundHeightAt(wx, wz) + 0.03);
  }
  pathGeo.computeVertexNormals();
  geometries.push(pathGeo);

  const pathMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    bumpMap: textures.concreteBump,
    bumpScale: 0.05,
    color: 0xa2a5a6,
    roughness: 0.72,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  materials.push(pathMat);

  const pathMesh = new THREE.Mesh(pathGeo, pathMat);
  pathMesh.position.set(0, 0, pathZCenter);
  pathMesh.receiveShadow = true;
  group.add(pathMesh);

  // 4. Reflective Wet Rainwater Puddles catching the sodium streetlight
  const puddleWetRimMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c0b,
    alphaMap: textures.puddleAlpha,
    transparent: true,
    opacity: 0.72,
    roughness: 0.42,
    metalness: 0.08,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x050709,
    alphaMap: textures.puddleAlpha,
    roughness: 0.14,
    metalness: 0.24,
    envMapIntensity: 0.42,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  materials.push(puddleWetRimMat, puddleMat);

  const puddleConfigs = [
    { x: 0.8, z: 0.8, rx: 4.5, rz: 3.7, rot: 0.35 },
    { x: -2.9, z: 1.9, rx: 3.0, rz: 2.4, rot: -0.45 },
    { x: 4.1, z: -2.2, rx: 3.5, rz: 2.7, rot: 0.8 },
  ];
  for (const p of puddleConfigs) {
    const pGeo = new THREE.PlaneGeometry(p.rx, p.rz);
    pGeo.rotateX(-Math.PI / 2);
    geometries.push(pGeo);
    const rim = new THREE.Mesh(pGeo, puddleWetRimMat);
    rim.position.set(p.x, groundHeightAt(p.x, p.z) + 0.028, p.z);
    rim.rotation.y = p.rot;
    rim.scale.set(1.16, 1, 1.16);
    rim.receiveShadow = true;

    const puddle = new THREE.Mesh(pGeo, puddleMat);
    puddle.position.set(p.x, groundHeightAt(p.x, p.z) + 0.032, p.z);
    puddle.rotation.y = p.rot;
    puddle.receiveShadow = true;
    group.add(rim, puddle);
  }

  // 5. Evidence #03: 14-inch Webbed Mud Impressions leading from puddle toward East carousel
  const printsGeo = new THREE.PlaneGeometry(3.4, 3.4);
  printsGeo.rotateX(-Math.PI / 2);
  geometries.push(printsGeo);

  const printsMat = new THREE.MeshStandardMaterial({
    map: textures.webbedPrintsTexture,
    transparent: true,
    alphaTest: 0.05,
    roughness: 0.35,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  materials.push(printsMat);

  const printsMesh = new THREE.Mesh(printsGeo, printsMat);
  const px = 2.6;
  const pz = 0.2;
  printsMesh.position.set(px, groundHeightAt(px, pz) + 0.04, pz);
  printsMesh.rotation.y = -0.3;
  group.add(printsMesh);

  interactables.push({
    id: 'webbed-puddle',
    evidenceId: 'clue-03-webbed-prints',
    keyLabel: 'E',
    verb: 'EXAMINE',
    label: 'WEBBED MUD IMPRESSIONS',
    detail: '14-inch three-toed tracks toward carousel',
    worldPosition: new THREE.Vector3(px, groundHeightAt(px, pz) + 0.15, pz),
    maxDistance: 4.0,
    raycastMeshes: [printsMesh],
  });

  // 6. Instanced Fallen Leaves scattered across concrete, mud, and rubber pad
  const leafGeo = new THREE.PlaneGeometry(0.16, 0.11);
  leafGeo.rotateX(-Math.PI / 2);
  geometries.push(leafGeo);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  materials.push(leafMat);

  const leafCount = 260;
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
  const dummy = new THREE.Object3D();
  const leafPalette = [
    new THREE.Color(0x4b3522),
    new THREE.Color(0x5c4224),
    new THREE.Color(0x3a2b1c),
    new THREE.Color(0x694d29),
  ];

  let seed = 347;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < leafCount; i++) {
    const lx = (nextRand() - 0.5) * 34;
    const lz = (nextRand() - 0.5) * 34;
    const ly = groundHeightAt(lx, lz) + 0.045;
    dummy.position.set(lx, ly, lz);
    dummy.rotation.set(
      (nextRand() - 0.5) * 0.25,
      nextRand() * Math.PI * 2,
      (nextRand() - 0.5) * 0.25,
    );
    const sc = 0.75 + nextRand() * 0.85;
    dummy.scale.set(sc, 1, sc * (0.8 + nextRand() * 0.4));
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    leaves.setColorAt(i, leafPalette[i % leafPalette.length]);
  }
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  leaves.computeBoundingSphere();
  group.add(leaves);

  return {
    group,
    interactables,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
