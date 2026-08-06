import * as THREE from "three";

export type Mode = "mind" | "cosmos";
export type RegionId = "visual" | "lab" | "music" | "projects" | "archive";

export type RegionDefinition = {
  id: RegionId;
  title: string;
  whisper: string;
  color: number;
  mind: [number, number, number];
  cosmos: [number, number, number];
};

export type InteractiveInfo = {
  title: string;
  eyebrow: string;
  description: string;
  year: number;
};

export const REGIONS: RegionDefinition[] = [
  {
    id: "visual",
    title: "Visual Cortex",
    whisper: "images · paintings · photographs",
    color: 0x74e6ff,
    mind: [0.72, 0.02, -2.2],
    cosmos: [-4.8, 1.5, -1.2],
  },
  {
    id: "lab",
    title: "Research Lab",
    whisper: "papers · experiments · instruments",
    color: 0x86ffca,
    mind: [-1.55, 0.6, 0.82],
    cosmos: [4.3, 2.15, -2.8],
  },
  {
    id: "music",
    title: "Sound System",
    whisper: "records · compositions · sketches",
    color: 0xff8cd8,
    mind: [1.72, -0.7, -0.08],
    cosmos: [4.9, -2.1, 1.6],
  },
  {
    id: "projects",
    title: "Prototype Bay",
    whisper: "products · open source · unfinished ideas",
    color: 0xffb86b,
    mind: [-0.2, 0.36, 2.22],
    cosmos: [-1.1, -2.85, -4.6],
  },
  {
    id: "archive",
    title: "Memory Archive",
    whisper: "notes · fiction · books · moments",
    color: 0xb89cff,
    mind: [-0.72, 1.48, -0.48],
    cosmos: [0.9, 3.35, 3.4],
  },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function pbr(color: number, roughness = 0.55, metalness = 0.15) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(
  width: number,
  height: number,
  depth: number,
  color: number,
  position: [number, number, number],
  roughness = 0.55,
  metalness = 0.12,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), pbr(color, roughness, metalness));
  mesh.position.set(...position);
  return mesh;
}

function cylinder(
  radius: number,
  height: number,
  color: number,
  position: [number, number, number],
  radialSegments = 24,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radialSegments), pbr(color));
  mesh.position.set(...position);
  return mesh;
}

export function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.16, "rgba(215,244,255,.86)");
  gradient.addColorStop(0.48, "rgba(120,190,255,.22)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createBrainParticles(count: number) {
  const random = seededRandom(9713);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const base = new THREE.Color();
  const regionColor = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const hemisphere = random() > 0.5 ? 1 : -1;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const wrinkle = 1 + 0.075 * Math.sin(theta * 8 + phi * 5) + 0.035 * Math.sin(theta * 17 - phi * 9);
    const lobe = 1 + 0.08 * Math.sin(phi * 3.2) * Math.cos(theta * 2.5);
    const shell = random() > 0.15 ? 1 : 0.72 + random() * 0.25;
    let x = Math.sin(phi) * Math.cos(theta) * 2.35 * wrinkle * lobe * shell;
    const y = Math.cos(phi) * 1.78 * wrinkle * shell + 0.08;
    let z = Math.sin(phi) * Math.sin(theta) * 2.25 * wrinkle * shell;
    x = hemisphere * (Math.abs(x) * 0.94 + 0.11);
    const cleft = Math.exp(-Math.abs(x) * 8) * 0.18;
    x += Math.sign(x) * cleft;
    z += 0.16 * Math.sin(y * 2.2);

    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;

    base.setHSL(0.57 + random() * 0.11, 0.58 + random() * 0.2, 0.57 + random() * 0.27);
    let influence = 0;
    for (const region of REGIONS) {
      const distance = Math.hypot(x - region.mind[0], y - region.mind[1], z - region.mind[2]);
      const nextInfluence = clamp(1 - distance / 0.86, 0, 1);
      if (nextInfluence > influence) {
        influence = nextInfluence;
        regionColor.set(region.color);
      }
    }
    if (influence > 0) base.lerp(regionColor, influence * 0.78);
    colors[index * 3] = base.r;
    colors[index * 3 + 1] = base.g;
    colors[index * 3 + 2] = base.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: count < 7000 ? 0.052 : 0.038,
      transparent: true,
      opacity: 0.94,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
}

function createEntry(position: [number, number, number], region: RegionDefinition, glow: THREE.Texture) {
  const root = new THREE.Group();
  root.position.set(...position);
  root.userData.regionId = region.id;
  root.userData.baseScale = 1;

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: region.color,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  halo.scale.set(0.58, 0.58, 1);
  halo.userData.regionId = region.id;
  root.add(halo);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 14, 14),
    new THREE.MeshBasicMaterial({ color: region.color, transparent: true, opacity: 0.76 }),
  );
  core.userData.regionId = region.id;
  root.add(core);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 12, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.userData.regionId = region.id;
  root.add(hit);
  return root;
}

function createGalaxy(seed: number, color: number, radius: number, count: number, glow: THREE.Texture) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const outer = new THREE.Color(color);
  const warm = new THREE.Color(0xffe6b2);
  const current = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const distance = Math.pow(random(), 0.6) * radius;
    const arm = Math.floor(random() * 4);
    const angle = (arm / 4) * Math.PI * 2 + distance * 2.4 + (random() - 0.5) * 0.48;
    const thickness = (1 - distance / radius) * 0.28 + 0.035;
    positions[index * 3] = Math.cos(angle) * distance + (random() - 0.5) * thickness;
    positions[index * 3 + 1] = (random() - 0.5) * thickness * 1.8;
    positions[index * 3 + 2] = Math.sin(angle) * distance + (random() - 0.5) * thickness;
    current.copy(warm).lerp(outer, clamp(distance / radius, 0, 1));
    colors[index * 3] = current.r;
    colors[index * 3 + 1] = current.g;
    colors[index * 3 + 2] = current.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: radius * 0.045,
      map: glow,
      alphaTest: 0.01,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  root.add(points);

  const core = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glow, color: 0xffefca, transparent: true, opacity: 0.76, blending: THREE.AdditiveBlending }),
  );
  core.scale.set(radius * 0.72, radius * 0.72, 1);
  root.add(core);
  return root;
}

function createStarVolume(count: number, radius: number, glow?: THREE.Texture) {
  const random = seededRandom(8080 + count);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let index = 0; index < count; index += 1) {
    const r = Math.cbrt(random()) * radius;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[index * 3] = Math.sin(phi) * Math.cos(theta) * r;
    positions[index * 3 + 1] = Math.cos(phi) * r;
    positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    color.setHSL(0.52 + random() * 0.18, 0.35 + random() * 0.45, 0.58 + random() * 0.34);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ map: glow, alphaTest: glow ? 0.01 : 0, size: 0.045, vertexColors: true, transparent: true, opacity: 0.74, depthWrite: false }),
  );
}

export function createAtlas(glow: THREE.Texture, isMobile: boolean) {
  const mind = new THREE.Group();
  const cosmos = new THREE.Group();
  const mindEntries = new Map<RegionId, THREE.Group>();
  const cosmosEntries = new Map<RegionId, THREE.Group>();

  const brain = createBrainParticles(isMobile ? 6200 : 12500);
  mind.add(brain);
  REGIONS.forEach((region, index) => {
    const entry = createEntry(region.mind, region, glow);
    entry.userData.phase = index;
    mindEntries.set(region.id, entry);
    mind.add(entry);
  });

  cosmos.add(createStarVolume(isMobile ? 1600 : 3600, 14, glow));
  REGIONS.forEach((region, index) => {
    const galaxy = createGalaxy(1200 + index * 91, region.color, 1.45 + (index % 2) * 0.34, isMobile ? 520 : 920, glow);
    galaxy.position.set(...region.cosmos);
    galaxy.rotation.set((index - 2) * 0.17, index * 0.54, index * 0.22);
    galaxy.userData.regionId = region.id;
    galaxy.traverse((child) => { child.userData.regionId = region.id; });
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    hit.userData.regionId = region.id;
    galaxy.add(hit);
    cosmosEntries.set(region.id, galaxy);
    cosmos.add(galaxy);
  });

  for (let index = 0; index < 10; index += 1) {
    const filler = createGalaxy(4000 + index * 53, [0x6aaaff, 0xda82ff, 0xffa968][index % 3], 0.3 + (index % 4) * 0.14, isMobile ? 90 : 150, glow);
    const destination = REGIONS[index % REGIONS.length].id;
    filler.userData.regionId = destination;
    filler.traverse((child) => { child.userData.regionId = destination; });
    const angle = index * 2.18;
    filler.position.set(Math.cos(angle) * (7 + (index % 3)), ((index * 3) % 7) - 3, Math.sin(angle) * (7 + (index % 4)));
    filler.rotation.set(index * 0.12, angle, index * 0.21);
    cosmos.add(filler);
  }

  mind.visible = true;
  cosmos.visible = false;
  return { mind, cosmos, mindEntries, cosmosEntries };
}

function tagInteractive(root: THREE.Group, info: InteractiveInfo) {
  root.userData.interactive = info;
  root.userData.year = info.year;
  return root;
}

function artworkTexture(seed: number, color: number) {
  const random = seededRandom(seed);
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 220;
  const context = canvas.getContext("2d")!;
  const base = new THREE.Color(color);
  const gradient = context.createLinearGradient(0, 0, 320, 220);
  gradient.addColorStop(0, `#${base.clone().offsetHSL(-0.08, 0.05, -0.25).getHexString()}`);
  gradient.addColorStop(0.5, `#${base.getHexString()}`);
  gradient.addColorStop(1, `#${base.clone().offsetHSL(0.13, -0.08, -0.15).getHexString()}`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 320, 220);
  context.globalCompositeOperation = "screen";
  for (let index = 0; index < 24; index += 1) {
    context.fillStyle = `rgba(255,255,255,${0.025 + random() * 0.15})`;
    context.beginPath();
    context.arc(random() * 320, random() * 220, 4 + random() * 56, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roomShell(color: number, length = 64) {
  const room = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, length), pbr(color, 0.72, 0.2));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -length / 2 + 8);
  room.add(floor);
  const grid = new THREE.GridHelper(length, 42, 0x35516c, 0x172536);
  grid.position.set(0, 0.012, -length / 2 + 8);
  grid.scale.x = 18 / length;
  room.add(grid);
  for (let z = 6; z > -length + 12; z -= 6) {
    const rib = new THREE.Group();
    rib.add(box(0.08, 6.2, 0.08, 0x35516c, [-8.9, 3.1, z], 0.3, 0.65));
    rib.add(box(0.08, 6.2, 0.08, 0x35516c, [8.9, 3.1, z], 0.3, 0.65));
    rib.add(box(17.85, 0.08, 0.08, 0x35516c, [0, 6.15, z], 0.3, 0.65));
    room.add(rib);
  }
  return room;
}

function createFrame(seed: number, color: number, position: [number, number, number], side: number) {
  const root = new THREE.Group();
  root.position.set(...position);
  root.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  const frame = box(3.25, 2.25, 0.16, 0x101722, [0, 0, 0], 0.35, 0.55);
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 1.9),
    new THREE.MeshBasicMaterial({ map: artworkTexture(seed, color), toneMapped: false }),
  );
  art.position.z = 0.09;
  root.add(frame, art);
  return root;
}

function createGallery(region: RegionDefinition) {
  const root = roomShell(0x07101a, 74);
  const titles = ["Mountain Studies", "Good Days / Album I", "Oil & Hand", "Field Notes in Light", "Snow Archive", "Illustration Cabinet"];
  for (let index = 0; index < 14; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const frame = createFrame(900 + index * 17, [0x4fbad5, 0x9e6be8, 0xe69078, 0x72b58d][index % 4], [side * 7.65, 2.7 + (index % 3) * 0.35, 3 - index * 4.1,], side);
    tagInteractive(frame, {
      title: titles[index % titles.length],
      eyebrow: `VISUAL CORTEX · FRAME ${String(index + 1).padStart(2, "0")}`,
      description: "A place reserved for a real photograph, painting or drawing. The spatial gallery is ready; the personal work will replace this study image.",
      year: 2019 + (index % 7),
    });
    root.add(frame);
  }
  for (let index = 0; index < 5; index += 1) {
    const pedestal = new THREE.Group();
    pedestal.position.set((index % 2 ? 1 : -1) * 2.2, 0, -4 - index * 10);
    pedestal.add(box(2.4, 0.75, 1.65, 0x111b29, [0, 0.38, 0], 0.45, 0.5));
    for (let page = 0; page < 7; page += 1) {
      const album = box(1.75, 0.055, 1.15, [0x315d80, 0x734e75, 0x6d563e][index % 3], [0, 0.82 + page * 0.045, page * 0.025], 0.68, 0.08);
      album.rotation.y = (page - 3) * 0.025;
      pedestal.add(album);
    }
    tagInteractive(pedestal, {
      title: `Photo Album ${String(index + 1).padStart(2, "0")}`,
      eyebrow: "MEMORY OBJECT",
      description: "An album that can later open page by page, holding travels, people, mountains and ordinary days worth remembering.",
      year: 2020 + index,
    });
    root.add(pedestal);
  }
  return root;
}

function createMicroscope(color = 0xc7d6df) {
  const scope = new THREE.Group();
  scope.add(box(1.15, 0.18, 0.85, 0x273746, [0, 0.1, 0], 0.42, 0.48));
  const stand = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.1, 12, 28, Math.PI * 1.35), pbr(color, 0.35, 0.45));
  stand.rotation.z = -0.5;
  stand.position.set(0.05, 0.68, 0);
  scope.add(stand);
  const tube = cylinder(0.16, 0.78, color, [0.12, 1.1, 0]);
  tube.rotation.z = -0.42;
  scope.add(tube);
  scope.add(cylinder(0.2, 0.18, 0x182531, [0.27, 1.45, 0]));
  scope.add(box(0.82, 0.08, 0.65, 0x182531, [0.02, 0.55, 0], 0.35, 0.4));
  return scope;
}

function createLab(region: RegionDefinition) {
  const root = roomShell(0x06110f, 80);
  for (let index = 0; index < 8; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const bench = new THREE.Group();
    bench.position.set(side * 5.15, 0, 2 - Math.floor(index / 2) * 13.5);
    bench.add(box(5.9, 0.2, 2.15, 0x30483f, [0, 1.45, 0], 0.46, 0.28));
    for (const x of [-2.55, 2.55]) for (const z of [-0.78, 0.78]) bench.add(box(0.16, 1.45, 0.16, 0x1c2b2b, [x, 0.72, z], 0.4, 0.6));
    if (index < 4) {
      const microscope = createMicroscope();
      microscope.position.set(index % 2 ? -1.4 : 1.3, 1.56, 0);
      microscope.rotation.y = side > 0 ? -1.1 : 1.1;
      bench.add(microscope);
    }
    for (let bottle = 0; bottle < 8; bottle += 1) {
      const flask = cylinder(0.1 + (bottle % 3) * 0.025, 0.42 + (bottle % 2) * 0.18, [0x65d9c5, 0xe6a15c, 0xa47de1][bottle % 3], [-2.3 + bottle * 0.55, 1.75, 0.55]);
      bench.add(flask);
    }
    const monitor = new THREE.Group();
    monitor.add(box(1.5, 0.95, 0.12, 0x0b1720, [0, 2.15, -0.65], 0.3, 0.55));
    monitor.add(new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.7), new THREE.MeshBasicMaterial({ color: index % 2 ? 0x1a8b82 : 0x315f9c })));
    monitor.children[1].position.set(0, 2.15, -0.71);
    monitor.children[1].rotation.y = Math.PI;
    bench.add(monitor);
    tagInteractive(bench, {
      title: index < 4 ? `Microscopy Station ${index + 1}` : `Experiment Bench ${index + 1}`,
      eyebrow: "RESEARCH LAB · LIVE BENCH",
      description: index < 4 ? "A complete working station for imaging, analysis and the questions that begin by looking closer." : "Protocols, samples, instruments and unfinished hypotheses share the same physical bench.",
      year: 2021 + (index % 5),
    });
    root.add(bench);
  }
  for (let row = 0; row < 3; row += 1) {
    const paperWall = new THREE.Group();
    paperWall.position.set(0, 1.1 + row * 1.25, -56);
    for (let index = 0; index < 8; index += 1) paperWall.add(box(1.35, 0.95, 0.035, 0xe8e1d2, [-5.5 + index * 1.58, 0, 0], 0.9, 0));
    root.add(paperWall);
  }
  return root;
}

function createMusic(region: RegionDefinition) {
  const root = roomShell(0x10091a, 68);
  const stage = new THREE.Group();
  stage.position.set(0, 0, -4);
  stage.add(cylinder(4.1, 0.42, 0x251632, [0, 0.22, 0], 56));
  stage.add(cylinder(2.75, 0.12, 0x101018, [0, 0.5, 0], 64));
  stage.add(cylinder(0.65, 0.14, 0xff8cd8, [0, 0.58, 0], 32));
  const tonearm = box(0.16, 0.15, 3.4, 0xd9c9a7, [2.4, 0.9, 0], 0.35, 0.65);
  tonearm.rotation.y = 0.45;
  stage.add(tonearm);
  tagInteractive(stage, { title: "Album I · Listening Table", eyebrow: "SOUND SYSTEM", description: "The central turntable for finished tracks, alternate mixes, stems and the stories behind each composition.", year: 2022 });
  root.add(stage);

  for (let index = 0; index < 18; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const cover = createFrame(1800 + index * 23, [0xef6ca8, 0x775ec8, 0xe5a34d, 0x4eb5c9][index % 4], [side * 7.7, 2.25 + (index % 3) * 0.5, -2 - index * 3], side);
    cover.scale.setScalar(0.68);
    tagInteractive(cover, { title: `Record / Sketch ${String(index + 1).padStart(2, "0")}`, eyebrow: "COMPOSITION ARCHIVE", description: "A slot for a track, demo, sonic experiment or unfinished musical idea.", year: 2019 + (index % 7) });
    root.add(cover);
  }
  for (const side of [-1, 1]) {
    const speaker = new THREE.Group();
    speaker.position.set(side * 5.4, 0, -8);
    speaker.add(box(2.1, 4.8, 1.5, 0x14121a, [0, 2.4, 0], 0.38, 0.25));
    for (const y of [1.1, 2.45, 3.75]) {
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.78, 0.26, 32), pbr(0x3d334d, 0.45, 0.28));
      cone.rotation.x = Math.PI / 2;
      cone.position.set(0, y, 0.82);
      speaker.add(cone);
    }
    root.add(speaker);
  }
  return root;
}

function createProjects(region: RegionDefinition) {
  const root = roomShell(0x130f08, 74);
  for (let index = 0; index < 12; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const bay = new THREE.Group();
    bay.position.set(side * 5.25, 0, 3 - Math.floor(index / 2) * 9.5);
    bay.add(box(5.4, 0.18, 2.1, 0x4b3824, [0, 1.25, 0], 0.62, 0.18));
    bay.add(box(0.15, 1.25, 0.15, 0x251f1a, [-2.35, 0.62, -0.7], 0.45, 0.55));
    bay.add(box(0.15, 1.25, 0.15, 0x251f1a, [2.35, 0.62, -0.7], 0.45, 0.55));
    const screen = box(1.9, 1.15, 0.12, 0x101820, [0, 2.12, -0.5], 0.32, 0.5);
    bay.add(screen);
    const prototype = index % 3 === 0
      ? new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), pbr(region.color, 0.3, 0.55))
      : index % 3 === 1
        ? new THREE.Mesh(new THREE.TorusKnotGeometry(0.46, 0.12, 72, 12), pbr(region.color, 0.3, 0.48))
        : new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.7, 8, 16), pbr(region.color, 0.32, 0.46));
    prototype.position.set(1.55, 1.85, 0);
    bay.add(prototype);
    tagInteractive(bay, { title: `Prototype Bay ${String(index + 1).padStart(2, "0")}`, eyebrow: "PROJECTS · OPEN SOURCE", description: "A buildable idea with room for source code, product notes, collaborators and the imperfect versions that came first.", year: 2020 + (index % 6) });
    root.add(bay);
  }
  return root;
}

function createArchive(region: RegionDefinition) {
  const root = roomShell(0x0d0a17, 82);
  for (let shelfIndex = 0; shelfIndex < 12; shelfIndex += 1) {
    const side = shelfIndex % 2 === 0 ? -1 : 1;
    const shelf = new THREE.Group();
    shelf.position.set(side * 6.1, 0, 4 - Math.floor(shelfIndex / 2) * 10.5);
    for (let level = 0; level < 4; level += 1) shelf.add(box(4.8, 0.12, 1.1, 0x34293f, [0, 0.65 + level * 1.25, 0], 0.55, 0.22));
    for (let book = 0; book < 36; book += 1) {
      const level = Math.floor(book / 9);
      const palette = [0x6b436f, 0x405f77, 0x7a6345, 0x446a58];
      shelf.add(box(0.38 + (book % 3) * 0.05, 0.82 + (book % 4) * 0.08, 0.78, palette[book % palette.length], [-2.05 + (book % 9) * 0.5, 1.12 + level * 1.25, 0], 0.74, 0.04));
    }
    tagInteractive(shelf, { title: shelfIndex % 3 === 0 ? "Novel Drafts" : shelfIndex % 3 === 1 ? "Children's Books" : "Loose Notebooks", eyebrow: "MEMORY ARCHIVE", description: "Writing, field notes and unfinished stories arranged as a place to wander—not a flat list of files.", year: 2019 + (shelfIndex % 7) });
    root.add(shelf);
  }
  for (let index = 0; index < 9; index += 1) {
    const memory = createFrame(2900 + index * 31, [0x8a70bd, 0x50799b, 0xa06f76][index % 3], [(index % 3 - 1) * 3.3, 1.5 + (index % 2), -8 - index * 6], 1);
    memory.rotation.y = 0;
    memory.scale.setScalar(0.52);
    root.add(memory);
  }
  return root;
}

export function createRegionWorld(region: RegionDefinition, glow: THREE.Texture) {
  const group = region.id === "visual"
    ? createGallery(region)
    : region.id === "lab"
      ? createLab(region)
      : region.id === "music"
        ? createMusic(region)
        : region.id === "projects"
          ? createProjects(region)
          : createArchive(region);

  group.userData.regionId = region.id;
  group.visible = false;
  const currentIndex = REGIONS.findIndex((item) => item.id === region.id);
  for (let index = 0; index < 3; index += 1) {
    const destination = REGIONS[(currentIndex + index + 1) % REGIONS.length];
    const portal = createGalaxy(7600 + currentIndex * 73 + index * 19, destination.color, 0.72 + index * 0.12, 260, glow);
    portal.position.set((index - 1) * 4.7, 3.3 + index * 0.72, -62 - index * 2.2);
    portal.rotation.set(index * 0.2, index * 0.9, 0.18 + index * 0.14);
    portal.userData.portalTo = destination.id;
    portal.traverse((child) => { child.userData.portalTo = destination.id; });
    group.add(portal);
  }
  const ambient = new THREE.AmbientLight(region.color, 0.72);
  const key = new THREE.PointLight(region.color, 34, 36, 1.8);
  key.position.set(-2, 5.2, 4);
  const fill = new THREE.PointLight(0xe9efff, 18, 30, 2);
  fill.position.set(5, 3, -12);
  group.add(ambient, key, fill, createStarVolume(1500, 46));
  return group;
}

export function findRegion(object: THREE.Object3D | null) {
  let current = object;
  while (current) {
    if (current.userData.regionId) return current.userData.regionId as RegionId;
    current = current.parent;
  }
  return null;
}

export function findInteractive(object: THREE.Object3D | null) {
  let current = object;
  while (current) {
    if (current.userData.interactive) return current.userData.interactive as InteractiveInfo;
    current = current.parent;
  }
  return null;
}

export function findPortal(object: THREE.Object3D | null) {
  let current = object;
  while (current) {
    if (current.userData.portalTo) return current.userData.portalTo as RegionId;
    current = current.parent;
  }
  return null;
}
