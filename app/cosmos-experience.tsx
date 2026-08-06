"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  REGIONS,
  createAtlas,
  createGlowTexture,
  createRegionWorld,
  findInteractive,
  findPortal,
  findRegion,
  type InteractiveInfo,
  type Mode,
  type RegionId,
} from "./cosmos-world";

type View = "atlas" | "region";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function CosmosExperience() {
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<Mode>("mind");
  const viewRef = useRef<View>("atlas");
  const activeRegionRef = useRef<RegionId | null>(null);
  const yearRef = useRef(2026);
  const transitionRef = useRef(false);
  const enterRef = useRef<(id: RegionId) => void>(() => undefined);
  const exitRef = useRef<() => void>(() => undefined);
  const nudgeRef = useRef<(forward: number, vertical?: number) => void>(() => undefined);
  const timersRef = useRef<number[]>([]);

  const [mode, setMode] = useState<Mode>("mind");
  const [view, setView] = useState<View>("atlas");
  const [activeRegion, setActiveRegion] = useState<RegionId | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);
  const [selected, setSelected] = useState<InteractiveInfo | null>(null);
  const [year, setYear] = useState(2026);
  const [transitioning, setTransitioning] = useState(false);

  const region = REGIONS.find((item) => item.id === activeRegion) ?? null;
  const hovered = REGIONS.find((item) => item.id === hoveredRegion) ?? null;

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { activeRegionRef.current = activeRegion; }, [activeRegion]);
  useEffect(() => { yearRef.current = year; }, [year]);
  useEffect(() => { transitionRef.current = transitioning; }, [transitioning]);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const enterRegion = (id: RegionId) => {
    if (transitionRef.current) return;
    clearTimers();
    transitionRef.current = true;
    setTransitioning(true);
    setHoveredRegion(null);
    setSelected(null);
    timersRef.current.push(window.setTimeout(() => {
      activeRegionRef.current = id;
      viewRef.current = "region";
      setActiveRegion(id);
      setView("region");
    }, 420));
    timersRef.current.push(window.setTimeout(() => {
      transitionRef.current = false;
      setTransitioning(false);
    }, 900));
  };

  const returnToAtlas = () => {
    if (transitionRef.current || viewRef.current !== "region") return;
    clearTimers();
    transitionRef.current = true;
    setTransitioning(true);
    setSelected(null);
    timersRef.current.push(window.setTimeout(() => {
      viewRef.current = "atlas";
      activeRegionRef.current = null;
      setView("atlas");
      setActiveRegion(null);
    }, 420));
    timersRef.current.push(window.setTimeout(() => {
      transitionRef.current = false;
      setTransitioning(false);
    }, 900));
  };

  enterRef.current = enterRegion;
  exitRef.current = returnToAtlas;

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let destroyed = false;
    let frame = 0;
    let pointerDown = false;
    let pointerMoved = false;
    let pointerX = 0;
    let pointerY = 0;
    let orbitYaw = -0.2;
    let orbitPitch = 0.06;
    let orbitRadius = 9.8;
    let flightYaw = 0;
    let flightPitch = -0.01;
    let lastView: View = "atlas";
    let lastRegion: RegionId | null = null;
    let lastBackground = "";
    let liveHoverRegion: RegionId | null = null;
    let liveHoverInteractive: InteractiveInfo | null = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);
    scene.fog = new THREE.FogExp2(0x02050c, 0.009);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.04, 220);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.domElement.setAttribute("aria-label", "A freely explorable three-dimensional mind and cosmos");
    mount.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    const neuralTexture = loader.load("/neural-nebula.webp", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.mapping = THREE.EquirectangularReflectionMapping;
    });
    const cosmosTexture = loader.load("/cosmos-deep-field.webp", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.mapping = THREE.EquirectangularReflectionMapping;
    });

    const glow = createGlowTexture();
    const atlas = createAtlas(glow, window.innerWidth < 760);
    scene.add(atlas.mind, atlas.cosmos);

    const worlds = new Map<RegionId, THREE.Group>();
    REGIONS.forEach((definition) => {
      const world = createRegionWorld(definition, glow);
      worlds.set(definition.id, world);
      scene.add(world);
    });

    scene.add(new THREE.AmbientLight(0x7896bf, 0.32));
    const atlasLight = new THREE.PointLight(0x9edfff, 28, 28, 2);
    atlasLight.position.set(-3, 4, 7);
    scene.add(atlasLight);
    const atlasFill = new THREE.PointLight(0xc68cff, 18, 30, 2);
    atlasFill.position.set(5, -3, -5);
    scene.add(atlasFill);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const flightPosition = new THREE.Vector3(0, 1.75, 10.5);
    const cameraTarget = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const keys = new Set<string>();

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pick = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      if (viewRef.current === "atlas") {
        const targets = modeRef.current === "mind" ? Array.from(atlas.mindEntries.values()) : [atlas.cosmos];
        const hits = raycaster.intersectObjects(targets, true);
        for (const hit of hits) {
          const regionId = findRegion(hit.object);
          if (regionId) return { regionId, info: null };
        }
        return { regionId: null, info: null };
      }
      const currentWorld = activeRegionRef.current ? worlds.get(activeRegionRef.current) : null;
      const hits = currentWorld ? raycaster.intersectObject(currentWorld, true) : [];
      for (const hit of hits) {
        const portalTo = findPortal(hit.object);
        if (portalTo) return { regionId: portalTo, info: null };
      }
      return { regionId: null, info: hits.length ? findInteractive(hits[0].object) : null };
    };

    const updateHover = (event: PointerEvent) => {
      const picked = pick(event);
      if (picked.regionId !== liveHoverRegion) {
        liveHoverRegion = picked.regionId;
        setHoveredRegion(picked.regionId);
      }
      liveHoverInteractive = picked.info;
      renderer.domElement.style.cursor = picked.regionId || picked.info ? "pointer" : "grab";
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDown = true;
      pointerMoved = false;
      pointerX = event.clientX;
      pointerY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerDown) {
        updateHover(event);
        return;
      }
      const deltaX = event.clientX - pointerX;
      const deltaY = event.clientY - pointerY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 2) pointerMoved = true;
      if (viewRef.current === "atlas") {
        orbitYaw -= deltaX * 0.006;
        orbitPitch = clamp(orbitPitch + deltaY * 0.0054, -1.5, 1.5);
      } else {
        flightYaw -= deltaX * 0.0042;
        flightPitch = clamp(flightPitch - deltaY * 0.0038, -1.5, 1.5);
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerMoved && !transitionRef.current) {
        const picked = pick(event);
        if (picked.regionId) enterRef.current(picked.regionId);
        else if (picked.info) setSelected(picked.info);
      }
      pointerDown = false;
      renderer.domElement.style.cursor = liveHoverRegion || liveHoverInteractive ? "pointer" : "grab";
    };

    const handlePointerLeave = () => {
      pointerDown = false;
      pointerMoved = false;
      liveHoverRegion = null;
      liveHoverInteractive = null;
      setHoveredRegion(null);
      renderer.domElement.style.cursor = "grab";
    };

    const setForward = () => {
      forward.set(
        Math.sin(flightYaw) * Math.cos(flightPitch),
        Math.sin(flightPitch),
        -Math.cos(flightYaw) * Math.cos(flightPitch),
      ).normalize();
      right.crossVectors(forward, up).normalize();
    };

    const moveFlight = (amount: number, vertical = 0) => {
      setForward();
      flightPosition.addScaledVector(forward, amount);
      flightPosition.y += vertical;
    };
    nudgeRef.current = moveFlight;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (viewRef.current === "atlas") orbitRadius = clamp(orbitRadius + event.deltaY * 0.009, 5.2, 19);
      else moveFlight(event.deltaY * 0.012);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      keys.add(event.key.toLowerCase());
      if (event.key === "Escape" && viewRef.current === "region") exitRef.current();
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
      const currentView = viewRef.current;
      const currentRegion = activeRegionRef.current;

      if (currentView !== lastView || currentRegion !== lastRegion) {
        if (currentView === "region") {
          flightPosition.set(0, 1.75, 10.5);
          flightYaw = 0;
          flightPitch = -0.01;
        }
        lastView = currentView;
        lastRegion = currentRegion;
      }

      const atlasVisible = currentView === "atlas";
      atlas.mind.visible = atlasVisible && modeRef.current === "mind";
      atlas.cosmos.visible = atlasVisible && modeRef.current === "cosmos";
      worlds.forEach((world, id) => { world.visible = currentView === "region" && id === currentRegion; });
      atlasLight.visible = atlasVisible;
      atlasFill.visible = atlasVisible;

      const backgroundKey = atlasVisible ? modeRef.current : currentRegion === "visual" || currentRegion === "archive" ? "mind" : "cosmos";
      if (backgroundKey !== lastBackground) {
        scene.background = backgroundKey === "mind" ? neuralTexture : cosmosTexture;
        scene.fog = new THREE.FogExp2(backgroundKey === "mind" ? 0x061326 : 0x010107, atlasVisible ? 0.008 : 0.013);
        lastBackground = backgroundKey;
      }

      if (atlasVisible) {
        const cosPitch = Math.cos(orbitPitch);
        camera.position.set(
          Math.sin(orbitYaw) * cosPitch * orbitRadius,
          Math.sin(orbitPitch) * orbitRadius,
          Math.cos(orbitYaw) * cosPitch * orbitRadius,
        );
        camera.lookAt(0, 0, 0);
        atlas.mind.rotation.y += 0.00035;
        atlas.cosmos.rotation.y -= 0.00022;
        atlas.cosmos.rotation.x = Math.sin(elapsed * 0.08) * 0.035;
      } else {
        setForward();
        const speed = (keys.has("shift") ? 11 : 5.6) * delta;
        if (keys.has("w") || keys.has("arrowup")) flightPosition.addScaledVector(forward, speed);
        if (keys.has("s") || keys.has("arrowdown")) flightPosition.addScaledVector(forward, -speed);
        if (keys.has("a") || keys.has("arrowleft")) flightPosition.addScaledVector(right, -speed);
        if (keys.has("d") || keys.has("arrowright")) flightPosition.addScaledVector(right, speed);
        if (keys.has("q")) flightPosition.y += speed;
        if (keys.has("e")) flightPosition.y -= speed;
        flightPosition.x = clamp(flightPosition.x, -8.2, 8.2);
        flightPosition.y = clamp(flightPosition.y, 0.45, 6.05);
        flightPosition.z = clamp(flightPosition.z, -69, 13);
        camera.position.copy(flightPosition);
        cameraTarget.copy(flightPosition).add(forward);
        camera.lookAt(cameraTarget);
      }

      const hoverId = liveHoverRegion;
      atlas.mindEntries.forEach((entry, id) => {
        const target = hoverId === id ? 1.55 : 1;
        const scale = entry.scale.x + (target - entry.scale.x) * 0.12;
        entry.scale.setScalar(scale * (1 + Math.sin(elapsed * 1.8 + entry.userData.phase) * 0.035));
      });
      atlas.cosmosEntries.forEach((entry, id) => {
        entry.rotation.y += 0.0015;
        const target = hoverId === id ? 1.22 : 1;
        const scale = entry.scale.x + (target - entry.scale.x) * 0.1;
        entry.scale.setScalar(scale);
      });

      worlds.forEach((world) => {
        if (!world.visible) return;
        world.traverse((object) => {
          if (object.userData.interactive) object.visible = yearRef.current >= (object.userData.year ?? 2019);
        });
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
          object.geometry?.dispose();
          const objectMaterial = object.material;
          const disposeMaterial = (material: THREE.Material) => {
            const mapped = material as THREE.Material & { map?: THREE.Texture | null };
            mapped.map?.dispose();
            material.dispose();
          };
          if (Array.isArray(objectMaterial)) objectMaterial.forEach(disposeMaterial);
          else if (objectMaterial) disposeMaterial(objectMaterial);
        }
        if (object instanceof THREE.Sprite) object.material.dispose();
      });
      glow.dispose();
      neuralTexture.dispose();
      cosmosTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <main className={`cosmos-experience mode-${mode} view-${view}`}>
      <div ref={mountRef} className="cosmos-stage" />
      <div className="cosmos-vignette" aria-hidden="true" />
      <div className={`scene-fade ${transitioning ? "is-active" : ""}`} aria-hidden="true" />

      <header className="minimal-header">
        <button className="identity" type="button" onClick={view === "region" ? returnToAtlas : undefined} aria-label="Personal Cosmos home">
          <span className="identity-mark">YC</span>
          <span className="identity-copy">
            <strong>PERSONAL COSMOS</strong>
            <small>{view === "atlas" ? (mode === "mind" ? "NEURAL ATLAS" : "DEEP FIELD") : region?.title.toUpperCase()}</small>
          </span>
        </button>
        {view === "atlas" ? (
          <div className="mode-control" role="group" aria-label="Choose mind or cosmos">
            <button className={mode === "mind" ? "is-active" : ""} onClick={() => setMode("mind")}>MIND</button>
            <button className={mode === "cosmos" ? "is-active" : ""} onClick={() => setMode("cosmos")}>COSMOS</button>
          </div>
        ) : null}
      </header>

      {view === "region" ? (
        <>
          <button className="back-control" type="button" onClick={returnToAtlas}>RETURN TO OUTER FIELD</button>
          <div className="region-heading">
            <span>{region?.whisper}</span>
            <h1>{region?.title}</h1>
          </div>
          <div className="flight-reticle" aria-hidden="true"><span /><i /></div>
        </>
      ) : null}

      {hovered ? (
        <div className="discovery-label" aria-live="polite">
          <span>{hovered.whisper}</span>
          <strong>{hovered.title}</strong>
        </div>
      ) : null}

      {selected ? (
        <aside className="artifact-card" aria-live="polite">
          <span>{selected.eyebrow} · {selected.year}</span>
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
          <button type="button" onClick={() => setSelected(null)}>CLOSE</button>
        </aside>
      ) : null}

      <div className="gesture-guide">
        {view === "atlas" ? "DRAG · ORBIT 360° · SCROLL · APPROACH" : "DRAG · LOOK · SCROLL / WASD · FLY · ESC · RETURN"}
      </div>

      {view === "region" ? (
        <div className="depth-buttons" aria-label="Flight controls">
          <button type="button" onClick={() => nudgeRef.current(1.5)} aria-label="Fly forward">↑</button>
          <button type="button" onClick={() => nudgeRef.current(-1.5)} aria-label="Fly backward">↓</button>
          <button type="button" onClick={() => nudgeRef.current(0, 0.8)} aria-label="Fly upward">+</button>
          <button type="button" onClick={() => nudgeRef.current(0, -0.8)} aria-label="Fly downward">−</button>
        </div>
      ) : null}

      <section className="timeline" aria-label="Personal timeline">
        <div className="timeline-meta">
          <span>TIME COORDINATE</span>
          <strong>{year}</strong>
          <span>{year === 2026 ? "NOW" : "ARCHIVE"}</span>
        </div>
        <input
          type="range"
          min="2019"
          max="2026"
          step="1"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          aria-label="Explore the timeline by year"
          style={{ "--timeline-progress": `${((year - 2019) / 7) * 100}%` } as React.CSSProperties}
        />
        <div className="timeline-years" aria-hidden="true"><span>2019</span><span>2021</span><span>2023</span><span>2024</span><span>2026</span></div>
      </section>
    </main>
  );
}
