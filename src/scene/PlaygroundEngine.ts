import * as THREE from 'three';
import { horrorAudioEngine } from '../audio/horrorAudioEngine';
import { LocationId } from '../types/game';
import { createInitialDuckAiState, DuckAiSnapshot, stepDuckAI } from './duckAI';
import { buildLightingAndAtmosphere } from './lightingAndAtmosphere';
import { buildPerimeterAndProps } from './props';
import { EngineCallbacks, EngineSettingsSnapshot, InteractableTarget } from './sceneTypes';
import { buildCarouselAndDuck } from './structures/carouselAndDuck';
import { buildExpandedAreas } from './structures/expandedAreas';
import { buildSlideAndSeesaw } from './structures/slideAndSeesaw';
import { buildSwingSet } from './structures/swingSet';
import { buildPlaygroundTerrain } from './terrain';
import { createPlaygroundTextures } from './textures';
import { buildVegetation } from './vegetation';
import {
  BoxCollider,
  CircleCollider,
  detectLocationFromCoords,
  evaluateDuckGaze,
  EXPANDED_WORLD_BOUNDS,
  groundHeightAt,
  PLAYER_EYE_HEIGHT,
  PLAYER_RADIUS,
  resolvePlayerCollisions,
} from './worldMath';

export interface EngineProgressionSnapshot {
  shedUnlocked: boolean;
  caretakerUnlocked: boolean;
  tunnelsUnlocked: boolean;
  forestGateUnlocked: boolean;
  evidenceCount: number;
  paranoia: number;
  forestClimaxActive: boolean;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const rendererStr = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

export class PlaygroundEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private callbacks: EngineCallbacks;
  private settings: EngineSettingsSnapshot;
  private discoveredEvidenceIds: Set<string>;
  private isSoftwareGl: boolean;
  private gl2: WebGL2RenderingContext | null = null;

  private yaw = 0.14; // Facing North-Northwest toward swing set, streetlight, and slide
  private pitch = -0.02;
  private playerPos = new THREE.Vector3(0.4, groundHeightAt(0.4, 8.6) + PLAYER_EYE_HEIGHT, 8.6);
  private distanceWalked = 0;

  private keysPressed = new Set<string>();
  private isDraggingLook = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  private activeTarget: InteractableTarget | null = null;
  private lastPromptId: string | null = null;

  private circleColliders: CircleCollider[] = [];
  private boxColliders: BoxCollider[] = [];
  private interactables: InteractableTarget[] = [];
  private raycastMeshToTarget = new Map<THREE.Object3D, InteractableTarget>();

  private progression: EngineProgressionSnapshot = {
    shedUnlocked: false,
    caretakerUnlocked: false,
    tunnelsUnlocked: false,
    forestGateUnlocked: false,
    evidenceCount: 0,
    paranoia: 18,
    forestClimaxActive: false,
  };
  private duckAiState: DuckAiSnapshot = createInitialDuckAiState();
  private currentLocation: LocationId = 'playground';
  private climaxTriggered = false;
  private lampDipTimer = 0;

  // Scratch objects (zero per-frame allocations)
  private raycaster = new THREE.Raycaster();
  private screenCenter = new THREE.Vector2(0, 0);
  private forwardVec = new THREE.Vector3();
  private rightVec = new THREE.Vector3();
  private moveVec = new THREE.Vector3();
  private upAxis = new THREE.Vector3(0, 1, 0);
  private camForward3 = new THREE.Vector3();

  private disposed = false;
  private rafId: number | null = null;
  private timerId: number | null = null;
  private lastTickTimeMs = performance.now();
  private elapsedSeconds = 0;
  private resizeObserver: ResizeObserver;

  private cleanupFns: Array<() => void> = [];
  private updateHooks: Array<(dt: number, elapsed: number, isLookingAtDuck: boolean) => void> = [];
  private duckHeadWorldPos = new THREE.Vector3(8.5, 1.5, -4.6);

  constructor(
    container: HTMLElement,
    initialSettings: EngineSettingsSnapshot,
    initialDiscoveredIds: string[],
    callbacks: EngineCallbacks,
    initialProgression?: Partial<EngineProgressionSnapshot>,
  ) {
    this.container = container;
    this.settings = { ...initialSettings };
    this.discoveredEvidenceIds = new Set(initialDiscoveredIds);
    this.callbacks = callbacks;
    if (initialProgression) {
      this.progression = { ...this.progression, ...initialProgression };
    }

    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    const ctx = this.renderer.getContext();
    if (typeof WebGL2RenderingContext !== 'undefined' && ctx instanceof WebGL2RenderingContext) {
      this.gl2 = ctx;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 140);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    const maxAniso = this.isSoftwareGl
      ? 1
      : Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const textures = createPlaygroundTextures(maxAniso);
    this.cleanupFns.push(() => textures.dispose());

    // Build modular 3D playground stages
    const terrain = buildPlaygroundTerrain(textures);
    const swingSet = buildSwingSet(textures);
    const slideAndSeesaw = buildSlideAndSeesaw(textures);
    const carouselAndDuck = buildCarouselAndDuck(textures);
    const vegetation = buildVegetation(textures);
    const props = buildPerimeterAndProps(textures);
    const expandedAreas = buildExpandedAreas(textures);
    const atmosphere = buildLightingAndAtmosphere(
      this.scene,
      this.renderer,
      this.camera,
      textures,
      this.isSoftwareGl,
    );

    this.duckHeadWorldPos = carouselAndDuck.duckHeadWorldPos;

    this.scene.add(
      terrain.group,
      swingSet.group,
      slideAndSeesaw.group,
      carouselAndDuck.group,
      vegetation.group,
      props.group,
      expandedAreas.group,
      atmosphere.group,
    );

    this.cleanupFns.push(
      () => terrain.dispose(),
      () => swingSet.dispose(),
      () => slideAndSeesaw.dispose(),
      () => carouselAndDuck.dispose(),
      () => vegetation.dispose(),
      () => props.dispose(),
      () => expandedAreas.dispose(),
      () => atmosphere.dispose(),
    );

    // Register physical colliders (central playground + Caretaker's House + Drainage Tunnels + Final Forest)
    this.circleColliders = [
      ...vegetation.colliders,
      ...expandedAreas.circleColliders,
      { id: 'carousel-base', x: 8.4, z: -4.6, radius: 2.35 },
      { id: 'lamppost', x: -1.2, z: -8.6, radius: 0.3 },
      { id: 'swing-left-post', x: -5.8, z: -2.8, radius: 0.55 },
      { id: 'swing-right-post', x: -1.8, z: -1.6, radius: 0.55 },
      { id: 'slide-body', x: -8.6, z: -7.8, radius: 1.55 },
      { id: 'seesaw-base', x: -9.6, z: 3.2, radius: 1.1 },
    ];

    this.boxColliders = [
      ...props.boxColliders,
      ...expandedAreas.boxColliders,
      { id: 'fence-south-gate', minX: -2.6, maxX: 2.6, minZ: 19.25, maxZ: 19.75 },
    ];

    this.interactables = [
      ...swingSet.interactables,
      ...slideAndSeesaw.interactables,
      ...carouselAndDuck.interactables,
      ...terrain.interactables,
      ...props.interactables,
      ...expandedAreas.interactables,
    ];
    for (const item of this.interactables) {
      for (const m of item.raycastMeshes) {
        this.raycastMeshToTarget.set(m, item);
      }
    }

    this.updateHooks.push(
      (dt, elapsed) => swingSet.update(dt, elapsed),
      (dt, elapsed, isLooking) =>
        carouselAndDuck.update(dt, elapsed, isLooking, {
          anchorId: this.duckAiState.anchorId,
          x: this.duckAiState.x,
          z: this.duckAiState.z,
          yaw: this.duckAiState.yaw,
          visible: this.duckAiState.visible,
        }),
      (_dt, elapsed) => vegetation.update(elapsed),
      (dt) => props.update(dt, this.progression.shedUnlocked),
      (dt, elapsed) => expandedAreas.update(dt, elapsed, this.progression.forestGateUnlocked),
      (dt, elapsed) =>
        atmosphere.update(dt, elapsed, this.settings.flashlightOn, this.settings.reducedMotion),
    );

    // Connect interference reactions (swing push when duck interferes)
    this.swingSetPushFn = () => swingSet.pushSwing(1);

    // Bind listeners
    this.bindInputEvents();

    // Responsive container sizing
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    // Sync initial camera pose cleanly
    this.applyCameraPose(0);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextTick();
  }

  private swingSetPushFn: () => void = () => {};

  public updateSettings(next: EngineSettingsSnapshot) {
    this.settings = { ...next };
  }

  public updateDiscoveredEvidence(ids: string[]) {
    this.discoveredEvidenceIds = new Set(ids);
    this.evaluateCurrentTarget(true);
  }

  public updateProgressionState(next: EngineProgressionSnapshot) {
    this.progression = { ...next };
    if (!next.forestClimaxActive && this.playerPos.z > -45.0) {
      this.climaxTriggered = false;
    }
    this.evaluateCurrentTarget(true);
  }

  public triggerActiveInteraction() {
    if (!this.activeTarget) return;
    const target = this.activeTarget;

    if (target.id === 'north-forest-gate') {
      if (!this.progression.forestGateUnlocked) {
        horrorAudioEngine.playGateLockClank(false);
        this.callbacks.onGateBlockedInspect?.();
      } else {
        horrorAudioEngine.playGateLockClank(true);
        this.callbacks.onEnvironmentalInspect(
          target.id,
          'FOREST PERIMETER UNLOCKED',
          'The iron lock has released. Follow the winding trail north past the fence.',
        );
      }
      return;
    }

    if (target.id === 'shed-door-latch' && !this.progression.shedUnlocked) {
      horrorAudioEngine.playGateLockClank(false);
      this.callbacks.onEnvironmentalInspect(
        target.id,
        'MAINTENANCE SHED LOCKED',
        'Inspect at least 1 playground clue (1994 Poster, Broken Duck Toy, or Swing #2) to force the rusted latch.',
      );
      return;
    }

    if (target.id === 'swing-chains') {
      horrorAudioEngine.playSwingCreak();
    }

    if (target.onInteract) {
      target.onInteract();
    }
    if (target.evidenceId) {
      this.callbacks.onEvidenceDiscovered(target.evidenceId);
    } else if (target.id === 'missing-poster-board') {
      this.callbacks.onEnvironmentalInspect(
        target.id,
        'EXHIBIT NOTICE // OAK PARK',
        'Jimmy Mercer, age 5 — face gouged out with a razor. Paper is still damp from tonight.',
      );
    } else if (target.id === 'broken-duck-toy') {
      this.callbacks.onEnvironmentalInspect(
        target.id,
        'FIELD OBSERVATION',
        'A cracked 1994 rubber duck shell half-sunk in the mulch. Something heavy stepped right past it.',
      );
    }
  }

  private handleResize() {
    if (this.disposed) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private bindInputEvents() {
    const canvas = this.renderer.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight'
      ) {
        this.keysPressed.add(e.code);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysPressed.delete(e.code);
    };

    const onBlur = () => {
      this.keysPressed.clear();
      this.isDraggingLook = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || this.progression.forestClimaxActive) return;
      this.isDraggingLook = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      // Request PointerLock on real desktop clicks (gracefully ignored if headless denies)
      if (document.pointerLockElement !== canvas && typeof canvas.requestPointerLock === 'function') {
        try {
          const maybePromise = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
          if (maybePromise && typeof maybePromise.catch === 'function') {
            maybePromise.catch(() => {});
          }
        } catch {
          // Fallback drag look remains active
        }
      }
    };

    const onMouseUp = () => {
      this.isDraggingLook = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (this.progression.forestClimaxActive) return;
      const sens = 0.0022 * this.settings.mouseSensitivity;
      const ySign = this.settings.invertY ? -1 : 1;

      if (document.pointerLockElement === canvas) {
        this.yaw -= e.movementX * sens;
        this.pitch = THREE.MathUtils.clamp(
          this.pitch - e.movementY * sens * ySign,
          -1.25,
          1.25,
        );
      } else if (this.isDraggingLook) {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.yaw -= dx * sens * 1.4;
        this.pitch = THREE.MathUtils.clamp(
          this.pitch - dy * sens * 1.4 * ySign,
          -1.25,
          1.25,
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    this.cleanupFns.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock?.();
      }
    });
  }

  private applyCameraPose(bobSpeed: number) {
    const bob =
      this.settings.reducedMotion || bobSpeed < 0.05
        ? 0
        : Math.sin(this.distanceWalked * 2.4) * 0.032;
    this.camera.position.set(this.playerPos.x, this.playerPos.y + bob, this.playerPos.z);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  private isTargetTemporarilyHidden(item: InteractableTarget): boolean {
    if (item.id === 'shed-door-latch' && this.progression.shedUnlocked) return true;
    if (item.id === 'north-forest-gate' && this.progression.forestGateUnlocked) return true;
    return false;
  }

  private evaluateCurrentTarget(forceNotify = false) {
    // 1. Center reticle raycast priority
    this.raycaster.setFromCamera(this.screenCenter, this.camera);
    this.raycaster.far = 5.0;

    let best: InteractableTarget | null = null;
    const hitMeshes = Array.from(this.raycastMeshToTarget.keys());
    const hits = this.raycaster.intersectObjects(hitMeshes, false);
    if (hits.length > 0) {
      const candidate = this.raycastMeshToTarget.get(hits[0].object) ?? null;
      if (
        candidate &&
        !this.isTargetTemporarilyHidden(candidate) &&
        hits[0].distance <= candidate.maxDistance + 0.6
      ) {
        best = candidate;
      }
    }

    // 2. Proximity + forgiving gaze cone fallback (prioritizes evidence clues over decorative props)
    if (!best) {
      this.camera.getWorldDirection(this.camForward3);
      const fwdXZLen = Math.hypot(this.camForward3.x, this.camForward3.z) || 1;
      const fwdX = this.camForward3.x / fwdXZLen;
      const fwdZ = this.camForward3.z / fwdXZLen;

      let bestScore = Infinity;
      for (let i = 0; i < this.interactables.length; i++) {
        const item = this.interactables[i];
        if (this.isTargetTemporarilyHidden(item)) continue;
        const dx = item.worldPosition.x - this.camera.position.x;
        const dz = item.worldPosition.z - this.camera.position.z;
        const horizDist = Math.hypot(dx, dz);
        const maxRange = item.maxDistance + 0.65;
        if (horizDist <= maxRange && horizDist > 0.01) {
          const dotXZ = (dx / horizDist) * fwdX + (dz / horizDist) * fwdZ;
          if (dotXZ > 0.42) {
            const evidencePriority = item.evidenceId ? 0.72 : 1.0;
            const score = horizDist * (1.25 - dotXZ) * evidencePriority;
            if (score < bestScore) {
              bestScore = score;
              best = item;
            }
          }
        }
      }
    }

    this.activeTarget = best;
    const promptKey = best
      ? `${best.id}:${best.evidenceId && this.discoveredEvidenceIds.has(best.evidenceId) ? '1' : '0'}:${this.progression.forestGateUnlocked ? '1' : '0'}`
      : null;

    if (forceNotify || promptKey !== this.lastPromptId) {
      this.lastPromptId = promptKey;
      if (!best) {
        this.callbacks.onPromptChange(null);
      } else {
        const alreadyLogged = Boolean(
          best.evidenceId && this.discoveredEvidenceIds.has(best.evidenceId),
        );
        this.callbacks.onPromptChange({
          targetId: best.id,
          keyLabel: best.keyLabel,
          verb: alreadyLogged && best.id === 'swing-chains' ? 'PUSH' : best.verb,
          label: best.label,
          detail: alreadyLogged ? 'Cataloged in Notebook' : best.detail,
        });
      }
    }
  }

  private stepSimulation(dt: number, elapsedTime: number) {
    const movementAllowed = !this.progression.forestClimaxActive;

    // Compute horizontal movement from held keys
    const forwardInput = movementAllowed
      ? (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp') ? 1 : 0) -
        (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown') ? 1 : 0)
      : 0;
    const strafeInput = movementAllowed
      ? (this.keysPressed.has('KeyD') ? 1 : 0) - (this.keysPressed.has('KeyA') ? 1 : 0)
      : 0;
    const turnInput = movementAllowed
      ? (this.keysPressed.has('ArrowLeft') ? 1 : 0) -
        (this.keysPressed.has('ArrowRight') ? 1 : 0)
      : 0;

    if (turnInput !== 0) {
      this.yaw += turnInput * 1.95 * dt;
    }

    const sprinting =
      this.keysPressed.has('ShiftLeft') || this.keysPressed.has('ShiftRight');
    const moveSpeed = sprinting ? 5.2 : 3.45;

    let movedDist = 0;
    if (forwardInput !== 0 || strafeInput !== 0) {
      this.forwardVec.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      this.rightVec.crossVectors(this.forwardVec, this.upAxis).normalize();

      this.moveVec
        .set(0, 0, 0)
        .addScaledVector(this.forwardVec, forwardInput)
        .addScaledVector(this.rightVec, strafeInput)
        .normalize();

      const nextX = this.playerPos.x + this.moveVec.x * moveSpeed * dt;
      const nextZ = this.playerPos.z + this.moveVec.z * moveSpeed * dt;
      const resolved = resolvePlayerCollisions(
        nextX,
        nextZ,
        PLAYER_RADIUS,
        this.circleColliders,
        this.boxColliders,
        EXPANDED_WORLD_BOUNDS,
      );

      movedDist = Math.hypot(resolved.x - this.playerPos.x, resolved.z - this.playerPos.z);
      this.distanceWalked += movedDist;
      this.playerPos.x = resolved.x;
      this.playerPos.z = resolved.z;
    }

    this.playerPos.y = groundHeightAt(this.playerPos.x, this.playerPos.z) + PLAYER_EYE_HEIGHT;
    this.applyCameraPose(movedDist);

    // Detect location sector transitions
    const detectedLoc = detectLocationFromCoords(this.playerPos.x, this.playerPos.z);
    if (detectedLoc !== this.currentLocation) {
      this.currentLocation = detectedLoc;
      this.callbacks.onLocationChange?.(detectedLoc);
    }

    // Evaluate Duck Gaze exposure (only while Duck is visibly materialized)
    this.camera.getWorldDirection(this.camForward3);
    const gaze = evaluateDuckGaze(
      this.camera.position,
      this.camForward3,
      this.duckHeadWorldPos,
      19,
      0.945,
    );
    const isLookingAtDuck = this.duckAiState.visible && gaze.isLooking;
    this.callbacks.onGazeUpdate(isLookingAtDuck, dt);

    // Step 8-state psychological Duck AI
    this.duckAiState = stepDuckAI(this.duckAiState, {
      dt,
      elapsed: elapsedTime,
      playerX: this.playerPos.x,
      playerZ: this.playerPos.z,
      playerForwardX: this.camForward3.x,
      playerForwardZ: this.camForward3.z,
      isPlayerLookingAtDuck: isLookingAtDuck,
      flashlightOn: this.settings.flashlightOn,
      currentLocation: this.currentLocation,
      evidenceCount: this.progression.evidenceCount,
      paranoia: this.progression.paranoia,
      forestGateUnlocked: this.progression.forestGateUnlocked,
      forestClimaxActive: this.progression.forestClimaxActive,
    });

    if (this.duckAiState.interferenceEvent === 'swing-push') {
      this.swingSetPushFn();
      horrorAudioEngine.playSwingCreak();
    } else if (this.duckAiState.interferenceEvent === 'whisper-cue') {
      horrorAudioEngine.playDuckCue('squeak');
    } else if (this.duckAiState.interferenceEvent === 'lamp-flicker') {
      this.lampDipTimer = 0.35;
      horrorAudioEngine.playDuckCue('footstep');
    }

    if (this.lampDipTimer > 0) {
      this.lampDipTimer = Math.max(0, this.lampDipTimer - dt);
      this.renderer.toneMappingExposure = this.settings.reducedMotion ? 1.18 : 0.88;
    } else {
      this.renderer.toneMappingExposure = 1.18;
    }

    // Update animated scene systems
    for (let i = 0; i < this.updateHooks.length; i++) {
      this.updateHooks[i](dt, elapsedTime, isLookingAtDuck);
    }

    // Trigger Final Forest clearing climax once player reaches the clearing beyond North Gate
    if (
      !this.climaxTriggered &&
      this.progression.forestGateUnlocked &&
      this.playerPos.z <= -46.5 &&
      this.playerPos.x < 5.5
    ) {
      this.climaxTriggered = true;
      document.exitPointerLock?.();
      horrorAudioEngine.playDuckCue('whisper-you-took-so-long');
      this.callbacks.onForestClimaxReached?.();
    }

    this.evaluateCurrentTarget(false);
  }

  private tick = () => {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTickTimeMs) / 1000;
    this.lastTickTimeMs = now;
    const moveDt = Math.min(0.18, Math.max(0.001, rawDt));
    this.elapsedSeconds += moveDt;

    this.stepSimulation(moveDt, this.elapsedSeconds);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextTick();
  };

  private afterDraw(cb: () => void) {
    if (!this.gl2) {
      this.timerId = window.setTimeout(cb, 16);
      return;
    }
    const gl = this.gl2;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
      this.timerId = window.setTimeout(cb, 135);
      return;
    }
    gl.flush();
    const startWait = performance.now();
    const poll = () => {
      if (this.disposed) {
        gl.deleteSync(sync);
        return;
      }
      const status = gl.clientWaitSync(sync, 0, 0);
      if (
        status === gl.ALREADY_SIGNALED ||
        status === gl.CONDITION_SATISFIED ||
        performance.now() - startWait > 400
      ) {
        gl.deleteSync(sync);
        this.timerId = window.setTimeout(cb, 135);
      } else {
        this.timerId = window.setTimeout(poll, 6);
      }
    };
    this.timerId = window.setTimeout(poll, 6);
  }

  private scheduleNextTick() {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  public dispose() {
    this.disposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.timerId !== null) window.clearTimeout(this.timerId);
    this.resizeObserver.disconnect();
    this.cleanupFns.forEach((fn) => fn());
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
