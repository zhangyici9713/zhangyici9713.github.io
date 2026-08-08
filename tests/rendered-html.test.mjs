import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("exports the continuous personal atlas as a static page", async () => {
  const html = await readFile(new URL("out/index.html", root), "utf8");

  assert.match(html, /<title>Personal Atlas — A Continuous Mind &amp; Cosmos<\/title>/i);
  assert.match(html, /class="site-root mode-mind surface-atlas"/);
  assert.match(html, /TIME COORDINATE/);
  assert.match(html, /MIND/);
  assert.match(html, /COSMOS/);
  assert.match(html, /Open the standard profile page/);
  assert.match(html, /CONTINUOUS ATLAS/);
  assert.doesNotMatch(html, /Prototype Bay|view-atlas|entry-screen/);

  await access(new URL("out/og-v2.png", root));
  await access(new URL("out/icon.svg", root));
});

test("builds one continuous world with free flight and landmark navigation", async () => {
  const [source, world, profile] = await Promise.all([
    readFile(new URL("app/cosmos-experience.tsx", root), "utf8"),
    readFile(new URL("app/cosmos-world.ts", root), "utf8"),
    readFile(new URL("app/profile-page.tsx", root), "utf8"),
  ]);

  assert.match(source, /new THREE\.WebGLRenderer/);
  assert.match(source, /yaw -=/);
  assert.match(source, /camera\.position\.addScaledVector/);
  assert.match(source, /navigateRef\.current/);
  assert.match(source, /addEventListener\("pointermove"/);
  assert.match(source, /addEventListener\("wheel"/);
  assert.match(source, /renderer\.dispose\(\)/);
  assert.match(world, /id: "papers"/);
  assert.match(world, /id: "research"/);
  assert.match(world, /id: "music"/);
  assert.match(world, /id: "projects"/);
  assert.match(world, /id: "photography"/);
  assert.match(world, /createMindEnvironment/);
  assert.match(world, /createCosmosEnvironment/);
  assert.doesNotMatch(world, /roomShell|portalTo|Prototype Bay/);
  assert.match(profile, /Selected Publications/);
  assert.match(profile, /Products & Open Source/);
});
