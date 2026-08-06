import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("exports the immersive mind atlas as a static page", async () => {
  const html = await readFile(new URL("out/index.html", root), "utf8");

  assert.match(html, /<title>Personal Cosmos — An Interactive Mind Atlas<\/title>/i);
  assert.match(html, /class="cosmos-experience mode-mind layer-atlas"/);
  assert.match(html, /DIVE INTO VISUAL CORTEX/);
  assert.match(html, /TIME COORDINATE/);
  assert.match(html, /MIND/);
  assert.match(html, /COSMOS/);
  assert.doesNotMatch(html, /cluster-nav|detail-panel|entry-screen/);

  await access(new URL("out/neural-nebula.webp", root));
  await access(new URL("out/icon.svg", root));
});

test("keeps the Three.js experience interactive and disposable", async () => {
  const source = await readFile(new URL("app/cosmos-experience.tsx", root), "utf8");

  assert.match(source, /new THREE\.WebGLRenderer/);
  assert.match(source, /createBrainData\(particleCount\)/);
  assert.match(source, /createTunnel\(glowTexture\)/);
  assert.match(source, /ARTIFACTS\.forEach/);
  assert.match(source, /addEventListener\("pointermove"/);
  assert.match(source, /addEventListener\("wheel"/);
  assert.match(source, /setLayer\("visual"\)/);
  assert.match(source, /environmentTexture\.dispose\(\)/);
  assert.match(source, /renderer\.dispose\(\)/);
});
