import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

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
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy({
    "node_modules/three/build": "js/vendor",
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
