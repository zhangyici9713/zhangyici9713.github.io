"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Mode = "mind" | "cosmos";
type Layer = "atlas" | "visual";
type ArtifactId = "lab" | "papers" | "music" | "gallery" | "notes" | "memory";

type ArtifactDefinition = {
  id: ArtifactId;
  title: string;
  eyebrow: string;
  description: string;
  year: number;
  position: [number, number, number];
  color: number;
};

const ARTIFACTS: ArtifactDefinition[] = [
  {
    id: "lab",
    title: "The Lab Bench",
    eyebrow: "RESEARCH · EXPERIMENTS",
    description: "Published work, live questions and experiments that are still changing shape.",
    year: 2023,
    position: [-3.2, 0.8, -4.5],
    color: 0x86d9ff,
  },
  {
    id: "papers",
    title: "Paper Constellation",
    eyebrow: "PAPERS · PROJECTS",
    description: "A shelf of papers and research projects, arranged as paths rather than a flat list.",
    year: 2023,
    position: [3.1, 1.15, -8.5],
    color: 0x9ebcff,
  },
  {
    id: "music",
    title: "The Listening Station",
    eyebrow: "MUSIC · RECORDINGS",
    description: "Original songs, unfinished demos and the sounds that became coordinates in time.",
    year: 2021,
    position: [-3.35, -0.55, -12.5],
    color: 0xe5a4ff,
  },
  {
    id: "gallery",
    title: "Floating Gallery",
    eyebrow: "PAINTING · PHOTOGRAPHY",
    description: "Illustrations, paintings and a photographic archive of mountains, snow and light.",
    year: 2020,
    position: [3.45, 0.65, -16.5],
    color: 0x72f4d1,
  },
  {
    id: "notes",
    title: "Open Notebook",
    eyebrow: "IDEAS · FUTURE BUILDS",
    description: "Loose sketches, lessons learned and projects waiting for the right collaborator.",
    year: 2024,
    position: [-2.75, 0.5, -20.5],
    color: 0xffc38f,
  },
  {
    id: "memory",
    title: "Memory Camera",
    eyebrow: "MEMORY · PERSONAL ARCHIVE",
    description: "Small beautiful moments kept here without forcing them into a conventional album.",
    year: 2019,
    position: [2.45, -0.25, -24.5],
    color: 0xff9ab6,
  },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const ease = (value: number) => value * value * (3 - 2 * value);

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Texture();
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(116,220,255,.9)");
  gradient.addColorStop(0.38, "rgba(94,139,255,.28)");
  gradient.addColorStop(1, "rgba(20,40,90,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBrainData(count: number) {
  const random = seededRandom(73);
  const brain = new Float32Array(count * 3);
  const cosmos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const radial = Math.sqrt(Math.max(0, 1 - u * u));
    const convolution =
      1 +
      Math.sin(theta * 11 + u * 7) * 0.055 +
      Math.sin(theta * 5 - u * 17) * 0.035 +
      (random() - 0.5) * 0.055;
    let x = 2.85 * radial * Math.cos(theta) * convolution;
    let y = 2.03 * u * convolution;
    let z = 2.28 * radial * Math.sin(theta) * convolution;
    const lowerTaper = clamp((y + 2.1) / 1.1, 0.58, 1);
    x *= lowerTaper;
    z *= lowerTaper;
    if (Math.abs(x) < 0.12) x += (x >= 0 ? 1 : -1) * 0.12;
    y += 0.14 * Math.cos(theta) - Math.max(0, -y - 1.25) * 0.22;

    brain[index * 3] = x;
    brain[index * 3 + 1] = y;
    brain[index * 3 + 2] = z;

    const arm = index % 5;
    const radius = 0.18 + Math.pow(random(), 0.58) * 4.45;
    const angle = (arm / 5) * Math.PI * 2 + radius * 1.42 + (random() - 0.5) * 0.42;
    cosmos[index * 3] = Math.cos(angle) * radius;
    cosmos[index * 3 + 1] = (random() - 0.5) * (0.28 + radius * 0.12);
    cosmos[index * 3 + 2] = Math.sin(angle) * radius;

    const visualCortex = z < -1.42 && Math.abs(x) < 1.75 && y > -0.95 && y < 1.2;
    const color = visualCortex
      ? new THREE.Color(0x8eeeff)
      : new THREE.Color().setHSL(0.57 + random() * 0.12, 0.7, 0.56 + random() * 0.24);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  return { brain, cosmos, colors };
}

function material(color: number, emissive = color) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.35,
    metalness: 0.38,
    roughness: 0.34,
  });
}

function box(size: [number, number, number], color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
}

function createArtifactObject(definition: ArtifactDefinition, glowTexture: THREE.Texture) {
  const root = new THREE.Group();
  root.position.set(...definition.position);
  root.userData.artifactId = definition.id;
  root.userData.baseY = definition.position[1];
  root.userData.year = definition.year;
  root.userData.phase = ARTIFACTS.findIndex((item) => item.id === definition.id) * 0.83;

  const object = new THREE.Group();
  root.add(object);

  if (definition.id === "lab") {
    const top = box([1.8, 0.12, 0.82], 0x34506a);
    top.position.y = 0.2;
    object.add(top);
    [-0.72, 0.72].forEach((x) => {
      [-0.28, 0.28].forEach((z) => {
        const leg = box([0.09, 0.72, 0.09], 0x243647);
        leg.position.set(x, -0.2, z);
        object.add(leg);
      });
    });
    const microscopeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.08, 24), material(0x8adfff));
    microscopeBase.position.set(0.2, 0.32, 0);
    object.add(microscopeBase);
    const stem = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.055, 10, 28, Math.PI * 1.45), material(0xb7edff));
    stem.position.set(0.16, 0.63, 0);
    stem.rotation.z = -0.35;
    object.add(stem);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.42, 18), material(0xdff8ff));
    lens.position.set(0.22, 0.83, 0);
    lens.rotation.z = 0.45;
    object.add(lens);
  }

  if (definition.id === "papers") {
    const shelf = box([1.55, 1.45, 0.22], 0x30435f);
    shelf.position.y = 0.08;
    object.add(shelf);
    [0.5, 0, -0.5].forEach((y) => {
      const ledge = box([1.68, 0.07, 0.42], 0x617c9f);
      ledge.position.set(0, y, 0.1);
      object.add(ledge);
    });
    const colors = [0x99d9ff, 0xa78bfa, 0xffb88f, 0x75e4c4, 0xe7f1ff, 0x718bb6];
    colors.forEach((color, index) => {
      const book = box([0.13 + (index % 2) * 0.04, 0.34 + (index % 3) * 0.06, 0.32], color);
      book.position.set(-0.58 + index * 0.23, -0.27 + (index > 3 ? 0.52 : 0), 0.25);
      book.rotation.z = (index - 2) * 0.025;
      object.add(book);
    });
  }

  if (definition.id === "music") {
    const player = box([1.5, 0.24, 1.12], 0x3b2d52);
    object.add(player);
    const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.045, 48), material(0x111018, 0x57336f));
    vinyl.position.set(-0.18, 0.16, 0);
    object.add(vinyl);
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.052, 32), material(0xe7a5ff));
    label.position.set(-0.18, 0.19, 0);
    object.add(label);
    const arm = box([0.05, 0.06, 0.58], 0xd7c7ee);
    arm.position.set(0.38, 0.25, 0.05);
    arm.rotation.y = -0.36;
    object.add(arm);
  }

  if (definition.id === "gallery") {
    [-0.75, 0, 0.75].forEach((x, index) => {
      const frame = box([0.62, 0.88, 0.07], 0x446c75);
      frame.position.set(x, 0, index === 1 ? 0.14 : 0);
      frame.rotation.y = (index - 1) * -0.18;
      object.add(frame);
      const image = box([0.49, 0.72, 0.03], [0x70e1c1, 0x9bbcff, 0xff9cae][index]);
      image.position.set(x, 0, index === 1 ? 0.19 : 0.05);
      image.rotation.y = (index - 1) * -0.18;
      object.add(image);
    });
  }

  if (definition.id === "notes") {
    const cover = box([1.45, 0.12, 1.02], 0x7f513b);
    cover.rotation.z = 0.06;
    object.add(cover);
    const pages = box([1.32, 0.13, 0.92], 0xf5dfbb);
    pages.position.y = 0.1;
    pages.rotation.z = 0.06;
    object.add(pages);
    for (let index = 0; index < 5; index += 1) {
      const line = box([0.72 - index * 0.07, 0.008, 0.015], 0xa87855);
      line.position.set(-0.1, 0.18, -0.25 + index * 0.13);
      line.rotation.y = -0.05;
      object.add(line);
    }
  }

  if (definition.id === "memory") {
    const body = box([1.25, 0.82, 0.54], 0x4b3342);
    object.add(body);
    const top = box([0.62, 0.25, 0.48], 0x68495a);
    top.position.set(-0.15, 0.5, 0);
    object.add(top);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.34, 0.42, 32), material(0xffaac0));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0.1, 0, -0.42);
    object.add(lens);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.44, 32), material(0x9de8ff));
    glass.rotation.x = Math.PI / 2;
    glass.position.set(0.1, 0, -0.46);
    object.add(glass);
  }

  const haloMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: definition.color,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMaterial);
  halo.scale.set(3.6, 3.6, 1);
  halo.position.y = 0.15;
  halo.userData.baseOpacity = 0.4;
  root.add(halo);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: definition.color,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.012, 8, 64), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.62;
  ring.userData.baseOpacity = 0.48;
  root.add(ring);

  return root;
}

function createTunnel(glowTexture: THREE.Texture) {
  const group = new THREE.Group();
  const random = seededRandom(911);
  const count = 2300;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const nodes: THREE.Vector3[] = [];

  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 2.4 + Math.pow(random(), 0.72) * 7.3;
    const z = 4 - random() * 33;
    positions[index * 3] = Math.cos(angle) * radius + Math.sin(z * 0.21) * 0.7;
    positions[index * 3 + 1] = Math.sin(angle) * radius * 0.64;
    positions[index * 3 + 2] = z;
    const color = new THREE.Color().setHSL(0.55 + random() * 0.2, 0.78, 0.5 + random() * 0.25);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
    if (index < 135) nodes.push(new THREE.Vector3(positions[index * 3], positions[index * 3 + 1], z));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const pointMaterial = new THREE.PointsMaterial({
    size: 0.045,
    transparent: true,
    opacity: 0.78,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Points(geometry, pointMaterial));

  const segments: number[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const origin = nodes[index];
    let best: THREE.Vector3 | null = null;
    let bestDistance = 4.4;
    for (let candidate = index + 1; candidate < Math.min(nodes.length, index + 18); candidate += 1) {
      const distance = origin.distanceTo(nodes[candidate]);
      if (distance < bestDistance) {
        best = nodes[candidate];
        bestDistance = distance;
      }
    }
    if (best) segments.push(origin.x, origin.y, origin.z, best.x, best.y, best.z);
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x5f9dff,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  nodes.slice(0, 26).forEach((node, index) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: index % 4 === 0 ? 0xc38cff : 0x65d9ff,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    sprite.position.copy(node);
    const size = 1.1 + random() * 2.2;
    sprite.scale.set(size, size, 1);
    group.add(sprite);
  });

  return group;
}

export default function CosmosExperience() {
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<Mode>("mind");
  const layerRef = useRef<Layer>("atlas");
  const yearRef = useRef(2026);
  const nudgeDepthRef = useRef<(amount: number) => void>(() => undefined);
  const [mode, setMode] = useState<Mode>("mind");
  const [layer, setLayer] = useState<Layer>("atlas");
  const [year, setYear] = useState(2026);
  const [hovered, setHovered] = useState<ArtifactId | "gateway" | null>(null);
  const [selected, setSelected] = useState<ArtifactId | null>(null);
  const selectedArtifact = ARTIFACTS.find((item) => item.id === selected) ?? null;

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    layerRef.current = layer;
    if (layer === "visual") setSelected(null);
  }, [layer]);

  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let destroyed = false;
    let frame = 0;
    let morph = 0;
    let dive = 0;
    let deepZ = 3.4;
    let outerDistance = 9.2;
    let targetRotationX = -0.04;
    let targetRotationY = -0.22;
    let lookYaw = 0;
    let lookPitch = 0;
    let pointerDown = false;
    let pointerMoved = false;
    let pointerX = 0;
    let pointerY = 0;
    let activeHover: ArtifactId | "gateway" | null = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040b);
    scene.fog = new THREE.FogExp2(0x030714, 0.026);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 140);
    camera.position.set(0, 0.1, outerDistance);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.domElement.setAttribute("aria-label", "Interactive three-dimensional particle brain and neural cosmos");
    mount.appendChild(renderer.domElement);

    const glowTexture = createGlowTexture();
    const textureLoader = new THREE.TextureLoader();
    const environmentTexture = textureLoader.load("/neural-nebula.webp", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture;
    });

    scene.add(new THREE.AmbientLight(0x45658e, 0.5));
    const keyLight = new THREE.PointLight(0x9bddff, 22, 38, 2);
    keyLight.position.set(-3, 4, 7);
    scene.add(keyLight);
    const violetLight = new THREE.PointLight(0xbf7dff, 13, 34, 2);
    violetLight.position.set(5, -2, -2);
    scene.add(violetLight);

    const brainGroup = new THREE.Group();
    scene.add(brainGroup);
    const particleCount = window.innerWidth < 760 ? 5200 : 9800;
    const brainData = createBrainData(particleCount);
    const livePositions = brainData.brain.slice();
    const brainGeometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.BufferAttribute(livePositions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    brainGeometry.setAttribute("position", positionAttribute);
    brainGeometry.setAttribute("color", new THREE.BufferAttribute(brainData.colors, 3));
    const brainMaterial = new THREE.PointsMaterial({
      size: window.innerWidth < 760 ? 0.048 : 0.036,
      transparent: true,
      opacity: 0.94,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const brainPoints = new THREE.Points(brainGeometry, brainMaterial);
    brainPoints.rotation.z = -0.04;
    brainGroup.add(brainPoints);

    const cortexMaterial = new THREE.MeshBasicMaterial({
      color: 0x8de9ff,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const gateway = new THREE.Group();
    gateway.position.set(0, 0.05, -2.18);
    gateway.userData.gateway = true;
    const cortexRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.018, 10, 80), cortexMaterial);
    cortexRing.userData.gateway = true;
    gateway.add(cortexRing);
    const cortexHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0x70ddff,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    cortexHalo.scale.set(2.7, 2.7, 1);
    cortexHalo.userData.gateway = true;
    gateway.add(cortexHalo);
    const hitArea = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 20, 20),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    hitArea.userData.gateway = true;
    gateway.add(hitArea);
    brainGroup.add(gateway);

    const deepGroup = createTunnel(glowTexture);
    deepGroup.visible = false;
    scene.add(deepGroup);
    const artifactGroups = new Map<ArtifactId, THREE.Group>();
    ARTIFACTS.forEach((definition) => {
      const group = createArtifactObject(definition, glowTexture);
      artifactGroups.set(definition.id, group);
      deepGroup.add(group);
    });

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.14;
    const pointer = new THREE.Vector2();
    const outerPosition = new THREE.Vector3();
    const deepPosition = new THREE.Vector3();
    const outerLook = new THREE.Vector3(0, 0, 0);
    const deepLook = new THREE.Vector3();
    const cameraLook = new THREE.Vector3();

    const findArtifact = (object: THREE.Object3D | null) => {
      let current = object;
      while (current) {
        if (current.userData.artifactId) return current.userData.artifactId as ArtifactId;
        current = current.parent;
      }
      return null;
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pick = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      if (layerRef.current === "atlas") {
        const hits = raycaster.intersectObject(gateway, true);
        return hits.length ? "gateway" : null;
      }
      const hits = raycaster.intersectObjects(Array.from(artifactGroups.values()), true);
      return hits.length ? findArtifact(hits[0].object) : null;
    };

    const setActiveHover = (next: ArtifactId | "gateway" | null) => {
      if (next === activeHover) return;
      activeHover = next;
      setHovered(next);
      renderer.domElement.style.cursor = next ? "pointer" : pointerDown ? "grabbing" : "grab";
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
        setActiveHover(pick(event));
        return;
      }
      const deltaX = event.clientX - pointerX;
      const deltaY = event.clientY - pointerY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 2) pointerMoved = true;
      if (layerRef.current === "atlas") {
        targetRotationY += deltaX * 0.0052;
        targetRotationX = clamp(targetRotationX + deltaY * 0.0042, -0.58, 0.58);
      } else {
        lookYaw = clamp(lookYaw - deltaX * 0.0025, -0.58, 0.58);
        lookPitch = clamp(lookPitch - deltaY * 0.002, -0.32, 0.32);
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerMoved) {
        const picked = pick(event);
        if (picked === "gateway") setLayer("visual");
        if (picked && picked !== "gateway") setSelected(picked);
      }
      pointerDown = false;
      renderer.domElement.style.cursor = activeHover ? "pointer" : "grab";
    };

    const handlePointerLeave = () => {
      pointerDown = false;
      pointerMoved = false;
      setActiveHover(null);
      renderer.domElement.style.cursor = "grab";
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (layerRef.current === "atlas") {
        outerDistance = clamp(outerDistance + event.deltaY * 0.006, 6.4, 12.4);
      } else {
        deepZ = clamp(deepZ + event.deltaY * 0.009, -27.5, 3.8);
      }
    };

    nudgeDepthRef.current = (amount: number) => {
      deepZ = clamp(deepZ + amount, -27.5, 3.8);
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });

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
      const time = clock.getElapsedTime();
      const targetMorph = modeRef.current === "cosmos" ? 1 : 0;
      morph += (targetMorph - morph) * 0.055;
      const targetDive = layerRef.current === "visual" ? 1 : 0;
      dive += (targetDive - dive) * 0.055;
      const smoothDive = ease(clamp(dive, 0, 1));

      const positions = positionAttribute.array as Float32Array;
      for (let index = 0; index < particleCount * 3; index += 1) {
        positions[index] = brainData.brain[index] + (brainData.cosmos[index] - brainData.brain[index]) * morph;
      }
      positionAttribute.needsUpdate = true;
      brainMaterial.opacity = 0.94 * (1 - smoothDive);

      brainGroup.rotation.x += (targetRotationX - brainGroup.rotation.x) * 0.065;
      brainGroup.rotation.y += (targetRotationY - brainGroup.rotation.y) * 0.065;
      brainGroup.rotation.y += (layerRef.current === "atlas" ? 0.0007 : 0) * Math.sin(time * 0.32);
      brainGroup.scale.setScalar(1 + Math.sin(time * 1.35) * 0.006);
      gateway.position.x = THREE.MathUtils.lerp(0, 2.4, morph);
      gateway.position.y = THREE.MathUtils.lerp(0.05, 0.34, morph);
      gateway.position.z = THREE.MathUtils.lerp(-2.18, -1.25, morph);
      gateway.lookAt(camera.position);
      const pulse = 1 + Math.sin(time * 2.4) * 0.09;
      cortexRing.scale.setScalar(activeHover === "gateway" ? pulse * 1.16 : pulse);
      cortexHalo.scale.setScalar((activeHover === "gateway" ? 3.25 : 2.7) * pulse);
      cortexMaterial.opacity = (activeHover === "gateway" ? 0.92 : 0.58) * (1 - smoothDive);

      deepGroup.visible = dive > 0.015;
      deepGroup.scale.setScalar(0.72 + smoothDive * 0.28);
      deepGroup.rotation.z = Math.sin(time * 0.08) * 0.02;
      artifactGroups.forEach((group, id) => {
        group.visible = yearRef.current >= group.userData.year;
        group.position.y = group.userData.baseY + Math.sin(time * 0.62 + group.userData.phase) * 0.16;
        group.rotation.y += 0.0025;
        const targetScale = activeHover === id ? 1.15 : 1;
        const nextScale = group.scale.x + (targetScale - group.scale.x) * 0.09;
        group.scale.setScalar(nextScale);
      });

      outerPosition.set(0, 0.08, outerDistance);
      deepPosition.set(Math.sin(lookYaw) * 0.68, lookPitch * 1.5, deepZ);
      camera.position.lerpVectors(outerPosition, deepPosition, smoothDive);
      deepLook.set(
        deepPosition.x + Math.sin(lookYaw) * 4.2,
        deepPosition.y + lookPitch * 3,
        deepPosition.z - 6,
      );
      cameraLook.lerpVectors(outerLook, deepLook, smoothDive);
      camera.lookAt(cameraLook);

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
          object.geometry?.dispose();
          const objectMaterial = object.material;
          if (Array.isArray(objectMaterial)) objectMaterial.forEach((item) => item.dispose());
          else objectMaterial?.dispose();
        }
        if (object instanceof THREE.Sprite) object.material.dispose();
      });
      glowTexture.dispose();
      environmentTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const diveIn = () => {
    setSelected(null);
    setLayer("visual");
  };

  const returnToAtlas = () => {
    setSelected(null);
    setLayer("atlas");
  };

  return (
    <main className={`cosmos-experience mode-${mode} layer-${layer}`}>
      <div ref={mountRef} className="cosmos-stage" />
      <div className="cosmos-vignette" aria-hidden="true" />

      <header className="minimal-header">
        <button className="identity" type="button" onClick={returnToAtlas} aria-label="Return to the mind atlas">
          <span className="identity-mark">YC</span>
          <span className="identity-copy">
            <strong>PERSONAL COSMOS</strong>
            <small>{layer === "atlas" ? "MIND ATLAS / ORBIT" : "VISUAL CORTEX / DEPTH FIELD"}</small>
          </span>
        </button>

        <div className="mode-control" role="group" aria-label="Choose mind or cosmos view">
          <button className={mode === "mind" ? "is-active" : ""} onClick={() => setMode("mind")}>
            MIND
          </button>
          <span aria-hidden="true"><i style={{ transform: `translateX(${mode === "mind" ? "0" : "100%"})` }} /></span>
          <button className={mode === "cosmos" ? "is-active" : ""} onClick={() => setMode("cosmos")}>
            COSMOS
          </button>
        </div>
      </header>

      {layer === "visual" && (
        <button className="back-control" type="button" onClick={returnToAtlas}>
          <span>←</span> RETURN TO ATLAS
        </button>
      )}

      {layer === "atlas" && (
        <section className="atlas-copy" aria-live="polite">
          <p>{mode === "mind" ? "A LIVING MAP OF ONE MIND" : "THE SAME SELF, SEEN AS A UNIVERSE"}</p>
          <h1>{mode === "mind" ? "Find the signal." : "Follow the light."}</h1>
          <button className={hovered === "gateway" ? "gateway-button is-awake" : "gateway-button"} onClick={diveIn}>
            <span />
            {mode === "mind" ? "DIVE INTO VISUAL CORTEX" : "ENTER THE VISUAL NEBULA"}
          </button>
        </section>
      )}

      {layer === "visual" && !selectedArtifact && (
        <div className="depth-copy">
          <span className="depth-coordinate">DEPTH FIELD · {mode === "mind" ? "NEURAL" : "COSMIC"}</span>
          <p>{hovered && hovered !== "gateway" ? ARTIFACTS.find((item) => item.id === hovered)?.title : "Move forward. Every object holds a different part of the archive."}</p>
        </div>
      )}

      {selectedArtifact && (
        <aside className="artifact-card" aria-live="polite">
          <button onClick={() => setSelected(null)} aria-label="Close artifact">×</button>
          <span>{selectedArtifact.eyebrow}</span>
          <h2>{selectedArtifact.title}</h2>
          <p>{selectedArtifact.description}</p>
          <div>
            <small>FIRST SIGNAL</small>
            <strong>{selectedArtifact.year}</strong>
          </div>
          <em>CONTENT MODULE · READY FOR YOUR MATERIAL</em>
        </aside>
      )}

      <div className="gesture-guide">
        {layer === "atlas" ? "DRAG TO ROTATE · SCROLL TO APPROACH · CLICK THE PULSE" : "DRAG TO LOOK · SCROLL TO MOVE · CLICK AN OBJECT"}
      </div>

      {layer === "visual" && (
        <div className="depth-buttons" aria-label="Move through the depth field">
          <button onClick={() => nudgeDepthRef.current(3.2)} aria-label="Move backward">↑</button>
          <button onClick={() => nudgeDepthRef.current(-3.2)} aria-label="Move forward">↓</button>
        </div>
      )}

      <section className="timeline" aria-label="Personal timeline">
        <div className="timeline-meta">
          <span>TIME COORDINATE</span>
          <strong>{year}</strong>
          <span>{year === 2026 ? "NOW" : year < 2021 ? "EARLY SIGNALS" : "ARCHIVE OPEN"}</span>
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
        <div className="timeline-years" aria-hidden="true">
          <span>2019</span><span>2021</span><span>2023</span><span>2024</span><span>2026</span>
        </div>
      </section>
    </main>
  );
}
