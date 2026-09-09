const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const kelpSpecies = {
  ribbon: ["#071b23", "#0c3038", "#14504b", "#28705a"],
  fan: ["#0a2626", "#135047", "#23745c", "#55a475"],
  feather: ["#112b22", "#245237", "#42733d", "#729245"],
  bulb: ["#273321", "#536331", "#858340", "#b8a75b"],
  whip: ["#082524", "#0e4b45", "#177160", "#67ad8b"],
  sheet: ["#17291d", "#304f35", "#537840", "#88a45a"],
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
};
const bladeColors = kelpSpecies.ribbon;
export const UNDERWATER_SCENES = Object.freeze(Object.keys(speciesMix));
const fishColors = ["#1f4b91", "#3973c8", "#86b5ff"];

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

function ribbon(ctx, rootX, rootY, length, width, bend, time, tone, sway = 1, colors = bladeColors) {
  const left = []; const right = []; const segments = 7;
  for (let segment = 0; segment <= segments; segment += 1) {
    const progress = segment / segments;
    const wobble = Math.sin(time * 0.00072 * sway + rootX * 0.041 + progress * 3.1) * progress * 13 * sway;
    const centerX = rootX + bend * progress * progress + wobble + (segment % 2 ? width * 0.1 : -width * 0.08);
    const half = width * (1 - progress * 0.72);
    const y = rootY - length * progress;
    left.push([centerX - half, y]);
    right.push([centerX + half, y]);
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

function forestLayer(ctx, scene, width, height, time, layer, worldExtent = 1) {
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
    const rootY = height + 14 + variation * 18;
    const length = height * (0.42 + variation * 0.55) * lengthScale * worldScale;
    const bladeWidth = (8 + variation * 12) * widthScale * worldScale;
    const mix = speciesMix[scene] ?? speciesMix.mosaic;
    const form = mix[(index + depth * 2) % mix.length];
    if (form === "ribbon") ribbon(ctx, x, rootY, length, bladeWidth, (variation - 0.5) * 48, time, index + depth, 0.45 + depth * 0.3, kelpSpecies.ribbon);
    else if (form === "fan") fan(ctx, x, rootY, length, bladeWidth, time, index + depth, kelpSpecies.fan);
    else if (form === "feather") feather(ctx, x, rootY, length, bladeWidth, time, index + depth, kelpSpecies.feather);
    else if (form === "bulb") bulb(ctx, x, rootY, length, bladeWidth, time, index + depth, kelpSpecies.bulb);
    else if (form === "whip") whips(ctx, x, rootY, length, bladeWidth, time, index + depth, kelpSpecies.whip);
    else sheets(ctx, x, rootY, length, bladeWidth, time, index + depth, kelpSpecies.sheet);
    if ((scene === "grove" || scene === "aisle") && depth > 0) {
      for (let leaf = 0; leaf < 5; leaf += 1) {
        const y = rootY - length * (0.2 + leaf * 0.14);
        ribbon(ctx, x + (leaf % 2 ? 3 : -3), y, height * 0.13 * lengthScale, bladeWidth * 0.65, leaf % 2 ? 28 : -28, time, index + leaf + 1, 0.5 + depth * 0.2, kelpSpecies.feather);
      }
    }
  }
  ctx.restore();
}

function drawFish(ctx, fish) {
  const scale = (0.18 + fish.depth * 0.24) * fish.scale;
  ctx.save();
  ctx.globalAlpha = 0.55 + fish.depth * 0.4;
  ctx.translate(fish.x, fish.y);
  ctx.rotate(Math.atan2(fish.vy, fish.vx));
  ctx.scale(scale, scale);
  polygon(ctx, [[-10, 0], [-1, -6], [14, -4], [19, 0]], fishColors[0]);
  polygon(ctx, [[-10, 0], [-1, 6], [14, 4], [19, 0]], fishColors[1]);
  polygon(ctx, [[-10, 0], [-25, -8], [-22, 0]], "#163866");
  polygon(ctx, [[-10, 0], [-25, 8], [-22, 0]], fishColors[0]);
  polygon(ctx, [[-1, -6], [7, -1], [14, -4]], fishColors[2]);
  ctx.fillStyle = "#d9edff"; ctx.fillRect(12, -2, 2, 2);
  ctx.restore();
}

function makeSchool(width, height, worldExtent = 1) {
  const schoolScale = 1 / Math.sqrt(worldExtent);
  return Array.from({ length: Math.round(30 * Math.sqrt(worldExtent)) }, (_, index) => ({
    x: Math.random() * width, y: height * (0.32 + Math.random() * 0.35), vx: 0.1 + Math.random() * 0.11,
    vy: (Math.random() - 0.5) * 0.18, depth: 0.28 + Math.random() * 0.72, lane: index % 2 ? -1 : 1, phase: Math.random() * Math.PI * 2, scale: schoolScale,
  }));
}

function updateSchool(ctx, school, width, height, time) {
  const phase = 0.5 - Math.cos(time * 0.00022) * 0.5;
  const split = phase * phase * (3 - 2 * phase);
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
    const laneY = height * 0.51 + fish.lane * split * height * 0.1 + Math.sin(time * 0.00072 + fish.phase) * 4;
    fish.vx += (0.18 + fish.depth * 0.08 - fish.vx) * 0.006;
    fish.vy += (laneY - fish.y) * 0.00023;
    const speed = Math.hypot(fish.vx, fish.vy);
    if (speed > 0.48) { fish.vx = fish.vx / speed * 0.48; fish.vy = fish.vy / speed * 0.48; }
    fish.x += fish.vx; fish.y += fish.vy;
    if (fish.x > width + 14) { fish.x = -14; fish.y = height * (0.37 + Math.random() * 0.28); }
    if (fish.y < height * 0.22) fish.vy += 0.02;
    if (fish.y > height * 0.78) fish.vy -= 0.02;
    drawFish(ctx, fish);
  });
}

function drawRareAnimal(ctx, width, height, time, worldExtent = 1) {
  const cycle = 52000;
  const duration = 7200;
  const phase = (time + 17300) % cycle;
  if (phase >= duration) return;
  const kind = Math.floor((time + 17300) / cycle) % 3;
  const progress = phase / duration;
  const scale = Math.min(width / 420, height / 260) / Math.sqrt(worldExtent);
  const x = -80 + progress * (width + 160);
  const y = height * 0.43 + Math.sin(progress * Math.PI) * height * 0.09;
  ctx.save();
  ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.32;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (kind === 0) {
    polygon(ctx, [[-55, 0], [-20, -18], [30, -15], [58, 0], [30, 15], [-20, 18], [-76, 27], [-65, 0], [-76, -27]], "#83a5bc");
    polygon(ctx, [[-20, -18], [14, -3], [30, -15]], "#b0cbda");
  } else if (kind === 1) {
    polygon(ctx, [[-62, 0], [-16, -39], [0, -12], [16, -39], [62, 0], [16, 35], [0, 62], [-16, 35]], "#789ab4");
    polygon(ctx, [[-16, 35], [16, 35], [4, 75], [-4, 75]], "#4e6e8d");
  } else {
    polygon(ctx, [[-62, 0], [-16, -13], [28, -11], [59, 0], [28, 11], [-16, 13], [-78, 28], [-67, 0], [-78, -28]], "#9bb7c5");
    polygon(ctx, [[-8, -12], [8, -39], [21, -10]], "#6e91aa");
  }
  ctx.restore();
}

export function startUnderwaterScene(canvas, initialScene = canvas.dataset.underwaterScene, onSceneChange, options = {}) {
  const worldExtent = Math.max(options.worldExtent ?? 1, 1);
  let scene = initialScene;
  let state = fit(canvas);
  let school = makeSchool(state.width, state.height, worldExtent);
  let frame;

  function setScene(nextScene) {
    if (!speciesMix[nextScene] || nextScene === scene) return;
    scene = nextScene;
    school = makeSchool(state.width, state.height, worldExtent);
    onSceneChange?.(scene);
  }

  function render(time) {
    const { ctx, width, height } = state;
    water(ctx, width, height);
    forestLayer(ctx, scene, width, height, time, "far", worldExtent);
    forestLayer(ctx, scene, width, height, time, "middle", worldExtent);
    updateSchool(ctx, school, width, height, time);
    drawRareAnimal(ctx, width, height, time, worldExtent);
    forestLayer(ctx, scene, width, height, time, "front", worldExtent);
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);
  }

  const onResize = () => {
    state = fit(canvas);
    school = makeSchool(state.width, state.height, worldExtent);
    if (reducedMotion.matches) render(0);
  };
  window.addEventListener("resize", onResize);
  onSceneChange?.(scene);
  render(0);
  return { setScene, destroy: () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); } };
}

document.querySelectorAll("[data-underwater-scene]").forEach((canvas) => startUnderwaterScene(canvas));

document.querySelector("[data-scene-blur-toggle]")?.addEventListener("click", (event) => {
  const enabled = document.documentElement.classList.toggle("scene-study-blur");
  event.currentTarget.setAttribute("aria-pressed", String(enabled));
  event.currentTarget.textContent = enabled ? "Sharpen forest" : "Blur forest";
});
