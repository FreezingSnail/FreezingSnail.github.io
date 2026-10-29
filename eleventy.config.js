import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import games from "./src/_data/games.js";

// GitHub release assets do not send CORS headers, so the player cannot fetch
// them from the browser. Mirror them beside the site at build time instead.
const mirroredGames = new Map();

async function mirrorGameFiles(outputDir) {
  const target = path.join(outputDir, "games", "files");
  await mkdir(target, { recursive: true });
  await Promise.all(
    games.map(async (game) => {
      if (!mirroredGames.has(game.file.url)) {
        const response = await fetch(game.file.url, { redirect: "follow" });
        if (!response.ok) {
          throw new Error(`Failed to mirror ${game.title}: HTTP ${response.status} ${game.file.url}`);
        }
        mirroredGames.set(game.file.url, Buffer.from(await response.arrayBuffer()));
      }
      await writeFile(path.join(target, game.file.name), mirroredGames.get(game.file.url));
    }),
  );
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight, {
    preAttributes: { tabindex: 0 },
  });
  eleventyConfig.addFilter("dateEDT", (value) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(value),
  );

  eleventyConfig.addGlobalData("site", {
    name: "wobpager",
    url: "https://freezingsnail.github.io/",
    description: "A static blog built with Eleventy.",
  });
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy({
    "src/play/ardens/ArdensPlayer.js": "play/ardens/ArdensPlayer.js",
    "src/play/ardens/ArdensPlayer.wasm": "play/ardens/ArdensPlayer.wasm",
    "src/play/ardens/LICENSE.txt": "play/ardens/LICENSE.txt",
    "node_modules/three/build": "js/vendor",
  });
  eleventyConfig.on("eleventy.after", async ({ directories }) => {
    await mirrorGameFiles(path.resolve(directories.output));
  });
  eleventyConfig.addCollection("posts", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
    pathPrefix: "/",
  };
}
