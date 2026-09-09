import * as THREE from "three";

const FRAME_INTERVAL = 1000 / 24;
const palette = [0x10182d, 0x1b2d5c, 0x3156a3, 0x426fc4];

function random(min, max) {
  return min + Math.random() * (max - min);
}

function createBladeGeometry(width, length, curve) {
  const positions = [];
  const colors = [];
  const segments = 7;
  const tones = [0.38, 0.9, 0.52, 1, 0.44, 0.78, 0.6, 0.96];
  const edgeKicks = [0, 0.12, -0.08, 0.16, -0.13, 0.09, -0.05, 0];

  function face(vertices, tone) {
    vertices.forEach((vertex) => {
      positions.push(...vertex);
      colors.push(tone, tone, tone);
    });
  }

  for (let index = 0; index < segments; index += 1) {
    const start = index / segments;
    const end = (index + 1) / segments;
    const startKick = edgeKicks[index] * width;
    const endKick = edgeKicks[index + 1] * width;
    const centerStart = curve * start * start + Math.sin(start * Math.PI) * curve * 0.32 + startKick;
    const centerEnd = curve * end * end + Math.sin(end * Math.PI) * curve * 0.32 + endKick;
    const startWidth = width * (1 - start * 0.66);
    const endWidth = Math.max(width * (1 - end * 0.74), 0.02);
    const startFold = (index % 2 ? -1 : 1) * 0.075;
    const endFold = ((index + 1) % 2 ? -1 : 1) * 0.075;
    const a = [centerStart - startWidth * (1 + edgeKicks[index] * 0.7), start * length, startFold];
    const b = [centerStart + startWidth * (1 - edgeKicks[index] * 0.7), start * length, -startFold];
    const c = [centerEnd - endWidth * (1 + edgeKicks[index + 1] * 0.7), end * length, endFold];
    const d = [centerEnd + endWidth * (1 - edgeKicks[index + 1] * 0.7), end * length, -endFold];
    face([a, b, c], tones[(index * 2) % tones.length]);
    face([b, d, c], tones[(index * 2 + 1) % tones.length]);
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
    new THREE.MeshBasicMaterial({ color: palette[options.tone % palette.length], vertexColors: true, side: THREE.DoubleSide }),
  );
  mesh.position.set(options.x, options.y, options.z ?? 0);
  mesh.rotation.set(0, options.yaw ?? 0, options.angle);
  mesh.frustumCulled = false;
  group.add(mesh);
  animated.push({ mesh, base: options.angle, phase: Math.random() * Math.PI * 2, sway: options.sway ?? random(0.035, 0.1) });
}

function addRoot(group, x, y, scale = 1) {
  const root = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), new THREE.MeshBasicMaterial({ color: 0x091225 }));
  root.position.set(x, y, 0);
  root.scale.set(1.35 * scale, 0.48 * scale, 0.8 * scale);
  root.frustumCulled = false;
  group.add(root);
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
  const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), new THREE.MeshBasicMaterial({ color: 0x426fc4 }));
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
      const float = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color: palette[(branch + leaf + 2) % palette.length] }));
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
      blade.mesh.rotation.z = blade.base + Math.sin(time * 0.0011 + blade.phase) * blade.sway;
    });
    renderer.render(scene, camera);
  }

  resize();
  render(0);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let last = 0;
  function tick(time) {
    if (time - last >= FRAME_INTERVAL) {
      render(time);
      last = time;
    }
    if (!reducedMotion.matches) requestAnimationFrame(tick);
  }
  if (!reducedMotion.matches) requestAnimationFrame(tick);
  window.addEventListener("resize", () => { resize(); render(last); });
}

document.querySelectorAll("[data-kelp-study]").forEach(startStudy);
