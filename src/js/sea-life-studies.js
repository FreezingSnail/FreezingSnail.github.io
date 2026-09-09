const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const water = "#061127";
const fishPalette = ["#17346b", "#2859ad", "#4e83dc", "#8fb6ff"];
const shellPalette = ["#47325f", "#77508a", "#a172a8", "#d09bb7"];

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function waterField(ctx, width, height) {
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#0b2042";
  for (let x = 8; x < width; x += 36) {
    for (let y = (x * 13) % 29; y < height; y += 43) ctx.fillRect(x, y, 1, 1);
  }
}

function drawFish(ctx, x, y, angle, size, variant = "wedge", opacity = 1) {
  const shape = variant === "needle" ? [1.45, 0.5] : variant === "disk" ? [0.8, 1.22] : variant === "heavy" ? [1.2, 0.9] : [1, 0.72];
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size * shape[0], size * shape[1]);
  polygon(ctx, [[-12, 0], [-2, -9], [14, -5], [20, 0]], fishPalette[1]);
  polygon(ctx, [[-12, 0], [-2, 9], [14, 5], [20, 0]], fishPalette[2]);
  polygon(ctx, [[-2, -9], [8, -1], [14, -5]], fishPalette[3]);
  polygon(ctx, [[-12, 0], [-28, -11], [-24, 0]], fishPalette[0]);
  polygon(ctx, [[-12, 0], [-28, 11], [-24, 0]], fishPalette[1]);
  polygon(ctx, [[-2, -7], [0, -16], [8, -4]], fishPalette[2]);
  polygon(ctx, [[2, 6], [5, 14], [10, 4]], fishPalette[0]);
  ctx.fillStyle = "#d9edff";
  ctx.fillRect(12, -3, 3, 3);
  ctx.restore();
}

function drawSnail(ctx, x, y, size, shell = 0, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);
  polygon(ctx, [[-23, 7], [-15, -1], [14, -1], [25, 5], [20, 11], [-24, 11]], "#31576b");
  polygon(ctx, [[15, 2], [31, -5], [29, 2], [22, 7]], "#4d8a95");
  ctx.strokeStyle = "#7ac3c8";
  ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(25, -2); ctx.lineTo(30, -13); ctx.moveTo(29, -2); ctx.lineTo(36, -10); ctx.stroke();
  const radius = (shell === 1 ? 13 : shell === 2 ? 16 : 15) * size;
  const sides = shell === 1 ? 5 : shell === 2 ? 7 : 6;
  const centerY = -radius * 0.1;
  const shellPoints = Array.from({ length: sides }, (_, index) => {
    const a = -Math.PI / 2 + index * (Math.PI * 2 / sides);
    return [Math.cos(a) * radius, centerY + Math.sin(a) * radius];
  });
  polygon(ctx, shellPoints, shellPalette[shell + 1]);
  polygon(ctx, [[0, centerY], shellPoints[0], shellPoints[2]], shellPalette[3]);
  polygon(ctx, [[0, centerY], shellPoints[2], shellPoints[4]], shellPalette[1]);
  ctx.fillStyle = "#2c1d40";
  ctx.beginPath(); ctx.arc(0, centerY, radius * 0.43, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shellPalette[3];
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, centerY, radius * 0.26, 0.5, Math.PI * 5.3); ctx.stroke();
  ctx.restore();
}

function drawWhale(ctx, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  polygon(ctx, [[-38, 0], [-20, -14], [19, -16], [42, -6], [52, 0]], "#29466d");
  polygon(ctx, [[-38, 0], [-20, 14], [19, 16], [42, 6], [52, 0]], "#3f6696");
  polygon(ctx, [[-20, -14], [8, -3], [19, -16]], "#6e96c1");
  polygon(ctx, [[-38, 0], [-62, -18], [-58, 0]], "#1b3157");
  polygon(ctx, [[-38, 0], [-62, 18], [-58, 0]], "#29466d");
  polygon(ctx, [[-4, 11], [10, 29], [20, 8]], "#203b62");
  ctx.fillStyle = "#dcecff"; ctx.fillRect(39, -4, 4, 4); ctx.restore();
}

function drawManta(ctx, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  polygon(ctx, [[-48, 0], [-12, -29], [0, -9], [12, -29], [48, 0], [13, 22], [-13, 22]], "#223d63");
  polygon(ctx, [[-48, 0], [0, -9], [-13, 22]], "#315982");
  polygon(ctx, [[48, 0], [0, -9], [13, 22]], "#4b739c");
  polygon(ctx, [[-13, 22], [13, 22], [5, 48], [-4, 48]], "#152b4b");
  polygon(ctx, [[-12, -29], [-6, -43], [0, -25]], "#6d9bbf");
  polygon(ctx, [[12, -29], [6, -43], [0, -25]], "#6d9bbf");
  ctx.restore();
}

function drawShark(ctx, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  polygon(ctx, [[-42, 0], [-15, -9], [22, -8], [45, 0]], "#2d5a83");
  polygon(ctx, [[-42, 0], [-15, 9], [22, 8], [45, 0]], "#4b7fa7");
  polygon(ctx, [[-9, -8], [3, -28], [14, -7]], "#1c3e66");
  polygon(ctx, [[-2, 8], [13, 24], [19, 7]], "#264d75");
  polygon(ctx, [[-42, 0], [-62, -18], [-56, 0]], "#1b365b");
  polygon(ctx, [[-42, 0], [-62, 18], [-56, 0]], "#2d5a83");
  ctx.fillStyle = "#dcecff"; ctx.fillRect(33, -3, 3, 3); ctx.restore();
}

function resize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function staticStudy(canvas, kind) {
  const paint = () => {
    const { ctx, width, height } = resize(canvas);
    waterField(ctx, width, height);
    if (kind === "basic-fish") {
      drawFish(ctx, width * 0.28, height * 0.36, -0.18, 2.2);
      drawFish(ctx, width * 0.62, height * 0.66, 0.12, 1.2, "wedge", 0.8);
    } else if (kind === "fish-forms") {
      drawFish(ctx, width * 0.24, height * 0.33, -0.25, 1.35, "needle");
      drawFish(ctx, width * 0.66, height * 0.36, 0.12, 1.3, "disk");
      drawFish(ctx, width * 0.46, height * 0.72, -0.08, 1.35, "heavy");
    } else if (kind === "snails") {
      drawSnail(ctx, width * 0.26, height * 0.62, 1.3, 0);
      drawSnail(ctx, width * 0.58, height * 0.45, 1, 1, -1);
      drawSnail(ctx, width * 0.79, height * 0.73, 0.84, 2);
    } else if (kind === "tidepool") {
      drawFish(ctx, width * 0.33, height * 0.28, -0.12, 1.25, "disk");
      drawFish(ctx, width * 0.68, height * 0.46, 2.8, 0.78, "needle");
      drawSnail(ctx, width * 0.28, height * 0.78, 0.75, 2);
      drawSnail(ctx, width * 0.75, height * 0.79, 0.67, 0, -1);
    } else if (kind === "whale") {
      drawWhale(ctx, width * 0.5, height * 0.52, Math.min(width / 190, height / 92));
    } else if (kind === "manta") {
      drawManta(ctx, width * 0.5, height * 0.49, Math.min(width / 160, height / 100));
    } else if (kind === "shark") {
      drawShark(ctx, width * 0.48, height * 0.52, Math.min(width / 180, height / 92));
    }
  };
  paint();
  window.addEventListener("resize", paint);
}

function schoolStudy(canvas) {
  let frame;
  let last = 0;
  let state = resize(canvas);
  const boids = Array.from({ length: 52 }, (_, index) => ({ x: Math.random() * state.width, y: Math.random() * state.height, vx: Math.random() * 0.7 + 0.25, vy: (Math.random() - 0.5) * 1.2, lane: index % 2 ? -1 : 1, phase: Math.random() * Math.PI * 2 }));
  function tick(time) {
    const dt = Math.min((time - last) / 16.67 || 1, 2);
    last = time;
    const { ctx, width, height } = state;
    waterField(ctx, width, height);
    const splitPhase = 0.5 - Math.cos(time * 0.00048) * 0.5;
    const split = splitPhase * splitPhase * (3 - 2 * splitPhase);
    const streamX = width * 0.52 + Math.sin(time * 0.00018) * width * 0.13;
    const streamY = height * 0.5 + Math.cos(time * 0.00023) * height * 0.08;
    boids.forEach((boid) => {
      let close = 0; let alignX = 0; let alignY = 0; let centerX = 0; let centerY = 0; let avoidX = 0; let avoidY = 0;
      boids.forEach((other) => {
        if (boid === other) return;
        const dx = other.x - boid.x; const dy = other.y - boid.y; const distance = Math.hypot(dx, dy);
        if (distance > 92) return;
        close += 1; alignX += other.vx; alignY += other.vy; centerX += other.x; centerY += other.y;
        if (distance < 26 && distance > 0.1) { avoidX -= dx / distance; avoidY -= dy / distance; }
      });
      if (close) {
        boid.vx += ((alignX / close - boid.vx) * 0.045 + (centerX / close - boid.x) * 0.0018 + avoidX * 0.09) * dt;
        boid.vy += ((alignY / close - boid.vy) * 0.045 + (centerY / close - boid.y) * 0.0018 + avoidY * 0.09) * dt;
      }
      const laneY = streamY + boid.lane * split * height * 0.19 + Math.sin(time * 0.0011 + boid.phase) * 8;
      boid.vx += ((streamX - boid.x) * 0.00042 + 0.012 + Math.cos(time * 0.0007 + boid.phase) * 0.006) * dt;
      boid.vy += (laneY - boid.y) * 0.00055 * dt;
      if (boid.x < 24) boid.vx += 0.08; if (boid.x > width - 24) boid.vx -= 0.08;
      if (boid.y < 24) boid.vy += 0.08; if (boid.y > height - 24) boid.vy -= 0.08;
      const speed = Math.hypot(boid.vx, boid.vy); const cap = 1.55;
      if (speed > cap) { boid.vx = boid.vx / speed * cap; boid.vy = boid.vy / speed * cap; }
      boid.x += boid.vx * dt; boid.y += boid.vy * dt;
      drawFish(ctx, boid.x, boid.y, Math.atan2(boid.vy, boid.vx), 0.27 + (boid.y / height) * 0.14, "wedge", 0.8);
    });
    if (!reducedMotion.matches) frame = requestAnimationFrame(tick);
  }
  tick(0);
  window.addEventListener("resize", () => { state = resize(canvas); });
  return () => cancelAnimationFrame(frame);
}

function crawlStudy(canvas) {
  let state = resize(canvas);
  let frame;
  function tick(time) {
    const { ctx, width, height } = state;
    waterField(ctx, width, height);
    drawSnail(ctx, 48 + (time * 0.014 % (width + 70)), height * 0.63, 1.05, 0);
    drawSnail(ctx, width - 34 - (time * 0.009 % (width + 70)), height * 0.4, 0.78, 2, -1);
    if (!reducedMotion.matches) frame = requestAnimationFrame(tick);
  }
  tick(0);
  window.addEventListener("resize", () => { state = resize(canvas); });
  return () => cancelAnimationFrame(frame);
}

document.querySelectorAll("[data-life-study]").forEach((canvas) => {
  const kind = canvas.dataset.lifeStudy;
  if (kind === "school") schoolStudy(canvas);
  else if (kind === "crawl") crawlStudy(canvas);
  else staticStudy(canvas, kind);
});
