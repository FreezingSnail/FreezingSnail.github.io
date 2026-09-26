import { UNDERWATER_SCENES, startUnderwaterScene } from "./underwater-scenes.js";

const SCENE_DURATION = 18000;
const sceneNames = {
  thicket: "Ribbon thicket", grove: "Giant kelp grove", canopy: "Canopy passage", clearing: "Forest clearing",
  wall: "Kelp wall", aisle: "Stipe aisle", tangle: "Ribbon tangle", deep: "Deep grove",
  "bulb-bed": "Bulb kelp bed", "feather-meadow": "Feather meadow", "fan-reef": "Fan reef", mosaic: "Species mosaic",
  "tower-grove": "Tower grove", "palm-canopy": "Palm canopy", "giant-wall": "Giant wall", "open-forest": "Open forest",
};

function startKelpDemo() {
  const canvas = document.createElement("canvas");
  canvas.className = "kelp-background";
  document.body.prepend(canvas);

  const selector = document.querySelector("[data-demo-scene-select]");
  let active = Math.floor(Math.random() * UNDERWATER_SCENES.length);
  let nextChange = performance.now() + SCENE_DURATION;
  const showSceneName = (scene) => {
    selector && (selector.value = scene);
    document.querySelector("[data-demo-scene-name]")?.replaceChildren(`${sceneNames[scene]} · random rotation every 18s`);
  };
  const renderer = startUnderwaterScene(canvas, UNDERWATER_SCENES[active], showSceneName, { worldExtent: 3.8, lifeScale: 1, boidDensity: 1.55, animalScale: 0.36, grounded: false });
  document.documentElement.classList.add("has-webgl-kelp");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame;

  function chooseScene() {
    let next = Math.floor(Math.random() * UNDERWATER_SCENES.length);
    if (UNDERWATER_SCENES.length > 1 && next === active) next = (next + 1 + Math.floor(Math.random() * (UNDERWATER_SCENES.length - 1))) % UNDERWATER_SCENES.length;
    return next;
  }

  function setScene(index, time = performance.now()) {
    active = index;
    renderer.setScene(UNDERWATER_SCENES[active]);
    nextChange = time + SCENE_DURATION;
  }

  selector?.addEventListener("change", () => {
    const index = UNDERWATER_SCENES.indexOf(selector.value);
    if (index >= 0) setScene(index);
  });

  document.querySelector("[data-scene-rotate]")?.addEventListener("click", () => {
    setScene(chooseScene());
  });

  function tick(time) {
    frame = undefined;
    if (time >= nextChange) setScene(chooseScene(), time);
    if (!reducedMotion.matches && document.visibilityState === "visible") frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (!reducedMotion.matches && document.visibilityState === "visible" && !frame) frame = requestAnimationFrame(tick);
  }

  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener("change", schedule);
  schedule();
}

if (document.querySelector("[data-kelp-demo]")) startKelpDemo();
