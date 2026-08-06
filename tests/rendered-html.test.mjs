import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("exports the immersive mind atlas as a static page", async () => {
  const html = await readFile(new URL("out/index.html", root), "utf8");

  assert.match(html, /<title>Personal Cosmos — An Interactive Mind Atlas<\/title>/i);
  assert.match(html, /class="cosmos-experience mode-mind view-atlas"/);
  assert.match(html, /TIME COORDINATE/);
  assert.match(html, /MIND/);
  assert.match(html, /COSMOS/);
  assert.doesNotMatch(html, /cluster-nav|detail-panel|entry-screen/);

  await access(new URL("out/neural-nebula.webp", root));
  await access(new URL("out/cosmos-deep-field.webp", root));
  await access(new URL("out/icon.svg", root));
});

test("builds multiple explorable worlds with full orbit and flight controls", async () => {
  const [source, world] = await Promise.all([
    readFile(new URL("app/cosmos-experience.tsx", root), "utf8"),
    readFile(new URL("app/cosmos-world.ts", root), "utf8"),
  ]);

  assert.match(source, /new THREE\.WebGLRenderer/);
  assert.match(source, /orbitYaw -=/);
  assert.match(source, /flightPosition\.addScaledVector/);
  assert.match(source, /addEventListener\("pointermove"/);
  assert.match(source, /addEventListener\("wheel"/);
  assert.match(source, /cosmosTexture\.dispose\(\)/);
  assert.match(source, /renderer\.dispose\(\)/);
  assert.match(world, /id: "visual"/);
  assert.match(world, /id: "lab"/);
  assert.match(world, /id: "music"/);
  assert.match(world, /id: "projects"/);
  assert.match(world, /id: "archive"/);
  assert.match(world, /createGallery/);
  assert.match(world, /createLab/);
});
