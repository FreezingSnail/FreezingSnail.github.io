import * as THREE from "three";

const THEMES = ["theme-kelp-glass", "theme-kelp-lagoon"];
const FRAME_INTERVAL = 1000 / 30;
const BLADE_COUNT = 36;

const palettes = {
  "theme-kelp-glass": {
    base: 0x1d684d,
    tip: 0x96c991,
    particle: 0xd5e7bd,
  },
  "theme-kelp-lagoon": {
    base: 0x167c70,
    tip: 0xb5e6a7,
    particle: 0xf0efbc,
  },
};

function currentTheme() {
  return THEMES.find((theme) => document.documentElement.classList.contains(theme)) ?? THEMES[0];
}

function createBladeGeometry(variant) {
  const ribs = [
    [-0.04, 0.28, 0.02],
    [0.12, 0.26, -0.03],
    [-0.1, 0.23, 0.04],
    [0.16, 0.19, -0.02],
    [-0.08, 0.14, 0.03],
    [0.1, 0.08, -0.01],
    [0, 0.012, 0],
  ];
  const shades = [0.46, 0.78, 0.61, 0.9, 0.52, 0.72];
  const positions = [];
  const colors = [];

  function addFace(a, b, c, shade) {
    [a, b, c].forEach((vertex) => {
      positions.push(...vertex);
      colors.push(shade, shade, shade);
    });
  }

  for (let segment = 0; segment < ribs.length - 1; segment += 1) {
    const [centerA, widthA, depthA] = ribs[segment];
    const [centerB, widthB, depthB] = ribs[segment + 1];
    const yA = segment / (ribs.length - 1);
    const yB = (segment + 1) / (ribs.length - 1);
    const twist = (variant - 1) * 0.035;
    const leftA = [centerA - widthA, yA, depthA - twist];
    const rightA = [centerA + widthA, yA, depthA + twist];
    const leftB = [centerB - widthB, yB, depthB + twist];
    const rightB = [centerB + widthB, yB, depthB - twist];

    addFace(leftA, rightA, leftB, shades[(segment * 2 + variant) % shades.length]);
    addFace(rightA, rightB, leftB, shades[(segment * 2 + 1 + variant) % shades.length]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createKelpField() {
  const field = new THREE.Group();
  const bands = [];

  for (let band = 0; band < 3; band += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: 0x1d684d,
      vertexColors: true,
      transparent: true,
      opacity: 0.78 - band * 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const blades = new THREE.InstancedMesh(createBladeGeometry(band), material, BLADE_COUNT);
    const transform = new THREE.Object3D();
    const bladeStates = [];
    blades.frustumCulled = false;

    const setBladeTransform = (blade, sway = 0) => {
      transform.position.set(blade.x, -2.2, blade.z);
      transform.rotation.set(0, blade.yaw, blade.lean + sway);
      transform.scale.set(blade.width, blade.height, 1);
      transform.updateMatrix();
      blades.setMatrixAt(blade.index, transform.matrix);
    };

    for (let index = 0; index < BLADE_COUNT; index += 1) {
      const column = index % 12;
      const row = Math.floor(index / 12);
      const blade = {
        index,
        x: (column - 5.5) * 0.86 + (Math.random() - 0.5) * 0.3,
        z: -band * 2.4 - row * 0.9,
        width: 0.8 + Math.random() * 0.45,
        height: 1.75 - band * 0.24 + Math.random() * 0.68,
        yaw: (Math.random() - 0.5) * 0.72,
        lean: (Math.random() - 0.5) * 0.12,
        phase: Math.random() * Math.PI * 2,
        sway: 0.08 + Math.random() * 0.1,
      };
      bladeStates.push(blade);
      setBladeTransform(blade);
    }

    blades.instanceMatrix.needsUpdate = true;
    field.add(blades);
    bands.push({ blades, bladeStates, setBladeTransform });
  }

  return { field, bands };
}

function createParticles() {
  const positions = new Float32Array(180 * 3);
  for (let index = 0; index < positions.length; index += 3) {
    positions[index] = (Math.random() - 0.5) * 12;
    positions[index + 1] = Math.random() * 7 - 2.6;
    positions[index + 2] = -Math.random() * 9;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xd5e7bd,
    size: 0.035,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

function startKelpDemo() {
  const canvas = document.createElement("canvas");
  canvas.className = "kelp-background";

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  } catch {
    return;
  }

  document.body.prepend(canvas);
  document.documentElement.classList.add("has-webgl-kelp");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
  camera.position.set(0, 0.2, 6.2);
  camera.lookAt(0, -0.5, -3.3);

  const { field, bands } = createKelpField();
  const particles = createParticles();
  scene.add(field, particles);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  function applyPalette() {
    const palette = palettes[currentTheme()];
    bands.forEach((band, index) => {
      band.blades.material.color.setHex(index === 0 ? palette.base : palette.tip);
    });
    particles.material.color.setHex(palette.particle);
  }

  function resize() {
    const { innerWidth: width, innerHeight: height } = window;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frameId;
  let lastFrame = 0;

  function updateCanopy(time) {
    bands.forEach((band, bandIndex) => {
      band.bladeStates.forEach((blade) => {
        const sway = Math.sin(time * 0.00052 + blade.phase + bandIndex * 1.8) * blade.sway;
        band.setBladeTransform(blade, sway);
      });
      band.blades.instanceMatrix.needsUpdate = true;
    });
    particles.rotation.y = time * 0.000018;
  }

  function render(time) {
    frameId = undefined;
    if (time - lastFrame >= FRAME_INTERVAL) {
      updateCanopy(time);
      renderer.render(scene, camera);
      lastFrame = time;
    }
    schedule();
  }

  function schedule() {
    if (!reducedMotion.matches && document.visibilityState === "visible" && !frameId) {
      frameId = requestAnimationFrame(render);
    }
  }

  function renderStatic() {
    updateCanopy(0);
    renderer.render(scene, camera);
  }

  document.addEventListener("kelp-theme-change", () => {
    applyPalette();
    renderStatic();
  });
  window.addEventListener("resize", () => {
    resize();
    renderStatic();
  });
  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener("change", () => {
    renderStatic();
    schedule();
  });

  applyPalette();
  resize();
  renderStatic();
  schedule();
}

if (document.querySelector("[data-kelp-demo]")) {
  startKelpDemo();
}
