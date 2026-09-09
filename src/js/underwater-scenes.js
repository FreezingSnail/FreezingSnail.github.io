import { drawFish as drawStudyFish, drawManta, drawShark, drawWhale } from "./sea-life-studies.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const kelpSpecies = {
  ribbon: ["#071b23", "#0c3038", "#14504b", "#28705a"],
  fan: ["#0a2626", "#135047", "#23745c", "#55a475"],
  feather: ["#112b22", "#245237", "#42733d", "#729245"],
  bulb: ["#273321", "#536331", "#858340", "#b8a75b"],
  whip: ["#082524", "#0e4b45", "#177160", "#67ad8b"],
  sheet: ["#17291d", "#304f35", "#537840", "#88a45a"],
  giant: ["#0b2630", "#15515a", "#287d70", "#78b694"],
  palm: ["#182a1c", "#3a5833", "#668244", "#a5a85c"],
};
const speciesMix = {
  thicket: ["ribbon", "ribbon", "fan", "whip", "feather"],
  grove: ["feather", "ribbon", "bulb", "feather", "whip"],
  canopy: ["ribbon", "bulb", "ribbon", "sheet", "feather"],
  clearing: ["fan", "feather", "whip", "ribbon"],
  wall: ["ribbon", "ribbon", "sheet", "fan", "whip"],
  aisle: ["feather", "bulb", "feather", "ribbon"],
  tangle: ["sheet", "fan", "whip", "ribbon", "fan"],
  deep: ["ribbon", "whip", "feather", "ribbon", "sheet"],
  "bulb-bed": ["bulb", "bulb", "ribbon", "sheet", "bulb"],
  "feather-meadow": ["feather", "feather", "whip", "ribbon", "feather"],
  "fan-reef": ["fan", "fan", "sheet", "ribbon", "fan"],
  mosaic: ["ribbon", "fan", "feather", "bulb", "whip", "sheet"],
  "tower-grove": ["giant", "giant", "feather", "ribbon", "whip"],
  "palm-canopy": ["palm", "palm", "giant", "sheet", "fan"],
  "giant-wall": ["giant", "giant", "palm", "feather", "ribbon"],
  "open-forest": ["giant", "palm", "ribbon", "whip", "sheet"],
};
const bladeColors = kelpSpecies.ribbon;
export const UNDERWATER_SCENES = Object.freeze(Object.keys(speciesMix));

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function fit(canvas) {
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(bounds.width * ratio));
  canvas.height = Math.max(1, Math.round(bounds.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: bounds.width, height: bounds.height };
}

function water(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#78ad95");
  gradient.addColorStop(0.52, "#3a7b6c");
  gradient.addColorStop(1, "#1d554f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#8fc8a8";
  for (let x = 9; x < width; x += 37) for (let y = (x * 11) % 41; y < height; y += 47) ctx.fillRect(x, y, 1, 1);
}

/**
 * Virtual raster for the Canvas scenes. The PS1 could not place a vertex between
 * pixels, so kelp vertices are rounded onto this grid and the sway phase advances
 * in steps: the silhouette pops from pose to pose instead of sliding.
 */
const RASTER = 2;

function snap(value) {
  return Math.round(value / RASTER) * RASTER;
}

function ribbon(ctx, rootX, rootY, length, width, bend, time, tone, sway = 1, colors = bladeColors) {
  const left = []; const right = []; const segments = 7;
  const steppedTime = Math.round(time / 42) * 42;
  for (let segment = 0; segment <= segments; segment += 1) {
    const progress = segment / segments;
    const wobble = Math.sin(steppedTime * 0.00072 * sway + rootX * 0.041 + progress * 3.1) * progress * 13 * sway;
    const centerX = rootX + bend * progress * progress + wobble + (segment % 2 ? width * 0.1 : -width * 0.08);
    const half = width * (1 - progress * 0.72);
    const y = rootY - length * progress;
    left.push([snap(centerX - half), snap(y)]);
    right.push([snap(centerX + half), snap(y)]);
  }
  for (let segment = 0; segment < segments; segment += 1) {
    polygon(ctx, [left[segment], right[segment], left[segment + 1]], colors[(tone + segment) % colors.length]);
    polygon(ctx, [right[segment], right[segment + 1], left[segment + 1]], colors[(tone + segment + 1) % colors.length]);
  }
}

function fan(ctx, x, y, length, width, time, tone, colors) {
  for (let blade = 0; blade < 4; blade += 1) {
    ribbon(ctx, x + (blade - 1.5) * width * 0.18, y, length * (0.7 + blade * 0.08), width * 0.58, (blade - 1.5) * width * 1.8, time, tone + blade, 0.7, colors);
  }
}

function feather(ctx, x, y, length, width, time, tone, colors) {
  ribbon(ctx, x, y, length, width * 0.2, width * 0.7, time, tone, 0.55, colors);
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const leafY = y - length * (0.2 + leaf * 0.14);
    ribbon(ctx, x, leafY, length * 0.2, width * 0.52, leaf % 2 ? width * 1.9 : -width * 1.9, time, tone + leaf + 1, 0.65, colors);
  }
}

function bulb(ctx, x, y, length, width, time, tone, colors) {
  ribbon(ctx, x, y, length * 0.75, width * 0.17, width * 0.6, time, tone, 0.5, colors);
  const crownY = y - length * 0.71;
  polygon(ctx, [[x, crownY - width * 0.5], [x + width * 0.43, crownY - width * 0.1], [x + width * 0.28, crownY + width * 0.36], [x - width * 0.3, crownY + width * 0.36], [x - width * 0.43, crownY - width * 0.1]], colors[(tone + 3) % colors.length]);
  for (let blade = 0; blade < 4; blade += 1) ribbon(ctx, x, crownY, length * 0.2, width * 0.44, (blade - 1.5) * width * 1.7, time, tone + blade, 0.7, colors);
}

function whips(ctx, x, y, length, width, time, tone, colors) {
  for (let blade = 0; blade < 3; blade += 1) {
    ribbon(ctx, x + (blade - 1) * width * 0.32, y, length * (0.84 + blade * 0.08), width * 0.18, (blade - 1) * width * 2.4, time, tone + blade, 0.9, colors);
  }
}

function sheets(ctx, x, y, length, width, time, tone, colors) {
  ribbon(ctx, x - width * 0.22, y, length * 0.72, width * 1.15, -width * 1.7, time, tone, 0.72, colors);
  ribbon(ctx, x + width * 0.25, y, length * 0.88, width * 0.86, width * 1.5, time, tone + 1, 0.68, colors);
}

function giant(ctx, x, y, length, width, time, tone, colors) {
  ribbon(ctx, x, y, length * 1.08, width * 0.16, width * 0.45, time, tone, 0.45, colors);
  for (let leaf = 0; leaf < 7; leaf += 1) {
    const leafY = y - length * (0.18 + leaf * 0.12);
    ribbon(ctx, x, leafY, length * 0.24, width * 0.48, leaf % 2 ? width * 2.2 : -width * 2.2, time, tone + leaf + 1, 0.6, colors);
  }
}

function palm(ctx, x, y, length, width, time, tone, colors) {
  ribbon(ctx, x, y, length * 0.82, width * 0.18, width * 0.35, time, tone, 0.42, colors);
  const crownY = y - length * 0.79;
  polygon(ctx, [[x, crownY - width * 0.42], [x + width * 0.38, crownY - width * 0.08], [x + width * 0.23, crownY + width * 0.33], [x - width * 0.28, crownY + width * 0.32], [x - width * 0.4, crownY - width * 0.09]], colors[(tone + 3) % colors.length]);
  for (let frond = 0; frond < 7; frond += 1) {
    ribbon(ctx, x, crownY, length * 0.3, width * 0.48, (frond - 3) * width * 1.55, time, tone + frond, 0.62, colors);
  }
}

function forestLayer(ctx, scene, width, height, time, layer, worldExtent = 1, verticalLift = 0, kelpHeight = 1, structureReach = 0) {
  const profile = {
    thicket: { far: 21, middle: 15, front: 10, height: 0.82 },
    grove: { far: 17, middle: 11, front: 7, height: 1.22 },
    canopy: { far: 19, middle: 14, front: 9, height: 1.08 },
    clearing: { far: 18, middle: 12, front: 8, height: 0.94 },
    wall: { far: 25, middle: 19, front: 14, height: 1.03 },
    aisle: { far: 15, middle: 8, front: 6, height: 1.35 },
    tangle: { far: 27, middle: 20, front: 12, height: 0.72 },
    deep: { far: 30, middle: 17, front: 8, height: 1.12 },
    "bulb-bed": { far: 19, middle: 15, front: 10, height: 1.05 },
    "feather-meadow": { far: 24, middle: 18, front: 9, height: 1.14 },
    "fan-reef": { far: 22, middle: 19, front: 13, height: 0.78 },
    mosaic: { far: 26, middle: 18, front: 11, height: 1 },
    "tower-grove": { far: 16, middle: 10, front: 6, height: 1.8 },
    "palm-canopy": { far: 14, middle: 9, front: 5, height: 1.7 },
    "giant-wall": { far: 21, middle: 15, front: 10, height: 1.6 },
    "open-forest": { far: 13, middle: 8, front: 4, height: 1.75 },
  }[scene];
  const depth = layer === "far" ? 0 : layer === "middle" ? 1 : 2;
  const worldScale = 1 / Math.sqrt(worldExtent);
  const count = Math.ceil(profile[layer] * worldExtent);
  const alpha = [0.3, 0.6, 0.94][depth];
  const widthScale = [0.34, 0.7, 1.16][depth];
  const lengthScale = [0.43, 0.72, 1][depth] * profile.height;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let index = 0; index < count; index += 1) {
    const variation = (Math.sin(index * 19.7 + depth * 3.1) + 1) * 0.5;
    let x = (index + 0.5) * width / count + Math.sin(index * 7.9) * width / count * 0.28;
    if (scene === "clearing" && depth === 2) {
      const side = index < count / 2 ? -1 : 1;
      x = width * 0.5 + side * (width * 0.27 + (index % (count / 2)) * width * 0.075);
    }
    const rootY = height + 14 + variation * 18 - height * verticalLift;
    const length = height * (0.42 + variation * 0.55) * lengthScale * worldScale * kelpHeight;
    const bladeWidth = (8 + variation * 12) * widthScale * worldScale;
    const structureRootY = rootY - height * structureReach * (0.72 + variation * 0.4);
    if (structureReach > 0) {
      ribbon(ctx, x, rootY, rootY - structureRootY, Math.max(bladeWidth * 0.16, 1.4), (variation - 0.5) * 18, time, index + depth, 0.35 + depth * 0.18, kelpSpecies.feather);
    }
    const mix = speciesMix[scene] ?? speciesMix.mosaic;
    const form = mix[(index + depth * 2) % mix.length];
    if (form === "ribbon") ribbon(ctx, x, structureRootY, length, bladeWidth, (variation - 0.5) * 48, time, index + depth, 0.45 + depth * 0.3, kelpSpecies.ribbon);
    else if (form === "fan") fan(ctx, x, structureRootY, length, bladeWidth, time, index + depth, kelpSpecies.fan);
    else if (form === "feather") feather(ctx, x, structureRootY, length, bladeWidth, time, index + depth, kelpSpecies.feather);
    else if (form === "bulb") bulb(ctx, x, structureRootY, length, bladeWidth, time, index + depth, kelpSpecies.bulb);
    else if (form === "giant") giant(ctx, x, structureRootY, length, bladeWidth, time, index + depth, kelpSpecies.giant);
    else if (form === "palm") palm(ctx, x, structureRootY, length, bladeWidth, time, index + depth, kelpSpecies.palm);
    else if (form === "whip") whips(ctx, x, structureRootY, length, bladeWidth, time, index + depth, kelpSpecies.whip);
    else sheets(ctx, x, structureRootY, length, bladeWidth, time, index + depth, kelpSpecies.sheet);
    if ((scene === "grove" || scene === "aisle") && depth > 0) {
      for (let leaf = 0; leaf < 5; leaf += 1) {
        const y = structureRootY - length * (0.2 + leaf * 0.14);
        ribbon(ctx, x + (leaf % 2 ? 3 : -3), y, height * 0.13 * lengthScale, bladeWidth * 0.65, leaf % 2 ? 28 : -28, time, index + leaf + 1, 0.5 + depth * 0.2, kelpSpecies.feather);
      }
    }
  }
  ctx.restore();
}

function drawFish(ctx, fish) {
  // Snapped position and a quantized heading keep swimming life on the same
  // fixed-point raster as the kelp instead of gliding smoothly past it.
  const heading = Math.round(Math.atan2(fish.vy, fish.vx) * 16) / 16;
  drawStudyFish(ctx, snap(fish.x), snap(fish.y), heading, (0.18 + fish.depth * 0.24) * fish.scale, "wedge", 0.55 + fish.depth * 0.4);
}

function makeSchool(width, height, worldExtent = 1, lifeScale = 1 / Math.sqrt(worldExtent), boidDensity = 1) {
  return Array.from({ length: Math.round(30 * Math.sqrt(worldExtent) * boidDensity) }, (_, index) => ({
    x: Math.random() * width, y: height * (0.32 + Math.random() * 0.35), vx: 0.1 + Math.random() * 0.11,
    vy: (Math.random() - 0.5) * 0.18, depth: 0.28 + Math.random() * 0.72, lane: index % 2 ? -1 : 1, phase: Math.random() * Math.PI * 2, scale: lifeScale,
  }));
}

function updateSchool(ctx, school, width, height, time) {
  const schoolPulse = 0.5 - Math.cos(time * 0.00038) * 0.5;
  const split = schoolPulse * schoolPulse * (3 - 2 * schoolPulse);
  school.forEach((fish) => {
    let nearby = 0; let centerX = 0; let centerY = 0; let headingX = 0; let headingY = 0; let avoidX = 0; let avoidY = 0;
    school.forEach((other) => {
      if (fish === other) return;
      const dx = other.x - fish.x; const dy = other.y - fish.y; const distance = Math.hypot(dx, dy);
      if (distance > 92) return;
      nearby += 1; centerX += other.x; centerY += other.y; headingX += other.vx; headingY += other.vy;
      if (distance < 23 && distance > 0.1) { avoidX -= dx / distance; avoidY -= dy / distance; }
    });
    if (nearby) {
      fish.vx += (headingX / nearby - fish.vx) * 0.026 + (centerX / nearby - fish.x) * 0.0008 + avoidX * 0.035;
      fish.vy += (headingY / nearby - fish.vy) * 0.026 + (centerY / nearby - fish.y) * 0.0008 + avoidY * 0.035;
    }
    const laneY = height * 0.51 + fish.lane * split * height * 0.14 + Math.sin(time * 0.0011 + fish.phase) * 12;
    const currentX = 0.2 + fish.depth * 0.11 + Math.sin(time * 0.00077 + fish.phase) * 0.1;
    const currentY = Math.cos(time * 0.00093 + fish.phase * 1.7) * 0.08;
    fish.vx += (currentX - fish.vx) * 0.018 + Math.cos(time * 0.0014 + fish.phase) * 0.006;
    fish.vy += (laneY - fish.y) * 0.00048 + currentY * 0.018;
    const speed = Math.hypot(fish.vx, fish.vy);
    if (speed > 0.72) { fish.vx = fish.vx / speed * 0.72; fish.vy = fish.vy / speed * 0.72; }
    fish.x += fish.vx; fish.y += fish.vy;
    if (fish.x > width + 14) { fish.x = -14; fish.y = height * (0.3 + Math.random() * 0.4); }
    if (fish.x < -14) { fish.x = width + 14; fish.y = height * (0.3 + Math.random() * 0.4); }
    if (fish.y < height * 0.16) fish.vy += 0.04;
    if (fish.y > height * 0.84) fish.vy -= 0.04;
    drawFish(ctx, fish);
  });
}

function createRareLife() {
  return {
    offset: Math.random() * 32000,
    kindOffset: Math.floor(Math.random() * 3),
    direction: Math.random() < 0.5 ? -1 : 1,
    baseY: 0.27 + Math.random() * 0.32,
    phase: Math.random() * Math.PI * 2,
  };
}

function drawRareAnimal(ctx, width, height, time, rareLife, worldExtent = 1, lifeScale = 1 / Math.sqrt(worldExtent), animalScale = 1) {
  const cycle = 32000;
  const duration = 8000;
  const encounterTime = time + rareLife.offset;
  const encounter = Math.floor(encounterTime / cycle);
  const phase = encounterTime % cycle;
  if (phase >= duration) return;
  const kind = (rareLife.kindOffset + encounter * 2) % 3;
  const progress = phase / duration;
  const direction = (encounter % 2 ? -rareLife.direction : rareLife.direction);
  const scale = Math.min(width / 190, height / 105) * lifeScale * animalScale;
  const x = snap(direction > 0 ? -80 + progress * (width + 160) : width + 80 - progress * (width + 160));
  const y = snap(height * rareLife.baseY + Math.sin(progress * Math.PI * 1.4 + rareLife.phase) * height * 0.11);
  ctx.save();
  ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.44;
  if (kind === 0) drawWhale(ctx, x, y, direction > 0 ? scale : -scale);
  else if (kind === 1) {
    ctx.translate(x, y);
    ctx.rotate(direction > 0 ? Math.PI / 2 : -Math.PI / 2);
    ctx.translate(-x, -y);
    drawManta(ctx, x, y, scale);
  } else drawShark(ctx, x, y, direction > 0 ? scale : -scale);
  ctx.restore();
}

export function startUnderwaterScene(canvas, initialScene = canvas.dataset.underwaterScene, onSceneChange, options = {}) {
  const worldExtent = Math.max(options.worldExtent ?? 1, 1);
  const verticalLift = Math.max(options.verticalLift ?? 0, 0);
  const kelpHeight = Math.max(options.kelpHeight ?? 1, 0.1);
  const structureReach = Math.max(options.structureReach ?? 0, 0);
  const lifeScale = options.lifeScale ?? 1 / Math.sqrt(worldExtent);
  const boidDensity = Math.max(options.boidDensity ?? 1, 0.1);
  const animalScale = Math.max(options.animalScale ?? 1, 0.1);
  let scene = initialScene;
  let state = fit(canvas);
  let school = makeSchool(state.width, state.height, worldExtent, lifeScale, boidDensity);
  let rareLife = createRareLife();
  let frame;

  function setScene(nextScene) {
    if (!speciesMix[nextScene] || nextScene === scene) return;
    scene = nextScene;
    school = makeSchool(state.width, state.height, worldExtent, lifeScale, boidDensity);
    rareLife = createRareLife();
    onSceneChange?.(scene);
  }

  function render(time) {
    const { ctx, width, height } = state;
    water(ctx, width, height);
    forestLayer(ctx, scene, width, height, time, "far", worldExtent, verticalLift, kelpHeight, structureReach);
    forestLayer(ctx, scene, width, height, time, "middle", worldExtent, verticalLift, kelpHeight, structureReach);
    updateSchool(ctx, school, width, height, time);
    drawRareAnimal(ctx, width, height, time, rareLife, worldExtent, lifeScale, animalScale);
    forestLayer(ctx, scene, width, height, time, "front", worldExtent, verticalLift, kelpHeight, structureReach);
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);
  }

  const onResize = () => {
    state = fit(canvas);
    school = makeSchool(state.width, state.height, worldExtent, lifeScale, boidDensity);
    if (reducedMotion.matches) render(0);
  };
  window.addEventListener("resize", onResize);
  onSceneChange?.(scene);
  render(0);
  return { setScene, destroy: () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); } };
}

document.querySelectorAll("[data-underwater-scene]").forEach((canvas) => startUnderwaterScene(canvas, undefined, undefined, { worldExtent: Number(canvas.dataset.worldExtent) || 1 }));

document.querySelector("[data-scene-blur-toggle]")?.addEventListener("click", (event) => {
  const enabled = document.documentElement.classList.toggle("scene-study-blur");
  event.currentTarget.setAttribute("aria-pressed", String(enabled));
  event.currentTarget.textContent = enabled ? "Sharpen forest" : "Blur forest";
});
