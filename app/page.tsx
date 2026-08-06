"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "cosmos" | "mind";
type ClusterId = "research" | "build" | "sound" | "visual";

type Cluster = {
  id: ClusterId;
  index: string;
  cosmosName: string;
  mindName: string;
  eyebrow: string;
  x: number;
  y: number;
  z: number;
  year: number;
  color: string;
  description: string;
  objects: string[];
};

const CLUSTERS: Cluster[] = [
  {
    id: "research",
    index: "01",
    cosmosName: "Research Galaxy",
    mindName: "Reasoning Cortex",
    eyebrow: "PAPERS · EXPERIMENTS",
    x: -260,
    y: -95,
    z: 120,
    year: 2023,
    color: "#9ecbff",
    description:
      "Published papers, active investigations and the questions that keep returning after the lab lights go out.",
    objects: ["Published work", "Research projects", "Lab notes"],
  },
  {
    id: "build",
    index: "02",
    cosmosName: "Builder System",
    mindName: "Making Network",
    eyebrow: "OPEN SOURCE · PRODUCTS",
    x: 245,
    y: -135,
    z: 20,
    year: 2024,
    color: "#d3b8ff",
    description:
      "Open-source experiments, products and small acts of turning an unfinished thought into something usable.",
    objects: ["Open-source projects", "Product experiments", "Future builds"],
  },
  {
    id: "sound",
    index: "03",
    cosmosName: "Sound System",
    mindName: "Auditory Field",
    eyebrow: "MUSIC · RECORDINGS",
    x: -175,
    y: 190,
    z: -70,
    year: 2021,
    color: "#ffbb98",
    description:
      "Original songs, unfinished demos and the sonic fragments that became private coordinates in time.",
    objects: ["Original album", "Demos & sketches", "Listening notes"],
  },
  {
    id: "visual",
    index: "04",
    cosmosName: "Visual Nebula",
    mindName: "Visual Cortex",
    eyebrow: "PAINTING · PHOTOGRAPHY",
    x: 210,
    y: 170,
    z: 90,
    year: 2020,
    color: "#a9f0d1",
    description:
      "Illustration, oil, hand-drawn studies and photographs—including a quiet archive of mountains and snow.",
    objects: ["Illustrations", "Paintings", "Snow mountain archive"],
  },
];

const TIMELINE = [
  { year: 2019, label: "FIRST NOTES" },
  { year: 2020, label: "VISUAL ARCHIVE" },
  { year: 2021, label: "MUSIC" },
  { year: 2023, label: "RESEARCH" },
  { year: 2024, label: "BUILD" },
  { year: 2026, label: "NOW" },
];

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, down: false, moved: false });
  const cameraRef = useRef({ rx: -0.08, ry: 0.1, zoom: 1 });
  const [mode, setMode] = useState<Mode>("cosmos");
  const [selected, setSelected] = useState<ClusterId | null>(null);
  const [hovered, setHovered] = useState<ClusterId | null>(null);
  const [year, setYear] = useState(2026);
  const [intro, setIntro] = useState(true);

  const activeCluster = useMemo(
    () => CLUSTERS.find((cluster) => cluster.id === selected) ?? null,
    [selected],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const camera = cameraRef.current;
    const centerX = width * 0.55;
    const centerY = height * 0.48;
    const rotate = (x: number, y: number, z: number) => {
      const cosY = Math.cos(camera.ry);
      const sinY = Math.sin(camera.ry);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const cosX = Math.cos(camera.rx);
      const sinX = Math.sin(camera.rx);
      return {
        x: centerX + x1 * camera.zoom,
        y: centerY + (y * cosX - z1 * sinX) * camera.zoom,
        z: z1,
      };
    };

    const gradient = context.createRadialGradient(centerX, centerY, 20, centerX, centerY, Math.max(width, height) * 0.72);
    gradient.addColorStop(0, mode === "cosmos" ? "rgba(47,62,105,.16)" : "rgba(67,34,84,.16)");
    gradient.addColorStop(1, "rgba(3,4,8,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    for (let i = 0; i < 220; i += 1) {
      const p = rotate(
        (seeded(i, 1) - 0.5) * 1200,
        (seeded(i, 2) - 0.5) * 800,
        (seeded(i, 3) - 0.5) * 700,
      );
      const alpha = 0.12 + seeded(i, 4) * 0.58;
      const radius = 0.3 + seeded(i, 5) * 1.15;
      context.beginPath();
      context.arc(p.x, p.y, radius, 0, Math.PI * 2);
      context.fillStyle = mode === "cosmos" ? `rgba(220,232,255,${alpha})` : `rgba(232,207,255,${alpha})`;
      context.fill();
    }

    const projected = CLUSTERS.map((cluster) => ({ cluster, point: rotate(cluster.x, cluster.y, cluster.z) }));

    context.save();
    context.globalCompositeOperation = "lighter";
    for (let i = 0; i < projected.length; i += 1) {
      for (let j = i + 1; j < projected.length; j += 1) {
        const a = projected[i];
        const b = projected[j];
        const visible = year >= Math.min(a.cluster.year, b.cluster.year);
        context.beginPath();
        context.moveTo(a.point.x, a.point.y);
        const bend = mode === "mind" ? 34 : 8;
        context.quadraticCurveTo((a.point.x + b.point.x) / 2 + bend, (a.point.y + b.point.y) / 2 - bend, b.point.x, b.point.y);
        context.strokeStyle = visible
          ? mode === "cosmos"
            ? "rgba(122,157,220,.17)"
            : "rgba(205,133,255,.24)"
          : "rgba(255,255,255,.025)";
        context.lineWidth = mode === "mind" ? 0.9 : 0.5;
        context.stroke();
      }
    }
    context.restore();

    projected.forEach(({ cluster, point }, clusterIndex) => {
      const unlocked = year >= cluster.year;
      const isHovered = hovered === cluster.id;
      const isSelected = selected === cluster.id;
      const radius = (isHovered || isSelected ? 30 : 23) * camera.zoom;
      const halo = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 2.8);
      halo.addColorStop(0, unlocked ? `${cluster.color}66` : "rgba(255,255,255,.08)");
      halo.addColorStop(0.35, unlocked ? `${cluster.color}20` : "rgba(255,255,255,.03)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = halo;
      context.beginPath();
      context.arc(point.x, point.y, radius * 2.8, 0, Math.PI * 2);
      context.fill();

      if (mode === "cosmos") {
        const planet = context.createRadialGradient(
          point.x - radius * 0.35,
          point.y - radius * 0.38,
          radius * 0.08,
          point.x,
          point.y,
          radius,
        );
        planet.addColorStop(0, unlocked ? "#f7fbff" : "#4f535c");
        planet.addColorStop(0.18, unlocked ? cluster.color : "#272a31");
        planet.addColorStop(1, "#06070b");
        context.fillStyle = planet;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = unlocked ? `${cluster.color}99` : "rgba(255,255,255,.12)";
        context.lineWidth = 0.8;
        context.beginPath();
        context.ellipse(point.x, point.y, radius * 1.65, radius * 0.38, -0.24, 0, Math.PI * 2);
        context.stroke();
      } else {
        context.fillStyle = unlocked ? cluster.color : "#3b3d45";
        context.beginPath();
        context.arc(point.x, point.y, radius * 0.52, 0, Math.PI * 2);
        context.fill();
        for (let branch = 0; branch < 9; branch += 1) {
          const angle = (branch / 9) * Math.PI * 2 + clusterIndex * 0.42;
          const length = radius * (1.2 + seeded(branch, clusterIndex) * 0.95);
          const endX = point.x + Math.cos(angle) * length;
          const endY = point.y + Math.sin(angle) * length;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.quadraticCurveTo(
            point.x + Math.cos(angle + 0.3) * length * 0.58,
            point.y + Math.sin(angle + 0.3) * length * 0.58,
            endX,
            endY,
          );
          context.strokeStyle = unlocked ? `${cluster.color}99` : "rgba(255,255,255,.12)";
          context.lineWidth = 1.1;
          context.stroke();
          context.beginPath();
          context.arc(endX, endY, 1.8, 0, Math.PI * 2);
          context.fillStyle = unlocked ? cluster.color : "#53555d";
          context.fill();
        }
      }

      context.textAlign = "center";
      context.fillStyle = unlocked ? "rgba(244,246,251,.92)" : "rgba(206,208,216,.35)";
      context.font = "500 10px var(--font-geist-mono), monospace";
      context.fillText(mode === "cosmos" ? cluster.cosmosName.toUpperCase() : cluster.mindName.toUpperCase(), point.x, point.y + radius + 25);
      context.font = "400 8px var(--font-geist-mono), monospace";
      context.fillStyle = unlocked ? "rgba(190,198,214,.54)" : "rgba(190,198,214,.2)";
      context.fillText(unlocked ? cluster.eyebrow : `LOCKED UNTIL ${cluster.year}`, point.x, point.y + radius + 40);
    });

    frameRef.current = requestAnimationFrame(draw);
  }, [hovered, mode, selected, year]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [draw]);

  const projectClusters = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const camera = cameraRef.current;
    const centerX = canvas.clientWidth * 0.55;
    const centerY = canvas.clientHeight * 0.48;
    return CLUSTERS.map((cluster) => {
      const cosY = Math.cos(camera.ry);
      const sinY = Math.sin(camera.ry);
      const x1 = cluster.x * cosY - cluster.z * sinY;
      const z1 = cluster.x * sinY + cluster.z * cosY;
      const cosX = Math.cos(camera.rx);
      const sinX = Math.sin(camera.rx);
      return {
        cluster,
        x: centerX + x1 * camera.zoom,
        y: centerY + (cluster.y * cosX - z1 * sinX) * camera.zoom,
      };
    });
  }, []);

  const identifyNode = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return (
        projectClusters().find((item) => Math.hypot(item.x - x, item.y - y) < 48)?.cluster.id ?? null
      );
    },
    [projectClusters],
  );

  return (
    <main className={`atlas atlas--${mode}`}>
      <canvas
        ref={canvasRef}
        className="atlas__canvas"
        aria-label="Interactive personal universe with four explorable constellations"
        onPointerDown={(event) => {
          pointerRef.current = { x: event.clientX, y: event.clientY, down: true, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const pointer = pointerRef.current;
          if (pointer.down) {
            const dx = event.clientX - pointer.x;
            const dy = event.clientY - pointer.y;
            if (Math.abs(dx) + Math.abs(dy) > 2) pointer.moved = true;
            cameraRef.current.ry += dx * 0.004;
            cameraRef.current.rx = Math.max(-0.65, Math.min(0.65, cameraRef.current.rx + dy * 0.003));
            pointer.x = event.clientX;
            pointer.y = event.clientY;
          } else {
            setHovered(identifyNode(event.clientX, event.clientY));
          }
        }}
        onPointerUp={(event) => {
          if (!pointerRef.current.moved) {
            const node = identifyNode(event.clientX, event.clientY);
            if (node) setSelected(node);
          }
          pointerRef.current.down = false;
        }}
        onPointerLeave={() => {
          pointerRef.current.down = false;
          setHovered(null);
        }}
        onWheel={(event) => {
          event.preventDefault();
          cameraRef.current.zoom = Math.max(0.66, Math.min(1.65, cameraRef.current.zoom - event.deltaY * 0.0009));
        }}
      />

      <header className="masthead">
        <a className="wordmark" href="#top" aria-label="Personal Cosmos home">
          <span className="wordmark__mark">PC</span>
          <span>PERSONAL COSMOS</span>
        </a>
        <div className="masthead__center">AN EXPERIMENTAL SELF-PORTRAIT</div>
        <button className="index-button" onClick={() => setSelected(selected ? null : "research")}>
          INDEX <span>{selected ? "−" : "+"}</span>
        </button>
      </header>

      <section className="intro-copy" id="top">
        <p className="kicker"><span /> SIGNAL RECEIVED · {year}</p>
        <h1>
          A mind is not<br />
          <em>one room.</em>
        </h1>
        <p className="intro-copy__body">
          Research, things I build, music and images—held together as one navigable field.
        </p>
        <p className="gesture-hint">DRAG TO ORBIT · SCROLL TO TRAVEL · SELECT A SIGNAL</p>
      </section>

      <div className="mode-switch" role="group" aria-label="Visualization mode">
        <button className={mode === "cosmos" ? "is-active" : ""} onClick={() => setMode("cosmos")}>COSMOS</button>
        <span className="mode-switch__track"><span /></span>
        <button className={mode === "mind" ? "is-active" : ""} onClick={() => setMode("mind")}>MIND</button>
      </div>

      <nav className="cluster-nav" aria-label="Explore the atlas">
        {CLUSTERS.map((cluster) => (
          <button
            key={cluster.id}
            className={selected === cluster.id ? "is-active" : ""}
            onClick={() => setSelected(cluster.id)}
            disabled={year < cluster.year}
          >
            <span>{cluster.index}</span>
            {mode === "cosmos" ? cluster.cosmosName : cluster.mindName}
          </button>
        ))}
      </nav>

      <aside className={`detail-panel ${activeCluster ? "is-open" : ""}`} aria-hidden={!activeCluster}>
        {activeCluster && (
          <>
            <button className="detail-panel__close" onClick={() => setSelected(null)} aria-label="Close panel">×</button>
            <p className="detail-panel__index">{activeCluster.index} / 04</p>
            <p className="detail-panel__eyebrow">{activeCluster.eyebrow}</p>
            <h2>{mode === "cosmos" ? activeCluster.cosmosName : activeCluster.mindName}</h2>
            <p className="detail-panel__description">{activeCluster.description}</p>
            <div className="artifact-list">
              {activeCluster.objects.map((object, index) => (
                <button key={object}>
                  <span>0{index + 1}</span>
                  <strong>{object}</strong>
                  <i>↗</i>
                </button>
              ))}
            </div>
            <p className="detail-panel__note">CONTENT MODULE · READY FOR YOUR MATERIAL</p>
          </>
        )}
      </aside>

      <section className="timeline" aria-label="Personal timeline">
        <div className="timeline__topline">
          <span>TIME COORDINATE</span>
          <strong>{year}</strong>
          <span>{TIMELINE.find((item) => item.year === year)?.label ?? "BETWEEN SIGNALS"}</span>
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
        <div className="timeline__ticks">
          {TIMELINE.map((item) => <span key={item.year}>{item.year}</span>)}
        </div>
      </section>

      <footer className="atlas-footer">
        <span>LIVE FIELD / V0.1</span>
        <span>{mode === "cosmos" ? "OUTER SPACE" : "INNER SPACE"}</span>
      </footer>

      {intro && (
        <section className="entry-screen">
          <div className="entry-screen__orb" />
          <p>PERSONAL COSMOS / MIND ATLAS</p>
          <h2>Everything I make<br />belongs to the same universe.</h2>
          <button onClick={() => setIntro(false)}>ENTER THE FIELD <span>↗</span></button>
          <small>AN INTERACTIVE ARCHIVE · WORK IN PROGRESS</small>
        </section>
      )}
    </main>
  );
}
