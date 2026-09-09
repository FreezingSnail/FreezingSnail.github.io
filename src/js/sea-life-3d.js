import * as THREE from "three";
import { ps1Snap } from "./ps1.js";

const WATER = 0x061127;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const SKIN = {
  fish: 0x3f74d0,
  whale: 0x36598c,
  manta: 0x2e5680,
  shark: 0x467fa9,
  shell: 0x9c6ea8,
  foot: 0x3f7c8c,
};

function random(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Flat per-face shading quantized into five bands. MeshBasicMaterial plus baked
 * vertex tones keeps the hard PS1 faceting that real lighting would smooth away.
 */
function faceTone(a, b, c) {
  const ux = b[0] - a[0]; const uy = b[1] - a[1]; const uz = b[2] - a[2];
  const vx = c[0] - a[0]; const vy = c[1] - a[1]; const vz = c[2] - a[2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz) || 1;
  nx /= length; ny /= length; nz /= length;
  const light = nx * 0.3 + ny * 0.76 + nz * 0.58;
  const shade = 0.48 + Math.max(light, -0.3) * 0.52;
  return Math.round(shade * 5) / 5;
}

function pushFace(positions, colors, a, b, c, bias = 1) {
  const tone = faceTone(a, b, c) * bias;
  [a, b, c].forEach((vertex) => {
    positions.push(vertex[0], vertex[1], vertex[2]);
    colors.push(tone, tone, tone);
  });
}

function bakeGeometry(positions, colors) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Sweeps elliptical rings along +x so a handful of sections describe a whole
 * animal body. Sections are [x, radiusY, radiusZ, yOffset].
 */
function hullGeometry(sections, sides = 6, options = {}) {
  const positions = [];
  const colors = [];
  const floor = options.minY;
  const rings = sections.map((section) => {
    const [x, ry, rz, yOffset = 0] = section;
    return Array.from({ length: sides }, (_, index) => {
      const angle = (index / sides) * Math.PI * 2;
      const y = yOffset + Math.sin(angle) * ry;
      return [x, floor === undefined ? y : Math.max(y, floor), Math.cos(angle) * rz];
    });
  });
  for (let index = 0; index < rings.length - 1; index += 1) {
    const near = rings[index];
    const far = rings[index + 1];
    for (let side = 0; side < sides; side += 1) {
      const next = (side + 1) % sides;
      pushFace(positions, colors, near[side], far[side], far[next]);
      pushFace(positions, colors, near[side], far[next], near[next]);
    }
  }
  return bakeGeometry(positions, colors);
}

/**
 * Fins and wings are thin slabs rather than single planes so they still catch a
 * different tone per side when the animal turns.
 */
function slabGeometry(outline, thickness = 0.05, plane = "xy") {
  const positions = [];
  const colors = [];
  const lift = (u, v, offset) => (plane === "xy" ? [u, v, offset] : [u, offset, v]);
  const half = thickness / 2;
  [half, -half].forEach((offset, sideIndex) => {
    for (let index = 1; index < outline.length - 1; index += 1) {
      const a = lift(outline[0][0], outline[0][1], offset);
      const b = lift(outline[index][0], outline[index][1], offset);
      const c = lift(outline[index + 1][0], outline[index + 1][1], offset);
      if (sideIndex) pushFace(positions, colors, a, c, b);
      else pushFace(positions, colors, a, b, c);
    }
  });
  for (let index = 0; index < outline.length; index += 1) {
    const current = outline[index];
    const next = outline[(index + 1) % outline.length];
    const a = lift(current[0], current[1], half);
    const b = lift(next[0], next[1], half);
    const c = lift(next[0], next[1], -half);
    const d = lift(current[0], current[1], -half);
    pushFace(positions, colors, a, b, c, 0.82);
    pushFace(positions, colors, a, c, d, 0.82);
  }
  return bakeGeometry(positions, colors);
}

function skin(color) {
  return ps1Snap(new THREE.MeshBasicMaterial({ color, vertexColors: true, side: THREE.DoubleSide }));
}

function mesh(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.rotation.set(...rotation);
  item.frustumCulled = false;
  return item;
}

function pivot(position) {
  const group = new THREE.Group();
  group.position.set(...position);
  return group;
}

const FISH_SECTIONS = [
  [-1.16, 0.05, 0.04],
  [-0.86, 0.17, 0.1],
  [-0.44, 0.35, 0.21],
  [0.02, 0.45, 0.28],
  [0.48, 0.4, 0.25],
  [0.94, 0.24, 0.16],
  [1.24, 0.08, 0.06],
  [1.4, 0, 0],
];

const FISH_VARIANTS = {
  wedge: { long: 1, tall: 1, wide: 1 },
  needle: { long: 1.45, tall: 0.52, wide: 0.6 },
  disk: { long: 0.78, tall: 1.5, wide: 0.72 },
  heavy: { long: 1.02, tall: 1.2, wide: 1.35 },
};

function fishParts(variant = "wedge") {
  const shape = FISH_VARIANTS[variant] ?? FISH_VARIANTS.wedge;
  const sections = FISH_SECTIONS.map(([x, ry, rz]) => [x * shape.long, ry * shape.tall, rz * shape.wide]);
  return {
    shape,
    body: hullGeometry(sections, 6),
    tail: slabGeometry([[0, 0], [-0.46, 0.56 * shape.tall], [-0.28, 0.02], [-0.46, -0.5 * shape.tall]], 0.05),
    dorsal: slabGeometry([[-0.2, 0.36 * shape.tall], [0.04, 0.86 * shape.tall], [0.34, 0.34 * shape.tall]], 0.045),
    belly: slabGeometry([[-0.08, -0.34 * shape.tall], [0.02, -0.66 * shape.tall], [0.28, -0.3 * shape.tall]], 0.04),
    pectoral: slabGeometry([[0, 0], [-0.34, 0.1], [-0.26, -0.24], [0.06, -0.12]], 0.035),
    eye: new THREE.BoxGeometry(0.09, 0.09, 0.09),
  };
}

function fishModel(parts) {
  const material = skin(SKIN.fish);
  const eyeMaterial = ps1Snap(new THREE.MeshBasicMaterial({ color: 0xdcecff }));
  const group = new THREE.Group();
  const shape = parts.shape;
  group.add(mesh(parts.body, material));
  group.add(mesh(parts.dorsal, material));
  group.add(mesh(parts.belly, material));

  const tail = pivot([-1.1 * shape.long, 0, 0]);
  tail.add(mesh(parts.tail, material));
  group.add(tail);

  const fins = [1, -1].map((side) => {
    const fin = pivot([0.42 * shape.long, -0.06, side * 0.24 * shape.wide]);
    fin.rotation.y = side * 0.5;
    fin.add(mesh(parts.pectoral, material));
    return { fin, side };
  });
  fins.forEach(({ fin }) => group.add(fin));

  [1, -1].forEach((side) => {
    group.add(mesh(parts.eye, eyeMaterial, [1.02 * shape.long, 0.14 * shape.tall, side * 0.15 * shape.wide]));
  });

  const seed = Math.random() * Math.PI * 2;
  return {
    group,
    animate(time, speed = 1) {
      const beat = time * 0.006 * speed + seed;
      tail.rotation.y = Math.sin(beat) * 0.62;
      group.rotation.y = Math.sin(beat - 0.7) * 0.07;
      fins.forEach(({ fin, side }) => {
        fin.rotation.x = side * Math.sin(beat * 0.8) * 0.5;
      });
    },
  };
}

function whaleModel() {
  const material = skin(SKIN.whale);
  const eyeMaterial = ps1Snap(new THREE.MeshBasicMaterial({ color: 0xdcecff }));
  const group = new THREE.Group();
  group.add(mesh(hullGeometry([
    [-1.75, 0.06, 0.06],
    [-1.3, 0.22, 0.2],
    [-0.62, 0.54, 0.52],
    [0.12, 0.68, 0.64],
    [0.86, 0.6, 0.58],
    [1.52, 0.44, 0.44],
    [1.98, 0.24, 0.26],
    [2.2, 0.04, 0.06],
  ], 7), material));
  group.add(mesh(slabGeometry([[-0.3, 0.6], [0.1, 0.92], [0.42, 0.58]], 0.06), material));

  const flukes = pivot([-1.7, 0, 0]);
  flukes.add(mesh(slabGeometry([[0, 0], [-0.62, 0.86], [-0.32, 0.04], [-0.62, -0.86]], 0.06, "xz"), material));
  group.add(flukes);

  const flippers = [1, -1].map((side) => {
    const flipper = pivot([0.72, -0.32, side * 0.5]);
    flipper.rotation.y = side * 0.45;
    flipper.add(mesh(slabGeometry([[0, 0], [-0.5, -0.24], [-0.62, -0.62], [-0.1, -0.24]], 0.05), material));
    return { flipper, side };
  });
  flippers.forEach(({ flipper }) => group.add(flipper));

  [1, -1].forEach((side) => {
    group.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMaterial, [1.72, 0.16, side * 0.26]));
  });

  return {
    group,
    animate(time, speed = 1) {
      const beat = time * 0.0024 * speed;
      flukes.rotation.z = Math.sin(beat) * 0.34;
      group.rotation.z = Math.sin(beat - 0.9) * 0.05;
      flippers.forEach(({ flipper, side }) => {
        flipper.rotation.x = side * Math.sin(beat * 0.9) * 0.24;
      });
    },
  };
}

function mantaModel() {
  const material = skin(SKIN.manta);
  const group = new THREE.Group();
  // Natural world orientation: nose +X, wings span XZ, back +Y, stomach -Y.
  // Scene sprites use an overhead camera for this model so its broad plane reads.
  group.add(mesh(hullGeometry([
    [-0.95, 0.06, 0.08],
    [-0.5, 0.2, 0.36],
    [0.05, 0.28, 0.5],
    [0.6, 0.24, 0.44],
    [1.05, 0.12, 0.24],
    [1.2, 0.02, 0.06],
  ], 6), material));

  const wings = [1, -1].map((side) => {
    const wing = pivot([0, 0.02, side * 0.4]);
    wing.add(mesh(slabGeometry([
      [-0.62, 0],
      [0.5, side * 0.18],
      [0.9, side * 0.95],
      [0.1, side * 1.85],
      [-0.5, side * 1.5],
      [-0.9, side * 0.6],
    ], 0.07, "xz"), material));
    return { wing, side };
  });
  wings.forEach(({ wing }) => group.add(wing));

  const tail = pivot([-0.9, 0, 0]);
  let segment = tail;
  const links = [];
  for (let index = 0; index < 3; index += 1) {
    const next = pivot([index ? -0.5 : -0.1, 0, 0]);
    next.add(mesh(hullGeometry([
      [0, 0.05 - index * 0.012, 0.05 - index * 0.012],
      [-0.5, 0.035 - index * 0.011, 0.035 - index * 0.011],
    ], 5), material));
    segment.add(next);
    links.push(next);
    segment = next;
  }
  group.add(tail);

  [1, -1].forEach((side) => {
    group.add(mesh(slabGeometry([[1.02, 0.02], [1.5, 0.3], [1.16, -0.14]], 0.05), material, [0, 0, side * 0.2]));
  });

  return {
    group,
    animate(time, speed = 1) {
      const beat = time * 0.0026 * speed;
      wings.forEach(({ wing, side }) => {
        wing.rotation.x = side * Math.sin(beat) * 0.55;
        wing.rotation.y = Math.sin(beat * 0.5) * 0.05;
      });
      links.forEach((link, index) => {
        link.rotation.y = Math.sin(beat - index * 0.6) * 0.22;
      });
      group.rotation.z = Math.sin(beat * 0.7) * 0.04;
    },
  };
}

function sharkModel() {
  const material = skin(SKIN.shark);
  const eyeMaterial = ps1Snap(new THREE.MeshBasicMaterial({ color: 0xdcecff }));
  const group = new THREE.Group();
  group.add(mesh(hullGeometry([
    [-1.45, 0.05, 0.04],
    [-1.05, 0.14, 0.1],
    [-0.5, 0.3, 0.24],
    [0.1, 0.38, 0.32],
    [0.7, 0.34, 0.28],
    [1.3, 0.22, 0.18],
    [1.72, 0.1, 0.08],
    [1.9, 0, 0],
  ], 6), material));
  group.add(mesh(slabGeometry([[-0.16, 0.3], [0.12, 1.02], [0.46, 0.28]], 0.05), material));
  group.add(mesh(slabGeometry([[-0.7, -0.24], [-0.5, -0.62], [-0.24, -0.24]], 0.045), material));

  const tail = pivot([-1.4, 0, 0]);
  tail.add(mesh(slabGeometry([[0, 0], [-0.5, 1.0], [-0.24, 0.06], [-0.62, -0.52]], 0.05), material));
  group.add(tail);

  const fins = [1, -1].map((side) => {
    const fin = pivot([0.34, -0.24, side * 0.28]);
    fin.rotation.y = side * 0.4;
    fin.add(mesh(slabGeometry([[0, 0], [-0.44, -0.2], [-0.7, -0.52], [-0.12, -0.2]], 0.045), material));
    return { fin, side };
  });
  fins.forEach(({ fin }) => group.add(fin));

  [1, -1].forEach((side) => {
    group.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMaterial, [1.42, 0.14, side * 0.14]));
  });

  return {
    group,
    animate(time, speed = 1) {
      const beat = time * 0.0052 * speed;
      tail.rotation.y = Math.sin(beat) * 0.52;
      group.rotation.y = Math.sin(beat - 0.8) * 0.09;
      fins.forEach(({ fin, side }) => {
        fin.rotation.x = side * Math.sin(beat * 0.6) * 0.2;
      });
    },
  };
}

/**
 * Logarithmic whorl sweep. Tube radius is tied to the spiral radius so adjacent
 * whorls touch and the shell reads as one solid mass; the earlier constant-taper
 * sweep left gaps and looked like coiled wire.
 */
function shellGeometry(options = {}) {
  const turns = options.turns ?? 2.5;
  const growth = options.growth ?? 2.15;
  const tubeFactor = options.tubeFactor ?? 0.42;
  const radius = options.radius ?? 0.7;
  const rise = options.rise ?? 0;
  const sides = options.sides ?? 6;
  const steps = Math.max(8, Math.round(turns * (options.stepsPerTurn ?? 7)));
  const positions = [];
  const colors = [];
  const rings = [];

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const angle = t * turns * Math.PI * 2;
    const spiral = radius * Math.pow(growth, (t - 1) * turns);
    // Alternating tube swell cuts hard growth ridges into the whorl.
    const tube = spiral * tubeFactor * (step % 2 ? 1.08 : 0.94);
    const radial = [Math.cos(angle), Math.sin(angle)];
    const axial = rise * spiral;
    rings.push(Array.from({ length: sides }, (_, index) => {
      const ringAngle = (index / sides) * Math.PI * 2 + angle * 0.25;
      const out = Math.cos(ringAngle) * tube;
      const along = Math.sin(ringAngle) * tube;
      return [radial[0] * (spiral + out), radial[1] * (spiral + out), axial + along];
    }));
  }

  for (let index = 0; index < rings.length - 1; index += 1) {
    for (let side = 0; side < sides; side += 1) {
      const next = (side + 1) % sides;
      pushFace(positions, colors, rings[index][side], rings[index + 1][side], rings[index + 1][next]);
      pushFace(positions, colors, rings[index][side], rings[index + 1][next], rings[index][next]);
    }
  }

  // Aperture and apex caps keep the sweep from showing open tube ends.
  [rings[0], rings[rings.length - 1]].forEach((ring, capIndex) => {
    for (let side = 1; side < sides - 1; side += 1) {
      if (capIndex) pushFace(positions, colors, ring[0], ring[side], ring[side + 1], 0.78);
      else pushFace(positions, colors, ring[0], ring[side + 1], ring[side], 0.78);
    }
  });

  return bakeGeometry(positions, colors);
}

const SHELL_BUILDS = [
  { turns: 2.6, growth: 2.15, tubeFactor: 0.42, radius: 0.72, rise: 0, sides: 6, squash: 0.62, tilt: 0.24 },
  { turns: 3.0, growth: 1.62, tubeFactor: 0.4, radius: 0.5, rise: 0.72, sides: 5, squash: 1, tilt: 0.5 },
  { turns: 2.0, growth: 2.6, tubeFactor: 0.48, radius: 0.76, rise: 0.2, sides: 6, squash: 0.82, tilt: 0.12 },
];

function snailModel(shellVariant = 0) {
  const shellMaterial = skin(SKIN.shell);
  const footMaterial = skin(SKIN.foot);
  const group = new THREE.Group();
  const build = SHELL_BUILDS[shellVariant % SHELL_BUILDS.length];

  // Flat sole at y = 0 so the snail sits on a surface instead of floating.
  const foot = mesh(hullGeometry([
    [-1.15, 0.16, 0.1],
    [-0.85, 0.2, 0.26],
    [-0.3, 0.22, 0.34],
    [0.35, 0.22, 0.32],
    [0.9, 0.18, 0.24],
    [1.2, 0.12, 0.12],
  ], 6, { minY: 0.02 }), footMaterial, [0, 0.02, 0]);
  group.add(foot);

  const shell = mesh(shellGeometry(build), shellMaterial, [-0.18, 0.24 + build.radius * 0.82, 0]);
  shell.rotation.set(build.tilt, 0.32, 0.18);
  shell.scale.set(1, 1, build.squash);
  group.add(shell);

  // Mantle collar bridges shell and foot so the shell looks carried, not stacked.
  const mantle = mesh(hullGeometry([
    [-0.5, 0.14, 0.2],
    [-0.1, 0.2, 0.3],
    [0.35, 0.16, 0.24],
  ], 6, { minY: 0.04 }), footMaterial, [0, 0.2, 0]);
  group.add(mantle);

  const head = pivot([1.05, 0.2, 0]);
  head.add(mesh(hullGeometry([
    [-0.1, 0.15, 0.16],
    [0.24, 0.12, 0.12],
    [0.44, 0.05, 0.05],
  ], 5), footMaterial));
  const eyeMaterial = ps1Snap(new THREE.MeshBasicMaterial({ color: 0x1b1030 }));
  const stalks = [1, -1].map((side) => {
    const stalk = pivot([0.1, 0.12, side * 0.1]);
    stalk.add(mesh(hullGeometry([[0, 0.03, 0.03], [0.34, 0.026, 0.026]], 4), footMaterial));
    stalk.add(mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), eyeMaterial, [0.36, 0, 0]));
    stalk.rotation.z = 0.95;
    stalk.rotation.y = side * 0.34;
    return { stalk, side };
  });
  stalks.forEach(({ stalk }) => head.add(stalk));
  group.add(head);

  return {
    group,
    animate(time, speed = 1) {
      const beat = time * 0.0013 * speed;
      // Sole ripple reads as the muscular wave a snail actually crawls on.
      foot.scale.x = 1 + Math.sin(beat * 2) * 0.04;
      foot.position.y = 0.02 + Math.abs(Math.sin(beat * 2)) * 0.015;
      head.rotation.y = Math.sin(beat) * 0.26;
      head.rotation.z = Math.sin(beat * 1.3) * 0.08;
      stalks.forEach(({ stalk, side }) => {
        stalk.rotation.z = 0.95 + Math.sin(beat * 1.6 + side) * 0.18;
        stalk.rotation.y = side * (0.34 + Math.cos(beat * 1.1) * 0.12);
      });
    },
  };
}

function particleField(count = 90, spread = 6) {
  const positions = [];
  for (let index = 0; index < count; index += 1) {
    positions.push(random(-spread, spread), random(-2.4, 2.4), random(-spread * 0.6, spread * 0.6));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x1d3a66, size: 0.045 }));
}

function stage(canvas, options = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(options.fov ?? 38, 1, 0.1, 60);
  renderer.setClearColor(WATER);
  renderer.setPixelRatio(1);
  camera.position.set(...(options.position ?? [1.6, 1.5, 6.4]));
  camera.lookAt(...(options.target ?? [0, 0, 0]));
  scene.add(particleField(options.motes ?? 90, options.spread ?? 6));

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(bounds.width, 1), Math.max(bounds.height, 1), false);
    camera.aspect = Math.max(bounds.width, 1) / Math.max(bounds.height, 1);
    camera.updateProjectionMatrix();
  }

  return { renderer, scene, camera, resize, render: () => renderer.render(scene, camera) };
}

function run(canvas, options, build) {
  const view = stage(canvas, options);
  const update = build(view.scene, view.camera);
  function frame(time) {
    update(time);
    view.render();
    if (!reducedMotion.matches) requestAnimationFrame(frame);
  }
  view.resize();
  update(0);
  view.render();
  if (!reducedMotion.matches) requestAnimationFrame(frame);
  window.addEventListener("resize", () => { view.resize(); view.render(); });
}

function turntable(canvas, options, factory) {
  run(canvas, options, (scene) => {
    const pivotGroup = new THREE.Group();
    scene.add(pivotGroup);
    const actors = factory(pivotGroup);
    return (time) => {
      pivotGroup.rotation.y = Math.sin(time * 0.00022) * 0.8 + 0.35;
      actors.forEach((actor) => actor.animate(time));
    };
  });
}

function schoolStudy(canvas) {
  run(canvas, { position: [0, 1.4, 8.4], target: [0, 0, 0], motes: 140, spread: 8, fov: 42 }, (scene) => {
    const parts = fishParts("wedge");
    const bounds = { x: 3.6, y: 1.5, z: 2.3 };
    const boids = Array.from({ length: 34 }, (_, index) => {
      const model = fishModel(parts);
      const carrier = new THREE.Group();
      model.group.scale.setScalar(0.3);
      carrier.add(model.group);
      carrier.position.set(random(-bounds.x, bounds.x), random(-bounds.y, bounds.y), random(-bounds.z, bounds.z));
      scene.add(carrier);
      return {
        model,
        carrier,
        lane: index % 2 ? 1 : -1,
        phase: Math.random() * Math.PI * 2,
        cruise: random(0.03, 0.05),
        burst: 0,
        nextBurst: Math.random() * 6000,
        velocity: new THREE.Vector3(random(0.02, 0.06), random(-0.01, 0.01), random(-0.02, 0.02)),
      };
    });
    const separation = new THREE.Vector3();
    const alignment = new THREE.Vector3();
    const cohesion = new THREE.Vector3();
    let last;

    return (time) => {
      const dt = last === undefined ? 1 : Math.min(Math.max((time - last) / 16.67, 0.2), 3);
      last = time;
      const pulse = 0.5 - Math.cos(time * 0.00042) * 0.5;
      const split = pulse * pulse * (3 - 2 * pulse);
      boids.forEach((boid) => {
        separation.set(0, 0, 0); alignment.set(0, 0, 0); cohesion.set(0, 0, 0);
        let neighbours = 0;
        let alarm = 0;
        boids.forEach((other) => {
          if (other === boid) return;
          const distance = boid.carrier.position.distanceTo(other.carrier.position);
          if (distance > 1.9) return;
          neighbours += 1;
          alignment.add(other.velocity);
          cohesion.add(other.carrier.position);
          if (other.burst > 0.55 && distance < 1.2) alarm += 1;
          if (distance < 0.62 && distance > 0.001) {
            separation.addScaledVector(boid.carrier.position.clone().sub(other.carrier.position), 1 / (distance * distance));
          }
        });
        if (neighbours) {
          alignment.divideScalar(neighbours).sub(boid.velocity).multiplyScalar(0.06 * dt);
          cohesion.divideScalar(neighbours).sub(boid.carrier.position).multiplyScalar(0.0016 * dt);
          boid.velocity.add(alignment).add(cohesion).addScaledVector(separation, 0.0022 * dt);
        }
        // Burst-and-glide: kick hard, then coast. Kicks spread to close neighbours
        // so the school surges and settles instead of cruising at one speed.
        if (boid.burst < 0.2 && time > boid.nextBurst) {
          boid.burst = 1;
          boid.nextBurst = time + 2000 + Math.random() * 6500;
        } else if (alarm && boid.burst < 0.4 && Math.random() < 0.05 * dt) {
          boid.burst = 0.85;
        }
        boid.burst *= Math.pow(0.982, dt);
        const target = boid.cruise * (1 + boid.burst * 2.6);
        const response = boid.burst > 0.3 ? 0.14 : 0.035;
        const laneY = boid.lane * split * 1.15 + Math.sin(time * 0.001 + boid.phase) * 0.3;
        boid.velocity.x += (target + Math.sin(time * 0.0007 + boid.phase) * 0.015 - boid.velocity.x) * response * dt;
        boid.velocity.y += (laneY - boid.carrier.position.y) * 0.0022 * dt;
        boid.velocity.z += (Math.sin(time * 0.00055 + boid.phase * 1.7) * 1.4 - boid.carrier.position.z) * 0.0016 * dt;
        const speed = boid.velocity.length();
        const cap = target * 1.3 + 0.02;
        if (speed > cap) boid.velocity.multiplyScalar(cap / speed);
        boid.carrier.position.addScaledVector(boid.velocity, dt);
        if (boid.carrier.position.x > bounds.x + 0.4) boid.carrier.position.x = -bounds.x - 0.4;
        if (boid.carrier.position.x < -bounds.x - 0.4) boid.carrier.position.x = bounds.x + 0.4;
        boid.carrier.rotation.y = Math.atan2(-boid.velocity.z, boid.velocity.x);
        boid.carrier.rotation.z = Math.asin(THREE.MathUtils.clamp(boid.velocity.y / Math.max(speed, 0.001), -1, 1));
        // Tail beat tracks effort, so a burst visibly thrashes and a glide relaxes.
        boid.model.animate(time, 1.1 + boid.burst * 2.2);
      });
    };
  });
}

function crawlStudy(canvas) {
  run(canvas, { position: [0, 1.5, 5.6], target: [0, -0.1, 0], motes: 70, spread: 5 }, (scene) => {
    const lanes = [
      { snail: snailModel(0), z: 0.6, y: -1.0, speed: 0.00022, scale: 0.95, direction: 1 },
      { snail: snailModel(2), z: -1.1, y: 0.15, speed: 0.00015, scale: 0.68, direction: -1 },
    ];
    lanes.forEach((lane) => {
      lane.snail.group.scale.setScalar(lane.scale);
      lane.snail.group.rotation.y = lane.direction > 0 ? 0 : Math.PI;
      scene.add(lane.snail.group);
    });
    return (time) => {
      lanes.forEach((lane) => {
        const travel = ((time * lane.speed) % 1) * 7 - 3.5;
        lane.snail.group.position.set(lane.direction > 0 ? travel : -travel, lane.y, lane.z);
        lane.snail.animate(time);
      });
    };
  });
}

const STUDY_BUILDERS = {
  "basic-fish": (canvas) => turntable(canvas, { position: [1.2, 1.1, 5.2] }, (root) => {
    const model = fishModel(fishParts("wedge"));
    model.group.scale.setScalar(1.45);
    root.add(model.group);
    return [model];
  }),
  "fish-forms": (canvas) => turntable(canvas, { position: [0.6, 1.4, 6.6], fov: 42 }, (root) => {
    return [["needle", -1.9, 0.55], ["disk", 0.1, -0.35], ["heavy", 2.0, 0.5]].map(([variant, x, y]) => {
      const model = fishModel(fishParts(variant));
      model.group.scale.setScalar(0.78);
      model.group.position.set(x, y, 0);
      root.add(model.group);
      return model;
    });
  }),
  snails: (canvas) => turntable(canvas, { position: [0.9, 1.2, 5.4], target: [0, -0.2, 0] }, (root) => {
    return [[0, -1.6, 1.0, 0.35], [1, 0.15, 0.86, -0.45], [2, 1.7, 0.78, 0.5]].map(([variant, x, scale, z]) => {
      const model = snailModel(variant);
      model.group.scale.setScalar(scale);
      model.group.position.set(x, -1.15, z);
      model.group.rotation.y = variant === 1 ? -0.4 : 0.25;
      root.add(model.group);
      return model;
    });
  }),
  tidepool: (canvas) => turntable(canvas, { position: [0.9, 1.6, 6.2], fov: 42 }, (root) => {
    const fish = fishModel(fishParts("disk"));
    fish.group.scale.setScalar(0.62);
    fish.group.position.set(-1.1, 0.9, 0.4);
    const needle = fishModel(fishParts("needle"));
    needle.group.scale.setScalar(0.5);
    needle.group.position.set(1.4, 0.35, -0.6);
    needle.group.rotation.y = Math.PI * 0.85;
    const snailA = snailModel(2);
    snailA.group.scale.setScalar(0.68);
    snailA.group.position.set(-1.3, -1.45, 0.5);
    const snailB = snailModel(0);
    snailB.group.scale.setScalar(0.58);
    snailB.group.position.set(1.1, -1.5, -0.3);
    snailB.group.rotation.y = Math.PI;
    [fish, needle, snailA, snailB].forEach((actor) => root.add(actor.group));
    return [fish, needle, snailA, snailB];
  }),
  whale: (canvas) => turntable(canvas, { position: [1.4, 1.3, 7.2], fov: 40 }, (root) => {
    const model = whaleModel();
    model.group.scale.setScalar(1.05);
    root.add(model.group);
    return [model];
  }),
  manta: (canvas) => run(canvas, { position: [0.5, 1.15, 6.2], target: [0, 0, 0], fov: 40 }, (scene) => {
    const model = mantaModel();
    model.group.scale.setScalar(1.15);
    // The card camera looks through +Z; tip the natural XZ wing plane toward it.
    const plane = new THREE.Group();
    plane.rotation.x = Math.PI / 2;
    plane.add(model.group);
    const orient = new THREE.Group();
    orient.rotation.z = Math.PI / 2;
    orient.add(plane);
    scene.add(orient);
    return (time) => {
      // A shallow bank rather than the shared turntable: a full spin would swing
      // the wing plane edge-on for most of its travel.
      orient.rotation.y = Math.sin(time * 0.00022) * 0.24;
      orient.rotation.x = Math.sin(time * 0.00031) * 0.1;
      model.animate(time);
    };
  }),
  shark: (canvas) => turntable(canvas, { position: [1.4, 1.2, 6.6], fov: 40 }, (root) => {
    const model = sharkModel();
    model.group.scale.setScalar(1.2);
    root.add(model.group);
    return [model];
  }),
  school: schoolStudy,
  crawl: crawlStudy,
};

export { fishParts, fishModel, whaleModel, mantaModel, sharkModel, snailModel };

document.querySelectorAll("[data-life-study]").forEach((canvas) => {
  const builder = STUDY_BUILDERS[canvas.dataset.lifeStudy];
  if (builder) builder(canvas);
});
