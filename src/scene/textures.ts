import * as THREE from 'three';

export interface ProceduralTextureBundle {
  groundAlbedo: THREE.CanvasTexture;
  groundBump: THREE.CanvasTexture;
  rubberAlbedo: THREE.CanvasTexture;
  rubberBump: THREE.CanvasTexture;
  concreteAlbedo: THREE.CanvasTexture;
  concreteBump: THREE.CanvasTexture;
  rustedMetalAlbedo: THREE.CanvasTexture;
  rustedMetalBump: THREE.CanvasTexture;
  paintedGreenMetalAlbedo: THREE.CanvasTexture;
  paintedRedMetalAlbedo: THREE.CanvasTexture;
  woodAlbedo: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  barkAlbedo: THREE.CanvasTexture;
  barkBump: THREE.CanvasTexture;
  foliageAlbedo: THREE.CanvasTexture;
  posterTexture: THREE.Texture;
  crayonSketchTexture: THREE.CanvasTexture;
  surveillancePhotoTexture: THREE.CanvasTexture;
  jimmyPhotoTexture: THREE.CanvasTexture;
  caretakerLogTexture: THREE.CanvasTexture;
  webbedPrintsTexture: THREE.CanvasTexture;
  carouselScratchesTexture: THREE.CanvasTexture;
  mistTexture: THREE.CanvasTexture;
  puddleAlpha: THREE.CanvasTexture;
  lightConeAlpha: THREE.CanvasTexture;
  chainLinkAlpha: THREE.CanvasTexture;
  dispose: () => void;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function configureTexture<T extends THREE.Texture>(
  tex: T,
  options: { srgb?: boolean; repeatX?: number; repeatY?: number; maxAniso?: number } = {},
): T {
  const { srgb = false, repeatX = 1, repeatY = 1, maxAniso = 4 } = options;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createPlaygroundTextures(maxAnisotropy: number): ProceduralTextureBundle {
  const allTextures: THREE.Texture[] = [];
  const track = <T extends THREE.Texture>(t: T): T => {
    allTextures.push(t);
    return t;
  };

  // 1. Mud / Grass Soil Ground Maps
  const [gCan, gCtx] = makeCanvas(512, 512);
  const [gbCan, gbCtx] = makeCanvas(512, 512);
  const randG = seededRandom(1994);
  gCtx.fillStyle = '#1f231c';
  gCtx.fillRect(0, 0, 512, 512);
  gbCtx.fillStyle = '#808080';
  gbCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4200; i++) {
    const x = randG() * 512;
    const y = randG() * 512;
    const r = 1.5 + randG() * 7;
    const tone = randG();
    gCtx.fillStyle =
      tone < 0.35
        ? 'rgba(20, 22, 17, 0.45)'
        : tone < 0.7
          ? 'rgba(42, 37, 29, 0.38)'
          : 'rgba(48, 56, 38, 0.32)';
    gCtx.beginPath();
    gCtx.arc(x, y, r, 0, Math.PI * 2);
    gCtx.fill();

    const bv = Math.floor(85 + randG() * 90);
    gbCtx.fillStyle = `rgba(${bv},${bv},${bv},0.35)`;
    gbCtx.beginPath();
    gbCtx.arc(x, y, r * 0.9, 0, Math.PI * 2);
    gbCtx.fill();
  }
  // Organic mulch/grass flecks
  for (let i = 0; i < 900; i++) {
    const x = randG() * 512;
    const y = randG() * 512;
    const ang = randG() * Math.PI * 2;
    const len = 4 + randG() * 10;
    gCtx.strokeStyle = randG() > 0.5 ? 'rgba(68, 58, 42, 0.42)' : 'rgba(38, 49, 31, 0.48)';
    gCtx.lineWidth = 1.2;
    gCtx.beginPath();
    gCtx.moveTo(x, y);
    gCtx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    gCtx.stroke();
  }
  const groundAlbedo = track(
    configureTexture(new THREE.CanvasTexture(gCan), {
      srgb: true,
      repeatX: 16,
      repeatY: 16,
      maxAniso: maxAnisotropy,
    }),
  );
  const groundBump = track(
    configureTexture(new THREE.CanvasTexture(gbCan), {
      srgb: false,
      repeatX: 16,
      repeatY: 16,
      maxAniso: maxAnisotropy,
    }),
  );

  // 2. Cracked Dark Playground Rubber Pad
  const [rCan, rCtx] = makeCanvas(512, 512);
  const [rbCan, rbCtx] = makeCanvas(512, 512);
  const randR = seededRandom(441);
  rCtx.fillStyle = '#1b1d1f';
  rCtx.fillRect(0, 0, 512, 512);
  rbCtx.fillStyle = '#909090';
  rbCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6500; i++) {
    const x = randR() * 512;
    const y = randR() * 512;
    const v = 22 + Math.floor(randR() * 24);
    rCtx.fillStyle = `rgb(${v},${v + 2},${v + 3})`;
    rCtx.fillRect(x, y, 2.2, 2.2);
    const bv = 100 + Math.floor(randR() * 90);
    rbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    rbCtx.fillRect(x, y, 2.2, 2.2);
  }
  // Cracks and moss streaks
  for (let c = 0; c < 18; c++) {
    let cx = randR() * 512;
    let cy = randR() * 512;
    rCtx.strokeStyle = 'rgba(8, 10, 11, 0.85)';
    rCtx.lineWidth = 1.4 + randR() * 1.5;
    rbCtx.strokeStyle = 'rgb(20,20,20)';
    rbCtx.lineWidth = 2;
    rCtx.beginPath();
    rbCtx.beginPath();
    rCtx.moveTo(cx, cy);
    rbCtx.moveTo(cx, cy);
    for (let s = 0; s < 8; s++) {
      cx += (randR() - 0.5) * 44;
      cy += (randR() - 0.5) * 44;
      rCtx.lineTo(cx, cy);
      rbCtx.lineTo(cx, cy);
    }
    rCtx.stroke();
    rbCtx.stroke();
  }
  const rubberAlbedo = track(
    configureTexture(new THREE.CanvasTexture(rCan), {
      srgb: true,
      repeatX: 6,
      repeatY: 6,
      maxAniso: maxAnisotropy,
    }),
  );
  const rubberBump = track(
    configureTexture(new THREE.CanvasTexture(rbCan), {
      srgb: false,
      repeatX: 6,
      repeatY: 6,
      maxAniso: maxAnisotropy,
    }),
  );

  // 3. Cracked Concrete Walkway
  const [cCan, cCtx] = makeCanvas(512, 512);
  const [cbCan, cbCtx] = makeCanvas(512, 512);
  const randC = seededRandom(89);
  cCtx.fillStyle = '#474b4e';
  cCtx.fillRect(0, 0, 512, 512);
  cbCtx.fillStyle = '#8a8a8a';
  cbCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3800; i++) {
    const x = randC() * 512;
    const y = randC() * 512;
    const v = 55 + Math.floor(randC() * 34);
    cCtx.fillStyle = `rgba(${v},${v + 2},${v},0.35)`;
    cCtx.fillRect(x, y, 3, 3);
  }
  // Slab joints & moss
  cCtx.strokeStyle = 'rgba(20,22,20,0.75)';
  cCtx.lineWidth = 4;
  cbCtx.strokeStyle = 'rgb(24,24,24)';
  cbCtx.lineWidth = 5;
  for (const yJoint of [128, 256, 384]) {
    cCtx.beginPath();
    cCtx.moveTo(0, yJoint);
    cCtx.lineTo(512, yJoint);
    cCtx.stroke();
    cbCtx.beginPath();
    cbCtx.moveTo(0, yJoint);
    cbCtx.lineTo(512, yJoint);
    cbCtx.stroke();
  }
  for (let i = 0; i < 35; i++) {
    cCtx.fillStyle = 'rgba(38, 49, 29, 0.25)';
    cCtx.beginPath();
    cCtx.arc(randC() * 512, (Math.floor(randC() * 3) + 1) * 128 + (randC() - 0.5) * 10, 6 + randC() * 14, 0, Math.PI * 2);
    cCtx.fill();
  }
  const concreteAlbedo = track(
    configureTexture(new THREE.CanvasTexture(cCan), {
      srgb: true,
      repeatX: 2,
      repeatY: 6,
      maxAniso: maxAnisotropy,
    }),
  );
  const concreteBump = track(
    configureTexture(new THREE.CanvasTexture(cbCan), {
      srgb: false,
      repeatX: 2,
      repeatY: 6,
      maxAniso: maxAnisotropy,
    }),
  );

  // 4. Rusted Steel & Painted Metal Variations
  const makeMetalAlbedo = (baseHex: string, seed: number) => {
    const [mCan, mCtx] = makeCanvas(512, 512);
    const randM = seededRandom(seed);
    mCtx.fillStyle = baseHex;
    mCtx.fillRect(0, 0, 512, 512);
    // Brushed grime
    for (let i = 0; i < 900; i++) {
      mCtx.fillStyle = randM() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
      mCtx.fillRect(randM() * 512, randM() * 512, 2 + randM() * 35, 1.5);
    }
    // Rust patches & drip streaks
    for (let i = 0; i < 220; i++) {
      const rx = randM() * 512;
      const ry = randM() * 512;
      const rr = 4 + randM() * 22;
      mCtx.fillStyle =
        randM() > 0.45 ? 'rgba(98, 43, 21, 0.45)' : 'rgba(68, 28, 15, 0.52)';
      mCtx.beginPath();
      mCtx.arc(rx, ry, rr, 0, Math.PI * 2);
      mCtx.fill();
      if (randM() > 0.65) {
        mCtx.fillRect(rx - 1.5, ry, 3, 18 + randM() * 48);
      }
    }
    return track(
      configureTexture(new THREE.CanvasTexture(mCan), {
        srgb: true,
        repeatX: 2,
        repeatY: 2,
        maxAniso: maxAnisotropy,
      }),
    );
  };

  const [mbCan, mbCtx] = makeCanvas(256, 256);
  const randMB = seededRandom(512);
  mbCtx.fillStyle = '#808080';
  mbCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    const v = 50 + Math.floor(randMB() * 140);
    mbCtx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    mbCtx.fillRect(randMB() * 256, randMB() * 256, 3 + randMB() * 8, 2);
  }
  const rustedMetalBump = track(
    configureTexture(new THREE.CanvasTexture(mbCan), {
      srgb: false,
      repeatX: 2,
      repeatY: 2,
      maxAniso: maxAnisotropy,
    }),
  );
  const rustedMetalAlbedo = makeMetalAlbedo('#555b60', 301);
  const paintedGreenMetalAlbedo = makeMetalAlbedo('#31443c', 302);
  const paintedRedMetalAlbedo = makeMetalAlbedo('#5c2925', 303);

  // 5. Weathered Wood Planks (Benches, Seesaw, Borders)
  const [wCan, wCtx] = makeCanvas(512, 512);
  const [wbCan, wbCtx] = makeCanvas(512, 512);
  const randW = seededRandom(777);
  wCtx.fillStyle = '#4c3e30';
  wCtx.fillRect(0, 0, 512, 512);
  wbCtx.fillStyle = '#808080';
  wbCtx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 3) {
    const tone = 42 + Math.floor(randW() * 26);
    wCtx.fillStyle = `rgba(${tone + 14},${tone + 4},${tone - 6},0.45)`;
    wCtx.fillRect(0, y, 512, 2);
    const bv = 90 + Math.floor(randW() * 70);
    wbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    wbCtx.fillRect(0, y, 512, 2);
  }
  // Rot & damp stains
  for (let i = 0; i < 80; i++) {
    wCtx.fillStyle = 'rgba(20, 18, 14, 0.35)';
    wCtx.beginPath();
    wCtx.ellipse(randW() * 512, randW() * 512, 18 + randW() * 40, 4 + randW() * 10, 0, 0, Math.PI * 2);
    wCtx.fill();
  }
  const woodAlbedo = track(
    configureTexture(new THREE.CanvasTexture(wCan), {
      srgb: true,
      repeatX: 2,
      repeatY: 2,
      maxAniso: maxAnisotropy,
    }),
  );
  const woodBump = track(
    configureTexture(new THREE.CanvasTexture(wbCan), {
      srgb: false,
      repeatX: 2,
      repeatY: 2,
      maxAniso: maxAnisotropy,
    }),
  );

  // 6. Tree Bark
  const [bkCan, bkCtx] = makeCanvas(256, 512);
  const [bkbCan, bkbCtx] = makeCanvas(256, 512);
  const randBk = seededRandom(614);
  bkCtx.fillStyle = '#2b241d';
  bkCtx.fillRect(0, 0, 256, 512);
  bkbCtx.fillStyle = '#757575';
  bkbCtx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 380; i++) {
    const x = randBk() * 256;
    const y = randBk() * 512;
    const h = 25 + randBk() * 75;
    bkCtx.fillStyle = randBk() > 0.35 ? 'rgba(18,14,10,0.58)' : 'rgba(54,48,38,0.4)';
    bkCtx.fillRect(x, y, 3 + randBk() * 6, h);
    const bv = randBk() > 0.5 ? 40 : 190;
    bkbCtx.fillStyle = `rgba(${bv},${bv},${bv},0.55)`;
    bkbCtx.fillRect(x, y, 4 + randBk() * 5, h);
  }
  const barkAlbedo = track(
    configureTexture(new THREE.CanvasTexture(bkCan), {
      srgb: true,
      repeatX: 2,
      repeatY: 3,
      maxAniso: maxAnisotropy,
    }),
  );
  const barkBump = track(
    configureTexture(new THREE.CanvasTexture(bkbCan), {
      srgb: false,
      repeatX: 2,
      repeatY: 3,
      maxAniso: maxAnisotropy,
    }),
  );

  // 7. Foliage Canopy Texture
  const [flCan, flCtx] = makeCanvas(256, 256);
  const randFl = seededRandom(901);
  flCtx.fillStyle = '#1d281b';
  flCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const shade = randFl();
    flCtx.fillStyle =
      shade < 0.4 ? '#151d13' : shade < 0.78 ? '#243121' : '#313d27';
    flCtx.beginPath();
    flCtx.arc(randFl() * 256, randFl() * 256, 4 + randFl() * 9, 0, Math.PI * 2);
    flCtx.fill();
  }
  const foliageAlbedo = track(
    configureTexture(new THREE.CanvasTexture(flCan), {
      srgb: true,
      repeatX: 1,
      repeatY: 1,
      maxAniso: maxAnisotropy,
    }),
  );

  // 8. Missing Child Poster (Unified 1994 Jimmy Mercer procedural weathered flyer)
  const [pCan, pCtx] = makeCanvas(256, 320);
  pCtx.fillStyle = '#cfc5b1';
  pCtx.fillRect(0, 0, 256, 320);
  // Water stains & aged corners
  pCtx.fillStyle = 'rgba(72, 56, 38, 0.24)';
  pCtx.beginPath();
  pCtx.arc(40, 280, 55, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.fillStyle = '#181818';
  pCtx.font = 'bold 34px Georgia, serif';
  pCtx.textAlign = 'center';
  pCtx.fillText('MISSING', 128, 42);
  pCtx.fillStyle = '#1d1d1d';
  pCtx.fillRect(36, 56, 184, 150);
  // Child silhouette with scratched-out face & small yellow duck
  pCtx.fillStyle = '#09090b';
  pCtx.beginPath();
  pCtx.arc(128, 108, 24, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.fillRect(98, 134, 60, 62);
  pCtx.strokeStyle = '#d4d0c5';
  pCtx.lineWidth = 2;
  for (let s = 0; s < 14; s++) {
    pCtx.beginPath();
    pCtx.moveTo(96 + (s % 3) * 8, 88 + s * 3.5);
    pCtx.lineTo(156 - (s % 2) * 10, 92 + s * 3.5);
    pCtx.stroke();
  }
  pCtx.fillStyle = '#c89b1e';
  pCtx.beginPath();
  pCtx.arc(128, 176, 12, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.fillStyle = '#1f1b17';
  pCtx.font = 'bold 14px monospace';
  pCtx.fillText('JIMMY MERCER // AGE 5', 128, 232);
  pCtx.font = '12px monospace';
  pCtx.fillText('NOV 12 1994 · MILLERS CREEK', 128, 254);
  pCtx.fillStyle = '#7e1717';
  pCtx.font = 'bold 11px monospace';
  pCtx.fillText('CASE FILE #89-DUCK', 128, 286);

  const posterCanvasTex = new THREE.CanvasTexture(pCan);
  posterCanvasTex.colorSpace = THREE.SRGBColorSpace;
  posterCanvasTex.needsUpdate = true;
  const posterTexture = track(posterCanvasTex);

  // 9. Child's Crayon Sketch ("HE IS WATCHING")
  const [skCan, skCtx] = makeCanvas(256, 256);
  skCtx.fillStyle = '#d6ccb4';
  skCtx.fillRect(0, 0, 256, 256);
  // Stains
  skCtx.fillStyle = 'rgba(92, 74, 48, 0.28)';
  skCtx.beginPath();
  skCtx.arc(60, 200, 42, 0, Math.PI * 2);
  skCtx.fill();
  // Jagged charcoal duck figure
  skCtx.strokeStyle = '#1e1b18';
  skCtx.lineWidth = 5;
  skCtx.beginPath();
  skCtx.arc(128, 125, 36, 0, Math.PI * 2);
  skCtx.stroke();
  skCtx.fillStyle = '#d29b22';
  skCtx.beginPath();
  skCtx.moveTo(156, 120);
  skCtx.lineTo(192, 132);
  skCtx.lineTo(156, 144);
  skCtx.closePath();
  skCtx.fill();
  skCtx.fillStyle = '#8b1e1e';
  skCtx.font = 'bold 20px monospace';
  skCtx.textAlign = 'center';
  skCtx.fillText('HE IS WATCHING', 128, 44);
  skCtx.fillStyle = '#1f1c18';
  skCtx.font = '13px monospace';
  skCtx.fillText('J. MERCER // 11-10-94', 128, 232);
  const crayonSketchTexture = track(
    configureTexture(new THREE.CanvasTexture(skCan), {
      srgb: true,
      maxAniso: maxAnisotropy,
    }),
  );

  // 9b. 1994/1996 Treeline Surveillance Photo (Shed)
  const [spCan, spCtx] = makeCanvas(256, 256);
  spCtx.fillStyle = '#111417';
  spCtx.fillRect(0, 0, 256, 256);
  spCtx.fillStyle = '#d7d1c3';
  spCtx.fillRect(10, 10, 236, 236);
  spCtx.fillStyle = '#181b1e';
  spCtx.fillRect(20, 20, 216, 174);
  // Dark pines silhouette & eerie child silhouette by fence
  spCtx.fillStyle = '#090b0d';
  for (let i = 0; i < 8; i++) {
    spCtx.beginPath();
    spCtx.moveTo(22 + i * 28, 164);
    spCtx.lineTo(36 + i * 28, 60 + (i % 3) * 14);
    spCtx.lineTo(50 + i * 28, 164);
    spCtx.fill();
  }
  spCtx.fillStyle = '#53595e';
  spCtx.fillRect(20, 162, 216, 32);
  spCtx.fillStyle = '#070809';
  spCtx.beginPath();
  spCtx.arc(146, 134, 9, 0, Math.PI * 2);
  spCtx.fill();
  spCtx.fillRect(138, 144, 16, 30);
  spCtx.fillStyle = '#9b7b1f';
  spCtx.beginPath();
  spCtx.arc(105, 169, 6, 0, Math.PI * 2);
  spCtx.fill();
  spCtx.fillStyle = '#241e18';
  spCtx.font = 'bold 11px monospace';
  spCtx.textAlign = 'center';
  spCtx.fillText('SURVEILLANCE // 1994-12-01', 128, 214);
  spCtx.font = '10px monospace';
  spCtx.fillText('19 DAYS POST-DISAPPEARANCE', 128, 232);
  const surveillancePhotoTexture = track(
    configureTexture(new THREE.CanvasTexture(spCan), {
      srgb: true,
      maxAniso: maxAnisotropy,
    }),
  );

  // 9c. 1994 Original Jimmy Portrait (Caretaker's House)
  const [jpCan, jpCtx] = makeCanvas(256, 256);
  jpCtx.fillStyle = '#dfd6c2';
  jpCtx.fillRect(0, 0, 256, 256);
  jpCtx.fillStyle = '#252629';
  jpCtx.fillRect(26, 22, 204, 168);
  jpCtx.fillStyle = '#78685a';
  jpCtx.beginPath();
  jpCtx.arc(128, 86, 26, 0, Math.PI * 2);
  jpCtx.fill();
  jpCtx.fillStyle = '#404a54';
  jpCtx.fillRect(92, 114, 72, 66);
  jpCtx.fillStyle = '#d4a326';
  jpCtx.beginPath();
  jpCtx.arc(142, 152, 14, 0, Math.PI * 2);
  jpCtx.fill();
  jpCtx.strokeStyle = '#991b1b';
  jpCtx.lineWidth = 2.5;
  jpCtx.beginPath();
  jpCtx.arc(142, 152, 24, 0, Math.PI * 2);
  jpCtx.stroke();
  jpCtx.fillStyle = '#1b1a17';
  jpCtx.font = 'bold 12px monospace';
  jpCtx.textAlign = 'center';
  jpCtx.fillText('JIMMY MERCER · OCT 1994', 128, 214);
  jpCtx.font = '10px monospace';
  jpCtx.fillText('BEFORE HE STOPPED SPEAKING', 128, 232);
  const jimmyPhotoTexture = track(
    configureTexture(new THREE.CanvasTexture(jpCan), {
      srgb: true,
      maxAniso: maxAnisotropy,
    }),
  );

  // 9d. Caretaker's 1994/1996 Incident Logbook Page
  const [clgCan, clgCtx] = makeCanvas(256, 256);
  clgCtx.fillStyle = '#d1c6ad';
  clgCtx.fillRect(0, 0, 256, 256);
  clgCtx.strokeStyle = 'rgba(72, 92, 115, 0.45)';
  clgCtx.lineWidth = 1;
  for (let y = 32; y < 240; y += 18) {
    clgCtx.beginPath();
    clgCtx.moveTo(16, y);
    clgCtx.lineTo(240, y);
    clgCtx.stroke();
  }
  clgCtx.fillStyle = '#201c18';
  clgCtx.font = 'bold 13px monospace';
  clgCtx.fillText('GROUNDSMAN LOG // 1994', 22, 28);
  clgCtx.font = '11px monospace';
  clgCtx.fillText('Nov 13: Boy never spoke', 22, 64);
  clgCtx.fillText('again after the drain.', 22, 82);
  clgCtx.fillText('Something out by the', 22, 118);
  clgCtx.fillText('north fence keeps using', 22, 136);
  clgCtx.fillText('a child laugh.', 22, 154);
  clgCtx.fillStyle = '#7e1717';
  clgCtx.fillText('JULIAN 1996: CHECK DRAIN', 22, 206);
  const caretakerLogTexture = track(
    configureTexture(new THREE.CanvasTexture(clgCan), {
      srgb: true,
      maxAniso: maxAnisotropy,
    }),
  );

  // 10. Webbed Three-Toed Mud Impressions Decal
  const [wpCan, wpCtx] = makeCanvas(512, 512);
  wpCtx.clearRect(0, 0, 512, 512);
  const drawPrint = (cx: number, cy: number, rot: number) => {
    wpCtx.save();
    wpCtx.translate(cx, cy);
    wpCtx.rotate(rot);
    wpCtx.fillStyle = 'rgba(10, 9, 7, 0.88)';
    wpCtx.beginPath();
    wpCtx.moveTo(0, 32);
    wpCtx.lineTo(-34, -22);
    wpCtx.quadraticCurveTo(-15, -14, 0, -34);
    wpCtx.quadraticCurveTo(15, -14, 34, -22);
    wpCtx.closePath();
    wpCtx.fill();
    wpCtx.restore();
  };
  drawPrint(150, 380, -0.35);
  drawPrint(235, 290, -0.25);
  drawPrint(305, 195, -0.32);
  drawPrint(385, 105, -0.22);
  const webbedPrintsTexture = track(
    configureTexture(new THREE.CanvasTexture(wpCan), {
      srgb: true,
      maxAniso: maxAnisotropy,
    }),
  );
  webbedPrintsTexture.wrapS = THREE.ClampToEdgeWrapping;
  webbedPrintsTexture.wrapT = THREE.ClampToEdgeWrapping;

  // 11. Carousel Concentric Markings Decal
  const [csCan, csCtx] = makeCanvas(512, 512);
  csCtx.clearRect(0, 0, 512, 512);
  csCtx.strokeStyle = 'rgba(165, 145, 118, 0.34)';
  csCtx.lineWidth = 3;
  csCtx.setLineDash([14, 10]);
  csCtx.beginPath();
  csCtx.arc(256, 256, 210, 0, Math.PI * 2);
  csCtx.stroke();
  csCtx.beginPath();
  csCtx.arc(256, 256, 170, 0, Math.PI * 2);
  csCtx.stroke();
  csCtx.setLineDash([]);
  csCtx.strokeStyle = 'rgba(140, 28, 24, 0.38)';
  csCtx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    csCtx.beginPath();
    csCtx.moveTo(256 + Math.cos(a) * 145, 256 + Math.sin(a) * 145);
    csCtx.lineTo(256 + Math.cos(a) * 238, 256 + Math.sin(a) * 238);
    csCtx.stroke();
  }
  const carouselScratchesTexture = track(
    configureTexture(new THREE.CanvasTexture(csCan), {
      srgb: true,
      maxAniso: maxAnisotropy,
    }),
  );
  carouselScratchesTexture.wrapS = THREE.ClampToEdgeWrapping;
  carouselScratchesTexture.wrapT = THREE.ClampToEdgeWrapping;

  // 12. Soft Radial Ground Mist Texture
  const [msCan, msCtx] = makeCanvas(256, 256);
  const grad = msCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(182, 198, 212, 0.28)');
  grad.addColorStop(0.55, 'rgba(130, 148, 166, 0.10)');
  grad.addColorStop(1, 'rgba(130, 148, 166, 0)');
  msCtx.fillStyle = grad;
  msCtx.fillRect(0, 0, 256, 256);
  const mistTexture = track(
    configureTexture(new THREE.CanvasTexture(msCan), {
      srgb: true,
      maxAniso: 1,
    }),
  );
  mistTexture.wrapS = THREE.ClampToEdgeWrapping;
  mistTexture.wrapT = THREE.ClampToEdgeWrapping;

  // 12b. Irregular Organic Puddle Alpha Mask (feathered jagged shoreline)
  const [paCan, paCtx] = makeCanvas(256, 256);
  const randPa = seededRandom(519);
  paCtx.fillStyle = '#000000';
  paCtx.fillRect(0, 0, 256, 256);
  paCtx.save();
  paCtx.translate(128, 128);
  paCtx.beginPath();
  const lobes = 28;
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const r =
      72 +
      Math.sin(a * 3 + 0.7) * 16 +
      Math.cos(a * 5 - 1.1) * 11 +
      (randPa() - 0.5) * 12;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * 0.88;
    if (i === 0) paCtx.moveTo(px, py);
    else paCtx.lineTo(px, py);
  }
  paCtx.closePath();
  const paGrad = paCtx.createRadialGradient(0, 0, 18, 0, 0, 108);
  paGrad.addColorStop(0, '#ffffff');
  paGrad.addColorStop(0.68, '#d4d4d4');
  paGrad.addColorStop(1, '#000000');
  paCtx.fillStyle = paGrad;
  paCtx.fill();
  paCtx.restore();
  const puddleAlpha = track(
    configureTexture(new THREE.CanvasTexture(paCan), {
      srgb: false,
      maxAniso: maxAnisotropy,
    }),
  );
  puddleAlpha.wrapS = THREE.ClampToEdgeWrapping;
  puddleAlpha.wrapT = THREE.ClampToEdgeWrapping;

  // 12c. Soft Vertical Light Cone Haze Alpha (fades gently toward ground)
  const [lcCan, lcCtx] = makeCanvas(128, 256);
  const lcGrad = lcCtx.createLinearGradient(0, 0, 0, 256);
  lcGrad.addColorStop(0.0, 'rgba(255,255,255,0.95)');
  lcGrad.addColorStop(0.25, 'rgba(255,255,255,0.48)');
  lcGrad.addColorStop(0.75, 'rgba(255,255,255,0.12)');
  lcGrad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  lcCtx.fillStyle = lcGrad;
  lcCtx.fillRect(0, 0, 128, 256);
  const lightConeAlpha = track(
    configureTexture(new THREE.CanvasTexture(lcCan), {
      srgb: false,
      maxAniso: 1,
    }),
  );
  lightConeAlpha.wrapS = THREE.ClampToEdgeWrapping;
  lightConeAlpha.wrapT = THREE.ClampToEdgeWrapping;

  // 13. Chain-Link Wire Fence Alpha Texture
  const [clCan, clCtx] = makeCanvas(128, 128);
  clCtx.fillStyle = '#000000';
  clCtx.fillRect(0, 0, 128, 128);
  clCtx.strokeStyle = '#ffffff';
  clCtx.lineWidth = 3;
  for (let i = -128; i < 256; i += 16) {
    clCtx.beginPath();
    clCtx.moveTo(i, 0);
    clCtx.lineTo(i + 128, 128);
    clCtx.stroke();
    clCtx.beginPath();
    clCtx.moveTo(i + 128, 0);
    clCtx.lineTo(i, 128);
    clCtx.stroke();
  }
  const chainLinkAlpha = track(
    configureTexture(new THREE.CanvasTexture(clCan), {
      srgb: false,
      repeatX: 6,
      repeatY: 3,
      maxAniso: maxAnisotropy,
    }),
  );

  return {
    groundAlbedo,
    groundBump,
    rubberAlbedo,
    rubberBump,
    concreteAlbedo,
    concreteBump,
    rustedMetalAlbedo,
    rustedMetalBump,
    paintedGreenMetalAlbedo,
    paintedRedMetalAlbedo,
    woodAlbedo,
    woodBump,
    barkAlbedo,
    barkBump,
    foliageAlbedo,
    posterTexture,
    crayonSketchTexture,
    surveillancePhotoTexture,
    jimmyPhotoTexture,
    caretakerLogTexture,
    webbedPrintsTexture,
    carouselScratchesTexture,
    mistTexture,
    puddleAlpha,
    lightConeAlpha,
    chainLinkAlpha,
    dispose: () => {
      allTextures.forEach((t) => t.dispose());
    },
  };
}
