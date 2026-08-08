import * as THREE from "three";

export type Mode = "mind" | "cosmos";
export type LandmarkId = "papers" | "research" | "projects" | "music" | "art" | "photography" | "writing" | "future";

export type LandmarkDefinition = {
  id: LandmarkId;
  title: string;
  eyebrow: string;
  object: string;
  description: string;
  year: number;
  color: number;
  position: [number, number, number];
};

export const LANDMARKS: LandmarkDefinition[] = [
  { id: "papers", title: "Published Papers", eyebrow: "KNOWLEDGE SHELF", object: "A shelf of papers", description: "Published work, preprints, methods, and the questions that each paper left open.", year: 2020, color: 0x8fe5ff, position: [-8, 3, -8] },
  { id: "research", title: "Research Laboratory", eyebrow: "WHOLE-CELL PATCH CLAMP", object: "A patch-clamp rig", description: "Experiments, scientific projects, protocols, collaborators, and the small observations that changed the direction of the work.", year: 2021, color: 0x65f2c3, position: [11, -1, -40] },
  { id: "projects", title: "Products & Open Source", eyebrow: "BUILT IN PUBLIC", object: "A notebook computer", description: "Open-source tools, independent products, startup experiments, prototypes, and invitations to build together.", year: 2022, color: 0xffbf72, position: [-12, 5, -72] },
  { id: "music", title: "Music Archive", eyebrow: "RECORDS & COMPOSITIONS", object: "A record player", description: "Original music, albums, fragments, alternate mixes, and the stories behind each composition.", year: 2023, color: 0xf18bd5, position: [13, 2, -103] },
  { id: "art", title: "Gallery", eyebrow: "PAINTINGS & ILLUSTRATIONS", object: "Floating picture frames", description: "Illustrations, oil paintings, hand drawings, visual studies, and experiments that do not need words.", year: 2024, color: 0xb59aff, position: [-13, -4, -134] },
  { id: "photography", title: "Mountain Light", eyebrow: "PHOTOGRAPHY & MEMORY", object: "A snow mountain and photo album", description: "Snow mountains, photographs, personal memories, contact sheets, and small moments worth keeping.", year: 2025, color: 0xa9dcff, position: [9, 6, -165] },
  { id: "writing", title: "Writing Desk", eyebrow: "FICTION, NOTES & DRAFTS", object: "An open notebook and books", description: "Fiction, children's books, field notes, unfinished ideas, and projects looking for fellow travelers.", year: 2026, color: 0xff9b82, position: [-9, 1, -198] },
  { id: "future", title: "The Unmapped Region", eyebrow: "FUTURE SOCIAL WORK", object: "An unfinished constellation", description: "A quiet place reserved for future social initiatives, humanitarian experiments, and work that reaches beyond the self.", year: 2028, color: 0xffd47e, position: [12, -3, -232] },
];

export const getLandmark = (id: LandmarkId) => LANDMARKS.find((landmark) => landmark.id === id)!;

const seeded = (seed: number) => {
  let value = seed % 2147483647;
  return () => ((value = value * 16807 % 2147483647) - 1) / 2147483646;
};

const material = (color: number, metalness = 0.22, roughness = 0.45, emissive = 0x000000) => new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity: emissive ? 0.3 : 0 });

const box = (size: [number, number, number], color: number, position: [number, number, number], metalness = 0.2, roughness = 0.45) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color, metalness, roughness));
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const cylinder = (radius: number, height: number, color: number, position: [number, number, number], segments = 32) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material(color, 0.42, 0.32));
  mesh.position.set(...position);
  mesh.castShadow = true;
  return mesh;
};

export function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(255,255,255,.72)");
  gradient.addColorStop(0.38, "rgba(170,220,255,.2)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const tagLandmark = (group: THREE.Group, id: LandmarkId) => {
  group.userData.landmarkId = id;
  group.traverse((child) => { child.userData.landmarkId = id; });
};

function paperShelf() {
  const root = new THREE.Group();
  const wood = 0x6a4a32;
  root.add(box([6.7, 0.24, 1.25], wood, [0, -2.55, 0], 0.08, 0.76));
  root.add(box([0.24, 6.4, 1.25], wood, [-3.25, 0.55, 0], 0.08, 0.76));
  root.add(box([0.24, 6.4, 1.25], wood, [3.25, 0.55, 0], 0.08, 0.76));
  for (let row = 0; row < 4; row += 1) {
    root.add(box([6.5, 0.17, 1.2], wood, [0, -1.75 + row * 1.55, 0], 0.08, 0.76));
    for (let item = 0; item < 7; item += 1) {
      const paper = box([0.64 + (item % 2) * 0.14, 1.05, 0.08], [0xe9e4d7, 0xd9e6e9, 0xcbd7e8][(item + row) % 3], [-2.55 + item * 0.85, -1.13 + row * 1.55, 0.66], 0.02, 0.88);
      paper.rotation.z = (item % 3 - 1) * 0.035;
      root.add(paper);
      root.add(box([0.42, 0.035, 0.02], 0x526b7b, [paper.position.x, paper.position.y + 0.16, 0.72], 0, 1));
    }
  }
  root.rotation.y = -0.25;
  return root;
}

function patchClampRig() {
  const root = new THREE.Group();
  root.add(box([7.8, 0.34, 4.5], 0x26363b, [0, -2.1, 0], 0.5, 0.32));
  root.add(box([0.28, 3.8, 0.28], 0x27353a, [-3.2, -4, -1.6], 0.64, 0.25));
  root.add(box([0.28, 3.8, 0.28], 0x27353a, [3.2, -4, -1.6], 0.64, 0.25));
  const scope = new THREE.Group();
  scope.add(cylinder(1.15, 0.65, 0xdce5e3, [0, 0, 0]));
  scope.children[0].rotation.z = Math.PI / 2;
  scope.add(cylinder(0.46, 2.8, 0x304148, [0, 1.4, 0]));
  scope.add(cylinder(0.72, 0.3, 0x71dfc0, [0, 2.86, 0]));
  scope.add(box([2.2, 0.28, 0.42], 0xbec8c9, [0, -0.75, 0.1], 0.55, 0.24));
  scope.position.set(-1.4, -0.9, 0.2);
  scope.rotation.z = -0.18;
  root.add(scope);
  const dish = cylinder(1.2, 0.22, 0x5faeae, [1.25, -1.78, 0.3], 48);
  dish.material = new THREE.MeshPhysicalMaterial({ color: 0x70c7d1, transparent: true, opacity: 0.55, transmission: 0.35, roughness: 0.15 });
  root.add(dish);
  const pipette = cylinder(0.09, 4.6, 0xe7f8ff, [1.2, 0.1, 0.5], 16);
  pipette.rotation.z = Math.PI / 3.2;
  root.add(pipette);
  root.add(box([2.9, 2.1, 0.24], 0x10191e, [3.1, 0.55, -1], 0.44, 0.35));
  const trace = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 42 }, (_, index) => new THREE.Vector3(1.75 + index * 0.06, 0.55 + Math.sin(index * 0.72) * (index % 7 === 0 ? 0.45 : 0.1), -0.86))), new THREE.LineBasicMaterial({ color: 0x68f6ca }));
  root.add(trace);
  root.rotation.y = 0.3;
  return root;
}

function laptop() {
  const root = new THREE.Group();
  const base = box([6.2, 0.3, 4.1], 0xb7bdc2, [0, -1.6, 0.8], 0.78, 0.2);
  base.rotation.x = -0.08;
  root.add(base);
  for (let row = 0; row < 4; row += 1) for (let col = 0; col < 9; col += 1) root.add(box([0.42, 0.08, 0.32], 0x263038, [-1.75 + col * 0.45, -1.37, -0.08 + row * 0.5], 0.2, 0.45));
  const screen = new THREE.Group();
  screen.add(box([6.15, 3.8, 0.25], 0x2c3339, [0, 0, 0], 0.74, 0.18));
  screen.add(box([5.65, 3.3, 0.04], 0x071f29, [0, 0, 0.15], 0, 0.8));
  for (let line = 0; line < 7; line += 1) screen.add(box([2.2 + (line % 3) * 0.75, 0.08, 0.03], [0x6be6c1, 0x8cb9ff, 0xffbc77][line % 3], [-1.25 + (line % 2) * 0.35, 1.15 - line * 0.36, 0.19], 0, 1));
  screen.position.set(0, 0.28, -1.14);
  screen.rotation.x = -0.08;
  root.add(screen);
  root.rotation.y = -0.28;
  return root;
}

function turntable() {
  const root = new THREE.Group();
  root.add(box([7.2, 1, 5.4], 0x6b4439, [0, -1.65, 0], 0.16, 0.58));
  const record = cylinder(2.1, 0.16, 0x121018, [0, -1.05, 0.1], 64);
  record.userData.spin = 0.35;
  root.add(record);
  root.add(cylinder(0.38, 0.2, 0xff8fcf, [0, -0.94, 0.1]));
  const arm = box([0.22, 0.24, 3.4], 0xd4c7aa, [2.45, -0.65, -0.05], 0.55, 0.28);
  arm.rotation.y = 0.42;
  root.add(arm);
  root.add(cylinder(0.5, 0.42, 0x26262b, [2.9, -0.74, -1.45]));
  for (let index = 0; index < 5; index += 1) {
    const sleeve = box([2.6, 2.6, 0.1], [0xb56b9c, 0x587f9c, 0xdb9954, 0x645b98, 0x8a6f55][index], [-5 + index * 0.45, -0.25 + index * 0.25, 0.5 + index * 0.12], 0.05, 0.68);
    sleeve.rotation.y = 0.45;
    sleeve.rotation.z = -0.08;
    root.add(sleeve);
  }
  return root;
}

function gallery() {
  const root = new THREE.Group();
  const palettes = [[0xff895f, 0x552e69], [0x6dd5d0, 0x18345c], [0xf2c55d, 0x7c395a], [0x9d8cff, 0x352858]];
  [[-4, 1.6, 0], [0.1, -1.2, 1.1], [4.1, 1, -0.5], [-0.2, 3.1, -1.2]].forEach((position, index) => {
    const frame = new THREE.Group();
    frame.add(box([3.35, 4.25, 0.24], 0x8c6845, [0, 0, 0], 0.16, 0.6));
    frame.add(box([2.78, 3.68, 0.06], palettes[index][1], [0, 0, 0.16], 0, 0.82));
    const shape = new THREE.Mesh(index % 2 ? new THREE.TorusKnotGeometry(0.72, 0.18, 64, 10) : new THREE.IcosahedronGeometry(0.92, 1), new THREE.MeshStandardMaterial({ color: palettes[index][0], emissive: palettes[index][0], emissiveIntensity: 0.25, roughness: 0.5 }));
    shape.position.z = 0.35;
    shape.userData.floatPhase = index;
    frame.add(shape);
    frame.position.set(position[0], position[1], position[2]);
    frame.rotation.set((index - 1) * 0.04, (index - 1.5) * -0.17, (index % 2 ? 1 : -1) * 0.05);
    root.add(frame);
  });
  return root;
}

function mountainAlbum() {
  const root = new THREE.Group();
  const mountain = new THREE.Mesh(new THREE.IcosahedronGeometry(3.7, 2), new THREE.MeshStandardMaterial({ color: 0x7892a5, roughness: 0.96, flatShading: true }));
  mountain.scale.set(1.65, 1.15, 1.1);
  mountain.position.set(-1, -0.9, -0.4);
  mountain.rotation.set(0.2, 0.34, -0.1);
  root.add(mountain);
  const snow = new THREE.Mesh(new THREE.ConeGeometry(2.25, 2.4, 7), new THREE.MeshStandardMaterial({ color: 0xe9f7ff, roughness: 0.85, flatShading: true }));
  snow.position.set(-1, 1.42, -0.25);
  snow.rotation.y = 0.38;
  root.add(snow);
  const leftPage = box([3.4, 0.18, 4.2], 0xeee6d5, [3.45, -1.5, 0], 0.02, 0.9);
  leftPage.rotation.z = 0.11;
  leftPage.rotation.y = -0.14;
  root.add(leftPage);
  const photo = box([2.45, 0.08, 2.7], 0x5b88a0, [3.32, -1.32, 0], 0.02, 0.72);
  photo.rotation.copy(leftPage.rotation);
  root.add(photo);
  root.rotation.y = -0.22;
  return root;
}

function writingCluster() {
  const root = new THREE.Group();
  const pageLeft = box([3.6, 0.16, 4.8], 0xf1eadc, [-1.78, -0.6, 0], 0.02, 0.88);
  pageLeft.rotation.z = -0.07;
  const pageRight = box([3.6, 0.16, 4.8], 0xe9e1d2, [1.78, -0.6, 0], 0.02, 0.88);
  pageRight.rotation.z = 0.07;
  root.add(pageLeft, pageRight);
  for (let index = 0; index < 9; index += 1) root.add(box([1.8 + (index % 3) * 0.4, 0.045, 0.035], 0x6c6470, [index < 5 ? -1.9 : 1.2, -0.38, -1.45 + (index % 5) * 0.58], 0, 1));
  for (let index = 0; index < 6; index += 1) {
    const book = box([2.7, 0.55, 4], [0x784d55, 0x496678, 0x7c6847][index % 3], [-5 + (index % 2) * 10, -1.8 + index * 0.8, -0.8 + (index % 3)], 0.04, 0.72);
    book.rotation.set(index * 0.08, (index % 2 ? -1 : 1) * 0.3, index * 0.06);
    root.add(book);
  }
  const pencil = cylinder(0.09, 4.1, 0xe4a94f, [0.3, 0.1, 0.5], 12);
  pencil.rotation.z = 1.2;
  root.add(pencil);
  return root;
}

function futureConstellation() {
  const root = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 2), new THREE.MeshStandardMaterial({ color: 0xffd47e, emissive: 0xffa73b, emissiveIntensity: 1.1, transparent: true, opacity: 0.78 }));
  root.add(core);
  for (let index = 0; index < 4; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4 + index * 0.7, 0.035, 8, 96), new THREE.MeshBasicMaterial({ color: index % 2 ? 0x80d9ff : 0xffd47e, transparent: true, opacity: 0.6 }));
    ring.rotation.set(index * 0.52, index * 0.7, index * 0.28);
    ring.userData.orbit = (index % 2 ? -1 : 1) * (0.06 + index * 0.02);
    root.add(ring);
  }
  return root;
}

const artifactFactories: Record<LandmarkId, () => THREE.Group> = {
  papers: paperShelf,
  research: patchClampRig,
  projects: laptop,
  music: turntable,
  art: gallery,
  photography: mountainAlbum,
  writing: writingCluster,
  future: futureConstellation,
};

export function createLandmarkWorld(glow: THREE.Texture) {
  const root = new THREE.Group();
  const groups = new Map<LandmarkId, THREE.Group>();
  LANDMARKS.forEach((definition, index) => {
    const holder = new THREE.Group();
    holder.position.set(...definition.position);
    holder.userData.baseY = definition.position[1];
    holder.userData.floatPhase = index * 1.7;
    const artifact = artifactFactories[definition.id]();
    artifact.scale.setScalar(definition.id === "future" ? 1.18 : 0.78);
    holder.add(artifact);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: definition.color, transparent: true, opacity: 0.23, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(17, 17, 1);
    halo.position.z = -1.4;
    holder.add(halo);
    const light = new THREE.PointLight(definition.color, 24, 24, 1.8);
    light.position.set(0, 3, 3);
    holder.add(light);
    tagLandmark(holder, definition.id);
    holder.visible = index < 2;
    groups.set(definition.id, holder);
    root.add(holder);
  });
  return { root, groups };
}

function lineBetween(a: THREE.Vector3, b: THREE.Vector3, color: number, opacity: number) {
  const middle = a.clone().lerp(b, 0.5).add(new THREE.Vector3((a.x + b.x) * 0.08, 4, 0));
  const curve = new THREE.CatmullRomCurve3([a, middle, b]);
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)), new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending }));
}

function neuron(center: THREE.Vector3, seed: number, color: number) {
  const random = seeded(seed);
  const root = new THREE.Group();
  const soma = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15 + random() * 1.5, 2), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.65, transparent: true, opacity: 0.56, wireframe: random() > 0.45 }));
  soma.position.copy(center);
  root.add(soma);
  for (let branch = 0; branch < 7; branch += 1) {
    const direction = new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
    const end = center.clone().addScaledVector(direction, 7 + random() * 13);
    const control = center.clone().lerp(end, 0.52).add(new THREE.Vector3((random() - 0.5) * 5, (random() - 0.5) * 5, (random() - 0.5) * 5));
    const curve = new THREE.CatmullRomCurve3([center, control, end]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.025 + random() * 0.055, 5, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 + random() * 0.22, blending: THREE.AdditiveBlending }));
    root.add(tube);
    if (branch < 3) {
      const synapse = new THREE.Mesh(new THREE.SphereGeometry(0.18 + random() * 0.25, 10, 10), new THREE.MeshBasicMaterial({ color: 0xc5f6ff, transparent: true, opacity: 0.75 }));
      synapse.position.copy(end);
      synapse.userData.pulse = random() * 6;
      root.add(synapse);
    }
  }
  return root;
}

export function createMindEnvironment() {
  const root = new THREE.Group();
  const centers: THREE.Vector3[] = [];
  LANDMARKS.forEach((landmark, index) => {
    const base = new THREE.Vector3(...landmark.position);
    centers.push(base.clone().add(new THREE.Vector3(index % 2 ? -8 : 8, 4, -3)));
    centers.push(base.clone().add(new THREE.Vector3(index % 3 ? 11 : -12, -7, -11)));
  });
  centers.push(new THREE.Vector3(0, 0, 22), new THREE.Vector3(-18, 9, 8), new THREE.Vector3(18, -8, -22));
  centers.forEach((center, index) => root.add(neuron(center, 900 + index * 71, index % 3 === 0 ? 0x62e7ff : index % 3 === 1 ? 0x8b9cff : 0x63ffd0)));
  for (let index = 0; index < centers.length - 1; index += 1) root.add(lineBetween(centers[index], centers[index + 1], index % 2 ? 0x55cfff : 0x7c75ff, 0.12));

  const random = seeded(4401);
  const positions = new Float32Array(5400 * 3);
  const colors = new Float32Array(5400 * 3);
  for (let index = 0; index < 5400; index += 1) {
    positions[index * 3] = (random() - 0.5) * 90;
    positions[index * 3 + 1] = (random() - 0.5) * 62;
    positions[index * 3 + 2] = 45 - random() * 320;
    const tone = new THREE.Color(random() > 0.5 ? 0x5fdcff : 0x7d78ff).multiplyScalar(0.45 + random() * 0.5);
    colors[index * 3] = tone.r; colors[index * 3 + 1] = tone.g; colors[index * 3 + 2] = tone.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  root.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 0.48, depthWrite: false, blending: THREE.AdditiveBlending })));
  return root;
}

function galaxy(center: THREE.Vector3, seed: number, color: number, glow: THREE.Texture, scale = 1) {
  const random = seeded(seed);
  const root = new THREE.Group();
  root.position.copy(center);
  const count = 900;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const base = new THREE.Color(color);
  for (let index = 0; index < count; index += 1) {
    const radius = Math.pow(random(), 0.62) * 8.5 * scale;
    const arm = index % 4;
    const angle = radius * 0.82 + arm * Math.PI / 2 + (random() - 0.5) * 0.62;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = (random() - 0.5) * (1.4 - radius * 0.06) * scale;
    positions[index * 3 + 2] = Math.sin(angle) * radius;
    const shade = base.clone().lerp(new THREE.Color(0xffffff), Math.max(0, 1 - radius / 4) * 0.78);
    colors[index * 3] = shade.r; colors[index * 3 + 1] = shade.g; colors[index * 3 + 2] = shade.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  root.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.11, vertexColors: true, transparent: true, opacity: 0.84, depthWrite: false, blending: THREE.AdditiveBlending })));
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  core.scale.set(8 * scale, 8 * scale, 1);
  root.add(core);
  root.rotation.set((random() - 0.5) * 1.1, random() * Math.PI, (random() - 0.5) * 0.45);
  root.userData.galaxySpin = (random() > 0.5 ? 1 : -1) * (0.025 + random() * 0.025);
  return root;
}

export function createCosmosEnvironment(glow: THREE.Texture) {
  const root = new THREE.Group();
  LANDMARKS.forEach((landmark, index) => {
    const position = new THREE.Vector3(...landmark.position).add(new THREE.Vector3(index % 2 ? -18 : 18, (index % 3 - 1) * 10, -8));
    root.add(galaxy(position, 6000 + index * 181, [0x8f70ff, 0x55cfff, 0xff8ec8, 0xffb15c][index % 4], glow, 0.75 + (index % 3) * 0.17));
  });
  root.add(galaxy(new THREE.Vector3(-8, 8, 18), 8811, 0x7f9dff, glow, 1.18));
  root.add(galaxy(new THREE.Vector3(24, -12, -255), 7712, 0xffa557, glow, 1.4));

  const random = seeded(1177);
  const count = 7800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 170;
    positions[index * 3 + 1] = (random() - 0.5) * 105;
    positions[index * 3 + 2] = 70 - random() * 390;
    const shade = new THREE.Color([0xb9d8ff, 0xffffff, 0xffc4ad, 0xc9b5ff][Math.floor(random() * 4)]).multiplyScalar(0.45 + random() * 0.55);
    colors[index * 3] = shade.r; colors[index * 3 + 1] = shade.g; colors[index * 3 + 2] = shade.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  root.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.82, depthWrite: false, blending: THREE.AdditiveBlending })));

  for (let cloud = 0; cloud < 75; cloud += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: [0x563ba0, 0x177ba1, 0x9e3a73, 0xa96732][cloud % 4], transparent: true, opacity: 0.025 + random() * 0.045, depthWrite: false, blending: THREE.AdditiveBlending }));
    sprite.position.set((random() - 0.5) * 105, (random() - 0.5) * 70, 30 - random() * 315);
    const size = 22 + random() * 45;
    sprite.scale.set(size, size, 1);
    root.add(sprite);
  }
  return root;
}

export function findLandmark(object: THREE.Object3D | null) {
  let current = object;
  while (current) {
    if (current.userData.landmarkId) return current.userData.landmarkId as LandmarkId;
    current = current.parent;
  }
  return null;
}

export function animateWorld(root: THREE.Object3D, elapsed: number) {
  root.traverse((child) => {
    if (child.userData.spin) child.rotation.y = elapsed * child.userData.spin;
    if (child.userData.orbit) child.rotation.y += child.userData.orbit * 0.01;
    if (child.userData.galaxySpin) child.rotation.z = elapsed * child.userData.galaxySpin;
    if (child.userData.pulse !== undefined) {
      const scale = 0.8 + Math.sin(elapsed * 2.3 + child.userData.pulse) * 0.28;
      child.scale.setScalar(scale);
    }
  });
}
