"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import ProfilePage from "./profile-page";
import {
  LANDMARKS,
  animateWorld,
  createCosmosEnvironment,
  createGlowTexture,
  createLandmarkWorld,
  createMindEnvironment,
  findLandmark,
  getLandmark,
  type LandmarkId,
  type Mode,
} from "./cosmos-world";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function CosmosExperience() {
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<Mode>("mind");
  const navigateRef = useRef<(id: LandmarkId) => void>(() => undefined);
  const moveRef = useRef<(amount: number, vertical?: number) => void>(() => undefined);
  const discoveredRef = useRef(new Set<LandmarkId>());

  const [mode, setMode] = useState<Mode>("mind");
  const [surface, setSurface] = useState<"atlas" | "profile">("profile");
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [discovered, setDiscovered] = useState<LandmarkId[]>([]);
  const [hovered, setHovered] = useState<LandmarkId | null>(null);
  const [selected, setSelected] = useState<LandmarkId | null>(null);
  const [travelling, setTravelling] = useState<LandmarkId | null>(null);
  const [nearby, setNearby] = useState<LandmarkId | null>(null);
  const [year, setYear] = useState(2020);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let destroyed = false;
    let animationFrame = 0;
    let pointerDown = false;
    let pointerMoved = false;
    let previousX = 0;
    let previousY = 0;
    let yaw = 0;
    let pitch = 0;
    let liveHovered: LandmarkId | null = null;
    let liveNearby: LandmarkId | null = null;
    let autoTarget: LandmarkId | null = null;
    let lastMode: Mode | null = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010711);
    scene.fog = new THREE.FogExp2(0x03101b, 0.012);

    const camera = new THREE.PerspectiveCamera(56, 1, 0.05, 520);
    camera.position.set(0, 1.5, 31);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.domElement.setAttribute("aria-label", "A continuous three-dimensional atlas of a mind and a cosmos");
    renderer.domElement.tabIndex = 0;
    mount.appendChild(renderer.domElement);

    const glow = createGlowTexture();
    const mindEnvironment = createMindEnvironment(glow);
    const cosmosEnvironment = createCosmosEnvironment(glow);
    const landmarkWorld = createLandmarkWorld(glow);
    scene.add(mindEnvironment, cosmosEnvironment, landmarkWorld.root);

    scene.add(new THREE.HemisphereLight(0xbde8ff, 0x101020, 1.15));
    const cameraLight = new THREE.PointLight(0xeaf7ff, 38, 38, 1.7);
    scene.add(cameraLight);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const lookTarget = new THREE.Vector3();
    const destination = new THREE.Vector3();
    const destinationLook = new THREE.Vector3();
    const rotationMatrix = new THREE.Matrix4();
    const destinationQuaternion = new THREE.Quaternion();
    const keys = new Set<string>();

    const syncDirectionFromAngles = () => {
      forward.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).normalize();
      right.crossVectors(forward, worldUp).normalize();
    };

    const syncAnglesFromCamera = () => {
      camera.getWorldDirection(forward);
      pitch = Math.asin(clamp(forward.y, -1, 1));
      yaw = Math.atan2(forward.x, -forward.z);
    };

    const cancelTravel = () => {
      if (!autoTarget) return;
      autoTarget = null;
      setTravelling(null);
      syncAnglesFromCamera();
    };

    const move = (amount: number, vertical = 0) => {
      cancelTravel();
      syncDirectionFromAngles();
      camera.position.addScaledVector(forward, amount);
      camera.position.y += vertical;
    };
    moveRef.current = move;

    navigateRef.current = (id: LandmarkId) => {
      autoTarget = id;
      setTravelling(id);
      setSelected(null);
      renderer.domElement.focus({ preventScroll: true });
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pick = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const visibleGroups = Array.from(landmarkWorld.groups.values()).filter((group) => group.visible);
      const hits = raycaster.intersectObjects(visibleGroups, true);
      return hits.length ? findLandmark(hits[0].object) : null;
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDown = true;
      pointerMoved = false;
      previousX = event.clientX;
      previousY = event.clientY;
      cancelTravel();
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerDown) {
        const id = pick(event);
        if (id !== liveHovered) {
          liveHovered = id;
          setHovered(id);
        }
        renderer.domElement.style.cursor = id ? "pointer" : "grab";
        return;
      }
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 3) pointerMoved = true;
      yaw -= deltaX * 0.0046;
      pitch = clamp(pitch - deltaY * 0.0042, -1.52, 1.52);
      previousX = event.clientX;
      previousY = event.clientY;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerMoved) {
        const id = pick(event);
        if (id) {
          const distance = camera.position.distanceTo(new THREE.Vector3(...getLandmark(id).position));
          if (distance > 12) navigateRef.current(id);
          else setSelected(id);
        }
      }
      pointerDown = false;
      renderer.domElement.style.cursor = liveHovered ? "pointer" : "grab";
    };

    const handlePointerLeave = () => {
      pointerDown = false;
      pointerMoved = false;
      liveHovered = null;
      setHovered(null);
      renderer.domElement.style.cursor = "grab";
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      move(event.deltaY * 0.018);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (["w", "a", "s", "d", "q", "e", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(event.key.toLowerCase())) {
        keys.add(event.key.toLowerCase());
        cancelTravel();
      }
      if (event.key === "Escape") {
        setSelected(null);
        setDirectoryOpen(false);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    const animate = () => {
      if (destroyed) return;
      const delta = Math.min(clock.getDelta(), 0.04);
      const elapsed = clock.elapsedTime;
      const currentMode = modeRef.current;

      if (currentMode !== lastMode) {
        mindEnvironment.visible = currentMode === "mind";
        cosmosEnvironment.visible = currentMode === "cosmos";
        landmarkWorld.futureArtifacts.mind.visible = currentMode === "mind";
        landmarkWorld.futureArtifacts.cosmos.visible = currentMode === "cosmos";
        scene.background = new THREE.Color(currentMode === "mind" ? 0x06131c : 0x080510);
        scene.fog = new THREE.FogExp2(currentMode === "mind" ? 0x102738 : 0x120a20, currentMode === "mind" ? 0.011 : 0.0075);
        renderer.toneMappingExposure = currentMode === "mind" ? 1.34 : 1.2;
        lastMode = currentMode;
      }

      if (autoTarget) {
        const definition = getLandmark(autoTarget);
        destination.set(definition.position[0], definition.position[1] + 1.3, definition.position[2] + 10.5);
        destinationLook.set(...definition.position);
        const easing = 1 - Math.exp(-delta * 1.45);
        camera.position.lerp(destination, easing);
        rotationMatrix.lookAt(camera.position, destinationLook, worldUp);
        destinationQuaternion.setFromRotationMatrix(rotationMatrix);
        camera.quaternion.slerp(destinationQuaternion, 1 - Math.exp(-delta * 2.1));
        if (camera.position.distanceTo(destination) < 0.48) {
          const arrived = autoTarget;
          autoTarget = null;
          setTravelling(null);
          setSelected(arrived);
          syncAnglesFromCamera();
        }
      } else {
        syncDirectionFromAngles();
        const speed = (keys.has("shift") ? 18 : 7.5) * delta;
        if (keys.has("w") || keys.has("arrowup")) camera.position.addScaledVector(forward, speed);
        if (keys.has("s") || keys.has("arrowdown")) camera.position.addScaledVector(forward, -speed);
        if (keys.has("a") || keys.has("arrowleft")) camera.position.addScaledVector(right, -speed);
        if (keys.has("d") || keys.has("arrowright")) camera.position.addScaledVector(right, speed);
        if (keys.has("q")) camera.position.y += speed;
        if (keys.has("e")) camera.position.y -= speed;
        lookTarget.copy(camera.position).add(forward);
        camera.lookAt(lookTarget);
      }

      camera.position.x = clamp(camera.position.x, -72, 72);
      camera.position.y = clamp(camera.position.y, -48, 48);
      camera.position.z = clamp(camera.position.z, -245, 48);
      cameraLight.position.copy(camera.position);

      let closestId: LandmarkId | null = null;
      let closestDistance = Infinity;
      LANDMARKS.forEach((definition) => {
        const group = landmarkWorld.groups.get(definition.id)!;
        const distance = camera.position.distanceTo(group.position);
        group.visible = distance < 72;
        if (group.visible) {
          group.position.y = definition.position[1] + Math.sin(elapsed * 0.55 + group.userData.floatPhase) * 0.38;
          group.rotation.y = Math.sin(elapsed * 0.18 + group.userData.floatPhase) * 0.08;
        }
        if (distance < 58 && !discoveredRef.current.has(definition.id)) {
          discoveredRef.current.add(definition.id);
          setDiscovered(Array.from(discoveredRef.current));
        }
        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = definition.id;
        }
      });
      const nextNearby = closestDistance < 17 ? closestId : null;
      if (nextNearby !== liveNearby) {
        liveNearby = nextNearby;
        setNearby(nextNearby);
        if (nextNearby) setYear(getLandmark(nextNearby).year);
      }

      animateWorld(mindEnvironment, elapsed);
      animateWorld(cosmosEnvironment, elapsed);
      animateWorld(landmarkWorld.root, elapsed);
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", resize);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          object.geometry?.dispose?.();
          const objectMaterial = object.material as THREE.Material | THREE.Material[];
          if (Array.isArray(objectMaterial)) objectMaterial.forEach((item) => item.dispose());
          else objectMaterial?.dispose();
        }
      });
      glow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const selectedLandmark = selected ? getLandmark(selected) : null;
  const hoverLandmark = hovered ? getLandmark(hovered) : null;
  const nearbyLandmark = nearby ? getLandmark(nearby) : null;
  const selectedIndex = selected ? LANDMARKS.findIndex((item) => item.id === selected) : -1;
  const previousIndex = selectedIndex >= 0 ? (selectedIndex - 1 + LANDMARKS.length) % LANDMARKS.length : -1;
  const nextIndex = selectedIndex >= 0 ? (selectedIndex + 1) % LANDMARKS.length : -1;

  const travelTo = (id: LandmarkId) => {
    setDirectoryOpen(false);
    navigateRef.current(id);
  };
  const timelineProgress = `${((year - 2020) / 8) * 100}%`;

  return (
    <main className={`site-root mode-${mode} surface-${surface}`}>
      <section className="atlas-surface" aria-label="Interactive personal atlas">
        <div className="cosmos-stage" ref={mountRef} />
        <div className="world-vignette" />

        <header className="atlas-header">
          <button className="identity" type="button" onClick={() => setDirectoryOpen(true)} aria-label="Open atlas directory">
            <span className="identity-mark">YC</span>
            <span className="identity-copy"><strong>PERSONAL ATLAS</strong><small>A CONTINUOUS INNER WORLD</small></span>
          </button>
          <div className="mode-control" aria-label="Choose world">
            <button type="button" className={mode === "mind" ? "is-active" : ""} onClick={() => setMode("mind")}>MIND</button>
            <button type="button" className={mode === "cosmos" ? "is-active" : ""} onClick={() => setMode("cosmos")}>COSMOS</button>
          </div>
        </header>

        <button className="page-fold" type="button" onClick={() => setSurface("profile")} aria-label="Open the standard profile page">
          <span>PROFILE</span>
        </button>

        <button className={`directory-handle ${directoryOpen ? "is-open" : ""}`} type="button" onClick={() => setDirectoryOpen((value) => !value)} aria-expanded={directoryOpen} aria-controls="atlas-directory">
          <i /><span>{directoryOpen ? "CLOSE MAP" : "MAP"}</span>
        </button>
        <aside className={`atlas-directory ${directoryOpen ? "is-open" : ""}`} id="atlas-directory">
          <div className="directory-heading"><span>CONTINUOUS ATLAS</span><strong>{discovered.length} / {LANDMARKS.length} encountered</strong></div>
          <ol>
            {LANDMARKS.map((landmark, index) => {
              const known = discovered.includes(landmark.id);
              return (
                <li key={landmark.id} className={nearby === landmark.id ? "is-nearby" : ""}>
                  <button type="button" disabled={!known} onClick={() => travelTo(landmark.id)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{known ? landmark.title : "Unknown signal"}</strong>
                    <small>{known ? landmark.object : "Keep moving"}</small>
                  </button>
                </li>
              );
            })}
          </ol>
          <p>Locations reveal themselves as you travel. Revisited places remain on this map.</p>
        </aside>

        {(hoverLandmark || nearbyLandmark) && !selectedLandmark && (
          <div className="discovery-label">
            <span>{(hoverLandmark || nearbyLandmark)!.eyebrow}</span>
            <strong>{(hoverLandmark || nearbyLandmark)!.title}</strong>
          </div>
        )}

        {travelling && <div className="travel-status"><span>TRAVELLING THROUGH {mode.toUpperCase()}</span><strong>{getLandmark(travelling).title}</strong></div>}

        {selectedLandmark && (
          <article className="artifact-card">
            <button className="card-close" type="button" onClick={() => setSelected(null)} aria-label="Close details">×</button>
            <span>{selectedLandmark.eyebrow} · {selectedLandmark.year}</span>
            <h2>{selectedLandmark.title}</h2>
            <p>{selectedLandmark.description}</p>
            <div className="artifact-actions">
              <button type="button" onClick={() => travelTo(LANDMARKS[previousIndex].id)}>← Previous place</button>
              <button type="button" onClick={() => travelTo(LANDMARKS[nextIndex].id)}>Next place →</button>
            </div>
          </article>
        )}

        <div className="movement-guide"><span>DRAG</span> look anywhere · <span>SCROLL / WASD</span> travel · <span>CLICK</span> approach</div>
        <div className="mobile-flight-controls" aria-label="Movement controls">
          <button type="button" onPointerDown={() => moveRef.current(2.8)} aria-label="Move forward">↑</button>
          <button type="button" onPointerDown={() => moveRef.current(-2.8)} aria-label="Move backward">↓</button>
        </div>

        <div className="timeline">
          <div className="timeline-meta"><span>TIME COORDINATE</span><strong>{year}</strong><span>OPEN FUTURE</span></div>
          <input
            aria-label="Travel through the personal timeline"
            type="range"
            min="2020"
            max="2028"
            value={year}
            onChange={(event) => {
              const nextYear = Number(event.target.value);
              setYear(nextYear);
              const closest = [...LANDMARKS].sort((a, b) => Math.abs(a.year - nextYear) - Math.abs(b.year - nextYear))[0];
              travelTo(closest.id);
            }}
            style={{ "--timeline-progress": timelineProgress } as CSSProperties}
          />
          <div className="timeline-years"><span>2020</span><span>2022</span><span>2024</span><span>2026</span><span>2028</span></div>
        </div>
      </section>

      {surface === "profile" && <ProfilePage onReturn={() => setSurface("atlas")} />}
    </main>
  );
}
