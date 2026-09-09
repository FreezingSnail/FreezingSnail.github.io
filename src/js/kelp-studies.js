import * as THREE from "three";
import { ps1Snap, ps1Step } from "./ps1.js";

const palette = [0x10182d, 0x1b2d5c, 0x3156a3, 0x426fc4];

function random(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Builds one blade as a folded ribbon: each rung carries a left edge, a raised
 * mid-rib and a right edge, so the frond has real thickness from the side while
 * every face stays a hard triangle. Segment twist keeps the fold from reading as
 * a symmetric extrusion.
 */
function createBladeGeometry(width, length, curve) {
  const positions = [];
  const colors = [];
  const segments = 9;
  const edgeKicks = [0, 0.12, -0.08, 0.16, -0.13, 0.09, -0.05, 0.11, -0.09, 0];
  const lightDirection = [0.34, 0.68, 0.65];

  function face(a, b, c) {
    const ux = b[0] - a[0]; const uy = b[1] - a[1]; const uz = b[2] - a[2];
    const vx = c[0] - a[0]; const vy = c[1] - a[1]; const vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const magnitude = Math.hypot(nx, ny, nz) || 1;
    nx /= magnitude; ny /= magnitude; nz /= magnitude;
    const light = nx * lightDirection[0] + ny * lightDirection[1] + nz * lightDirection[2];
    const tone = Math.round((0.42 + Math.abs(light) * 0.62) * 5) / 5;
    [a, b, c].forEach((vertex) => {
      positions.push(...vertex);
      colors.push(tone, tone, tone);
    });
  }

  function rung(index) {
    const t = index / segments;
    const kick = edgeKicks[index] * width;
    const center = curve * t * t + Math.sin(t * Math.PI) * curve * 0.32 + kick;
    const halfWidth = Math.max(width * (1 - t * 0.7), 0.02);
    const twist = Math.sin(t * 4.1 + curve * 2) * 0.45;
    const fold = (0.34 + Math.sin(t * Math.PI) * 0.5) * halfWidth;
    const y = t * length;
    return [
      [center - halfWidth * (1 + edgeKicks[index] * 0.7), y, -fold * 0.35 + twist * halfWidth * 0.4],
      [center + halfWidth * twist * 0.35, y + halfWidth * 0.12, fold],
      [center + halfWidth * (1 - edgeKicks[index] * 0.7), y, -fold * 0.35 - twist * halfWidth * 0.4],
    ];
  }

  let near = rung(0);
  for (let index = 1; index <= segments; index += 1) {
    const far = rung(index);
    face(near[0], near[1], far[1]);
    face(near[0], far[1], far[0]);
    face(near[1], near[2], far[2]);
    face(near[1], far[2], far[1]);
    face(near[2], near[0], far[0]);
    face(near[2], far[0], far[2]);
    near = far;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function addBlade(group, animated, options) {
  const mesh = new THREE.Mesh(
    createBladeGeometry(options.width, options.length, options.curve),
    ps1Snap(new THREE.MeshBasicMaterial({ color: palette[options.tone % palette.length], vertexColors: true, side: THREE.DoubleSide })),
  );
  mesh.position.set(options.x, options.y, options.z ?? 0);
  mesh.rotation.set(0, options.yaw ?? 0, options.angle);
  mesh.frustumCulled = false;
  group.add(mesh);
  animated.push({
    mesh,
    base: options.angle,
    baseYaw: options.yaw ?? 0,
    phase: Math.random() * Math.PI * 2,
    sway: options.sway ?? random(0.035, 0.1),
    drift: random(0.6, 1.35),
  });
}

/** Holdfasts read better as a small cluster of hard rocks than one smooth blob. */
function addRoot(group, x, y, scale = 1) {
  const stones = [
    { offset: 0, size: 0.34, squash: [1.35, 0.48, 0.8], tone: 0x091225 },
    { offset: -0.28, size: 0.2, squash: [1.1, 0.62, 0.75], tone: 0x0d1a33 },
    { offset: 0.26, size: 0.17, squash: [1.2, 0.7, 0.7], tone: 0x0b1730 },
  ];
  stones.forEach((stone) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(stone.size, 0),
      ps1Snap(new THREE.MeshBasicMaterial({ color: stone.tone })),
    );
    rock.position.set(x + stone.offset * scale, y + (stone.offset ? -0.06 : 0) * scale, stone.offset * 0.4);
    rock.scale.set(stone.squash[0] * scale, stone.squash[1] * scale, stone.squash[2] * scale);
    rock.rotation.set(random(0, 1), random(0, 1), random(0, 1));
    rock.frustumCulled = false;
    group.add(rock);
  });
}

function makeFan(group, animated, options = {}) {
  const count = options.count ?? 16;
  const x = options.x ?? 0;
  const y = options.y ?? -1.65;
  const scale = options.scale ?? 1;
  addRoot(group, x, y, scale);
  for (let index = 0; index < count; index += 1) {
    addBlade(group, animated, {
      x: x + random(-0.22, 0.22) * scale,
      y: y + random(-0.06, 0.06) * scale,
      z: random(-0.28, 0.28),
      angle: ((index / Math.max(count - 1, 1)) - 0.5) * (options.spread ?? 1.3) + random(-0.1, 0.1),
      yaw: random(-0.35, 0.35),
      length: random(options.minLength ?? 2.6, options.maxLength ?? 3.8) * scale,
      width: random(options.minWidth ?? 0.19, options.maxWidth ?? 0.34) * scale,
      curve: random(-0.52, 0.52) * scale,
      tone: index,
    });
  }
}

function makeBull(group, animated) {
  addRoot(group, 0, -1.65);
  addBlade(group, animated, { x: 0, y: -1.63, angle: 0.04, yaw: 0, length: 3.55, width: 0.145, curve: 0.16, tone: 3, sway: 0.02 });
  const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), ps1Snap(new THREE.MeshBasicMaterial({ color: 0x426fc4 })));
  bulb.position.set(0.16, 1.83, 0);
  group.add(bulb);
  for (let index = 0; index < 12; index += 1) {
    addBlade(group, animated, {
      x: 0.16, y: 1.78, z: random(-0.18, 0.18), angle: ((index / 11) - 0.5) * 2.15,
      yaw: random(-0.35, 0.35), length: random(1.15, 1.85), width: random(0.13, 0.23), curve: random(-0.34, 0.34), tone: index,
    });
  }
}

function makeFeather(group, animated) {
  [-0.78, 0, 0.78].forEach((x, stem) => {
    addRoot(group, x, -1.66, 0.68);
    addBlade(group, animated, { x, y: -1.62, angle: random(-0.06, 0.06), yaw: 0, length: 3.7, width: 0.055, curve: random(-0.16, 0.16), tone: stem, sway: 0.018 });
    for (let leaf = 0; leaf < 5; leaf += 1) {
      const side = leaf % 2 ? 1 : -1;
      addBlade(group, animated, {
        x, y: -1.05 + leaf * 0.58, z: stem * -0.1, angle: side * random(0.86, 1.12), yaw: random(-0.14, 0.14),
        length: random(0.55, 0.9), width: random(0.11, 0.17), curve: side * random(0.14, 0.32), tone: leaf + stem,
      });
    }
  });
}

function makeGiant(group, animated, forest = false) {
  const stipes = forest ? [-1.35, -0.45, 0.48, 1.32] : [0];
  stipes.forEach((x, stem) => {
    const scale = forest ? random(0.72, 1) : 1;
    const base = -1.68;
    addRoot(group, x, base, 0.62 * scale);
    addBlade(group, animated, { x, y: base, angle: random(-0.05, 0.05), yaw: 0, length: 5.1 * scale, width: 0.052, curve: random(-0.26, 0.26), tone: stem, sway: 0.015 });
    for (let leaf = 0; leaf < 7; leaf += 1) {
      const side = leaf % 2 ? 1 : -1;
      addBlade(group, animated, {
        x: x + random(-0.035, 0.035), y: base + 0.85 * scale + leaf * 0.53 * scale, z: random(-0.15, 0.15),
        angle: side * random(0.74, 1.12), yaw: random(-0.22, 0.22), length: random(0.72, 1.12) * scale,
        width: random(0.1, 0.16) * scale, curve: side * random(0.14, 0.3), tone: leaf + stem,
      });
    }
  });
}

function makeSeaLettuce(group, animated) {
  [-0.85, -0.35, 0.18, 0.72].forEach((x, index) => {
    addRoot(group, x, -1.67, 0.5);
    addBlade(group, animated, {
      x, y: -1.64, z: index * -0.08, angle: random(-0.33, 0.33), yaw: random(-0.3, 0.3),
      length: random(1.7, 2.45), width: random(0.34, 0.5), curve: random(-0.6, 0.6), tone: index,
    });
  });
}

function makeSargassum(group, animated) {
  addRoot(group, 0, -1.67);
  for (let branch = 0; branch < 5; branch += 1) {
    const angle = ((branch / 4) - 0.5) * 1.05;
    addBlade(group, animated, { x: 0, y: -1.63, angle, yaw: random(-0.25, 0.25), length: random(2.3, 3.25), width: 0.055, curve: random(-0.25, 0.25), tone: branch, sway: 0.02 });
    for (let leaf = 0; leaf < 3; leaf += 1) {
      const y = -0.7 + leaf * 0.68;
      addBlade(group, animated, { x: (branch - 2) * 0.11, y, angle: leaf % 2 ? -0.78 : 0.78, yaw: random(-0.2, 0.2), length: 0.5, width: 0.105, curve: random(-0.18, 0.18), tone: branch + leaf });
      const float = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), ps1Snap(new THREE.MeshBasicMaterial({ color: palette[(branch + leaf + 2) % palette.length] })));
      float.position.set((branch - 2) * 0.13 + (leaf % 2 ? -0.22 : 0.22), y + 0.12, 0);
      group.add(float);
    }
  }
}

function makeWhips(group, animated) {
  [-1.1, -0.65, -0.15, 0.35, 0.85].forEach((x, index) => {
    addRoot(group, x, -1.7, 0.42);
    addBlade(group, animated, { x, y: -1.68, angle: random(-0.32, 0.32), yaw: random(-0.35, 0.35), length: random(2.9, 4), width: random(0.07, 0.12), curve: random(-0.65, 0.65), tone: index, sway: 0.07 });
  });
}

function makeStudy(type) {
  const group = new THREE.Group();
  const animated = [];
  if (type === "broad") makeFan(group, animated, { count: 9, spread: 1.05, minLength: 2.3, maxLength: 3.1, minWidth: 0.34, maxWidth: 0.48 });
  else if (type === "dense") makeFan(group, animated, { count: 25, spread: 1.45, minLength: 2.2, maxLength: 3.65, minWidth: 0.13, maxWidth: 0.22 });
  else if (type === "bull") makeBull(group, animated);
  else if (type === "feather") makeFeather(group, animated);
  else if (type === "giant") makeGiant(group, animated);
  else if (type === "giant-grove") makeGiant(group, animated, true);
  else if (type === "lettuce") makeSeaLettuce(group, animated);
  else if (type === "sargassum") makeSargassum(group, animated);
  else if (type === "whips") makeWhips(group, animated);
  else if (type === "rockweed") makeFan(group, animated, { count: 14, spread: 1.65, minLength: 1.1, maxLength: 1.85, minWidth: 0.15, maxWidth: 0.27 });
  else if (type === "grove") {
    makeFan(group, animated, { x: -1.7, y: -1.68, scale: 0.7, count: 11 });
    makeFan(group, animated, { x: 0, y: -1.66, scale: 1, count: 16 });
    makeFan(group, animated, { x: 1.7, y: -1.68, scale: 0.7, count: 11 });
  } else makeFan(group, animated);
  return { group, animated };
}

function startStudy(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "low-power" });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 30);
  const study = makeStudy(canvas.dataset.kelpStudy);
  scene.add(study.group);
  renderer.setClearColor(0x061127);
  renderer.setPixelRatio(1);
  camera.position.set(0, 0.25, 8.1);
  camera.lookAt(0, 0.2, 0);

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(bounds.width, 1), Math.max(bounds.height, 1), false);
    camera.aspect = bounds.width / Math.max(bounds.height, 1);
    camera.updateProjectionMatrix();
  }

  function render(time) {
    study.animated.forEach((blade) => {
      const swell = Math.sin(time * 0.0011 + blade.phase);
      const chop = Math.sin(time * 0.0027 + blade.phase * 1.7) * 0.32;
      // Stepped rotations: PS1 animation ran off coarse fixed-point tables, so
      // fronds should visibly tick between poses rather than glide between them.
      blade.mesh.rotation.z = blade.base + ps1Step((swell + chop) * blade.sway, 64);
      blade.mesh.rotation.y = blade.baseYaw + ps1Step(Math.cos(time * 0.0008 * blade.drift + blade.phase) * blade.sway * 1.6, 48);
    });
    renderer.render(scene, camera);
  }

  resize();
  render(0);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let last = 0;
  // Rendered every frame: the PS1 read comes from snapped vertices and stepped
  // sway values, so throttling the loop only added lag.
  function tick(time) {
    last = time;
    render(time);
    if (!reducedMotion.matches) requestAnimationFrame(tick);
  }
  if (!reducedMotion.matches) requestAnimationFrame(tick);
  window.addEventListener("resize", () => { resize(); render(last); });
}

document.querySelectorAll("[data-kelp-study]").forEach(startStudy);
